package com.renthub.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AnnonceDTO {
    private Integer id;
    private String titre;
    private String description;
    private String type;
    private Double prixNuit;
    private String adresse;
    private Double latitude;
    private Double longitude;
    private boolean disponibilite;
    private LocalDateTime createdAt;

    // Host info (flattened — no need to expose the full User object)
    private Integer userId;
    private String userName;
    private String userPhotoUrl;

    // Photo URLs
    private List<String> photoUrls;

    // Rating stats
    private Double averageRating;
    private Long reviewCount;

    // Host listing attributes
    private Integer maxGuests;
    private Integer bedrooms;
    private Integer bathrooms;
    private List<String> amenities;

    // Listing lifecycle
    private String statut;
    private Integer minimumStay;
}
