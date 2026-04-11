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
import { fetchProprietes, fetchProprieteParId } from '../api/proprietesAPI';
import { API_BASE_URL } from '../constants/api';
import { PROPRIETES_MOCK } from '../mocks/index';

// Imports mode dev uniquement
import { db, collection, onSnapshot, query, limit, doc } from '../firebase';

const VILLES_MAROC = [
  'marrakech', 'casablanca', 'agadir', 'tanger', 'fès', 'fes',
  'rabat', 'essaouira', 'meknès', 'ouarzazate', 'tétouan', 'tetouan',
  'maroc', 'morocco',
];

const estMarocaine = (p) => {
  const loc = typeof p.location === 'string' ? p.location.toLowerCase() : '';
  const ville = (p.ville || '').toLowerCase();
  return VILLES_MAROC.some((v) => loc.includes(v) || ville.includes(v));
};

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
    } else {
      // Mode développement → écoute temps réel (Firestore local)
      const q = query(collection(db, 'properties'), limit(maximum));
      const desabonner = onSnapshot(
        q,
        (snapshot) => {
          const toutes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          const marocaines = toutes.filter(estMarocaine);
          setProprietes(marocaines.length > 0 ? marocaines : PROPRIETES_MOCK);
          setChargement(false);
        },
        () => {
          setProprietes(PROPRIETES_MOCK);
          setChargement(false);
        }
      );
      return desabonner;
    }
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
      // Mode développement → écoute temps réel
      const desabonner = onSnapshot(
        doc(db, 'properties', id),
        (docSnap) => {
          if (docSnap.exists()) {
            setPropriete({ id: docSnap.id, ...docSnap.data() });
          } else {
            // Chercher dans les données fictives
            const fictive = PROPRIETES_MOCK.find((p) => p.id === id);
            if (fictive) {
              setPropriete(fictive);
            } else {
              setErreur('Propriété introuvable.');
            }
          }
          setChargement(false);
        },
        (err) => {
          console.error('[usePropriete] Erreur :', err);
          const fictive = PROPRIETES_MOCK.find((p) => p.id === id);
          setPropriete(fictive || null);
          setErreur(fictive ? null : 'Impossible de charger la propriété.');
          setChargement(false);
        }
      );
      return desabonner;
    }
  }, [id]);

  return { propriete, chargement, erreur };
}
