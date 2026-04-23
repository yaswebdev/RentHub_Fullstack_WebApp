package com.renthub.service;

import com.renthub.dto.PaymentIntentResponse;
import com.renthub.entity.Paiement;
import com.renthub.entity.Reservation;
import com.renthub.exception.BusinessRuleException;
import com.renthub.exception.ResourceNotFoundException;
import com.renthub.repository.PaiementRepository;
import com.renthub.repository.ReservationRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.PaymentIntentConfirmParams;
import com.stripe.param.RefundCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PaiementService {

    private final PaiementRepository paiementRepository;
    private final ReservationRepository reservationRepository;

    @Value("${stripe.secret.key:}")
    private String stripeSecretKey;

    @Value("${stripe.webhook.secret:}")
    private String stripeWebhookSecret;

    /** Statuses that mean a refund is already in progress or completed */
    private static final Set<String> REFUND_STATUSES = Set.of("REFUND_PENDING", "REFUNDED", "REFUND_FAILED");

    // ─── Payment Intent ──────────────────────────────────────────

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
                .setCurrency("eur")
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

    // ─── Refund ──────────────────────────────────────────────────

    /**
     * Create a Stripe refund for a paid reservation.
     * Idempotent: if a refund already exists, returns without creating a duplicate.
     */
    @Transactional
    public Paiement createRefund(Integer reservationId) throws StripeException {
        initStripe();

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

        // Handle payment_intent events
        if (eventType != null && eventType.startsWith("payment_intent.")) {
            PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new RuntimeException("Impossible de parser PaymentIntent"));

            paiementRepository.findByStripePaymentIntentId(intent.getId()).ifPresent(paiement -> {
                if (!event.getId().equals(paiement.getLastStripeEventId())) {
                    syncStatusFromStripe(paiement, intent.getStatus());
                    paiement.setLastStripeEventId(event.getId());
                    paiementRepository.save(paiement);
                }
            });
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
