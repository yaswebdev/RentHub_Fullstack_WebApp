package com.renthub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.renthub.dto.CreatePaymentIntentRequest;
import com.renthub.dto.PaymentIntentResponse;
import com.renthub.service.PaiementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PaiementControllerIntegrationTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private PaiementService paiementService;

    @InjectMocks
    private PaiementController paiementController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(paiementController).build();
    }

    @Test
    void createIntentShouldReturnPaymentIntentResponse() throws Exception {
        CreatePaymentIntentRequest request = new CreatePaymentIntentRequest();
        request.setReservationId(42);

        when(paiementService.createPaymentIntent(42))
                .thenReturn(new PaymentIntentResponse("pi_123", "secret_abc", "EN_ATTENTE"));

        mockMvc.perform(post("/api/paiements/create-intent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentIntentId").value("pi_123"))
                .andExpect(jsonPath("$.status").value("EN_ATTENTE"));
    }

    @Test
    void webhookShouldReturnReceivedTrue() throws Exception {
        when(paiementService.handleWebhook("sig_test", "{}")).thenReturn(java.util.Map.of(
                "received", true,
                "type", "payment_intent.succeeded"
        ));

        mockMvc.perform(post("/api/paiements/webhook")
                        .header("Stripe-Signature", "sig_test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.received").value(true))
                .andExpect(jsonPath("$.type").value("payment_intent.succeeded"));
    }
}
