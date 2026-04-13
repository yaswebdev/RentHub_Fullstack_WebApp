package com.renthub.controller;

import com.renthub.dto.AvisDTO;
import com.renthub.dto.CreateAvisRequest;
import com.renthub.service.AvisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AvisController {

    private final AvisService avisService;

    /**
     * GET /api/annonces/{annonceId}/avis — Get all reviews for a listing (public)
     */
    @GetMapping("/api/annonces/{annonceId}/avis")
    public ResponseEntity<List<AvisDTO>> getAvisByAnnonce(@PathVariable Integer annonceId) {
        return ResponseEntity.ok(avisService.getAvisByAnnonceId(annonceId));
    }

    /**
     * GET /api/annonces/{annonceId}/avis/stats — Get rating stats (public)
     */
    @GetMapping("/api/annonces/{annonceId}/avis/stats")
    public ResponseEntity<Map<String, Object>> getAvisStats(@PathVariable Integer annonceId) {
        Double avg = avisService.getAverageRatingByAnnonceId(annonceId);
        Long count = avisService.getReviewCountByAnnonceId(annonceId);
        return ResponseEntity.ok(Map.of(
                "averageRating", avg,
                "reviewCount", count
        ));
    }

    /**
     * POST /api/annonces/{annonceId}/avis — Create a review (tenants only)
     * The annonceId in the path is for REST convention; actual annonce is resolved via reservationId.
     */
    @PostMapping("/api/annonces/{annonceId}/avis")
    @PreAuthorize("hasAnyRole('LOCATAIRE', 'ADMIN')")
    public ResponseEntity<AvisDTO> createAvis(
            @PathVariable Integer annonceId,
            @Valid @RequestBody CreateAvisRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        AvisDTO created = avisService.createAvis(request, userEmail);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /**
     * GET /api/avis/{id} — Get a single review by ID
     */
    @GetMapping("/api/avis/{id}")
    public ResponseEntity<AvisDTO> getAvisById(@PathVariable Integer id) {
        return ResponseEntity.ok(avisService.getAvisById(id));
    }

    /**
     * DELETE /api/avis/{id} — Delete a review (author or admin only)
     */
    @DeleteMapping("/api/avis/{id}")
    @PreAuthorize("hasAnyRole('LOCATAIRE', 'ADMIN')")
    public ResponseEntity<Void> deleteAvis(@PathVariable Integer id, Authentication authentication) {
        String userEmail = authentication.getName();
        avisService.deleteAvis(id, userEmail);
        return ResponseEntity.noContent().build();
    }
}
