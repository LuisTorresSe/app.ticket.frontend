import { Ticket, BackendTicket, BackendSubticket, TicketType, TicketStatus, Subticket, UploadedRecord, ActionLog, User, SubticketStatus, EmailStatus, UserRole, RequestCreateTicket, RequestCreateSubticket, RequestCloseTicket, ClosedSubticketResponse, RequestChangeTicketStatus, TicketStatusChangeResponse } from '../types';
import { CreateTicketPayload, UpdateTicketPayload, CreateSubticketPayload, UpdateSubticketPayload, CloseSubticketPayload, ApiResponse, CreateActionLogPayload, RequestCloseSubticket, ResponseCloseSubticket, ResponseCloseTicket, CloseTicketResult, UpdateSubticketRequest } from './apiTypes';
import { initialTickets, initialSubtickets, initialUploadedData, USERS, USER_PERMISSIONS } from '../constants';
import { generateTicketCode } from '../lib/utils';

// =====================================================================================
// !! IMPORTANT !!
// Replace this with your actual API base URL.
const API_BASE_URL = 'http://localhost:8080/api/v1';
// =====================================================================================


/**
 * A generic wrapper for the fetch API.
 * In a real application, you would uncomment the fetch logic.
 * The current implementation simulates API calls with a delay.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    //console.log(`[API] ${options.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body as string) : '');


    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // 'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        ...options.headers,
    };

    try {
        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
            throw new Error(errorData.message || 'An unknown API error occurred.');
        }

        if (response.status === 204) { // No Content
            return undefined as T;
        }


        return await response.json();
    } catch (error) {
        console.error(`API Fetch Error: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }



}


// --- MOCK DATABASE (for simulation purposes) ---
let mockDb = {
    tickets: JSON.parse(JSON.stringify(initialTickets)),
    subtickets: JSON.parse(JSON.stringify(initialSubtickets)),
    uploadedData: JSON.parse(JSON.stringify(initialUploadedData)),
    actionLogs: [] as ActionLog[],
    users: JSON.parse(JSON.stringify(USERS)),
};

// --- API Service Functions ---

// AUTH
export const login = async (username: string, password: string): Promise<User> => {



    // return apiFetch<User | null>('/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    //console.log('[MOCK] login', { username });
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const user = mockDb.users.find((u: { name: string; password: string; }) =>
        u.name.toLowerCase() === normalizedUsername && u.password === normalizedPassword
    );
    if (user) {
        return Promise.resolve(user);
    }

    // Si el usuario no existe en la base mock, creamos uno al vuelo y lo agregamos
    const newUser: User = {
        id: `user-${Date.now()}`,
        name: username,
        role: UserRole.User,
        permissions: USER_PERMISSIONS,
    };
    mockDb.users.push(newUser);
    return Promise.resolve(newUser);
};

// USERS
export const fetchUsers = async (): Promise<User[]> => {
    // return apiFetch<User[]>('/users');
    //console.log('[MOCK] fetchUsers');
    return Promise.resolve(mockDb.users);
};

export const createUser = async (payload: Omit<User, 'id'>): Promise<User> => {
    // return apiFetch<User>('/users', { method: 'POST', body: JSON.stringify(payload) });
    //console.log('[MOCK] createUser', payload);
    const newUser: User = {
        ...payload,
        id: `user-${Date.now()}`,
    };
    mockDb.users.push(newUser);
    return Promise.resolve(newUser);
};

export const updateUser = async (userId: string, payload: Partial<User>): Promise<User> => {
    // return apiFetch<User>(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(payload) });
    //console.log('[MOCK] updateUser', userId, payload);
    const userIndex = mockDb.users.findIndex((u: User) => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");

    // Don't update password if it's an empty string
    if (payload.password === '') {
        delete payload.password;
    }

    mockDb.users[userIndex] = { ...mockDb.users[userIndex], ...payload };
    return Promise.resolve(mockDb.users[userIndex]);
};

export const deleteUser = async (userId: string): Promise<ApiResponse> => {
    // return apiFetch<ApiResponse>(`/users/${userId}`, { method: 'DELETE' });
    //console.log('[MOCK] deleteUser', userId);
    const initialLength = mockDb.users.length;
    mockDb.users = mockDb.users.filter((u: User) => u.id !== userId);
    if (mockDb.users.length === initialLength) throw new Error("User not found to delete");
    return Promise.resolve({ success: true, message: 'User deleted successfully' });
};

// TICKETS
export const fetchTickets = async (): Promise<Ticket[]> => {
    try {
        const data = await apiFetch<any>('/ticket');
        const backendTickets: BackendTicket[] = normalizeTicketsResponse(data);

        return backendTickets.map(transformTicketFromBackend);
    } catch (error) {
        console.error('Error al obtener tickets:', error);
        return [];
    }
};

const normalizeTicketsResponse = (data: any): BackendTicket[] => {
    if (Array.isArray(data)) {
        return data as BackendTicket[];
    }

    if (data?.tickets && Array.isArray(data.tickets)) {
        return data.tickets as BackendTicket[];
    }

    if (data?.ticket) {
        return [data.ticket as BackendTicket];
    }

    return [];
};


export const fetchArchivedTickets = async (): Promise<Ticket[]> => {
    // return apiFetch<Ticket[]>('/tickets/archived');
    //console.log('[MOCK] fetchArchivedTickets');
    return Promise.resolve(mockDb.tickets.filter((t: Ticket) => t.status === TicketStatus.Solved));
};

export const createTicket = async (request: RequestCreateTicket, currentUser: User): Promise<Ticket> => {
    const backendPayload: RequestCreateTicket = {
        managerId: currentUser.id, // ID fijo como solicitado
        type: request.type,
        report: request.report,
        diagnosis: request.diagnosis,
        createAtEvent: request.createAtEvent,
        assignTo: request.assignTo,
        unavailability: request.unavailability,
        nodeAffected: request.nodeAffected,
        oltAffected: request.oltAffected
    };

    try {
        const response = await apiFetch<BackendTicket>('/ticket', {
            method: 'POST',
            body: JSON.stringify(backendPayload)
        });



        //console.log('Respuesta del backend al crear ticket:', response);
        return transformTicketFromBackend(response);
    } catch (error) {
        console.error('Error al crear ticket:', error);
        throw error;
    }
};

export const updateTicket = async (ticketId: string, payload: UpdateTicketPayload, currentId: string): Promise<Ticket> => {

    const response = await apiFetch<BackendTicket>(`/ticket/updated/${ticketId}`, {
        method: 'PUT', // o 'PATCH' si tu backend lo prefiere para updates parciales
        body: JSON.stringify({ ...payload, managerId: currentId }),
    });

    console.log(response)
    return transformTicketFromBackend(response.data);
};

export const archiveTicket = async (ticketId: string): Promise<ApiResponse> => {
    // return apiFetch<ApiResponse>(`/tickets/${ticketId}`, { method: 'DELETE' });
    //console.log('[MOCK] archiveTicket', ticketId);
    const ticket = mockDb.tickets.find((t: Ticket) => t.id === ticketId);
    if (!ticket) throw new Error("Ticket not found");
    // In mock, we just change the status, real archive might move it
    ticket.status = TicketStatus.Solved;
    ticket.closingDate = new Date().toISOString();
    return Promise.resolve({ success: true, message: "Ticket archivado." });
};

export const restoreTicket = async (ticketId: string): Promise<Ticket> => {
    // return apiFetch<Ticket>(`/tickets/${ticketId}/restore`, { method: 'POST' });
    //console.log('[MOCK] restoreTicket', ticketId);
    const ticket = mockDb.tickets.find((t: Ticket) => t.id === ticketId);
    if (!ticket) throw new Error("Ticket not found");
    ticket.status = TicketStatus.Pending;
    ticket.closingDate = undefined;
    return Promise.resolve(ticket);
};

// SUBTICKETS
export const fetchAllSubtickets = async (): Promise<Subticket[]> => {
    const backendTickets = await apiFetch<BackendTicket[]>('/ticket');
    //console.log('Respuesta de la API para subtickets:', JSON.stringify(backendTickets, null, 2));
    const subtickets: Subticket[] = [];
    backendTickets.forEach(bt => {
        const ticketId = bt.ticketId ?? bt.id;
        if (!ticketId) {
            //  console.warn('Ticket sin ID encontrado:', JSON.stringify(bt, null, 2));
            return;
        }

        if (bt.subtickets && Array.isArray(bt.subtickets)) {
            bt.subtickets.forEach((bst: any) => {
                try {
                    //    //console.log('Procesando subticket:', JSON.stringify(bst, null, 2));
                    const transformed = transformSubticketFromBackend(bst as BackendSubticket, ticketId);
                    subtickets.push(transformed);
                } catch (error) {
                    //console.error('Error transformando subticket:', error);
                    // console.error('Datos del subticket:', JSON.stringify(bst, null, 2));
                    // console.error('Datos del ticket padre:', JSON.stringify(bt, null, 2));
                }
            });
        }
    });
    return subtickets;
};

export const createSubticket = async (payload: CreateSubticketPayload, currentUser: User): Promise<Subticket> => {
    const backendPayload: RequestCreateSubticket = {
        createManagerId: currentUser.id,
        ticketId: parseInt(payload.ticketId, 10),
        eventStartDate: payload.eventStartDate,
        reportedToPextDate: payload.reportedToPextDate,
        card: parseInt(payload.card, 10),
        port: parseInt(payload.port, 10),
        city: payload.city,
        cto: payload.cto,
        commentary: '',
        serverDown: [] // Por ahora no enviamos server downs
    };



    try {
        //   //console.log('Enviando subticket al backend:', backendPayload);
        const response = await apiFetch<BackendSubticket>('/subticket', {
            method: 'POST',
            body: JSON.stringify(backendPayload)
        });

        ////console.log('Respuesta del backend al crear subticket:', response);
        return transformSubticketFromBackend(response, backendPayload.ticketId);
    } catch (error) {
        //console.error('Error al crear subticket:', error);
        throw error;
    }
};

export const updateSubticket = async (ticketId: number, subticketId: number, payload: UpdateSubticketPayload, currentId: string): Promise<Subticket> => {


    const request: UpdateSubticketRequest = {
        ticketId: ticketId,
        subticketId: subticketId,
        updateManagerId: currentId,
        createEventAt: payload.eventStartDate,
        dateReportPext: payload.eventStartDate,
        card: payload.card,
        port: payload.port,
        cto: payload.cto,
        commentary: payload.comment,
        city: payload.city,
        countClient: payload.clientCount

    }




    return apiFetch<Subticket>(`/subticket/update`, { method: 'PUT', body: JSON.stringify(request) });



};


type CloseSubticketResult = {
    ok: true;
    subticket: ClosedSubticketResponse;
    ticket?: Ticket; // si el ticket también cambia
} | {
    ok: false;
    message: string;
};

export const closeSubticket = async (
    request: RequestCloseSubticket
): Promise<CloseSubticketResult> => {
    try {
        const response = await apiFetch<any>('/subticket/close', {
            method: 'PUT',
            body: JSON.stringify({ ...request }),
        });

        ////console.log(request.rootCause)

        const closedSubticket: ClosedSubticketResponse = response.data;

        return { ok: true, subticket: closedSubticket };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Error desconocido al cerrar el subticket.';
        return { ok: false, message };
    }
};

export type ChangeTicketStatusResult = {
    ok: true;
    ticket: TicketStatusChangeResponse;
} | {
    ok: false;
    message: string;
};

export const changeTicketStatus = async (
    request: RequestChangeTicketStatus
): Promise<ChangeTicketStatusResult> => {
    try {
        const response = await apiFetch<{ data: TicketStatusChangeResponse }>('/ticket/changeStatus', {
            method: 'PUT',
            body: JSON.stringify({
                ...request,
                managerId: request.managerId // fallback si no se pasa
            }),
        });

        return {
            ok: true,
            ticket: response.data,
        };
    } catch (error) {
        const message = error instanceof Error
            ? error.message
            : 'Error desconocido al cambiar el estado del ticket.';
        return {
            ok: false,
            message,
        };
    }
};


export const closeTicket = async (
    request: RequestChangeTicketStatus
): Promise<CloseTicketResult> => {
    try {
        const response = await apiFetch<ResponseCloseTicket>('/ticket/changeStatus', {
            method: 'PUT',
            body: JSON.stringify({ ...request })
        });

        ////console.log(response.ticketStatus)

        return { ok: true, response };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido al cerrar el ticket.';
        return { ok: false, message };
    }
};



export const reopenSubticket = async (subticketId: string): Promise<Subticket> => {
    // return apiFetch<Subticket>(`/subtickets/${subticketId}/reopen`, { method: 'POST' });
    ////console.log('[MOCK] reopenSubticket', subticketId);
    const subticketIndex = mockDb.subtickets.findIndex((st: Subticket) => st.id === subticketId);
    if (subticketIndex === -1) throw new Error("Subticket not found");
    const subticket = mockDb.subtickets[subticketIndex];
    subticket.status = SubticketStatus.Pending;
    subticket.closingAdvisor = undefined;
    subticket.eventEndDate = undefined;
    subticket.rootCause = undefined;
    subticket.badPraxis = undefined;
    subticket.solution = undefined;
    subticket.statusPostSLA = undefined;
    subticket.comment = undefined;
    subticket.eventResponsible = undefined;
    return Promise.resolve(subticket);
};

// OTHER DATA
export const fetchUploadedData = async (): Promise<UploadedRecord[]> => {
    // return apiFetch<UploadedRecord[]>('/cargas');
    //console.log('[MOCK] fetchUploadedData');
    return Promise.resolve(mockDb.uploadedData);
};

export const fetchActionLogs = async (): Promise<ActionLog[]> => {
    // return apiFetch<ActionLog[]>('/logs');
    //console.log('[MOCK] fetchActionLogs');
    return Promise.resolve(mockDb.actionLogs);
};

export const logAction = async (payload: CreateActionLogPayload): Promise<ActionLog> => {
    // return apiFetch<ActionLog>('/logs', { method: 'POST', body: JSON.stringify(payload) });
    //console.log('[MOCK] logAction', payload);
    const newLog: ActionLog = {
        ...payload,
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
    };
    mockDb.actionLogs.unshift(newLog);
    return Promise.resolve(newLog);
};

// ---------------------- Helpers de transformación ----------------------

function mapBackendStatus(status: string): TicketStatus {
    switch (status || '') {
        case 'PENDIENTE':
            return TicketStatus.Pending;
        case 'EN_EJECUCION':
            return TicketStatus.InProgress;
        case 'EN_PAUSA':
            return TicketStatus.OnHold;
        case 'SOLUCIONADO':
            return TicketStatus.Solved;
        case '':
            return TicketStatus.Pending;
        default:
            return TicketStatus.Pending;
    }
}

function mapBackendType(type: string): TicketType {
    switch (type || '') {
        case 'PROACTIVO':
            return TicketType.Proactive;
        case 'REACTIVO':
            return TicketType.Reactive;
        case 'MANTENIMIENTO':
            return TicketType.Maintenance;
        case '':
            return TicketType.Proactive;
        default:
            return TicketType.Proactive;
    }
}

function transformTicketFromBackend(bt: BackendTicket): Ticket {
    //console.log('Transformando ticket del backend:', bt);
    const ticket = {
        id: (bt.ticketId ?? bt.id ?? '').toString(),
        code: bt.codeTicket ?? (bt.code as any),
        type: mapBackendType(bt.ticketType ?? (bt.type as any)),
        reportedBy: bt.ticketReport ?? bt.report,
        initialDiagnosis: bt.diagnosis,
        creationDate: bt.createdAt ?? bt.creationDate ?? bt.createdAt ?? new Date().toISOString(),
        serviceUnavailable: bt.unavailability,
        assignTo: bt.assignTo,
        node: bt.nodeAffected ?? bt.nodeAffected ?? '',
        olt: bt.oltAffected ?? '',
        advisor: bt.managerAtAperture?.managerName || bt.managerAtAperture?.name || 'Desconocido',
        emailStatus: bt.emailStatus,
        status: mapBackendStatus(bt.statusTicket ?? (bt.status as any)),
        closingDate: bt.closedAt ?? undefined,
        subticketIds: Array.isArray(bt.subtickets) ? bt.subtickets.map((st: any) => st.id?.toString?.() ?? '') : [],
        pauseHistory: [],
        executionHistory: [],
        codeTicket: bt.codeTicket

    };
    //console.log('Ticket transformado:', ticket);
    return ticket;
}

// ---------------------- Helpers de transformación (subtickets) ----------------------


function transformSubticketFromBackend(bs: any, parentTicketId: number | string): Subticket {
    // Validación más detallada
    if (!bs) {
        throw new Error('Subticket es null o undefined');
    }

    // Intentamos extraer un ID del subticket de cualquier fuente posible
    const subticketId = bs.subticketId?.toString() ?? bs.id?.toString() ?? bs.subticketCode?.match(/\d+/)?.[0];
    if (!subticketId) {
        console.error('Subticket inválido:', JSON.stringify(bs, null, 2));
        throw new Error('No se pudo determinar un ID válido para el subticket');
    }

    // Intentamos normalizar los datos que podrían venir en diferentes formatos
    const normalizedData = {
        code: bs.subticketCode || bs.code || `ST-${subticketId}`,
        ctoAffected: bs.ctoAffected || bs.cto || '',
        card: (bs.card || bs.cardNumber || '').toString(),
        port: (bs.port || bs.portNumber || '').toString(),
        city: bs.city || bs.cityName || '',
        countClient: parseInt(bs.countClient || bs.clientCount || bs.affectedClients || '0'),
        createdAt: bs.createEventAt || bs.createdAt || bs.eventStartDate || bs.dateCreated || new Date().toISOString(),
        dateReportPext: bs.dateReportPext || bs.reportedToPextDate || bs.createdAt || new Date().toISOString(),
        status: bs.statusSubticket || bs.status || 'PENDIENTE',
        managerAperture: bs.createManagerAt || bs.managerAperture || { managerName: 'Desconocido' },
        managerClose: bs.closeManagerAt || bs.closeManagerAt || { managerName: 'Desconocido' },
        closeEventAt: bs.closeEventAt,
        badPraxis: bs.badPraxis,
        causeProblem: bs.causeProblem,
        solutions: bs.solutions

    };

    // Log para debugging
    //console.log('Datos normalizados del subticket:', normalizedData);
    //console.log('Datos originales del subticket:', bs);

    const transformedSubticket: Subticket = {
        id: subticketId,
        ticketId: parentTicketId.toString(),
        code: normalizedData.code,
        cto: normalizedData.ctoAffected,
        card: normalizedData.card,
        port: normalizedData.port,
        city: normalizedData.city,
        clientCount: normalizedData.countClient,
        eventStartDate: normalizedData.createdAt,
        reportedToPextDate: normalizedData.dateReportPext,
        creator: normalizedData.managerAperture?.managerName || 'Desconocido',
        closingAdvisor: normalizedData.managerClose?.managerName || 'Desconocido',
        status: normalizedData.status,
        eventEndDate: normalizedData.closeEventAt,
        badPraxis: normalizedData.badPraxis,
        rootCause: normalizedData.causeProblem,
        solution: normalizedData.solutions,
        node: bs.nodeAffected || bs.node || '',
        olt: bs.oltAffected || bs.olt || '',
        serverDowns: bs.serverdowns || bs.serverDowns || []
    };

    // Log del resultado final
    //console.log('Subticket transformado:', transformedSubticket);

    return transformedSubticket;
}

// -----------------------------------------------------------------------