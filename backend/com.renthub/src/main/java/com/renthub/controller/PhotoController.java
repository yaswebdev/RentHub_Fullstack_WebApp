package com.renthub.controller;

import com.renthub.service.PhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;

    /**
     * POST /api/photos/annonce/{annonceId} — Upload photos for a listing.
     * Accepts multipart/form-data with "files" field.
     */
    @PostMapping("/annonce/{annonceId}")
    @PreAuthorize("hasAnyRole('HOTE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> uploadPhotos(
            @PathVariable Integer annonceId,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        String email = authentication.getName();
        List<String> urls = photoService.uploadPhotos(annonceId, files, email);
        return new ResponseEntity<>(Map.of("uploaded", urls.size(), "urls", urls), HttpStatus.CREATED);
    }

    /**
     * GET /api/photos/annonce/{annonceId} — Get all photo URLs for a listing.
     */
    @GetMapping("/annonce/{annonceId}")
    public ResponseEntity<List<String>> getPhotos(@PathVariable Integer annonceId) {
        return ResponseEntity.ok(photoService.getPhotosByAnnonceId(annonceId));
    }

    /**
     * DELETE /api/photos/{photoId} — Delete a specific photo.
     */
    @DeleteMapping("/{photoId}")
    @PreAuthorize("hasAnyRole('HOTE', 'ADMIN')")
    public ResponseEntity<Void> deletePhoto(
            @PathVariable Integer photoId,
            Authentication authentication) {
        String email = authentication.getName();
        photoService.deletePhoto(photoId, email);
        return ResponseEntity.noContent().build();
    }
}
