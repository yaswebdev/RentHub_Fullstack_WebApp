package com.renthub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.renthub.dto.AnnonceDTO;
import com.renthub.dto.AnnonceRequest;
import com.renthub.service.AnnonceService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AnnonceControllerIntegrationTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private AnnonceService annonceService;

    @InjectMocks
    private AnnonceController annonceController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(annonceController).build();
    }

    @Test
    void createAnnonceShouldReturnCreatedAnnonce() throws Exception {
        AnnonceRequest request = new AnnonceRequest();
        request.setTitre("Loft moderne");
        request.setDescription("Vue mer");
        request.setType("appartement");
        request.setPrixNuit(210.0);
        request.setAdresse("Tanger");

        AnnonceDTO response = new AnnonceDTO();
        response.setId(31);
        response.setTitre("Loft moderne");
        response.setPrixNuit(210.0);
        response.setAdresse("Tanger");
        response.setUserId(4);

        when(annonceService.createAnnonce(any(AnnonceRequest.class), eq("host@example.com"))).thenReturn(response);

        mockMvc.perform(post("/api/annonces")
                        .principal(new UsernamePasswordAuthenticationToken("host@example.com", "N/A"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(31))
                .andExpect(jsonPath("$.titre").value("Loft moderne"));
    }
}
