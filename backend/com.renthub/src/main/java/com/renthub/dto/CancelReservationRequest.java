package com.renthub.dto;

import lombok.Data;

/**
 * Request body for POST /api/reservations/{id}/cancel.
 * Reason is optional for guests, but hosts/admins can provide one.
 */
@Data
public class CancelReservationRequest {
    private String reason;
}
