/**
 * geocodingAPI.js
 * ──────────────────────────────────────────────
 * Service de géocodage utilisant Nominatim (OpenStreetMap)
 * Gratuit • Open Source • Aucune clé API requise
 *
 * Politique d'utilisation Nominatim :
 *  - Maximum 1 requête/seconde
 *  - Identifier votre application via le header User-Agent
 *  - https://nominatim.org/release-docs/develop/api/Search/
 */

const BASE_URL = 'https://nominatim.openstreetmap.org/search';

/** Cache en mémoire pour éviter les requêtes en double */
const cache = new Map();

/**
 * Convertit une chaîne de texte (ville, adresse) en coordonnées GPS.
 * @param {string} lieu - ex: "Marrakech", "Agadir, Maroc"
 * @returns {Promise<{ lat: number, lon: number } | null>}
 */
export async function geocoderLieu(lieu) {
  if (!lieu) return null;

  // Ajouter ", Maroc" si absent pour affiner la recherche
  const requete = lieu.toLowerCase().includes('maroc') ? lieu : `${lieu}, Maroc`;

  if (cache.has(requete)) return cache.get(requete);

  try {
    const params = new URLSearchParams({
      q:              requete,
      format:         'json',
      limit:          '1',
      countrycodes:   'ma',       // Restreindre au Maroc
      'accept-language': 'fr',
    });

    const response = await fetch(`${BASE_URL}?${params}`, {
      headers: {
        // Obligatoire selon la politique Nominatim
        'User-Agent': 'RentHub-Maroc/1.0 (renthub-maroc.ma)',
      },
    });

    if (!response.ok) throw new Error(`Nominatim HTTP ${response.status}`);

    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn('[Géocodage] Aucun résultat pour :', requete);
      return null;
    }

    const coordonnees = {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };

    cache.set(requete, coordonnees);
    return coordonnees;
  } catch (err) {
    console.error('[Géocodage] Erreur :', err.message);
    return null;
  }
}

/**
 * Coordonnées de secours pour les villes marocaines principales.
 * Utilisées si Nominatim est indisponible ou hors-line.
 */
export const COORDONNEES_VILLES_MAROC = {
  marrakech:  { lat: 31.6295,  lon: -7.9811  },
  casablanca: { lat: 33.5731,  lon: -7.5898  },
  agadir:     { lat: 30.4278,  lon: -9.5981  },
  tanger:     { lat: 35.7595,  lon: -5.8340  },
  fès:        { lat: 34.0181,  lon: -5.0078  },
  fes:        { lat: 34.0181,  lon: -5.0078  },
  essaouira:  { lat: 31.5085,  lon: -9.7595  },
  rabat:      { lat: 34.0209,  lon: -6.8416  },
  meknès:     { lat: 33.8935,  lon: -5.5473  },
  meknes:     { lat: 33.8935,  lon: -5.5473  },
  ouarzazate: { lat: 30.9189,  lon: -6.8934  },
  chefchaouen:{ lat: 35.1688,  lon: -5.2636  },
};

/**
 * Résolution rapide depuis le cache des villes sans appel réseau.
 * @param {string} ville
 * @returns {{ lat: number, lon: number } | null}
 */
export function coordonneesRapides(ville) {
  if (!ville) return null;
  const cle = ville.toLowerCase().trim();
  return COORDONNEES_VILLES_MAROC[cle] || null;
}
