/**
 * mapsConfig.js
 * ──────────────────────────────────────────────
 * Configuration centrale pour les cartes Leaflet / OpenStreetMap
 *
 * Tuiles utilisées : OpenStreetMap (CARTO Voyager)
 * → Gratuit • Open Source • Idéal pour la production
 */

/** Tuile OpenStreetMap standard */
export const TILE_OSM = {
  url:         'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
};

/** Tuile CARTO Voyager (plus claire, meilleure lisibilité) */
export const TILE_CARTO_VOYAGER = {
  url:         'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
  subdomains:  'abcd',
  maxZoom:     20,
};

/** Tuile CARTO Light (très sobre, fond blanc) */
export const TILE_CARTO_LIGHT = {
  url:         'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
  subdomains:  'abcd',
  maxZoom:     19,
};

/** Tuile par défaut pour RentHub */
export const TILE_PAR_DEFAUT = TILE_CARTO_VOYAGER;

/** Zoom par défaut sur une propriété */
export const ZOOM_PROPRIETE = 14;

/** Zoom par défaut pour une ville */
export const ZOOM_VILLE = 12;

/** Centre par défaut : Maroc */
export const CENTRE_MAROC = { lat: 31.7917, lon: -7.0926 };
