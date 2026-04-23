package com.renthub.service;

import com.renthub.entity.Paiement;
import com.renthub.entity.Reservation;
import com.renthub.exception.BusinessRuleException;
import com.renthub.exception.ResourceNotFoundException;
import com.renthub.repository.PaiementRepository;
import com.renthub.repository.ReservationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefundServiceTest {

    @Mock private PaiementRepository paiementRepository;
    @Mock private ReservationRepository reservationRepository;

    @InjectMocks
    private PaiementService paiementService;

    private Paiement buildPaiement(String statut, String stripeId) {
        return Paiement.builder()
                .id(1)
                .montant(500.0)
                .statut(statut)
                .stripePaymentIntentId(stripeId)
                .build();
    }

    @Nested
    @DisplayName("Refund Guard Tests")
    class RefundGuardTests {

        @Test
        @DisplayName("Cannot refund a non-existent payment")
        void cannotRefundNonExistentPayment() {
            when(paiementRepository.findByReservationId(999)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> paiementService.createRefund(999));
        }

        @Test
        @DisplayName("Cannot refund an EN_ATTENTE payment")
        void cannotRefundPendingPayment() {
            Paiement paiement = buildPaiement("EN_ATTENTE", "pi_12345");
            when(paiementRepository.findByReservationId(1)).thenReturn(Optional.of(paiement));

            assertThrows(BusinessRuleException.class,
                    () -> paiementService.createRefund(1));
        }

        @Test
        @DisplayName("Cannot refund an ECHEC payment")
        void cannotRefundFailedPayment() {
            Paiement paiement = buildPaiement("ECHEC", "pi_12345");
            when(paiementRepository.findByReservationId(1)).thenReturn(Optional.of(paiement));

            assertThrows(BusinessRuleException.class,
                    () -> paiementService.createRefund(1));
        }

        @Test
        @DisplayName("Duplicate refund call is idempotent (REFUND_PENDING)")
        void duplicateRefundCallIdempotentPending() throws Exception {
            Paiement paiement = buildPaiement("REFUND_PENDING", "pi_12345");
            paiement.setStripeRefundId("re_existing");
            when(paiementRepository.findByReservationId(1)).thenReturn(Optional.of(paiement));

            Paiement result = paiementService.createRefund(1);

            assertEquals("REFUND_PENDING", result.getStatut());
            assertEquals("re_existing", result.getStripeRefundId());
            // Should NOT call save again or touch Stripe
            verify(paiementRepository, never()).save(any());
        }

        @Test
        @DisplayName("Duplicate refund call is idempotent (REFUNDED)")
        void duplicateRefundCallIdempotentRefunded() throws Exception {
            Paiement paiement = buildPaiement("REFUNDED", "pi_12345");
            paiement.setStripeRefundId("re_existing");
            when(paiementRepository.findByReservationId(1)).thenReturn(Optional.of(paiement));

            Paiement result = paiementService.createRefund(1);

            assertEquals("REFUNDED", result.getStatut());
            verify(paiementRepository, never()).save(any());
        }

        @Test
        @DisplayName("Duplicate refund call is idempotent (REFUND_FAILED)")
        void duplicateRefundCallIdempotentFailed() throws Exception {
            Paiement paiement = buildPaiement("REFUND_FAILED", "pi_12345");
            when(paiementRepository.findByReservationId(1)).thenReturn(Optional.of(paiement));

            Paiement result = paiementService.createRefund(1);

            assertEquals("REFUND_FAILED", result.getStatut());
            verify(paiementRepository, never()).save(any());
        }

        @Test
        @DisplayName("Cannot refund without a Stripe PaymentIntent ID")
        void cannotRefundWithoutStripeId() {
            Paiement paiement = buildPaiement("PAYE", null);
            when(paiementRepository.findByReservationId(1)).thenReturn(Optional.of(paiement));

            assertThrows(BusinessRuleException.class,
                    () -> paiementService.createRefund(1));
        }
    }
}
