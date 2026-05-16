package com.renthub.service;

import com.renthub.dto.AnnonceDTO;
import com.renthub.dto.AnnonceRequest;
import com.renthub.entity.Annonce;
import com.renthub.entity.User;
import com.renthub.repository.AnnonceRepository;
import com.renthub.repository.AvisRepository;
import com.renthub.repository.ReservationRepository;
import com.renthub.repository.UserRepository;
import com.renthub.exception.ResourceNotFoundException;
import com.renthub.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnonceService {

    private final AnnonceRepository annonceRepository;
    private final AvisRepository avisRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;

    @Transactional(readOnly = true)
    public List<AnnonceDTO> getAllAnnonces() {
        // Pre-load ALL rating stats in 1 query instead of 2N queries
        Map<Integer, double[]> ratingMap = buildRatingMap();
        return annonceRepository.findAllWithDetails().stream()
                .map(a -> toDTO(a, ratingMap))
                .collect(Collectors.toList());
    }

    /**
     * Paginated version — use ?page=0&size=12&sort=createdAt,desc
     */
    @Transactional(readOnly = true)
    public Page<AnnonceDTO> getAllAnnonces(Pageable pageable) {
        Map<Integer, double[]> ratingMap = buildRatingMap();
        return annonceRepository.findAll(pageable)
                .map(a -> toDTO(a, ratingMap));
    }

    @Transactional(readOnly = true)
    public AnnonceDTO getAnnonceById(Integer id) {
        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Annonce non trouvée avec l'ID : " + id));
        return toDTO(annonce);
    }

    @Transactional(readOnly = true)
    public List<AnnonceDTO> getAnnoncesByHost(Integer hostId) {
        return annonceRepository.findByUserId(hostId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AnnonceDTO> getAnnoncesByHostEmail(String email) {
        User host = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Hôte non trouvé"));
        return annonceRepository.findByUserId(host.getId()).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AnnonceDTO> searchAnnonces(String address) {
        return annonceRepository.findByAdresseContainingIgnoreCase(address).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Advanced search with optional filters: type, price range, guests, address, date availability.
     */
    @Transactional(readOnly = true)
    public List<AnnonceDTO> searchWithFilters(
            String type, Double prixMin, Double prixMax,
            Integer maxGuests, String adresse,
            LocalDate dateDebut, LocalDate dateFin) {
        Map<Integer, double[]> ratingMap = buildRatingMap();
        return annonceRepository.searchWithFilters(type, prixMin, prixMax, maxGuests, adresse, dateDebut, dateFin)
                .stream()
                .map(a -> toDTO(a, ratingMap))
                .collect(Collectors.toList());
    }

    /**
     * Get booked date ranges for a listing (availability API).
     */
    @Transactional(readOnly = true)
    public List<Map<String, LocalDate>> getAvailability(Integer annonceId) {
        // Verify annonce exists
        annonceRepository.findById(annonceId)
                .orElseThrow(() -> new ResourceNotFoundException("Annonce non trouvée avec l'ID : " + annonceId));

        return reservationRepository.findBookedDatesByAnnonceId(annonceId).stream()
                .map(row -> Map.of(
                        "dateDebut", (LocalDate) row[0],
                        "dateFin", (LocalDate) row[1]
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public AnnonceDTO createAnnonce(AnnonceRequest request, String hostEmail) {
        User host = userRepository.findByEmail(hostEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Hôte non trouvé"));

        Annonce annonce = Annonce.builder()
                .titre(request.getTitre())
                .description(request.getDescription())
                .typeLogement(request.getType())
                .prixNuit(request.getPrixNuit())
                .adresse(request.getAdresse())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .disponibilite(true)
                .maxGuests(request.getMaxGuests() != null ? request.getMaxGuests() : 2)
                .bedrooms(request.getBedrooms() != null ? request.getBedrooms() : 1)
                .bathrooms(request.getBathrooms() != null ? request.getBathrooms() : 1)
                .amenities(request.getAmenities() != null ? String.join(",", request.getAmenities()) : null)
                .statut(request.getStatut() != null ? request.getStatut() : "ACTIVE")
                .minimumStay(request.getMinimumStay() != null ? request.getMinimumStay() : 1)
                .user(host)
                .build();

        return toDTO(annonceRepository.save(annonce));
    }

    @Transactional
    public AnnonceDTO updateAnnonce(Integer id, AnnonceRequest request, String userEmail) {
        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Annonce non trouvée avec l'ID : " + id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (user.getRole() != Role.ADMIN && !annonce.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Non autorisé à modifier cette annonce");
        }

        if (request.getTitre() != null && !request.getTitre().isBlank()) {
            annonce.setTitre(request.getTitre());
        }
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            annonce.setDescription(request.getDescription());
        }
        if (request.getType() != null && !request.getType().isBlank()) {
            annonce.setTypeLogement(request.getType());
        }
        if (request.getPrixNuit() != null) {
            annonce.setPrixNuit(request.getPrixNuit());
        }
        if (request.getAdresse() != null && !request.getAdresse().isBlank()) {
            annonce.setAdresse(request.getAdresse());
        }
        if (request.getLatitude() != null) annonce.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) annonce.setLongitude(request.getLongitude());

        // New fields
        if (request.getMaxGuests() != null) annonce.setMaxGuests(request.getMaxGuests());
        if (request.getBedrooms() != null) annonce.setBedrooms(request.getBedrooms());
        if (request.getBathrooms() != null) annonce.setBathrooms(request.getBathrooms());
        if (request.getAmenities() != null) annonce.setAmenities(String.join(",", request.getAmenities()));
        if (request.getStatut() != null) annonce.setStatut(request.getStatut());
        if (request.getMinimumStay() != null) annonce.setMinimumStay(request.getMinimumStay());

        return toDTO(annonceRepository.save(annonce));
    }

    @Transactional
    public void deleteAnnonce(Integer id, String userEmail) {
        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Annonce non trouvée avec l'ID : " + id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (user.getRole() != Role.ADMIN && !annonce.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Non autorisé à supprimer cette annonce");
        }

        annonceRepository.delete(annonce);
    }

    /**
     * Convert with pre-computed rating stats (used by batch list endpoints — no N+1).
     */
    private AnnonceDTO toDTO(Annonce annonce, Map<Integer, double[]> ratingMap) {
        AnnonceDTO dto = buildBaseDTO(annonce);

        double[] stats = ratingMap.getOrDefault(annonce.getId(), new double[]{0.0, 0});
        dto.setAverageRating(Math.round(stats[0] * 10.0) / 10.0);
        dto.setReviewCount((long) stats[1]);

        return dto;
    }

    /**
     * Convert with per-annonce rating lookup (used by single-item endpoints).
     */
    private AnnonceDTO toDTO(Annonce annonce) {
        AnnonceDTO dto = buildBaseDTO(annonce);

        Double avg = avisRepository.findAverageNoteByAnnonceId(annonce.getId());
        dto.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        dto.setReviewCount(avisRepository.countByAnnonceId(annonce.getId()));

        return dto;
    }

    private AnnonceDTO buildBaseDTO(Annonce annonce) {
        AnnonceDTO dto = new AnnonceDTO();
        dto.setId(annonce.getId());
        dto.setTitre(annonce.getTitre());
        dto.setDescription(annonce.getDescription());
        dto.setType(annonce.getTypeLogement());
        dto.setPrixNuit(annonce.getPrixNuit());
        dto.setAdresse(annonce.getAdresse());
        dto.setLatitude(annonce.getLatitude());
        dto.setLongitude(annonce.getLongitude());
        dto.setDisponibilite(annonce.isDisponibilite());
        dto.setCreatedAt(annonce.getCreatedAt());

        // New fields
        dto.setMaxGuests(annonce.getMaxGuests());
        dto.setBedrooms(annonce.getBedrooms());
        dto.setBathrooms(annonce.getBathrooms());
        dto.setStatut(annonce.getStatut());
        dto.setMinimumStay(annonce.getMinimumStay());
        if (annonce.getAmenities() != null && !annonce.getAmenities().isBlank()) {
            dto.setAmenities(Arrays.asList(annonce.getAmenities().split(",")));
        }

        if (annonce.getUser() != null) {
            dto.setUserId(annonce.getUser().getId());
            dto.setUserName(annonce.getUser().getNom());
            dto.setUserPhotoUrl(annonce.getUser().getPhotoUrl());
        }

        if (annonce.getPhotos() != null && !annonce.getPhotos().isEmpty()) {
            dto.setPhotoUrls(annonce.getPhotos().stream()
                    .map(photo -> photo.getPhotoUrl())
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    /**
     * Load all rating stats in a single SQL query.
     * Returns Map<annonceId, [avgRating, reviewCount]>.
     */
    private Map<Integer, double[]> buildRatingMap() {
        Map<Integer, double[]> map = new HashMap<>();
        for (Object[] row : avisRepository.findAllRatingStats()) {
            Integer annonceId = (Integer) row[0];
            Double avg = (Double) row[1];
            Long count = (Long) row[2];
            map.put(annonceId, new double[]{avg != null ? avg : 0.0, count != null ? count : 0});
        }
        return map;
    }
}
