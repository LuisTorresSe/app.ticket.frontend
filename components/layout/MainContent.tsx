import React from 'react'
import { useAppContext } from '../../context/AppContext' // si sigues usando activeView de aquí
import { can } from '@/utils/permissions'

import Dashboard from '../dashboard/Dashboard'
import TicketList from '../tickets/TicketList'
import MailView from '../mail/MailView'
import SqlView from '../sql/SqlView'
import ArchivedView from '../archived/ArchivedView'
import CargasView from '../cargas/CargasView'
import UserManagementView from '../user-management/UserManagementView'
import Card from '../common/Card'

const MainContent: React.FC = () => {
    const { activeView } = useAppContext() // aún usas esto de AppContext

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return can('dashboard.view') ? <Dashboard /> : null
            case 'tickets':
                return can('ticket.view') ? <TicketList /> : null
            case 'mail':
                return can('mail.view') ? <MailView /> : null
            case 'sql':
                return can('sql.view') ? <SqlView /> : null
            case 'archived':
                return can('archived.view') ? <ArchivedView /> : null
            case 'cargas':
                return can('cargas.view') ? <CargasView /> : null
            case 'userManagement':
                return can('user.view') ? <UserManagementView /> : null
            default:
                return <div className="text-center p-8">Seleccione una vista de la barra lateral.</div>
        }
    }

    const viewComponent = renderView()

    if (viewComponent === null) {
        return (
            <Card className="p-8 text-center">
                <h2 className="text-2xl font-bold text-danger">Acceso Denegado</h2>
                <p className="text-text-secondary mt-2">No tienes permiso para ver esta sección.</p>
            </Card>
        )
    }

    return viewComponent
}

export default MainContent
