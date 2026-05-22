package com.renthub.controller;

import com.renthub.dto.AuthResponse;
import com.renthub.dto.ForgotPasswordRequest;
import com.renthub.dto.LoginRequest;
import com.renthub.dto.RegisterRequest;
import com.renthub.dto.ResetPasswordRequest;
import com.renthub.dto.UserDTO;
import com.renthub.service.AuthService;
import com.renthub.service.UserService;
import com.renthub.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "E-mail de reinitialisation envoye"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Mot de passe mis a jour"));
    }

    @GetMapping("/profil")
    public ResponseEntity<UserDTO> getProfil(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email);
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setNom(user.getNom());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        dto.setPhotoUrl(user.getPhotoUrl());
        dto.setCreatedAt(user.getCreatedAt());
        return ResponseEntity.ok(dto);
    }
}