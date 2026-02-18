import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { usePremises } from '../hooks/useQueries';
import { getCategoryColor, getCategoryIcon } from '../utils/utils';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons in Leaflet + Webpack/Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const WAREHOUSE = { lat: 47.8011, lng: 13.2760 };
const AUSTRIA_CENTER: [number, number] = [47.5, 13.5];
const CATEGORIES = ['nightclub', 'gym', 'retail', 'restaurant', 'hotel'] as const;

function createCategoryIcon(category: string) {
    const color = getCategoryColor(category);
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px;">${getCategoryIcon(category)}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
}

const warehouseIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:#DC0032;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 12px rgba(220,0,50,0.4);font-size:18px;">🏭</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
});

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
    const map = useMap();
    if (bounds) {
        map.fitBounds(bounds, { padding: [30, 30] });
    }
    return null;
}

export default function MapPage() {
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
        new Set(CATEGORIES)
    );
    const { data: premises = [], isLoading } = usePremises();

    const filteredPremises = useMemo(
        () => premises.filter((p) => selectedCategories.has(p.category)),
        [premises, selectedCategories]
    );

    const toggleCategory = (cat: string) => {
        setSelectedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    const bounds = useMemo(() => {
        if (filteredPremises.length === 0) return null;
        const lats = filteredPremises.map((p) => p.latitude);
        const lngs = filteredPremises.map((p) => p.longitude);
        return L.latLngBounds(
            [Math.min(...lats) - 0.2, Math.min(...lngs) - 0.5],
            [Math.max(...lats) + 0.2, Math.max(...lngs) + 0.5]
        );
    }, [filteredPremises]);

    return (
        <div className="space-y-4 h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Interactive Map</h1>
                    <p className="text-slate-400 mt-1">
                        {filteredPremises.length} premises across Austria
                    </p>
                </div>

                {/* Category filters */}
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${selectedCategories.has(cat)
                                    ? 'border-white/20 text-white'
                                    : 'border-white/5 text-slate-500 opacity-50'
                                }`}
                            style={{
                                backgroundColor: selectedCategories.has(cat)
                                    ? getCategoryColor(cat) + '30'
                                    : 'transparent',
                            }}
                        >
                            <span>{getCategoryIcon(cat)}</span>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="h-96 bg-white/5 rounded-2xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-redbull-red" />
                </div>
            ) : (
                <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>
                    <MapContainer
                        center={AUSTRIA_CENTER}
                        zoom={7}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {bounds && <FitBounds bounds={bounds} />}

                        {/* Warehouse marker */}
                        <Marker position={WAREHOUSE} icon={warehouseIcon}>
                            <Popup>
                                <div className="text-center">
                                    <strong>🏭 Red Bull Distribution Centre</strong>
                                    <br />
                                    Fuschl am See, Salzburg
                                    <br />
                                    <span className="text-xs text-gray-500">47.8011°N, 13.2760°E · 660m</span>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Premise markers */}
                        {filteredPremises.map((premise) => (
                            <Marker
                                key={premise.id}
                                position={[premise.latitude, premise.longitude]}
                                icon={createCategoryIcon(premise.category)}
                            >
                                <Popup>
                                    <div className="min-w-48">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span>{getCategoryIcon(premise.category)}</span>
                                            <strong>{premise.name}</strong>
                                        </div>
                                        <div className="text-xs text-gray-600 space-y-0.5">
                                            <p>📍 {premise.address}</p>
                                            <p>📦 {premise.weeklyDemand} cases/week</p>
                                            <p>🏷️ {premise.category}</p>
                                            <p>🗺️ {premise.latitude.toFixed(4)}°N, {premise.longitude.toFixed(4)}°E</p>
                                            <p>⛰️ {premise.elevation}m elevation</p>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            )}
        </div>
    );
}
