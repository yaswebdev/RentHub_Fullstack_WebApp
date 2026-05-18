package com.renthub.repository;

import com.renthub.entity.Paiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PaiementRepository extends JpaRepository<Paiement, Integer> {
    Optional<Paiement> findByReservationId(Integer reservationId);
    Optional<Paiement> findByStripePaymentIntentId(String stripePaymentIntentId);
    List<Paiement> findByReservationIdIn(Collection<Integer> reservationIds);

    @Query("SELECT COALESCE(SUM(p.montant), 0) FROM Paiement p WHERE p.statut = 'PAYE'")
    Double sumPaidAmounts();

    long countByStatut(String statut);
}