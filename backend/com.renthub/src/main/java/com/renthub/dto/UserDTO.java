package com.renthub.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserDTO {
    private Integer id;
    private String nom;
    private String email;
    private String role;
    private String photoUrl;
    private LocalDateTime createdAt;
}