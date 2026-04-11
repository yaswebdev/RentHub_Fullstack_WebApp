import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { coordonneesRapides } from '../api/maps/geocodingAPI';
import { TILE_CARTO_VOYAGER } from '../api/maps/mapsConfig';

/** Marqueur personnalisé RentHub pour la recherche (Plus compact) */
const creerIconeRecherche = () =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        background: #4f46e5;
        color: white;
        border-radius: 50%;
        width: 24px; height: 24px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(79,70,229,0.5);
        border: 2px solid white;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>`,
    iconSize:   [24, 24],
    iconAnchor: [12, 12],
    popupAnchor:[0, -14],
  });

// Utilitaires de recentrage dynamique
const RecentreAuto = ({ points }) => {
  const map = useMap();
  React.useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    } else {
      map.setView([31.7917, -7.0926], 5); // Centre du Maroc par défaut
    }
  }, [points, map]);
  return null;
};

/**
 * MapRecherche — Affiche une liste de propriétés sur une grande carte
 */
export const MapRecherche = ({ proprietes }) => {
  const navigate = useNavigate();

  // Extraction et compilation des coordonnées valides via le cache local
  // Pour éviter la limite d'API sur 50+ requêtes d'un coup
  const markerData = useMemo(() => {
    const list = [];
    // Utiliser un décalage très léger pour ne pas superposer exactement
    // les pins sur les coord fixes de la ville (ex: tous à Marrakech)
    const offsets = {};

    proprietes.forEach((p) => {
      const locStr = typeof p.location === 'string' ? p.location : (p.location?.city || p.ville || '');
      const coords = coordonneesRapides(locStr);
      
      if (coords) {
        // Disperser un peu les pings
        const coordKey = `${coords.lat}-${coords.lon}`;
        if (!offsets[coordKey]) offsets[coordKey] = 0;
        
        offsets[coordKey] += 1;
        const offsetLat = coords.lat + (Math.random() - 0.5) * 0.02 * offsets[coordKey];
        const offsetLon = coords.lon + (Math.random() - 0.5) * 0.02 * offsets[coordKey];

        list.push({
          prop: p,
          lat: offsetLat,
          lon: offsetLon
        });
      }
    });
    return list;
  }, [proprietes]);

  const icone = creerIconeRecherche();
  const boundsPoints = markerData.map(m => [m.lat, m.lon]);

  return (
    <div className="h-full w-full relative bg-slate-100">
      <MapContainer
        center={[31.7917, -7.0926]}
        zoom={5}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          url={TILE_CARTO_VOYAGER.url}
          attribution={TILE_CARTO_VOYAGER.attribution}
          subdomains={TILE_CARTO_VOYAGER.subdomains || 'abc'}
        />
        
        <RecentreAuto points={boundsPoints} />

        {markerData.map((marker, i) => {
          const { prop, lat, lon } = marker;
          const px = prop.pricePerNight || prop.prixParNuit;
          const img = prop.image || prop.images?.[0];
          return (
            <Marker key={prop.id || i} position={[lat, lon]} icon={icone}>
              <Popup className="renthub-popup-search" minWidth={200} closeButton={false}>
                <div 
                  className="cursor-pointer overflow-hidden rounded-lg group"
                  onClick={() => navigate(`/property/${prop.id}`)}
                >
                  <div className="relative h-24 mb-2">
                    <img src={img} alt="" className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="px-1 pb-1">
                    <h4 className="font-bold text-slate-800 text-xs line-clamp-1">{prop.title}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold text-primary-600 text-sm">{px} DH</span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        {prop.rating || 'Nouveau'}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
