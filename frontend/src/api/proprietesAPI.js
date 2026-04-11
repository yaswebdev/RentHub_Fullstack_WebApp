/**
 * api/proprietesAPI.js
 * ──────────────────────────────────────────────────────────────────
 * Service de gestion des propriétés.
 * TODO (Backend) : Remplacer chaque fonction par un vrai appel API.
 * ──────────────────────────────────────────────────────────────────
 */

import apiClient from './client';
import { ENDPOINTS, API_BASE_URL } from '../constants/api';
import { PROPRIETES_MOCK } from '../mocks/index';

/* ── Filtrage local marocain ─────────────────────────────────────── */
const VILLES_MAROC = [
  'marrakech', 'casablanca', 'agadir', 'tanger', 'fès', 'fes',
  'rabat', 'essaouira', 'meknès', 'ouarzazate', 'tétouan', 'tetouan',
  'maroc', 'morocco',
];

const estMarocaine = (p) => {
  const loc = typeof p.location === 'string' ? p.location.toLowerCase() : '';
  const ville = (p.ville || p.city || '').toLowerCase();
  return VILLES_MAROC.some((v) => loc.includes(v) || ville.includes(v));
};

/**
 * Récupérer la liste des propriétés avec filtres optionnels
 * TODO (Backend) : GET /api/proprietes?ville=&type=&prixMin=&prixMax=&voyageurs=
 */
export async function fetchProprietes(filtres = {}) {
  if (API_BASE_URL) {
    const { data } = await apiClient.get(ENDPOINTS.PROPRIETES, { params: filtres });
    return data;
  }

  // Mode dev : filtrage local
  const moroccan = PROPRIETES_MOCK.filter(estMarocaine);
  return moroccan.length > 0 ? moroccan : PROPRIETES_MOCK;
}

/**
 * Récupérer une propriété par son identifiant
 * TODO (Backend) : GET /api/proprietes/:id
 */
export async function fetchProprieteParId(id) {
  if (API_BASE_URL) {
    const { data } = await apiClient.get(ENDPOINTS.PROPRIETE(id));
    return data;
  }

  const propriete = PROPRIETES_MOCK.find((p) => p.id === id);
  if (!propriete) throw new Error(`Propriété ${id} introuvable`);
  return propriete;
}

/**
 * Créer une nouvelle annonce
 * TODO (Backend) : POST /api/proprietes  { ...donneesPropriete }
 * Nécessite d'être authentifié (rôle hôte)
 */
export async function creerPropriete(donnees) {
  if (API_BASE_URL) {
    const { data } = await apiClient.post(ENDPOINTS.CREER_PROPRIETE, donnees);
    return data;
  }

  // Mode dev : simulation
  return { id: Math.random().toString(36).slice(2), ...donnees };
}

/**
 * Modifier une annonce existante
 * TODO (Backend) : PUT /api/proprietes/:id  { ...donnees }
 */
export async function modifierPropriete(id, donnees) {
  if (API_BASE_URL) {
    const { data } = await apiClient.put(ENDPOINTS.MODIFIER_PROPRIETE(id), donnees);
    return data;
  }

  return { id, ...donnees };
}

/**
 * Supprimer une annonce
 * TODO (Backend) : DELETE /api/proprietes/:id
 */
export async function supprimerPropriete(id) {
  if (API_BASE_URL) {
    await apiClient.delete(ENDPOINTS.SUPPRIMER_PROPRIETE(id));
    return;
  }

  console.log(`[Dev] Suppression simulée de la propriété ${id}`);
}
