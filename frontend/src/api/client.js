/**
 * api/client.js
 * ──────────────────────────────────────────────────────────────────
 * Instance Axios configurée avec :
 *   - URL de base depuis VITE_API_URL
 *   - Intercepteur de requête  → attache le token JWT automatiquement
 *   - Intercepteur de réponse  → gère l'expiration du token (401)
 *
 * Usage :
 *   import apiClient from '../api/client';
 *   const data = await apiClient.get('/api/proprietes');
 * ──────────────────────────────────────────────────────────────────
 */

import axios from 'axios';
import { API_BASE_URL, CLE_TOKEN } from '../constants/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL || 'http://localhost:8080',
  timeout: 12000,
  headers: {
    'Accept': 'application/json',
  },
});

/* ── Intercepteur de REQUÊTE : attache le token JWT ─────────────── */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(CLE_TOKEN);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (erreur) => Promise.reject(erreur)
);

/* ── Intercepteur de RÉPONSE : gère les erreurs globales ────────── */
apiClient.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    if (erreur.response?.status === 401) {
      // Token expiré ou invalide → déconnexion automatique
      localStorage.removeItem(CLE_TOKEN);
      localStorage.removeItem('renthub.utilisateur');
      // Rediriger vers la page de connexion
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (erreur.response?.status === 403) {
      // Keep session on 403 and let screens show their own error messages.
      console.warn('[API] Accès refusé — permissions insuffisantes');
    }

    if (erreur.response?.status >= 500) {
      console.error('[API] Erreur serveur :', erreur.response?.data?.message || erreur.message);
    }

    return Promise.reject(erreur);
  }
);

export default apiClient;
