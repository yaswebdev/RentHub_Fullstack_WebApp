import React, { useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

/** Remonte automatiquement en haut de page à chaque changement de route */
const DefilementHaut = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

/** Mise en page principale : Barre de navigation + contenu + pied de page */
export const Layout = () => (
  <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50">
    <DefilementHaut />
    <Navbar />
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);
