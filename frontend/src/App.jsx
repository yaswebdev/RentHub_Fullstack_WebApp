import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { PropertyDetails } from './pages/PropertyDetails';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { Booking } from './pages/Booking';
import { HostNewListing } from './pages/HostNewListing';
import { HostEditListing } from './pages/HostEditListing';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <FavoritesProvider>
          <AuthProvider>
            <ToastProvider>
              <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="search" element={<Search />} />
                  <Route path="property/:id" element={<PropertyDetails />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />

                  {/* Routes protégées — connexion requise */}
                  <Route path="dashboard" element={
                    <ProtectedRoute><Dashboard /></ProtectedRoute>
                  } />
                  <Route path="chat" element={
                    <ProtectedRoute><Chat /></ProtectedRoute>
                  } />
                  <Route path="chat/:id" element={
                    <ProtectedRoute><Chat /></ProtectedRoute>
                  } />
                  <Route path="booking/:id" element={
                    <ProtectedRoute roles={["LOCATAIRE", "ADMIN"]}><Booking /></ProtectedRoute>
                  } />
                  <Route path="host/annonces/nouveau" element={
                    <ProtectedRoute roles={["HOTE", "ADMIN"]}><HostNewListing /></ProtectedRoute>
                  } />
                  <Route path="host/annonces/:id/editer" element={
                    <ProtectedRoute roles={["HOTE", "ADMIN"]}><HostEditListing /></ProtectedRoute>
                  } />

                  {/* Redirection par défaut */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
        </FavoritesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
