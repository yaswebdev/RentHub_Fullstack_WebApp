package com.renthub.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Response for GET /api/reservations/{id}/refund-status.
 * Gives the frontend everything it needs to show refund state.
 */
@Data
@Builder
public class RefundStatusDTO {
    private Integer reservationId;
    private String reservationStatut;
    private String paiementStatut;
    private String stripeRefundId;
    private Double montantRembourse;
    private String cancellationReason;
}
