
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Ticket, TicketType, EmailStatus } from '../../types';
import { TICKET_TYPES, REPORTED_BY_OPTIONS, DIAGNOSIS_OPTIONS, NODE_OPTIONS, OLT_OPTIONS } from '../../constants';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

interface TicketFormProps {
  ticketToEdit?: Ticket;
  onFinished: () => void;
}

const TicketForm: React.FC<TicketFormProps> = ({ ticketToEdit, onFinished }) => {
  const { addTicket, updateTicket } = useAppContext();
  const [formData, setFormData] = useState({
    type: ticketToEdit?.type || TicketType.Reactive,
    reportedBy: ticketToEdit?.reportedBy || '',
    initialDiagnosis: ticketToEdit?.initialDiagnosis || '',
    creationDate: ticketToEdit?.creationDate ? new Date(ticketToEdit.creationDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    serviceUnavailable: ticketToEdit?.serviceUnavailable || false,
    node: ticketToEdit?.node || '',
    olt: ticketToEdit?.olt || '',
    emailStatus: ticketToEdit?.emailStatus || EmailStatus.NotDeclared,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const isCreationDateLocked = ticketToEdit ? ticketToEdit.subticketIds.length > 0 : false;

  useEffect(() => {
    if (ticketToEdit) {
      setFormData({
        type: ticketToEdit.type,
        reportedBy: ticketToEdit.reportedBy,
        initialDiagnosis: ticketToEdit.initialDiagnosis,
        creationDate: new Date(ticketToEdit.creationDate).toISOString().slice(0, 16),
        serviceUnavailable: ticketToEdit.serviceUnavailable,
        node: ticketToEdit.node,
        olt: ticketToEdit.olt,
        emailStatus: ticketToEdit.emailStatus,
      });
    }
  }, [ticketToEdit]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.type) newErrors.type = 'El tipo de ticket es requerido.';
    if (!formData.reportedBy) newErrors.reportedBy = 'El informante es requerido.';
    if (!formData.initialDiagnosis) newErrors.initialDiagnosis = 'El diagnóstico inicial es requerido.';
    if (!formData.creationDate) newErrors.creationDate = 'La fecha de creación es requerida.';
    if (new Date(formData.creationDate) > new Date()) newErrors.creationDate = 'La fecha de creación no puede ser en el futuro.';
    if (!formData.node) newErrors.node = 'El nodo es requerido.';
    if (!formData.olt) newErrors.olt = 'La OLT es requerida.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      if (ticketToEdit) {
        updateTicket(ticketToEdit.id, {
            ...formData,
            creationDate: new Date(formData.creationDate).toISOString(),
        });
      } else {
        addTicket({
            ...formData,
            creationDate: new Date(formData.creationDate).toISOString(),
        });
      }
      onFinished();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Tipo de Ticket" name="type" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as TicketType})} error={errors.type}>
          {TICKET_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </Select>
        <Select label="Reportado Por" name="reportedBy" value={formData.reportedBy} onChange={(e) => setFormData({...formData, reportedBy: e.target.value})} error={errors.reportedBy}>
           <option value="">Seleccione Quién Reporta...</option>
           {REPORTED_BY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </Select>
        <Select label="Diagnóstico Inicial" name="initialDiagnosis" value={formData.initialDiagnosis} onChange={(e) => setFormData({...formData, initialDiagnosis: e.target.value})} error={errors.initialDiagnosis}>
           <option value="">Seleccione Diagnóstico...</option>
           {DIAGNOSIS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </Select>
        <Input 
            label="Fecha de Creación"
            type="datetime-local"
            name="creationDate"
            value={formData.creationDate}
            onChange={(e) => setFormData({...formData, creationDate: e.target.value})}
            error={errors.creationDate}
            disabled={isCreationDateLocked}
            title={isCreationDateLocked ? "La fecha de creación se actualiza automáticamente con la fecha del subticket más antiguo." : ""}
        />
        <Select label="Nodo" name="node" value={formData.node} onChange={(e) => setFormData({...formData, node: e.target.value})} error={errors.node}>
            <option value="">Seleccione Nodo...</option>
            {NODE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </Select>
        <Select label="OLT" name="olt" value={formData.olt} onChange={(e) => setFormData({...formData, olt: e.target.value})} error={errors.olt}>
            <option value="">Seleccione OLT...</option>
            {OLT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </Select>
      </div>
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2 text-text-secondary">
          <input type="checkbox" name="serviceUnavailable" checked={formData.serviceUnavailable} onChange={(e) => setFormData({...formData, serviceUnavailable: e.target.checked})} className="form-checkbox h-5 w-5 text-accent bg-primary border-border-color rounded focus:ring-accent" />
          <span>¿Servicio no disponible?</span>
        </label>
        {ticketToEdit && (
             <label className="flex items-center space-x-2 text-text-secondary">
              <input type="checkbox" name="emailStatus" checked={formData.emailStatus === EmailStatus.Declared} onChange={(e) => setFormData({...formData, emailStatus: e.target.checked ? EmailStatus.Declared : EmailStatus.NotDeclared})} className="form-checkbox h-5 w-5 text-accent bg-primary border-border-color rounded focus:ring-accent" />
              <span>¿Correo Declarado?</span>
            </label>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="secondary" onClick={onFinished}>Cancelar</Button>
        <Button type="submit">{ticketToEdit ? 'Actualizar Ticket' : 'Crear Ticket'}</Button>
      </div>
    </form>
  );
};

export default TicketForm;
