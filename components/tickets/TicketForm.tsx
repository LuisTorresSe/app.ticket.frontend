import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { TICKET_TYPES, REPORTED_BY_OPTIONS, DIAGNOSIS_OPTIONS, NODE_OPTIONS, OLT_OPTIONS, ASSIGN_TO } from '../../constants';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

interface TicketFormProps {
  ticketToEdit?: any; // Puedes tiparlo si tienes una interfaz
  onFinished: () => void;
  managerId: string;
}

const TicketForm: React.FC<TicketFormProps> = ({ ticketToEdit, onFinished }) => {
  const { addTicket, updateTicket } = useAppContext();

  const [formData, setFormData] = useState({
    type: ticketToEdit?.type || '',
    report: ticketToEdit?.report || '',
    diagnosis: ticketToEdit?.diagnosis || '',
    createAtEvent: ticketToEdit?.createAtEvent
      ? new Date(ticketToEdit.createAtEvent).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    unavailability: ticketToEdit?.unavailability || false,
    assignTo: ticketToEdit?.assignTo || '',
    nodeAffected: ticketToEdit?.nodeAffected || '',
    oltAffected: ticketToEdit?.oltAffected || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});




  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.type) newErrors.type = 'El tipo de ticket es requerido.';
    if (!formData.report) newErrors.report = 'El campo "Reportado por" es requerido.';
    if (!formData.diagnosis) newErrors.diagnosis = 'El diagnóstico es requerido.';
    if (!formData.assignTo) newErrors.assignTo = "Debes de asignar es requerido"
    if (!formData.createAtEvent) newErrors.createAtEvent = 'La fecha de creación es requerida.';
    if (new Date(formData.createAtEvent) > new Date()) newErrors.createAtEvent = 'No puede ser en el futuro.';
    if (!formData.nodeAffected) newErrors.nodeAffected = 'El nodo es requerido.';
    if (!formData.oltAffected) newErrors.oltAffected = 'La OLT es requerida.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {

      const ticketPayload = {
        ...formData
      };

      if (ticketToEdit) {



        updateTicket(ticketToEdit.id, ticketPayload);
      } else {
        addTicket(ticketPayload);
      }

      onFinished();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Tipo de Ticket" name="type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} error={errors.type}>
          <option value="">Seleccione tipo...</option>
          {TICKET_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </Select>
        <Select label="Reportado Por" name="report" value={formData.report} onChange={(e) => setFormData({ ...formData, report: e.target.value })} error={errors.report}>
          <option value="">Seleccione quién reporta...</option>
          {REPORTED_BY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </Select>
        <Select label="Asignado a" name="asignado" value={formData.assignTo} onChange={(e) => setFormData({ ...formData, assignTo: e.target.value })} error={errors.assignTo}>
          <option value="">Seleccione quién asignamos...</option>
          {ASSIGN_TO.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </Select>
        <Select label="Diagnóstico" name="diagnosis" value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} error={errors.diagnosis}>
          <option value="">Seleccione diagnóstico...</option>
          {DIAGNOSIS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </Select>
        <Input
          label="Fecha del Evento"
          type="datetime-local"
          name="createAtEvent"
          value={formData.createAtEvent}
          onChange={(e) => setFormData({ ...formData, createAtEvent: e.target.value })}
          error={errors.createAtEvent}
        />
        <Select label="Nodo Afectado" name="nodeAffected" value={formData.nodeAffected} onChange={(e) => setFormData({ ...formData, nodeAffected: e.target.value })} error={errors.nodeAffected}>
          <option value="">Seleccione nodo...</option>
          {NODE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </Select>
        <Select label="OLT Afectada" name="oltAffected" value={formData.oltAffected} onChange={(e) => setFormData({ ...formData, oltAffected: e.target.value })} error={errors.oltAffected}>
          <option value="">Seleccione OLT...</option>
          {OLT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </Select>
      </div>

      <label className="flex items-center space-x-2 text-text-secondary pt-2">
        <input
          type="checkbox"
          name="unavailability"
          checked={formData.unavailability}
          onChange={(e) => setFormData({ ...formData, unavailability: e.target.checked })}
          className="form-checkbox h-5 w-5 text-accent bg-primary border-border-color rounded focus:ring-accent"
        />
        <span>¿Servicio no disponible?</span>
      </label>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="secondary" onClick={onFinished}>Cancelar</Button>
        <Button type="submit">{ticketToEdit ? 'Actualizar Ticket' : 'Crear Ticket'}</Button>
      </div>
    </form>
  );
};

export default TicketForm;
