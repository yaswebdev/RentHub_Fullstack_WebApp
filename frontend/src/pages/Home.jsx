import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search, MapPin, Star, ChevronRight, Shield, Heart, Sparkles, ArrowRight
} from 'lucide-react';
import { DateRangePicker } from '../components/DateRangePicker';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useProprietes } from '../hooks/useProprietes';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { CardSkeleton } from '../components/Skeleton';
import { DestinationAutocomplete } from '../components/DestinationAutocomplete';

const VILLES = ['Marrakech', 'Casablanca', 'Agadir', 'Tanger', 'Fès', 'Essaouira', 'Rabat'];

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
    image:
      'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'villa',
    label: 'Villas',
    desc: 'Piscine & jardin',
    image:
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'appartement',
    label: 'Appartements',
    desc: 'Vie citadine',
    image:
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'studio',
    label: 'Studios',
    desc: 'Cosy & moderne',
    image:
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'dar',
    label: 'Dars',
    desc: 'Maison de famille',
    image:
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&q=80&w=800',
  },
];

export const Home = () => {
  const [recherche, setRecherche] = useState('');
  const [categorieActive, setCategorieActive] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { proprietes, chargement } = useProprietes({}, 6);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [activePanel, setActivePanel] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [guests, setGuests] = useState({ adults: 0, children: 0, babies: 0, pets: 0 });
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const roleValue = user?.role?.toUpperCase?.();
  const isHost = ['HOTE', 'ADMIN'].includes(roleValue);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(recherche)}`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!panelRef.current || !triggerRef.current) return;
      if (!panelRef.current.contains(event.target) && !triggerRef.current.contains(event.target)) {
        setActivePanel(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const guestsLabel = useMemo(() => {
    const total = guests.adults + guests.children + guests.babies + guests.pets;
    if (total === 0) return 'Ajouter des voyageurs';
    const parts = [];
    if (guests.adults) parts.push(`${guests.adults} adulte${guests.adults > 1 ? 's' : ''}`);
    if (guests.children) parts.push(`${guests.children} enfant${guests.children > 1 ? 's' : ''}`);
    if (guests.babies) parts.push(`${guests.babies} bébé${guests.babies > 1 ? 's' : ''}`);
    if (guests.pets) parts.push(`${guests.pets} animal${guests.pets > 1 ? 's' : ''}`);
    return parts.join(', ');
  }, [guests]);

  const setGuestValue = (key, delta) => {
    setGuests((prev) => {
      const next = Math.max(0, (prev[key] || 0) + delta);
      return { ...prev, [key]: next };
    });
  };

  const datesLabel = useMemo(() => {
    if (!startDate || !endDate) return 'Quand ?';
    const format = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return `${format(startDate)} - ${format(endDate)}`;
  }, [startDate, endDate]);

  return (
    <div className="min-h-screen">
      {/* ── Héro ──────────────────────────────────────────────── */}
      <section className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <motion.div
              className="lg:col-span-7"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold mb-5">
                <Sparkles className="h-4 w-4 text-primary-500" />
                Sélections premium au Maroc
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 leading-tight">
                Trouvez un lieu
                <span className="block text-primary-600">qui vous ressemble</span>
              </h1>
              <p className="mt-5 text-lg text-slate-600 max-w-xl">
                Riads lumineux, villas avec piscine, studios design. Réservez en quelques clics, au cœur des plus belles villes.
              </p>

              <div className="relative">
                <form
                  onSubmit={handleSearch}
                  className="mt-8 flex flex-col md:flex-row items-stretch rounded-full bg-white shadow-lg border border-slate-200"
                  ref={triggerRef}
                >
                  <DestinationAutocomplete
                    value={recherche}
                    onChange={setRecherche}
                    onSelect={(city) => setRecherche(city)}
                    className="md:flex-[2]"
                  />
                  <button
                    type="button"
                    className={cn(
                      'flex-1 px-6 py-4 text-left md:flex-[1.2] md:border-l md:border-slate-200',
                      activePanel === 'dates' && 'bg-slate-50'
                    )}
                    onClick={() => setActivePanel(activePanel === 'dates' ? null : 'dates')}
                  >
                    <p className="text-[11px] font-bold text-slate-700">Dates</p>
                    <p className={cn('text-sm', startDate && endDate ? 'text-slate-800 font-semibold' : 'text-slate-500')}>
                      {datesLabel}
                    </p>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'flex-1 px-6 py-4 text-left md:flex-[1] md:border-l md:border-slate-200',
                      activePanel === 'guests' && 'bg-slate-50'
                    )}
                    onClick={() => setActivePanel(activePanel === 'guests' ? null : 'guests')}
                  >
                    <p className="text-[11px] font-bold text-slate-700">Voyageurs</p>
                    <p className="text-sm text-slate-500 truncate">{guestsLabel}</p>
                  </button>
                  <div className="p-2 flex items-center justify-center">
                    <Button type="submit" size="lg" className="rounded-full px-6">
                      <Search className="h-5 w-5 mr-2" /> Rechercher
                    </Button>
                  </div>
                </form>

                {activePanel === 'dates' && (
                  <motion.div
                    ref={panelRef}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="absolute left-0 right-0 mt-4 bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 z-20"
                  >
                    <DateRangePicker
                      startDate={startDate}
                      endDate={endDate}
                      onChange={(dates) => {
                        const [start, end] = dates;
                        setStartDate(start);
                        setEndDate(end);
                      }}
                    />
                  </motion.div>
                )}

                {activePanel === 'guests' && (
                  <div ref={panelRef} className="absolute right-0 mt-4 w-full md:w-[380px] bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 z-20">
                    {[
                      { key: 'adults', label: 'Adultes', desc: '13 ans et plus' },
                      { key: 'children', label: 'Enfants', desc: 'De 2 à 12 ans' },
                      { key: 'babies', label: 'Bébés', desc: '- de 2 ans' },
                      { key: 'pets', label: 'Animaux domestiques', desc: "Vous voyagez avec un animal d'assistance ?" },
                    ].map((row, idx) => (
                      <div key={row.key} className={cn('flex items-center justify-between py-4', idx > 0 && 'border-t border-slate-100')}>
                        <div>
                          <p className="font-semibold text-slate-900">{row.label}</p>
                          <p className="text-sm text-slate-500">{row.desc}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="w-8 h-8 rounded-full border border-slate-200 text-slate-500"
                            onClick={() => setGuestValue(row.key, -1)}
                          >
                            -
                          </button>
                          <span className="w-4 text-center font-semibold text-slate-700">{guests[row.key]}</span>
                          <button
                            type="button"
                            className="w-8 h-8 rounded-full border border-slate-200 text-slate-500"
                            onClick={() => setGuestValue(row.key, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                {VILLES.map((ville) => (
                  <button
                    key={ville}
                    onClick={() => navigate(`/search?q=${ville}`)}
                    className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full hover:border-slate-400"
                  >
                    {ville}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="lg:col-span-5 grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="rounded-3xl overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=900"
                  alt="Riad"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="grid gap-4">
                <div className="rounded-3xl overflow-hidden shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&q=80&w=900"
                    alt="Appartement"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="rounded-3xl overflow-hidden shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&q=80&w=900"
                    alt="Villa"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </motion.div>
          </div>
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
          <div className="flex flex-wrap justify-center gap-6">
            {CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const typeLabelMap = {
                    riad: 'Riad',
                    villa: 'Villa',
                    appartement: 'Appartement',
                    studio: 'Studio',
                    dar: 'Dar',
                  };
                  const typeLabel = typeLabelMap[cat.id] || cat.label?.replace(/s$/i, '') || cat.label;
                  setCategorieActive(cat.id === categorieActive ? null : cat.id);
                  navigate(`/search?type=${encodeURIComponent(typeLabel)}`);
                }}
                className={cn(
                  'group flex flex-col items-center gap-4 px-6 py-7 rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-xl min-w-[150px] w-40 text-center bg-white border-slate-200'
                )}
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-sm">
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-1">{cat.label}</p>
                  <p className="text-[11px] text-slate-500 font-medium leading-tight">{cat.desc}</p>
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
            <div className="space-y-10">
              {[{ title: 'Logements populaires • Marrakech', items: proprietes.slice(0, 8) },
                { title: 'Hébergements coup de coeur', items: proprietes.slice(2, 10) }].map((section, idx) => (
                <div key={section.title}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-900">{section.title}</h3>
                    <Link to="/search" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                      Voir tout <ChevronRight className="h-4 w-4 inline-block" />
                    </Link>
                  </div>
                  <div className="flex gap-5 overflow-x-auto pb-3 snap-x">
                    {section.items.map((p) => (
                      <Link key={p.id} to={`/property/${p.id}`} className="min-w-[240px] max-w-[240px] snap-start">
                        <Card hover className="group overflow-hidden cursor-pointer">
                          <div className="relative h-44 overflow-hidden rounded-t-3xl">
                            <img
                              src={p.image || p.images?.[0]}
                              alt={p.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                toggleFavorite(p.id);
                              }}
                              className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-all duration-300 z-10"
                            >
                              <Heart
                                className={cn(
                                  "h-4 w-4 transition-colors",
                                  isFavorite(p.id) ? "fill-red-500 text-red-500" : "text-slate-700"
                                )}
                              />
                            </button>
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
                    ))}
                  </div>
                </div>
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
      <section className="py-20 bg-[radial-gradient(circle_at_top,#fff7ed,transparent_55%),radial-gradient(circle_at_bottom,#ffe4e6,transparent_60%)] dark:bg-[radial-gradient(circle_at_top,#0f172a,transparent_55%),radial-gradient(circle_at_bottom,#111827,transparent_60%)] transition-colors border-y border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500 mb-3">RentHub Maroc</p>
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
                transition={{ delay: i * 0.12 }}
                className="relative overflow-hidden p-8 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-100/60" />
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-amber-200 mb-6 shadow-sm">
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
      <section className="py-20 bg-[linear-gradient(120deg,#fb7185_0%,#f97316_50%,#f59e0b_100%)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute -top-16 left-8 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 right-12 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 mb-4">Prêt pour le Maroc</p>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-5">
                Prêt à partir en voyage ?
              </h2>
              <p className="text-white/85 text-lg mb-8 max-w-xl">
                Rejoignez des milliers de voyageurs qui font confiance à RentHub pour leurs séjours au Maroc.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link to="/search">
                  <Button size="lg" variant="secondary" className="shadow-2xl">
                    Trouver un hébergement <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                {!isHost && (
                  <Link to="/register">
                    <Button size="lg" className="bg-white/15 hover:bg-white/25 text-white border border-white/30 shadow-xl">
                      Devenir hôte
                    </Button>
                  </Link>
                )}
              </div>
              <div className="mt-8 flex flex-wrap gap-3 text-xs text-white/80">
                <span className="px-3 py-1 rounded-full bg-white/15 border border-white/25">Support local 7j/7</span>
                <span className="px-3 py-1 rounded-full bg-white/15 border border-white/25">Paiement sécurisé</span>
                <span className="px-3 py-1 rounded-full bg-white/15 border border-white/25">Hôtes vérifiés</span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/15 border border-white/30 rounded-[32px] p-8 text-white shadow-2xl">
                <p className="text-sm uppercase tracking-[0.2em] text-white/70 mb-3">RentHub</p>
                <p className="text-2xl font-bold mb-4">Votre prochain séjour commence ici.</p>
                <p className="text-white/80 text-sm leading-relaxed">
                  Des logements uniques, des hôtes de confiance, et un support local pour des voyages sans stress.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-white/80">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-lg font-bold text-white">+1k</p>
                    <p>Logements actifs</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-lg font-bold text-white">98%</p>
                    <p>Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
