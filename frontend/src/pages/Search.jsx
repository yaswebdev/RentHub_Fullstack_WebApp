import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search as SearchIcon, MapPin, Star, SlidersHorizontal, X, Filter,
  Wifi, Car, Wind, Bath, Bed, Users, ArrowRight, Shield, Heart
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { CardSkeleton } from '../components/Skeleton';
import { MapRecherche } from '../components/MapRecherche';
import { useProprietes } from '../hooks/useProprietes';
import { useFavorites } from '../context/FavoritesContext';
import { cn, formatCurrency } from '../lib/utils';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const TYPES_PROPRIETE = ['Riad', 'Appartement', 'Villa', 'Studio', 'Dar', 'Maison'];
const VILLES = ['Marrakech', 'Casablanca', 'Agadir', 'Tanger', 'Fès', 'Essaouira', 'Rabat'];
const EQUIPEMENTS = ['WiFi haut débit', 'Cuisine équipée', 'Piscine privée', 'Parking gratuit', 'Climatisation'];

export const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [panneauFiltres, setPanneauFiltres] = useState(false);
  const [typeSelectionne, setTypeSelectionne] = useState([]);
  const [villeSelectionnee, setVilleSelectionnee] = useState(searchParams.get('type') || '');
  const [prixMin, setPrixMin] = useState('');
  const [prixMax, setPrixMax] = useState('');
  const [voyageurs, setVoyageurs] = useState('');
  const [tri, setTri] = useState('recommande');

  const { isFavorite, toggleFavorite } = useFavorites();
  const { proprietes, chargement } = useProprietes({}, 50);

  // Filtrage et tri côté client (mode dev)
  const resultats = useMemo(() => {
    let liste = [...proprietes];
    const q = query.toLowerCase();

    if (q) {
      liste = liste.filter((p) => {
        const loc = typeof p.location === 'string' ? p.location : (p.location?.city || p.ville || '');
        return (
          (p.title || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          loc.toLowerCase().includes(q)
        );
      });
    }

    if (typeSelectionne.length > 0) {
      liste = liste.filter((p) => typeSelectionne.includes(p.type));
    }

    if (villeSelectionnee) {
      liste = liste.filter((p) => {
        const loc = typeof p.location === 'string' ? p.location : (p.location?.city || p.ville || '');
        return loc.toLowerCase().includes(villeSelectionnee.toLowerCase());
      });
    }

    if (prixMin) liste = liste.filter((p) => (p.pricePerNight || p.prixParNuit) >= Number(prixMin));
    if (prixMax) liste = liste.filter((p) => (p.pricePerNight || p.prixParNuit) <= Number(prixMax));
    if (voyageurs) liste = liste.filter((p) => (p.maxGuests || p.maxVoyageurs) >= Number(voyageurs));

    if (tri === 'prix_asc')  liste.sort((a, b) => (a.pricePerNight || a.prixParNuit) - (b.pricePerNight || b.prixParNuit));
    if (tri === 'prix_desc') liste.sort((a, b) => (b.pricePerNight || b.prixParNuit) - (a.pricePerNight || a.prixParNuit));
    if (tri === 'note')      liste.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return liste;
  }, [proprietes, query, typeSelectionne, villeSelectionnee, prixMin, prixMax, voyageurs, tri]);

  const nbFiltresActifs = typeSelectionne.length + (villeSelectionnee ? 1 : 0) + (prixMin ? 1 : 0) + (prixMax ? 1 : 0) + (voyageurs ? 1 : 0);

  const reinitialiserFiltres = () => {
    setTypeSelectionne([]);
    setVilleSelectionnee('');
    setPrixMin('');
    setPrixMax('');
    setVoyageurs('');
  };

  const toggleType = (type) => {
    setTypeSelectionne((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="container mx-auto px-4">
        {/* ── Barre de recherche ──────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="flex-1 flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 shadow-sm focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 dark:focus-within:ring-primary-900/40 transition-all">
            <SearchIcon className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
            <input
              type="text"
              placeholder="Chercher par ville, type de logement..."
              className="flex-1 py-3.5 bg-transparent border-none focus:outline-none text-sm text-slate-800 placeholder:text-slate-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button
            variant={panneauFiltres ? 'primary' : 'secondary'}
            onClick={() => setPanneauFiltres(!panneauFiltres)}
            className="shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filtres
            {nbFiltresActifs > 0 && (
              <span className="ml-2 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {nbFiltresActifs}
              </span>
            )}
          </Button>

          <select
            value={tri}
            onChange={(e) => setTri(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-primary-400 shadow-sm cursor-pointer"
          >
            <option value="recommande">Recommandés</option>
            <option value="note">Mieux notés</option>
            <option value="prix_asc">Prix croissant</option>
            <option value="prix_desc">Prix décroissant</option>
          </select>
        </div>

        {/* ── Panneau de filtres ──────────────────────────────── */}
        <AnimatePresence>
          {panneauFiltres && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6 shadow-sm space-y-6">
                {/* Types */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Type de logement</h3>
                  <div className="flex flex-wrap gap-2">
                    {TYPES_PROPRIETE.map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleType(type)}
                        className={cn(
                          'px-4 py-2 rounded-xl text-xs font-bold border transition-all',
                          typeSelectionne.includes(type)
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-400'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Villes */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Ville</h3>
                  <div className="flex flex-wrap gap-2">
                    {VILLES.map((ville) => (
                      <button
                        key={ville}
                        onClick={() => setVilleSelectionnee(ville === villeSelectionnee ? '' : ville)}
                        className={cn(
                          'px-4 py-2 rounded-xl text-xs font-bold border transition-all',
                          villeSelectionnee === ville
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-400'
                        )}
                      >
                        {ville}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fourchette de prix */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fourchette de prix</h3>
                    <div className="text-sm font-bold text-primary-600 dark:text-primary-400">
                      {prixMin || 0} DH — {prixMax || 10000} DH
                    </div>
                  </div>
                  
                  <div className="px-2 pt-2 pb-8">
                    <Slider
                      range
                      min={0}
                      max={10000}
                      step={100}
                      defaultValue={[Number(prixMin) || 0, Number(prixMax) || 10000]}
                      onChange={(val) => {
                        setPrixMin(val[0]);
                        setPrixMax(val[1]);
                      }}
                      styles={{
                        track: { backgroundColor: '#6366f1', height: 6 },
                        handle: { 
                          borderColor: '#6366f1', 
                          height: 20, 
                          width: 20, 
                          marginLeft: -10, 
                          marginTop: -7, 
                          backgroundColor: '#fff',
                          opacity: 1,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        },
                        rail: { backgroundColor: '#e2e8f0', darkBackgroundColor: '#334155', height: 6 }
                      }}
                      railStyle={{ backgroundColor: '#e2e8f0' }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Voyageurs"
                      type="number"
                      placeholder="1"
                      min="1"
                      value={voyageurs}
                      onChange={(e) => setVoyageurs(e.target.value)}
                    />
                  </div>
                </div>

                {nbFiltresActifs > 0 && (
                  <Button variant="ghost" size="sm" onClick={reinitialiserFiltres}>
                    <X className="h-4 w-4 mr-1" /> Réinitialiser les filtres
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Résultats et Carte ──────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Colonne Liste */}
          <div className="flex-1 lg:w-3/5 xl:w-2/3">
            <p className="text-sm text-slate-500 mb-6 font-medium">
              {chargement ? 'Chargement...' : `${resultats.length} hébergement${resultats.length > 1 ? 's' : ''} trouvé${resultats.length > 1 ? 's' : ''}`}
            </p>

            {chargement ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : resultats.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun résultat</h3>
                <p className="text-slate-500 mb-6">Essayez de modifier vos filtres de recherche.</p>
                <Button variant="outline" onClick={reinitialiserFiltres}>Effacer les filtres</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {resultats.map((p, i) => {
              const loc = typeof p.location === 'string' ? p.location : (p.location?.city || p.ville || '');
              const prix = p.pricePerNight || p.prixParNuit;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                >
                  <Link to={`/property/${p.id}`}>
                    <Card hover className="group overflow-hidden">
                      <div className="relative h-52 overflow-hidden rounded-t-3xl">
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
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 text-sm leading-snug flex-1 line-clamp-2">
                            {p.title}
                          </h3>
                          <div className="flex items-center gap-1 shrink-0">
                            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-bold">{p.rating || 'Nouveau'}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                          <MapPin className="h-3 w-3" /> {loc}, Maroc
                        </p>
                        <div className="flex items-center gap-3 text-slate-400 text-xs mb-4">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {p.maxGuests || p.maxVoyageurs}</span>
                          <span className="flex items-center gap-1"><Bed className="h-3 w-3" /> {p.bedrooms || p.beds}</span>
                          <span className="flex items-center gap-1"><Bath className="h-3 w-3" /> {p.bathrooms || p.baths}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 text-base">{prix} DH</span>
                            <span className="text-xs text-slate-500"> / nuit</span>
                          </div>
                          <Button size="sm" variant="primary" className="text-xs">
                            Réserver <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
          </div>

          {/* Colonne Carte (Desktop uniquement) */}
          <div className="hidden lg:block lg:w-2/5 xl:w-1/3">
            <div className="sticky top-28 h-[calc(100vh-8rem)] rounded-3xl overflow-hidden border border-slate-200 shadow-xl z-0">
              <MapRecherche proprietes={resultats} />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
