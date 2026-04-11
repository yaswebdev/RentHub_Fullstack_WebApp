/**
 * api/reservationsAPI.js
 * ──────────────────────────────────────────────────────────────────
 * Service de gestion des réservations.
 * TODO (Backend) : Remplacer chaque fonction par un vrai appel API.
 * ──────────────────────────────────────────────────────────────────
 */

import apiClient from './client';
import { ENDPOINTS, API_BASE_URL } from '../constants/api';
import { RESERVATIONS_MOCK } from '../mocks/index';

/**
 * Récupérer les réservations de l'utilisateur connecté
 * TODO (Backend) : GET /api/reservations/mes-reservations
 */
export async function fetchMesReservations(utilisateurId) {
  if (API_BASE_URL) {
    const { data } = await apiClient.get(ENDPOINTS.MES_RESERVATIONS);
    return data;
  }

  // Mode dev : retourner les réservations fictives
  return RESERVATIONS_MOCK;
}

/**
 * Créer une nouvelle réservation
 * TODO (Backend) : POST /api/reservations
 * Corps : { proprieteId, dateDebut, dateFin, nombreVoyageurs }
 * Réponse : { id, statut: 'en_attente', prixTotal, ... }
 */
export async function creerReservation(donnees) {
  if (API_BASE_URL) {
    const { data } = await apiClient.post(ENDPOINTS.CREER_RESERVATION, donnees);
    return data;
  }

  // Mode dev : simulation d'une réservation créée
  const id = `res-${Math.random().toString(36).slice(2)}`;
  return { id, statut: 'confirmé', status: 'confirmed', ...donnees };
}

/**
 * Annuler une réservation
 * TODO (Backend) : PATCH /api/reservations/:id/annuler
 */
export async function annulerReservation(id) {
  if (API_BASE_URL) {
    const { data } = await apiClient.patch(ENDPOINTS.ANNULER_RESERVATION(id));
    return data;
  }

  return { id, statut: 'annulé', status: 'cancelled' };
}

/**
 * Récupérer le détail d'une réservation
 * TODO (Backend) : GET /api/reservations/:id
 */
export async function fetchReservation(id) {
  if (API_BASE_URL) {
    const { data } = await apiClient.get(ENDPOINTS.RESERVATION(id));
    return data;
  }

  return RESERVATIONS_MOCK.find((r) => r.id === id) || null;
}
