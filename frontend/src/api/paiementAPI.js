/**
 * api/paiementAPI.js
 * ──────────────────────────────────────────────────────────────────
 * Paiements Stripe (intent + confirmation).
 */

import apiClient from './client';
import { ENDPOINTS } from '../constants/api';

export async function createCheckoutSession(reservationId, successUrl, cancelUrl) {
  const { data } = await apiClient.post(ENDPOINTS.PAIEMENT_CHECKOUT_SESSION, {
    reservationId,
    successUrl,
    cancelUrl,
  });
  return data;
}

export async function syncCheckoutSession(sessionId) {
  const { data } = await apiClient.post('/api/paiements/checkout-session/sync', {
    sessionId,
  });
  return data;
}

export async function createPaymentIntent(reservationId) {
  const { data } = await apiClient.post(ENDPOINTS.PAIEMENT_CREATE_INTENT, { reservationId });
  return data;
}

export async function confirmPaymentIntent(paymentIntentId, paymentMethodId) {
  const { data } = await apiClient.post(ENDPOINTS.PAIEMENT_CONFIRM, { paymentIntentId, paymentMethodId });
  return data;
}
