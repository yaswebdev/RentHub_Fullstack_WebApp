package com.renthub.service;

import com.renthub.entity.Annonce;
import com.renthub.entity.Photo;
import com.renthub.entity.User;
import com.renthub.exception.BusinessRuleException;
import com.renthub.exception.ResourceNotFoundException;
import com.renthub.entity.Role;
import com.renthub.repository.AnnonceRepository;
import com.renthub.repository.PhotoRepository;
import com.renthub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final AnnonceRepository annonceRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.dir:uploads/photos}")
    private String uploadDir;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    /**
     * Upload one or more photos for an annonce.
     * Only the owner or an admin can upload.
     */
    @Transactional
    public List<String> uploadPhotos(Integer annonceId, List<MultipartFile> files, String userEmail) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new ResourceNotFoundException("Annonce non trouvée avec l'ID : " + annonceId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (user.getRole() != Role.ADMIN && !annonce.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Non autorisé à ajouter des photos à cette annonce");
        }

        if (files == null || files.isEmpty()) {
            throw new BusinessRuleException("Aucun fichier fourni");
        }

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Impossible de créer le répertoire d'upload", e);
        }

        List<String> urls = new ArrayList<>();

        for (MultipartFile file : files) {
            validateFile(file);

            // Generate unique filename
            String extension = getExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + extension;
            Path filePath = uploadPath.resolve(filename);

            try {
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new RuntimeException("Erreur lors de l'enregistrement du fichier", e);
            }

            String photoUrl = "/uploads/photos/" + filename;

            Photo photo = Photo.builder()
                    .photoUrl(photoUrl)
                    .annonce(annonce)
                    .build();
            photoRepository.save(photo);

            urls.add(photoUrl);
        }

        return urls;
    }

    /**
     * Delete a specific photo by ID.
     * Only the annonce owner or admin can delete.
     */
    @Transactional
    public void deletePhoto(Integer photoId, String userEmail) {
        Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new ResourceNotFoundException("Photo non trouvée avec l'ID : " + photoId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (user.getRole() != Role.ADMIN && !photo.getAnnonce().getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Non autorisé à supprimer cette photo");
        }

        // Delete from filesystem
        try {
            Path filePath = Paths.get(uploadDir, photo.getPhotoUrl().replace("/uploads/photos/", ""));
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {
            // File might not exist on disk, still remove from DB
        }

        photoRepository.delete(photo);
    }

    /**
     * Get all photo URLs for an annonce.
     */
    @Transactional(readOnly = true)
    public List<String> getPhotosByAnnonceId(Integer annonceId) {
        return photoRepository.findByAnnonceId(annonceId).stream()
                .map(Photo::getPhotoUrl)
                .toList();
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessRuleException("Le fichier est vide");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessRuleException("Le fichier dépasse la taille maximale de 5MB");
        }
        if (file.getContentType() == null || !ALLOWED_TYPES.contains(file.getContentType())) {
            throw new BusinessRuleException("Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WebP, GIF");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf('.'));
    }
}
