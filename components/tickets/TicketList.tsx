import React, { useState, useMemo, JSX } from 'react';
import { useAppContext } from '../../context/AppContext';
import TicketItem from './TicketItem';
import Button from '../common/Button';
import { ICONS } from '../../constants';
import TicketForm from './TicketForm';
import Modal from '../common/Modal';
import { Ticket, TicketStatus, TicketType } from '../../types';
import Card from '../common/Card';
import { exportToExcel } from '../../lib/xlsx';
import { formatDate } from '../../lib/utils';
import MultiSelectDropdown from '../common/MultiSelectDropdown';

export default function TicketList(): JSX.Element {
    const { tickets, showToast, logAction } = useAppContext();
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [filters, setFilters] = useState<{
        code: string;
        type: string;
        status: TicketStatus[];
        advisor: string;
        age: 'all' | 'last24h' | 'older';
    }>({
        code: '',
        type: '',
        status: Object.values(TicketStatus),
        advisor: '',
        age: 'all',
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (selectedStatuses: string[]) => {
        setFilters(prev => ({ ...prev, status: selectedStatuses as TicketStatus[] }));
        setCurrentPage(1);
    };

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const filteredTickets = useMemo(() => {
        const now = new Date().getTime();
        const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

        return tickets.filter((ticket: Ticket) => {
            const statusMatch = filters.status.length === 0 || filters.status.includes(ticket.status);
            
            let ageMatch = true;
            if (filters.age !== 'all' && ticket.status !== TicketStatus.Solved) {
                const ticketCreationTime = new Date(ticket.creationDate).getTime();
                if (filters.age === 'last24h') {
                    ageMatch = ticketCreationTime >= twentyFourHoursAgo;
                } else if (filters.age === 'older') {
                    ageMatch = ticketCreationTime < twentyFourHoursAgo;
                }
            }

            return (
                (filters.code === '' || ticket.code.toLowerCase().includes(filters.code.toLowerCase())) &&
                (filters.type === '' || ticket.type === filters.type) &&
                statusMatch &&
                (filters.advisor === '' || ticket.advisor.toLowerCase().includes(filters.advisor.toLowerCase())) &&
                ageMatch
            );
        });
    }, [tickets, filters]);

    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

    const paginatedTickets = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTickets.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTickets, currentPage, itemsPerPage]);

    const handleExport = () => {
        if (filteredTickets.length === 0) {
            showToast('No hay tickets para exportar.', 'warning');
            return;
        }
        const dataToExport = filteredTickets.map(t => ({
            'Código': t.code,
            'Tipo': t.type,
            'Estado': t.status,
            'Asesor': t.advisor,
            'Nodo': t.node,
            'OLT': t.olt,
            'Reportado Por': t.reportedBy,
            'Diagnóstico Inicial': t.initialDiagnosis,
            'Fecha de Creación': formatDate(t.creationDate),
            'Fecha de Cierre': formatDate(t.closingDate),
            'Subtickets': t.subticketIds.length,
            'Estado Correo': t.emailStatus,
        }));
        exportToExcel(dataToExport, `tickets_filtrados_${new Date().toISOString().slice(0,10)}`);
        logAction('N/A', 'Exportó la lista de tickets a Excel.');
    };

    return (
        <div>
            <Card className="mb-6 p-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-2xl font-bold">Todos los Tickets ({filteredTickets.length})</h2>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleExport} size="md" variant="secondary">
                            <span className="mr-2">{ICONS['file-output']}</span>
                            Exportar
                        </Button>
                        <Button onClick={() => setModalOpen(true)} size="md">
                            <span className="mr-2">{ICONS.plus}</span>
                            Crear Ticket
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Código</label>
                        <input name="code" value={filters.code} onChange={handleFilterChange} placeholder="Filtrar por Código..." className="w-full bg-primary border border-border-color rounded-md px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Tipo</label>
                        <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full bg-primary border border-border-color rounded-md px-3 py-2">
                            <option value="">Todos los Tipos</option>
                            {Object.values(TicketType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <MultiSelectDropdown 
                        label="Estado"
                        options={Object.values(TicketStatus)}
                        selectedOptions={filters.status}
                        onChange={handleStatusFilterChange}
                    />
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Asesor</label>
                        <input name="advisor" value={filters.advisor} onChange={handleFilterChange} placeholder="Filtrar por Asesor..." className="w-full bg-primary border border-border-color rounded-md px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Antigüedad (Activos)</label>
                        <select name="age" value={filters.age} onChange={handleFilterChange} className="w-full bg-primary border border-border-color rounded-md px-3 py-2">
                            <option value="all">Cualquier fecha</option>
                            <option value="last24h">Últimas 24h</option>
                            <option value="older">Más de 24h</option>
                        </select>
                    </div>
                </div>
            </Card>

            <div className="space-y-4">
                {paginatedTickets.length > 0 ? (
                    paginatedTickets.map(ticket => <TicketItem key={ticket.id} ticket={ticket} />)
                ) : (
                    <Card className="p-8 text-center text-text-secondary">
                        <p>No hay tickets que coincidan con los filtros actuales.</p>
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

            <Modal title="Crear Nuevo Ticket" isOpen={isModalOpen} onClose={() => setModalOpen(false)} size="lg">
                <TicketForm onFinished={() => setModalOpen(false)} />
            </Modal>
        </div>
    );
}