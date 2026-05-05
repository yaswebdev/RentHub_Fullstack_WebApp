import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ArrowLeft, MessageCircle, Search, User } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../constants/api';
import {
  fetchChats,
  fetchMessages,
  envoyerMessage,
  abonnerMessages,
} from '../api/chatAPI';

export const Chat = () => {
  const { id: chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesFin = useRef(null);
  const currentUserId = user?.id || user?.uid;
  const normalizeChatId = (value) => (value == null ? null : String(value));

  const [chats, setChats] = useState([]);
  const [chatActif, setChatActif] = useState(normalizeChatId(chatId));
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const [chargementChats, setChargementChats] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [recherche, setRecherche] = useState('');

  // Charger la liste des conversations
  useEffect(() => {
    if (!currentUserId) return;
    fetchChats(currentUserId)
      .then((data) => { setChats(data); setChargementChats(false); })
      .catch(() => setChargementChats(false));
  }, [currentUserId]);

  // Abonnement aux messages du chat actif
  useEffect(() => {
    if (!chatActif) return;
    const desabonner = abonnerMessages(chatActif, (msgs) => {
      setMessages(msgs.sort((a, b) => {
        const ta = a.createdAt?.toDate?.()?.getTime?.()
          ?? (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const tb = b.createdAt?.toDate?.()?.getTime?.()
          ?? (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return ta - tb;
      }));
    });
    return desabonner;
  }, [chatActif]);

  const scrollToBottom = () => {
    messagesFin.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEnvoyer = async (e) => {
    e.preventDefault();
    if (!texte.trim() || !chatActif || !user) return;
    const userMsg = texte.trim();
    setEnvoi(true);
    try {
      await envoyerMessage(chatActif, userMsg, currentUserId);
      setTexte('');
      scrollToBottom();
      if (!API_BASE_URL) {
        // Simulation d'une réponse de l'hôte après 2 secondes (mode dev)
        setTimeout(async () => {
          const responses = [
            "C'est entendu ! Je vérifie ça pour vous.",
            "Super choix ! Le logement sera prêt pour votre arrivée.",
            "Bonjour ! Bien sûr, la piscine est chauffée.",
            "Pas de souci, j'ai bien pris note de votre demande.",
          ];
          const randomRes = responses[Math.floor(Math.random() * responses.length)];
          const autreId = chatActifData?.participantDetails
            ? Object.keys(chatActifData.participantDetails).find(id => id !== user?.uid)
            : 'host_id';

          await envoyerMessage(chatActif, randomRes, autreId || 'host_id');
        }, 2000);
      }
    } catch (err) {
      console.error('[Chat] Erreur envoi :', err);
    } finally {
      setEnvoi(false);
    }
  };

  const chatsFiltrés = chats.filter((c) => {
    const titre = c.propertyTitle || c.proprieteTitre || c.annonceTitre || '';
    return titre.toLowerCase().includes(recherche.toLowerCase());
  });

  const chatActifData = chats.find((c) => normalizeChatId(c.id) === chatActif);
  const autrePseudo = chatActifData?.otherUserName
    || (chatActifData?.participantDetails
      ? Object.entries(chatActifData.participantDetails).find(([id]) => id !== user?.uid)?.[1]?.name
      : 'Conversation');

  return (
    <div className="pt-20 min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* ── Liste des conversations ──────────────────────────── */}
      <div className={cn(
        'w-full md:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-colors',
        chatActif && 'hidden md:flex'
      )}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-display font-bold text-slate-900 dark:text-white text-2xl mb-6">Messages</h2>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 gap-3">
            <Search className="h-5 w-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-700 dark:text-slate-200"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {chargementChats ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />)}
            </div>
          ) : chatsFiltrés.length === 0 ? (
            <div className="text-center p-12">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">Aucune discussion trouvée</p>
            </div>
          ) : (
            chatsFiltrés.map((chat) => {
              const nomAutre = chat.otherUserName
                || (chat.participantDetails
                  ? Object.entries(chat.participantDetails).find(([id]) => id !== user?.uid)?.[1]?.name
                  : 'Utilisateur');
              const photoAutre = chat.participantDetails
                ? Object.entries(chat.participantDetails).find(([id]) => id !== user?.uid)?.[1]?.photo
                : null;
              const estSelectionné = chatActif === normalizeChatId(chat.id);
              
              return (
                <button
                  key={chat.id}
                  className={cn(
                    'w-full p-4 mx-0 text-left transition-all flex items-center gap-4 relative group',
                    estSelectionné 
                      ? 'bg-primary-50 dark:bg-primary-900/20' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  )}
                  onClick={() => {
                    const nextId = normalizeChatId(chat.id);
                    setChatActif(nextId);
                    navigate(`/chat/${nextId}`);
                  }}
                >
                  {estSelectionné && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r-full" />}
                  <div className="relative shrink-0">
                    <img
                      src={photoAutre || `https://ui-avatars.com/api/?name=${encodeURIComponent(nomAutre)}&background=6366f1&color=fff&size=100`}
                      alt={nomAutre}
                      className="h-14 w-14 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{nomAutre}</p>
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Il y a 2m</span>
                    </div>
                    <p className={cn(
                      "text-sm truncate",
                      estSelectionné ? "text-primary-700 dark:text-primary-400 font-medium" : "text-slate-500 dark:text-slate-400"
                    )}>
                      {chat.lastMessage || chat.propertyTitle || chat.proprieteTitre || 'Cliquez pour discuter'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Zone de messages ─────────────────────────────────── */}
      {chatActif ? (
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 transition-colors shadow-2xl">
          {/* En-tête du chat */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <button
                className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => { setChatActif(null); navigate('/chat'); }}
              >
                <ArrowLeft className="h-6 w-6 text-slate-500" />
              </button>
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center border border-primary-100 dark:border-primary-800">
                  <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white leading-none mb-1">{autrePseudo}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider">En ligne</p>
                </div>
              </div>
            </div>
            
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/20">
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                  <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-4">
                    <MessageCircle className="h-10 w-10 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
                    Commencez à discuter avec l'hôte
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const senderId = msg.senderId || msg.expediteurId;
                  const prevSenderId = messages[idx - 1]?.senderId || messages[idx - 1]?.expediteurId;
                  const estMoi = senderId === currentUserId;
                  const showAvatar = idx === 0 || prevSenderId !== senderId;
                  
                  return (
                    <motion.div
                      key={msg.id || idx}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={cn('flex items-end gap-3', estMoi ? 'justify-end' : 'justify-start')}
                    >
                      {!estMoi && showAvatar && (
                        <div className="h-8 w-8 rounded-full bg-slate-200 shrink-0 overflow-hidden hidden sm:block">
                           <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(autrePseudo)}&background=6366f1&color=fff`} className="h-full w-full object-cover" />
                        </div>
                      )}
                      {!estMoi && !showAvatar && <div className="w-8 hidden sm:block shrink-0" />}
                      
                      <div className={cn(
                        'max-w-[75%] md:max-w-md px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm relative',
                        estMoi
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-100 dark:border-slate-700'
                      )}>
                        {msg.text || msg.contenu}
                        <span className={cn(
                           "absolute -bottom-5 text-[9px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap",
                           estMoi ? "right-0" : "left-0"
                        )}>
                          12:3{idx} PM
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
            <div ref={messagesFin} />
          </div>

          {/* Zone de saisie */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <form onSubmit={handleEnvoyer} className="max-w-4xl mx-auto flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-3xl p-1.5 pl-5 group transition-all">
              <input
                type="text"
                placeholder="Écrire à votre hôte..."
                className="flex-1 bg-transparent border-none py-3 text-sm text-slate-800 dark:text-white focus:outline-none outline-none ring-0 placeholder:text-slate-400 font-medium"
                value={texte}
                onChange={(e) => setTexte(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnvoyer(e); }}}
              />
              <button 
                type="submit" 
                disabled={!texte.trim() || envoi}
                className={cn(
                  "p-3 rounded-2xl transition-all duration-300 transform active:scale-95",
                  texte.trim() 
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700" 
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                )}
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-center bg-slate-50 dark:bg-slate-950 transition-colors">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-xl mx-auto mb-8 transform hover:rotate-6 transition-transform">
              <MessageCircle className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Messagerie Sécurisée</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto leading-relaxed font-medium">
              Discutez directement avec les hôtes pour finaliser les détails de votre séjour au Maroc.
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
};
