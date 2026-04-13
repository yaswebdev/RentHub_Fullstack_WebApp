package com.renthub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PaymentIntentResponse {
    private String paymentIntentId;
    private String clientSecret;
    private String status;
}
