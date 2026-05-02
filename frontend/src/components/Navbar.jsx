import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, User, Globe, Map as MapIcon, X } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOuvert, setMenuOuvert] = useState(false);
  // Désactiver la barre de recherche sur les pages d'authentification
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <>
      <nav
        className={cn(
          'fixed w-full z-50 transition-all duration-300',
          'bg-white/90 backdrop-blur-xl border-b border-slate-200/60 py-4 shadow-sm'
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 z-50 shrink-0">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-rose-500 shadow-lg">
                <MapIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-display font-bold tracking-tight text-slate-900">
                RentHub
                <span className="text-xs font-bold uppercase tracking-wider ml-1 px-1.5 py-0.5 rounded-full align-top bg-primary-100 text-primary-700">
                  Maroc
                </span>
              </span>
            </Link>

            {/* Onglets centraux */}
            {!isAuthPage && (
              <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-500">
                <button className="text-slate-900 border-b-2 border-slate-900 pb-2">Logements</button>
                <button className="hover:text-slate-900 pb-2">Expériences</button>
                <button className="hover:text-slate-900 pb-2">Services</button>
              </div>
            )}

            {/* Menu Utilisateur (Desktop) */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <button className="text-sm font-semibold text-slate-700 hover:text-slate-900">
                Devenir hôte
              </button>
              <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600" aria-label="Langue">
                <Globe className="h-5 w-5" />
              </button>
              {user ? (
                <Link to="/dashboard">
                  <div className="flex bg-white items-center gap-3 border border-slate-200 rounded-full p-1.5 pr-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=6366f1&color=fff`} 
                      alt="Profil" 
                      className="h-9 w-9 rounded-full object-cover border border-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-sm font-semibold tracking-tight text-slate-700">
                      Tableau de bord
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" className="text-slate-600">
                      Connexion
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" className="rounded-full px-6">
                      S'inscrire
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Bouton Mobile */}
            <button
              className="md:hidden p-2 rounded-xl z-50 text-slate-600 hover:bg-slate-100"
              onClick={() => setMenuOuvert(!menuOuvert)}
            >
              {menuOuvert ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Menu Mobile */}
      <AnimatePresence>
        {menuOuvert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-24 pb-6 px-4 md:hidden flex flex-col h-screen overflow-y-auto"
          >
            {!isAuthPage && (
              <div className="mb-8">
                <Link to="/search" onClick={() => setMenuOuvert(false)}>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Search className="h-5 w-5 text-primary-500" />
                      <span className="font-medium text-slate-800">Où allez-vous ?</span>
                    </div>
                    <span className="bg-white px-3 py-1 text-xs font-bold rounded-full border border-slate-200">
                      Rechercher
                    </span>
                  </div>
                </Link>
              </div>
            )}
            
            <div className="flex-1">
              <nav className="space-y-2">
                <Link to="/" onClick={() => setMenuOuvert(false)} className="block p-4 text-lg font-bold text-slate-800 rounded-xl hover:bg-slate-50">
                  Accueil
                </Link>
                <Link to="/search" onClick={() => setMenuOuvert(false)} className="block p-4 text-lg font-bold text-slate-800 rounded-xl hover:bg-slate-50">
                  Explorer le Maroc
                </Link>
              </nav>
            </div>

            <div className="mt-auto border-t border-slate-100 pt-6 space-y-3">
              {user ? (
                <Link to="/dashboard" onClick={() => setMenuOuvert(false)}>
                  <Button className="w-full justify-start h-14" size="lg">
                    <User className="mr-3 h-5 w-5" /> 
                    Mon Tableau de bord
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register" onClick={() => setMenuOuvert(false)}>
                    <Button className="w-full h-14 rounded-xl" size="lg">
                      Créer un compte
                    </Button>
                  </Link>
                  <Link to="/login" onClick={() => setMenuOuvert(false)}>
                    <Button variant="outline" className="w-full h-14 rounded-xl" size="lg">
                      Se connecter
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
