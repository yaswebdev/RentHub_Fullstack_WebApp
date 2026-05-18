package com.renthub.controller;

import com.renthub.dto.AdminStatsDTO;
import com.renthub.dto.AnnonceDTO;
import com.renthub.dto.ReservationDTO;
import com.renthub.dto.UserDTO;
import com.renthub.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    /**
     * GET /api/admin/stats — Dashboard statistics (admin only).
     */
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDTO> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    /**
     * GET /api/admin/users?page=0&size=20 — Paginated user list (admin only).
     */
    @GetMapping("/users")
    public ResponseEntity<Page<UserDTO>> getAllUsers(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllUsers(pageable));
    }

    /**
     * GET /api/admin/annonces?page=0&size=20 — Paginated listing of ALL annonces (admin only).
     */
    @GetMapping("/annonces")
    public ResponseEntity<Page<AnnonceDTO>> getAllAnnonces(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllAnnonces(pageable));
    }

    /**
     * GET /api/admin/reservations?page=0&size=20 — Paginated listing of ALL reservations (admin only).
     */
    @GetMapping("/reservations")
    public ResponseEntity<Page<ReservationDTO>> getAllReservations(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllReservations(pageable));
    }

    /**
     * DELETE /api/admin/users/{id} — Delete a user (admin only).
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
