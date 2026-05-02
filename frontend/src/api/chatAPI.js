/**
 * api/chatAPI.js
 * ──────────────────────────────────────────────────────────────────
 * Service de messagerie entre voyageurs et hôtes.
 * TODO (Backend) : Remplacer chaque fonction par un vrai appel API.
 * ──────────────────────────────────────────────────────────────────
 */

import apiClient from './client';
import { ENDPOINTS, API_BASE_URL } from '../constants/api';
import {
  db, collection, addDoc, getDocs, onSnapshot,
  query, where, serverTimestamp,
} from '../firebase';

const normalizeConversation = (dto) => ({
  id: dto.reservationId,
  reservationId: dto.reservationId,
  propertyTitle: dto.annonceTitre,
  otherUserName: dto.autreUtilisateurNom,
  otherUserId: dto.autreUtilisateurId,
  lastMessage: dto.dernierMessage || '',
  unreadCount: dto.messagesNonLus || 0,
});

const normalizeMessage = (dto) => ({
  id: dto.id,
  text: dto.contenu,
  senderId: dto.expediteurId,
  senderName: dto.expediteurNom,
  createdAt: dto.dateEnvoi,
  reservationId: dto.reservationId,
  raw: dto,
});

/**
 * Récupérer les conversations d'un utilisateur
 * TODO (Backend) : GET /api/messages/conversations
 */
export async function fetchChats(utilisateurId) {
  if (API_BASE_URL) {
    const { data } = await apiClient.get(ENDPOINTS.CONVERSATIONS);
    return data.map(normalizeConversation);
  }

  // Mode dev : requête locale (Firestore émulé)
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('participants', 'array-contains', utilisateurId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Récupérer les messages d'une conversation
 * TODO (Backend) : GET /api/messages/reservation/:reservationId
 */
export async function fetchMessages(reservationId) {
  if (API_BASE_URL) {
    const { data } = await apiClient.get(ENDPOINTS.MESSAGES(reservationId));
    return data.map(normalizeMessage);
  }

  // Mode dev
  const messagesRef = collection(db, 'chats', String(reservationId), 'messages');
  const snapshot = await getDocs(messagesRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Envoyer un message
 * TODO (Backend) : POST /api/messages  { reservationId, contenu }
 */
export async function envoyerMessage(reservationId, contenu, envoyeurId) {
  if (API_BASE_URL) {
    const { data } = await apiClient.post(ENDPOINTS.ENVOYER_MESSAGE, {
      reservationId,
      contenu,
    });
    return normalizeMessage(data);
  }

  // Mode dev
  const ref = await addDoc(collection(db, 'chats', String(reservationId), 'messages'), {
    text: contenu,
    senderId: envoyeurId,
    createdAt: serverTimestamp(),
    read: false,
  });
  return { id: ref.id, contenu };
}

/**
 * Créer une nouvelle conversation
 * TODO (Backend) : conversations liées aux réservations (pas de création explicite)
 */
export async function creerChat(participants, proprieteId, proprieteTitre, detailsParticipants) {
  if (API_BASE_URL) {
    throw new Error('Les conversations sont liées aux réservations. Utilisez une réservation existante.');
  }

  // Mode dev
  const ref = await addDoc(collection(db, 'chats'), {
    participants,
    participantDetails: detailsParticipants || {},
    proprieteId,
    proprieteTitre,
    lastMessage: '',
    lastMessageTime: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return { id: ref.id };
}

/**
 * Abonnement temps réel aux messages (WebSocket ou SSE côté backend)
 * TODO (Backend) : Implémenter via Socket.io ou Server-Sent Events
 */
export function abonnerMessages(reservationId, callback) {
  if (API_BASE_URL) {
    let cancelled = false;
    const poll = async () => {
      try {
        const msgs = await fetchMessages(reservationId);
        if (!cancelled) callback(msgs);
      } catch {
        // ignore polling errors
      }
    };
    poll();
    const intervalId = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }

  // Mode dev : onSnapshot Firestore
  const messagesRef = collection(db, 'chats', String(reservationId), 'messages');
  return onSnapshot(messagesRef, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(messages);
  });
}
