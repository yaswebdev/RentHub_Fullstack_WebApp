import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { Button } from '../components/Button';

export const PaymentCancel = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const reservationId = params.get('reservationId');

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 text-center shadow-sm">
          <CircleAlert className="h-14 w-14 text-amber-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Paiement annulé</h1>
          <p className="text-slate-600 mb-8">
            Aucun débit n'a été effectué. Vous pouvez reprendre le paiement quand vous le souhaitez.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {reservationId ? (
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">Reprendre depuis le tableau de bord</Button>
              </Link>
            ) : (
              <Link to="/search" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">Retour à la recherche</Button>
              </Link>
            )}
            <Link to="/search" className="w-full sm:w-auto">
              <Button variant="ghost" className="w-full sm:w-auto">Voir d'autres logements</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
