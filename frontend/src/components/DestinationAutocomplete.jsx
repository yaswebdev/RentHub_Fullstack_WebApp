import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Landmark, Waves, Mountain, Compass, Palmtree } from 'lucide-react';
import { cn } from '../lib/utils';

const DESTINATIONS = [
  { city: 'Marrakech', desc: 'Médina, riads et jardins secrets', icon: Landmark },
  { city: 'Casablanca', desc: 'Architecture, plages et énergie urbaine', icon: MapPin },
  { city: 'Rabat', desc: 'Capitale calme et élégante', icon: Compass },
  { city: 'Agadir', desc: 'Destination balnéaire ensoleillée', icon: Waves },
  { city: 'Tanger', desc: 'Carrefour culturel entre mer et montagne', icon: Mountain },
  { city: 'Fès', desc: 'Ville impériale et artisanat d’exception', icon: Landmark },
  { city: 'Essaouira', desc: 'Brise atlantique et ambiance bohème', icon: Palmtree },
  { city: 'Ouarzazate', desc: 'Porte du désert et kasbahs', icon: Mountain },
  { city: 'Chefchaouen', desc: 'La perle bleue du Rif', icon: Compass },
  { city: 'Tétouan', desc: 'Héritage andalou et douceur méditerranéenne', icon: Landmark },
];

export const DestinationAutocomplete = ({ value, onChange, onSelect, className }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return DESTINATIONS;
    return DESTINATIONS.filter((d) => d.city.toLowerCase().includes(q));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city) => {
    onSelect(city);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative flex-1 px-6 py-4', className)}>
      <p className="text-[11px] font-bold text-slate-700">Destination</p>
      <input
        type="text"
        placeholder="Rechercher une destination"
        className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-600"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />

      {open && (
        <div className="absolute left-0 right-0 mt-4 bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 z-30">
          <p className="text-xs font-semibold text-slate-500 mb-3">Suggestions de destinations</p>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {filtered.map((d) => {
              const Icon = d.icon;
              return (
                <button
                  key={d.city}
                  type="button"
                  onClick={() => handleSelect(d.city)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-50 text-left"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {d.city}, Morocco
                    </p>
                    <p className="text-xs text-slate-500">{d.desc}</p>
                  </div>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="px-3 py-6 text-sm text-slate-500">
                Aucune destination trouvée.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
