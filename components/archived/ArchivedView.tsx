
import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { UserRole, Ticket } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { formatDate } from '../../lib/utils';
import { ICONS } from '../../constants';
import { can } from '@/utils/permissions';

const ArchivedView: React.FC = () => {
    const { currentUser, archivedTickets, restoreTicket } = useAppContext();
    const [filter, setFilter] = useState('');

    const canRestore = can("archived.edit") ?? false;

    const filteredArchivedTickets = useMemo(() => {
        return archivedTickets.filter(ticket =>
            ticket.code.toLowerCase().includes(filter.toLowerCase()) ||
            ticket.node.toLowerCase().includes(filter.toLowerCase()) ||
            ticket.advisor.toLowerCase().includes(filter.toLowerCase())
        );
    }, [archivedTickets, filter]);

    if (!can("archived.view")) {
        return (
            <Card className="p-8 text-center">
                <h2 className="text-2xl font-bold text-danger">Acceso Denegado</h2>
                <p className="text-text-secondary mt-2">No tienes permisos para ver esta sección.</p>
            </Card>
        );
    }

    return (
        <div>
            <Card className="p-4 mb-6">
                <h2 className="text-2xl font-bold">Tickets Archivados ({archivedTickets.length})</h2>
                <div className="mt-4">
                    <input
                        type="text"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Filtrar por código, nodo, o asesor..."
                        className="w-full md:w-1/2 bg-primary border border-border-color rounded-md px-3 py-2"
                    />
                </div>
            </Card>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 gamer:bg-red-950/80 gamer:text-red-300 adult:bg-black adult:text-amber-500">
                            <tr className="border-b border-border-color">
                                <th scope="col" className="p-3 font-semibold">Código</th>
                                <th scope="col" className="p-3 font-semibold">Tipo</th>
                                <th scope="col" className="p-3 font-semibold">Nodo</th>
                                <th scope="col" className="p-3 font-semibold">Asesor</th>
                                <th scope="col" className="p-3 font-semibold">Archivado el</th>
                                {canRestore && <th scope="col" className="p-3 font-semibold text-right">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredArchivedTickets.map((ticket: Ticket) => (
                                <tr key={ticket.id} className="border-t border-border-color hover:bg-primary">
                                    <td className="p-3 text-accent font-semibold">{ticket.code}</td>
                                    <td className="p-3">{ticket.type}</td>
                                    <td className="p-3">{ticket.node}</td>
                                    <td className="p-3">{ticket.advisor}</td>
                                    <td className="p-3">{formatDate(ticket.closingDate)}</td>
                                    {canRestore && (
                                        <td className="p-3 text-right">
                                            <Button size="sm" variant="secondary" onClick={() => restoreTicket(ticket.id)}>
                                                <span className="mr-1">{ICONS.restore}</span>
                                                Restaurar
                                            </Button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredArchivedTickets.length === 0 && (
                    <p className="p-8 text-center text-text-secondary">No se encontraron tickets archivados.</p>
                )}
            </Card>
        </div>
    );
};

export default ArchivedView;
