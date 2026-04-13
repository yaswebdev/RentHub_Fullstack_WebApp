package com.renthub.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConfirmPaymentRequest {

    @NotBlank(message = "paymentIntentId est obligatoire")
    private String paymentIntentId;

    // Optional for some flows, required when Stripe status is requires_payment_method
    private String paymentMethodId;
}
