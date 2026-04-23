package com.renthub.service;

import com.renthub.dto.CreateReservationRequest;
import com.renthub.dto.ReservationDTO;
import com.renthub.dto.UpdateReservationStatusRequest;
import com.renthub.entity.Annonce;
import com.renthub.entity.Reservation;
import com.renthub.entity.User;
import com.renthub.repository.AnnonceRepository;
import com.renthub.repository.ReservationRepository;
import com.renthub.repository.UserRepository;
import com.renthub.exception.BusinessRuleException;
import com.renthub.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final AnnonceRepository annonceRepository;
    private final UserRepository userRepository;

    private static final Set<String> VALID_STATUSES = Set.of(
            "EN_ATTENTE", "CONFIRMEE", "REFUSEE", "PAYEE", "ANNULEE", "TERMINEE"
    );

    @Transactional(readOnly = true)
    public List<ReservationDTO> getReservationsByLocataireEmail(String email) {
        User user = findUserByEmail(email);
        return reservationRepository.findByLocataireId(user.getId()).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReservationDTO> getReservationsByHostEmail(String email) {
        User user = findUserByEmail(email);
        return reservationRepository.findByAnnonceUserId(user.getId()).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReservationDTO getReservationById(Integer id, String userEmail) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Réservation non trouvée avec l'ID : " + id));

        User user = findUserByEmail(userEmail);

        boolean isHost = reservation.getAnnonce().getUser().getId().equals(user.getId());
        boolean isLocataire = reservation.getLocataire().getId().equals(user.getId());
        boolean isAdmin = user.getRole().equals("ADMIN");

        if (!isHost && !isLocataire && !isAdmin) {
            throw new AccessDeniedException("Non autorisé à consulter cette réservation");
        }

        return toDTO(reservation);
    }

    @Transactional
    public ReservationDTO createReservation(CreateReservationRequest request, String locataireEmail) {
        if (!request.getDateDebut().isBefore(request.getDateFin())) {
            throw new BusinessRuleException("La date de début doit être avant la date de fin.");
        }

        User locataire = findUserByEmail(locataireEmail);

        // Acquire a write lock on the listing row to serialize competing reservation attempts.
        Annonce annonce = annonceRepository.findByIdForUpdate(request.getAnnonceId())
                .orElseThrow(() -> new ResourceNotFoundException("Annonce non trouvée avec l'ID : " + request.getAnnonceId()));

        if (!annonce.isDisponibilite()) {
            throw new BusinessRuleException("Cette annonce n'est pas disponible.");
        }

        boolean hasOverlap = reservationRepository.existsOverlappingActiveReservation(
                annonce.getId(),
                request.getDateDebut(),
                request.getDateFin()
        );
        if (hasOverlap) {
            throw new BusinessRuleException("Ces dates ne sont plus disponibles pour cette annonce.");
        }

        // Prevent host from booking own listing
        if (annonce.getUser().getId().equals(locataire.getId())) {
            throw new BusinessRuleException("Vous ne pouvez pas réserver votre propre annonce.");
        }

        long nbrNuits = ChronoUnit.DAYS.between(request.getDateDebut(), request.getDateFin());
        nbrNuits = Math.max(1, nbrNuits);

        BigDecimal montant = BigDecimal.valueOf(annonce.getPrixNuit() * nbrNuits);

        Reservation reservation = Reservation.builder()
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .montant(montant)
                .annonce(annonce)
                .locataire(locataire)
                .build();

        return toDTO(reservationRepository.save(reservation));
    }

    @Transactional
    public ReservationDTO updateReservationStatus(Integer id, UpdateReservationStatusRequest request, String userEmail) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Réservation non trouvée avec l'ID : " + id));

        User user = findUserByEmail(userEmail);

        boolean isHost = reservation.getAnnonce().getUser().getId().equals(user.getId());
        boolean isLocataire = reservation.getLocataire().getId().equals(user.getId());
        boolean isAdmin = user.getRole().equals("ADMIN");

        if (!isHost && !isAdmin && !isLocataire) {
            throw new AccessDeniedException("Non autorisé à modifier cette réservation");
        }

        String newStatus = request.getStatut().toUpperCase();

        // Validate status is in allowed set
        if (!VALID_STATUSES.contains(newStatus)) {
            throw new BusinessRuleException("Statut invalide : '" + newStatus + "'. Valeurs acceptées : " + VALID_STATUSES);
        }

        // Tenants can only cancel
        if (isLocataire && !isAdmin && !newStatus.equals("ANNULEE")) {
            throw new BusinessRuleException("Un locataire ne peut qu'annuler une réservation");
        }

        reservation.setStatut(newStatus);
        return toDTO(reservationRepository.save(reservation));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }

    private ReservationDTO toDTO(Reservation reservation) {
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
        return dto;
    }
}
