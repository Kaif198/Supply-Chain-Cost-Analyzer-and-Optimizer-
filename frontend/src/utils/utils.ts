export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('de-AT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export function formatDistance(km: number): string {
    if (km < 1) {
        return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
}

export function formatDuration(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

export function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('de-AT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatCO2(kg: number): string {
    if (kg >= 1000) {
        return `${(kg / 1000).toFixed(2)} t CO₂`;
    }
    return `${kg.toFixed(1)} kg CO₂`;
}

export function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
        nightclub: '#8B5CF6',
        gym: '#10B981',
        retail: '#3B82F6',
        restaurant: '#F59E0B',
        hotel: '#EC4899',
    };
    return colors[category] || '#6B7280';
}

export function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
        nightclub: '🎵',
        gym: '💪',
        retail: '🛒',
        restaurant: '🍽️',
        hotel: '🏨',
    };
    return icons[category] || '📍';
}
