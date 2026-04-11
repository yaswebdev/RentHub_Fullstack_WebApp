package com.renthub.controller;

import com.renthub.dto.AnnonceDTO;
import com.renthub.dto.AnnonceRequest;
import com.renthub.service.AnnonceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/annonces")
@RequiredArgsConstructor
public class AnnonceController {

    private final AnnonceService annonceService;

    @GetMapping
    public ResponseEntity<List<AnnonceDTO>> getAllAnnonces() {
        return ResponseEntity.ok(annonceService.getAllAnnonces());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnnonceDTO> getAnnonceById(@PathVariable Integer id) {
        return ResponseEntity.ok(annonceService.getAnnonceById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<AnnonceDTO>> searchAnnonces(@RequestParam String adresse) {
        return ResponseEntity.ok(annonceService.searchAnnonces(adresse));
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
