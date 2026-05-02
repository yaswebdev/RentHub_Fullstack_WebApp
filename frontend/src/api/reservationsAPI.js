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

const normalizeReservation = (dto) => ({
  id: dto.id,
  annonceId: dto.annonceId,
  propertyId: dto.annonceId,
  propertyTitle: dto.annonceTitre,
  titrePropriete: dto.annonceTitre,
  dateDebut: dto.dateDebut,
  dateFin: dto.dateFin,
  statut: dto.statut,
  status: dto.statut?.toLowerCase?.() || dto.statut,
  prixTotal: dto.montant,
  totalPrice: dto.montant,
  createdAt: dto.createdAt,
  cancellationReason: dto.cancellationReason,
});

/**
 * Récupérer les réservations de l'utilisateur connecté
 * TODO (Backend) : GET /api/reservations/mes-reservations
 */
export async function fetchMesReservations(utilisateurId) {
  if (API_BASE_URL) {
    const { data } = await apiClient.get(ENDPOINTS.MES_RESERVATIONS);
    return data.map(normalizeReservation);
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
    const payload = {
      annonceId: donnees.annonceId || donnees.propertyId || donnees.proprieteId,
      dateDebut: donnees.dateDebut || donnees.startDate,
      dateFin: donnees.dateFin || donnees.endDate,
    };
    const { data } = await apiClient.post(ENDPOINTS.CREER_RESERVATION, payload);
    return normalizeReservation(data);
  }

  // Mode dev : simulation d'une réservation créée
  const id = `res-${Math.random().toString(36).slice(2)}`;
  return { id, statut: 'confirmé', status: 'confirmed', ...donnees };
}

/**
 * Annuler une réservation
 * TODO (Backend) : PATCH /api/reservations/:id/annuler
 */
export async function annulerReservation(id, reason) {
  if (API_BASE_URL) {
    const body = reason ? { reason } : undefined;
    const { data } = await apiClient.post(ENDPOINTS.ANNULER_RESERVATION(id), body);
    return normalizeReservation(data);
  }

  return { id, statut: 'annulé', status: 'cancelled', cancellationReason: reason };
}

/**
 * Récupérer le statut de remboursement
 * TODO (Backend) : GET /api/reservations/:id/refund-status
 */
export async function fetchRefundStatus(id) {
  if (API_BASE_URL) {
    const { data } = await apiClient.get(ENDPOINTS.REFUND_STATUS(id));
    return data;
  }
  return null;
}

/**
 * Récupérer le détail d'une réservation
 * TODO (Backend) : GET /api/reservations/:id
 */
export async function fetchReservation(id) {
  if (API_BASE_URL) {
    const { data } = await apiClient.get(ENDPOINTS.RESERVATION(id));
    return normalizeReservation(data);
  }

  return RESERVATIONS_MOCK.find((r) => r.id === id) || null;
}
