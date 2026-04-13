package com.renthub.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AvisDTO {
    private Integer id;
    private Integer note;
    private String commentaire;
    private LocalDateTime createdAt;

    // Reservation info (flattened)
    private Integer reservationId;

    // Annonce info (flattened)
    private Integer annonceId;
    private String annonceTitre;

    // Reviewer info (flattened)
    private Integer locataireId;
    private String locataireNom;
}
