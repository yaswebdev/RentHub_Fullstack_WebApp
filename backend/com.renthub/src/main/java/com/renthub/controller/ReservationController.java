package com.renthub.controller;

import com.renthub.dto.CancelReservationRequest;
import com.renthub.dto.CreateReservationRequest;
import com.renthub.dto.RefundStatusDTO;
import com.renthub.dto.ReservationDTO;
import com.renthub.dto.UpdateReservationStatusRequest;
import com.renthub.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('LOCATAIRE', 'ADMIN')")
    public ResponseEntity<ReservationDTO> createReservation(@Valid @RequestBody CreateReservationRequest request, Authentication authentication) {
        String locataireEmail = authentication.getName();
        ReservationDTO created = reservationService.createReservation(request, locataireEmail);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservationDTO> getReservationById(@PathVariable Integer id, Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(reservationService.getReservationById(id, userEmail));
    }

    @GetMapping("/me")
    public ResponseEntity<List<ReservationDTO>> getMyReservations(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(reservationService.getReservationsByLocataireEmail(email));
    }

    @GetMapping("/host")
    @PreAuthorize("hasAnyRole('HOTE', 'ADMIN')")
    public ResponseEntity<List<ReservationDTO>> getHostReservations(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(reservationService.getReservationsByHostEmail(email));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ReservationDTO> updateReservationStatus(@PathVariable Integer id, @Valid @RequestBody UpdateReservationStatusRequest request, Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(reservationService.updateReservationStatus(id, request, userEmail));
    }

    /**
     * POST /api/reservations/{id}/cancel — Cancel a reservation with optional reason.
     * Triggers automatic Stripe refund for paid bookings.
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ReservationDTO> cancelReservation(
            @PathVariable Integer id,
            @RequestBody(required = false) CancelReservationRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(reservationService.cancelReservation(id, request, userEmail));
    }

    /**
     * GET /api/reservations/{id}/refund-status — Get refund status for frontend polling.
     */
    @GetMapping("/{id}/refund-status")
    public ResponseEntity<RefundStatusDTO> getRefundStatus(
            @PathVariable Integer id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(reservationService.getRefundStatus(id, userEmail));
    }
}
