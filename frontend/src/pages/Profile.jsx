import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadProfilePhoto, changePassword } from '../api/userAPI';
import { getProfilePhotoUrl } from '../utils/imageHelpers';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';

export const Profile = () => {
  const { utilisateur, mettreAJourUtilisateur, token } = useAuth();
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [chargementPhoto, setChargementPhoto] = useState(false);
  const [chargementMDP, setChargementMDP] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(null);
  const navigate = useNavigate();
  const photoInputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setPhotoFile(f);
    setSucces(null);
    setErreur(null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      void submitPhotoFile(f);
    } else {
      setPreviewUrl(null);
    }
  };

  const openPhotoPicker = () => {
    if (photoInputRef.current) {
      photoInputRef.current.click();
    }
  };

  const submitPhotoFile = async (file) => {
    if (!file) return;
    setChargementPhoto(true); setErreur(null); setSucces(null);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const updated = await uploadProfilePhoto(fd);
      // update local user profile without touching token
      mettreAJourUtilisateur(updated);
      setSucces('Photo de profil mise à jour.');
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
      setPhotoFile(null);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    } catch (err) {
      setErreur(err.response?.data?.message || err.message || "Échec de l'upload");
    } finally { setChargementPhoto(false); }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    const current = e.target.currentPassword.value;
    const next = e.target.newPassword.value;
    const confirm = e.target.confirmPassword.value;
    if (!current || !next || next !== confirm) return setErreur('Vérifiez les champs de mot de passe');
    setChargementMDP(true); setErreur(null); setSucces(null);
    try {
      await changePassword(current, next);
      setSucces('Mot de passe changé avec succès.');
      navigate('/dashboard');
    } catch (err) {
      setErreur(err.response?.data?.message || err.message || 'Échec du changement de mot de passe');
    } finally { setChargementMDP(false); }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Mon profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {erreur && <div className="p-3 bg-red-50 text-red-600 rounded">{erreur}</div>}
            {succes && <div className="p-3 bg-green-50 text-green-700 rounded">{succes}</div>}

            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <img src={previewUrl || getProfilePhotoUrl(utilisateur?.photoURL) || `https://ui-avatars.com/api/?name=${encodeURIComponent(utilisateur?.displayName || 'U')}&background=6366f1&color=fff`} alt="avatar" className="h-24 w-24 rounded-full object-cover border-2 border-white shadow" referrerPolicy="no-referrer" />
                  <div className="text-xs text-slate-500 mt-2">JPG, PNG — max 5MB</div>
                </div>
                <div className="flex-1">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button type="button" onClick={openPhotoPicker} isLoading={chargementPhoto} className="w-full sm:w-auto">
                    Upload Photo
                  </Button>
                </div>
              </div>
            </div>

            <form onSubmit={submitPassword} className="space-y-4">
              <Input label="Mot de passe actuel" name="currentPassword" type="password" />
              <Input label="Nouveau mot de passe" name="newPassword" type="password" />
              <Input label="Confirmer le mot de passe" name="confirmPassword" type="password" />
              <Button type="submit" isLoading={chargementMDP}>Changer le mot de passe</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
