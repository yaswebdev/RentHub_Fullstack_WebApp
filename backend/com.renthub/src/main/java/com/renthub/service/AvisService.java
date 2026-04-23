package com.renthub.service;

import com.renthub.dto.AvisDTO;
import com.renthub.dto.CreateAvisRequest;
import com.renthub.entity.Avis;
import com.renthub.entity.Reservation;
import com.renthub.entity.User;
import com.renthub.repository.AvisRepository;
import com.renthub.repository.ReservationRepository;
import com.renthub.repository.UserRepository;
import com.renthub.exception.BusinessRuleException;
import com.renthub.exception.DuplicateResourceException;
import com.renthub.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvisService {

    private final AvisRepository avisRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;

    /**
     * Create a review for a completed reservation.
     * Rules:
     *   - Only the tenant (locataire) of the reservation can leave a review
     *   - The reservation must be CONFIRMEE (completed)
     *   - Only one review per reservation
     */
    @Transactional
    public AvisDTO createAvis(CreateAvisRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new ResourceNotFoundException("Réservation non trouvée avec l'ID : " + request.getReservationId()));

        // Only the tenant who made the booking can leave a review
        if (!reservation.getLocataire().getId().equals(user.getId())) {
            throw new AccessDeniedException("Seul le locataire de cette réservation peut laisser un avis");
        }

        // Reservation must be confirmed or completed
        String statut = reservation.getStatut();
        if (!"CONFIRMEE".equals(statut) && !"TERMINEE".equals(statut)) {
            throw new BusinessRuleException("Vous ne pouvez laisser un avis que pour une réservation confirmée ou terminée");
        }

        // One review per reservation
        if (avisRepository.findByReservationId(reservation.getId()).isPresent()) {
            throw new DuplicateResourceException("Un avis a déjà été laissé pour cette réservation");
        }

        Avis avis = Avis.builder()
                .note(request.getNote())
                .commentaire(request.getCommentaire())
                .reservation(reservation)
                .build();

        return toDTO(avisRepository.save(avis));
    }

    /**
     * Get all reviews for a specific annonce.
     */
    @Transactional(readOnly = true)
    public List<AvisDTO> getAvisByAnnonceId(Integer annonceId) {
        return avisRepository.findByReservationAnnonceId(annonceId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a single review by its ID.
     */
    @Transactional(readOnly = true)
    public AvisDTO getAvisById(Integer id) {
        Avis avis = avisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Avis non trouvé avec l'ID : " + id));
        return toDTO(avis);
    }

    /**
     * Get average rating for an annonce.
     */
    @Transactional(readOnly = true)
    public Double getAverageRatingByAnnonceId(Integer annonceId) {
        Double avg = avisRepository.findAverageNoteByAnnonceId(annonceId);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

    /**
     * Get the total number of reviews for an annonce.
     */
    @Transactional(readOnly = true)
    public Long getReviewCountByAnnonceId(Integer annonceId) {
        return avisRepository.countByAnnonceId(annonceId);
    }

    /**
     * Delete a review. Only the author or an admin can delete.
     */
    @Transactional
    public void deleteAvis(Integer id, String userEmail) {
        Avis avis = avisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Avis non trouvé avec l'ID : " + id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        boolean isAuthor = avis.getReservation().getLocataire().getId().equals(user.getId());
        boolean isAdmin = "ADMIN".equals(user.getRole());

        if (!isAuthor && !isAdmin) {
            throw new AccessDeniedException("Non autorisé à supprimer cet avis");
        }

        avisRepository.delete(avis);
    }

    private AvisDTO toDTO(Avis avis) {
        AvisDTO dto = new AvisDTO();
        dto.setId(avis.getId());
        dto.setNote(avis.getNote());
        dto.setCommentaire(avis.getCommentaire());
        dto.setCreatedAt(avis.getCreatedAt());
        dto.setReservationId(avis.getReservation().getId());

        // Flatten annonce info
        dto.setAnnonceId(avis.getReservation().getAnnonce().getId());
        dto.setAnnonceTitre(avis.getReservation().getAnnonce().getTitre());

        // Flatten reviewer info
        dto.setLocataireId(avis.getReservation().getLocataire().getId());
        dto.setLocataireNom(avis.getReservation().getLocataire().getNom());

        return dto;
    }
}
