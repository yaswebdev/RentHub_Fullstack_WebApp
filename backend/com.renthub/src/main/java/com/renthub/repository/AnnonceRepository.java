package com.renthub.repository;

import com.renthub.entity.Annonce;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AnnonceRepository extends JpaRepository<Annonce, Integer> {
    List<Annonce> findByUserId(Integer userId);
    List<Annonce> findByAdresseContainingIgnoreCase(String adresse);

    @Query("SELECT DISTINCT a FROM Annonce a LEFT JOIN FETCH a.user LEFT JOIN FETCH a.photos")
    List<Annonce> findAllWithDetails();
}