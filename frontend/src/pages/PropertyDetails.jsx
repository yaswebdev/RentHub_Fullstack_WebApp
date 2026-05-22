import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star, MapPin, Share, Heart, Shield, Users, Bed, Bath,
  Wifi, Coffee, Car, Tv, Wind, Utensils, CheckCircle,
  MessageSquare, ArrowLeft, Home as HomeIcon, Map as MapIcon,
  ExternalLink
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';
import { HeaderSkeleton, GallerySkeleton } from '../components/Skeleton';
import { GalleryLightbox } from '../components/GalleryLightbox';
import DatePicker from 'react-datepicker';
import { addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, getLocationString, calculerNuits } from '../lib/utils';
import { getProfilePhotoUrl } from '../utils/imageHelpers';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePropriete } from '../hooks/useProprietes';
import { fetchMesReservations } from '../api/reservationsAPI';
import { fetchAvisByAnnonce, creerAvis } from '../api/avisAPI';
import { API_BASE_URL } from '../constants/api';

/* Chargement paresseux de la carte (Leaflet est lourd) */
const MapPropriete = lazy(() => import('../components/MapPropriete'));

const ICONES_EQUIPEMENTS = {
  'WiFi haut débit': <Wifi className="h-5 w-5" />,
  'Cuisine équipée': <Utensils className="h-5 w-5" />,
  'Parking gratuit': <Car className="h-5 w-5" />,
  'TV':              <Tv className="h-5 w-5" />,
  'Climatisation':   <Wind className="h-5 w-5" />,
  'Café':            <Coffee className="h-5 w-5" />,
};

export const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { propriete: property, chargement: loading, erreur: error } = usePropriete(id);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  // States pour la réservation
  const [dateArrivee, setDateArrivee] = useState(null);
  const [dateDepart, setDateDepart] = useState(null);
  const [voyageurs, setVoyageurs] = useState(1);

  // States pour les avis (simulation locale)
  const [localReviews, setLocalReviews] = useState([]);
  const [nouveauAvis, setNouveauAvis] = useState('');
  const [nouvelleNote, setNouvelleNote] = useState(5);
  const [avisSoumis, setAvisSoumis] = useState(false);
  const [reservationEligible, setReservationEligible] = useState(null);
  const [avisEnvoi, setAvisEnvoi] = useState(false);
  const [eligibiliteMessage, setEligibiliteMessage] = useState('');
  const WORD_LIMIT = 80;
  const roleValue = user?.role?.toUpperCase?.();
  const effectiveRole = roleValue || (API_BASE_URL ? null : 'LOCATAIRE');
  const isLocataire = effectiveRole === 'LOCATAIRE';
  const isAdmin = roleValue === 'ADMIN';
  const canBook = !user || isLocataire;
  const canContact = !user || isLocataire;

  // Synchroniser les avis locaux
  useEffect(() => {
    if (!property?.id) return;
    if (API_BASE_URL) {
      fetchAvisByAnnonce(property.id)
        .then((data) => setLocalReviews(data))
        .catch(() => setLocalReviews([]));
      return;
    }

    if (property?.reviews) {
      setLocalReviews(property.reviews);
    }
  }, [property?.id, property?.reviews]);

  // Vérifier si l'utilisateur peut laisser un avis (réservation confirmée/terminée)
  useEffect(() => {
    if (!user || !property?.id) {
      setReservationEligible(null);
      setEligibiliteMessage('');
      return;
    }

    fetchMesReservations(user.id)
      .then((data) => {
        const reservations = Array.isArray(data) ? data : [];
        const related = reservations.filter((r) => (r.annonceId || r.propertyId) === property.id);
        const eligible = related
          .filter((r) => {
            const statut = (r.statut || r.status || '').toString().toUpperCase();
            return ['CONFIRMEE', 'TERMINEE', 'PAYEE'].includes(statut);
          })
          .find((r) => !localReviews.some((a) => a.reservationId === r.id));

        if (eligible) {
          setReservationEligible(eligible);
          setEligibiliteMessage('');
          return;
        }

        if (related.length === 0) {
          setReservationEligible(null);
          setEligibiliteMessage('Vous devez réserver ce logement pour laisser un avis.');
          return;
        }

        const hasPending = related.some((r) => {
          const statut = (r.statut || r.status || '').toString().toUpperCase();
          return !['CONFIRMEE', 'TERMINEE', 'PAYEE'].includes(statut);
        });

        if (hasPending) {
          setReservationEligible(null);
          setEligibiliteMessage('Votre réservation doit être confirmée ou terminée pour laisser un avis.');
          return;
        }

        setReservationEligible(null);
        setEligibiliteMessage('Vous avez déjà laissé un avis pour cette réservation.');
      })
      .catch(() => {
        setReservationEligible(null);
        setEligibiliteMessage('');
      });
  }, [user, property?.id, localReviews]);

  const countWords = (value) => {
    if (!value) return 0;
    return value.trim().split(/\s+/).filter(Boolean).length;
  };

  const formatReviewDate = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleSubmitAvis = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!reservationEligible) {
      setEligibiliteMessage('Seuls les voyageurs ayant réservé ce logement peuvent laisser un avis.');
      return;
    }

    const words = countWords(nouveauAvis);
    if (words === 0) {
      toast('Veuillez écrire un commentaire.', 'error');
      return;
    }
    if (words > WORD_LIMIT) {
      toast(`Limite de ${WORD_LIMIT} mots dépassée.`, 'error');
      return;
    }

    setAvisEnvoi(true);
    try {
      if (API_BASE_URL) {
        const created = await creerAvis(property.id, reservationEligible.id, nouvelleNote, nouveauAvis.trim());
        setLocalReviews((prev) => [created, ...prev]);
      } else {
        const mockAvis = {
          id: `local-${Date.now()}`,
          rating: nouvelleNote,
          comment: nouveauAvis.trim(),
          date: new Date().toISOString(),
          userName: user?.displayName || user?.nom || 'Locataire',
          userPhoto: user?.photoURL || null,
          reservationId: reservationEligible.id,
          annonceId: property.id,
        };
        setLocalReviews((prev) => [mockAvis, ...prev]);
      }

      setNouveauAvis('');
      setNouvelleNote(5);
      setAvisSoumis(true);
      toast('Merci pour votre avis !', 'success');
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.response?.data?.error;
      if (status === 422 || status === 403) {
        setEligibiliteMessage(message || 'Seuls les voyageurs ayant réservé ce logement peuvent laisser un avis.');
        return;
      }
      toast(message || err.message || "Impossible d'envoyer l'avis.", 'error');
    } finally {
      setAvisEnvoi(false);
    }
  };

  const handleContacterHote = async () => {
    if (!user) { navigate('/login'); return; }
    if (!isLocataire) {
      toast("Seuls les voyageurs peuvent contacter un hôte.", 'info');
      return;
    }
    if (!property?.hostId) return;

    try {
      if (API_BASE_URL) {
        const reservations = await fetchMesReservations(user.id);
        const match = reservations.find((r) => r.annonceId === property.id || r.propertyId === property.id);
        if (match) {
          navigate(`/chat/${match.id}`);
          return;
        }
        toast("Vous devez avoir une réservation pour contacter l'hôte.", 'info');
        return;
      }
      toast("La messagerie est disponible uniquement avec le backend.", 'info');
    } catch (err) {
      console.error('[PropertyDetails] Erreur contact hôte :', err);
      toast('Impossible de contacter l\'hôte.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16 bg-white dark:bg-slate-950 min-h-screen transition-colors">
        <div className="container mx-auto px-4">
          <HeaderSkeleton />
          <GallerySkeleton />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="pt-32 pb-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{error || 'Propriété introuvable'}</h2>
        <Link to="/search">
          <Button variant="primary">Retour à la recherche</Button>
        </Link>
      </div>
    );
  }

  const images    = property.images || [property.image];
  const equipements = property.amenities || property.equipements || [];
  const prixNuit  = Number(property.pricePerNight || property.prixParNuit || 0);
  const localisation = getLocationString(property.location) || property.ville || property.location;
  
  // Recalculer la note moyenne localement si on a ajouté un avis
  const totalReviews = localReviews.length;
  const avgRating = totalReviews > 0 
    ? (localReviews.reduce((acc, curr) => acc + (curr.rating || 5), 0) / totalReviews).toFixed(1)
    : (property.rating || 0);

  // Calcul dynamique du prix
  const toLocalDateParam = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const nuits = dateDepart && dateArrivee
    ? calculerNuits(toLocalDateParam(dateDepart), toLocalDateParam(dateArrivee))
    : 0;
  const sousTotal = prixNuit * nuits;
  const fraisMenage = 200;
  const fraisService = 150;
  const prixTotal = nuits > 0 ? sousTotal + fraisMenage + fraisService : 0;

  // Configuration DatePicker
  const CustomInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
    <button className="text-sm text-slate-800 dark:text-slate-200 font-medium w-full text-left truncate bg-transparent focus:outline-none" onClick={onClick} ref={ref}>
      {value || <span className="text-slate-400 font-normal">{placeholder}</span>}
    </button>
  ));

  return (
    <div className="pt-20 pb-16 min-h-screen bg-white dark:bg-slate-950 transition-colors">
      <div className="container mx-auto px-4">
        {/* En-tête : Titre et Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white mb-2 mt-4">
              {property?.title}
            </h1>
            <Link to="/search" className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la recherche
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => toggleFavorite(property.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border",
                isFavorite(property.id)
                  ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-600"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-red-300"
              )}
            >
              <Heart className={cn("h-4 w-4", isFavorite(property.id) && "fill-current")} />
              {isFavorite(property.id) ? 'Enregistré' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Titre et méta-données */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
            <div className="flex items-center text-slate-700 dark:text-slate-300">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
              <span>{property.rating || 'Nouveau'}</span>
              <span className="mx-1 text-slate-300">•</span>
              <span className="underline cursor-pointer">{property.reviewCount || 0} avis</span>
            </div>
            <div className="flex items-center text-slate-500 dark:text-slate-400">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{localisation}, Maroc</span>
            </div>
            {property?.type && (
              <div className="flex items-center text-slate-500 dark:text-slate-400">
                <HomeIcon className="h-4 w-4 mr-1" />
                <span>{property.type}</span>
              </div>
            )}
            {property.isSuperhost && (
              <div className="flex items-center text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded text-xs">
                <Shield className="h-3 w-3 mr-1" /> Super Hôte
              </div>
            )}
          </div>
        </div>

        {/* Galerie photos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div
            className="md:col-span-2 aspect-[16/10] rounded-2xl overflow-hidden cursor-pointer relative group bg-slate-100"
            onClick={() => { setPhotoIndex(0); setLightboxOpen(true); }}
          >
            <img src={images[0]} alt="Photo principale" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>

          <div className="hidden md:block md:col-span-2">
            <div className="relative grid grid-cols-2 grid-rows-2 gap-4 aspect-[16/10]">
              {images.slice(1, 5).map((img, i) => (
                <div
                  key={i}
                  className="h-full rounded-2xl overflow-hidden cursor-pointer relative group bg-slate-100"
                  onClick={() => { setPhotoIndex(i + 1); setLightboxOpen(true); }}
                >
                  <img src={img} alt={`Photo ${i + 2}`} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              ))}
              {images.length < 5 &&
                Array.from({ length: 4 - Math.max(0, images.length - 1) }).map((_, i) => (
                  <div key={`ph-${i}`} className="rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center h-full">
                    <HomeIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                  </div>
                ))}

              <button
                type="button"
                onClick={() => { setPhotoIndex(0); setLightboxOpen(true); }}
                className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-slate-900 shadow-md border border-slate-200"
              >
                Afficher toutes les photos
              </button>
            </div>
          </div>
        </div>

        {/* Bouton toutes les photos (mobile) */}
        <div className="flex justify-end mb-8 md:hidden">
          <Button variant="outline" size="sm" onClick={() => { setPhotoIndex(0); setLightboxOpen(true); }}>
            Afficher toutes les photos
          </Button>
        </div>

        <GalleryLightbox 
          isOpen={lightboxOpen} 
          onClose={() => setLightboxOpen(false)} 
          images={images} 
          initialIndex={photoIndex} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Colonne gauche : Détails */}
          <div className="lg:col-span-2 space-y-12">
            {/* Informations hôte */}
            <div className="flex items-center justify-between pb-8 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Hébergé par {property?.hostName || 'votre hôte'}
                </h2>
                <div className="flex items-center space-x-4 text-slate-500 dark:text-slate-400 text-sm font-medium">
                  <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {property?.maxGuests} voyageurs</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5"><Bed className="h-4 w-4" /> {property?.bedrooms} chambres</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5"><Bath className="h-4 w-4" /> {property?.bathrooms} sdb</span>
                </div>
              </div>
              <div className="relative shrink-0">
                <img
                  src={getProfilePhotoUrl(property?.hostPhoto) || `https://ui-avatars.com/api/?name=${encodeURIComponent(property?.hostName || 'Hote')}&background=6366f1&color=fff`}
                  alt={property?.hostName}
                  className="h-14 w-14 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md"
                  referrerPolicy="no-referrer"
                />
                {property?.isSuperhost && (
                  <div className="absolute -bottom-1 -right-1 bg-primary-600 text-white p-1 rounded-full shadow-sm">
                    <Shield className="h-3 w-3" />
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">À propos de ce logement</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {property?.description || "Pas de description disponible."}
              </p>
            </div>

            {/* Équipements */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ce que propose ce logement</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property?.amenities?.map((equip, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <CheckCircle className="h-5 w-5 text-primary-500 shrink-0" />
                    <span className="text-sm font-medium">{equip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Avis */}
            <div className="space-y-8">
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {property?.rating || 'Nouveau'} • {localReviews.length} avis
                </h3>
              </div>

              {isLocataire && (
                <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                  {!reservationEligible && (
                    <div className="mb-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                      Seuls les voyageurs avec une réservation confirmée, payée ou terminée peuvent laisser un avis.
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Laisser un avis</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Réservé aux voyageurs ayant une réservation confirmée ou terminée.
                      </p>
                    </div>
                    {avisSoumis && (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        Avis envoyé
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSubmitAvis} className="space-y-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className="p-1"
                          onClick={() => setNouvelleNote(n)}
                          aria-label={`Noter ${n} étoile${n > 1 ? 's' : ''}`}
                        >
                          <Star className={cn('h-6 w-6', n <= nouvelleNote ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300')} />
                        </button>
                      ))}
                    </div>

                    <div>
                      <textarea
                        rows="4"
                        value={nouveauAvis}
                        onChange={(e) => setNouveauAvis(e.target.value)}
                        placeholder="Partagez votre expérience..."
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      />
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>Limite : {WORD_LIMIT} mots</span>
                        <span>{countWords(nouveauAvis)} / {WORD_LIMIT}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={!reservationEligible || avisEnvoi}
                      className="rounded-2xl"
                    >
                      {reservationEligible ? 'Publier mon avis' : 'Réservation requise'}
                    </Button>
                    {eligibiliteMessage && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {eligibiliteMessage}
                      </p>
                    )}
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {localReviews.map((avis) => (
                  <div key={avis.id} className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={avis.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(avis.userName || 'U')}&background=6366f1&color=fff`}
                        className="h-12 w-12 rounded-2xl object-cover"
                        alt=""
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{avis.userName}</p>
                        <p className="text-xs text-slate-500">{formatReviewDate(avis.date) || avis.date}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-yellow-500">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        {avis.rating || 5}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      “{avis.comment}”
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Localisation */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Où se situe le logement</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                {localisation}, Maroc
              </p>
              <div className="h-96 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
                <Suspense fallback={<div className="w-full h-full bg-slate-100 animate-pulse" />}>
                  <MapPropriete 
                    ville={localisation} 
                    titre={property?.title}
                    prixNuit={prixNuit}
                  />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Colonne droite : Réservation */}
          <div className="relative">
            <div className="sticky top-24 space-y-6">
              <Card className="shadow-2xl border-none overflow-hidden dark:bg-slate-900">
                <CardContent className="p-6">
                  <div className="flex items-end justify-between mb-6 mt-4">
                    <div>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{prixNuit} DH</span>
                      <span className="text-slate-500 dark:text-slate-400"> / nuit</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-bold text-slate-900 dark:text-white">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      {property?.rating || 'Nouveau'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mb-4">
                    <div className="p-3 border-r border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white mb-1">Départ</p>
                      <DatePicker
                        selected={dateDepart}
                        onChange={(date) => {
                          setDateDepart(date);
                          if (date && dateArrivee && dateArrivee <= date) {
                            setDateArrivee(addDays(date, 1));
                          }
                        }}
                        placeholderText="Ajouter"
                        className="bg-transparent border-none focus:outline-none text-sm text-slate-700 dark:text-slate-200 w-full"
                        minDate={new Date()}
                        locale={fr}
                        dateFormat="dd/MM/yyyy"
                      />
                    </div>
                    <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white mb-1">Arrivée</p>
                      <DatePicker
                        selected={dateArrivee}
                        onChange={(date) => {
                          if (dateDepart && date && date <= dateDepart) {
                            setDateArrivee(addDays(dateDepart, 1));
                            return;
                          }
                          setDateArrivee(date);
                        }}
                        placeholderText="Ajouter"
                        className="bg-transparent border-none focus:outline-none text-sm text-slate-700 dark:text-slate-200 w-full"
                        minDate={dateDepart ? addDays(dateDepart, 1) : new Date()}
                        locale={fr}
                        dateFormat="dd/MM/yyyy"
                        disabled={!dateDepart}
                      />
                    </div>
                    <div className="col-span-2 p-3 border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white mb-1">Voyageurs</p>
                      <input
                        type="number"
                        min="1"
                        max={property?.maxGuests}
                        value={voyageurs}
                        onChange={(e) => setVoyageurs(Number(e.target.value))}
                        className="bg-transparent border-none focus:outline-none text-sm text-slate-700 dark:text-slate-200 w-full"
                      />
                    </div>
                  </div>

                  {canBook ? (
                    <Link to={`/booking/${property?.id}?start=${toLocalDateParam(dateDepart)}&end=${toLocalDateParam(dateArrivee)}&guests=${voyageurs}`}>
                      <Button
                        size="lg"
                        className="w-full rounded-2xl mb-4"
                        disabled={!dateArrivee || !dateDepart || nuits <= 0}
                      >
                        Réserver
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full rounded-2xl mb-4"
                      disabled
                    >
                      Réservé aux voyageurs
                    </Button>
                  )}
                  {isAdmin && (
                    <p className="text-center text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Les comptes admin ne peuvent pas reserver.
                    </p>
                  )}
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400 mb-6">Aucun paiement débité maintenant</p>

                  {nuits > 0 && (
                    <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex justify-between">
                        <span className="underline">{prixNuit} DH × {nuits} nuits</span>
                        <span>{sousTotal} DH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="underline">Frais de ménage</span>
                        <span>{fraisMenage} DH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="underline">Frais de service RentHub</span>
                        <span>{fraisService} DH</span>
                      </div>
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold text-slate-900 dark:text-white text-lg">
                        <span>Total (MAD)</span>
                        <span>{prixTotal} DH</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="mt-6 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-start space-x-4">
                <Shield className="h-6 w-6 text-primary-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Protection RentHub</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Chaque réservation inclut une protection gratuite contre les annulations et les problèmes à l'arrivée.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 dark:text-slate-400"
                  onClick={handleContacterHote}
                  disabled={!canContact}
                >
                  <MessageSquare className="h-4 w-4 mr-2" /> Contacter l'hôte
                </Button>
                {!canContact && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cette action est réservée aux voyageurs.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
