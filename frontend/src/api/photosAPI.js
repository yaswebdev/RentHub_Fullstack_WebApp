/**
 * api/photosAPI.js
 * ──────────────────────────────────────────────────────────────────
 * Gestion des photos d'annonces.
 */

import apiClient from './client';
import { ENDPOINTS } from '../constants/api';

export async function fetchPhotosByAnnonce(annonceId) {
  const { data } = await apiClient.get(ENDPOINTS.PHOTOS_ANNONCE(annonceId));
  return data;
}

export async function uploadPhotos(annonceId, files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const { data } = await apiClient.post(ENDPOINTS.PHOTOS_ANNONCE(annonceId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deletePhoto(photoId) {
  await apiClient.delete(ENDPOINTS.PHOTO(photoId));
}
