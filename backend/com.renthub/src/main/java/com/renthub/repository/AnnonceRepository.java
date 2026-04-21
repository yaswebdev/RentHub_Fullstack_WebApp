package com.renthub.repository;

import com.renthub.entity.Annonce;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AnnonceRepository extends JpaRepository<Annonce, Integer> {
    List<Annonce> findByUserId(Integer userId);
    List<Annonce> findByAdresseContainingIgnoreCase(String adresse);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Annonce a WHERE a.id = :id")
    Optional<Annonce> findByIdForUpdate(@Param("id") Integer id);

    @Query("SELECT DISTINCT a FROM Annonce a LEFT JOIN FETCH a.user LEFT JOIN FETCH a.photos")
    List<Annonce> findAllWithDetails();
}