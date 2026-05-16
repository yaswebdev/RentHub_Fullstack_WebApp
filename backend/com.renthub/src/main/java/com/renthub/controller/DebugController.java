package com.renthub.controller;

import com.renthub.entity.User;
import com.renthub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
@org.springframework.context.annotation.Profile("dev")
public class DebugController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }

        String email = authentication.getName();
        return userRepository.findByEmailIgnoreCase(email)
                .map(user -> ResponseEntity.ok(Map.of(
                        "email", user.getEmail(),
                        "id", user.getId(),
                        "role", user.getRole()
                )))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "user_not_found", "email", email)));
    }
}
