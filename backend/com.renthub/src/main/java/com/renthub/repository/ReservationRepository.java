package com.renthub.repository;

import com.renthub.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Integer> {
    List<Reservation> findByLocataireId(Integer locataireId);
    List<Reservation> findByAnnonceUserId(Integer hostId);

        @Query("""
                        SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
                        FROM Reservation r
                        WHERE r.annonce.id = :annonceId
                            AND r.statut IN ('EN_ATTENTE', 'CONFIRMEE', 'PAYEE')
                            AND r.dateDebut < :dateFin
                            AND r.dateFin > :dateDebut
                        """)
        boolean existsOverlappingActiveReservation(
                        @Param("annonceId") Integer annonceId,
                        @Param("dateDebut") LocalDate dateDebut,
                        @Param("dateFin") LocalDate dateFin
        );
}