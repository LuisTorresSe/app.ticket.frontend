import React, { useState, useMemo, useEffect, JSX } from 'react';
import { useAppContext } from '../../context/AppContext';
import { UploadedRecord, Subticket, Ticket, UserRole, TicketStatus, ServerDown } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { ICONS } from '../../constants';
import { formatDate, calculateDuration } from '../../lib/utils';
import Modal from '../common/Modal';
import ColumnConfigModal from './ColumnConfigModal';
import { exportToExcel } from '../../lib/xlsx';
import { can } from '@/utils/permissions';

const ALL_COLUMNS = [
    { key: 'ticket', header: 'TICKET' }, { key: 'fecha', header: 'Fecha' },
    { key: 'estadoCuenta', header: 'Estado_Cuenta' }, { key: 'numDoc', header: 'Num_Doc' },
    { key: 'sn', header: 'SN' }, { key: 'codPedido', header: 'Cod_Pedido' },
    { key: 'departamento', header: 'Departamento' }, { key: 'distrito', header: 'Distrito' },
    { key: 'tipoCaja', header: 'Tipo_Caja' }, { key: 'cto', header: 'CTO' },
    { key: 'servicio', header: 'Servicio' }, { key: 'tiempoEnCaida', header: 'Tiempo en caída' },
    { key: 'estadoAveria', header: 'Estado_Avería' }, { key: 'inicioEvento', header: 'INICIO EVENTO' },
    { key: 'finEvento', header: 'FIN EVENTO' },
];

const SEARCHABLE_COLUMNS = [
    { key: 'ticket', name: 'Ticket' },
    { key: 'cto', name: 'CTO' },
    { key: 'sn', name: 'SN' },
    { key: 'numDoc', name: 'Num Doc' },
    { key: 'codPedido', name: 'Cod Pedido' },
    { key: 'distrito', name: 'Distrito' },
];

const ACCOUNT_STATUS_OPTIONS = ['Activo', 'Suspendido', 'Baja'];

const DEFAULT_VISIBLE_COLUMNS = ALL_COLUMNS.map(c => c.key);

const LOCAL_STORAGE_COLUMNS_KEY = 'cargasViewVisibleColumns_v2';


export default function CargasView(): JSX.Element {
    const { currentUser, tickets, subtickets, showToast } = useAppContext();
    const [isConfigModalOpen, setConfigModalOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchCriteria, setSearchCriteria] = useState('ticket');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const canConfigure = can("cargar.view") ?? false;

    useEffect(() => {
        const savedColumns = localStorage.getItem(LOCAL_STORAGE_COLUMNS_KEY);
        if (savedColumns) {
            try {
                const parsedColumns = JSON.parse(savedColumns);
                setVisibleColumns(parsedColumns);
            } catch (e) {
                console.error("Failed to parse saved columns", e);
            }
        }
    }, []);

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const mergedData = useMemo(() => {
        const serverDownRecords: UploadedRecord[] = [];

        subtickets.forEach(subticket => {
            const ticket = tickets.find(t => t.id === subticket.ticketId);
            if (ticket && subticket.serverDowns && subticket.serverDowns.length > 0) {
                subticket.serverDowns.forEach(sd => {
                    serverDownRecords.push({
                        id: `sd-${sd.serverdownId}`,
                        ticket: ticket.code,
                        fecha: subticket.eventStartDate,
                        estadoCuenta: sd.client.statusAccount,
                        numDoc: sd.client.documentCi,
                        sn: sd.client.serialNumber,
                        codPedido: sd.client.orderCode,
                        departamento: sd.client.descriptionDepartament || 'N/A',
                        distrito: sd.client.descriptionDistrict,
                        tipoCaja: sd.client.descriptionBox,
                        cto: sd.client.codeBox,
                        servicio: sd.client.contrata,
                        tiempoEnCaida: calculateDuration(subticket.eventStartDate, subticket.eventEndDate),
                        estadoAveria: ticket.status,
                        inicioEvento: subticket.eventStartDate,
                        finEvento: subticket.eventEndDate
                    });
                });
            }
        });

        return serverDownRecords;
    }, [tickets, subtickets]);

    const filteredData = useMemo(() => {
        return mergedData.filter(record => {
            const searchMatch = !searchTerm.trim()
                ? true
                : (record as any)[searchCriteria]?.toString().toLowerCase().includes(searchTerm.toLowerCase());

            const statusMatch = statusFilter === 'Todos'
                ? true
                : record.estadoCuenta === statusFilter;

            return searchMatch && statusMatch;
        });
    }, [mergedData, searchTerm, searchCriteria, statusFilter]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const columnHeaders = useMemo(() => visibleColumns.map(key => ALL_COLUMNS.find(c => c.key === key)).filter(Boolean) as { key: string, header: string }[], [visibleColumns]);

    const handleSaveColumnConfig = (config: { columns: string[] }) => {
        setVisibleColumns(config.columns);
        localStorage.setItem(LOCAL_STORAGE_COLUMNS_KEY, JSON.stringify(config.columns));
        setConfigModalOpen(false);
    };

    const toggleRowExpansion = (recordId: string) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(recordId)) {
            newSet.delete(recordId);
        } else {
            newSet.add(recordId);
        }
        setExpandedRows(newSet);
    };

    const handleExport = () => {
        if (filteredData.length === 0) {
            showToast('No hay datos para exportar.', 'warning');
            return;
        }

        const dataToExport = filteredData.map(record => {
            const exportedRecord: Record<string, any> = {};
            columnHeaders.forEach(col => {
                const rawValue = (record as any)[col.key];
                const value = col.key.toLowerCase().includes('fecha') || col.key.toLowerCase().includes('evento')
                    ? formatDate(rawValue)
                    : rawValue;
                exportedRecord[col.header] = value ?? 'N/A';
            });
            return exportedRecord;
        });

        exportToExcel(dataToExport, `servs_down_${new Date().toISOString().slice(0, 10)}`);
    };

    return (
        <div className="space-y-6">
            <Card className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-2xl font-bold whitespace-nowrap">Servs Down ({filteredData.length})</h2>
                    <div className="w-full flex-grow md:w-auto flex flex-col sm:flex-row items-center gap-2">
                        <div className="w-full sm:w-auto flex-grow flex items-stretch gap-0">
                            <select
                                value={searchCriteria}
                                onChange={(e) => { setSearchCriteria(e.target.value); setSearchTerm(''); setCurrentPage(1); }}
                                className="bg-primary border border-r-0 border-border-color rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                            >
                                {SEARCHABLE_COLUMNS.map(col => (<option key={col.key} value={col.key}>{col.name}</option>))}
                            </select>
                            <input
                                type="text"
                                placeholder={`Buscar por ${SEARCHABLE_COLUMNS.find(c => c.key === searchCriteria)?.name}...`}
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-primary border border-border-color rounded-r-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="w-full sm:w-auto bg-primary border border-border-color rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                        >
                            <option value="Todos">Todos los Estados</option>
                            {ACCOUNT_STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleExport} variant="secondary">
                            <span className="mr-2">{ICONS['file-output']}</span>
                            Exportar
                        </Button>
                        {canConfigure && (
                            <Button onClick={() => setConfigModalOpen(true)}>
                                <span className="mr-2">{ICONS.settings}</span>
                                Configurar
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="sticky top-0 z-10 text-xs uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 gamer:bg-red-950/80 gamer:text-red-300 adult:bg-black adult:text-amber-500">
                            <tr className="border-b border-border-color">
                                <th scope="col" className="p-2 w-12 font-semibold text-center border-r border-border-color">+/-</th>
                                {columnHeaders.map(col => (
                                    <th scope="col" key={col.key} className="p-3 font-semibold whitespace-nowrap border-r border-border-color">{col.header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map(record => {
                                const isExpanded = expandedRows.has(record.id);

                                return (
                                    <React.Fragment key={record.id}>
                                        <tr className="border-t border-border-color hover:bg-primary/50">
                                            <td className="text-center border-r border-border-color">
                                                {record.ticket && (
                                                    <button onClick={() => toggleRowExpansion(record.id)} className="p-2 text-accent">
                                                        {isExpanded ? ICONS.minus : ICONS.plus}
                                                    </button>
                                                )}
                                            </td>
                                            {columnHeaders.map(col => (
                                                <td key={col.key} className="p-3 text-text-secondary whitespace-nowrap border-r border-border-color">
                                                    {col.key.toLowerCase().includes('fecha') || col.key.toLowerCase().includes('evento')
                                                        ? formatDate((record as any)[col.key])
                                                        : (record as any)[col.key] ?? 'N/A'}
                                                </td>
                                            ))}
                                        </tr>
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                    {filteredData.length === 0 && <p className="p-8 text-center text-text-secondary">No se encontraron registros.</p>}
                </div>
                {totalPages > 1 && (
                    <div className="flex flex-col md:flex-row justify-between items-center mt-6 p-4 bg-secondary rounded-lg border-t border-border-color gap-4">
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <span>Mostrar por página:</span>
                            <select
                                id="itemsPerPage"
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
                                className="bg-primary border border-border-color rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                            >
                                <option value={15}>15</option>
                                <option value={30}>30</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="hidden sm:inline">
                                | Viendo {paginatedData.length} de {filteredData.length} registros
                            </span>
                        </div>

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
                    </div>
                )}
            </Card>

            <Modal isOpen={isConfigModalOpen} onClose={() => setConfigModalOpen(false)} title="Configurar Columnas de la Tabla" size="md">
                <ColumnConfigModal
                    allColumns={ALL_COLUMNS}
                    visibleColumns={visibleColumns}
                    defaultColumns={DEFAULT_VISIBLE_COLUMNS}
                    onSave={handleSaveColumnConfig}
                    onCancel={() => setConfigModalOpen(false)}
                />
            </Modal>
        </div>
    );
};
