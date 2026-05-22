import React from 'react';
import { FileText, CheckCircle } from 'lucide-react';

const TERMS = [
  {
    title: 'Utilisation de la plateforme',
    points: [
      'Fournir des informations exactes lors de la creation du compte.',
      'Respecter les regles de la communaute RentHub.',
      'Ne pas publier de contenu frauduleux ou trompeur.',
    ],
  },
  {
    title: 'Reservations et paiements',
    points: [
      'Les reservations sont confirmees selon les conditions affichees.',
      'Les frais et taxes sont indiques avant le paiement.',
      'Les remboursements suivent les regles d annulation applicables.',
    ],
  },
  {
    title: 'Responsabilites',
    points: [
      'Les hotes sont responsables des informations sur leurs logements.',
      'Les voyageurs s engagent a respecter les lieux reserves.',
      'RentHub peut suspendre un compte en cas d abus.',
    ],
  },
];

export const Terms = () => {
  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold mb-6">
            <FileText className="h-4 w-4 text-primary-600" /> Conditions generales
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900">Conditions generales d utilisation</h1>
          <p className="mt-4 text-lg text-slate-600">
            Ces conditions encadrent l usage de RentHub par les voyageurs et les hotes.
          </p>
        </div>

        <div className="mt-12 space-y-6">
          {TERMS.map((section) => (
            <div key={section.title} className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">{section.title}</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                {section.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary-600 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
