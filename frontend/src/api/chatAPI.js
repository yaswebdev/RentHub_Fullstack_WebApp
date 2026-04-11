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
  query, where, serverTimestamp, doc,
} from '../firebase';

/**
 * Récupérer les conversations d'un utilisateur
 * TODO (Backend) : GET /api/chats
 */
export async function fetchChats(utilisateurId) {
  if (API_BASE_URL) {
    const { data } = await apiClient.get(ENDPOINTS.CHATS);
    return data;
  }

  // Mode dev : requête locale (Firestore émulé)
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('participants', 'array-contains', utilisateurId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Récupérer les messages d'une conversation
 * TODO (Backend) : GET /api/chats/:chatId/messages
 */
export async function fetchMessages(chatId) {
  if (API_BASE_URL) {
    const { data } = await apiClient.get(ENDPOINTS.MESSAGES(chatId));
    return data;
  }

  // Mode dev
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const snapshot = await getDocs(messagesRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Envoyer un message
 * TODO (Backend) : POST /api/chats/:chatId/messages  { contenu, type }
 */
export async function envoyerMessage(chatId, contenu, envoyeurId) {
  if (API_BASE_URL) {
    const { data } = await apiClient.post(ENDPOINTS.ENVOYER_MESSAGE(chatId), {
      contenu,
      envoyeurId,
    });
    return data;
  }

  // Mode dev
  const ref = await addDoc(collection(db, 'chats', chatId, 'messages'), {
    text: contenu,
    senderId: envoyeurId,
    createdAt: serverTimestamp(),
    read: false,
  });
  return { id: ref.id, contenu };
}

/**
 * Créer une nouvelle conversation
 * TODO (Backend) : POST /api/chats  { participants: [id1, id2], proprieteId }
 */
export async function creerChat(participants, proprieteId, proprieteTitre, detailsParticipants) {
  if (API_BASE_URL) {
    const { data } = await apiClient.post(ENDPOINTS.CREER_CHAT, {
      participants,
      proprieteId,
      proprieteTitre,
    });
    return data;
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
export function abonnerMessages(chatId, callback) {
  if (API_BASE_URL) {
    // TODO (Backend) : connexion WebSocket
    // const socket = io(API_BASE_URL);
    // socket.on(`messages:${chatId}`, callback);
    // return () => socket.off(`messages:${chatId}`, callback);
    console.warn('[Chat] Temps réel non implémenté avec backend REST.');
    return () => {};
  }

  // Mode dev : onSnapshot Firestore
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  return onSnapshot(messagesRef, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(messages);
  });
}
