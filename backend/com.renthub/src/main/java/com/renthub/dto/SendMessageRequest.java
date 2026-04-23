package com.renthub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotNull(message = "L'ID de la réservation est obligatoire")
    private Integer reservationId;

    @NotBlank(message = "Le contenu du message est obligatoire")
    private String contenu;
}
