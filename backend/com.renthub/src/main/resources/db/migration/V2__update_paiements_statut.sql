ALTER TABLE paiements
    DROP CONSTRAINT IF EXISTS paiements_statut_check;

ALTER TABLE paiements
    ADD CONSTRAINT paiements_statut_check
    CHECK (statut IN (
        'EN_ATTENTE',
        'PAYE',
        'ECHEC',
        'REFUND_PENDING',
        'REFUNDED',
        'REFUND_FAILED'
    ));
