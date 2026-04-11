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
import { auth, onAuthStateChanged } from '../firebase';
import { API_BASE_URL, CLE_TOKEN, CLE_UTILISATEUR } from '../constants/api';

const AuthContext = createContext({
  utilisateur: null,
  user: null,          // alias anglais pour la compatibilité
  token: null,
  chargement: true,
  loading: true,       // alias anglais
  connecterAvecJWT: () => {},
  deconnecter: () => {},
});

export const AuthProvider = ({ children }) => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(CLE_TOKEN));
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (API_BASE_URL) {
      /* ── Mode production : lire le JWT depuis localStorage ──────── */
      const tokenStocke = localStorage.getItem(CLE_TOKEN);
      const userStocke  = localStorage.getItem(CLE_UTILISATEUR);

      if (tokenStocke && userStocke) {
        try {
          setUtilisateur(JSON.parse(userStocke));
          setToken(tokenStocke);
        } catch {
          localStorage.removeItem(CLE_TOKEN);
          localStorage.removeItem(CLE_UTILISATEUR);
        }
      }
      setChargement(false);
    } else {
      /* ── Mode développement : écouter l'émulateur local ─────────── */
      const desabonner = onAuthStateChanged(auth, (u) => {
        setUtilisateur(u);
        setChargement(false);
      });
      return desabonner;
    }
  }, []);

  /**
   * Appeler cette fonction après une connexion réussie côté backend.
   * Le backend renvoie { token, utilisateur } et on stocke tout ici.
   */
  const connecterAvecJWT = (donneesUtilisateur, jwtToken) => {
    localStorage.setItem(CLE_TOKEN, jwtToken);
    localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(donneesUtilisateur));
    setUtilisateur(donneesUtilisateur);
    setToken(jwtToken);
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
    deconnecter,
  };

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
};

/** Hook principal d'authentification */
export const useAuth = () => useContext(AuthContext);

/** Alias de compatibilité avec l'ancien FirebaseContext */
export const useFirebase = () => useContext(AuthContext);
