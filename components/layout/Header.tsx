
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ICONS } from '../../constants';
import NotificationPanel from './NotificationPanel';
import { View, Theme } from '../../types';
import { useAuthStore } from '@/store/authStore';

const viewTitles: Record<View, string> = {
    dashboard: 'Dashboard',
    tickets: 'Gestión de Tickets',
    mail: 'Vista de Correo',
    sql: 'Consola SQL',
    archived: 'Tickets Archivados',
    cargas: 'Servs Down',
    userManagement: 'Gestión de Usuarios'
}

const Header: React.FC = () => {
    const { activeView, theme, changeTheme } = useAppContext();

    const { login, user, logout } = useAuthStore()


    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const [isThemeMenuOpen, setThemeMenuOpen] = useState(false);
    const [isUserMenuOpen, setUserMenuOpen] = useState(false);

    const themeMenuRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
                setThemeMenuOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const themeOptions: { key: Theme; label: string }[] = [
        { key: 'light', label: 'Claro' },
        { key: 'dark', label: 'Oscuro' },
        { key: 'gamer', label: 'Gamer' },
        { key: 'adult', label: 'Golden' },
    ];

    if (!user) {
        return null; // Should not happen in a protected route
    }

    return (
        <header className="flex-shrink-0 bg-secondary border-b border-border-color px-4 md:px-6 py-3 flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-text-primary capitalize">{viewTitles[activeView]}</h1>
            <div className="flex items-center space-x-4">
                <div className="relative" ref={themeMenuRef}>
                    <button
                        onClick={() => setThemeMenuOpen(prev => !prev)}
                        className="p-2 rounded-full hover:bg-border-color text-text-secondary hover:text-text-primary transition-colors"
                        aria-label="Seleccionar tema"
                    >
                        {ICONS.shirt}
                    </button>
                    {isThemeMenuOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-secondary border border-border-color rounded-lg shadow-xl z-20 py-1 animate-fade-in">
                            {themeOptions.map(option => (
                                <button
                                    key={option.key}
                                    onClick={() => {
                                        changeTheme(option.key);
                                        setThemeMenuOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between ${theme === option.key ? 'bg-accent text-white' : 'text-text-primary hover:bg-primary'}`}
                                >
                                    <span>{option.label}</span>
                                    {theme === option.key && <span className="w-4 h-4">{ICONS.check}</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setNotificationsOpen(!isNotificationsOpen)}
                        className="p-2 rounded-full hover:bg-border-color text-text-secondary hover:text-text-primary transition-colors"
                    >
                        {ICONS.bell}
                    </button>
                    {isNotificationsOpen && <NotificationPanel onClose={() => setNotificationsOpen(false)} />}
                </div>

                <div className="relative" ref={userMenuRef}>
                    <button onClick={() => setUserMenuOpen(prev => !prev)} className="flex items-center space-x-2 p-1 rounded-md hover:bg-primary">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm">
                            {user.fullName.charAt(0)}
                        </div>
                        <span className="text-sm text-text-primary font-semibold hidden sm:inline">{user.fullName}</span>
                        <div className="text-text-secondary">{ICONS.chevronDown}</div>
                    </button>
                    {isUserMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-secondary border border-border-color rounded-lg shadow-xl z-20 py-1 animate-fade-in">
                            <div className="px-4 py-2 border-b border-border-color">
                                <p className="text-sm font-semibold text-text-primary">{user.fullName}</p>
                                <p className="text-xs text-text-secondary">{user.roles}</p>
                            </div>
                            <button
                                onClick={() => {
                                    logout();
                                    setUserMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-primary flex items-center"
                            >
                                <span className="w-5 h-5 mr-2">{ICONS.x}</span> Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
