CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('LOCATAIRE', 'HOTE', 'ADMIN')),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS annonces (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    titre VARCHAR(200) NOT NULL,
    description TEXT,
    prix_nuit DOUBLE PRECISION NOT NULL,
    adresse TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    disponibilite BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_annonces_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    annonce_id INTEGER NOT NULL,
    photo_url TEXT NOT NULL,

    CONSTRAINT fk_photos_annonce
        FOREIGN KEY (annonce_id)
        REFERENCES annonces(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    annonce_id INTEGER NOT NULL,
    locataire_id INTEGER NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    CHECK (date_debut < date_fin),
    statut VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
        CHECK (statut IN ('EN_ATTENTE', 'CONFIRMEE', 'REFUSEE', 'PAYEE', 'ANNULEE', 'TERMINEE')),
    montant NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reservation_annonce
        FOREIGN KEY (annonce_id)
        REFERENCES annonces(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reservation_locataire
        FOREIGN KEY (locataire_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- DB-level overlap protection (high-concurrency safety):
-- For active reservations on the same annonce, date ranges cannot overlap.
-- Requires btree_gist to combine equality (annonce_id) and range overlap operators.
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'no_overlapping_active_reservations_per_annonce'
    ) THEN
        ALTER TABLE reservations
        ADD CONSTRAINT no_overlapping_active_reservations_per_annonce
        EXCLUDE USING gist (
            annonce_id WITH =,
            daterange(date_debut, date_fin, '[)') WITH &&
        )
        WHERE (statut IN ('EN_ATTENTE', 'CONFIRMEE', 'PAYEE'));
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS paiements (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER UNIQUE NOT NULL,
    montant DOUBLE PRECISION NOT NULL,
    statut VARCHAR(20) DEFAULT 'EN_ATTENTE'
        CHECK (statut IN ('EN_ATTENTE','PAYE','ECHEC')),
    stripe_payment_intent_id VARCHAR(255),
    last_stripe_event_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_paiement_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS avis (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER UNIQUE NOT NULL,
    note INTEGER CHECK (note BETWEEN 1 AND 5),
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_avis_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER NOT NULL,
    expediteur_id INTEGER NOT NULL,
    contenu TEXT NOT NULL,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lu BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_messages_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_messages_user
        FOREIGN KEY (expediteur_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_annonces_user
ON annonces(user_id);

CREATE INDEX IF NOT EXISTS idx_reservations_annonce
ON reservations(annonce_id);

CREATE INDEX IF NOT EXISTS idx_reservations_locataire
ON reservations(locataire_id);

CREATE INDEX IF NOT EXISTS idx_messages_reservation
ON messages(reservation_id);

CREATE INDEX IF NOT EXISTS idx_messages_expediteur
ON messages(expediteur_id);

CREATE INDEX IF NOT EXISTS idx_photos_annonce
ON photos(annonce_id);

CREATE INDEX IF NOT EXISTS idx_paiement_reservation
ON paiements(reservation_id);

CREATE INDEX IF NOT EXISTS idx_paiement_stripe_intent
ON paiements(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_avis_reservation
ON avis(reservation_id);