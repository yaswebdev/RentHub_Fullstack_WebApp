package com.renthub.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {

    @NotBlank(message = "L'adresse e-mail est obligatoire")
    @Email(message = "Format d'e-mail invalide")
    private String email;
}
