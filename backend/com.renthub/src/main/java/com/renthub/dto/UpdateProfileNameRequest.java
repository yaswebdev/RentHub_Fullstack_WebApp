package com.renthub.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateProfileNameRequest {
    @NotBlank(message = "Le nom est obligatoire")
    private String nom;
}
