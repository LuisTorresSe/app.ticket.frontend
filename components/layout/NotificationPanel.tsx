
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatDate } from '../../lib/utils';
import { ActionLog } from '../../types';

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { actionLogs } = useAppContext();
  const latestLogs = actionLogs.slice(0, 10);

  return (
    <div className="absolute right-0 mt-2 w-80 bg-secondary border border-border-color rounded-lg shadow-xl z-20">
      <div className="p-3 border-b border-border-color flex justify-between items-center">
        <h3 className="font-semibold text-text-primary">Actividad Reciente</h3>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary">&times;</button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {latestLogs.length > 0 ? (
          latestLogs.map((log: ActionLog) => (
            <div key={log.id} className="p-3 border-b border-border-color last:border-b-0 hover:bg-primary">
              <p className="text-sm text-text-primary">
                <span className="font-bold">{log.user}</span> ({log.role})
              </p>
              <p className="text-sm text-text-secondary">{log.action} para el ticket <span className="font-semibold text-accent">{log.ticketCode}</span></p>
              <p className="text-xs text-gray-500 mt-1">{formatDate(log.timestamp)}</p>
            </div>
          ))
        ) : (
          <p className="p-4 text-sm text-text-secondary">No hay actividad reciente.</p>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
