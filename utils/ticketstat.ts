// utils/ticketStats.ts
import { Ticket } from '../types'; // ajusta la ruta si tu tipo está en otra carpeta

// Estructura que devuelve la cantidad de tickets por rango de horas
export interface TicketRangeStats {
    '0-6': number;
    '6-12': number;
    '12-24': number;
    '24-72': number;
}

// Función para calcular cuántos tickets cerrados caen en cada rango
export function getTicketClosureStats(tickets: Ticket[]): TicketRangeStats {
    const stats: TicketRangeStats = {
        '0-6': 0,
        '6-12': 0,
        '12-24': 0,
        '24-72': 0,
    };

    tickets.forEach(ticket => {
        // Si el ticket no está cerrado, lo ignoramos
        if (!ticket.closingDate) return;

        // Convertimos fechas a timestamp
        const creationTime = new Date(ticket.creationDate).getTime();
        const closingTime = new Date(ticket.closingDate).getTime();

        // Calculamos la diferencia en horas
        const diffInHours = (closingTime - creationTime) / (1000 * 60 * 60);

        // Clasificamos en el rango correspondiente
        if (diffInHours <= 6) {
            stats['0-6']++;
        } else if (diffInHours <= 12) {
            stats['6-12']++;
        } else if (diffInHours <= 24) {
            stats['12-24']++;
        } else if (diffInHours <= 72) {
            stats['24-72']++;
        }

        // Ignora los que tarden más de 72h, o puedes agregar otro rango si deseas.
    });

    return stats;
}
