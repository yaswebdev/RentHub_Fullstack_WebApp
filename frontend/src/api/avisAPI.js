/**
 * api/avisAPI.js
 * ──────────────────────────────────────────────────────────────────
 * Service de gestion des avis.
 */

import apiClient from './client';
import { ENDPOINTS } from '../constants/api';
import { getProfilePhotoUrl } from '../utils/imageHelpers';

const normalizeAvis = (dto) => ({
  id: dto.id,
  rating: dto.note,
  comment: dto.commentaire,
  date: dto.createdAt,
  userName: dto.locataireNom || 'Locataire',
  userPhoto: getProfilePhotoUrl(dto.locatairePhotoUrl),
  reservationId: dto.reservationId,
  annonceId: dto.annonceId,
});

export async function fetchAvisByAnnonce(annonceId) {
  const { data } = await apiClient.get(ENDPOINTS.AVIS_PROPRIETE(annonceId));
  return data.map(normalizeAvis);
}

export async function fetchAvisStats(annonceId) {
  const { data } = await apiClient.get(ENDPOINTS.AVIS_STATS(annonceId));
  return data;
}

export async function creerAvis(annonceId, reservationId, note, commentaire) {
  const { data } = await apiClient.post(ENDPOINTS.CREER_AVIS(annonceId), {
    reservationId,
    note,
    commentaire,
  });
  return normalizeAvis(data);
}
