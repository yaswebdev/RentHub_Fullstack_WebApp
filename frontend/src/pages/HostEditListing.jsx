import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Home, MapPin, DollarSign, Navigation, ChevronLeft, Save, ImagePlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { fetchProprieteParId, modifierPropriete } from '../api/proprietesAPI';
import { uploadPhotos } from '../api/photosAPI';
import { useToast } from '../context/ToastContext';

export const HostEditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chargement, setChargement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [form, setForm] = useState({
    titre: '',
    description: '',
    prixNuit: '',
    adresse: '',
    latitude: '',
    longitude: '',
  });
  const [photos, setPhotos] = useState([]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = useMemo(
    () => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    []
  );

  useEffect(() => {
    if (!id) return;
    fetchProprieteParId(id)
      .then((propriete) => {
        setForm({
          titre: propriete.title || propriete.titre || '',
          description: propriete.description || '',
          prixNuit: propriete.pricePerNight || propriete.prixNuit || '',
          adresse: propriete.adresse || propriete.location || '',
          latitude: propriete.latitude ?? '',
          longitude: propriete.longitude ?? '',
        });
        setExistingPhotos(propriete.images || []);
      })
      .catch(() => {
        toast('Impossible de charger l\'annonce.', 'error');
      })
      .finally(() => setLoading(false));
  }, [id, toast]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!id) return;
    setChargement(true);
    try {
      const payload = {
        titre: form.titre.trim(),
        description: form.description.trim(),
        prixNuit: form.prixNuit ? Number(form.prixNuit) : null,
        adresse: form.adresse.trim(),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      };

      await modifierPropriete(id, payload);

      if (photos.length > 0) {
        try {
          const batchSize = 2;
          for (let i = 0; i < photos.length; i += batchSize) {
            const batch = photos.slice(i, i + batchSize);
            await uploadPhotos(id, batch);
          }
        } catch {
          toast('Annonce mise a jour, mais l\'upload des photos a echoue.', 'warning');
          navigate('/dashboard');
          return;
        }
      }

      toast('Annonce mise a jour.', 'success');
      navigate('/dashboard');
    } catch (err) {
      toast(err.message || 'Impossible de mettre a jour l\'annonce.', 'error');
    } finally {
      setChargement(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="h-64 rounded-3xl bg-white animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link to="/dashboard" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6">
          <ChevronLeft className="h-4 w-4 mr-2" /> Retour au tableau de bord
        </Link>

        <Card className="shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Modifier l'annonce</CardTitle>
            <p className="text-sm text-slate-500">
              Mettez a jour les informations et ajoutez de nouvelles photos.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Titre"
                placeholder="Ex: Riad moderne au coeur de la Medina"
                icon={<Home className="h-4 w-4" />}
                value={form.titre}
                onChange={(e) => updateField('titre', e.target.value)}
                required
              />

              <div className="w-full space-y-2">
                <label className="text-sm font-bold text-slate-700 tracking-tight">Description</label>
                <textarea
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-200 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:border-primary-500"
                  placeholder="Decrivez votre logement, ses points forts, et l'experience proposee."
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  required
                />
              </div>

              <Input
                label="Prix par nuit (DH)"
                type="number"
                min="1"
                placeholder="Ex: 850"
                icon={<DollarSign className="h-4 w-4" />}
                value={form.prixNuit}
                onChange={(e) => updateField('prixNuit', e.target.value)}
                required
              />

              <Input
                label="Adresse"
                placeholder="Ex: Medina, Marrakech"
                icon={<MapPin className="h-4 w-4" />}
                value={form.adresse}
                onChange={(e) => updateField('adresse', e.target.value)}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Latitude (optionnel)"
                  type="number"
                  step="0.000001"
                  placeholder="Ex: 31.6295"
                  icon={<Navigation className="h-4 w-4" />}
                  value={form.latitude}
                  onChange={(e) => updateField('latitude', e.target.value)}
                />
                <Input
                  label="Longitude (optionnel)"
                  type="number"
                  step="0.000001"
                  placeholder="Ex: -7.9811"
                  icon={<Navigation className="h-4 w-4" />}
                  value={form.longitude}
                  onChange={(e) => updateField('longitude', e.target.value)}
                />
              </div>

              {existingPhotos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-700 tracking-tight">Photos actuelles</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {existingPhotos.map((photoUrl) => (
                      <img
                        key={photoUrl}
                        src={photoUrl}
                        alt="Annonce"
                        className="h-24 w-full rounded-2xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="w-full space-y-2">
                <label className="text-sm font-bold text-slate-700 tracking-tight">Ajouter des photos</label>
                <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-white">
                  <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-slate-600">
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100">
                      <ImagePlus className="h-5 w-5" />
                    </span>
                    Ajouter des photos (max 10)
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const selected = Array.from(e.target.files || []).slice(0, 10);
                        const valid = selected.filter(
                          (file) => ALLOWED_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE
                        );
                        const rejected = selected.length - valid.length;
                        if (rejected > 0) {
                          toast('Certaines photos sont trop lourdes (5MB max) ou au mauvais format.', 'warning');
                        }
                        setPhotos(valid);
                      }}
                    />
                  </label>
                  {photos.length > 0 && (
                    <div className="mt-3 text-xs text-slate-500">
                      {photos.length} photo(s) selectionnee(s)
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="ghost" type="button" onClick={() => navigate('/dashboard')}>
                  Annuler
                </Button>
                <Button type="submit" isLoading={chargement}>
                  <Save className="h-4 w-4" /> Enregistrer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
