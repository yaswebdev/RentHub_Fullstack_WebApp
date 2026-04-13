package com.renthub.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateAvisRequest {

    @NotNull(message = "L'ID de la réservation est obligatoire")
    private Integer reservationId;

    @NotNull(message = "La note est obligatoire")
    @Min(value = 1, message = "La note minimum est 1")
    @Max(value = 5, message = "La note maximum est 5")
    private Integer note;

    @NotBlank(message = "Le commentaire est obligatoire")
    private String commentaire;
}
