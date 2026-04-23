package com.renthub.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MessageDTO {
    private Integer id;
    private String contenu;
    private Boolean lu;
    private LocalDateTime dateEnvoi;

    // Sender info (flattened)
    private Integer expediteurId;
    private String expediteurNom;

    // Reservation context
    private Integer reservationId;
}
