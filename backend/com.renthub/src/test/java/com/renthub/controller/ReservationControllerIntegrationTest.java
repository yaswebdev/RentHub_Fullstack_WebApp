package com.renthub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.renthub.dto.CreateReservationRequest;
import com.renthub.dto.ReservationDTO;
import com.renthub.service.ReservationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ReservationControllerIntegrationTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ReservationService reservationService;

    @InjectMocks
    private ReservationController reservationController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reservationController).build();
    }

    @Test
    void createReservationShouldReturnCreatedReservation() throws Exception {
        CreateReservationRequest request = new CreateReservationRequest();
        request.setAnnonceId(10);
        request.setDateDebut(LocalDate.now().plusDays(1));
        request.setDateFin(LocalDate.now().plusDays(3));

        ReservationDTO response = new ReservationDTO();
        response.setId(55);
        response.setAnnonceId(10);
        response.setLocataireId(6);
        response.setStatut("EN_ATTENTE");
        response.setMontant(BigDecimal.valueOf(300));

        when(reservationService.createReservation(any(CreateReservationRequest.class), eq("tenant@example.com")))
                .thenReturn(response);

        String payload = """
            {
              "annonceId": 10,
              "dateDebut": "%s",
              "dateFin": "%s"
            }
            """.formatted(request.getDateDebut(), request.getDateFin());

        mockMvc.perform(post("/api/reservations")
                        .principal(new UsernamePasswordAuthenticationToken("tenant@example.com", "N/A"))
                        .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(55))
                .andExpect(jsonPath("$.statut").value("EN_ATTENTE"));
    }
}
