
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { EmailStatus, Ticket } from '../../types';
import TicketItem from '../tickets/TicketItem';
import Card from '../common/Card';
import Button from '../common/Button';
import { ICONS } from '../../constants';

const MailView: React.FC = () => {
    const { tickets } = useAppContext();
    const [filter, setFilter] = useState<EmailStatus | 'all'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleFilterChange = (newFilter: EmailStatus | 'all') => {
        setFilter(newFilter);
        setCurrentPage(1); // Reset page when filter changes
    };

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const filteredTickets = useMemo(() => {
        return tickets.filter(t => filter === 'all' || t.emailStatus === filter);
    }, [tickets, filter]);

    const notDeclaredTicketsCount = useMemo(() => {
        return tickets.filter(t => t.emailStatus === EmailStatus.NotDeclared).length;
    }, [tickets]);

    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

    const paginatedTickets = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTickets.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTickets, currentPage, itemsPerPage]);

    return (
        <div>
            <Card className="p-4 mb-6">
                <h2 className="text-2xl font-bold mb-4">Estado de Declaración de Correo ({filteredTickets.length})</h2>
                <div className="flex space-x-2">
                    <Button variant={filter === 'all' ? 'primary' : 'secondary'} onClick={() => handleFilterChange('all')}>Todos</Button>
                    <Button variant={filter === EmailStatus.NotDeclared ? 'primary' : 'secondary'} onClick={() => handleFilterChange(EmailStatus.NO_DECLARADO)}>No Declarados ({notDeclaredTicketsCount})</Button>
                    <Button variant={filter === EmailStatus.Declared ? 'primary' : 'secondary'} onClick={() => handleFilterChange(EmailStatus.DECLARADO)}>Declarados</Button>
                </div>
            </Card>

            <div className="space-y-4">
                {paginatedTickets.map(ticket => (
                    <TicketItem key={ticket.id} ticket={ticket} />
                ))}
                {paginatedTickets.length === 0 && (
                    <Card className="p-8 text-center text-text-secondary">
                        <p>No hay tickets que coincidan con este filtro.</p>
                    </Card>
                )}
            </div>

            {filteredTickets.length > 0 && (
                <div className="flex flex-col md:flex-row justify-between items-center mt-6 p-4 bg-secondary rounded-lg border-t border-border-color gap-4">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <span>Mostrar por página:</span>
                        <select
                            id="itemsPerPage"
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            className="bg-primary border border-border-color rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="hidden sm:inline">
                            | Viendo {paginatedTickets.length} de {filteredTickets.length} tickets
                        </span>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-text-secondary">
                                Página {currentPage} de {totalPages}
                            </span>
                            <Button
                                onClick={() => setCurrentPage(p => p - 1)}
                                disabled={currentPage === 1}
                                size="md"
                                variant="secondary"
                            >
                                Anterior
                            </Button>
                            <Button
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage === totalPages}
                                size="md"
                                variant="secondary"
                            >
                                Siguiente
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MailView;