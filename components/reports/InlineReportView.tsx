
import React from 'react';
import { Ticket, Subticket } from '../../types';
import { formatDate, calculateDuration } from '../../lib/utils';
import Card from '../common/Card';
import Button from '../common/Button';
import { ICONS } from '../../constants';

interface InlineReportViewProps {
  ticket: Ticket;
  subtickets: Subticket[];
}

const InlineReportView: React.FC<InlineReportViewProps> = ({ ticket, subtickets }) => {
    const firstSubticket = subtickets[0];
    const totalClients = subtickets.reduce((sum, s) => sum + s.clientCount, 0);

    const elementsAffected = subtickets.length > 0 ? (
        <div className="whitespace-pre-wrap">
            {subtickets.map(s => `${s.cto} - ${s.code}`).join('\n')}
        </div>
    ) : 'N/A';
        
    const rootCauses = [...new Set(subtickets.map(s => s.rootCause).filter(Boolean))].join(', ');
    const solutions = [...new Set(subtickets.map(s => s.solution).filter(Boolean))].join('; ');
    const comments = [...new Set(subtickets.map(s => s.comment).filter(Boolean))].join('; ');

    const rutaInfo = subtickets.length > 0 ? (
        <div className="whitespace-pre-wrap">
            {subtickets.map(s => `${ticket.olt} ${ticket.node} ${s.card}/${s.port}`).join('\n')}
        </div>
    ) : 'N/A';

    const handleSendEmail = () => {
        const elementsAffectedText = subtickets.length > 0 
            ? subtickets.map(s => `${s.cto} - ${s.code}`).join('\n') 
            : 'N/A';

        const rutaInfoText = subtickets.length > 0
            ? subtickets.map(s => `${ticket.olt} ${ticket.node} ${s.card}/${s.port}`).join('\n')
            : 'N/A';
        
        const body = `
Alerta Monitoreo
-------------------------------------
1. Tipo de evento: Avería CTO/NAP
2. Número de ticket: ${ticket.code}
3. Fecha y hora de inicio: ${formatDate(firstSubticket?.eventStartDate)}
4. Fecha y hora de reporte a PEXT: ${formatDate(firstSubticket?.reportedToPextDate)}
5. Fecha y hora de fin: ${formatDate(firstSubticket?.eventEndDate)}
6. Tiempo de afectación: ${calculateDuration(firstSubticket?.eventStartDate, firstSubticket?.eventEndDate)}
7. Nodo: ${ticket.node}
8. Elemento afectado: 
${elementsAffectedText}
9. Diagnóstico inicial: ${ticket.initialDiagnosis}
10. Indisponibilidad de servicio: ${ticket.serviceUnavailable ? 'Sí' : 'No'}
11. Mala praxis: ${subtickets.some(s => s.badPraxis) ? 'Sí' : 'No'}
12. Cantidad de clientes afectados: ${totalClients}
13. Causa del evento: ${rootCauses || 'N/A'}
14. Solución: ${solutions || 'N/A'}
15. Comentarios: ${comments || 'N/A'}
16. Ruta:
${rutaInfoText}
        `.trim().replace(/^\s+/gm, '');

        const subject = `Reporte de Ticket: ${ticket.code}`;
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    };

    const ReportRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
        <tr>
            <td className="p-2 font-semibold border border-border-color bg-secondary w-1/3 align-top">{label}</td>
            <td className="p-2 border border-border-color">{value}</td>
        </tr>
    );

    return (
        <Card className="mt-4 p-4 border border-accent/50 bg-primary/50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-bold text-accent">Reporte de Ticket: {ticket.code}</h4>
              <Button onClick={handleSendEmail} size="sm">
                <div className="flex items-center gap-2">
                    {ICONS.mail}
                    <span>Enviar Correo</span>
                </div>
              </Button>
            </div>
            
            <h5 className="font-semibold text-text-primary mb-2">Alerta Monitoreo</h5>
            <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed border-collapse">
                    <tbody>
                        <ReportRow label="1. Tipo de evento" value="Avería CTO/NAP" />
                        <ReportRow label="2. Número de ticket" value={ticket.code} />
                        <ReportRow label="3. Fecha y hora de inicio" value={formatDate(firstSubticket?.eventStartDate)} />
                        <ReportRow label="4. Fecha y hora de reporte a PEXT" value={formatDate(firstSubticket?.reportedToPextDate)} />
                        <ReportRow label="5. Fecha y hora de fin" value={formatDate(firstSubticket?.eventEndDate)} />
                        <ReportRow label="6. Tiempo de afectación" value={calculateDuration(firstSubticket?.eventStartDate, firstSubticket?.eventEndDate)} />
                        <ReportRow label="7. Nodo" value={ticket.node} />
                        <ReportRow label="8. Elemento afectado" value={elementsAffected} />
                        <ReportRow label="9. Diagnóstico inicial" value={ticket.initialDiagnosis} />
                        <ReportRow label="10. Indisponibilidad de servicio" value={ticket.serviceUnavailable ? 'Sí' : 'No'} />
                        <ReportRow label="11. Mala praxis" value={subtickets.some(s => s.badPraxis) ? 'Sí' : 'No'} />
                        <ReportRow label="12. Cantidad de clientes afectados" value={totalClients} />
                        <ReportRow label="13. Causa del evento" value={rootCauses || 'N/A'} />
                        <ReportRow label="14. Solución" value={solutions || 'N/A'} />
                        <ReportRow label="15. Comentarios" value={comments || 'N/A'} />
                        <ReportRow label="16. Ruta" value={rutaInfo} />
                    </tbody>
                </table>
            </div>

            {subtickets.length > 0 && (
                <>
                    <h5 className="font-semibold text-text-primary mt-4 mb-2">Detalles de Subtickets</h5>
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-secondary">
                                <tr>
                                    <th className="p-2 border border-border-color">Código</th>
                                    <th className="p-2 border border-border-color">CTO</th>
                                    <th className="p-2 border border-border-color">Ciudad</th>
                                    <th className="p-2 border border-border-color">Clientes</th>
                                    <th className="p-2 border border-border-color">Causa</th>
                                    <th className="p-2 border border-border-color">Solución</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subtickets.map(st => (
                                    <tr key={st.id} className="hover:bg-primary">
                                        <td className="p-2 border border-border-color">{st.code}</td>
                                        <td className="p-2 border border-border-color">{st.cto}</td>
                                        <td className="p-2 border border-border-color">{st.city}</td>
                                        <td className="p-2 border border-border-color">{st.clientCount}</td>
                                        <td className="p-2 border border-border-color">{st.rootCause || 'N/A'}</td>
                                        <td className="p-2 border border-border-color">{st.solution || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </Card>
    );
};

export default InlineReportView;
