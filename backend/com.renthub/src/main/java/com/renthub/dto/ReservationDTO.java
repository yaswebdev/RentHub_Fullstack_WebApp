package com.renthub.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ReservationDTO {
    private Integer id;
    private Integer annonceId;
    private String annonceTitre;
    private Integer locataireId;
    private String locataireNom;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String statut;
    private BigDecimal montant;
    private LocalDateTime createdAt;
    private String cancellationReason;
    private String paymentStatus;
}
