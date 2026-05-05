package com.renthub.controller;

import com.renthub.dto.ChangePasswordRequest;
import com.renthub.dto.AuthResponse;
import com.renthub.dto.LoginRequest;
import com.renthub.dto.RegisterRequest;
import com.renthub.dto.UserDTO;
import com.renthub.service.AuthService;
import com.renthub.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(path = "/profile/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserDTO> uploadProfilePhoto(@RequestParam("photo") MultipartFile photo, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.updateProfilePhoto(email, photo));
    }

    @PostMapping("/profile/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        String email = authentication.getName();
        userService.changePassword(email, request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok().build();
    }
}