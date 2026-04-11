import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Fusionne des classes CSS Tailwind sans conflits.
 * @param {...any} inputs
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un montant en Dirham Marocain (MAD).
 * @param {number} montant
 * @returns {string}  ex: "1 200 DH"
 */
export function formatCurrency(montant) {
  return `${Number(montant).toLocaleString('fr-MA')} DH`;
}

/**
 * Extrait la chaîne de localisation d'une propriété
 * @param {object|string} location
 */
export function getLocationString(location) {
  if (typeof location === 'string') return location;
  if (location && typeof location === 'object') {
    return [location.city, location.state, location.address].filter(Boolean).join(', ');
  }
  return '';
}

/**
 * Formater une date ISO en format lisible (fr-MA)
 * @param {string} dateStr
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-MA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Calculer le nombre de nuits entre deux dates
 * @param {string} dateDebut
 * @param {string} dateFin
 */
export function calculerNuits(dateDebut, dateFin) {
  if (!dateDebut || !dateFin) return 0;
  const d1 = new Date(dateDebut);
  const d2 = new Date(dateFin);
  return Math.max(0, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
}
