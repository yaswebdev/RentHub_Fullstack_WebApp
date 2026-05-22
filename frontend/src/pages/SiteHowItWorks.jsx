import React from 'react';
import { Search, CalendarDays, CreditCard, Smile } from 'lucide-react';

const STEPS = [
  {
    title: 'Chercher un logement',
    desc: 'Utilisez la recherche et les filtres pour trouver un logement adapte a vos besoins.',
    icon: Search,
  },
  {
    title: 'Choisir les dates',
    desc: 'Selectionnez vos dates et verifiez la disponibilite en temps reel.',
    icon: CalendarDays,
  },
  {
    title: 'Payer en securite',
    desc: 'Reglez en ligne et recevez une confirmation immediate.',
    icon: CreditCard,
  },
  {
    title: 'Profiter du sejour',
    desc: 'Contactez votre hote et profitez d un sejour memorable.',
    icon: Smile,
  },
];

export const SiteHowItWorks = () => {
  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900">Fonctionnement du site</h1>
          <p className="mt-4 text-lg text-slate-600">
            Le parcours RentHub est simple : trouvez, reservez et voyagez en toute serenite.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {STEPS.map((step, index) => (
            <div key={step.title} className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-600/10 text-primary-600 flex items-center justify-center">
                  <step.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Etape {index + 1}</p>
                  <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                </div>
              </div>
              <p className="text-sm text-slate-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
