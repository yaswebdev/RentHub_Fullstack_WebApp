/**
 * constantes/api.js
 * ──────────────────────────────────────────────────────────────────
 * Toutes les routes de l'API backend sont centralisées ici.
 * Pour activer le mode réel : définir VITE_API_URL dans le fichier .env
 *
 * Exemple :  VITE_API_URL=http://localhost:8080
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
  RECHERCHE_AVANCEE:     '/api/annonces/search',
  DISPONIBILITE:    (id) => `/api/annonces/${id}/availability`,

  // ── Réservations ──────────────────────────────────────────────
  RESERVATIONS:          '/api/reservations',
  RESERVATION:      (id) => `/api/reservations/${id}`,
  MES_RESERVATIONS:      '/api/reservations/me',
  RESERVATIONS_HOTE:     '/api/reservations/host',
  CREER_RESERVATION:     '/api/reservations',
  ANNULER_RESERVATION:(id)=> `/api/reservations/${id}/cancel`,
  REFUND_STATUS:    (id) => `/api/reservations/${id}/refund-status`,

  // ── Messagerie ────────────────────────────────────────────────
  CONVERSATIONS:         '/api/messages/conversations',
  MESSAGES: (reservationId) => `/api/messages/reservation/${reservationId}`,
  ENVOYER_MESSAGE:       '/api/messages',

  // ── Photos ───────────────────────────────────────────────
  PHOTOS_ANNONCE: (annonceId) => `/api/photos/annonce/${annonceId}`,
  PHOTO:          (photoId) => `/api/photos/${photoId}`,

  // ── Paiements ────────────────────────────────────────────
  PAIEMENT_CHECKOUT_SESSION: '/api/paiements/checkout-session',
  PAIEMENT_CREATE_INTENT: '/api/paiements/create-intent',
  PAIEMENT_CONFIRM:       '/api/paiements/confirm',

  // ── Avis ──────────────────────────────────────────────────────
  AVIS_PROPRIETE:   (id) => `/api/annonces/${id}/avis`,
  AVIS_STATS:       (id) => `/api/annonces/${id}/avis/stats`,
  CREER_AVIS:       (id) => `/api/annonces/${id}/avis`,

  // ── Favoris ───────────────────────────────────────────────────
  FAVORIS:               '/api/favorites',
  AJOUTER_FAVORI:   (id) => `/api/favorites/${id}`,
  RETIRER_FAVORI:   (id) => `/api/favorites/${id}`,
  VERIFIER_FAVORI:  (id) => `/api/favorites/${id}/check`,

  // ── Admin ─────────────────────────────────────────────────────
  ADMIN_STATS:           '/api/admin/stats',
  ADMIN_USERS:           '/api/admin/users',
  ADMIN_DELETE_USER:(id) => `/api/admin/users/${id}`,
  ADMIN_ANNONCES:        '/api/admin/annonces',
  ADMIN_RESERVATIONS:    '/api/admin/reservations',
};
