import React from 'react';
import { Link } from 'react-router-dom';
import { Map, Facebook, Twitter, Instagram } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="mb-12">
          {/* Brand */}
          <div className="max-w-md">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary-600 to-violet-600 shadow-lg shadow-primary-500/20">
                <Map className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-display font-bold tracking-tight text-white">
                RentHub
                <span className="text-xs font-bold uppercase tracking-wider ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-white">
                  Maroc
                </span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Découvrez les plus beaux logements à travers le Maroc. Que vous cherchiez un riad traditionnel, une villa de luxe ou un appartement moderne au cœur de la ville.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-primary-500 hover:text-white transition-all">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-primary-500 hover:text-white transition-all">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-primary-500 hover:text-white transition-all">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} RentHub Maroc, Inc. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link to="/confidentialite" className="hover:text-white transition-colors">Confidentialite</Link>
            <Link to="/conditions" className="hover:text-white transition-colors">Conditions generales</Link>
            <Link to="/fonctionnement" className="hover:text-white transition-colors">Fonctionnement du site</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
