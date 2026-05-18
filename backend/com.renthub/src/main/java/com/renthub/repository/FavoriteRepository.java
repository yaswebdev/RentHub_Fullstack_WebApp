package com.renthub.repository;

import com.renthub.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Integer> {

    List<Favorite> findByUserIdOrderByCreatedAtDesc(Integer userId);

    Optional<Favorite> findByUserIdAndAnnonceId(Integer userId, Integer annonceId);

    boolean existsByUserIdAndAnnonceId(Integer userId, Integer annonceId);

    @Modifying
    @Query("DELETE FROM Favorite f WHERE f.user.id = :userId AND f.annonce.id = :annonceId")
    void deleteByUserIdAndAnnonceId(@Param("userId") Integer userId, @Param("annonceId") Integer annonceId);

    @Query("SELECT f.annonce.id FROM Favorite f WHERE f.user.id = :userId")
    List<Integer> findAnnonceIdsByUserId(@Param("userId") Integer userId);
}
