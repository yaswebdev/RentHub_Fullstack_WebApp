package com.renthub.service;

import com.renthub.dto.CreateReservationRequest;
import com.renthub.dto.ReservationDTO;
import com.renthub.dto.UpdateReservationStatusRequest;
import com.renthub.entity.Annonce;
import com.renthub.entity.Reservation;
import com.renthub.entity.User;
import com.renthub.repository.AnnonceRepository;
import com.renthub.repository.PaiementRepository;
import com.renthub.repository.ReservationRepository;
import com.renthub.repository.UserRepository;
import com.renthub.exception.BusinessRuleException;
import com.renthub.exception.ResourceNotFoundException;
import com.renthub.dto.RefundStatusDTO;
import com.renthub.dto.CancelReservationRequest;
import com.renthub.entity.Paiement;
import com.renthub.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final AnnonceRepository annonceRepository;
    private final UserRepository userRepository;
    private final PaiementRepository paiementRepository;
    private final PaiementService paiementService;

    /** Statuses allowed via the generic PATCH endpoint (ANNULEE excluded — use /cancel instead) */
    private static final Set<String> VALID_STATUSES = Set.of(
            "EN_ATTENTE", "CONFIRMEE", "REFUSEE", "PAYEE", "TERMINEE"
    );

    /** Statuses that can be cancelled */
    private static final Set<String> CANCELLABLE_STATUSES = Set.of(
            "EN_ATTENTE", "CONFIRMEE", "PAYEE"
    );

    @Transactional(readOnly = true)
    public List<ReservationDTO> getReservationsByLocataireEmail(String email) {
        User user = findUserByEmail(email);
        List<Reservation> reservations = reservationRepository.findByLocataireId(user.getId());
        return toDTOList(reservations);
    }

    @Transactional(readOnly = true)
    public List<ReservationDTO> getReservationsByHostEmail(String email) {
        User user = findUserByEmail(email);
        List<Reservation> reservations = reservationRepository.findByAnnonceUserId(user.getId());
        return toDTOList(reservations);
    }

    @Transactional(readOnly = true)
    public List<ReservationDTO> getAllReservationsForAdmin() {
        List<Reservation> reservations = reservationRepository.findAll();
        return toDTOList(reservations);
    }

    @Transactional(readOnly = true)
    public ReservationDTO getReservationById(Integer id, String userEmail) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Réservation non trouvée avec l'ID : " + id));

        User user = findUserByEmail(userEmail);

        boolean isHost = reservation.getAnnonce().getUser().getId().equals(user.getId());
        boolean isLocataire = reservation.getLocataire().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

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
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isHost && !isAdmin && !isLocataire) {
            throw new AccessDeniedException("Non autorisé à modifier cette réservation");
        }

        String newStatus = request.getStatut().toUpperCase();

        // Validate status is in allowed set
        if (!VALID_STATUSES.contains(newStatus)) {
            throw new BusinessRuleException("Statut invalide : '" + newStatus + "'. Valeurs acceptées : " + VALID_STATUSES);
        }

        // Tenants can only set ANNULEE via the dedicated cancel endpoint
        if (isLocataire && !isAdmin) {
            throw new BusinessRuleException("Les locataires doivent utiliser l'endpoint d'annulation");
        }

        reservation.setStatut(newStatus);
        return toDTO(reservationRepository.save(reservation));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }

    private ReservationDTO toDTO(Reservation reservation) {
        Paiement paiement = paiementRepository.findByReservationId(reservation.getId()).orElse(null);
        return toDTO(reservation, paiement);
    }

    /** Batch-convert reservations to DTOs (1 query for all paiements instead of N) */
    private List<ReservationDTO> toDTOList(List<Reservation> reservations) {
        if (reservations.isEmpty()) return List.of();
        List<Integer> ids = reservations.stream().map(Reservation::getId).toList();
        Map<Integer, Paiement> paiementMap = paiementRepository.findByReservationIdIn(ids).stream()
                .collect(Collectors.toMap(p -> p.getReservation().getId(), p -> p, (a, b) -> a));
        return reservations.stream()
                .map(r -> toDTO(r, paiementMap.get(r.getId())))
                .collect(Collectors.toList());
    }

    private ReservationDTO toDTO(Reservation reservation, Paiement paiement) {
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

    // ─── Cancellation ────────────────────────────────────────────

    /**
     * Cancel a reservation with full business rules:
     * - Guest: can cancel only before start date, only EN_ATTENTE/CONFIRMEE/PAYEE
     * - Host/Admin: can force-cancel with reason
     * - Auto-refund if the booking was paid
     */
    @Transactional
    public ReservationDTO cancelReservation(Integer id, CancelReservationRequest request, String userEmail) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Réservation non trouvée avec l'ID : " + id));

        User user = findUserByEmail(userEmail);

        boolean isHost = reservation.getAnnonce().getUser().getId().equals(user.getId());
        boolean isLocataire = reservation.getLocataire().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isHost && !isLocataire && !isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("Non autorisé à annuler cette réservation");
        }

        // Block cancellation for already cancelled/completed/refused
        if (!CANCELLABLE_STATUSES.contains(reservation.getStatut())) {
            throw new BusinessRuleException(
                    "Impossible d'annuler une réservation au statut '" + reservation.getStatut() + "'");
        }

        // Guest: can cancel up to and including the start date (blocked only after stay begins)
        if (isLocataire && !isAdmin) {
            LocalDateTime debutSejour = LocalDateTime.of(reservation.getDateDebut(), LocalTime.MIDNIGHT);
            LocalDateTime limiteAnnulation = debutSejour.minusHours(24);
            if (LocalDateTime.now().isAfter(limiteAnnulation)) {
                throw new BusinessRuleException(
                        "Un locataire doit annuler au moins 24 heures avant la date de début du séjour");
            }

            if (request == null || request.getReason() == null || request.getReason().isBlank()) {
                throw new BusinessRuleException("Veuillez fournir un motif d'annulation");
            }
        }

        // Set cancellation reason (hosts/admins can provide one)
        if (request != null && request.getReason() != null && !request.getReason().isBlank()) {
            reservation.setCancellationReason(request.getReason());
        } else if (isLocataire) {
            reservation.setCancellationReason("Annulée par le locataire");
        } else if (isHost) {
            reservation.setCancellationReason("Annulée par l'hôte");
        } else {
            reservation.setCancellationReason("Annulée par l'administrateur");
        }

        // If the booking was paid, trigger Stripe refund
        boolean wasPaid = "PAYEE".equals(reservation.getStatut());
        if (wasPaid) {
            try {
                paiementService.createRefund(reservation.getId());
            } catch (com.stripe.exception.StripeException e) {
                throw new BusinessRuleException("Erreur lors du remboursement Stripe : " + e.getMessage());
            }
        }

        reservation.setStatut("ANNULEE");
        return toDTO(reservationRepository.save(reservation));
    }

    /**
     * Get refund status for a reservation (used by frontend polling).
     */
    @Transactional(readOnly = true)
    public RefundStatusDTO getRefundStatus(Integer id, String userEmail) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Réservation non trouvée avec l'ID : " + id));

        User user = findUserByEmail(userEmail);

        boolean isHost = reservation.getAnnonce().getUser().getId().equals(user.getId());
        boolean isLocataire = reservation.getLocataire().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isHost && !isLocataire && !isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("Non autorisé à consulter cette réservation");
        }

        Paiement paiement = paiementRepository.findByReservationId(id).orElse(null);

        return RefundStatusDTO.builder()
                .reservationId(reservation.getId())
                .reservationStatut(reservation.getStatut())
                .paiementStatut(paiement != null ? paiement.getStatut() : null)
                .stripeRefundId(paiement != null ? paiement.getStripeRefundId() : null)
                .montantRembourse(paiement != null && "REFUNDED".equals(paiement.getStatut())
                        ? paiement.getMontant() : null)
                .cancellationReason(reservation.getCancellationReason())
                .build();
    }
}
