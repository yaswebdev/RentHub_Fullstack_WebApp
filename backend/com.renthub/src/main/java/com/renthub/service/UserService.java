package com.renthub.service;

import com.renthub.dto.UserDTO;
import com.renthub.entity.User;
import com.renthub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public UserDTO updateProfilePhoto(String email, MultipartFile photo) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (photo == null || photo.isEmpty()) {
            throw new RuntimeException("Fichier photo invalide");
        }

        try {
            Path dir = Path.of(uploadDir).toAbsolutePath();
            if (!Files.exists(dir)) Files.createDirectories(dir);

            String original = Path.of(photo.getOriginalFilename()).getFileName().toString();
            String filename = "user-" + user.getId() + "-" + System.currentTimeMillis() + "-" + original;
            Path target = dir.resolve(filename);
            Files.copy(photo.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            // Store complete URL to the download endpoint (so frontend can load it directly)
            String photoUrl = "/api/account/profile/photo/download/" + filename;
            user.setPhotoUrl(photoUrl);
            userRepository.save(user);

            return toDTO(user);
        } catch (IOException e) {
            throw new RuntimeException("Impossible d'enregistrer la photo", e);
        }
    }

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Mot de passe actuel invalide");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
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
