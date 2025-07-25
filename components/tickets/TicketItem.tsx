
import React, { useState, Fragment, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Ticket, TicketStatus, EmailStatus, UserRole, Subticket, SubticketStatus, PauseInfo, ExecutionInfo, RequestChangeTicketStatus } from '../../types';
import { formatDate, calculateDuration, calculateTotalDuration } from '../../lib/utils';
import { ICONS, PAUSE_REASON_OPTIONS } from '../../constants';
import Card from '../common/Card';
import Button from '../common/Button';
import SubticketItem from './SubticketItem';
import Modal from '../common/Modal';
import SubticketForm from './SubticketForm';
import TicketForm from './TicketForm';
import CloseSubticketModal from './CloseSubticketModal';
import InlineReportView from '../reports/InlineReportView';
import Select from '../common/Select';
import Input from '../common/Input';
import { CloseSubticketPayload, RequestCloseSubticket } from '../../services/apiTypes';
import { can } from '@/utils/permissions';


interface TicketItemProps {
    ticket: Ticket;
}

const statusConfig: Record<TicketStatus, { color: string; darkColor: string }> = {
    [TicketStatus.Pending]: { color: 'bg-green-600', darkColor: 'bg-green-500' },
    [TicketStatus.InProgress]: { color: 'bg-blue-600', darkColor: 'bg-blue-500' },
    [TicketStatus.OnHold]: { color: 'bg-yellow-500', darkColor: 'bg-yellow-400' },
    [TicketStatus.Solved]: { color: 'bg-gray-600', darkColor: 'bg-gray-500' },
};

const StatusIndicator: React.FC<{ status: TicketStatus }> = ({ status }) => {
    const isDarkTheme = document.documentElement.classList.contains('dark');
    const config = statusConfig[status];
    const color = isDarkTheme ? config.darkColor : config.color;
    return <span className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${color}`}>{status}</span>;
};

const EmailStatusIndicator: React.FC<{ status: EmailStatus }> = ({ status }) => {
    const isDeclared = status === EmailStatus.Declared;
    const isDarkTheme = document.documentElement.classList.contains('dark');
    const color = isDeclared
        ? (isDarkTheme ? 'bg-green-500' : 'bg-green-600')
        : (isDarkTheme ? 'bg-red-500' : 'bg-red-600');

    return (
        <div className="flex items-center space-x-2">
            <span className={`h-3 w-3 rounded-full ${isDeclared ? '' : 'animate-pulse-fast'} ${color}`}></span>
            <span className={`text-sm text-text-secondary ${!isDeclared ? 'animate-pulse' : ''}`}>{status}</span>
        </div>
    );
};


const TicketItem: React.FC<TicketItemProps> = ({ ticket }) => {
    const { currentUser, closeTicket, changeTicketStatus, updateTicket, deleteTicket, subtickets, showToast, closeSubticket, logAction } = useAppContext();
    const [isExpanded, setExpanded] = useState(false);
    const [isReportVisible, setReportVisible] = useState(false);
    const [isSubticketModalOpen, setSubticketModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isClosingModalOpen, setClosingModalOpen] = useState(false);
    const [isStatusChangeModalOpen, setStatusChangeModalOpen] = useState(false);
    const [statusChangeTarget, setStatusChangeTarget] = useState<TicketStatus | null>(null);
    const [statusForm, setStatusForm] = useState<{ reason?: string, dateTime?: string }>({});
    const [isStatusMenuOpen, setStatusMenuOpen] = useState(false);
    const [elapsedTime, setElapsedTime] = useState('');
    const statusMenuRef = useRef<HTMLDivElement>(null);

    const canEdit = can("ticket.edit") ?? false;
    const canDelete = can("ticket.delete") ?? false;
    const canCreate = can("ticket.create") ?? false;

    const ticketSubtickets = subtickets.filter(st => st.ticketId == ticket.id);


    const pendingSubtickets = ticketSubtickets.filter(st => st.status === SubticketStatus.Pending);

    console.log

    const totalClients = useMemo(() =>
        ticketSubtickets.reduce((sum, st) => sum + st.clientCount, 0),
        [ticketSubtickets]
    );

    const isOver24h = useMemo(() => {
        if (ticket.status === TicketStatus.Solved) return false;
        const ticketAgeHours = (new Date().getTime() - new Date(ticket.creationDate).getTime()) / (1000 * 60 * 60);
        return ticketAgeHours > 24;
    }, [ticket.creationDate, ticket.status]);

    useEffect(() => {
        const calculateElapsedTime = () => {
            if (ticket.status === TicketStatus.Solved && ticket.closingDate) {
                setElapsedTime(calculateDuration(ticket.creationDate, ticket.closingDate));
                return;
            }
            setElapsedTime(calculateDuration(ticket.creationDate, new Date().toISOString()));
        };

        calculateElapsedTime(); // Initial call

        if (ticket.status !== TicketStatus.Solved) {
            const intervalId = setInterval(calculateElapsedTime, 60000); // Update every minute
            return () => clearInterval(intervalId);
        }
    }, [ticket.creationDate, ticket.status, ticket.closingDate]);

    const handleToggleExpand = () => setExpanded(!isExpanded);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
                setStatusMenuOpen(false);
            }
        };

        if (isStatusMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isStatusMenuOpen]);

    const handleToggleReport = (e: React.MouseEvent) => {
        e.stopPropagation();
        setReportVisible(!isReportVisible);
        if (!isReportVisible && ticket.emailStatus !== EmailStatus.Declared) {
            updateTicket(ticket.id, { emailStatus: EmailStatus.Declared });
            showToast(`Estado de correo para ${ticket.code} actualizado a Declarado.`, 'success');
        }
    };

    const handleCloseAllSubtickets = () => {
        if (pendingSubtickets.length > 0) {
            setClosingModalOpen(true);
        } else {
            showToast("Todos los subtickets ya están cerrados.", "warning");
        }
    };

    const handleBatchClose = async (closingData: RequestCloseSubticket) => {
        const openSubtickets = ticketSubtickets.filter(st => st.status === SubticketStatus.Pending);

        if (openSubtickets.length === 0) {
            showToast("No hay subtickets pendientes para cerrar.", "info");
            return;
        }

        // Ejecuta las promesas de cierre en paralelo
        const results = await Promise.all(
            openSubtickets.map(async (st) => {
                const request: RequestCloseSubticket = {
                    ...closingData,
                    subticketId: st.id,
                    ticketId: st.ticketId,
                    finalEvent: closingData.finalEvent ?? new Date().toISOString(),
                };

                const success = await closeSubticket(request, currentUser);
                return { success, subticketCode: st.code };
            })
        );

        const failed = results.filter(r => !r.success);

        if (failed.length === 0) {
            showToast(`✅ Se cerraron correctamente ${openSubtickets.length} subticket(s).`, "success");
        } else {
            const failedCodes = failed.map(f => f.subticketCode).join(", ");
            showToast(`⚠️ Algunos subtickets no se cerraron: ${failedCodes}`, "warning");
        }

        setClosingModalOpen(false);
    };

    const openStatusChangeModal = (targetStatus: TicketStatus) => {
        setStatusChangeTarget(targetStatus);
        setStatusForm({
            reason: '',
            dateTime: new Date().toISOString().slice(0, 16)
        });
        setStatusChangeModalOpen(true);
    };

    const handleStatusChange = async (newStatus: TicketStatus) => {
        if (newStatus === TicketStatus.Solved) {
            if (pendingSubtickets.length > 0) {
                showToast('No se puede marcar como Solucionado hasta que todos los subtickets estén cerrados', 'warning');
                return;
            }

            const request: RequestChangeTicketStatus = {
                ticketId: ticket.id,
                managerId: currentUser.id,
                status: newStatus
                // Asumiendo que usas currentUser del context
            };

            const success = await closeTicket(request); // Llama al contexto que hace la petición

            if (success) {
                logAction(ticket.code, 'Ticket marcado como Solucionado.');
                showToast(`Ticket ${ticket.code} Solucionado.`, 'success');
            } else {
                showToast('No se pudo cerrar el ticket. Intenta nuevamente.', 'error');
            }

            return;
        }

        // Otros cambios de estado
        const requiresModal =
            (newStatus === TicketStatus.OnHold) ||
            (ticket.status === TicketStatus.OnHold) ||
            (newStatus === TicketStatus.InProgress) ||
            (ticket.status === TicketStatus.InProgress);

        if (requiresModal && newStatus !== ticket.status) {
            openStatusChangeModal(newStatus);
        } else if (newStatus !== ticket.status) {
            updateTicket(ticket.id, { status: newStatus });
            logAction(ticket.code, `Estado cambiado a ${newStatus}`);
            showToast(`Ticket ${ticket.code} actualizado a ${newStatus}`, 'success');
        }
    };


    const handleStatusModalSubmit = async () => {
        if (!statusChangeTarget) return;

        const changeTimestamp = statusForm.dateTime
            ? new Date(statusForm.dateTime).toISOString()
            : new Date().toISOString();

        let request: RequestChangeTicketStatus;
        let logMessage = `Estado cambiado a ${statusChangeTarget}`;

        const newPauseHistory = ticket.pauseHistory?.map(p => ({ ...p })) ?? [];
        const newExecutionHistory = ticket.executionHistory?.map(e => ({ ...e })) ?? [];

        // Finalizar pausa previa si venía de OnHold
        if (ticket.status === TicketStatus.OnHold) {
            const lastPause = newPauseHistory.at(-1);
            if (lastPause && !lastPause.endTime) {
                lastPause.endTime = changeTimestamp;
            }
        }

        // Finalizar ejecución previa si venía de InProgress
        if (ticket.status === TicketStatus.InProgress) {
            const lastExec = newExecutionHistory.at(-1);
            if (lastExec && !lastExec.endTime) {
                lastExec.endTime = changeTimestamp;
            }
        }

        // Construir request según el nuevo estado
        switch (statusChangeTarget) {
            case TicketStatus.OnHold:
                if (!statusForm.reason) {
                    showToast('Se requiere un motivo de pausa.', 'error');
                    return;
                }

                const newPause: PauseInfo = {
                    startTime: changeTimestamp,
                    reason: statusForm.reason
                };
                newPauseHistory.push(newPause);

                request = {
                    ticketId: ticket.id,
                    managerId: 'af461b84-1d99-4342-9aab-bccc91bafcf1',
                    status: TicketStatus.OnHold,
                    reasonForPause: statusForm.reason
                };

                logMessage += ` (Motivo: ${statusForm.reason})`;
                break;

            case TicketStatus.InProgress:
                const newExec: ExecutionInfo = { startTime: changeTimestamp };
                newExecutionHistory.push(newExec);

                request = {
                    ticketId: ticket.id,
                    managerId: 'af461b84-1d99-4342-9aab-bccc91bafcf1',
                    status: TicketStatus.InProgress
                };
                break;

            case TicketStatus.Pending:
                request = {
                    ticketId: ticket.id,
                    managerId: 'af461b84-1d99-4342-9aab-bccc91bafcf1',
                    status: TicketStatus.Pending
                };
                console.log("estamos en pendiente")
                break;

            default:
                // Fallback para cualquier otro estado como Solved, etc.
                request = {
                    ticketId: ticket.id,
                    managerId: 'af461b84-1d99-4342-9aab-bccc91bafcf1',
                    status: statusChangeTarget
                };
                break;
        }

        const updates: Partial<Ticket> = {
            status: statusChangeTarget,
            pauseHistory: newPauseHistory,
            executionHistory: newExecutionHistory
        };

        const success = await changeTicketStatus(request);

        if (success) {
            logAction(ticket.code, logMessage);
            showToast(`Ticket ${ticket.code} actualizado a ${statusChangeTarget}`, 'success');
        }

        setStatusChangeModalOpen(false);
        setStatusChangeTarget(null);
        setStatusForm({});
    };

    const getModalTitle = () => {
        const from = ticket.status;
        const to = statusChangeTarget;

        if (from === to || !to) return 'Cambiar Estado';

        if (from === TicketStatus.OnHold) return `Finalizar Pausa y cambiar a "${to}"`;
        if (from === TicketStatus.InProgress) return `Finalizar Ejecución y cambiar a "${to}"`;
        if (to === TicketStatus.OnHold) return 'Pausar Ticket';
        if (to === TicketStatus.InProgress) return 'Iniciar Ejecución';

        return `Cambiar estado a "${to}"`;
    };

    const needsReasonForPause = statusChangeTarget === TicketStatus.OnHold;
    const isActionable = ticket.status !== TicketStatus.Solved;

    return (
        <Card>
            <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-primary" onClick={handleToggleExpand}>
                <div className="flex-1 mb-4 md:mb-0">
                    <h3 className="text-lg font-bold text-accent">{ticket.code} <span className="text-base font-normal text-text-primary">- {ticket.type}</span></h3>
                    <p className="text-sm text-text-secondary flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>Nodo: {ticket.node}</span>
                        <span className="text-text-secondary/50 hidden sm:inline">|</span>
                        <span>OLT: {ticket.olt}</span>
                        <span className="text-text-secondary/50 hidden sm:inline">|</span>
                        <span>Asesor: {ticket.advisor}</span>
                        <span className="text-text-secondary/50 hidden sm:inline">|</span>
                        <span className="inline-flex items-center">
                            <span className="w-4 h-8 mr-5">{ICONS.users}</span>
                            <span>Clientes: {totalClients}</span>
                        </span>
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                        {ticket.pauseHistory.length > 0 && (
                            <div className="text-xs text-yellow-400/80">
                                <strong>Pausado: </strong>
                                {ticket.status === TicketStatus.OnHold ? 'Actualmente' : calculateTotalDuration(ticket.pauseHistory)}
                            </div>
                        )}
                        {ticket.executionHistory.length > 0 && (
                            <div className="text-xs text-blue-400/80">
                                <strong>En Ejecución: </strong>
                                {ticket.status === TicketStatus.InProgress ? 'Actualmente' : calculateTotalDuration(ticket.executionHistory)}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2" title="Tiempo total desde la creación del ticket">
                            {isOver24h && (
                                <div className="text-danger animate-ring" title="Ticket activo por más de 24 horas">
                                    {ICONS.bell}
                                </div>
                            )}
                            <span className="text-sm font-semibold text-text-primary">{elapsedTime}</span>
                        </div>
                        <div className="text-xs text-text-secondary">{ticket.status === TicketStatus.Solved ? 'Duración Total' : 'Tiempo Activo'}</div>
                    </div>
                    <EmailStatusIndicator status={ticket.emailStatus} />
                    <div className="relative" ref={statusMenuRef}>
                        <button
                            type="button"
                            className="disabled:cursor-not-allowed"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isActionable && canEdit) {
                                    setStatusMenuOpen(prev => !prev);
                                }
                            }}
                            disabled={!isActionable || !canEdit}
                            aria-haspopup="listbox"
                            aria-expanded={isStatusMenuOpen}
                            aria-label="Cambiar estado del ticket"
                        >
                            <StatusIndicator status={ticket.status} />
                        </button>
                        {isActionable && canEdit && (
                            <div
                                className={`absolute top-full right-0 mt-2 w-48 bg-secondary border border-border-color rounded-md shadow-lg z-10 transition-opacity ${isStatusMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                                role="listbox"
                            >
                                {Object.values(TicketStatus).map(s => (
                                    <button
                                        key={s}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange(s);
                                            setStatusMenuOpen(false);
                                        }}
                                        disabled={s === ticket.status}
                                        className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="text-text-secondary hover:text-accent transition-transform transform-gpu" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        {ICONS.chevronDown}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-border-color p-4 bg-primary">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div><strong>Reportado por:</strong> {ticket.reportedBy}</div>
                        <div><strong>Diagnóstico Inicial:</strong> {ticket.initialDiagnosis}</div>
                        <div><strong>Servicio No Disponible:</strong> {ticket.serviceUnavailable ? 'Sí' : 'No'}</div>
                        <div><strong>Fecha de Creación:</strong> {formatDate(ticket.creationDate)}</div>
                        <div><strong>Fecha de Solución:</strong> {formatDate(ticket.closingDate)}</div>
                        <div><strong>Subtickets:</strong> {ticketSubtickets.length}</div>
                    </div>

                    <div className="mb-4">
                        <h4 className="font-bold mb-2">Subtickets</h4>
                        <div className="space-y-2">
                            {ticketSubtickets.length > 0 ? (
                                ticketSubtickets.map(st => <SubticketItem key={st.id} subticket={st} ticketStatus={ticket.status} />)
                            ) : (
                                <p className="text-sm text-text-secondary italic">No hay subtickets para este ticket.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-border-color">
                        {isActionable && canCreate && (
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); setSubticketModalOpen(true); }}>{ICONS.plus} Añadir Subticket</Button>
                        )}
                        <Button size="sm" onClick={handleToggleReport} variant="secondary">
                            <div className="flex items-center gap-1">
                                {ICONS.file} {isReportVisible ? 'Ocultar Reporte' : 'Ver Reporte'}
                            </div>
                        </Button>
                        {isActionable && canEdit && (
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); setEditModalOpen(true); }} variant="secondary">{ICONS.edit} Editar Ticket</Button>
                        )}

                        {isActionable && canEdit && pendingSubtickets.length > 0 && (
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); handleCloseAllSubtickets(); }} variant="secondary">
                                {pendingSubtickets.length > 1 ? 'Cerrar Todos los Subtickets' : 'Cerrar Subticket'}
                            </Button>
                        )}

                        {canDelete && (
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); deleteTicket(ticket.id); }} variant="danger">{ICONS.trash} Archivar Ticket</Button>
                        )}
                    </div>

                    {isReportVisible && (
                        <InlineReportView ticket={ticket} subtickets={ticketSubtickets} />
                    )}
                </div>
            )}

            <Modal isOpen={isSubticketModalOpen} onClose={() => setSubticketModalOpen(false)} title={`Añadir Subticket a ${ticket.code}`}>
                <SubticketForm ticket={ticket} onFinished={() => setSubticketModalOpen(false)} />
            </Modal>
            <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title={`Editar Ticket ${ticket.code}`} size="lg">
                <TicketForm ticketToEdit={ticket} onFinished={() => setEditModalOpen(false)} />
            </Modal>
            <Modal isOpen={isClosingModalOpen} onClose={() => setClosingModalOpen(false)} title={`Cierre por Lotes para ${ticket.code}`} size="lg">
                <CloseSubticketModal
                    onSubmit={handleBatchClose}
                    onCancel={() => setClosingModalOpen(false)}
                    ticket={ticket}
                    subticket={ticketSubtickets[0]} // Pass a sample subticket for context
                />
            </Modal>
            <Modal isOpen={isStatusChangeModalOpen} onClose={() => setStatusChangeModalOpen(false)} title={getModalTitle()} size="md">
                <div className="space-y-4">
                    <Input
                        label="Fecha y Hora del Cambio"
                        type="datetime-local"
                        value={statusForm.dateTime}
                        onChange={e => setStatusForm(prev => ({ ...prev, dateTime: e.target.value }))}
                    />
                    {needsReasonForPause && (
                        <Select
                            label="Motivo de la Pausa"
                            value={statusForm.reason}
                            onChange={e => setStatusForm(prev => ({ ...prev, reason: e.target.value }))}
                        >
                            <option value="">Seleccione un motivo...</option>
                            {PAUSE_REASON_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </Select>
                    )}
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="secondary" onClick={() => setStatusChangeModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleStatusModalSubmit}>Confirmar</Button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
};

export default TicketItem;
