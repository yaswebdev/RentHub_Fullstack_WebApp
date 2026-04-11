/**
 * firebase.js
 * ──────────────────────────────────────────────────────────────────
 * Émulateur Firebase local basé sur localStorage.
 * Utilisé en mode développement (sans backend).
 *
 * Quand VITE_API_URL est défini, ce fichier n'est PAS utilisé
 * pour les données — seulement éventuellement pour l'auth Google.
 * ──────────────────────────────────────────────────────────────────
 */

const CLE_STOCKAGE = 'renthub.local.db';
const CLE_AUTH    = 'renthub.local.auth';

const nowIso = () => new Date().toISOString();
const makeId = () => Math.random().toString(36).slice(2, 11);

export const serverTimestamp = () => ({ toDate: () => new Date() });

const getStoreInitial = () => ({
  users: {},
  properties: {},
  bookings: {},
  chats: {},
  messages: {},
});

let store = (() => {
  try {
    const raw = localStorage.getItem(CLE_STOCKAGE);
    return raw ? JSON.parse(raw) : getStoreInitial();
  } catch {
    return getStoreInitial();
  }
})();

const persisterStore = () => localStorage.setItem(CLE_STOCKAGE, JSON.stringify(store));

const ecouteurs = new Set();
const emettre  = () => ecouteurs.forEach((fn) => fn());
const abonner  = (fn) => { ecouteurs.add(fn); return () => ecouteurs.delete(fn); };

/* ── Auth ────────────────────────────────────────────────────────── */
export const auth          = { currentUser: null };
export const googleProvider = {};
export const db            = {};

try {
  const raw = localStorage.getItem(CLE_AUTH);
  if (raw) auth.currentUser = JSON.parse(raw);
} catch {
  auth.currentUser = null;
}

const persisterAuth = () => {
  if (auth.currentUser) localStorage.setItem(CLE_AUTH, JSON.stringify(auth.currentUser));
  else localStorage.removeItem(CLE_AUTH);
};

export const onAuthStateChanged = (_auth, cb) => {
  cb(auth.currentUser);
  return abonner(() => cb(auth.currentUser));
};

export const signInWithPopup = async () => {
  const uid = `user-${makeId()}`;
  auth.currentUser = {
    uid,
    displayName: 'Utilisateur Local',
    email:       `local-${uid}@renthub.local`,
    photoURL:    null,
  };
  persisterAuth();
  emettre();
  return { user: auth.currentUser };
};

export const signOut = async () => {
  auth.currentUser = null;
  persisterAuth();
  emettre();
};

/* ── Helpers de collection ────────────────────────────────────────── */
const parseCheminCollection = (chemin) => {
  const parties = chemin.split('/').filter(Boolean);
  if (parties.length === 1) return { collection: parties[0], cleImbriquee: null };
  if (parties.length === 3 && parties[0] === 'chats' && parties[2] === 'messages') {
    return { collection: 'messages', cleImbriquee: `chats:${parties[1]}:messages` };
  }
  return { collection: parties[0], cleImbriquee: null };
};

const getDocumentsCollection = (chemin) => {
  const { collection: col, cleImbriquee } = parseCheminCollection(chemin);
  if (col === 'messages' && cleImbriquee) {
    store.messages                = store.messages || {};
    store.messages[cleImbriquee]  = store.messages[cleImbriquee] || {};
    return store.messages[cleImbriquee];
  }
  store[col] = store[col] || {};
  return store[col];
};

/* ── API Firestore émulée ────────────────────────────────────────── */
export const collection = (_db, ...segments) => ({ kind: 'collection', path: segments.join('/') });
export const doc        = (_db, col, id)     => ({ kind: 'doc', collection: col, id });

export const where   = (field, op, value) => ({ kind: 'where', field, op, value });
export const orderBy = (field, dir = 'asc') => ({ kind: 'orderBy', field, dir });
export const limit   = (count) => ({ kind: 'limit', count });
export const query   = (collectionRef, ...contraintes) => ({ kind: 'query', collection: collectionRef, contraintes });

const appliquerQuery = (queryRef) => {
  let entrees = Object.entries(getDocumentsCollection(queryRef.collection.path)).map(([id, data]) => ({ id, data }));

  for (const c of queryRef.contraintes) {
    if (c.kind === 'where') {
      entrees = entrees.filter((e) => {
        const val = e.data[c.field];
        if (c.op === '==')             return val === c.value;
        if (c.op === 'array-contains') return Array.isArray(val) && val.includes(c.value);
        return false;
      });
    }
    if (c.kind === 'orderBy') {
      const dir = c.dir === 'desc' ? -1 : 1;
      entrees = entrees.sort((a, b) => {
        const av = a.data[c.field];
        const bv = b.data[c.field];
        const ad = av?.toDate ? av.toDate().getTime() : new Date(av ?? 0).getTime();
        const bd = bv?.toDate ? bv.toDate().getTime() : new Date(bv ?? 0).getTime();
        return (ad - bd) * dir;
      });
    }
    if (c.kind === 'limit') entrees = entrees.slice(0, c.count);
  }
  return entrees;
};

const makeDocSnapshot  = (id, data) => ({ id, exists: () => !!data, data: () => data });
const makeQuerySnapshot = (entrees) => ({
  docs:    entrees.map((e) => makeDocSnapshot(e.id, e.data)),
  forEach: (cb) => entrees.forEach((e) => cb(makeDocSnapshot(e.id, e.data))),
});

export const onSnapshot = (ref, next, err) => {
  const executer = () => {
    try {
      if (ref.kind === 'doc') {
        const docs = store[ref.collection] || {};
        next(makeDocSnapshot(ref.id, docs[ref.id]));
        return;
      }
      next(makeQuerySnapshot(appliquerQuery(ref)));
    } catch (e) {
      if (err) err(e);
    }
  };
  executer();
  return abonner(executer);
};

export const getDoc  = async (ref)        => makeDocSnapshot(ref.id, (store[ref.collection] || {})[ref.id]);
export const getDocs = async (queryRef)   => makeQuerySnapshot(appliquerQuery(queryRef));

export const setDoc    = async (ref, data) => {
  store[ref.collection] = store[ref.collection] || {};
  store[ref.collection][ref.id] = data;
  persisterStore(); emettre();
};

export const addDoc   = async (ref, data) => {
  const docs = getDocumentsCollection(ref.path);
  const id   = makeId();
  docs[id]   = data;
  persisterStore(); emettre();
  return { id };
};

export const updateDoc = async (ref, data) => {
  store[ref.collection] = store[ref.collection] || {};
  const existant = store[ref.collection][ref.id] || {};
  store[ref.collection][ref.id] = { ...existant, ...data };
  persisterStore(); emettre();
};

export const deleteDoc = async (ref) => {
  if (!store[ref.collection]) return;
  delete store[ref.collection][ref.id];
  persisterStore(); emettre();
};
