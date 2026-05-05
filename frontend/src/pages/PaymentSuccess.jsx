import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { syncCheckoutSession } from '../api/paiementAPI';

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    const run = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        await syncCheckoutSession(sessionId);
        setSynced(true);
      } catch (error) {
        console.error('[PaymentSuccess] sync failed', error);
      } finally {
        setLoading(false);
        navigate('/dashboard', { replace: true });
      }
    };

    run();
  }, [navigate, searchParams]);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 text-center shadow-sm">
          {loading ? (
            <>
              <LoaderCircle className="h-14 w-14 text-primary-600 mx-auto mb-4 animate-spin" />
              <h1 className="text-3xl font-bold text-slate-900 mb-3">Validation du paiement...</h1>
              <p className="text-slate-600">Nous confirmons votre réservation avant de vous rediriger.</p>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-slate-900 mb-3">Paiement confirmé</h1>
              <p className="text-slate-600 mb-2">
                Votre paiement a été synchronisé avec succès. La réservation apparaît maintenant comme confirmée.
              </p>
              {synced ? (
                <p className="text-sm text-green-700 mb-8">Synchronisation effectuée.</p>
              ) : (
                <p className="text-sm text-amber-700 mb-8">Le paiement a été reçu, mais la synchronisation automatique n'a pas pu être vérifiée.</p>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/dashboard" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto">Aller au tableau de bord</Button>
                </Link>
                <Link to="/search" className="w-full sm:w-auto">
                  <Button variant="ghost" className="w-full sm:w-auto">Explorer d'autres logements</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
