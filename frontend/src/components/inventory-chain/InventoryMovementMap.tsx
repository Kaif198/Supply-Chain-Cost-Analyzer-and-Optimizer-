import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { usePremises } from '../../hooks/useQueries';
import 'leaflet/dist/leaflet.css';

// Fix Icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Movement {
    fromLocation: string; // Premise ID
    toLocation: string;   // Premise ID
    movementType: string;
}

interface InventoryMovementMapProps {
    movements: Movement[];
}

const AUSTRIA_CENTER: [number, number] = [47.5, 13.5];

export default function InventoryMovementMap({ movements }: InventoryMovementMapProps) {
    const { data: premises = [] } = usePremises();

    const movementLines = useMemo(() => {
        if (!premises.length || !movements.length) return [];

        return movements.map(move => {
            const from = premises.find(p => p.id === move.fromLocation);
            const to = premises.find(p => p.id === move.toLocation);

            if (!from || !to) return null;

            return {
                positions: [[from.latitude, from.longitude], [to.latitude, to.longitude]] as [number, number][],
                color: move.movementType === 'DISPATCHED' ? '#3b82f6' : '#22c55e', // Blue for dispatch, Green for arrival
            };
        }).filter(Boolean) as { positions: [number, number][], color: string }[];
    }, [movements, premises]);

    return (
        <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-white/10 z-0 relative">
            <MapContainer
                center={AUSTRIA_CENTER}
                zoom={7}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {movementLines.map((line, idx) => (
                    <Polyline
                        key={idx}
                        positions={line.positions}
                        pathOptions={{ color: line.color, weight: 3, opacity: 0.7, dashArray: '10, 10' }}
                    />
                ))}

                {/* Simple markers for active premises involved in movements */}
                {premises.filter(p => movements.some(m => m.fromLocation === p.id || m.toLocation === p.id)).map(p => (
                    <Marker key={p.id} position={[p.latitude, p.longitude]}>
                        <Popup>{p.name}</Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
