package com.renthub.repository;

import com.renthub.entity.Annonce;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;

public interface AnnonceRepository extends JpaRepository<Annonce, Integer> {

    @EntityGraph(attributePaths = {"user", "photos"})
    Page<Annonce> findAll(Pageable pageable);

    List<Annonce> findByUserId(Integer userId);
    List<Annonce> findByAdresseContainingIgnoreCase(String adresse);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Annonce a WHERE a.id = :id")
    Optional<Annonce> findByIdForUpdate(@Param("id") Integer id);

    @Query("SELECT DISTINCT a FROM Annonce a LEFT JOIN FETCH a.user LEFT JOIN FETCH a.photos")
    List<Annonce> findAllWithDetails();

    /**
     * Advanced search with optional filters.
     * All parameters are nullable — null means "no filter".
     * Only returns ACTIVE listings (excludes DRAFT/PAUSED).
     * When date filters are provided, excludes listings with overlapping active reservations.
     */
    @Query("""
        SELECT DISTINCT a FROM Annonce a
        LEFT JOIN FETCH a.user
        LEFT JOIN FETCH a.photos
        WHERE a.statut = 'ACTIVE'
          AND (:type IS NULL OR a.typeLogement = :type)
          AND (:prixMin IS NULL OR a.prixNuit >= :prixMin)
          AND (:prixMax IS NULL OR a.prixNuit <= :prixMax)
          AND (:maxGuests IS NULL OR a.maxGuests >= :maxGuests)
          AND (:adresse IS NULL OR LOWER(a.adresse) LIKE LOWER(CONCAT('%', :adresse, '%')))
          AND (:dateDebut IS NULL OR :dateFin IS NULL OR NOT EXISTS (
              SELECT r FROM Reservation r
              WHERE r.annonce = a
                AND r.statut IN ('EN_ATTENTE', 'CONFIRMEE', 'PAYEE')
                AND r.dateDebut < :dateFin
                AND r.dateFin > :dateDebut
          ))
    """)
    List<Annonce> searchWithFilters(
        @Param("type") String type,
        @Param("prixMin") Double prixMin,
        @Param("prixMax") Double prixMax,
        @Param("maxGuests") Integer maxGuests,
        @Param("adresse") String adresse,
        @Param("dateDebut") LocalDate dateDebut,
        @Param("dateFin") LocalDate dateFin
    );
}