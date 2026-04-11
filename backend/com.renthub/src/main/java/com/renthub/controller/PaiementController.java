package com.renthub.controller;

import com.renthub.dto.ConfirmPaymentRequest;
import com.renthub.dto.CreatePaymentIntentRequest;
import com.renthub.dto.PaymentIntentResponse;
import com.renthub.service.PaiementService;
import com.stripe.exception.StripeException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/paiements")
@RequiredArgsConstructor
public class PaiementController {

    private final PaiementService paiementService;

    @PostMapping("/create-intent")
    public ResponseEntity<PaymentIntentResponse> createIntent(
            @Valid @RequestBody CreatePaymentIntentRequest request
    ) throws StripeException {
        return ResponseEntity.ok(paiementService.createPaymentIntent(request.getReservationId()));
    }

    @PostMapping("/confirm")
    public ResponseEntity<PaymentIntentResponse> confirm(
            @Valid @RequestBody ConfirmPaymentRequest request
    ) throws StripeException {
        return ResponseEntity.ok(
            paiementService.confirmPaymentIntent(request.getPaymentIntentId(), request.getPaymentMethodId())
        );
    }

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> webhook(
            @RequestHeader("Stripe-Signature") String signature,
            @RequestBody String payload
    ) {
        return ResponseEntity.ok(paiementService.handleWebhook(signature, payload));
    }
}
