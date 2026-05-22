/**
 * hooks/useProprietes.js
 * ──────────────────────────────────────────────────────────────────
 * Hook React pour charger les propriétés.
 * Les composants n'ont pas besoin de savoir d'où viennent les données.
 *
 * Usage :
 *   const { proprietes, chargement, erreur } = useProprietes(filtres);
 *   const { propriete, chargement, erreur }  = usePropriete(id);
 * ──────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchProprietes, fetchProprieteParId, fetchProprietesHote } from '../api/proprietesAPI';
import { API_BASE_URL } from '../constants/api';
import { PROPRIETES_MOCK } from '../mocks/index';

/**
 * Charger la liste des propriétés avec filtres optionnels.
 * @param {object} filtres - { type, ville, prixMin, prixMax, ... }
 * @param {number} maximum - Nombre maximum de résultats (dev uniquement)
 */
export function useProprietes(filtres = {}, maximum = 20) {
  const [proprietes, setProprietes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const donnees = await fetchProprietes(filtres);
      setProprietes(donnees);
    } catch (err) {
      console.error('[useProprietes] Erreur :', err);
      setErreur(err.message || 'Erreur lors du chargement des propriétés.');
      setProprietes(PROPRIETES_MOCK);
    } finally {
      setChargement(false);
    }
  }, [JSON.stringify(filtres)]);

  useEffect(() => {
    if (API_BASE_URL) {
      // Mode production → appel API REST
      charger();
      return undefined;
    }

    setProprietes(PROPRIETES_MOCK);
    setChargement(false);
    return undefined;
  }, [charger, maximum]);

  return { proprietes, chargement, erreur, recharger: charger };
}

/**
 * Charger une propriété par son identifiant.
 * @param {string} id
 */
export function usePropriete(id) {
  const [propriete, setPropriete] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    if (!id) return;

    if (API_BASE_URL) {
      // Mode production
      fetchProprieteParId(id)
        .then((donnees) => {
          setPropriete(donnees);
          setChargement(false);
        })
        .catch((err) => {
          setErreur(err.message || 'Propriété introuvable.');
          setChargement(false);
        });
    } else {
      const fictive = PROPRIETES_MOCK.find((p) => p.id === id);
      setPropriete(fictive || null);
      setErreur(fictive ? null : 'Propriété introuvable.');
      setChargement(false);
    }
  }, [id]);

  return { propriete, chargement, erreur };
}

/**
 * Charger les annonces de l'hôte connecté.
 * @param {string} utilisateurId
 */
export function useProprietesHote(utilisateurId) {
  const [proprietes, setProprietes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const charger = useCallback(async () => {
    if (!utilisateurId) {
      setProprietes([]);
      setChargement(false);
      return;
    }

    setChargement(true);
    setErreur(null);
    try {
      const donnees = await fetchProprietesHote(utilisateurId);
      setProprietes(donnees);
    } catch (err) {
      console.error('[useProprietesHote] Erreur :', err);
      setErreur(err.message || 'Erreur lors du chargement des annonces.');
      setProprietes(PROPRIETES_MOCK);
    } finally {
      setChargement(false);
    }
  }, [utilisateurId]);

  useEffect(() => {
    charger();
  }, [charger]);

  return { proprietes, chargement, erreur, recharger: charger };
}
