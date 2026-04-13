package com.renthub.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreatePaymentIntentRequest {

    @NotNull(message = "reservationId est obligatoire")
    private Integer reservationId;
}
