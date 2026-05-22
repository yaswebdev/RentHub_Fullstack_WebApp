package com.renthub.service;

import com.renthub.dto.AuthResponse;
import com.renthub.dto.LoginRequest;
import com.renthub.dto.RegisterRequest;
import com.renthub.dto.UserDTO;
import com.renthub.entity.PasswordResetToken;
import com.renthub.entity.Role;
import com.renthub.entity.User;
import com.renthub.exception.BusinessRuleException;
import com.renthub.exception.DuplicateResourceException;
import com.renthub.exception.ResourceNotFoundException;
import com.renthub.repository.PasswordResetTokenRepository;
import com.renthub.repository.UserRepository;
import com.renthub.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JavaMailSender mailSender;

    @Value("${app.frontend.url}")
    private String frontendUrl;

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
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, req.getPassword())
            );
        } catch (BadCredentialsException ex) {
            throw new BusinessRuleException("E-mail ou mot de passe incorrect.");
        }

        String token = jwtUtils.generateToken(user.getEmail());
        return new AuthResponse(token, toDTO(user));
    }

    @Transactional
    public void requestPasswordReset(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Adresse e-mail introuvable"));

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();
        passwordResetTokenRepository.save(resetToken);

        String resetLink = frontendUrl + "/reset-password?token=" + resetToken.getToken();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("Reinitialisation du mot de passe RentHub");
        message.setText(
                "Bonjour " + user.getNom() + ",\n\n"
                + "Vous avez demande a reinitialiser votre mot de passe.\n"
                + "Cliquez sur ce lien pour choisir un nouveau mot de passe :\n"
                + resetLink + "\n\n"
                + "Si vous n'avez pas fait cette demande, ignorez cet e-mail.\n"
                + "Ce lien expire dans 30 minutes."
        );

        try {
            mailSender.send(message);
        } catch (RuntimeException ex) {
            throw new BusinessRuleException("Impossible d'envoyer l'e-mail de reinitialisation");
        }
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Token invalide"));

        if (resetToken.getUsedAt() != null) {
            throw new BusinessRuleException("Ce lien a deja ete utilise");
        }
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessRuleException("Ce lien a expire");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(resetToken);
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