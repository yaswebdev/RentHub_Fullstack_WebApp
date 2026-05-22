import React from 'react';
import { ShieldCheck, Eye, Lock, FileText } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Donnees collectees',
    icon: Eye,
    body: 'Nous collectons les informations necessaires a la creation du compte, aux reservations et a la securite de la plateforme.',
  },
  {
    title: 'Utilisation des donnees',
    icon: FileText,
    body: 'Vos donnees servent a gerer les reservations, l assistance client et a ameliorer l experience RentHub.',
  },
  {
    title: 'Securite',
    icon: Lock,
    body: 'Nous appliquons des mesures techniques et organisationnelles pour proteger vos informations personnelles.',
  },
  {
    title: 'Vos droits',
    icon: ShieldCheck,
    body: 'Vous pouvez acceder a vos donnees, demander une correction ou une suppression via notre equipe support.',
  },
];

export const Privacy = () => {
  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900">Confidentialite</h1>
          <p className="mt-4 text-lg text-slate-600">
            Cette page explique comment RentHub traite vos informations personnelles et protege votre vie privee.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {SECTIONS.map((section) => (
            <div key={section.title} className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-primary-600/10 text-primary-600 flex items-center justify-center mb-4">
                <section.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{section.title}</h3>
              <p className="text-sm text-slate-600">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
