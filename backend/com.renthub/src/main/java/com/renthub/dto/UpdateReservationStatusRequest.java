package com.renthub.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateReservationStatusRequest {
    @NotBlank(message = "Le statut est obligatoire")
    private String statut;
}
