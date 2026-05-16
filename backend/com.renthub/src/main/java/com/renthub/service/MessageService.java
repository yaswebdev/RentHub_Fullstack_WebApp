package com.renthub.service;

import com.renthub.dto.ConversationDTO;
import com.renthub.dto.MessageDTO;
import com.renthub.dto.SendMessageRequest;
import com.renthub.entity.Message;
import com.renthub.entity.Reservation;
import com.renthub.entity.User;
import com.renthub.exception.BusinessRuleException;
import com.renthub.exception.ResourceNotFoundException;
import com.renthub.repository.MessageRepository;
import com.renthub.repository.ReservationRepository;
import com.renthub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;

    /**
     * Send a message in a reservation conversation.
     * Only the host or the tenant of the reservation can send messages.
     */
    @Transactional
    public MessageDTO sendMessage(SendMessageRequest request, String senderEmail) {
        User sender = findUserByEmail(senderEmail);

        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Réservation non trouvée avec l'ID : " + request.getReservationId()));

        // Only host or tenant can send messages
        boolean isHost = reservation.getAnnonce().getUser().getId().equals(sender.getId());
        boolean isTenant = reservation.getLocataire().getId().equals(sender.getId());
        if (!isHost && !isTenant) {
            throw new AccessDeniedException("Non autorisé à envoyer un message dans cette conversation");
        }

        Message message = Message.builder()
                .contenu(request.getContenu())
                .lu(false)
                .reservation(reservation)
                .expediteur(sender)
                .build();

        return toDTO(messageRepository.save(message));
    }

    /**
     * Get all messages for a reservation (conversation thread).
     * Also marks all messages as read for the requesting user.
     */
    @Transactional
    public List<MessageDTO> getMessagesByReservation(Integer reservationId, String userEmail) {
        User user = findUserByEmail(userEmail);

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Réservation non trouvée avec l'ID : " + reservationId));

        // Only host or tenant can see messages
        boolean isHost = reservation.getAnnonce().getUser().getId().equals(user.getId());
        boolean isTenant = reservation.getLocataire().getId().equals(user.getId());
        if (!isHost && !isTenant) {
            throw new AccessDeniedException("Non autorisé à consulter cette conversation");
        }

        // Mark messages from the OTHER person as read
        messageRepository.markAllAsReadByReservationIdAndUserId(reservationId, user.getId());

        return messageRepository.findByReservationIdOrderByDateEnvoiAsc(reservationId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all conversations for the current user (list of reservation threads).
     */
    @Transactional(readOnly = true)
    public List<ConversationDTO> getMyConversations(String userEmail) {
        User user = findUserByEmail(userEmail);
        List<Integer> reservationIds = messageRepository.findReservationIdsWithMessagesByUserId(user.getId());

        if (reservationIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<Reservation> reservations = reservationRepository.findAllById(reservationIds);
        java.util.Map<Integer, Reservation> reservationMap = reservations.stream()
                .collect(Collectors.toMap(Reservation::getId, r -> r));

        List<ConversationDTO> conversations = new ArrayList<>();
        for (Integer reservationId : reservationIds) {
            Reservation reservation = reservationMap.get(reservationId);
            if (reservation == null) continue;

            ConversationDTO conv = new ConversationDTO();
            conv.setReservationId(reservationId);
            conv.setAnnonceTitre(reservation.getAnnonce().getTitre());

            // Determine the "other" user
            boolean isHost = reservation.getAnnonce().getUser().getId().equals(user.getId());
            if (isHost) {
                conv.setAutreUtilisateurId(reservation.getLocataire().getId());
                conv.setAutreUtilisateurNom(reservation.getLocataire().getNom());
            } else {
                conv.setAutreUtilisateurId(reservation.getAnnonce().getUser().getId());
                conv.setAutreUtilisateurNom(reservation.getAnnonce().getUser().getNom());
            }

            // Last message preview
            List<Message> messages = messageRepository.findByReservationIdOrderByDateEnvoiAsc(reservationId);
            if (!messages.isEmpty()) {
                Message last = messages.get(messages.size() - 1);
                String preview = last.getContenu();
                conv.setDernierMessage(preview.length() > 80 ? preview.substring(0, 80) + "…" : preview);
            }

            // Unread count
            conv.setMessagesNonLus(
                    messageRepository.countUnreadByReservationIdAndUserId(reservationId, user.getId()));

            conversations.add(conv);
        }

        return conversations;
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }

    private MessageDTO toDTO(Message message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setContenu(message.getContenu());
        dto.setLu(message.getLu());
        dto.setDateEnvoi(message.getDateEnvoi());
        dto.setReservationId(message.getReservation().getId());
        dto.setExpediteurId(message.getExpediteur().getId());
        dto.setExpediteurNom(message.getExpediteur().getNom());
        return dto;
    }
}
