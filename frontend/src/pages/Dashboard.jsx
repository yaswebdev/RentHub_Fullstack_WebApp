import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Home, Calendar, MessageSquare, LogOut, Settings,
  Star, MapPin, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronRight, Plus, User, Heart, Trash2, Pencil, Eye
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { useReservations, useHostReservations } from '../hooks/useReservations';
import { useFavorites } from '../context/FavoritesContext';
import { useProprietes, useProprietesHote } from '../hooks/useProprietes';
import { deconnexion } from '../api/authAPI';
import { supprimerPropriete } from '../api/proprietesAPI';
import { useToast } from '../context/ToastContext';
import { cn, formatDate } from '../lib/utils';
import { API_BASE_URL } from '../constants/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const STATUT_CONFIG = {
  confirmed:  { label: 'Confirmée',   color: 'text-green-600 bg-green-50 border-green-200',  icone: CheckCircle },
  pending:    { label: 'En attente',  color: 'text-amber-600 bg-amber-50 border-amber-200',   icone: AlertCircle },
  cancelled:  { label: 'Annulée',     color: 'text-red-600 bg-red-50 border-red-200',         icone: XCircle    },
  completed:  { label: 'Terminée',    color: 'text-slate-600 bg-slate-50 border-slate-200',   icone: CheckCircle},
  confirmé:   { label: 'Confirmée',   color: 'text-green-600 bg-green-50 border-green-200',   icone: CheckCircle },
  'en_attente':{ label: 'En attente', color: 'text-amber-600 bg-amber-50 border-amber-200',   icone: AlertCircle },
  annulé:     { label: 'Annulée',     color: 'text-red-600 bg-red-50 border-red-200',         icone: XCircle    },
  EN_ATTENTE: { label: 'En attente',  color: 'text-amber-600 bg-amber-50 border-amber-200',   icone: AlertCircle },
  CONFIRMEE:  { label: 'Confirmée',   color: 'text-green-600 bg-green-50 border-green-200',   icone: CheckCircle },
  PAYEE:      { label: 'Payée',       color: 'text-blue-600 bg-blue-50 border-blue-200',      icone: CheckCircle },
  ANNULEE:    { label: 'Annulée',     color: 'text-red-600 bg-red-50 border-red-200',         icone: XCircle    },
  REFUSEE:    { label: 'Refusée',     color: 'text-slate-600 bg-slate-50 border-slate-200',   icone: XCircle    },
  TERMINEE:   { label: 'Terminée',    color: 'text-slate-600 bg-slate-50 border-slate-200',   icone: CheckCircle },
};

export const Dashboard = () => {
  const { user, deconnecter } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const currentUserId = user?.id || user?.uid;
  const { reservations, chargement, annuler } = useReservations(currentUserId);
  const { reservations: hostReservations, chargement: chargementHost } = useHostReservations(currentUserId);
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { proprietes } = useProprietes();
  const { proprietes: hostProprietes, chargement: chargementHostProps, recharger: rechargerHostProps } = useProprietesHote(currentUserId);
  const [onglet, setOnglet] = useState('reservations');
  const [modeHote, setModeHote] = useState(false);
  const [occupancyDays, setOccupancyDays] = useState(90);
  const [deletingAnnonceId, setDeletingAnnonceId] = useState(null);
  const [confirmAnnonce, setConfirmAnnonce] = useState(null);
  const roleValue = user?.role?.toUpperCase?.();
  const effectiveRole = roleValue || (API_BASE_URL ? null : 'LOCATAIRE');
  const isHost = ['HOTE', 'ADMIN'].includes(effectiveRole);

  const mesFavoris = proprietes.filter(p => favorites.includes(p.id));

  const normalizeStatus = (value) => (value || '').toString().toUpperCase();
  const isActiveStatus = (value) => !['ANNULEE', 'REFUSEE', 'CANCELLED'].includes(normalizeStatus(value));
  const toStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const toDate = (value) => (value ? new Date(value) : null);
  const msPerDay = 24 * 60 * 60 * 1000;

  const hostReservationData = useMemo(
    () => hostReservations.filter((r) => isActiveStatus(r.status || r.statut)),
    [hostReservations]
  );

  const revenueSeries = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }).map((_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + idx, 1);
      const label = date.toLocaleDateString('fr-FR', { month: 'short' });
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        date,
      };
    });

    return months.map((month) => {
      const total = hostReservationData.reduce((sum, reservation) => {
        const start = toDate(reservation.dateDebut || reservation.startDate);
        if (!start) return sum;
        if (start.getFullYear() === month.date.getFullYear() && start.getMonth() === month.date.getMonth()) {
          const amount = Number(reservation.totalPrice || reservation.prixTotal || reservation.montant || 0);
          return sum + amount;
        }
        return sum;
      }, 0);

      return { name: month.label, revenus: Math.round(total) };
    });
  }, [hostReservationData]);

  const occupancyRate = useMemo(() => {
    const listingsCount = hostProprietes.length;
    if (!listingsCount) return 0;

    const today = toStartOfDay(new Date());
    const windowStart = new Date(today.getTime() - (occupancyDays - 1) * msPerDay);
    const windowEnd = new Date(today.getTime() + msPerDay);

    const bookedNights = hostReservationData.reduce((sum, reservation) => {
      const start = toDate(reservation.dateDebut || reservation.startDate);
      const end = toDate(reservation.dateFin || reservation.endDate);
      if (!start || !end) return sum;

      const startDay = toStartOfDay(start);
      const endDay = toStartOfDay(end);
      const overlapStart = startDay > windowStart ? startDay : windowStart;
      const overlapEnd = endDay < windowEnd ? endDay : windowEnd;
      const nights = Math.max(0, Math.ceil((overlapEnd - overlapStart) / msPerDay));
      return sum + nights;
    }, 0);

    const totalNights = occupancyDays * listingsCount;
    if (!totalNights) return 0;
    return Math.min(100, Math.round((bookedNights / totalNights) * 100));
  }, [hostProprietes.length, hostReservationData, occupancyDays]);

  const donneesOccupation = [
    { name: 'Occupé', value: occupancyRate, color: '#6366f1' },
    { name: 'Libre', value: Math.max(0, 100 - occupancyRate), color: '#e2e8f0' },
  ];

  const handleDeleteAnnonce = async (annonceId) => {
    setDeletingAnnonceId(annonceId);
    try {
      await supprimerPropriete(annonceId);
      toast('Annonce supprimee.', 'success');
      rechargerHostProps();
    } catch (err) {
      toast(err.message || 'Impossible de supprimer l\'annonce.', 'error');
    } finally {
      setDeletingAnnonceId(null);
    }
  };

  const requestDeleteAnnonce = (annonce) => {
    setConfirmAnnonce({ id: annonce.id, title: annonce.title });
  };

  useEffect(() => {
    if (!isHost) setModeHote(false);
  }, [isHost]);

  const handleDeconnexion = async () => {
    try {
      await deconnexion();
      deconnecter();
      navigate('/');
      toast('Déconnexion réussie', 'success');
    } catch {
      toast('Erreur lors de la déconnexion', 'error');
    }
  };

  const handleAnnuler = async (id) => {
    try {
      await annuler(id);
      toast('Réservation annulée', 'info');
    } catch {
      toast('Impossible d\'annuler la réservation', 'error');
    }
  };

  const stats = {
    total:      reservations.length,
    confirmées: reservations.filter((r) => ['confirmed', 'confirmé', 'CONFIRMEE', 'PAYEE'].includes(r.status || r.statut)).length,
    enAttente:  reservations.filter((r) => ['pending', 'en_attente', 'EN_ATTENTE'].includes(r.status || r.statut)).length,
    depenses:   reservations.reduce((acc, r) => acc + (r.totalPrice || r.prixTotal || 0), 0),
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="container mx-auto px-4">
        {/* ── En-tête profil ──────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=6366f1&color=fff&size=80`}
                alt={user?.displayName}
                className="h-16 w-16 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-lg"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                Bonjour, {user?.displayName?.split(' ')[0] || 'Voyageur'} 👋
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <span>{user?.email}</span>
                {effectiveRole && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-700">
                    {effectiveRole}
                  </span>
                )}
              </div>
            </div>
          </div>
          {isHost && (
            <div className="flex items-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-sm">
              <button
                onClick={() => setModeHote(false)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                  !modeHote ? "bg-primary-600 text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                Voyageur
              </button>
              <button
                onClick={() => setModeHote(true)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                  modeHote ? "bg-primary-600 text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                Mode Hôte
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {isHost && modeHote ? (
              <Link to="/host/annonces/nouveau">
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Nouvelle annonce
                </Button>
              </Link>
            ) : (
              <Link to="/search">
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Nouvelle réservation
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={handleDeconnexion} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
              <LogOut className="h-4 w-4 mr-2" /> Déconnexion
            </Button>
          </div>
        </div>

        {/* ── Statistiques ────────────────────────────────────── */}
        {!modeHote ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { titre: 'Réservations',    valeur: stats.total,                   couleur: 'from-primary-500 to-violet-500', icone: Calendar },
              { titre: 'Confirmées',      valeur: stats.confirmées,              couleur: 'from-green-500 to-emerald-500',  icone: CheckCircle  },
              { titre: 'En attente',      valeur: stats.enAttente,               couleur: 'from-amber-500 to-orange-500',   icone: AlertCircle   },
              { titre: 'Total dépensé',   valeur: `${stats.depenses.toLocaleString('fr-MA')} DH`, couleur: 'from-sky-500 to-blue-500', icone: Star },
            ].map((s, i) => (
              <Card key={i} className="overflow-hidden border-none shadow-sm dark:bg-slate-900">
                <CardContent className="p-5">
                  <div className={cn('inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br text-white mb-3', s.couleur)}>
                    <s.icone className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{s.titre}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.valeur}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Chart : Revenus */}
            <Card className="lg:col-span-2 shadow-sm border-none dark:bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg dark:text-white">Aperçu des revenus (DH)</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueSeries}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="revenus" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart : Occupation */}
            <Card className="shadow-sm border-none dark:bg-slate-900">
              <CardHeader className="pb-2 flex items-center justify-between">
                <CardTitle className="text-lg dark:text-white">Taux d'occupation</CardTitle>
                <select
                  className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-full px-3 py-1 border border-slate-200"
                  value={occupancyDays}
                  onChange={(e) => setOccupancyDays(Number(e.target.value))}
                >
                  <option value={30}>30 jours</option>
                  <option value={60}>60 jours</option>
                  <option value={90}>90 jours</option>
                  <option value={180}>180 jours</option>
                  <option value={365}>12 mois</option>
                </select>
              </CardHeader>
              <CardContent className="h-64 flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={donneesOccupation}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {donneesOccupation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center">
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{occupancyRate}%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Saison actuelle</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Onglets ─────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 border-b border-slate-200 dark:border-slate-800 mb-8">
          <button
            onClick={() => setOnglet('reservations')}
            className={cn(
              'pb-4 px-2 text-sm font-bold transition-all relative',
              onglet === 'reservations' ? 'text-primary-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            )}
          >
            Mes Réservations
            {onglet === 'reservations' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
          </button>
          <button
            onClick={() => setOnglet('favoris')}
            className={cn(
              'pb-4 px-2 text-sm font-bold transition-all relative',
              onglet === 'favoris' ? 'text-primary-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            )}
          >
            Ma Wishlist
            {onglet === 'favoris' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
          </button>
          {isHost && (
            <>
              <button
                onClick={() => setOnglet('hostReservations')}
                className={cn(
                  'pb-4 px-2 text-sm font-bold transition-all relative',
                  onglet === 'hostReservations' ? 'text-primary-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                )}
              >
                Réservations reçues
                {onglet === 'hostReservations' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
              </button>
              <button
                onClick={() => setOnglet('hostListings')}
                className={cn(
                  'pb-4 px-2 text-sm font-bold transition-all relative',
                  onglet === 'hostListings' ? 'text-primary-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                )}
              >
                Mes annonces
                {onglet === 'hostListings' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
              </button>
            </>
          )}
        </div>

        {/* ── Contenu des onglets ──────────────────────────────── */}
        {onglet === 'reservations' && (
          <div className="space-y-4">
            {chargement ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-2xl animate-pulse" />)}
              </div>
            ) : reservations.length === 0 ? (
              <Card className="p-12 text-center dark:bg-slate-900">
                <Calendar className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Aucune réservation</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Découvrez nos hébergements et réservez votre première escapade.</p>
                <Link to="/search">
                  <Button variant="primary">Explorer les hébergements</Button>
                </Link>
              </Card>
            ) : (
              reservations.map((r) => {
                const statut = STATUT_CONFIG[r.status] || STATUT_CONFIG[r.statut] || STATUT_CONFIG.pending;
                const Icone  = statut.icone;
                const dateDebut = r.startDate || r.dateDebut;
                const dateFin = r.endDate || r.dateFin;
                const nights = dateDebut && dateFin
                  ? Math.max(1, Math.ceil((new Date(dateFin) - new Date(dateDebut)) / (1000 * 60 * 60 * 24)))
                  : (r.nights || r.nombreNuits || '—');
                const canCancel = ['confirmed', 'confirmé', 'pending', 'en_attente', 'EN_ATTENTE', 'CONFIRMEE', 'PAYEE']
                  .includes(r.status || r.statut);
                return (
                  <Card key={r.id} className="overflow-hidden hover:shadow-md transition-shadow dark:bg-slate-900">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        <div className="w-full sm:w-36 h-32 sm:h-auto shrink-0 overflow-hidden rounded-t-3xl sm:rounded-l-3xl sm:rounded-tr-none">
                          <img
                            src={r.propertyImage || r.imagePropriete || 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80&w=400'}
                            alt={r.propertyTitle || r.titrePropriete}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                              {r.propertyTitle || r.titrePropriete}
                            </h3>
                            <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0', statut.color)}>
                              <Icone className="h-3 w-3" />
                              {statut.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(dateDebut)}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {nights} nuits</span>
                            <span className="font-bold text-slate-900 dark:text-white">{(r.totalPrice || r.prixTotal || 0).toLocaleString('fr-MA')} DH</span>
                          </div>
                          <div className="flex gap-2">
                            <Link to={`/property/${r.propertyId || r.proprieteId || r.annonceId}`}>
                              <Button size="sm" variant="outline">Voir le logement</Button>
                            </Link>
                            {canCancel && (
                              <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleAnnuler(r.id)}>
                                Annuler
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {onglet === 'favoris' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mesFavoris.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Heart className="h-16 w-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Votre wishlist est vide</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Ajoutez des logements en favoris pour les retrouver ici.</p>
                <Link to="/search">
                  <Button variant="primary">Parcourir les logements</Button>
                </Link>
              </div>
            ) : (
              mesFavoris.map((p) => (
                <Card key={p.id} className="overflow-hidden group dark:bg-slate-900">
                  <div className="relative h-48 overflow-hidden">
                    <img src={p.image || p.images?.[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <button 
                      onClick={() => toggleFavorite(p.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-md z-10"
                    >
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </button>
                    <div className="absolute bottom-3 left-3 bg-white/90 px-2 py-0.5 rounded text-[10px] font-bold">
                      {p.type}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 line-clamp-1">{p.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{p.ville || p.location}</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{p.pricePerNight || p.prixParNuit} DH <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">/nuit</span></p>
                      <Link to={`/property/${p.id}`}>
                        <Button size="xs" variant="outline">Voir</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {onglet === 'hostReservations' && isHost && (
          <div className="space-y-4">
            {chargementHost ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-2xl animate-pulse" />)}
              </div>
            ) : hostReservations.length === 0 ? (
              <Card className="p-12 text-center dark:bg-slate-900">
                <MessageSquare className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Aucune réservation reçue</h3>
                <p className="text-slate-500 dark:text-slate-400">Vos prochaines réservations apparaîtront ici.</p>
              </Card>
            ) : (
              hostReservations.map((r) => (
                <Card key={r.id} className="overflow-hidden hover:shadow-md transition-shadow dark:bg-slate-900">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full sm:w-36 h-32 sm:h-auto shrink-0 overflow-hidden rounded-t-3xl sm:rounded-l-3xl sm:rounded-tr-none">
                        <img
                          src={r.propertyImage || r.imagePropriete || 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80&w=400'}
                          alt={r.propertyTitle || r.titrePropriete}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                            {r.propertyTitle || r.titrePropriete}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0 text-slate-600 bg-slate-50 border-slate-200">
                            {r.status || r.statut}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(r.startDate || r.dateDebut)}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.nights || r.nombreNuits || '—'} nuits</span>
                          <span className="font-bold text-slate-900 dark:text-white">{(r.totalPrice || r.prixTotal || 0).toLocaleString('fr-MA')} DH</span>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/property/${r.propertyId || r.proprieteId || r.annonceId}`}>
                            <Button size="sm" variant="outline">Voir le logement</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {onglet === 'hostListings' && isHost && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chargementHostProps ? (
              [1, 2, 3].map((i) => <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-2xl animate-pulse" />)
            ) : hostProprietes.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Home className="h-16 w-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Aucune annonce</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Créez votre première annonce pour accueillir des voyageurs.</p>
                <Link to="/host/annonces/nouveau">
                  <Button variant="primary">Créer une annonce</Button>
                </Link>
              </div>
            ) : (
              hostProprietes.map((p) => (
                <Card key={p.id} className="overflow-hidden group dark:bg-slate-900">
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800'}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-3 left-3 bg-white/90 px-2 py-0.5 rounded text-[10px] font-bold">
                      {p.type || 'Logement'}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 line-clamp-1">{p.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{p.ville || p.location}</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{p.pricePerNight || p.prixParNuit} DH <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">/nuit</span></p>
                      <div className="flex items-center gap-2">
                        <Link to={`/host/annonces/${p.id}/editer`}>
                          <Button size="sm" variant="primary">
                            <Pencil className="h-4 w-4" /> Editer
                          </Button>
                        </Link>
                        <Link to={`/property/${p.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" /> Voir
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500"
                          isLoading={deletingAnnonceId === p.id}
                          onClick={() => requestDeleteAnnonce(p)}
                        >
                          <Trash2 className="h-4 w-4" /> Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {confirmAnnonce && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Supprimer cette annonce ?</h3>
                <p className="text-sm text-slate-500 mt-2">
                  "{confirmAnnonce.title}" sera supprimee definitivement.
                </p>
              </div>
              <div className="p-6 flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={() => setConfirmAnnonce(null)}>
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  isLoading={deletingAnnonceId === confirmAnnonce.id}
                  onClick={() => {
                    const id = confirmAnnonce.id;
                    setConfirmAnnonce(null);
                    handleDeleteAnnonce(id);
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
