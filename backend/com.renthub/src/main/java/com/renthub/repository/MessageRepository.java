package com.renthub.repository;

import com.renthub.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Integer> {

    /** All messages for a reservation, ordered chronologically */
    List<Message> findByReservationIdOrderByDateEnvoiAsc(Integer reservationId);

    /** Count unread messages for a specific user in a reservation */
    @Query("SELECT COUNT(m) FROM Message m WHERE m.reservation.id = :reservationId " +
           "AND m.expediteur.id != :userId AND m.lu = false")
    Long countUnreadByReservationIdAndUserId(Integer reservationId, Integer userId);

    /** Mark all messages as read for a user in a conversation */
    @Modifying
    @Query("UPDATE Message m SET m.lu = true WHERE m.reservation.id = :reservationId " +
           "AND m.expediteur.id != :userId AND m.lu = false")
    void markAllAsReadByReservationIdAndUserId(Integer reservationId, Integer userId);

    /** Get all reservations where a user has messages (for listing conversations) */
    @Query("SELECT DISTINCT m.reservation.id FROM Message m " +
           "WHERE m.reservation.locataire.id = :userId " +
           "OR m.reservation.annonce.user.id = :userId")
    List<Integer> findReservationIdsWithMessagesByUserId(Integer userId);
}