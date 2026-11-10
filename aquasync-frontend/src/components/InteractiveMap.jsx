import { useState, useMemo } from 'react';

// Reference coordinate bounds for city simulation
const CITY_BOUNDS = {
  minLat: 40.7000,
  maxLat: 40.7350,
  minLng: -74.0200,
  maxLng: -73.9800,
};

// Common city landmarks for quick-pinning
const PRESETS = [
  { name: 'Downtown Core', lat: 40.7128, lng: -74.0060, desc: '5th Ave & Pine St' },
  { name: 'North Reservoir', lat: 40.7282, lng: -73.9942, desc: 'Inlet Sector 4' },
  { name: 'West End Market', lat: 40.7061, lng: -74.0087, desc: 'Commercial District' },
  { name: 'River Rd Basin', lat: 40.7306, lng: -74.0021, desc: 'Underpass Culvert' },
  { name: 'East Dock Terminal', lat: 40.7190, lng: -73.9820, desc: 'Pumping Station 3' },
];

export default function InteractiveMap({
  mode = 'viewer', // 'viewer' | 'picker'
  incidents = [],
  selectedIncident = null,
  onSelectIncident,
  selectedCoords = null, // { lat, lng }
  onSelectCoords,
  height = '420px',
  showHeatmap = false,
}) {
  const [activePin, setActivePin] = useState(null);
  const [mapType, setMapType] = useState('grid'); // 'grid' | 'osm'

  // Convert GPS coordinates into percentage positions (0-100%) on the SVG city map
  function coordsToPercent(lat, lng) {
    if (!lat || !lng) return { x: 50, y: 50 };
    const latClamped = Math.max(CITY_BOUNDS.minLat, Math.min(CITY_BOUNDS.maxLat, lat));
    const lngClamped = Math.max(CITY_BOUNDS.minLng, Math.min(CITY_BOUNDS.maxLng, lng));

    // Invert lat because SVG Y goes downward
    const y = 100 - ((latClamped - CITY_BOUNDS.minLat) / (CITY_BOUNDS.maxLat - CITY_BOUNDS.minLat)) * 100;
    const x = ((lngClamped - CITY_BOUNDS.minLng) / (CITY_BOUNDS.maxLng - CITY_BOUNDS.minLng)) * 100;
    return { x: Math.max(8, Math.min(92, x)), y: Math.max(8, Math.min(92, y)) };
  }

  // Convert click coordinates on map into GPS lat/lng
  function handleMapClick(e) {
    if (mode !== 'picker') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const lat = +(CITY_BOUNDS.maxLat - clickY * (CITY_BOUNDS.maxLat - CITY_BOUNDS.minLat)).toFixed(5);
    const lng = +(CITY_BOUNDS.minLng + clickX * (CITY_BOUNDS.maxLng - CITY_BOUNDS.minLng)).toFixed(5);

    if (onSelectCoords) {
      onSelectCoords({ lat, lng });
    }
  }

  const pickerPinPercent = useMemo(() => {
    if (selectedCoords && selectedCoords.lat && selectedCoords.lng) {
      return coordsToPercent(selectedCoords.lat, selectedCoords.lng);
    }
    return null;
  }, [selectedCoords]);

  // Compute hotspot clusters
  const hotspots = useMemo(() => {
    if (!showHeatmap) return [];
    return incidents.map((inc) => {
      const pos = coordsToPercent(inc.latitude || 40.7128, inc.longitude || -74.0060);
      const intensity = inc.severity === 'critical' ? 48 : inc.severity === 'urgent' ? 38 : 26;
      return { ...pos, intensity, id: inc.id };
    });
  }, [incidents, showHeatmap]);

  const activeIncident = selectedIncident || activePin;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
      {/* Top Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface/80 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-ink/70">
            {mode === 'picker' ? 'Pin Location on City Grid' : 'Live GIS Infrastructure Map'}
          </span>
          {incidents.length > 0 && mode === 'viewer' && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary-dark">
              {incidents.length} active markers
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {mode === 'picker' && (
            <div className="flex items-center gap-1">
              {PRESETS.slice(0, 3).map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => onSelectCoords && onSelectCoords({ lat: p.lat, lng: p.lng, address: `${p.name} (${p.desc})` })}
                  className="rounded-md border border-line bg-card px-2 py-1 text-ink/70 transition hover:bg-primary/5 hover:text-primary-dark"
                >
                  📍 {p.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex rounded-md border border-line bg-card p-0.5">
            <button
              type="button"
              onClick={() => setMapType('grid')}
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                mapType === 'grid' ? 'bg-primary text-white' : 'text-ink/60 hover:text-ink'
              }`}
            >
              Interactive Grid
            </button>
            <button
              type="button"
              onClick={() => setMapType('osm')}
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                mapType === 'osm' ? 'bg-primary text-white' : 'text-ink/60 hover:text-ink'
              }`}
            >
              OSM Satellite
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div
        className="relative w-full cursor-crosshair select-none overflow-hidden bg-slate-900"
        style={{ height }}
        onClick={handleMapClick}
      >
        {mapType === 'osm' ? (
          // OpenStreetMap Tile / Embed layer
          <iframe
            title="OpenStreetMap View"
            className="pointer-events-none h-full w-full opacity-85"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=-74.0200%2C40.7000%2C-73.9800%2C40.7350&layer=mapnik&marker=${
              selectedCoords?.lat || 40.7128
            }%2C${selectedCoords?.lng || -74.0060}`}
          />
        ) : (
          // Stylized SVG Cartographic Vector City Map
          <svg
            className="h-full w-full"
            viewBox="0 0 1000 600"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              {/* Grid pattern */}
              <pattern id="city-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              </pattern>
              {/* Waterway gradient */}
              <linearGradient id="water-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.5" />
              </linearGradient>
              {/* Radial hotspot gradient */}
              <radialGradient id="hotspot-grad">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
                <stop offset="60%" stopColor="#ef4444" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background base */}
            <rect width="1000" height="600" fill="#0f172a" />
            <rect width="1000" height="600" fill="url(#city-grid)" />

            {/* Simulated River / Waterway */}
            <path
              d="M 220 0 Q 300 220 380 340 T 560 600 L 460 600 Q 300 380 220 260 T 140 0 Z"
              fill="url(#water-grad)"
            />
            {/* Reservoir Basin */}
            <ellipse cx="780" cy="140" rx="90" ry="60" fill="url(#water-grad)" />
            <text x="780" y="145" fill="#38bdf8" fontSize="11" textAnchor="middle" opacity="0.6" fontFamily="sans-serif">
              NORTH RESERVOIR
            </text>

            {/* City District Roads / Infrastructure Lines */}
            <g stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeDasharray="6,4">
              <line x1="0" y1="180" x2="1000" y2="180" />
              <line x1="0" y1="360" x2="1000" y2="360" />
              <line x1="600" y1="0" x2="600" y2="600" />
              <line x1="820" y1="0" x2="820" y2="600" />
              <line x1="160" y1="0" x2="160" y2="600" />
            </g>

            {/* Major Arteries */}
            <g stroke="#3b82f6" strokeWidth="2.5" opacity="0.3">
              <path d="M 0 280 C 300 320, 600 240, 1000 290" fill="none" />
              <path d="M 450 0 C 480 250, 520 400, 560 600" fill="none" />
            </g>

            {/* District Labels */}
            <text x="700" y="320" fill="rgba(255,255,255,0.25)" fontSize="14" fontWeight="bold" fontFamily="sans-serif">
              MIDTOWN COMMERCIAL
            </text>
            <text x="180" y="480" fill="rgba(255,255,255,0.25)" fontSize="14" fontWeight="bold" fontFamily="sans-serif">
              DOWNTOWN SECTOR
            </text>
            <text x="80" y="100" fill="rgba(255,255,255,0.25)" fontSize="14" fontWeight="bold" fontFamily="sans-serif">
              WEST HARBOR
            </text>

            {/* Hotspot density heat circles */}
            {hotspots.map((h) => (
              <circle
                key={`hotspot-${h.id}`}
                cx={(h.x / 100) * 1000}
                cy={(h.y / 100) * 600}
                r={h.intensity * 2.5}
                fill="url(#hotspot-grad)"
              />
            ))}
          </svg>
        )}

        {/* HTML Markers Overlay Layer */}
        <div className="pointer-events-none absolute inset-0">
          {/* Picker Pin (in Mode: picker) */}
          {mode === 'picker' && pickerPinPercent && (
            <div
              className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full transition-all duration-300"
              style={{ left: `${pickerPinPercent.x}%`, top: `${pickerPinPercent.y}%` }}
            >
              <div className="flex flex-col items-center">
                <span className="rounded bg-primary px-2 py-0.5 text-[11px] font-bold text-white shadow-md">
                  Report Location
                </span>
                <div className="relative mt-1 flex h-8 w-8 items-center justify-center">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                  <span className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-red-600 text-sm text-white shadow-lg">
                    📍
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Incident Markers (in Mode: viewer) */}
          {mode === 'viewer' &&
            incidents.map((incident) => {
              const pos = coordsToPercent(incident.latitude, incident.longitude);
              const isSelected = activeIncident?.id === incident.id;
              const isUrgent = incident.severity === 'critical' || incident.severity === 'urgent';
              const isResolved = incident.status === 'resolved';

              let pinColor = 'bg-blue-500';
              if (isResolved) pinColor = 'bg-emerald-500';
              else if (incident.severity === 'critical') pinColor = 'bg-rose-600';
              else if (incident.severity === 'urgent') pinColor = 'bg-amber-500';

              return (
                <div
                  key={incident.id}
                  className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full cursor-pointer transition-transform hover:scale-125"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, zIndex: isSelected ? 30 : 10 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePin(incident);
                    if (onSelectIncident) onSelectIncident(incident);
                  }}
                >
                  <div className="flex flex-col items-center">
                    {/* Small Pill with Ref Code */}
                    <span
                      className={`ref-code rounded px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm ${
                        isSelected ? 'bg-primary-dark ring-2 ring-white' : 'bg-slate-800/90'
                      }`}
                    >
                      {incident.referenceCode || incident.reference_code}
                    </span>

                    {/* Marker Pin Icon */}
                    <div className="relative mt-0.5 flex h-6 w-6 items-center justify-center">
                      {isUrgent && (
                        <span className="absolute h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                      )}
                      <span
                        className={`relative flex h-5 w-5 items-center justify-center rounded-full border border-white text-[10px] text-white shadow-md ${pinColor}`}
                      >
                        {incident.issueType === 'leak' ? '💧' : incident.issueType === 'contamination' ? '☣' : incident.issueType === 'flooding' ? '🌊' : '⚠️'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Selected Incident Floating Popup Card */}
        {mode === 'viewer' && activeIncident && (
          <div className="pointer-events-auto absolute bottom-4 left-4 right-4 z-40 max-w-sm rounded-xl border border-line bg-card/95 p-4 shadow-xl backdrop-blur-md sm:left-4 sm:right-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="ref-code text-xs font-semibold text-primary-dark">
                  {activeIncident.referenceCode || activeIncident.reference_code}
                </span>
                <h4 className="mt-0.5 text-sm font-bold capitalize text-ink">
                  {(activeIncident.issueType || activeIncident.issue_type || '').replace(/_/g, ' ')}
                </h4>
                <p className="mt-0.5 text-xs text-ink/70">{activeIncident.location}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivePin(null);
                  if (onSelectIncident) onSelectIncident(null);
                }}
                className="text-ink/40 hover:text-ink"
              >
                ✕
              </button>
            </div>

            {/* Photo preview in popup if present */}
            {(activeIncident.imageUrl || activeIncident.image_url) && (
              <div className="mt-2.5 overflow-hidden rounded-lg border border-line bg-surface">
                <img
                  src={activeIncident.imageUrl || activeIncident.image_url}
                  alt="Incident evidence"
                  className="h-28 w-full object-cover"
                />
              </div>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-xs">
              <span
                className={`rounded-full px-2 py-0.5 font-medium ${
                  activeIncident.status === 'resolved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : activeIncident.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {activeIncident.status}
              </span>
              <span className="text-ink/50 text-[11px]">
                {activeIncident.createdAt
                  ? new Date(activeIncident.createdAt).toLocaleDateString()
                  : 'Recent'}
              </span>
            </div>
          </div>
        )}

        {/* Helper Instructions in Picker Mode */}
        {mode === 'picker' && (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/75 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
            💡 Click anywhere on the map to pin the incident location
            {selectedCoords && (
              <span className="ml-2 font-mono text-primary-light">
                [{selectedCoords.lat}, {selectedCoords.lng}]
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
