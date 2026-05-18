package com.renthub.service;

import com.renthub.dto.AdminStatsDTO;
import com.renthub.dto.AnnonceDTO;
import com.renthub.dto.ReservationDTO;
import com.renthub.dto.UserDTO;
import com.renthub.entity.*;
import com.renthub.exception.ResourceNotFoundException;
import com.renthub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final AnnonceRepository annonceRepository;
    private final ReservationRepository reservationRepository;
    private final MessageRepository messageRepository;
    private final PaiementRepository paiementRepository;

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

        // Pending reservations
        long pendingReservations = reservationRepository.findAll().stream()
                .filter(r -> "EN_ATTENTE".equals(r.getStatut()))
                .count();

        // Role counts
        long totalHosts = userRepository.countByRole(Role.HOTE);
        long totalTenants = userRepository.countByRole(Role.LOCATAIRE);

        // Total revenue from paid payments
        BigDecimal totalRevenue = paiementRepository.findAll().stream()
                .filter(p -> "PAYE".equals(p.getStatut()))
                .map(p -> BigDecimal.valueOf(p.getMontant()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminStatsDTO.builder()
                .totalUsers(totalUsers)
                .totalAnnonces(totalAnnonces)
                .totalReservations(totalReservations)
                .totalMessages(totalMessages)
                .activeListings(activeListings)
                .pendingReservations(pendingReservations)
                .totalHosts(totalHosts)
                .totalTenants(totalTenants)
                .totalRevenue(totalRevenue)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<UserDTO> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toUserDTO);
    }

    @Transactional(readOnly = true)
    public Page<AnnonceDTO> getAllAnnonces(Pageable pageable) {
        return annonceRepository.findAll(pageable).map(this::toAnnonceDTO);
    }

    @Transactional(readOnly = true)
    public Page<ReservationDTO> getAllReservations(Pageable pageable) {
        Page<Reservation> page = reservationRepository.findAll(pageable);

        // Batch-load paiements for performance
        List<Integer> ids = page.getContent().stream().map(Reservation::getId).toList();
        Map<Integer, Paiement> paiementMap = paiementRepository.findByReservationIdIn(ids).stream()
                .collect(Collectors.toMap(p -> p.getReservation().getId(), p -> p, (a, b) -> a));

        return page.map(r -> toReservationDTO(r, paiementMap.get(r.getId())));
    }

    @Transactional
    public void deleteUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'ID : " + userId));
        userRepository.delete(user);
    }

    // ─── Mappers ─────────────────────────────────────────────────

    private UserDTO toUserDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setNom(user.getNom());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        dto.setPhotoUrl(user.getPhotoUrl());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }

    private AnnonceDTO toAnnonceDTO(Annonce annonce) {
        AnnonceDTO dto = new AnnonceDTO();
        dto.setId(annonce.getId());
        dto.setTitre(annonce.getTitre());
        dto.setDescription(annonce.getDescription());
        dto.setType(annonce.getTypeLogement());
        dto.setPrixNuit(annonce.getPrixNuit());
        dto.setAdresse(annonce.getAdresse());
        dto.setDisponibilite(annonce.isDisponibilite());
        dto.setStatut(annonce.getStatut());
        dto.setCreatedAt(annonce.getCreatedAt());
        dto.setMaxGuests(annonce.getMaxGuests());
        dto.setBedrooms(annonce.getBedrooms());
        dto.setBathrooms(annonce.getBathrooms());
        if (annonce.getUser() != null) {
            dto.setUserId(annonce.getUser().getId());
            dto.setUserName(annonce.getUser().getNom());
            dto.setUserPhotoUrl(annonce.getUser().getPhotoUrl());
        }
        if (annonce.getPhotos() != null && !annonce.getPhotos().isEmpty()) {
            dto.setPhotoUrls(annonce.getPhotos().stream()
                    .map(Photo::getPhotoUrl)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    private ReservationDTO toReservationDTO(Reservation reservation, Paiement paiement) {
        ReservationDTO dto = new ReservationDTO();
        dto.setId(reservation.getId());
        dto.setAnnonceId(reservation.getAnnonce().getId());
        dto.setAnnonceTitre(reservation.getAnnonce().getTitre());
        dto.setLocataireId(reservation.getLocataire().getId());
        dto.setLocataireNom(reservation.getLocataire().getNom());
        dto.setDateDebut(reservation.getDateDebut());
        dto.setDateFin(reservation.getDateFin());
        dto.setStatut(reservation.getStatut());
        dto.setMontant(reservation.getMontant());
        dto.setCreatedAt(reservation.getCreatedAt());
        dto.setCancellationReason(reservation.getCancellationReason());
        dto.setPaymentStatus(paiement != null ? paiement.getStatut() : null);
        return dto;
    }
}
