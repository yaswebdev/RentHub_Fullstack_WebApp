package com.renthub.controller;

import com.renthub.dto.AnnonceDTO;
import com.renthub.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    /**
     * POST /api/favorites/{annonceId} — Add a listing to favorites.
     */
    @PostMapping("/{annonceId}")
    public ResponseEntity<Map<String, String>> addFavorite(
            @PathVariable Integer annonceId,
            Authentication authentication) {
        favoriteService.addFavorite(annonceId, authentication.getName());
        return new ResponseEntity<>(Map.of("message", "Ajouté aux favoris"), HttpStatus.CREATED);
    }

    /**
     * DELETE /api/favorites/{annonceId} — Remove a listing from favorites.
     */
    @DeleteMapping("/{annonceId}")
    public ResponseEntity<Void> removeFavorite(
            @PathVariable Integer annonceId,
            Authentication authentication) {
        favoriteService.removeFavorite(annonceId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/favorites — List all of the user's favorite listings.
     */
    @GetMapping
    public ResponseEntity<List<AnnonceDTO>> getUserFavorites(Authentication authentication) {
        return ResponseEntity.ok(favoriteService.getUserFavorites(authentication.getName()));
    }

    /**
     * GET /api/favorites/{annonceId}/check — Check if a listing is in the user's favorites.
     */
    @GetMapping("/{annonceId}/check")
    public ResponseEntity<Map<String, Boolean>> checkFavorite(
            @PathVariable Integer annonceId,
            Authentication authentication) {
        boolean isFav = favoriteService.isFavorite(annonceId, authentication.getName());
        return ResponseEntity.ok(Map.of("isFavorite", isFav));
    }
}
