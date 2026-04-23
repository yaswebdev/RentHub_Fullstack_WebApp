package com.renthub.repository;

import com.renthub.entity.Photo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhotoRepository extends JpaRepository<Photo, Integer> {
    List<Photo> findByAnnonceId(Integer annonceId);
    void deleteByAnnonceId(Integer annonceId);
}