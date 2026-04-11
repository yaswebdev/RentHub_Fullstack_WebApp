import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, ExternalLink, ZoomIn } from 'lucide-react';
import { geocoderLieu, coordonneesRapides } from '../api/maps/geocodingAPI';
import { TILE_CARTO_VOYAGER, ZOOM_PROPRIETE } from '../api/maps/mapsConfig';

// Correction du bug des icônes Leaflet avec Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/** Marqueur personnalisé RentHub */
const creerIconeRentHub = () =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        color: white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        width: 40px; height: 40px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 15px rgba(79,70,229,0.4);
        border: 3px solid white;
      ">
        <svg style="transform: rotate(45deg)" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>`,
    iconSize:   [40, 40],
    iconAnchor: [20, 40],
    popupAnchor:[0, -44],
  });

/**
 * MapPropriete — Composant de carte pour une propriété.
 *
 * @param {{ ville: string, titre: string, prixNuit: number, exact?: boolean }} props
 *   exact = true  → affiche le marqueur précis
 *   exact = false → affiche un cercle flou (confidentialité si pas encore réservé)
 */
export const MapPropriete = ({ ville, titre, prixNuit, exact = false }) => {
  const [coordonnees, setCoordonnees] = useState(null);
  const [enChargement, setEnChargement] = useState(true);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!ville) {
      setErreur(true);
      setEnChargement(false);
      return;
    }

    // 1. Essai rapide depuis le cache local (instantané)
    const rapide = coordonneesRapides(ville);
    if (rapide) {
      setCoordonnees(rapide);
      setEnChargement(false);
      return;
    }

    // 2. Appel API Nominatim (asynchrone)
    geocoderLieu(ville)
      .then((coords) => {
        if (coords) {
          setCoordonnees(coords);
        } else {
          setErreur(true);
        }
      })
      .catch(() => setErreur(true))
      .finally(() => setEnChargement(false));
  }, [ville]);

  if (enChargement) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 rounded-2xl">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Chargement de la carte…</p>
        </div>
      </div>
    );
  }

  if (erreur || !coordonnees) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200">
        <div className="text-center p-8">
          <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Carte indisponible</p>
          <p className="text-xs text-slate-400 mt-1">{ville || 'Localisation non renseignée'}</p>
        </div>
      </div>
    );
  }

  const centre = [coordonnees.lat, coordonnees.lon];
  const icone  = creerIconeRentHub();

  return (
    <MapContainer
      center={centre}
      zoom={ZOOM_PROPRIETE}
      style={{ height: '100%', width: '100%' }}
      className="rounded-2xl z-0"
      scrollWheelZoom={false}
    >
      <TileLayer
        url={TILE_CARTO_VOYAGER.url}
        attribution={TILE_CARTO_VOYAGER.attribution}
        subdomains={TILE_CARTO_VOYAGER.subdomains || 'abc'}
        maxZoom={TILE_CARTO_VOYAGER.maxZoom || 20}
      />

      {exact ? (
        /* Marqueur précis */
        <Marker position={centre} icon={icone}>
          <Popup className="renthub-popup">
            <div className="p-1">
              <p className="font-bold text-slate-900 text-sm mb-1">{titre}</p>
              {prixNuit && (
                <p className="text-primary-600 font-semibold text-xs">{prixNuit} DH / nuit</p>
              )}
              <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {ville}, Maroc
              </p>
            </div>
          </Popup>
        </Marker>
      ) : (
        /* Zone floue — protection de la vie privée */
        <>
          <Circle
            center={centre}
            radius={500}
            pathOptions={{
              color:       '#4f46e5',
              fillColor:   '#4f46e5',
              fillOpacity: 0.12,
              weight:      2,
              dashArray:   '6,4',
            }}
          />
          <Marker position={centre} icon={icone}>
            <Popup>
              <div className="p-1">
                <p className="font-bold text-slate-900 text-sm mb-1">{titre}</p>
                <p className="text-xs text-slate-400 italic">
                  Emplacement approximatif.<br />L'adresse exacte est communiquée après réservation.
                </p>
              </div>
            </Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
};

export default MapPropriete;
