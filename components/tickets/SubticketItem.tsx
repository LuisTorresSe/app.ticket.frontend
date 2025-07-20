import React, { useState } from 'react';
import { Subticket, SubticketStatus, UserRole, TicketStatus, ServerDown } from '../../types';
import { formatDate } from '../../lib/utils';
import { ICONS } from '../../constants';
import { useAppContext } from '../../context/AppContext';
import Button from '../common/Button';
import Modal from '../common/Modal';
import CloseSubticketModal from './CloseSubticketModal';
import SubticketForm from './SubticketForm';
import { RequestCloseSubticket } from '../../services/apiTypes';
import { can } from '@/utils/permissions';

interface SubticketItemProps {
    subticket: Subticket;
    ticketStatus: TicketStatus;
}

const SubticketStatusBadge: React.FC<{ status: SubticketStatus }> = ({ status }) => {
    const isDarkTheme = document.documentElement.classList.contains('dark');
    const color = status === SubticketStatus.Pending
        ? (isDarkTheme ? 'bg-yellow-500' : 'bg-yellow-400')
        : (isDarkTheme ? 'bg-gray-500' : 'bg-gray-600');
    return <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${color}`}>{status}</span>;
};

// This is the key change. A very compact cell.
const DetailCell: React.FC<{ label: string; value?: React.ReactNode; className?: string, title?: string }> = ({ label, value, className = '', title }) => (
    <div className={`bg-primary p-1.5 rounded-md border border-border-color text-xs whitespace-nowrap overflow-hidden text-ellipsis ${className}`} title={title || (typeof value === 'string' ? value : undefined)}>
        <span className="text-text-secondary mr-1.5">{label}:</span>
        <span className="font-semibold text-text-primary">{value || 'N/A'}</span>
    </div>
);

const ServerDownList: React.FC<{ serverDowns: ServerDown[] }> = ({ serverDowns }) => {
    if (!serverDowns?.length) return null;

    return (
        <div>
            <h4 className="font-semibold text-xs mb-1.5 text-text-secondary uppercase tracking-wider">Clientes Afectados ({serverDowns.length})</h4>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border-color">
                    <thead>
                        <tr className="text-xs text-text-secondary">
                            <th className="px-2 py-1 text-left">Estado</th>
                            <th className="px-2 py-1 text-left">DNI</th>
                            <th className="px-2 py-1 text-left">Serial</th>
                            <th className="px-2 py-1 text-left">Orden</th>
                            <th className="px-2 py-1 text-left">Puerto GPON</th>
                            <th className="px-2 py-1 text-left">Distrito</th>
                            <th className="px-2 py-1 text-left">CTO</th>
                            <th className="px-2 py-1 text-left">Contrata</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {serverDowns.map(sd => (
                            <tr key={sd.serverdownId} className="text-xs hover:bg-primary/50">
                                <td className="px-2 py-1">
                                    <span className={`inline-block px-1.5 py-0.5 rounded-full text-white text-[10px] ${sd.client.statusAccount === 'ACTIVO' ? 'bg-green-500' : 'bg-yellow-500'
                                        }`}>
                                        {sd.client.statusAccount}
                                    </span>
                                </td>
                                <td className="px-2 py-1">{sd.client.documentCi}</td>
                                <td className="px-2 py-1">{sd.client.serialNumber}</td>
                                <td className="px-2 py-1">{sd.client.orderCode}</td>
                                <td className="px-2 py-1">{sd.client.portGpon}</td>
                                <td className="px-2 py-1">{sd.client.descriptionDistrict}</td>
                                <td className="px-2 py-1">{sd.client.codeBox}</td>
                                <td className="px-2 py-1">{sd.client.contrata}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const SubticketItem: React.FC<SubticketItemProps> = ({ subticket, ticketStatus }) => {
    const { currentUser, tickets, closeSubticket, reopenSubticket, subtickets } = useAppContext();
    const [isClosingModalOpen, setClosingModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isExpanded, setExpanded] = useState(false);

    const canEdit = can("ticket.edit") ?? false;

    const parentTicket = tickets.find(t => t.id === subticket.ticketId);
    const isTicketActionable = ticketStatus !== TicketStatus.Solved;

    const handleCloseSubmit = async (request: RequestCloseSubticket) => {
        console.log(currentUser?.id)

        const success = await closeSubticket(request, currentUser);


        if (success) {
            setClosingModalOpen(false);
        }
    }

    if (!parentTicket) {
        return <div className="bg-danger/20 p-3 rounded-md border border-danger">Subticket huérfano encontrado.</div>;
    }
    return (
        <div className="bg-secondary/50 rounded-lg border border-border-color shadow-sm">
            <header
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-primary/50 transition-colors"
                onClick={() => setExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className="text-text-secondary hover:text-accent">
                        {isExpanded ? ICONS.chevronUp : ICONS.chevronDown}
                    </div>
                    <div>
                        <p className="font-bold text-base text-text-primary">{subticket.code}</p>
                        <p className="text-xs text-text-secondary">Creado por: {subticket.creator}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <SubticketStatusBadge status={subticket.status} />
                    <div onClick={e => e.stopPropagation()} className="flex items-center space-x-1">
                        {subticket.status === SubticketStatus.Pending && isTicketActionable && canEdit && (
                            <>
                                <Button size="sm" variant="ghost" onClick={() => setEditModalOpen(true)} className="p-1 h-11 w-11" title="Editar Subticket">{ICONS.edit}</Button>
                                <Button size="sm" variant="secondary" onClick={() => setClosingModalOpen(true)} className="text-xs px-2 py-1" title="Cerrar Subticket">{ICONS.lock}</Button>
                            </>
                        )}
                        {subticket.status === SubticketStatus.Closed && isTicketActionable && canEdit && (
                            <Button size="sm" variant="secondary" onClick={() => reopenSubticket(subticket.id)} className="text-xs px-2 py-1" title="Reabrir Subticket">{ICONS.unlock}</Button>
                        )}
                    </div>
                </div>
            </header>

            {isExpanded && (
                <div className="p-4 border-t border-border-color animate-fade-in space-y-4">
                    {/* Creation Details */}
                    <div>
                        <h4 className="font-semibold text-xs mb-1.5 text-text-secondary uppercase tracking-wider">Creación</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">


                            <DetailCell label="CTO" value={subticket.cto} title={`CTO: ${subticket.cto}`} />
                            <DetailCell label="Tarjeta" value={`${subticket.card}`} title={`Tarjeta: ${subticket.card}`} />
                            <DetailCell label="Puerto" value={`${subticket.port}`} title={`Puerto: ${subticket.port}`} />
                            <DetailCell label="Ciudad" value={subticket.city} />
                            <DetailCell label="Clientes" value={subticket.clientCount} />
                            <DetailCell label="Inicio" value={formatDate(subticket.eventStartDate)} />
                            <DetailCell label="Reporte PEXT" value={formatDate(subticket.reportedToPextDate)} />
                        </div>
                    </div>

                    {/* Server Downs */}
                    {subticket.serverDowns && subticket.serverDowns.length > 0 && (
                        <ServerDownList serverDowns={subticket.serverDowns} />
                    )}

                    {/* Closing Details */}
                    {subticket.status === SubticketStatus.Closed ? (
                        <div>
                            <h4 className="font-semibold text-xs mb-1.5 text-text-secondary uppercase tracking-wider">Cierre</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
                                <DetailCell label="Fin" value={formatDate(subticket.eventEndDate)} />
                                <DetailCell label="Asesor" value={subtickets.find(st => st.id === subticket.id)?.closingAdvisor || '—'}
                                />
                                <DetailCell label="Responsable" value={subticket.eventResponsible} />
                                <DetailCell label="Mala Praxis" value={subticket.badPraxis ? 'Sí' : 'No'} />
                                <DetailCell label="Causa" value={subticket.rootCause} />
                                <DetailCell label="Solución" value={subticket.solution} />
                                {subticket.comment && (
                                    <DetailCell label="Comentario" value={subticket.comment} className="col-span-full whitespace-normal" />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 text-center text-text-secondary border border-dashed border-border-color rounded-lg">
                            <div className="w-8 h-8 mx-auto mb-2 text-yellow-500">{ICONS.unlock}</div>
                            <p className="font-semibold">Subticket Abierto</p>
                            <p className="text-xs">Los detalles de cierre aparecerán aquí una vez que se resuelva.</p>
                        </div>
                    )}
                </div>
            )}

            <Modal isOpen={isClosingModalOpen} onClose={() => setClosingModalOpen(false)} title={`Cerrar Subticket ${subticket.code}`} size="lg">
                <CloseSubticketModal
                    onSubmit={handleCloseSubmit}
                    onCancel={() => setClosingModalOpen(false)}
                    subticket={subticket}
                    ticket={parentTicket}
                />
            </Modal>
            <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title={`Editar Subticket ${subticket.code}`} size="lg">
                <SubticketForm
                    ticket={parentTicket}
                    subticketToEdit={subticket}
                    onFinished={() => setEditModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default SubticketItem;
