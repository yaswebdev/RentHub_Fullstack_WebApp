package com.renthub.service;

import com.renthub.dto.AdminStatsDTO;
import com.renthub.dto.UserDTO;
import com.renthub.entity.User;
import com.renthub.exception.ResourceNotFoundException;
import com.renthub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final AnnonceRepository annonceRepository;
    private final ReservationRepository reservationRepository;
    private final MessageRepository messageRepository;

    @Transactional(readOnly = true)
    public AdminStatsDTO getStats() {
        long totalUsers = userRepository.count();
        long totalAnnonces = annonceRepository.count();
        long totalReservations = reservationRepository.count();
        long totalMessages = messageRepository.count();

        // Active listings (statut = ACTIVE)
        long activeListings = annonceRepository.findAllWithDetails().stream()
                .filter(a -> "ACTIVE".equals(a.getStatut()))
                .count();

        return AdminStatsDTO.builder()
                .totalUsers(totalUsers)
                .totalAnnonces(totalAnnonces)
                .totalReservations(totalReservations)
                .totalMessages(totalMessages)
                .activeListings(activeListings)
                .totalRevenue(BigDecimal.ZERO) // TODO: sum from paiements table
                .build();
    }

    @Transactional(readOnly = true)
    public Page<UserDTO> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toDTO);
    }

    @Transactional
    public void deleteUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'ID : " + userId));
        userRepository.delete(user);
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
