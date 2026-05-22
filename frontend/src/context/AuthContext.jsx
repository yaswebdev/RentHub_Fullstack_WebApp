/**
 * context/AuthContext.jsx
 * ──────────────────────────────────────────────────────────────────
 * Contexte d'authentification unifié :
 *   - Mode développement : émulateur local (localStorage)
 *   - Mode production    : JWT depuis le backend REST
 *
 * useFirebase() est conservé comme alias pour la compatibilité.
 * ──────────────────────────────────────────────────────────────────
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL, CLE_TOKEN, CLE_UTILISATEUR } from '../constants/api';
import { fetchProfil } from '../api/authAPI';

const AuthContext = createContext({
  utilisateur: null,
  user: null,          // alias anglais pour la compatibilité
  token: null,
  chargement: true,
  loading: true,       // alias anglais
  connecterAvecJWT: () => {},
  deconnecter: () => {},
});

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    id: user.id ?? user.uid,
    uid: user.uid ?? user.id,
    displayName: user.displayName || user.nom || user.name || user.email,
    photoURL: user.photoURL || user.photoUrl || user.avatarUrl || null,
    role: user.role || user.roles?.[0] || null,
  };
};

export const AuthProvider = ({ children }) => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(CLE_TOKEN));
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (API_BASE_URL) {
      /* ── Mode production : validate JWT by calling backend ─────── */
      const tokenStocke = localStorage.getItem(CLE_TOKEN);
      if (tokenStocke) {
        fetchProfil().then((profil) => {
          if (profil) {
            setUtilisateur(normalizeUser(profil));
            setToken(tokenStocke);
          } else {
            // Token expired or invalid — already cleared by fetchProfil
            setUtilisateur(null);
            setToken(null);
          }
          setChargement(false);
        });
      } else {
        setChargement(false);
      }
    } else {
      setChargement(false);
    }
  }, []);

  /**
   * Appeler cette fonction après une connexion réussie côté backend.
   * Le backend renvoie { token, utilisateur } et on stocke tout ici.
   */
  const connecterAvecJWT = (donneesUtilisateur, jwtToken) => {
    const normalized = normalizeUser(donneesUtilisateur);
    localStorage.setItem(CLE_TOKEN, jwtToken);
    localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(normalized));
    setUtilisateur(normalized);
    setToken(jwtToken);
  };

  const mettreAJourUtilisateur = (donneesUtilisateur) => {
    const normalized = normalizeUser(donneesUtilisateur);
    localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(normalized));
    setUtilisateur(normalized);
  };

  /**
   * Déconnexion — vide le contexte et le localStorage.
   */
  const deconnecter = () => {
    localStorage.removeItem(CLE_TOKEN);
    localStorage.removeItem(CLE_UTILISATEUR);
    setUtilisateur(null);
    setToken(null);
  };

  const valeur = {
    utilisateur,
    user: utilisateur,        // alias pour la compatibilité avec l'ancien code
    token,
    chargement,
    loading: chargement,      // alias
    connecterAvecJWT,
    mettreAJourUtilisateur,
    deconnecter,
  };

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
};

/** Hook principal d'authentification */
export const useAuth = () => useContext(AuthContext);

/** Alias de compatibilité avec l'ancien FirebaseContext */
export const useFirebase = () => useContext(AuthContext);
