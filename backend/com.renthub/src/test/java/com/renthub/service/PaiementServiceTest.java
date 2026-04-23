package com.renthub.service;

import com.renthub.entity.Paiement;
import com.renthub.repository.PaiementRepository;
import com.renthub.repository.ReservationRepository;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaiementServiceTest {

    @Mock
    private PaiementRepository paiementRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Test
    void handleWebhookShouldBeIdempotentForDuplicateEventId() {
        PaiementService paiementService = new PaiementService(paiementRepository, reservationRepository);
        ReflectionTestUtils.setField(paiementService, "stripeSecretKey", "sk_test_fake");
        ReflectionTestUtils.setField(paiementService, "stripeWebhookSecret", "whsec_fake");

        Event event = mock(Event.class);
        EventDataObjectDeserializer deserializer = mock(EventDataObjectDeserializer.class);
        PaymentIntent intent = mock(PaymentIntent.class);

        Paiement paiement = new Paiement();
        paiement.setStripePaymentIntentId("pi_123");
        paiement.setStatut("EN_ATTENTE");

        when(event.getId()).thenReturn("evt_dup_1");
        when(event.getType()).thenReturn("payment_intent.succeeded");
        when(event.getDataObjectDeserializer()).thenReturn(deserializer);
        when(deserializer.getObject()).thenReturn(Optional.of(intent));
        when(intent.getId()).thenReturn("pi_123");
        when(intent.getStatus()).thenReturn("succeeded");

        when(paiementRepository.findByStripePaymentIntentId("pi_123")).thenReturn(Optional.of(paiement));
        when(paiementRepository.save(any(Paiement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent("payload", "sig", "whsec_fake")).thenReturn(event);

            Map<String, Object> first = paiementService.handleWebhook("sig", "payload");
            assertEquals(true, first.get("received"));
            assertEquals("payment_intent.succeeded", first.get("type"));
            assertEquals("PAYE", paiement.getStatut());
            assertEquals("evt_dup_1", paiement.getLastStripeEventId());

            Map<String, Object> second = paiementService.handleWebhook("sig", "payload");
            assertEquals(true, second.get("received"));
            assertEquals("payment_intent.succeeded", second.get("type"));
            // Idempotency: second call still succeeds but doesn't trigger another save
        }

        verify(paiementRepository, times(1)).save(any(Paiement.class));
    }
}
