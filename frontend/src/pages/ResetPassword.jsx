import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { reinitialiserMotDePasse } from '../api/authAPI';
import { API_BASE_URL } from '../constants/api';

const schema = z.object({
  motDePasse: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caracteres'),
  confirmer: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caracteres'),
}).refine((data) => data.motDePasse === data.confirmer, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmer'],
});

export const ResetPassword = () => {
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(null);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(() => params.get('token') || '', [params]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setChargement(true);
    setErreur(null);
    setSucces(null);

    try {
      if (!API_BASE_URL) {
        setErreur('Fonction disponible uniquement avec le backend.');
        return;
      }
      if (!token) {
        setErreur('Lien invalide.');
        return;
      }
      await reinitialiserMotDePasse(token, data.motDePasse);
      setSucces('Votre mot de passe a ete mis a jour.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.message || err?.message;
      setErreur(message || 'Impossible de reinitialiser le mot de passe.');
    } finally {
      setChargement(false);
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
            <CardTitle className="text-2xl font-display font-bold">Nouveau mot de passe</CardTitle>
            <p className="text-sm text-slate-500">Choisissez un mot de passe securise</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {erreur && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {erreur}
              </div>
            )}
            {succes && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-100">
                {succes}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Nouveau mot de passe"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                {...register('motDePasse')}
                error={errors.motDePasse?.message}
              />
              <Input
                label="Confirmer le mot de passe"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                {...register('confirmer')}
                error={errors.confirmer?.message}
              />

              <Button type="submit" className="w-full rounded-xl" isLoading={chargement}>
                Mettre a jour <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
