import React, { useMemo, useRef, useState } from 'react';
import {
  Compass,
  Copy,
  Crosshair,
  MapPin,
  Navigation,
  Search,
  Share2,
} from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand';
import {
  PARAKOU_NEIGHBORHOODS,
  coordsToLatLng,
  findNearestNeighborhood,
  generateDemoThreeWordCode,
  latLngToSvg,
} from '../../data/parakouSeed';
import { localPlatformAdapter } from '../../services/platformAdapter';
import { Coordinates, DeliveryLocation, SavedAddress } from '../../types/domain';

interface ParakouInteractiveMapProps {
  location: DeliveryLocation;
  onChange?: (next: DeliveryLocation) => void;
  editable?: boolean;
  originCoordinates?: Coordinates;
  originLabel?: string;
  destinationLabel?: string;
  movingProgress?: number; // 0..100
  movingLabel?: string;
  savedAddresses?: SavedAddress[];
  onNotify?: (msg: string, tone?: 'info' | 'success' | 'warning') => void;
  compact?: boolean;
}

export const ParakouInteractiveMap: React.FC<ParakouInteractiveMapProps> = ({
  location,
  onChange,
  editable = false,
  originCoordinates,
  originLabel = 'Point de départ',
  destinationLabel = 'Point exact client',
  movingProgress,
  movingLabel = 'En déplacement',
  savedAddresses = [],
  onNotify,
  compact = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gpsBusy, setGpsBusy] = useState(false);

  const filteredNeighborhoods = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return PARAKOU_NEIGHBORHOODS;
    return PARAKOU_NEIGHBORHOODS.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.landmarkHint.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  // Calcule une route avec point d'inflexion réaliste (virage sur axe principal)
  const routePoints = useMemo(() => {
    if (!originCoordinates) return null;
    const p0 = originCoordinates;
    const p2 = location.coordinates;
    // Point intermédiaire proche d'un axe routier (interpolation orthogonale adoucie)
    const midX = Math.round((p0.x + p2.x) / 2 + (p2.y - p0.y) * 0.14);
    const midY = Math.round((p0.y + p2.y) / 2 - (p2.x - p0.x) * 0.08);
    const p1 = {
      x: Math.max(60, Math.min(940, midX)),
      y: Math.max(60, Math.min(640, midY)),
    };
    return { p0, p1, p2 };
  }, [originCoordinates, location.coordinates]);

  const movingPoint = useMemo(() => {
    if (!routePoints || movingProgress === undefined) return null;
    const t = Math.max(0, Math.min(1, movingProgress / 100));
    const { p0, p1, p2 } = routePoints;
    if (t <= 0.5) {
      const k = t * 2;
      return {
        x: p0.x + (p1.x - p0.x) * k,
        y: p0.y + (p1.y - p0.y) * k,
      };
    }
    const k = (t - 0.5) * 2;
    return {
      x: p1.x + (p2.x - p1.x) * k,
      y: p1.y + (p2.y - p1.y) * k,
    };
  }, [routePoints, movingProgress]);

  const updatePin = (x: number, y: number, source: DeliveryLocation['gpsSource'] = 'map_pin') => {
    if (!onChange) return;
    const clampedX = Math.max(45, Math.min(955, Math.round(x)));
    const clampedY = Math.max(45, Math.min(655, Math.round(y)));
    const { lat, lng } = coordsToLatLng(clampedX, clampedY);
    const nearest = findNearestNeighborhood(clampedX, clampedY);
    const code = generateDemoThreeWordCode(clampedX, clampedY);

    onChange({
      ...location,
      coordinates: { x: clampedX, y: clampedY, lat, lng },
      neighborhood: nearest.name,
      threeWordCode: code,
      gpsSource: source,
    });
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!editable || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1000;
    const y = ((e.clientY - rect.top) / rect.height) * 700;
    updatePin(x, y, 'map_pin');
  };

  const handleUseGps = () => {
    if (!editable || !onChange) return;
    setGpsBusy(true);
    if (!navigator.geolocation) {
      setGpsBusy(false);
      // Repli démonstration Parakou
      updatePin(438, 286, 'browser_gps');
      onNotify?.('GPS navigateur indisponible : position de démonstration centrée sur Albarika.', 'info');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsBusy(false);
        const { latitude, longitude } = pos.coords;
        const inParakou =
          latitude >= 9.28 && latitude <= 9.40 && longitude >= 2.55 && longitude <= 2.70;
        if (inParakou) {
          const mapped = latLngToSvg(latitude, longitude);
          updatePin(mapped.x, mapped.y, 'browser_gps');
          onNotify?.('Position GPS détectée à Parakou.', 'success');
        } else {
          // L'utilisateur teste depuis hors-Parakou : centrage transparent sur Parakou
          updatePin(468, 316, 'browser_gps');
          onNotify?.(
            'GPS détecté hors zone Parakou : repère recentré sur le secteur de démonstration (Albarika).',
            'info'
          );
        }
      },
      () => {
        setGpsBusy(false);
        updatePin(468, 316, 'browser_gps');
        onNotify?.(
          'Accès GPS refusé ou indisponible : repère positionné sur Albarika (Parakou).',
          'warning'
        );
      },
      { timeout: 4500 }
    );
  };

  const handleShareLocation = async () => {
    const summary = localPlatformAdapter.formatShareableLocation(location);
    try {
      await navigator.clipboard.writeText(summary);
      onNotify?.('Position exacte et repères copiés pour partage.', 'success');
    } catch {
      onNotify?.(`Repère prêt : ${location.neighborhood} (${location.threeWordCode})`, 'info');
    }
  };

  return (
    <div className="space-y-3">
      {editable && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Chercher un quartier ou repère (Albarika, Zongo, Titirou…)"
              className="w-full h-11 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700"
            />
          </div>
          <button
            type="button"
            onClick={handleUseGps}
            disabled={gpsBusy}
            className="h-11 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            <Crosshair className="w-4 h-4" />
            <span>{gpsBusy ? 'Localisation…' : 'Ma position GPS'}</span>
          </button>
        </div>
      )}

      {/* Raccourcis quartiers & adresses enregistrées */}
      {editable && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {savedAddresses.map((addr) => (
            <button
              key={addr.id}
              type="button"
              onClick={() => onChange?.({ ...addr.location })}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-teal-200 bg-teal-50/70 text-teal-800 hover:bg-teal-100 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              {addr.title}
            </button>
          ))}
          {filteredNeighborhoods.map((node) => {
            const active = location.neighborhood === node.name;
            return (
              <button
                key={node.name}
                type="button"
                onClick={() =>
                  onChange?.({
                    ...location,
                    coordinates: { ...node.coordinates },
                    neighborhood: node.name,
                    threeWordCode: node.sampleThreeWords,
                    textAddress: location.textAddress || `${node.name}, ${node.landmarkHint}`,
                    gpsSource: 'preset',
                  })
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {node.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Carte vectorielle interactive de Parakou */}
      <div className="relative rounded-2xl border border-slate-200 bg-[#EEF2EF] overflow-hidden select-none">
        <svg
          ref={svgRef}
          viewBox="0 0 1000 700"
          onClick={handleSvgClick}
          className={`w-full ${compact ? 'h-56 sm:h-64' : 'h-72 sm:h-88'} block ${
            editable ? 'cursor-crosshair' : ''
          }`}
          role="img"
          aria-label="Carte interactive de Parakou"
        >
          {/* Fond urbain & zones vertes */}
          <rect x="0" y="0" width="1000" height="700" fill="#EDF1EE" />
          <path
            d="M 40 40 L 320 40 L 290 190 L 60 220 Z"
            fill="#E0EAE2"
          />
          <path
            d="M 730 420 L 960 400 L 960 660 L 690 660 Z"
            fill="#E0EAE2"
          />
          <rect x="370" y="210" width="230" height="190" rx="18" fill="#E5E9E6" />
          <rect x="405" y="425" width="185" height="145" rx="14" fill="#E5E9E6" />

          {/* Trame des rues secondaires */}
          <g stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.75">
            <line x1="120" y1="260" x2="880" y2="260" />
            <line x1="160" y1="350" x2="860" y2="350" />
            <line x1="140" y1="450" x2="820" y2="450" />
            <line x1="210" y1="535" x2="770" y2="535" />
            <line x1="270" y1="120" x2="270" y2="610" />
            <line x1="420" y1="100" x2="420" y2="630" />
            <line x1="610" y1="110" x2="610" y2="620" />
            <line x1="740" y1="150" x2="740" y2="590" />
          </g>

          {/* Grands axes routiers de Parakou */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* RNIE 2 Nord-Sud */}
            <path
              d="M 550 20 Q 520 200 495 360 T 340 680"
              stroke="#D6D3CD"
              strokeWidth="14"
            />
            <path
              d="M 550 20 Q 520 200 495 360 T 340 680"
              stroke="#FFFFFF"
              strokeWidth="9"
            />
            {/* Axe Ouest-Est (Banikanni -> Zongo -> Titirou -> Université) */}
            <path
              d="M 60 230 Q 320 280 510 350 T 940 300"
              stroke="#D6D3CD"
              strokeWidth="12"
            />
            <path
              d="M 60 230 Q 320 280 510 350 T 940 300"
              stroke="#FFFFFF"
              strokeWidth="7"
            />
            {/* Boulevard du Centenaire & Kpébié */}
            <path
              d="M 480 460 Q 600 475 760 550"
              stroke="#FFFFFF"
              strokeWidth="7"
            />
          </g>

          {/* Étiquettes de voies */}
          <text x="532" y="108" fontSize="11" fill="#64748B" fontWeight="600">
            RNIE 2 · Axe Malanville
          </text>
          <text x="200" y="646" fontSize="11" fill="#64748B" fontWeight="600">
            RNIE 2 · Vers Cotonou
          </text>
          <text x="768" y="286" fontSize="11" fill="#64748B" fontWeight="600">
            Route de l’Université
          </text>

          {/* Quartiers et points de repère */}
          {PARAKOU_NEIGHBORHOODS.map((n) => (
            <g key={n.name}>
              <circle
                cx={n.coordinates.x}
                cy={n.coordinates.y}
                r="4"
                fill="#94A3B8"
              />
              <text
                x={n.coordinates.x + 8}
                y={n.coordinates.y + 4}
                fontSize="13"
                fontWeight="700"
                fill="#334155"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {n.name}
              </text>
            </g>
          ))}

          {/* Repères notables */}
          <g fill="#475569" fontSize="11" fontWeight="500">
            <rect x="462" y="446" width="12" height="12" rx="6" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
            <text x="480" y="438">Carrefour Hubert Maga</text>
            <rect x="572" y="368" width="12" height="12" rx="3" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
            <text x="590" y="366">Marché Arzeke</text>
          </g>

          {/* Itinéraire simulé entre commerce/pro et client */}
          {routePoints && (
            <g>
              <polyline
                points={`${routePoints.p0.x},${routePoints.p0.y} ${routePoints.p1.x},${routePoints.p1.y} ${routePoints.p2.x},${routePoints.p2.y}`}
                fill="none"
                stroke="#0F766E"
                strokeWidth="4.5"
                strokeDasharray="10 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Point de départ */}
              <g transform={`translate(${routePoints.p0.x}, ${routePoints.p0.y})`}>
                <circle r="9" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3" />
                <rect x="14" y="-12" width={Math.max(96, originLabel.length * 6.5)} height="22" rx="6" fill="#0F172A" opacity="0.9" />
                <text x="21" y="3" fontSize="11" fill="#FFFFFF" fontWeight="600">
                  {originLabel}
                </text>
              </g>
            </g>
          )}

          {/* Marqueur mobile du livreur ou du professionnel */}
          {movingPoint && (
            <g transform={`translate(${movingPoint.x}, ${movingPoint.y})`}>
              <circle r="18" fill="#0D9488" opacity="0.22" />
              <circle r="10" fill="#0D9488" stroke="#FFFFFF" strokeWidth="3" />
              <rect
                x="-58"
                y="-36"
                width="116"
                height="22"
                rx="6"
                fill="#0F766E"
              />
              <text
                x="0"
                y="-21"
                textAnchor="middle"
                fontSize="11"
                fill="#FFFFFF"
                fontWeight="700"
              >
                {movingLabel}
              </text>
            </g>
          )}

          {/* Pin exact du client / lieu d'intervention */}
          <g transform={`translate(${location.coordinates.x}, ${location.coordinates.y})`}>
            <circle r="16" fill="#0F766E" opacity="0.16" />
            <path
              d="M 0 -28 C -10 -28 -18 -20 -18 -10 C -18 3 0 18 0 18 C 0 18 18 3 18 -10 C 18 -20 10 -28 0 -28 Z"
              fill="#B91C1C"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              transform="translate(0, -14)"
            />
            <circle cx="0" cy="-24" r="5" fill="#FFFFFF" />
            <rect
              x="-66"
              y="10"
              width="132"
              height="22"
              rx="6"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              strokeWidth="1"
            />
            <text
              x="0"
              y="25"
              textAnchor="middle"
              fontSize="11"
              fill="#0F172A"
              fontWeight="700"
            >
              {destinationLabel}
            </text>
          </g>
        </svg>

        {/* Barre d'information cartographique compacte */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-white/95 border-t border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-2 min-w-0">
            <Compass className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="font-medium text-slate-900 truncate">
              {location.neighborhood}, Parakou
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular text-slate-500">
              {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {editable && (
              <span className="text-slate-500 hidden sm:inline">
                Touchez la carte pour déplacer le repère exact
              </span>
            )}
            <button
              type="button"
              onClick={handleShareLocation}
              className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-900 font-medium cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Partager la position</span>
            </button>
          </div>
        </div>
      </div>

      {/* Champs structurés d'adresse, code compatible 3 mots et indications d'accès */}
      {editable ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Adresse textuelle & quartier
            </label>
            <input
              type="text"
              value={location.textAddress}
              onChange={(e) =>
                onChange?.({ ...location, textAddress: e.target.value })
              }
              placeholder="Ex. : Albarika, 2e ruelle après la pharmacie"
              className="w-full h-11 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Code compatible 3 mots (démo locale)
            </label>
            <div className="relative">
              <input
                type="text"
                value={location.threeWordCode}
                onChange={(e) =>
                  onChange?.({ ...location, threeWordCode: e.target.value })
                }
                placeholder="///mot1.mot2.mot3"
                className="w-full h-11 pl-3 pr-9 text-sm font-mono-tabular bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(location.threeWordCode);
                    onNotify?.('Code 3 mots copié.', 'success');
                  } catch {
                    onNotify?.(location.threeWordCode, 'info');
                  }
                }}
                title="Copier le code"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 leading-tight">
              {BRAND_CONFIG.what3wordsNotice}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Indications d’accès précises pour le livreur / pro
            </label>
            <input
              type="text"
              value={location.accessInstructions}
              onChange={(e) =>
                onChange?.({ ...location, accessInstructions: e.target.value })
              }
              placeholder="Ex. : Portail vert, maison à étage, appeler devant la boutique"
              className="w-full h-11 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-rose-700 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-slate-900">
                  {location.neighborhood} — {location.textAddress}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Indications d’accès : {location.accessInstructions || 'Non précisées'}
                </p>
              </div>
            </div>
            <span className="font-mono-tabular text-xs text-teal-800 bg-teal-50 px-2 py-1 rounded-md shrink-0">
              {location.threeWordCode}
            </span>
          </div>
          {movingProgress !== undefined && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-medium text-teal-800">
                <Navigation className="w-3.5 h-3.5" />
                <span>{movingLabel}</span>
              </span>
              <span className="font-mono-tabular">
                Progression du trajet : {Math.round(movingProgress)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
