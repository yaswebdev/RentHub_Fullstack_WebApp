package com.renthub.controller;

import com.renthub.dto.ConversationDTO;
import com.renthub.dto.MessageDTO;
import com.renthub.dto.SendMessageRequest;
import com.renthub.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    /**
     * POST /api/messages — Send a message in a reservation conversation
     */
    @PostMapping
    public ResponseEntity<MessageDTO> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        MessageDTO sent = messageService.sendMessage(request, email);
        return new ResponseEntity<>(sent, HttpStatus.CREATED);
    }

    /**
     * GET /api/messages/reservation/{reservationId} — Get all messages for a conversation
     */
    @GetMapping("/reservation/{reservationId}")
    public ResponseEntity<List<MessageDTO>> getMessages(
            @PathVariable Integer reservationId,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(messageService.getMessagesByReservation(reservationId, email));
    }

    /**
     * GET /api/messages/conversations — Get all conversations for the current user
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDTO>> getMyConversations(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(messageService.getMyConversations(email));
    }
}
