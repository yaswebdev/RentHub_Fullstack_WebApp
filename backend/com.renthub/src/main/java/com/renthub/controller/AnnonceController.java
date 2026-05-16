package com.renthub.controller;

import com.renthub.dto.AnnonceDTO;
import com.renthub.dto.AnnonceRequest;
import com.renthub.service.AnnonceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/annonces")
@RequiredArgsConstructor
public class AnnonceController {

    private final AnnonceService annonceService;

    @GetMapping
    public ResponseEntity<List<AnnonceDTO>> getAllAnnonces() {
        return ResponseEntity.ok(annonceService.getAllAnnonces());
    }

    /**
     * GET /api/annonces/page?page=0&size=12&sort=createdAt,desc
     * Paginated listing for frontend infinite scroll / pagination.
     */
    @GetMapping("/page")
    public ResponseEntity<Page<AnnonceDTO>> getAllAnnoncesPaginated(
            @PageableDefault(size = 12, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(annonceService.getAllAnnonces(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnnonceDTO> getAnnonceById(@PathVariable Integer id) {
        return ResponseEntity.ok(annonceService.getAnnonceById(id));
    }

    /**
     * GET /api/annonces/search?adresse=Marrakech&type=Appartement&prixMin=200&prixMax=800&maxGuests=4&dateDebut=2026-06-01&dateFin=2026-06-10
     * Advanced search with optional filters.
     */
    @GetMapping("/search")
    public ResponseEntity<List<AnnonceDTO>> searchAnnonces(
            @RequestParam(required = false) String adresse,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Double prixMin,
            @RequestParam(required = false) Double prixMax,
            @RequestParam(required = false) Integer maxGuests,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {

        // If only basic address search is provided, use the simple search
        if (type == null && prixMin == null && prixMax == null && maxGuests == null && dateDebut == null && dateFin == null && adresse != null) {
            return ResponseEntity.ok(annonceService.searchAnnonces(adresse));
        }

        return ResponseEntity.ok(annonceService.searchWithFilters(type, prixMin, prixMax, maxGuests, adresse, dateDebut, dateFin));
    }

    /**
     * GET /api/annonces/{id}/availability — Returns booked date ranges for a listing.
     */
    @GetMapping("/{id}/availability")
    public ResponseEntity<List<Map<String, LocalDate>>> getAvailability(@PathVariable Integer id) {
        return ResponseEntity.ok(annonceService.getAvailability(id));
    }

    @GetMapping("/host/{hostId}")
    public ResponseEntity<List<AnnonceDTO>> getAnnoncesByHost(@PathVariable Integer hostId) {
        return ResponseEntity.ok(annonceService.getAnnoncesByHost(hostId));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('HOTE', 'ADMIN')")
    public ResponseEntity<List<AnnonceDTO>> getMyAnnonces(Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(annonceService.getAnnoncesByHostEmail(userEmail));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HOTE', 'ADMIN')")
    public ResponseEntity<AnnonceDTO> createAnnonce(@Valid @RequestBody AnnonceRequest request, Authentication authentication) {
        String userEmail = authentication.getName();
        AnnonceDTO created = annonceService.createAnnonce(request, userEmail);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOTE', 'ADMIN')")
    public ResponseEntity<AnnonceDTO> updateAnnonce(@PathVariable Integer id, @Valid @RequestBody AnnonceRequest request, Authentication authentication) {
        String userEmail = authentication.getName();
        AnnonceDTO updated = annonceService.updateAnnonce(id, request, userEmail);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOTE', 'ADMIN')")
    public ResponseEntity<Void> deleteAnnonce(@PathVariable Integer id, Authentication authentication) {
        String userEmail = authentication.getName();
        annonceService.deleteAnnonce(id, userEmail);
        return ResponseEntity.noContent().build();
    }
}
