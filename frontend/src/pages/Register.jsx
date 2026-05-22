import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { inscriptionUtilisateur } from '../api/authAPI';
import { API_BASE_URL } from '../constants/api';
import { cn } from '../lib/utils';

const registerSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Format d\'e-mail invalide'),
  motDePasse: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmer: z.string()
}).refine((data) => data.motDePasse === data.confirmer, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmer"],
});

export const Register = () => {
  const [role, setRole] = useState('voyageur');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  const { connecterAvecJWT } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setChargement(true);
    setErreur(null);

    try {
      if (API_BASE_URL) {
        const { token, utilisateur } = await inscriptionUtilisateur(data.nom, data.email, data.motDePasse, role);
        connecterAvecJWT(utilisateur, token);
        navigate('/dashboard');
      } else {
        setErreur('Inscription par email disponible uniquement avec le backend.');
      }
    } catch (err) {
      setErreur(err.response?.data?.message || err.message || 'Échec de l\'inscription.');
    } finally {
      setChargement(false);
    }
  };


  return (
    <div className="pt-32 pb-20 min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 z-0 bg-slate-50">
        <div className="absolute top-0 left-0 -translate-y-1/4 -translate-x-1/3 w-[700px] h-[700px] bg-violet-300 rounded-full blur-[130px] opacity-40 mix-blend-multiply pointer-events-none" />
        <div className="absolute bottom-0 right-0 translate-y-1/4 translate-x-1/4 w-[500px] h-[500px] bg-primary-300 rounded-full blur-[100px] opacity-40 mix-blend-multiply pointer-events-none" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="glass border-white/50 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-display font-bold">Créer un compte</CardTitle>
            <p className="text-sm text-slate-500">Rejoignez RentHub Maroc et commencez l'aventure</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {[
                { valeur: 'voyageur', label: 'Je suis voyageur' },
                { valeur: 'hote',     label: 'Je suis hôte' },
              ].map(({ valeur, label }) => (
                <button
                  key={valeur}
                  type="button"
                  onClick={() => setRole(valeur)}
                  className={cn(
                    'py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200',
                    role === valeur
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-primary-300 hover:bg-primary-50/50'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {erreur && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {erreur}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Nom complet"
                type="text"
                placeholder="Votre nom"
                icon={<User className="h-4 w-4" />}
                {...register('nom')}
                error={errors.nom?.message}
              />
              <Input
                label="Adresse e-mail"
                type="text"
                placeholder="nom@exemple.com"
                icon={<Mail className="h-4 w-4" />}
                {...register('email')}
                error={errors.email?.message}
              />
              <Input
                label="Mot de passe"
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
                Créer mon compte <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500">
              Déjà inscrit ?{' '}
              <Link to="/login" className="font-bold text-primary-600 hover:underline">
                Se connecter
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
