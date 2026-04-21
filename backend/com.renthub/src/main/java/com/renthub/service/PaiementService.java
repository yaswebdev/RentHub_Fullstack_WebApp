package com.renthub.service;

import com.renthub.dto.PaymentIntentResponse;
import com.renthub.entity.Paiement;
import com.renthub.entity.Reservation;
import com.renthub.repository.PaiementRepository;
import com.renthub.repository.ReservationRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.PaymentIntentConfirmParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaiementService {

    private final PaiementRepository paiementRepository;
    private final ReservationRepository reservationRepository;

    @Value("${stripe.secret.key:}")
    private String stripeSecretKey;

    @Value("${stripe.webhook.secret:}")
    private String stripeWebhookSecret;

    public PaymentIntentResponse createPaymentIntent(Integer reservationId) throws StripeException {
        initStripe();

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation introuvable"));

        if (reservation.getMontant() == null) {
            throw new RuntimeException("Impossible de calculer le montant de la réservation");
        }

        Paiement existing = paiementRepository.findByReservationId(reservationId).orElse(null);
        if (existing != null && "PAYE".equalsIgnoreCase(existing.getStatut())) {
            throw new RuntimeException("Cette réservation est déjà payée");
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
                .orElseThrow(() -> new RuntimeException("Paiement introuvable pour ce PaymentIntent"));

        PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
        String currentStatus = intent.getStatus();

        if ("requires_payment_method".equals(currentStatus)) {
            if (paymentMethodId == null || paymentMethodId.isBlank()) {
                throw new RuntimeException("paymentMethodId est obligatoire quand le paiement nécessite une méthode de paiement");
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
        if (eventType != null && eventType.startsWith("payment_intent.")) {
            PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new RuntimeException("Impossible de parser PaymentIntent"));

            Paiement paiement = paiementRepository.findByStripePaymentIntentId(intent.getId())
                    .orElseThrow(() -> new RuntimeException("Paiement introuvable pour ce PaymentIntent"));

            if (event.getId().equals(paiement.getLastStripeEventId())) {
                return Map.of(
                        "received", true,
                        "type", eventType,
                        "idempotent", true
                );
            }

            syncStatusFromStripe(paiement, intent.getStatus());
            paiement.setLastStripeEventId(event.getId());
            paiementRepository.save(paiement);
        }

        return Map.of("received", true, "type", eventType);
    }

    private void initStripe() {
        if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
            throw new RuntimeException("Stripe secret key non configurée");
        }
        Stripe.apiKey = stripeSecretKey;
    }

    private void syncStatusFromStripe(Paiement paiement, String stripeStatus) {
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
            throw new RuntimeException("Montant de réservation invalide");
        }
        return amount.movePointRight(2).longValue();
    }
}
