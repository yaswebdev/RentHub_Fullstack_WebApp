import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, User, MapPin, Map as MapIcon, X, Sun, Moon } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [estDefile, setEstDefile] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);

  const isHome = location.pathname === '/';
  // Désactiver la barre de recherche sur les pages d'authentification
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    const handleScroll = () => {
      setEstDefile(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navTransparent = isHome && !estDefile && !menuOuvert;

  return (
    <>
      <nav
        className={cn(
          'fixed w-full z-50 transition-all duration-300',
          navTransparent
            ? 'bg-transparent py-6'
            : 'bg-white/80 backdrop-blur-xl border-b border-white/20 py-4 shadow-sm'
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 z-50 shrink-0">
              <div className={cn(
                "p-2 rounded-xl bg-gradient-to-br transition-colors",
                navTransparent ? "from-white/20 to-white/10 backdrop-blur-md" : "from-primary-600 to-violet-600 shadow-lg"
              )}>
                <MapIcon className={cn("h-6 w-6", navTransparent ? "text-white" : "text-white")} />
              </div>
              <span className={cn(
                "text-2xl font-display font-bold tracking-tight",
                navTransparent ? "text-white" : "text-slate-900"
              )}>
                RentHub
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider ml-1 px-1.5 py-0.5 rounded-full align-top",
                  navTransparent ? "bg-white/20 text-white" : "bg-primary-100 text-primary-700"
                )}>
                  Maroc
                </span>
              </span>
            </Link>

            {/* Barre de recherche (cachée sur mobile, pages auth, et quand transparent sur l'accueil) */}
            {!isAuthPage && !navTransparent && (
              <div className={cn(
                "hidden md:flex flex-1 max-w-md items-center rounded-full border p-1.5 shadow-sm transition-all duration-300 hover:shadow-md bg-white border-slate-200",
              )}>
                <div className="flex-1 px-4 text-sm font-medium">
                  <span className="text-slate-800">Où allez-vous ?</span>
                  <span className="block text-xs text-slate-500">Partout au Maroc</span>
                </div>
                <Link to="/search">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-colors cursor-pointer shadow-md">
                    <Search className="h-4 w-4" />
                  </div>
                </Link>
              </div>
            )}

            {/* Menu Utilisateur (Desktop) */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
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
                    <Button variant={navTransparent ? "ghost" : "ghost"} className={navTransparent ? "text-white hover:bg-white/10" : "text-slate-600"}>
                      Connexion
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant={navTransparent ? "secondary" : "primary"} className="rounded-full px-6">
                      S'inscrire
                    </Button>
                  </Link>
                </div>
              )}
              
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className={cn(
                  "p-2 rounded-full transition-colors ml-2",
                  navTransparent 
                    ? "text-white hover:bg-white/20" 
                    : "text-slate-600 hover:bg-slate-100"
                )}
                aria-label="Toggle Dark Mode"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-300" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>

            {/* Bouton Mobile */}
            <button 
              className={cn(
                "md:hidden p-2 rounded-xl z-50",
                navTransparent ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"
              )}
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
