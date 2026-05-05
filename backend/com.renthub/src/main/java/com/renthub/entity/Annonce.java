package com.renthub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
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

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false)
    private String description;

    @Column(name = "type_logement")
    private String typeLogement;

    @Column(name = "prix_nuit", nullable = false)
    private Double prixNuit;

    @Column(nullable = false)
    private String adresse;

    private Double latitude;

    private Double longitude;

    @Builder.Default
    @Column(nullable = false)
    private boolean disponibilite = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // MANY annonces belong to ONE user (host)
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // ONE annonce has MANY photos
    @OneToMany(mappedBy = "annonce", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Photo> photos;
}