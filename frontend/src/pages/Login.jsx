import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { connexionEmailMotDePasse, demanderReinitialisation } from '../api/authAPI';
import { API_BASE_URL } from '../constants/api';

const loginSchema = z.object({
  email: z.string().min(1, 'L\'adresse e-mail est requise').email('Format d\'e-mail invalide'),
  motDePasse: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export const Login = () => {
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [resetOuvert, setResetOuvert] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetErreur, setResetErreur] = useState(null);
  const [resetSucces, setResetSucces] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  const { connecterAvecJWT } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const destination = location.state?.from?.pathname || '/dashboard';

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const getLoginErrorMessage = (err) => {
    const status = err?.response?.status;
    const data = err?.response?.data;

    if (data && typeof data === 'object') {
      if (data.error) {
        const message = String(data.error);
        if (message.toLowerCase().includes('utilisateur non trouvé')) {
          return 'Utilisateur introuvable. Veuillez verifier votre e-mail.';
        }
        if (message.toLowerCase().includes('bad credentials')) {
          return 'E-mail ou mot de passe incorrect.';
        }
        return message;
      }

      const fieldMessages = Object.values(data).filter((value) => typeof value === 'string');
      if (fieldMessages.length > 0) {
        return fieldMessages.join(' ');
      }
    }

    if (status === 404) {
      return 'Utilisateur introuvable. Veuillez verifier votre e-mail.';
    }
    if (status === 401 || status === 400) {
      return 'E-mail ou mot de passe incorrect.';
    }
    if (err?.message === 'Network Error') {
      return 'Impossible de joindre le serveur. Verifiez votre connexion.';
    }

    return 'E-mail ou mot de passe incorrect.';
  };

  const onSubmit = async (data) => {
    setChargement(true);
    setErreur(null);

    try {
      if (API_BASE_URL) {
        const { token, utilisateur } = await connexionEmailMotDePasse(data.email, data.motDePasse);
        connecterAvecJWT(utilisateur, token);
        navigate(destination, { replace: true });
      } else {
        setErreur('Connexion par email disponible uniquement avec le backend.');
      }
    } catch (err) {
      setErreur(getLoginErrorMessage(err));
    } finally {
      setChargement(false);
    }
  };

  const handleOpenReset = () => {
    setResetEmail('');
    setResetErreur(null);
    setResetSucces(null);
    setResetOuvert(true);
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setResetErreur(null);
    setResetSucces(null);

    if (!resetEmail.trim()) {
      setResetErreur('Veuillez saisir votre adresse e-mail.');
      return;
    }

    setResetLoading(true);
    try {
      await demanderReinitialisation(resetEmail.trim());
      setResetSucces('Un lien de reinitialisation a ete envoye.');
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.message || err?.message;
      setResetErreur(message || 'Impossible d\'envoyer l\'e-mail.');
    } finally {
      setResetLoading(false);
    }
  };


  return (
    <div className="pt-32 pb-20 min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 z-0 bg-slate-50">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/3 w-[800px] h-[800px] bg-primary-300 rounded-full blur-[120px] opacity-40 mix-blend-multiply pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-indigo-300 rounded-full blur-[100px] opacity-40 mix-blend-multiply pointer-events-none" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="glass border-white/50 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-display font-bold">Bienvenue</CardTitle>
            <p className="text-sm text-slate-500">Connectez-vous à votre compte RentHub</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {erreur && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {erreur}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Adresse e-mail"
                type="text"
                placeholder="nom@exemple.com"
                icon={<Mail className="h-4 w-4" />}
                {...register('email')}
                error={errors.email?.message}
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Mot de passe</label>
                  <button type="button" onClick={handleOpenReset} className="text-xs text-primary-600 hover:underline">
                    Mot de passe oublié ?
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock className="h-4 w-4" />}
                  {...register('motDePasse')}
                  error={errors.motDePasse?.message}
                />
              </div>

              <Button type="submit" className="w-full rounded-xl" isLoading={chargement}>
                Se connecter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500">
              Pas encore de compte ?{' '}
              <Link to="/register" className="font-bold text-primary-600 hover:underline">
                S'inscrire
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {resetOuvert && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-display font-bold text-slate-900">Mot de passe oublie</h2>
              <p className="text-sm text-slate-500">Saisissez votre e-mail pour recevoir un lien de reinitialisation.</p>
            </div>

            <form onSubmit={handleReset} className="px-6 py-5 space-y-4">
              {resetErreur && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {resetErreur}
                </div>
              )}
              {resetSucces && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-100">
                  {resetSucces}
                </div>
              )}

              <Input
                label="Adresse e-mail"
                type="text"
                placeholder="nom@exemple.com"
                icon={<Mail className="h-4 w-4" />}
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setResetOuvert(false)}
                >
                  Fermer
                </Button>
                <Button type="submit" className="rounded-xl" isLoading={resetLoading}>
                  Envoyer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
