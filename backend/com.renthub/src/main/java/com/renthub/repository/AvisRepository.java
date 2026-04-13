package com.renthub.repository;

import com.renthub.entity.Avis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AvisRepository extends JpaRepository<Avis, Integer> {

    /** All reviews for a specific annonce (via the reservation's annonce) */
    List<Avis> findByReservationAnnonceId(Integer annonceId);

    /** Check if a review already exists for a reservation (one review per booking) */
    Optional<Avis> findByReservationId(Integer reservationId);

    /** Average rating for an annonce */
    @Query("SELECT AVG(a.note) FROM Avis a WHERE a.reservation.annonce.id = :annonceId")
    Double findAverageNoteByAnnonceId(Integer annonceId);

    /** Count of reviews for an annonce */
    @Query("SELECT COUNT(a) FROM Avis a WHERE a.reservation.annonce.id = :annonceId")
    Long countByAnnonceId(Integer annonceId);
}