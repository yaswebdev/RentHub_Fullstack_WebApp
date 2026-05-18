package com.renthub.service;

import com.renthub.dto.AnnonceDTO;
import com.renthub.entity.Annonce;
import com.renthub.entity.Favorite;
import com.renthub.entity.User;
import com.renthub.exception.DuplicateResourceException;
import com.renthub.exception.ResourceNotFoundException;
import com.renthub.repository.AnnonceRepository;
import com.renthub.repository.FavoriteRepository;
import com.renthub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final AnnonceRepository annonceRepository;
    private final UserRepository userRepository;
    private final AnnonceService annonceService;

    @Transactional
    public void addFavorite(Integer annonceId, String userEmail) {
        User user = findUserByEmail(userEmail);
        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new ResourceNotFoundException("Annonce non trouvée avec l'ID : " + annonceId));

        if (favoriteRepository.existsByUserIdAndAnnonceId(user.getId(), annonceId)) {
            throw new DuplicateResourceException("Cette annonce est déjà dans vos favoris");
        }

        Favorite favorite = Favorite.builder()
                .user(user)
                .annonce(annonce)
                .build();
        favoriteRepository.save(favorite);
    }

    @Transactional
    public void removeFavorite(Integer annonceId, String userEmail) {
        User user = findUserByEmail(userEmail);
        if (!favoriteRepository.existsByUserIdAndAnnonceId(user.getId(), annonceId)) {
            throw new ResourceNotFoundException("Cette annonce n'est pas dans vos favoris");
        }
        favoriteRepository.deleteByUserIdAndAnnonceId(user.getId(), annonceId);
    }

    @Transactional(readOnly = true)
    public List<AnnonceDTO> getUserFavorites(String userEmail) {
        User user = findUserByEmail(userEmail);
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(fav -> annonceService.getAnnonceById(fav.getAnnonce().getId()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isFavorite(Integer annonceId, String userEmail) {
        User user = findUserByEmail(userEmail);
        return favoriteRepository.existsByUserIdAndAnnonceId(user.getId(), annonceId);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }
}
