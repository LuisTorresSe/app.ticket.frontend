import { Ticket } from '@/types';

const INTERVALS = [6, 12, 24, 48, 72];

export interface TicketStats {
    name: string;           // Ej: "6h"
    created: number;
    closed: number;
    closeRate: number;      // % de tickets cerrados respecto a creados
    closePerHour: number;   // tickets cerrados por hora
    overloaded: boolean;    // true si hay más tickets creados que cerrados
}

export const buildTicketStatsChartData = (tickets: Ticket[]): TicketStats[] => {
    const now = Date.now();

    return INTERVALS.map(hours => {
        const from = now - hours * 60 * 60 * 1000;
        const hoursAgo = hours;

        const created = tickets.filter(t => new Date(t.creationDate).getTime() >= from).length;
        const closed = tickets.filter(t =>
            t.closingDate && new Date(t.closingDate).getTime() >= from
        ).length;

        const closeRate = created > 0 ? (closed / created) * 100 : 0;
        const closePerHour = closed / hoursAgo;
        const overloaded = created > closed;

        return {
            name: `${hours}h`,
            created,
            closed,
            closeRate: Number(closeRate.toFixed(1)),
            closePerHour: Number(closePerHour.toFixed(2)),
            overloaded,
        };
    });
};
