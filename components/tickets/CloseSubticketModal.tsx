import React, { useState, useEffect } from 'react';
import { Subticket, Ticket } from '../../types';
import { ROOT_CAUSE_OPTIONS, SOLUTION_OPTIONS, STATUS_POST_SLA_OPTIONS, EVENT_RESPONSIBLE_OPTIONS } from '../../constants';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { useAppContext } from '../../context/AppContext';
import { suggestClosingSolution } from '../../services/geminiService';
import { ICONS } from '../../constants';
import Spinner from '../common/Spinner';

interface CloseSubticketModalProps {
  subticket: Subticket;
  ticket?: Ticket;
  onSubmit: (closingData: Partial<Subticket>) => void | Promise<void>;
  onCancel: () => void;
}

const CloseSubticketModal: React.FC<CloseSubticketModalProps> = ({ subticket, ticket, onSubmit, onCancel }) => {
    const { currentUser, tickets } = useAppContext();
    const [formData, setFormData] = useState({
        eventEndDate: new Date().toISOString().slice(0, 16),
        rootCause: '',
        badPraxis: false,
        solution: '',
        statusPostSLA: '',
        comment: '',
        eventResponsible: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoadingSuggestion, setLoadingSuggestion] = useState(false);

    const parentTicket = ticket || tickets.find(t => t.id === subticket.ticketId);

    const handleGetSuggestion = async () => {
        if(!parentTicket) return;
        setLoadingSuggestion(true);
        try {
            const suggestion = await suggestClosingSolution(parentTicket, subticket);
            setFormData(prev => ({
                ...prev,
                rootCause: suggestion.rootCause || prev.rootCause,
                solution: suggestion.solution || prev.solution,
                comment: suggestion.comment || prev.comment,
            }));
        } catch(e) {
            console.error(e);
        } finally {
            setLoadingSuggestion(false);
        }
    }

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.eventEndDate) newErrors.eventEndDate = 'La fecha de fin del evento es requerida.';
        else if (new Date(formData.eventEndDate) < new Date(subticket.eventStartDate)) newErrors.eventEndDate = 'La fecha de fin no puede ser anterior a la fecha de inicio.';
        else if (new Date(formData.eventEndDate) > new Date()) newErrors.eventEndDate = 'La fecha de fin no puede ser en el futuro.';
        if (!formData.rootCause) newErrors.rootCause = 'La causa raíz es requerida.';
        if (!formData.solution) newErrors.solution = 'La solución es requerida.';
        if (!formData.eventResponsible) newErrors.eventResponsible = 'El responsable del evento es requerido.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit({
                ...formData,
                eventEndDate: new Date(formData.eventEndDate).toISOString()
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="flex justify-between items-center">
                <p className="text-sm text-text-secondary">Cerrando como: <span className="font-semibold">{currentUser.name}</span></p>
                
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input label="Fecha de Fin del Evento" type="datetime-local" value={formData.eventEndDate} onChange={e => setFormData({...formData, eventEndDate: e.target.value})} error={errors.eventEndDate} />
                 <Select label="Causa Raíz" value={formData.rootCause} onChange={e => setFormData({...formData, rootCause: e.target.value})} error={errors.rootCause}>
                     <option value="">Seleccione Causa...</option>
                     {ROOT_CAUSE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                 </Select>
                 <Select label="Solución" value={formData.solution} onChange={e => setFormData({...formData, solution: e.target.value})} error={errors.solution}>
                     <option value="">Seleccione Solución...</option>
                     {SOLUTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                 </Select>
                 <Select label="Responsable del Evento" value={formData.eventResponsible} onChange={e => setFormData({...formData, eventResponsible: e.target.value})} error={errors.eventResponsible}>
                     <option value="">Seleccione Responsable...</option>
                     {EVENT_RESPONSIBLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                 </Select>
                 <Select label="Estado Post SLA (Opcional)" value={formData.statusPostSLA} onChange={e => setFormData({...formData, statusPostSLA: e.target.value})}>
                      <option value="">Seleccione Estado...</option>
                     {STATUS_POST_SLA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                 </Select>
                 <div className="flex items-center pt-6">
                    <label className="flex items-center space-x-2 text-text-secondary">
                        <input type="checkbox" checked={formData.badPraxis} onChange={e => setFormData({...formData, badPraxis: e.target.checked})} className="form-checkbox h-5 w-5 text-accent bg-primary border-border-color rounded focus:ring-accent" />
                        <span>¿Mala Praxis?</span>
                    </label>
                 </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Comentario (Opcional)</label>
                <textarea value={formData.comment} onChange={e => setFormData({...formData, comment: e.target.value})} rows={3} className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"></textarea>
            </div>
             <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">Confirmar Cierre</Button>
            </div>
        </form>
    );
};

export default CloseSubticketModal;