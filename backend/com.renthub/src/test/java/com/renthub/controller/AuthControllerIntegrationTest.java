package com.renthub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.renthub.dto.AuthResponse;
import com.renthub.dto.LoginRequest;
import com.renthub.dto.RegisterRequest;
import com.renthub.dto.UserDTO;
import com.renthub.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerIntegrationTest {

    private MockMvc mockMvc;

        private final ObjectMapper objectMapper = new ObjectMapper();

        @Mock
    private AuthService authService;

        @InjectMocks
        private AuthController authController;

        @BeforeEach
        void setUp() {
                mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
        }

    @Test
    void registerEndpointShouldReturnTokenAndUser() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setNom("Yassine");
        request.setEmail("yassine@example.com");
        request.setPassword("secret123");
        request.setRole("LOCATAIRE");

        UserDTO user = new UserDTO();
        user.setId(10);
        user.setNom("Yassine");
        user.setEmail("yassine@example.com");
        user.setRole("LOCATAIRE");
        user.setCreatedAt(LocalDateTime.now());

        when(authService.register(any(RegisterRequest.class)))
                .thenReturn(new AuthResponse("register-token", user));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("register-token"))
                .andExpect(jsonPath("$.user.email").value("yassine@example.com"));
    }

    @Test
    void loginEndpointShouldReturnTokenAndUser() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("yassine@example.com");
        request.setPassword("secret123");

        UserDTO user = new UserDTO();
        user.setId(11);
        user.setNom("Yassine");
        user.setEmail("yassine@example.com");
        user.setRole("HOTE");

        when(authService.login(any(LoginRequest.class)))
                .thenReturn(new AuthResponse("login-token", user));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("login-token"))
                .andExpect(jsonPath("$.user.role").value("HOTE"));
    }
}
