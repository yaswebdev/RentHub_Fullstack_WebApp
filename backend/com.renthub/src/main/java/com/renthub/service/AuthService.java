package com.renthub.service;

import com.renthub.dto.AuthResponse;
import com.renthub.dto.LoginRequest;
import com.renthub.dto.RegisterRequest;
import com.renthub.dto.UserDTO;
import com.renthub.entity.Role;
import com.renthub.entity.User;
import com.renthub.exception.BusinessRuleException;
import com.renthub.exception.DuplicateResourceException;
import com.renthub.exception.ResourceNotFoundException;
import com.renthub.repository.UserRepository;
import com.renthub.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String normalizedEmail = req.getEmail().toLowerCase().trim();
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new DuplicateResourceException("Cet email est déjà utilisé");
        }

        String roleStr = (req.getRole() != null) ? req.getRole().toUpperCase() : "LOCATAIRE";
        Role role;
        try {
            role = Role.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException("Rôle invalide. Les rôles autorisés sont : LOCATAIRE, HOTE");
        }
        if (role == Role.ADMIN) {
            throw new BusinessRuleException("Rôle invalide. Les rôles autorisés sont : LOCATAIRE, HOTE");
        }

        User user = new User();
        user.setNom(req.getNom());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(role);

        User savedUser = userRepository.save(user);

        String token = jwtUtils.generateToken(savedUser.getEmail());
        return new AuthResponse(token, toDTO(savedUser));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        String normalizedEmail = req.getEmail().toLowerCase().trim();
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(normalizedEmail, req.getPassword())
        );

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        String token = jwtUtils.generateToken(user.getEmail());
        return new AuthResponse(token, toDTO(user));
    }

    private UserDTO toDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setNom(user.getNom());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        dto.setPhotoUrl(user.getPhotoUrl());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}