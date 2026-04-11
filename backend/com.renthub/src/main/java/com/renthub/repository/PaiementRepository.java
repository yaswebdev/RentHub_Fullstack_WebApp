package com.renthub.repository;

import com.renthub.entity.Paiement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaiementRepository extends JpaRepository<Paiement, Integer> {
    Optional<Paiement> findByReservationId(Integer reservationId);
    Optional<Paiement> findByStripePaymentIntentId(String stripePaymentIntentId);
}