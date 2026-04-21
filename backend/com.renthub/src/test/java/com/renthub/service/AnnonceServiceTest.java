package com.renthub.service;

import com.renthub.dto.AnnonceDTO;
import com.renthub.dto.AnnonceRequest;
import com.renthub.entity.Annonce;
import com.renthub.entity.User;
import com.renthub.repository.AnnonceRepository;
import com.renthub.repository.AvisRepository;
import com.renthub.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnnonceServiceTest {

    @Mock
    private AnnonceRepository annonceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AvisRepository avisRepository;

    @InjectMocks
    private AnnonceService annonceService;

    @Test
    void createAnnonceShouldPersistAndMapDto() {
        AnnonceRequest request = new AnnonceRequest();
        request.setTitre("Studio centre-ville");
        request.setDescription("Proche tram");
        request.setPrixNuit(85.0);
        request.setAdresse("Casablanca");
        request.setLatitude(33.5731);
        request.setLongitude(-7.5898);

        User host = new User();
        host.setId(7);
        host.setNom("Host One");
        host.setEmail("host@example.com");
        host.setRole("HOTE");

        Annonce saved = Annonce.builder()
                .id(15)
                .titre(request.getTitre())
                .description(request.getDescription())
                .prixNuit(request.getPrixNuit())
                .adresse(request.getAdresse())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .disponibilite(true)
                .user(host)
                .build();

        when(userRepository.findByEmail("host@example.com")).thenReturn(Optional.of(host));
        when(annonceRepository.save(any(Annonce.class))).thenReturn(saved);
        when(avisRepository.findAverageNoteByAnnonceId(15)).thenReturn(null);
        when(avisRepository.countByAnnonceId(15)).thenReturn(0L);

        AnnonceDTO result = annonceService.createAnnonce(request, "host@example.com");

        assertEquals(15, result.getId());
        assertEquals("Studio centre-ville", result.getTitre());
        assertEquals(7, result.getUserId());
        assertEquals("Host One", result.getUserName());
    }

    @Test
    void updateAnnonceShouldThrowWhenNonOwnerAndNotAdmin() {
        User owner = new User();
        owner.setId(1);

        Annonce annonce = new Annonce();
        annonce.setId(9);
        annonce.setUser(owner);

        User anotherHost = new User();
        anotherHost.setId(2);
        anotherHost.setRole("HOTE");
        anotherHost.setEmail("other@example.com");

        AnnonceRequest request = new AnnonceRequest();
        request.setTitre("Nouveau titre");
        request.setDescription("Desc");
        request.setPrixNuit(120.0);
        request.setAdresse("Rabat");

        when(annonceRepository.findById(9)).thenReturn(Optional.of(annonce));
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(anotherHost));

        AccessDeniedException ex = assertThrows(
                AccessDeniedException.class,
                () -> annonceService.updateAnnonce(9, request, "other@example.com")
        );

        assertEquals("Non autorisé à modifier cette annonce", ex.getMessage());
        verify(annonceRepository, never()).save(any(Annonce.class));
    }
}
