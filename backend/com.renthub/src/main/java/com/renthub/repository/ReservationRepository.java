package com.renthub.repository;

import com.renthub.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Integer> {
    List<Reservation> findByLocataireId(Integer locataireId);
    List<Reservation> findByAnnonceUserId(Integer hostId);
}