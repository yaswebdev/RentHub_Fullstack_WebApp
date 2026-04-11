/**
 * hooks/useReservations.js
 * ──────────────────────────────────────────────────────────────────
 * Hook React pour gérer les réservations de l'utilisateur.
 *
 * Usage :
 *   const { reservations, chargement, creer, annuler } = useReservations(userId);
 * ──────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchMesReservations,
  creerReservation,
  annulerReservation,
} from '../api/reservationsAPI';
import { API_BASE_URL } from '../constants/api';
import { RESERVATIONS_MOCK } from '../mocks/index';

// Imports mode dev
import { db, collection, onSnapshot, query, where } from '../firebase';

/**
 * Charger et gérer les réservations de l'utilisateur connecté.
 * @param {string} utilisateurId - UID de l'utilisateur
 */
export function useReservations(utilisateurId) {
  const [reservations, setReservations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    if (!utilisateurId) {
      setReservations([]);
      setChargement(false);
      return;
    }

    if (API_BASE_URL) {
      // Mode production
      fetchMesReservations(utilisateurId)
        .then((data) => {
          setReservations(data);
          setChargement(false);
        })
        .catch((err) => {
          console.error('[useReservations] Erreur :', err);
          setErreur(err.message);
          setReservations(RESERVATIONS_MOCK);
          setChargement(false);
        });
    } else {
      // Mode développement → écoute temps réel
      const q = query(
        collection(db, 'bookings'),
        where('guestId', '==', utilisateurId)
      );
      const desabonner = onSnapshot(
        q,
        (snapshot) => {
          const donnees = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setReservations(donnees.length > 0 ? donnees : RESERVATIONS_MOCK);
          setChargement(false);
        },
        () => {
          setReservations(RESERVATIONS_MOCK);
          setChargement(false);
        }
      );
      return desabonner;
    }
  }, [utilisateurId]);

  /**
   * Créer une nouvelle réservation.
   * @param {object} donnees - { proprieteId, dateDebut, dateFin, nombreVoyageurs }
   */
  const creer = useCallback(async (donnees) => {
    const nouvelleReservation = await creerReservation(donnees);
    if (!API_BASE_URL) {
      setReservations((prev) => [...prev, nouvelleReservation]);
    }
    return nouvelleReservation;
  }, []);

  /**
   * Annuler une réservation existante.
   * @param {string} id
   */
  const annuler = useCallback(async (id) => {
    await annulerReservation(id);
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, statut: 'annulé', status: 'cancelled' } : r
      )
    );
  }, []);

  return { reservations, chargement, erreur, creer, annuler };
}
