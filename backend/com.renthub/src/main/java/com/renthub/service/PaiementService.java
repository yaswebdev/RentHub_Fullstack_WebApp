package com.renthub.service;

import com.renthub.dto.PaymentIntentResponse;
import com.renthub.dto.CheckoutSessionResponse;
import com.renthub.entity.Paiement;
import com.renthub.entity.Reservation;
import com.renthub.entity.Role;
import com.renthub.entity.User;
import com.renthub.exception.BusinessRuleException;
import com.renthub.exception.ResourceNotFoundException;
import com.renthub.repository.PaiementRepository;
import com.renthub.repository.ReservationRepository;
import com.renthub.repository.UserRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.PaymentIntentConfirmParams;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PaiementService {

    private static final String STRIPE_CURRENCY = "mad";

    private final PaiementRepository paiementRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;

    @Value("${stripe.secret.key:}")
    private String stripeSecretKey;

    @Value("${stripe.webhook.secret:}")
    private String stripeWebhookSecret;

    /** Statuses that mean a refund is already in progress or completed */
    private static final Set<String> REFUND_STATUSES = Set.of("REFUND_PENDING", "REFUNDED", "REFUND_FAILED");

    // ─── Payment Intent ──────────────────────────────────────────

    @Transactional
    public PaymentIntentResponse createPaymentIntent(Integer reservationId) throws StripeException {
        initStripe();

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation introuvable"));

        if (reservation.getMontant() == null) {
            throw new BusinessRuleException("Impossible de calculer le montant de la réservation");
        }

        Paiement existing = paiementRepository.findByReservationId(reservationId).orElse(null);
        if (existing != null && "PAYE".equalsIgnoreCase(existing.getStatut())) {
            throw new BusinessRuleException("Cette réservation est déjà payée");
        }

        if (existing != null && existing.getStripePaymentIntentId() != null) {
            PaymentIntent existingIntent = PaymentIntent.retrieve(existing.getStripePaymentIntentId());
            syncStatusFromStripe(existing, existingIntent.getStatus());
            paiementRepository.save(existing);
            return new PaymentIntentResponse(
                    existingIntent.getId(),
                    existingIntent.getClientSecret(),
                    existing.getStatut()
            );
        }

        long amountInCents = toCents(reservation.getMontant());

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
            .setCurrency(STRIPE_CURRENCY)
                .putMetadata("reservationId", String.valueOf(reservationId))
                .build();

        PaymentIntent intent = PaymentIntent.create(params);

        Paiement paiement = Paiement.builder()
                .reservation(reservation)
                .montant(reservation.getMontant().doubleValue())
                .statut("EN_ATTENTE")
                .stripePaymentIntentId(intent.getId())
                .createdAt(LocalDateTime.now())
                .build();
        paiementRepository.save(paiement);

        return new PaymentIntentResponse(intent.getId(), intent.getClientSecret(), paiement.getStatut());
    }

    @Transactional
    public PaymentIntentResponse confirmPaymentIntent(String paymentIntentId, String paymentMethodId) throws StripeException {
        initStripe();

        Paiement paiement = paiementRepository.findByStripePaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement introuvable pour ce PaymentIntent"));

        PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
        String currentStatus = intent.getStatus();

        if ("requires_payment_method".equals(currentStatus)) {
            if (paymentMethodId == null || paymentMethodId.isBlank()) {
                throw new BusinessRuleException("paymentMethodId est obligatoire");
            }
            intent = intent.confirm(
                    PaymentIntentConfirmParams.builder()
                            .setPaymentMethod(paymentMethodId)
                            .build()
            );
        } else if ("requires_confirmation".equals(currentStatus)) {
            PaymentIntentConfirmParams.Builder paramsBuilder = PaymentIntentConfirmParams.builder();
            if (paymentMethodId != null && !paymentMethodId.isBlank()) {
                paramsBuilder.setPaymentMethod(paymentMethodId);
            }
            intent = intent.confirm(paramsBuilder.build());
        }

        syncStatusFromStripe(paiement, intent.getStatus());
        paiementRepository.save(paiement);

        return new PaymentIntentResponse(intent.getId(), intent.getClientSecret(), paiement.getStatut());
    }

        public CheckoutSessionResponse createCheckoutSession(
            Integer reservationId,
            String successUrl,
            String cancelUrl,
            String userEmail
        ) throws StripeException {
        initStripe();

        Reservation reservation = reservationRepository.findById(reservationId)
            .orElseThrow(() -> new ResourceNotFoundException("Reservation introuvable"));

        if (userEmail == null || userEmail.isBlank()) {
            throw new AccessDeniedException("Utilisateur non authentifié");
        }

        User currentUser = userRepository.findByEmailIgnoreCase(userEmail.trim())
            .orElseThrow(() -> new AccessDeniedException("Utilisateur introuvable"));

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isReservationOwner = reservation.getLocataire() != null
            && reservation.getLocataire().getId() != null
            && reservation.getLocataire().getId().equals(currentUser.getId());

        if (!isReservationOwner && !isAdmin) {
            throw new AccessDeniedException("Non autorisé à payer cette réservation");
        }

        if ("ANNULEE".equalsIgnoreCase(reservation.getStatut()) || "REFUSEE".equalsIgnoreCase(reservation.getStatut())) {
            throw new BusinessRuleException("Impossible de payer une réservation annulée ou refusée");
        }

        Paiement existing = paiementRepository.findByReservationId(reservationId).orElse(null);
        if (existing != null && "PAYE".equalsIgnoreCase(existing.getStatut())) {
            throw new BusinessRuleException("Cette réservation est déjà payée");
        }

        long amountInCents = toCents(reservation.getMontant());
        String listingTitle = reservation.getAnnonce() != null ? reservation.getAnnonce().getTitre() : "Réservation RentHub";

        SessionCreateParams params = SessionCreateParams.builder()
            .setMode(SessionCreateParams.Mode.PAYMENT)
            .setSuccessUrl(successUrl)
            .setCancelUrl(cancelUrl)
            .putMetadata("reservationId", String.valueOf(reservationId))
            .setPaymentIntentData(
                SessionCreateParams.PaymentIntentData.builder()
                    .putMetadata("reservationId", String.valueOf(reservationId))
                    .build()
            )
            .addLineItem(
                SessionCreateParams.LineItem.builder()
                    .setQuantity(1L)
                    .setPriceData(
                        SessionCreateParams.LineItem.PriceData.builder()
                            .setCurrency(STRIPE_CURRENCY)
                            .setUnitAmount(amountInCents)
                            .setProductData(
                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                    .setName("Réservation - " + listingTitle)
                                    .build()
                            )
                            .build()
                    )
                    .build()
            )
            .build();

        Session session = Session.create(params);
        return new CheckoutSessionResponse(session.getId(), session.getUrl());
        }

    @Transactional
    public Map<String, Object> syncCheckoutSession(String sessionId, String userEmail) throws StripeException {
        initStripe();

        if (sessionId == null || sessionId.isBlank()) {
            throw new BusinessRuleException("sessionId est obligatoire");
        }

        if (userEmail == null || userEmail.isBlank()) {
            throw new AccessDeniedException("Utilisateur non authentifié");
        }

        User currentUser = userRepository.findByEmailIgnoreCase(userEmail.trim())
            .orElseThrow(() -> new AccessDeniedException("Utilisateur introuvable"));

        Session session = Session.retrieve(sessionId);
        String reservationIdRaw = session.getMetadata() != null ? session.getMetadata().get("reservationId") : null;
        if (reservationIdRaw == null || reservationIdRaw.isBlank()) {
            throw new BusinessRuleException("Session Stripe invalide");
        }

        Integer reservationId = Integer.valueOf(reservationIdRaw);
        Reservation reservation = reservationRepository.findById(reservationId)
            .orElseThrow(() -> new ResourceNotFoundException("Reservation introuvable"));

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isReservationOwner = reservation.getLocataire() != null
            && reservation.getLocataire().getId() != null
            && reservation.getLocataire().getId().equals(currentUser.getId());

        if (!isReservationOwner && !isAdmin) {
            throw new AccessDeniedException("Non autorisé à synchroniser cette réservation");
        }

        Paiement paiement = paiementRepository.findByReservationId(reservationId).orElseGet(() -> Paiement.builder()
            .reservation(reservation)
            .montant(reservation.getMontant().doubleValue())
            .statut("EN_ATTENTE")
            .createdAt(LocalDateTime.now())
            .build());

        String paymentIntentId = session.getPaymentIntent();
        if (paymentIntentId != null && !paymentIntentId.isBlank()) {
            paiement.setStripePaymentIntentId(paymentIntentId);
        }

        if ("paid".equalsIgnoreCase(session.getPaymentStatus())) {
            paiement.setStatut("PAYE");
        } else {
            paiement.setStatut("EN_ATTENTE");
        }

        paiementRepository.save(paiement);
        updateReservationStatusFromPayment(paiement);

        return Map.of(
            "sessionId", sessionId,
            "reservationId", reservationId,
            "paymentStatus", session.getPaymentStatus(),
            "reservationStatus", reservation.getStatut()
        );
    }

    // ─── Refund ──────────────────────────────────────────────────

    /**
     * Create a Stripe refund for a paid reservation.
     * Idempotent: if a refund already exists, returns without creating a duplicate.
     */
    @Transactional
    public Paiement createRefund(Integer reservationId) throws StripeException {
        Paiement paiement = paiementRepository.findByReservationId(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Aucun paiement trouvé pour la réservation ID : " + reservationId));

        // Idempotency: already refunded or in progress
        if (REFUND_STATUSES.contains(paiement.getStatut())) {
            return paiement;
        }

        // Can only refund a paid booking
        if (!"PAYE".equals(paiement.getStatut())) {
            throw new BusinessRuleException("Impossible de rembourser un paiement qui n'est pas au statut PAYE");
        }

        if (paiement.getStripePaymentIntentId() == null) {
            throw new BusinessRuleException("Pas de PaymentIntent Stripe associé à ce paiement");
        }

        // Only init Stripe when we actually need to call the API
        initStripe();

        // Set to pending before calling Stripe (crash safety)
        paiement.setStatut("REFUND_PENDING");
        paiementRepository.save(paiement);

        try {
            RefundCreateParams refundParams = RefundCreateParams.builder()
                    .setPaymentIntent(paiement.getStripePaymentIntentId())
                    .build();

            Refund refund = Refund.create(refundParams);
            paiement.setStripeRefundId(refund.getId());

            if ("succeeded".equals(refund.getStatus())) {
                paiement.setStatut("REFUNDED");
            } else if ("failed".equals(refund.getStatus())) {
                paiement.setStatut("REFUND_FAILED");
            }
            // else stays REFUND_PENDING (Stripe processes async)

        } catch (StripeException e) {
            paiement.setStatut("REFUND_FAILED");
            paiementRepository.save(paiement);
            throw e;
        }

        return paiementRepository.save(paiement);
    }

    // ─── Webhook ─────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> handleWebhook(String signature, String payload) {
        initStripe();

        if (stripeWebhookSecret == null || stripeWebhookSecret.isBlank()) {
            throw new RuntimeException("Stripe webhook secret non configuré");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, signature, stripeWebhookSecret);
        } catch (SignatureVerificationException e) {
            throw new RuntimeException("Signature webhook invalide");
        }

        String eventType = event.getType();

        // Handle checkout.session.completed events
        if ("checkout.session.completed".equals(eventType)) {
            Session session = (Session) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new RuntimeException("Impossible de parser Checkout Session"));

            String reservationIdRaw = session.getMetadata() != null ? session.getMetadata().get("reservationId") : null;
            String paymentIntentId = session.getPaymentIntent();
            if (reservationIdRaw != null && paymentIntentId != null) {
            Integer reservationId = Integer.valueOf(reservationIdRaw);
            Paiement paiement = paiementRepository.findByReservationId(reservationId)
                .orElseGet(() -> {
                    Reservation res = reservationRepository.findById(reservationId)
                        .orElseThrow(() -> new ResourceNotFoundException("Reservation introuvable"));
                    return Paiement.builder()
                        .reservation(res)
                        .montant(res.getMontant().doubleValue())
                        .statut("EN_ATTENTE")
                        .createdAt(LocalDateTime.now())
                        .build();
                });

            paiement.setStripePaymentIntentId(paymentIntentId);
            paiement.setStatut("PAYE");
            paiement.setLastStripeEventId(event.getId());
            paiementRepository.save(paiement);
            updateReservationStatusFromPayment(paiement);
            }
        }

        // Handle payment_intent events
        if (eventType != null && eventType.startsWith("payment_intent.")) {
            PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new RuntimeException("Impossible de parser PaymentIntent"));

            Paiement paiement = paiementRepository.findByStripePaymentIntentId(intent.getId())
                .orElseGet(() -> {
                String reservationIdRaw = intent.getMetadata() != null ? intent.getMetadata().get("reservationId") : null;
                if (reservationIdRaw == null) return null;
                Integer reservationId = Integer.valueOf(reservationIdRaw);
                return paiementRepository.findByReservationId(reservationId)
                    .orElseGet(() -> {
                        Reservation res = reservationRepository.findById(reservationId)
                            .orElseThrow(() -> new ResourceNotFoundException("Reservation introuvable"));
                        return Paiement.builder()
                            .reservation(res)
                            .montant(res.getMontant().doubleValue())
                            .statut("EN_ATTENTE")
                            .createdAt(LocalDateTime.now())
                            .build();
                    });
                });

            if (paiement != null && !event.getId().equals(paiement.getLastStripeEventId())) {
            paiement.setStripePaymentIntentId(intent.getId());
            syncStatusFromStripe(paiement, intent.getStatus());
            paiement.setLastStripeEventId(event.getId());
            paiementRepository.save(paiement);
            updateReservationStatusFromPayment(paiement);
            }
        }

        // Handle charge.refunded events
        if ("charge.refunded".equals(eventType) || "charge.refund.updated".equals(eventType)) {
            try {
                com.stripe.model.Charge charge = (com.stripe.model.Charge) event.getDataObjectDeserializer()
                        .getObject()
                        .orElse(null);
                if (charge != null && charge.getPaymentIntent() != null) {
                    paiementRepository.findByStripePaymentIntentId(charge.getPaymentIntent()).ifPresent(paiement -> {
                        if (!event.getId().equals(paiement.getLastStripeEventId())) {
                            if (charge.getRefunded()) {
                                paiement.setStatut("REFUNDED");
                            }
                            paiement.setLastStripeEventId(event.getId());
                            paiementRepository.save(paiement);
                        }
                    });
                }
            } catch (ClassCastException ignored) {
                // Not a charge object, skip
            }
        }

        return Map.of("received", true, "type", eventType);
    }

    private void updateReservationStatusFromPayment(Paiement paiement) {
        if (paiement.getReservation() == null) return;
        Reservation reservation = paiement.getReservation();
        if ("PAYE".equalsIgnoreCase(paiement.getStatut())) {
            reservation.setStatut("PAYEE");
            reservationRepository.save(reservation);
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────

    private void initStripe() {
        if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
            throw new RuntimeException("Stripe secret key non configurée");
        }
        Stripe.apiKey = stripeSecretKey;
    }

    private void syncStatusFromStripe(Paiement paiement, String stripeStatus) {
        // Don't overwrite refund states with payment states
        if (REFUND_STATUSES.contains(paiement.getStatut())) {
            return;
        }

        if (stripeStatus == null || stripeStatus.isBlank()) {
            paiement.setStatut("EN_ATTENTE");
            return;
        }

        switch (stripeStatus) {
            case "succeeded":
                paiement.setStatut("PAYE");
                break;
            case "canceled":
            case "payment_failed":
            case "requires_payment_method":
                paiement.setStatut("ECHEC");
                break;
            case "requires_confirmation":
            case "processing":
            case "requires_action":
            case "requires_capture":
            default:
                paiement.setStatut("EN_ATTENTE");
                break;
        }
    }

    private long toCents(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Montant de réservation invalide");
        }
        return amount.movePointRight(2).longValue();
    }
}
