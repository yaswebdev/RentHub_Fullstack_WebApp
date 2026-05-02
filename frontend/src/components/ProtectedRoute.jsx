import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../constants/api';

/** Protège les routes qui nécessitent une authentification */
const resolveRole = (user) => {
  const role = user?.role?.toUpperCase?.();
  if (role) return role;
  return API_BASE_URL ? null : 'LOCATAIRE';
};

export const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user) {
    // Rediriger vers la connexion en mémorisant la page cible
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles?.length) {
    const role = resolveRole(user);
    if (!role || !roles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
