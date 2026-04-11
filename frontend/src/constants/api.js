/**
 * constantes/api.js
 * ──────────────────────────────────────────────────────────────────
 * Toutes les routes de l'API backend sont centralisées ici.
 * Pour activer le mode réel : définir VITE_API_URL dans le fichier .env
 *
 * Exemple :  VITE_API_URL=http://localhost:5000
 * ──────────────────────────────────────────────────────────────────
 */

/** URL de base du backend. Null = mode développement local. */
export const API_BASE_URL = import.meta.env.VITE_API_URL || null;

/** Durée maximale d'attente pour une requête (ms) */
export const DELAI_REQUETE_MS = 12000;

/** Clé de stockage du token JWT */
export const CLE_TOKEN = 'renthub.token';

/** Clé de stockage de l'utilisateur courant */
export const CLE_UTILISATEUR = 'renthub.utilisateur';

/**
 * Points de terminaison (endpoints) de l'API
 * Le backend doit implémenter exactement ces routes.
 */
export const ENDPOINTS = {
  // ── Authentification ──────────────────────────────────────────
  AUTH_CONNEXION:        '/api/auth/login',
  AUTH_INSCRIPTION:      '/api/auth/register',
  AUTH_DECONNEXION:      '/api/auth/deconnexion',
  AUTH_PROFIL:           '/api/auth/profil',
  AUTH_RAFRAICHIR_TOKEN: '/api/auth/rafraichir',

  // ── Propriétés ────────────────────────────────────────────────
  PROPRIETES:            '/api/annonces',
  PROPRIETE:        (id) => `/api/annonces/${id}`,
  PROPRIETES_HOTE:       '/api/annonces/me',
  CREER_PROPRIETE:       '/api/annonces',
  MODIFIER_PROPRIETE:(id) => `/api/annonces/${id}`,
  SUPPRIMER_PROPRIETE:(id)=> `/api/annonces/${id}`,

  // ── Réservations ──────────────────────────────────────────────
  RESERVATIONS:          '/api/reservations',
  RESERVATION:      (id) => `/api/reservations/${id}`,
  MES_RESERVATIONS:      '/api/reservations/me',
  CREER_RESERVATION:     '/api/reservations',
  ANNULER_RESERVATION:(id)=> `/api/reservations/${id}/status`,

  // ── Messagerie ────────────────────────────────────────────────
  CHATS:                 '/api/chats',
  CHAT:             (id) => `/api/chats/${id}`,
  MESSAGES:    (chatId) => `/api/chats/${chatId}/messages`,
  ENVOYER_MESSAGE:(chatId)=> `/api/chats/${chatId}/messages`,
  CREER_CHAT:            '/api/chats',

  // ── Avis ──────────────────────────────────────────────────────
  AVIS_PROPRIETE:   (id) => `/api/proprietes/${id}/avis`,
  CREER_AVIS:       (id) => `/api/proprietes/${id}/avis`,
};
