
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import Dashboard from '../dashboard/Dashboard';
import TicketList from '../tickets/TicketList';
import MailView from '../mail/MailView';
import SqlView from '../sql/SqlView';
import ArchivedView from '../archived/ArchivedView';
import CargasView from '../cargas/CargasView';
import UserManagementView from '../user-management/UserManagementView';
import Card from '../common/Card';

const MainContent: React.FC = () => {
    const { activeView, currentUser } = useAppContext();

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return currentUser.permissions.dashboard.view ? <Dashboard /> : null;
            case 'tickets':
                return currentUser.permissions.tickets.view ? <TicketList /> : null;
            case 'mail':
                return currentUser.permissions.mail.view ? <MailView /> : null;
            case 'sql':
                return currentUser.permissions.sql.view ? <SqlView /> : null;
            case 'archived':
                return currentUser.permissions.archived.view ? <ArchivedView /> : null;
            case 'cargas':
                return currentUser.permissions.cargas.view ? <CargasView /> : null;
            case 'userManagement':
                return currentUser.permissions.userManagement.view ? <UserManagementView /> : null;
            default:
                return <div className="text-center p-8">Seleccione una vista de la barra lateral.</div>;
        }
    }

    const viewComponent = renderView();
    
    if (viewComponent === null) {
        return (
             <Card className="p-8 text-center">
                <h2 className="text-2xl font-bold text-danger">Acceso Denegado</h2>
                <p className="text-text-secondary mt-2">No tienes permiso para ver esta sección.</p>
            </Card>
        )
    }

    return viewComponent;
};

export default MainContent;
