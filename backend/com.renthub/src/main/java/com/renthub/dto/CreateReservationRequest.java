package com.renthub.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class CreateReservationRequest {
    @NotNull(message = "L'ID de l'annonce est obligatoire")
    private Integer annonceId;

    @NotNull(message = "La date de début est obligatoire")
    @FutureOrPresent(message = "La date de début ne peut pas être dans le passé")
    private LocalDate dateDebut;

    @NotNull(message = "La date de fin est obligatoire")
    @FutureOrPresent(message = "La date de fin ne peut pas être dans le passé")
    private LocalDate dateFin;
}
