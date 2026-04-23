package com.renthub.dto;

import lombok.Data;

@Data
public class ConversationDTO {
    private Integer reservationId;
    private String annonceTitre;
    private String autreUtilisateurNom;
    private Integer autreUtilisateurId;
    private String dernierMessage;
    private Long messagesNonLus;
}
