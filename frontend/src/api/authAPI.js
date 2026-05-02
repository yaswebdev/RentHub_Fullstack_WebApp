/**
 * api/authAPI.js
 * ──────────────────────────────────────────────────────────────────
 * Service d'authentification.
 * TODO (Backend) : Remplacer chaque fonction par un vrai appel API.
 * ──────────────────────────────────────────────────────────────────
 */

import apiClient from './client';
import { ENDPOINTS, CLE_TOKEN, CLE_UTILISATEUR, API_BASE_URL } from '../constants/api';

/* ── Mode développement local (sans backend) ───────────────────── */
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut as signOutLocal,
  db,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from '../firebase';

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

  // Mode dev : simulation simple (à remplacer par vrai backend)
  throw new Error('Connexion par email non disponible en mode développement. Utilisez Google.');
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

  // Mode dev : inscription locale via l'émulateur
  const result = await signInWithPopup(auth, googleProvider);
  return { utilisateur: result.user, token: null };
}

/**
 * Connexion Google OAuth
 * Mode dev : utilise l'émulateur local
 * Mode réel : Google OAuth → backend valide l'ID token → renvoie JWT
 * TODO (Backend) : POST /api/auth/google  { idToken: string }
 */
export async function connexionGoogle() {
  if (API_BASE_URL) {
    // TODO (Backend) : intégrer Google OAuth côté serveur
    // 1. Obtenir l'idToken Google côté client
    // 2. L'envoyer au backend pour validation
    // 3. Le backend renvoie un JWT
    throw new Error('Connexion Google avec backend non encore implémentée.');
  }

  // Mode dev
  const result = await signInWithPopup(auth, googleProvider);
  const utilisateur = result.user;

  // Créer le profil si c'est la première connexion
  const refDoc = doc(db, 'users', utilisateur.uid);
  const docSnap = await getDoc(refDoc);
  if (!docSnap.exists()) {
    await setDoc(refDoc, {
      uid: utilisateur.uid,
      nom: utilisateur.displayName,
      displayName: utilisateur.displayName,
      email: utilisateur.email,
      photoURL: utilisateur.photoURL,
      role: 'voyageur',
      createdAt: serverTimestamp(),
    });
  }

  return { utilisateur, token: null };
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

  // Mode dev
  await signOutLocal(auth);
}

/**
 * Récupérer le profil utilisateur connecté
 * TODO (Backend) : GET /api/auth/profil
 */
export async function fetchProfil() {
  if (API_BASE_URL) {
    const raw = localStorage.getItem(CLE_UTILISATEUR);
    return raw ? JSON.parse(raw) : null;
  }

  // Mode dev : retourne le profil depuis localStorage
  const raw = localStorage.getItem(CLE_UTILISATEUR);
  return raw ? JSON.parse(raw) : null;
}
