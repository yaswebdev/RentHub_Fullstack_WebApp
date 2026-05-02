import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Star, Shield, CreditCard, ChevronLeft, Calendar as CalendarIcon, Users } from 'lucide-react';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';
import { Input } from '../components/Input';
import { usePropriete } from '../hooks/useProprietes';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../hooks/useReservations';
import { useToast } from '../context/ToastContext';
import { formatCurrency, calculerNuits } from '../lib/utils';
import { API_BASE_URL } from '../constants/api';
import { createPaymentIntent, confirmPaymentIntent } from '../api/paiementAPI';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#0f172a',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#dc2626' },
  },
};

const BookingInner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();

  const prefill = location.state || {};
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');
  const guestsParam = searchParams.get('guests');

  const toInputDate = (value) => {
    if (!value) return '';
    if (typeof value === 'string' && value.length >= 10) return value.slice(0, 10);
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
  };

  const { propriete: property, chargement: loadingProperty } = usePropriete(id);
  const currentUserId = user?.id || user?.uid;
  const { creer } = useReservations(currentUserId);

  const [dateDebut, setDateDebut] = useState(
    toInputDate(startParam || prefill.dateArrivee)
  );
  const [dateFin, setDateFin] = useState(
    toInputDate(endParam || prefill.dateDepart)
  );
  const [voyageurs, setVoyageurs] = useState(
    Number(guestsParam || prefill.voyageurs || 1)
  );
  const [chargement, setChargement] = useState(false);
  const [methodePaiement, setMethodePaiement] = useState('sur_place');
  const [erreurCarte, setErreurCarte] = useState(null);

  const stripeReady = Boolean(API_BASE_URL && stripePromise);

  const nuits = calculerNuits(dateDebut, dateFin);
  const prixNuit = property?.pricePerNight || property?.prixParNuit || 0;
  const sousTotal = prixNuit * nuits;
  const fraisMenage = 200;
  const fraisService = 150;
  const prixTotal = nuits > 0 ? sousTotal + fraisMenage + fraisService : 0;

  const handleReserver = async (e) => {
    e.preventDefault();
    if (!dateDebut || !dateFin || nuits <= 0) {
      toast('Veuillez sélectionner des dates valides', 'error');
      return;
    }

    setChargement(true);
    setErreurCarte(null);
    try {
      const reservation = await creer({
        proprieteId: property.id,
        propertyId: property.id,
        titrePropriete: property.title,
        propertyTitle: property.title,
        imagePropriete: property.image || property.images?.[0] || '',
        propertyImage: property.image || property.images?.[0] || '',
        dateDebut,
        startDate: dateDebut,
        dateFin,
        endDate: dateFin,
        nombreVoyageurs: Number(voyageurs),
        guests: Number(voyageurs),
        prixTotal,
        totalPrice: prixTotal,
        hoteId: property.hostId,
        hostId: property.hostId,
        methodePaiement,
        paymentMethod: methodePaiement
      });

      if (API_BASE_URL && methodePaiement === 'carte') {
        if (!stripe || !elements) {
          throw new Error('Stripe n\'est pas prêt. Vérifiez la clé publique.');
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Impossible de lire le formulaire de carte.');
        }

        const intent = await createPaymentIntent(reservation.id);
        const paymentMethodResult = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        });

        if (paymentMethodResult.error) {
          setErreurCarte(paymentMethodResult.error.message);
          throw new Error(paymentMethodResult.error.message);
        }

        await confirmPaymentIntent(intent.paymentIntentId, paymentMethodResult.paymentMethod.id);
      }

      toast('Réservation confirmée avec succès ! 🎉', 'success');
      navigate('/dashboard');
    } catch (err) {
      toast(err.message || 'Erreur lors de la réservation', 'error');
    } finally {
      setChargement(false);
    }
  };

  if (loadingProperty) {
    return (
      <div className="pt-32 min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="pt-32 min-h-screen text-center bg-slate-50">
        <h2 className="text-2xl font-bold mb-4">Propriété introuvable</h2>
        <Link to="/search">
          <Button>Retour à la recherche</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 mb-8 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Retour
        </button>

        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-8">
          Confirmer et payer
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Colonne gauche : Formulaire */}
          <div className="lg:col-span-7 space-y-10">
            {/* Détails du voyage */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Votre voyage</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Dates</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="date"
                      label="Arrivée"
                      value={dateDebut}
                      onChange={(e) => setDateDebut(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    <Input
                      type="date"
                      label="Départ"
                      value={dateFin}
                      onChange={(e) => setDateFin(e.target.value)}
                      min={dateDebut || new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Voyageurs</h3>
                  <select
                    className="w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    value={voyageurs}
                    onChange={(e) => setVoyageurs(e.target.value)}
                  >
                    {Array.from({ length: property.maxGuests || property.maxVoyageurs || 1 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i === 0 ? 'voyageur' : 'voyageurs'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <hr className="border-slate-200" />

            {/* Paiement */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Paiement</h2>
              
              <div className="space-y-4">
                <label className="flex items-start p-4 border rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors border-primary-500 bg-primary-50/20">
                  <input
                    type="radio"
                    name="paiement"
                    value="sur_place"
                    checked={methodePaiement === 'sur_place'}
                    onChange={() => setMethodePaiement('sur_place')}
                    className="mt-1"
                  />
                  <div className="ml-3">
                    <span className="block font-semibold text-slate-900">Payer sur place (recommandé)</span>
                    <span className="block text-sm text-slate-500 mt-1">Réservez maintenant sans carte. Payez votre hôte à l'arrivée.</span>
                  </div>
                </label>

                {API_BASE_URL && (
                  <label className="flex items-start p-4 border rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors border-slate-200">
                    <input
                      type="radio"
                      name="paiement"
                      value="carte"
                      checked={methodePaiement === 'carte'}
                      onChange={() => setMethodePaiement('carte')}
                      className="mt-1"
                      disabled={!stripeReady}
                    />
                    <div className="ml-3">
                      <span className="block font-semibold text-slate-900 flex items-center gap-2">
                        Carte bancaire <CreditCard className="h-4 w-4" />
                      </span>
                      <span className="block text-sm text-slate-500 mt-1">
                        {stripeReady
                          ? 'Paiement sécurisé via Stripe.'
                          : 'Ajoutez VITE_STRIPE_PUBLIC_KEY pour activer.'}
                      </span>
                    </div>
                  </label>
                )}

                {API_BASE_URL && methodePaiement === 'carte' && (
                  <div className="p-4 border border-slate-200 rounded-2xl bg-white">
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Carte bancaire</label>
                    <div className="p-3 border border-slate-200 rounded-xl">
                      <CardElement options={CARD_ELEMENT_OPTIONS} />
                    </div>
                    {erreurCarte && (
                      <p className="text-sm text-red-600 mt-2">{erreurCarte}</p>
                    )}
                  </div>
                )}
              </div>
            </section>

            <hr className="border-slate-200" />

            {/* Règles */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Règles fondamentales</h2>
              <p className="text-slate-600 mb-4 text-sm">
                Nous demandons à tous les voyageurs de respecter quelques règles simples qui font le succès de RentHub Maroc.
              </p>
              <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                <li>Respectez le règlement intérieur.</li>
                <li>Traitez le logement de l'hôte comme le vôtre.</li>
                <li>Respectez les coutumes locales.</li>
              </ul>
            </section>

            <Button
              size="lg"
              className="w-full h-14 text-lg rounded-2xl mt-8"
              onClick={handleReserver}
              isLoading={chargement}
              disabled={nuits <= 0}
            >
              Confirmer la réservation
            </Button>
          </div>

          {/* Colonne droite : Résumé de réservation */}
          <div className="lg:col-span-5 relative mt-8 lg:mt-0">
            <div className="sticky top-32">
              <Card className="shadow-xl border-slate-200">
                <CardContent className="p-6">
                  {/* Info propriété */}
                  <div className="flex gap-4 mb-6 pb-6 border-b border-slate-200">
                    <img
                      src={property.image || property.images?.[0]}
                      alt={property.title}
                      className="w-28 h-24 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col justify-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">{property.type}</p>
                      <h3 className="font-bold text-slate-900 leading-snug line-clamp-2">{property.title}</h3>
                      <div className="flex items-center text-sm mt-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                        <span className="font-bold">{property.rating || 'Nouveau'}</span>
                        <span className="text-slate-400 mx-1">•</span>
                        <span className="text-slate-500">{property.reviewCount || 0} avis</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-4">Détails du prix</h3>

                  {nuits > 0 ? (
                    <div className="space-y-4 text-slate-600">
                      <div className="flex justify-between">
                        <span>{formatCurrency(prixNuit)} × {nuits} nuits</span>
                        <span>{formatCurrency(sousTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="underline">Frais de ménage</span>
                        <span>{formatCurrency(fraisMenage)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="underline">Frais de service</span>
                        <span>{formatCurrency(fraisService)}</span>
                      </div>
                      <div className="pt-4 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-xl">
                        <span>Total (MAD)</span>
                        <span>{formatCurrency(prixTotal)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-slate-50 rounded-xl">
                      <CalendarIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">Sélectionnez vos dates pour voir le détail du prix.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="mt-6 flex items-start gap-4 p-4 bg-green-50 rounded-2xl border border-green-100">
                <Shield className="h-6 w-6 text-green-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Garantie RentHub</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Vous êtes protégé si l'hôte annule ou en cas de problème lors de l'arrivée.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Booking = () => {
  if (stripePromise) {
    return (
      <Elements stripe={stripePromise}>
        <BookingInner />
      </Elements>
    );
  }

  return <BookingInner />;
};
