-- ============================================================
-- V2: Add missing features — listing attributes, lifecycle,
--     favorites table, and search indexes.
-- ============================================================

-- ── Annonce: host listing attributes ────────────────────────
ALTER TABLE annonces ADD COLUMN IF NOT EXISTS max_guests INTEGER DEFAULT 2;
ALTER TABLE annonces ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 1;
ALTER TABLE annonces ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 1;
ALTER TABLE annonces ADD COLUMN IF NOT EXISTS amenities TEXT;

-- ── Annonce: listing lifecycle ──────────────────────────────
ALTER TABLE annonces ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE annonces ADD COLUMN IF NOT EXISTS minimum_stay INTEGER DEFAULT 1;

-- Add check constraint for statut (wrapped in DO block for idempotency)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_annonces_statut'
    ) THEN
        ALTER TABLE annonces ADD CONSTRAINT chk_annonces_statut
            CHECK (statut IN ('DRAFT', 'ACTIVE', 'PAUSED'));
    END IF;
END
$$;

-- ── Favorites table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    annonce_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_favorites_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_annonce
        FOREIGN KEY (annonce_id) REFERENCES annonces(id) ON DELETE CASCADE,
    CONSTRAINT uq_favorites_user_annonce UNIQUE (user_id, annonce_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_annonce ON favorites(annonce_id);

-- ── Search indexes ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_annonces_type ON annonces(type_logement);
CREATE INDEX IF NOT EXISTS idx_annonces_prix ON annonces(prix_nuit);
CREATE INDEX IF NOT EXISTS idx_annonces_statut ON annonces(statut);
