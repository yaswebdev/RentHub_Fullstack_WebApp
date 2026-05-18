/**
 * api/adminAPI.js
 * ──────────────────────────────────────────────────────────────────
 * Admin-only API functions.  All endpoints require ADMIN role JWT.
 * ──────────────────────────────────────────────────────────────────
 */
import apiClient from './client';
import { ENDPOINTS, API_BASE_URL } from '../constants/api';

const BACKEND_BASE_URL = API_BASE_URL || '';

const normalizePhotoUrls = (urls = []) =>
  urls.map((url) => (url?.startsWith('/') ? `${BACKEND_BASE_URL}${url}` : url));

/** GET /api/admin/stats */
export const fetchAdminStats = async () => {
  const { data } = await apiClient.get(ENDPOINTS.ADMIN_STATS);
  return data;
};

/** GET /api/admin/users?page=&size= */
export const fetchAdminUsers = async (page = 0, size = 20) => {
  const { data } = await apiClient.get(ENDPOINTS.ADMIN_USERS, {
    params: { page, size, sort: 'createdAt,desc' },
  });
  return data;
};

/** DELETE /api/admin/users/:id */
export const deleteAdminUser = async (id) => {
  await apiClient.delete(ENDPOINTS.ADMIN_DELETE_USER(id));
};

/** GET /api/admin/annonces?page=&size= */
export const fetchAdminAnnonces = async (page = 0, size = 20) => {
  const { data } = await apiClient.get(ENDPOINTS.ADMIN_ANNONCES, {
    params: { page, size, sort: 'createdAt,desc' },
  });
  return {
    ...data,
    content: (data?.content || []).map((annonce) => ({
      ...annonce,
      photoUrls: normalizePhotoUrls(annonce.photoUrls || []),
    })),
  };
};

/** GET /api/admin/reservations?page=&size= */
export const fetchAdminReservations = async (page = 0, size = 20) => {
  const { data } = await apiClient.get(ENDPOINTS.ADMIN_RESERVATIONS, {
    params: { page, size, sort: 'createdAt,desc' },
  });
  return data;
};
