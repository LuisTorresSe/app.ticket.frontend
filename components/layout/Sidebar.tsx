
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { UserRole } from '../../types';
import { ICONS } from '../../constants';
import { View } from '../../types';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  view: View;
  activeView: View;
  onClick: (view: View) => void;
  disabled?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, view, activeView, onClick, disabled = false }) => {
  const isActive = activeView === view;
  return (
    <button
      onClick={() => !disabled && onClick(view)}
      disabled={disabled}
      className={`flex items-center w-full px-4 py-3 text-left transition-colors duration-200 ${
        isActive
          ? 'bg-accent text-white'
          : 'text-text-secondary hover:bg-border-color hover:text-text-primary'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="mr-3">{icon}</div>
      <span>{label}</span>
    </button>
  );
};

const Sidebar: React.FC = () => {
    const { activeView, dispatch, currentUser } = useAppContext();

    if (!currentUser) {
        return null; // Should not render if no user is logged in
    }
    
    const { permissions } = currentUser;

    const handleNavClick = (view: View) => {
        dispatch({ activeView: view });
    };

    return (
        <aside className="w-64 bg-secondary border-r border-border-color flex flex-col">
            <div className="flex items-center justify-center h-16 border-b border-border-color">
                <span className="text-2xl font-bold text-accent">Win</span>
            </div>
            <nav className="flex-1 py-4">
                <NavItem icon={ICONS.dashboard} label="Dashboard" view="dashboard" activeView={activeView} onClick={handleNavClick} disabled={!permissions.dashboard.view} />
                <NavItem icon={ICONS.ticket} label="Tickets" view="tickets" activeView={activeView} onClick={handleNavClick} disabled={!permissions.tickets.view} />
                <NavItem icon={ICONS.upload} label="Servs Down" view="cargas" activeView={activeView} onClick={handleNavClick} disabled={!permissions.cargas.view} />
                <NavItem icon={ICONS.mail} label="Vista de Correo" view="mail" activeView={activeView} onClick={handleNavClick} disabled={!permissions.mail.view} />
                
                <div className="my-4 border-t border-border-color"></div>
                <p className="px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Administración</p>
                <NavItem icon={ICONS.users} label="Gestión de Usuarios" view="userManagement" activeView={activeView} onClick={handleNavClick} disabled={!permissions.userManagement.view} />
                <NavItem icon={ICONS.sql} label="Consola SQL" view="sql" activeView={activeView} onClick={handleNavClick} disabled={!permissions.sql.view} />
                <NavItem icon={ICONS.archive} label="Archivados" view="archived" activeView={activeView} onClick={handleNavClick} disabled={!permissions.archived.view} />

            </nav>
            <div className="p-4 border-t border-border-color text-center text-xs text-text-secondary">
               <p> {new Date().getFullYear()} Ticketera</p>
            </div>
        </aside>
    );
};

export default Sidebar;
