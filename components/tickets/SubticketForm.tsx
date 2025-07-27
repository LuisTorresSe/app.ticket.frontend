import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Ticket, Subticket } from '../../types';
import { CITY_OPTIONS } from '../../constants';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

interface SubticketFormProps {
    ticket: Ticket;
    subticketToEdit?: Subticket;
    onFinished: () => void;
}

const SubticketForm: React.FC<SubticketFormProps> = ({ ticket, subticketToEdit, onFinished }) => {
    const { addSubticket, updateSubticket, currentUser } = useAppContext();
    const isEditMode = !!subticketToEdit;

    const [formData, setFormData] = useState({
        ticketId: ticket.id,
        cto: '',
        card: '',
        port: '',
        city: '',
        clientCount: 0,
        eventStartDate: new Date().toISOString().slice(0, 16),
        reportedToPextDate: new Date().toISOString().slice(0, 16),
        node: ticket.node,
        olt: ticket.olt
    });


    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (subticketToEdit) {
            setFormData({
                ticketId: subticketToEdit.ticketId,
                cto: subticketToEdit.cto || '',
                card: subticketToEdit.card || '',
                port: subticketToEdit.port || '',
                city: subticketToEdit.city || '',
                clientCount: subticketToEdit.clientCount || 0,
                eventStartDate: subticketToEdit.eventStartDate ? new Date(subticketToEdit.eventStartDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
                reportedToPextDate: subticketToEdit.reportedToPextDate ? new Date(subticketToEdit.reportedToPextDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
                node: subticketToEdit.node || ticket.node || '',
                olt: subticketToEdit.olt || ticket.olt || ''
            });
        }
    }, [subticketToEdit, ticket]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.cto.trim()) newErrors.cto = "CTO es requerido.";
        if (!formData.card.trim()) newErrors.card = "Tarjeta es requerida.";
        if (!formData.port.trim()) newErrors.port = "Puerto es requerido.";
        if (!formData.city) newErrors.city = "Ciudad es requerida.";
        if (formData.clientCount <= 0) newErrors.clientCount = "El número de clientes debe ser positivo.";
        if (!formData.eventStartDate) newErrors.eventStartDate = "La fecha de inicio del evento es requerida.";
        else if (new Date(formData.eventStartDate) > new Date()) newErrors.eventStartDate = 'La fecha de inicio no puede ser en el futuro.';
        if (!formData.reportedToPextDate) newErrors.reportedToPextDate = "La fecha de reporte a PEXT es requerida.";
        else if (new Date(formData.reportedToPextDate) > new Date()) newErrors.reportedToPextDate = 'La fecha de reporte no puede ser en el futuro.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const dataPayload = {
                ...formData,
                cto: formData.cto.trim().toUpperCase(),
                card: formData.card.trim(),
                port: formData.port.trim()
            };

            console.log('Enviando datos del subticket:', dataPayload);

            if (isEditMode && subticketToEdit) {
                const { ticketId, ...updateData } = dataPayload;

                updateSubticket(ticket.id, subticketToEdit.id, updateData, currentUser);
            } else {
                addSubticket(dataPayload, currentUser);
            }
            onFinished();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-text-secondary mb-4">
                Heredado del ticket - Nodo: <span className="font-semibold">{ticket.node || 'N/A'}</span>,
                OLT: <span className="font-semibold">{ticket.olt || 'N/A'}</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {/* Columna de Detalles del Incidente */}
                <div>
                    <h4 className="text-lg font-semibold mb-3 border-b border-border-color pb-2 text-text-primary">Detalles del Incidente</h4>
                    <div className="space-y-4">
                        <Input
                            label="CTO"
                            name="cto"
                            value={formData.cto}
                            onChange={(e) => setFormData({ ...formData, cto: e.target.value.toUpperCase() })}
                            error={errors.cto}
                            placeholder="Ej: CTO-0203-LA-NE"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Tarjeta"
                                name="card"
                                value={formData.card}
                                onChange={(e) => setFormData({ ...formData, card: e.target.value.trim() })}
                                error={errors.card}
                                placeholder="Número de tarjeta"
                            />
                            <Input
                                label="Puerto"
                                name="port"
                                value={formData.port}
                                onChange={(e) => setFormData({ ...formData, port: e.target.value.trim() })}
                                error={errors.port}
                                placeholder="Número de puerto"
                            />
                        </div>

                        <Select
                            label="Ciudad"
                            name="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            error={errors.city}
                        >
                            <option value="">Seleccione Ciudad...</option>
                            {CITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </Select>

                        <Input
                            label="Número de Clientes Afectados"
                            type="number"
                            name="clientCount"
                            value={formData.clientCount}
                            onChange={(e) => setFormData({ ...formData, clientCount: parseInt(e.target.value) || 0 })}
                            error={errors.clientCount}
                            min="1"
                            placeholder="Ingrese el número de clientes"
                        />
                    </div>
                </div>

                {/* Columna de Cronología */}
                <div>
                    <h4 className="text-lg font-semibold mb-3 border-b border-border-color pb-2 text-text-primary">Cronología</h4>
                    <div className="space-y-4">
                        <Input
                            label="Fecha de Inicio del Evento"
                            type="datetime-local"
                            name="eventStartDate"
                            value={formData.eventStartDate}
                            onChange={(e) => setFormData({ ...formData, eventStartDate: e.target.value })}
                            error={errors.eventStartDate}
                        />
                        <Input
                            label="Fecha de Reporte a PEXT"
                            type="datetime-local"
                            name="reportedToPextDate"
                            value={formData.eventStartDate}
                            onChange={(e) => setFormData({ ...formData, reportedToPextDate: e.target.value })}
                            error={errors.reportedToPextDate}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-6 mt-6 border-t border-border-color">
                <Button type="button" variant="secondary" onClick={onFinished}>Cancelar</Button>
                <Button type="submit">{isEditMode ? 'Actualizar Subticket' : 'Añadir Subticket'}</Button>
            </div>
        </form>
    );
};

export default SubticketForm;