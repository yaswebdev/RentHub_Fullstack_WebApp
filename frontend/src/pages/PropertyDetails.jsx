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
import { fr } from 'date-fns/locale';
import { cn, getLocationString, calculerNuits } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePropriete } from '../hooks/useProprietes';
import { creerChat } from '../api/chatAPI';
import { fetchMesReservations } from '../api/reservationsAPI';
import { fetchAvisByAnnonce } from '../api/avisAPI';
import { API_BASE_URL } from '../constants/api';
import { getDocs, query, where, collection, db } from '../firebase';

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

  const handleContacterHote = async () => {
    if (!user) { navigate('/login'); return; }
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

      // Mode dev Firebase : vérifier si une conversation existe déjà
      const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
      const snapshot = await getDocs(q);
      let chatExistantId = null;

      snapshot.forEach((d) => {
        const participants = d.data().participants || [];
        if (participants.includes(property.hostId)) chatExistantId = d.id;
      });

      if (chatExistantId) {
        navigate(`/chat/${chatExistantId}`);
      } else {
        const nouveauChat = await creerChat(
          [user.uid, property.hostId],
          property.id,
          property.title,
          {
            [user.uid]:      { name: user.displayName || 'Voyageur', photo: user.photoURL || '' },
            [property.hostId]: { name: property.hostName || 'Hôte', photo: property.hostPhoto || '' },
          }
        );
        navigate(`/chat/${nouveauChat.id}`);
      }
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
  const nuits = dateArrivee && dateDepart ? calculerNuits(dateArrivee.toISOString(), dateDepart.toISOString()) : 0;
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
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">
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
            {property.isSuperhost && (
              <div className="flex items-center text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded text-xs">
                <Shield className="h-3 w-3 mr-1" /> Super Hôte
              </div>
            )}
          </div>
        </div>

        {/* Galerie photos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 h-[400px] md:h-[500px]">
          <div 
            className="md:col-span-2 h-full rounded-2xl overflow-hidden cursor-pointer relative group"
            onClick={() => { setPhotoIndex(0); setLightboxOpen(true); }}
          >
            <img src={images[0]} alt="Photo principale" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          <div className="hidden md:grid grid-cols-2 col-span-2 gap-4 h-full">
            {images.slice(1, 5).map((img, i) => (
              <div 
                key={i} 
                className="rounded-2xl overflow-hidden h-full cursor-pointer relative group"
                onClick={() => { setPhotoIndex(i + 1); setLightboxOpen(true); }}
              >
                <img src={img} alt={`Photo ${i + 2}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
            ))}
            {images.length < 5 &&
              Array.from({ length: 4 - Math.max(0, images.length - 1) }).map((_, i) => (
                <div key={`ph-${i}`} className="rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center h-full">
                  <HomeIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                </div>
              ))}
          </div>
        </div>

        {/* Bouton toutes les photos (mobile only ou extra) */}
        <div className="flex justify-end mb-8 md:hidden">
          <Button variant="outline" size="sm" onClick={() => { setPhotoIndex(0); setLightboxOpen(true); }}>
            Voir toutes les photos
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
                  src={property?.hostPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(property?.hostName || 'Hote')}&background=6366f1&color=fff`}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {localReviews.map((avis) => (
                  <div key={avis.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={avis.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(avis.userName || 'U')}&background=6366f1&color=fff`}
                        className="h-12 w-12 rounded-full object-cover"
                        alt=""
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{avis.userName}</p>
                        <p className="text-xs text-slate-500">{avis.date}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      "{avis.comment}"
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
                  <div className="flex items-end justify-between mb-6">
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
                      <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white mb-1">Arrivée</p>
                      <DatePicker
                        selected={dateArrivee}
                        onChange={(date) => setDateArrivee(date)}
                        placeholderText="Ajouter"
                        className="bg-transparent border-none focus:outline-none text-sm text-slate-700 dark:text-slate-200 w-full"
                        minDate={new Date()}
                        locale={fr}
                        dateFormat="dd/MM/yyyy"
                      />
                    </div>
                    <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white mb-1">Départ</p>
                      <DatePicker
                        selected={dateDepart}
                        onChange={(date) => setDateDepart(date)}
                        placeholderText="Ajouter"
                        className="bg-transparent border-none focus:outline-none text-sm text-slate-700 dark:text-slate-200 w-full"
                        minDate={dateArrivee || new Date()}
                        locale={fr}
                        dateFormat="dd/MM/yyyy"
                        disabled={!dateArrivee}
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

                  <Link to={`/booking/${property?.id}?start=${dateArrivee?.toISOString()}&end=${dateDepart?.toISOString()}&guests=${voyageurs}`}>
                    <Button 
                      size="lg" 
                      className="w-full rounded-2xl mb-4"
                      disabled={!dateArrivee || !dateDepart || nuits <= 0}
                    >
                      Réserver
                    </Button>
                  </Link>
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

              <div className="mt-6 flex justify-center">
                <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={handleContacterHote}>
                  <MessageSquare className="h-4 w-4 mr-2" /> Contacter l'hôte
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
