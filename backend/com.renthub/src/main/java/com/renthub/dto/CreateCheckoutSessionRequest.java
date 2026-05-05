package com.renthub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateCheckoutSessionRequest {

    @NotNull(message = "reservationId est obligatoire")
    private Integer reservationId;

    @NotBlank(message = "successUrl est obligatoire")
    private String successUrl;

    @NotBlank(message = "cancelUrl est obligatoire")
    private String cancelUrl;
}
