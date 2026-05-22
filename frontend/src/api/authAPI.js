/**
 * api/authAPI.js
 * ──────────────────────────────────────────────────────────────────
 * Service d'authentification.
 * TODO (Backend) : Remplacer chaque fonction par un vrai appel API.
 * ──────────────────────────────────────────────────────────────────
 */

import apiClient from './client';
import { ENDPOINTS, CLE_TOKEN, CLE_UTILISATEUR, API_BASE_URL } from '../constants/api';

/**
 * Connexion avec email + mot de passe
 * TODO (Backend) : POST /api/auth/connexion  { email, motDePasse }
 * Réponse attendue : { token: string, utilisateur: { id, nom, email, role } }
 */
export async function connexionEmailMotDePasse(email, motDePasse) {
  if (API_BASE_URL) {
    const { data } = await apiClient.post(ENDPOINTS.AUTH_CONNEXION, { email, password: motDePasse });
    return { token: data.token, utilisateur: data.user };
  }

  throw new Error('Connexion par email disponible uniquement avec le backend.');
}

/**
 * Inscription d'un nouvel utilisateur
 * TODO (Backend) : POST /api/auth/inscription  { nom, email, motDePasse, role }
 * Réponse attendue : { token: string, utilisateur: object }
 */
export async function inscriptionUtilisateur(nom, email, motDePasse, role = 'voyageur') {
  if (API_BASE_URL) {
    const normalizedRole = role === 'hote' ? 'HOTE' : 'LOCATAIRE';
    const { data } = await apiClient.post(ENDPOINTS.AUTH_INSCRIPTION, {
      nom,
      email,
      password: motDePasse,
      role: normalizedRole,
    });
    return { token: data.token, utilisateur: data.user };
  }

  throw new Error('Inscription par email disponible uniquement avec le backend.');
}

/**
 * Déconnexion
 * TODO (Backend) : POST /api/auth/deconnexion (invalider le token côté serveur)
 */
export async function deconnexion() {
  if (API_BASE_URL) {
    localStorage.removeItem(CLE_TOKEN);
    localStorage.removeItem(CLE_UTILISATEUR);
    return;
  }
}

/**
 * Récupérer le profil utilisateur connecté
 * TODO (Backend) : GET /api/auth/profil
 */
export async function fetchProfil() {
  if (API_BASE_URL) {
    try {
      const { data } = await apiClient.get(ENDPOINTS.AUTH_PROFIL);
      // Update localStorage with fresh server data
      localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(data));
      return data;
    } catch {
      // Token expired or invalid — clear and return null
      localStorage.removeItem(CLE_TOKEN);
      localStorage.removeItem(CLE_UTILISATEUR);
      return null;
    }
  }
  return null;
}

export async function demanderReinitialisation(email) {
  if (API_BASE_URL) {
    const { data } = await apiClient.post(ENDPOINTS.AUTH_FORGOT_PASSWORD, { email });
    return data;
  }
  throw new Error('Fonction disponible uniquement avec le backend.');
}

export async function reinitialiserMotDePasse(token, newPassword) {
  if (API_BASE_URL) {
    const { data } = await apiClient.post(ENDPOINTS.AUTH_RESET_PASSWORD, { token, newPassword });
    return data;
  }
  throw new Error('Fonction disponible uniquement avec le backend.');
}
