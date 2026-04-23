package com.renthub.service;

import com.renthub.dto.CreateReservationRequest;
import com.renthub.dto.ReservationDTO;
import com.renthub.entity.Annonce;
import com.renthub.entity.Reservation;
import com.renthub.entity.Role;
import com.renthub.entity.User;
import com.renthub.exception.BusinessRuleException;
import com.renthub.repository.AnnonceRepository;
import com.renthub.repository.PaiementRepository;
import com.renthub.repository.ReservationRepository;
import com.renthub.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private AnnonceRepository annonceRepository;
    @Mock private UserRepository userRepository;
    @Mock private PaiementRepository paiementRepository;
    @Mock private PaiementService paiementService;

    @InjectMocks
    private ReservationService reservationService;

    @Test
    void createReservationShouldThrowWhenHostBooksOwnAnnonce() {
        User host = new User();
        host.setId(4);
        host.setEmail("host@example.com");

        Annonce annonce = new Annonce();
        annonce.setId(11);
        annonce.setPrixNuit(95.0);
        annonce.setDisponibilite(true);
        annonce.setUser(host);

        CreateReservationRequest request = new CreateReservationRequest();
        request.setAnnonceId(11);
        request.setDateDebut(LocalDate.now().plusDays(1));
        request.setDateFin(LocalDate.now().plusDays(3));

        when(userRepository.findByEmail("host@example.com")).thenReturn(Optional.of(host));
        when(annonceRepository.findByIdForUpdate(11)).thenReturn(Optional.of(annonce));
        when(reservationRepository.existsOverlappingActiveReservation(
            11,
            request.getDateDebut(),
            request.getDateFin()
        )).thenReturn(false);

        BusinessRuleException ex = assertThrows(
                BusinessRuleException.class,
                () -> reservationService.createReservation(request, "host@example.com")
        );

        assertEquals("Vous ne pouvez pas réserver votre propre annonce.", ex.getMessage());
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    void createReservationShouldThrowWhenDatesOverlapExistingActiveReservation() {
        User host = new User();
        host.setId(10);

        User tenant = new User();
        tenant.setId(4);
        tenant.setEmail("tenant@example.com");

        Annonce annonce = new Annonce();
        annonce.setId(11);
        annonce.setPrixNuit(95.0);
        annonce.setDisponibilite(true);
        annonce.setUser(host);

        CreateReservationRequest request = new CreateReservationRequest();
        request.setAnnonceId(11);
        request.setDateDebut(LocalDate.now().plusDays(1));
        request.setDateFin(LocalDate.now().plusDays(4));

        when(userRepository.findByEmail("tenant@example.com")).thenReturn(Optional.of(tenant));
        when(annonceRepository.findByIdForUpdate(11)).thenReturn(Optional.of(annonce));
        when(reservationRepository.existsOverlappingActiveReservation(
                11,
                request.getDateDebut(),
                request.getDateFin()
        )).thenReturn(true);

        BusinessRuleException ex = assertThrows(
                BusinessRuleException.class,
                () -> reservationService.createReservation(request, "tenant@example.com")
        );

        assertEquals("Ces dates ne sont plus disponibles pour cette annonce.", ex.getMessage());
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    void tenantCannotUseGenericPatchToCancel() {
        User host = new User();
        host.setId(1);

        User tenant = new User();
        tenant.setId(2);
        tenant.setRole(Role.LOCATAIRE);
        tenant.setEmail("tenant@example.com");
        tenant.setNom("Tenant One");

        Annonce annonce = new Annonce();
        annonce.setId(8);
        annonce.setTitre("Appartement Agdal");
        annonce.setUser(host);

        Reservation reservation = Reservation.builder()
                .id(20)
                .annonce(annonce)
                .locataire(tenant)
                .statut("EN_ATTENTE")
                .dateDebut(LocalDate.now().plusDays(1))
                .dateFin(LocalDate.now().plusDays(2))
                .build();

        com.renthub.dto.UpdateReservationStatusRequest request = new com.renthub.dto.UpdateReservationStatusRequest();
        request.setStatut("CONFIRMEE");

        when(reservationRepository.findById(20)).thenReturn(Optional.of(reservation));
        when(userRepository.findByEmail("tenant@example.com")).thenReturn(Optional.of(tenant));

        // Tenants should be blocked from using the generic PATCH endpoint
        assertThrows(BusinessRuleException.class,
                () -> reservationService.updateReservationStatus(20, request, "tenant@example.com"));
    }
}
