package com.renthub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class AnnonceRequest {

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    @NotBlank(message = "La description est obligatoire")
    private String description;

    @NotNull(message = "Le prix par nuit est obligatoire")
    @Positive(message = "Le prix doit être positif")
    private Double prixNuit;

    @NotBlank(message = "L'adresse est obligatoire")
    private String adresse;

    private Double latitude;
    
    private Double longitude;
}
