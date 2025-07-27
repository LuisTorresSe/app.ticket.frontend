import React, { createContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { AppState, AppContextType, Ticket, Subticket, ActionLog, View, User, UploadedRecord, UserRole, TicketStatus, EmailStatus, TicketType, SubticketStatus, Theme, Permissions, ClosedSubticketResponse, RequestChangeTicketStatus } from '../types';
import { CreateTicketPayload, CreateSubticketPayload, CloseSubticketPayload, RequestCloseSubticket, ResponseCloseSubticket, RequestUpdateTicket } from '../services/apiTypes';
import * as apiService from '../services/apiService';
import { USERS, USER_PERMISSIONS } from '../constants';
import { useAuthStore } from '@/store/authStore';
import { can } from '@/utils/permissions';

const AppContext = createContext<AppContextType | undefined>(undefined);

const VALID_THEMES: Theme[] = ['light', 'dark', 'gamer', 'adult'];

const getInitialState = (): AppState => ({
    currentUser: null,
    isAuthenticated: false,
    activeView: 'dashboard',
    tickets: [],
    subtickets: [],
    archivedTickets: [],
    archivedSubtickets: [],
    uploadedData: [],
    actionLogs: [],
    users: [],
    toast: null,
    loading: {
        initialLoad: false,
        login: false
    },
    theme: 'light'
})

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(getInitialState())
    const zustandUser = useAuthStore(state => state.user)

    const dispatch = useCallback(
        (action: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) => {
            setState(prev => ({
                ...prev,
                ...(typeof action === 'function' ? action(prev) : action)
            }))
        },
        []
    )

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning', duration = 3000) => {
        dispatch({ toast: { message, type } })
        setTimeout(() => dispatch({ toast: null }), duration)
    }, [dispatch])

    // ✅ Restaurar estado desde zustand (authStore)
    useEffect(() => {
        if (zustandUser && !state.isAuthenticated) {
            dispatch({
                currentUser: {
                    id: zustandUser.userId,
                    name: zustandUser.fullName,
                    role: zustandUser.roles,
                    permissions: zustandUser.permissions,
                },
                isAuthenticated: true,
            })
        }
    }, [zustandUser, state.isAuthenticated, dispatch])

    // ✅ Restaurar theme del localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const initialTheme: Theme = savedTheme && VALID_THEMES.includes(savedTheme)
            ? savedTheme
            : prefersDark ? 'dark' : 'light'

        document.documentElement.classList.remove('dark', 'gamer', 'adult')
        if (initialTheme !== 'light') document.documentElement.classList.add(initialTheme)

        dispatch({ theme: initialTheme })
    }, [dispatch])

    // ✅ Cargar data si ya está logueado
    useEffect(() => {
        const shouldReloadData =
            state.isAuthenticated &&
            state.tickets.length === 0 &&
            !state.loading.initialLoad

        if (!shouldReloadData) return

        const fetchInitialData = async () => {
            dispatch(p => ({ ...p, loading: { ...p.loading, initialLoad: true } }))

            try {
                const [
                    tickets,
                    archivedTickets,
                    subtickets,
                    uploadedData,
                    actionLogs,
                    users,
                ] = await Promise.all([
                    apiService.fetchTickets(),
                    apiService.fetchArchivedTickets(),
                    apiService.fetchAllSubtickets(),
                    apiService.fetchUploadedData(),
                    apiService.fetchActionLogs(),
                    apiService.fetchUsers(),
                ])

                dispatch(p => ({
                    ...p,
                    tickets,
                    archivedTickets,
                    subtickets,
                    uploadedData,
                    actionLogs,
                    users,
                }))
            } catch (error) {
                console.error('Error al recargar datos tras reload', error)
            } finally {
                dispatch(p => ({
                    ...p,
                    loading: { ...p.loading, initialLoad: false },
                }))
            }
        }

        fetchInitialData()
    }, [state.isAuthenticated, state.tickets.length, state.loading.initialLoad, dispatch])




    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        dispatch(p => ({ ...p, loading: { ...p.loading, login: true } }));

        try {
            const auth = useAuthStore.getState();
            const success = await auth.login(username, password);

            const user = useAuthStore.getState().user;


            console.log(user)

            // fallback en caso no haya user (modo offline o error inesperado)
            const fallbackUser = user ?? null

            dispatch(p => ({ ...p, loading: { ...p.loading, initialLoad: true } }));

            let tickets: Ticket[] = [];
            let archivedTickets: Ticket[] = [];
            let subtickets: Subticket[] = [];
            let uploadedData: UploadedRecord[] = [];
            let actionLogs: ActionLog[] = [];
            let users: User[] = [];

            try {
                [
                    tickets,
                    archivedTickets,
                    subtickets,
                    uploadedData,
                    actionLogs,
                    users,
                ] = await Promise.all([
                    apiService.fetchTickets(),
                    apiService.fetchArchivedTickets(),
                    apiService.fetchAllSubtickets(),
                    apiService.fetchUploadedData(),
                    apiService.fetchActionLogs(),
                    apiService.fetchUsers(),
                ]);
            } catch (e) {
                console.warn('❗ Carga inicial falló, se continuará con datos vacíos.', e);
            }

            dispatch({
                isAuthenticated: true,
                currentUser: {
                    id: fallbackUser.userId,
                    name: fallbackUser.fullName,
                    role: fallbackUser.roles, // si más adelante es un array, cambia a roles[0]
                    permissions: fallbackUser?.permissions,
                },
                activeView: 'dashboard',
                tickets,
                archivedTickets,
                subtickets,
                uploadedData,
                actionLogs,
                users,
            });

            showToast(`Bienvenido de nuevo, ${fallbackUser.fullName}!`, 'success');
            return true;

        } catch (error) {
            console.error('Error durante login, se continuará en modo sin datos', error);

            const anonUser = {
                id: `user-${Date.now()}`,
                fullName: username,
                role: UserRole.User,
                permissions: USER_PERMISSIONS,
            };

            dispatch({ isAuthenticated: true, currentUser: anonUser });
            showToast('Sesión iniciada en modo offline.', 'warning');
            return true;
        } finally {
            dispatch(p => ({
                loading: { ...p.loading, login: false, initialLoad: false },
            }));
        }
    }, [dispatch, showToast]);




    const logout = useCallback(() => {
        dispatch(getInitialState());
        showToast('Sesión cerrada con éxito.', 'success');
    }, [dispatch, showToast]);

    const changeTheme = useCallback((theme: Theme) => {
        if (!VALID_THEMES.includes(theme)) return;
        dispatch(prevState => {
            localStorage.setItem('theme', theme);
            const root = document.documentElement;
            root.classList.remove('dark', 'gamer', 'adult');
            if (theme !== 'light') {
                root.classList.add(theme);
            }
            return { ...prevState, theme };
        });
    }, [dispatch]);

    const logAction = useCallback(async (ticketCode: string, action: string) => {
        if (!state.currentUser) return;
        try {
            const newLog = await apiService.logAction({
                ticketCode,
                action,
                user: state.currentUser.name,
                role: state.currentUser.role,
            });
            dispatch(prevState => ({ actionLogs: [newLog, ...prevState.actionLogs] }));
        } catch (error) {
            console.error("Failed to log action:", error);
        }
    }, [state.currentUser, dispatch]);

    // USER MANAGEMENT
    const addUser = async (userData: Omit<User, 'id'>) => {
        if (!state.currentUser?.permissions.userManagement.create) {
            showToast('No tienes permiso para crear usuarios.', 'error');
            return;
        }
        try {
            const newUser = await apiService.createUser(userData);
            dispatch(p => ({ users: [...p.users, newUser] }));
            showToast('Usuario creado con éxito.', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Error creando usuario', 'error');
        }
    }
    const updateUser = async (userId: string, userData: Partial<User>) => {
        if (!state.currentUser?.permissions.userManagement.edit) {
            showToast('No tienes permiso para editar usuarios.', 'error');
            return;
        }
        try {
            const updatedUser = await apiService.updateUser(userId, userData);
            dispatch(p => ({ users: p.users.map(u => u.id === userId ? updatedUser : u) }));
            showToast('Usuario actualizado con éxito.', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Error actualizando usuario', 'error');
        }
    }
    const deleteUser = async (userId: string) => {
        if (!state.currentUser?.permissions.userManagement.delete) {
            showToast('No tienes permiso para eliminar usuarios.', 'error');
            return;
        }
        try {
            await apiService.deleteUser(userId);
            dispatch(p => ({ users: p.users.filter(u => u.id !== userId) }));
            showToast('Usuario eliminado con éxito.', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Error eliminando usuario', 'error');
        }
    }


    const addTicket = useCallback(async (ticketData: CreateTicketPayload) => {
        if (!can("ticket.create")) {
            showToast('No tienes permiso para crear tickets.', 'error');
            return;
        }
        dispatch(p => ({ loading: { ...p.loading, savingTicket: true } }));
        try {

            console.log(ticketData.assignTo)

            const newTicket = await apiService.createTicket(ticketData, state.currentUser);


            dispatch(prevState => ({ tickets: [...prevState.tickets, newTicket] }));
            await logAction(newTicket.code, `Ticket creado.`);
            showToast(`Ticket ${newTicket.code} creado con éxito`, 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error al crear el ticket.";
            showToast(message, 'error');
        } finally {
            dispatch(p => ({ loading: { ...p.loading, savingTicket: false } }));
        }
    }, [state.currentUser, dispatch, logAction, showToast]);

    const updateTicket = useCallback(async (ticketId: string, updates: RequestUpdateTicket, currentUser: User | null): Promise<boolean> => {
        if (!can("ticket.edit")) {
            showToast('No tienes permiso para editar tickets.', 'error');
            return false;
        }

        const ticket = state.tickets.find(t => t.id === ticketId);
        if (!ticket) {
            showToast('Ticket no encontrado en memoria.', 'error');
            return false;
        }

        const loadingKey = `savingTicket_${ticketId}`;
        dispatch(prev => ({
            loading: { ...prev.loading, [loadingKey]: true },
        }));

        try {
            const updatedTicket = await apiService.updateTicket(ticketId, updates, currentUser.id);

            console.log(updatedTicket)

            dispatch(prev => ({
                tickets: prev.tickets.map(t =>
                    t.id === updatedTicket.id ? updatedTicket : t
                ),
            }));

            await logAction(updatedTicket.code, `Ticket actualizado.`);

            showToast(`Ticket ${updatedTicket.code} actualizado con éxito.`, 'success');

            // Refrescar tickets y subtickets desde el backend
            const [refreshedTickets, refreshedSubtickets] = await Promise.all([
                apiService.fetchTickets(),
                apiService.fetchAllSubtickets(),
            ]);

            dispatch(prev => ({
                tickets: refreshedTickets,
                subtickets: refreshedSubtickets,
            }));

            return true;
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Error al actualizar el ticket.';
            showToast(message, 'error');
            return false;
        } finally {
            dispatch(prev => ({
                loading: { ...prev.loading, [loadingKey]: false },
            }));
        }
    },
        [state.currentUser, state.tickets, dispatch, logAction, showToast]
    );

    const updateSubticket = useCallback(async (ticketId: number, subticketId: number, updates: Partial<Subticket>, currentUser: User) => {
        if (!can("ticket.edit")) {
            showToast('No tienes permiso para editar subtickets.', 'error');
            return;
        }
        const subticket = state.subtickets.find(st => st.id === subticketId);
        if (!subticket) {
            showToast('Subticket no encontrado', 'error');
            return;
        }

        dispatch(p => ({ loading: { ...p.loading, [`savingSubticket_${subticketId}`]: true } }));
        try {
            const updatedSubticket = await apiService.updateSubticket(ticketId, subticketId, updates, currentUser.id);
            dispatch(prevState => ({
                subtickets: prevState.subtickets.map(st => st.id === subticketId ? updatedSubticket : st)
            }));
            const parentTicket = state.tickets.find(t => t.id === updatedSubticket.ticketId);
            if (parentTicket) {
                await logAction(parentTicket.code, `Subticket ${updatedSubticket.code} actualizado.`);
                showToast(`Subticket ${updatedSubticket.code} actualizado`, 'success');
            }


            // Refrescar tickets y subtickets desde el backend
            const [refreshedTickets, refreshedSubtickets] = await Promise.all([
                apiService.fetchTickets(),
                apiService.fetchAllSubtickets(),
            ]);

            dispatch(prev => ({
                tickets: refreshedTickets,
                subtickets: refreshedSubtickets,
            }));

            return true;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error al actualizar subticket.";
            showToast(message, 'error');
        } finally {
            dispatch(p => ({ loading: { ...p.loading, [`savingSubticket_${subticketId}`]: false } }));
        }
    }, [state.subtickets, state.tickets, state.currentUser, dispatch, logAction, showToast]);


    const changeTicketStatus = useCallback(
        async (request: RequestChangeTicketStatus): Promise<boolean> => {
            const { ticketId } = request;

            if (!can("ticket.edit")) {
                showToast('No tienes permiso para editar tickets.', 'error');
                return false;
            }

            const ticket = state.tickets.find(t => t.id === ticketId);
            if (!ticket) {
                showToast('Ticket no encontrado en memoria.', 'error');
                return false;
            }

            const loadingKey = `savingTicket_${ticketId}`;
            dispatch(prev => ({
                loading: { ...prev.loading, [loadingKey]: true }
            }));

            try {
                const result = await apiService.changeTicketStatus(request);

                if (!result.ok) {
                    showToast(result.message || 'Error al cambiar el estado del ticket.', 'error');
                    return false;
                }

                const updated = result.ticket;

                dispatch(prev => ({
                    tickets: prev.tickets.map(t =>
                        t.id === updated.ticketId
                            ? {
                                ...t,
                                status: updated.status,
                                managerId: updated.managerId,
                            }
                            : t
                    )
                }));

                await logAction(ticket.code, `Estado actualizado a ${updated.status}`);
                showToast(`Ticket ${ticket.code} actualizado a ${updated.status}`, 'success');
                const [refreshedTickets, refreshedSubtickets] = await Promise.all([
                    apiService.fetchTickets(),
                    apiService.fetchAllSubtickets()
                ]);

                dispatch(prev => ({
                    tickets: refreshedTickets,
                    subtickets: refreshedSubtickets
                }));
                return true;
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'Error al actualizar el ticket.';
                showToast(message, 'error');
                return false;
            } finally {
                dispatch(prev => ({
                    loading: { ...prev.loading, [loadingKey]: false }
                }));
            }
        },
        [state.currentUser, state.tickets, dispatch, logAction, showToast]
    );

    const closeTicket = useCallback(async (request: RequestChangeTicketStatus): Promise<boolean> => {
        const ticket = state.tickets.find(t => t.id === request.ticketId);

        if (!ticket) {
            showToast('Ticket no encontrado', 'error');
            return false;
        }

        const openSubtickets = state.subtickets.filter(
            st => st.ticketId === request.ticketId && st.status === SubticketStatus.Pending
        );
        if (openSubtickets.length > 0) {
            showToast('No se puede marcar como Solucionado hasta que todos los subtickets estén cerrados', 'warning');
            return false;
        }

        dispatch(p => ({ loading: { ...p.loading, closingTicket: true } }));

        try {
            const result = await apiService.closeTicket(request);

            if (!result.ok) {
                showToast(result.message || 'Error al cerrar el ticket', 'error');
                return false;
            }

            // ✅ Recargar todos los tickets y subtickets después del cierre
            const [refreshedTickets, refreshedSubtickets] = await Promise.all([
                apiService.fetchTickets(),
                apiService.fetchAllSubtickets()
            ]);

            dispatch(prev => ({
                tickets: refreshedTickets,
                subtickets: refreshedSubtickets
            }));

            await logAction(ticket.code, `Ticket cerrado por el manager.`);
            showToast(`Ticket ${ticket.code} cerrado con éxito`, 'success');

            return true;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al cerrar el ticket.';
            showToast(message, 'error');
            return false;
        } finally {
            dispatch(p => ({ loading: { ...p.loading, closingTicket: false } }));
        }
    }, [state.tickets, state.subtickets, dispatch, showToast, logAction]);

    const reopenTicket = useCallback(async (ticketId: string) => {
        const ticket = state.tickets.find(t => t.id === ticketId);
        if (ticket && can("ticket.edit")) {
            await updateTicket(ticketId, { status: TicketStatus.Pending, closingDate: undefined });
        } else {
            showToast('Permiso denegado o ticket no encontrado.', 'error');
        }
    }, [can("ticket.edit"), state.tickets, showToast, updateTicket]);

    const deleteTicket = useCallback(async (ticketId: string) => {
        if (!can("ticket.delete")) {
            showToast('No tienes permiso para archivar tickets.', 'error');
            return;
        }
        const ticketToDelete = state.tickets.find(t => t.id === ticketId);
        if (!ticketToDelete) return;

        dispatch(p => ({ loading: { ...p.loading, [`deleting_${ticketId}`]: true } }));
        try {
            await apiService.archiveTicket(ticketId);
            dispatch(prevState => {
                const subticketsToArchive = prevState.subtickets.filter(st => st.ticketId === ticketId);
                return {
                    tickets: prevState.tickets.filter(t => t.id !== ticketId),
                    subtickets: prevState.subtickets.filter(st => st.ticketId !== ticketId),
                    archivedTickets: [...prevState.archivedTickets, ticketToDelete],
                    archivedSubtickets: [...prevState.archivedSubtickets, ...subticketsToArchive],
                }
            });
            await logAction(ticketToDelete.code, 'Ticket archivado.');
            showToast(`Ticket ${ticketToDelete.code} archivado`, 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error al archivar el ticket.";
            showToast(message, 'error');
        } finally {
            dispatch(p => ({ loading: { ...p.loading, [`deleting_${ticketId}`]: false } }));
        }
    }, [can("ticket.delete"), state.tickets, dispatch, logAction, showToast]);

    const restoreTicket = useCallback(async (ticketId: string) => {
        if (!can("ticket.edit")) {
            showToast('No tienes permiso para restaurar tickets.', 'error');
            return;
        }
        dispatch(p => ({ loading: { ...p.loading, [`restoring_${ticketId}`]: true } }));
        try {
            const restoredTicket = await apiService.restoreTicket(ticketId);
            dispatch(prevState => {
                const subticketsToRestore = prevState.archivedSubtickets.filter(st => st.ticketId === ticketId);
                return {
                    archivedTickets: prevState.archivedTickets.filter(t => t.id !== ticketId),
                    archivedSubtickets: prevState.archivedSubtickets.filter(st => st.ticketId !== ticketId),
                    tickets: [...prevState.tickets, restoredTicket],
                    subtickets: [...prevState.subtickets, ...subticketsToRestore],
                }
            });
            await logAction(restoredTicket.code, 'Ticket restaurado.');
            showToast(`Ticket ${restoredTicket.code} restaurado`, 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error al restaurar el ticket.";
            showToast(message, 'error');
        } finally {
            dispatch(p => ({ loading: { ...p.loading, [`restoring_${ticketId}`]: false } }));
        }
    }, [can("ticket.edit"), dispatch, logAction, showToast]);

    const addSubticket = useCallback(async (subticketData: CreateSubticketPayload, currentUser: User) => {
        if (!can("ticket.create")) {
            showToast('No tienes permiso para crear subtickets.', 'error');
            return;
        }
        const parentTicket = state.tickets.find(t => t.id === subticketData.ticketId);
        if (!parentTicket) {
            showToast('Ticket padre no encontrado.', 'error');
            return;
        }

        dispatch(p => ({ loading: { ...p.loading, savingSubticket: true } }));
        try {
            // Crear el subticket
            const newSubticket = await apiService.createSubticket(subticketData, currentUser);

            // Refrescar tanto tickets como subtickets para asegurar sincronización completa
            const [refreshedTickets, refreshedSubtickets] = await Promise.all([
                apiService.fetchTickets(),
                apiService.fetchAllSubtickets()
            ]);

            // Actualizar el estado con los datos refrescados
            dispatch(prevState => ({
                tickets: refreshedTickets,
                subtickets: refreshedSubtickets
            }));

            await logAction(parentTicket.code, `Subticket ${newSubticket.code} añadido.`);
            showToast(`Subticket ${newSubticket.code} añadido a ${parentTicket.code}`, 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error al añadir el subticket.";
            showToast(message, 'error');
        } finally {
            dispatch(p => ({ loading: { ...p.loading, savingSubticket: false } }));
        }
    }, [state.tickets, state.currentUser, dispatch, logAction, showToast]);


    // Esta función transforma la respuesta del backend a tu tipo Subticket
    function adaptClosedSubticket(prev: Subticket, response: ClosedSubticketResponse): Subticket {
        return {
            ...prev, // mantiene campos como id, serverDowns, etc.
            ticketId: response.ticketId,
            code: response.code,
            cto: response.cto,
            card: response.card,
            port: response.port,
            city: response.city,
            clientCount: response.clientCount,
            eventStartDate: response.eventStartDate,
            reportedToPextDate: response.reportedToPextDate,
            creator: response.creator,
            status: response.status as SubticketStatus,
            node: response.node,
            olt: response.olt,
            closingAdvisor: response.closingAdvisor,
            eventEndDate: response.eventEndDate,
            rootCause: response.rootCause,
            badPraxis: response.badPraxis,
            solution: response.solution,
            statusPostSLA: response.statusPostSLA,
            comment: response.comment,
            eventResponsible: response.eventResponsible
        };
    }

    const closeSubticket = useCallback(async (
        requestCloseSubticket: RequestCloseSubticket, currentUser: User | null
    ): Promise<boolean> => {
        if (!can("ticket.edit")) {
            showToast('No tienes permiso para cerrar subtickets.', 'error');
            return false;
        }

        console.log(requestCloseSubticket.causeRoot + "estamos en el context")

        const subticketId = requestCloseSubticket.subticketId;

        dispatch(p => ({
            loading: {
                ...p.loading,
                [`closingSubticket_${subticketId}`]: true,
            }
        }));

        try {
            const request: RequestCloseSubticket = {
                ...requestCloseSubticket,
                managerId: currentUser.id,
                eventResponsible: currentUser?.name ?? '',
                comment: requestCloseSubticket.comment ?? null,
            };
            console.log(request.managerId + "esto es mi request")

            const result = await apiService.closeSubticket(request);

            if (!result.ok) {
                showToast(result.message || 'Error al cerrar subticket', 'error');
                return false;
            }

            // ✅ Recargar todos los tickets y subtickets
            const [refreshedTickets, refreshedSubtickets] = await Promise.all([
                apiService.fetchTickets(),
                apiService.fetchAllSubtickets()
            ]);

            dispatch(prevState => ({
                tickets: refreshedTickets,
                subtickets: refreshedSubtickets
            }));

            const parentTicket = refreshedTickets.find(t => t.id === requestCloseSubticket.ticketId);
            if (parentTicket) {
                await logAction(parentTicket.code, `Subticket cerrado`);
                showToast(`Subticket cerrado con éxito en ${parentTicket.code}`, 'success');
            }

            return true;

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al cerrar subticket.';
            showToast(message, 'error');
            return false;
        } finally {
            dispatch(p => ({
                loading: {
                    ...p.loading,
                    [`closingSubticket_${subticketId}`]: false,
                }
            }));
        }
    }, [
        can("ticket.edit"),
        state.currentUser?.id,
        state.currentUser?.fullName,
        dispatch,
        showToast,
        logAction,
    ]);

    const reopenSubticket = useCallback(async (subticketId: string) => {
        const subticket = state.subtickets.find(st => st.id === subticketId);
        if (!subticket || !state.currentUser?.permissions.tickets.edit) {
            showToast('Permiso denegado o subticket no encontrado.', 'error');
            return;
        }

        dispatch(p => ({ loading: { ...p.loading, [`reopeningSubticket_${subticketId}`]: true } }));
        try {
            const reopenedSubticket = await apiService.reopenSubticket(subticketId);
            dispatch(prevState => ({
                subtickets: prevState.subtickets.map(st => st.id === subticketId ? reopenedSubticket : st)
            }));
            const parentTicket = state.tickets.find(t => t.id === reopenedSubticket.ticketId);
            if (parentTicket) {
                await logAction(parentTicket.code, `Subticket ${reopenedSubticket.code} reabierto.`);
                showToast(`Subticket ${reopenedSubticket.code} reabierto`, 'success');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error al reabrir subticket.";
            showToast(message, 'error');
        } finally {
            dispatch(p => ({ loading: { ...p.loading, [`reopeningSubticket_${subticketId}`]: false } }));
        }
    }, [state.subtickets, state.tickets, can("ticket.edit"), dispatch, logAction, showToast]);

    // Cargar (o recargar) tickets y subtickets justo después de autenticarse.
    useEffect(() => {
        if (!state.isAuthenticated) return;

        let cancelled = false;
        const loadData = async () => {
            dispatch(p => ({ loading: { ...p.loading, ticketsFetch: true } }));
            try {
                const [tickets, subtickets] = await Promise.all([
                    apiService.fetchTickets(),
                    apiService.fetchAllSubtickets(),
                ]);
                if (!cancelled) {
                    dispatch({ tickets, subtickets });
                }
            } catch (e) {
                console.error('Error al obtener tickets tras login:', e);
            } finally {
                if (!cancelled) {
                    dispatch(p => ({ loading: { ...p.loading, ticketsFetch: false } }));
                }
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, [state.isAuthenticated]);

    const value = useMemo(() => ({
        ...state,
        dispatch,
        changeTheme,
        login,
        logout,
        showToast,
        addTicket,
        updateTicket,
        closeTicket,
        reopenTicket,
        deleteTicket,
        restoreTicket,
        addSubticket,
        updateSubticket,
        closeSubticket,
        reopenSubticket,
        logAction,
        addUser,
        updateUser,
        deleteUser,
        changeTicketStatus
    }), [state, dispatch, changeTheme, login, logout, showToast, addTicket, updateTicket, closeTicket, reopenTicket, deleteTicket, restoreTicket, addSubticket, updateSubticket, changeTicketStatus, closeSubticket, reopenSubticket, logAction, addUser, updateUser, deleteUser]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = React.useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
