import { TicketType } from '../types';

export const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';

    return new Date(dateString).toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
};


export const formatToLocalInput = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const getTypeSuffix = (type: TicketType) => {
    switch (type) {
        case TicketType.Proactive: return 'P';
        case TicketType.Reactive: return 'R';
        case TicketType.Maintenance: return 'M';
        default: return '';
    }
}

export const generateTicketCode = (id: number, type: TicketType) => {
    const paddedId = String(id).padStart(6, '0');
    const suffix = getTypeSuffix(type);
    return `W_CR_${paddedId}_${suffix}`;
}


export const calculateDuration = (start?: string, end?: string): string => {
    if (!start || !end) return 'N/A';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (diff < 0) return '0m';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let durationString = '';
    if (days > 0) durationString += `${days}d `;
    if (hours > 0) durationString += `${hours}h `;
    durationString += `${minutes}m`;

    return durationString.trim() || '0m';
};


export const calculateTotalDuration = (history: Array<{ startTime: string, endTime?: string }>): string => {
    const totalMilliseconds = history.reduce((acc, item) => {
        if (item.startTime && item.endTime) {
            const diff = new Date(item.endTime).getTime() - new Date(item.startTime).getTime();
            return acc + (diff > 0 ? diff : 0);
        }
        return acc;
    }, 0);

    if (totalMilliseconds === 0) return '0m';

    const days = Math.floor(totalMilliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((totalMilliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((totalMilliseconds % (1000 * 60 * 60)) / (1000 * 60));

    let durationString = '';
    if (days > 0) durationString += `${days}d `;
    if (hours > 0) durationString += `${hours}h `;
    durationString += `${minutes}m`;

    return durationString.trim() || '0m';
}

export function formatDuration(start: string | Date, end: string | Date) {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMs = endTime - startTime;

    if (diffMs <= 0) return "0 segundos";

    const diffSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(diffSecs / 3600);
    const minutes = Math.floor((diffSecs % 3600) / 60);
    const seconds = diffSecs % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
}

export const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset(); // minutos de desfase
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
};