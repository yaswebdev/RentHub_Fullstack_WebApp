import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search, MapPin, Star, ChevronRight, Shield, Heart, Sparkles, ArrowRight
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useProprietes } from '../hooks/useProprietes';
import { useFavorites } from '../context/FavoritesContext';
import { cn } from '../lib/utils';
import { CardSkeleton } from '../components/Skeleton';

const VILLES = ['Marrakech', 'Casablanca', 'Agadir', 'Tanger', 'Fès', 'Essaouira'];

const AVANTAGES = [
  { icone: <Shield className="h-6 w-6" />,    titre: 'Réservation sécurisée',    desc: 'Paiements protégés à chaque réservation.' },
  { icone: <Star   className="h-6 w-6" />,    titre: 'Hôtes vérifiés',          desc: 'Chaque hôte est contrôlé et noté par nos voyageurs.' },
  { icone: <MapPin className="h-6 w-6" />,    titre: 'Tout le Maroc',           desc: 'Des centaines de logements dans les plus belles villes.' },
];

const CATEGORIES = [
  {
    id: 'riad',
    label: 'Riads',
    desc: 'Architecture andalouse',
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50 group-hover:bg-amber-100',
    border: 'border-amber-200 group-hover:border-amber-400',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="4" y="22" width="32" height="14" rx="2" fill="white" fillOpacity="0.3"/>
        <rect x="8" y="22" width="4" height="14" fill="white" fillOpacity="0.5"/>
        <rect x="28" y="22" width="4" height="14" fill="white" fillOpacity="0.5"/>
        <path d="M16 36V28a4 4 0 018 0v8" fill="white" fillOpacity="0.7"/>
        <path d="M6 22C6 16 10 10 20 8C30 10 34 16 34 22" fill="white" fillOpacity="0.4"/>
        <ellipse cx="20" cy="8" rx="3" ry="4" fill="white" fillOpacity="0.9"/>
        <circle cx="10" cy="22" r="1.5" fill="white"/>
        <circle cx="20" cy="20" r="1.5" fill="white"/>
        <circle cx="30" cy="22" r="1.5" fill="white"/>
        <path d="M6 22h28" stroke="white" strokeWidth="1.5" strokeOpacity="0.6"/>
      </svg>
    ),
  },
  {
    id: 'villa',
    label: 'Villas',
    desc: 'Piscine & jardin',
    gradient: 'from-emerald-400 to-teal-500',
    bg: 'bg-emerald-50 group-hover:bg-emerald-100',
    border: 'border-emerald-200 group-hover:border-emerald-400',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="6" y="20" width="28" height="16" rx="2" fill="white" fillOpacity="0.35"/>
        <path d="M4 22L20 10L36 22" fill="white" fillOpacity="0.6"/>
        <rect x="16" y="26" width="8" height="10" rx="1" fill="white" fillOpacity="0.7"/>
        <rect x="8" y="24" width="6" height="5" rx="1" fill="white" fillOpacity="0.5"/>
        <rect x="26" y="24" width="6" height="5" rx="1" fill="white" fillOpacity="0.5"/>
        <ellipse cx="30" cy="34" rx="5" ry="2.5" fill="white" fillOpacity="0.4"/>
        <path d="M25 34 Q27 31 30 31 Q33 31 35 34" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" fill="none"/>
      </svg>
    ),
  },
  {
    id: 'appartement',
    label: 'Appartements',
    desc: 'Vie citadine',
    gradient: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-50 group-hover:bg-blue-100',
    border: 'border-blue-200 group-hover:border-blue-400',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="8" y="6" width="24" height="30" rx="2" fill="white" fillOpacity="0.35"/>
        <rect x="12" y="10" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.8"/>
        <rect x="20" y="10" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.8"/>
        <rect x="28" y="10" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.5"/>
        <rect x="12" y="18" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.8"/>
        <rect x="20" y="18" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.5"/>
        <rect x="28" y="18" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.8"/>
        <rect x="12" y="26" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.5"/>
        <rect x="20" y="26" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.8"/>
        <rect x="28" y="26" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.8"/>
        <rect x="6" y="4" width="4" height="32" rx="1" fill="white" fillOpacity="0.2"/>
      </svg>
    ),
  },
  {
    id: 'studio',
    label: 'Studios',
    desc: 'Cosy & moderne',
    gradient: 'from-violet-400 to-purple-500',
    bg: 'bg-violet-50 group-hover:bg-violet-100',
    border: 'border-violet-200 group-hover:border-violet-400',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="4" y="18" width="32" height="14" rx="3" fill="white" fillOpacity="0.4"/>
        <rect x="4" y="28" width="32" height="4" rx="1" fill="white" fillOpacity="0.3"/>
        <rect x="8" y="14" width="24" height="4" rx="1" fill="white" fillOpacity="0.5"/>
        <rect x="14" y="32" width="4" height="4" rx="1" fill="white" fillOpacity="0.6"/>
        <rect x="22" y="32" width="4" height="4" rx="1" fill="white" fillOpacity="0.6"/>
        <circle cx="28" cy="23" r="2.5" fill="white" fillOpacity="0.7"/>
        <path d="M8 23 Q11 20 14 23" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" fill="none"/>
        <path d="M18 21h4" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'dar',
    label: 'Dars',
    desc: 'Maison de famille',
    gradient: 'from-rose-400 to-pink-500',
    bg: 'bg-rose-50 group-hover:bg-rose-100',
    border: 'border-rose-200 group-hover:border-rose-400',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M4 24L20 10L36 24" fill="white" fillOpacity="0.5"/>
        <rect x="8" y="24" width="24" height="12" rx="1.5" fill="white" fillOpacity="0.35"/>
        <rect x="17" y="28" width="6" height="8" rx="1" fill="white" fillOpacity="0.75"/>
        <rect x="10" y="26" width="5" height="5" rx="1" fill="white" fillOpacity="0.55"/>
        <rect x="25" y="26" width="5" height="5" rx="1" fill="white" fillOpacity="0.55"/>
        <path d="M18 10V6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.7"/>
        <circle cx="20" cy="10" r="1.5" fill="white" fillOpacity="0.9"/>
      </svg>
    ),
  },
];

export const Home = () => {
  const [recherche, setRecherche] = useState('');
  const [categorieActive, setCategorieActive] = useState(null);
  const navigate = useNavigate();
  const { proprietes, chargement } = useProprietes({}, 6);
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(recherche)}`);
  };

  return (
    <div className="min-h-screen">
      {/* ── Héro ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Fond */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&q=80&w=1920"
            alt="Médina marocaine"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              N°1 de la location de vacances au Maroc
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight">
              Votre séjour parfait<br />
              <span className="bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">
                au Maroc
              </span>
            </h1>

            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
              Riads authentiques, villas avec piscine, studios modernes — découvrez des hébergements d'exception dans les plus belles villes du Maroc.
            </p>

            {/* Barre de recherche héro */}
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/10 backdrop-blur-xl rounded-2xl p-2 max-w-2xl mx-auto border border-white/20 shadow-2xl"
            >
              <div className="flex items-center flex-1 bg-white rounded-xl px-4 py-3">
                <MapPin className="h-5 w-5 text-primary-500 shrink-0 mr-3" />
                <input
                  type="text"
                  placeholder="Où souhaitez-vous séjourner ?"
                  className="flex-1 bg-transparent border-none focus:outline-none text-slate-900 text-sm placeholder:text-slate-400"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="rounded-xl shrink-0 px-8">
                <Search className="h-5 w-5 mr-2" /> Rechercher
              </Button>
            </form>

            {/* Villes populaires */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {VILLES.map((ville) => (
                <button
                  key={ville}
                  onClick={() => navigate(`/search?q=${ville}`)}
                  className="text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 transition-all duration-200 hover:scale-105"
                >
                  {ville}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Catégories ────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800 transition-colors">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">
              Quel type de logement ?
            </h2>
            <p className="text-slate-500">Filtrez par type et trouvez le logement de vos rêves</p>
          </div>
          <div className="flex flex-wrap justify-center gap-5">
            {CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setCategorieActive(cat.id === categorieActive ? null : cat.id); navigate(`/search?type=${cat.id}`); }}
                className={cn(
                  'group flex flex-col items-center gap-4 px-6 py-6 rounded-3xl border-2 transition-all duration-300 shadow-sm hover:shadow-xl min-w-[130px] w-36 text-center',
                  categorieActive === cat.id
                    ? `${cat.border} ${cat.bg} shadow-md`
                    : `border-slate-200 bg-white hover:${cat.bg} hover:${cat.border}`
                )}
              >
                {/* Icon bubble */}
                <div className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center p-3 transition-all duration-300 bg-gradient-to-br shadow-lg',
                  cat.gradient,
                  categorieActive === cat.id ? 'shadow-xl scale-110' : 'group-hover:scale-110 group-hover:shadow-xl'
                )}>
                  {cat.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-0.5">{cat.label}</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight">{cat.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Propriétés en vedette ─────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-slate-950 transition-colors">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">
                Hébergements en vedette
              </h2>
              <p className="text-slate-500">Sélectionnés par notre équipe pour vous</p>
            </div>
            <Link to="/search" className="hidden md:flex items-center text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              Tout voir <ChevronRight className="h-5 w-5 ml-1" />
            </Link>
          </div>

          {chargement ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {proprietes.slice(0, 6).map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link to={`/property/${p.id}`}>
                    <Card hover className="group overflow-hidden cursor-pointer">
                      <div className="relative h-56 overflow-hidden rounded-t-3xl">
                        <img
                          src={p.image || p.images?.[0]}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-800">
                          {p.type}
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavorite(p.id);
                          }}
                          className="absolute top-3 right-3 p-2 rounded-full bg-white/50 backdrop-blur-md hover:bg-white transition-all duration-300 z-10"
                        >
                          <Heart 
                            className={cn(
                              "h-5 w-5 transition-colors", 
                              isFavorite(p.id) ? "fill-red-500 text-red-500" : "text-slate-700"
                            )} 
                          />
                        </button>
                        {p.isSuperhost && (
                          <div className="absolute bottom-3 left-3 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Shield className="h-3 w-3" /> Super Hôte
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 flex-1">
                            {p.title}
                          </h3>
                          <div className="flex items-center gap-1 shrink-0">
                            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-bold">{p.rating || 'Nouveau'}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                          <MapPin className="h-3 w-3" />
                          {typeof p.location === 'string' ? p.location : p.location?.city}, Maroc
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900">{p.pricePerNight || p.prixParNuit} DH</span>
                            <span className="text-xs text-slate-500"> / nuit</span>
                          </div>
                          <Button size="sm" variant="outline" className="text-xs">
                            Voir <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/search">
              <Button variant="outline" size="lg">
                Voir tous les logements <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Avantages ─────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-primary-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 transition-colors border-y border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mb-3">
              Pourquoi choisir RentHub ?
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Une plateforme pensée pour les voyageurs et les hôtes marocains
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {AVANTAGES.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-violet-100 text-primary-600 mb-6">
                  {a.icone}
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{a.titre}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-violet-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Prêt à partir en voyage ?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-lg mx-auto">
            Rejoignez des milliers de voyageurs qui font confiance à RentHub pour leurs séjours au Maroc.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/search">
              <Button size="lg" variant="secondary" className="shadow-2xl">
                Trouver un hébergement <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" className="bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-xl">
                Devenir hôte
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
