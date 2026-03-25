package com.renthub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "annonces")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Annonce {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String titre;

    private String description;

    @Column(name = "prix_nuit")
    private Double prixNuit;

    private String adresse;

    private Double latitude;

    private Double longitude;

    @Column(nullable = false)
    private boolean disponibilite = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // MANY annonces belong to ONE user (host)
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // ONE annonce has MANY photos
    @OneToMany(mappedBy = "annonce")
    private List<Photo> photos;
}