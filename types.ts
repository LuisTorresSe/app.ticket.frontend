export enum UserRole {
  User = 'Usuario',
  Superuser = 'Superusuario',
}

export interface Permissions {
  dashboard: {
    view: boolean;
    configure: boolean;
  };
  tickets: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  mail: {
    view: boolean;
  };
  cargas: {
    view: boolean;
    configure: boolean;
  };
  archived: {
    view: boolean;
    edit: boolean; // For restoring
  };
  sql: {
    view: boolean;
  };
  userManagement: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  password?: string; // Should be handled securely on a real backend
  permissions: Permissions;
}

export enum TicketType {
  Reactive = 'REACTIVO',
  Maintenance = 'MANTENIMIENTO',
  Proactive = 'PROACTIVO',
}

export enum TicketStatus {
  Pending = 'PENDIENTE',
  InProgress = 'EN_EJECUCION',
  OnHold = 'EN_PAUSA',
  Solved = 'SOLUCIONADO',
}

export enum EmailStatus {
  NotDeclared = 'No Declarado',
  Declared = 'Declarado',
}

export enum SubticketStatus {
  Pending = 'Pendiente',
  Closed = 'Cerrado',
}

export interface PauseInfo {
  startTime: string;
  endTime?: string;
  reason: string;
}

export interface ExecutionInfo {
  startTime: string;
  endTime?: string;
}

// --- Modelo que viene del backend ---
export interface BackendManager {
  name: string;
  managerId: string;
  managerName: string;
}

export interface BackendTicket {
  id: number;
  code: any;
  type: any;
  report: string;
  creationDate: string;
  status: any;
  ticketId: number;
  codeTicket: string;
  managerAtAperture: BackendManager;
  managerAtClose: BackendManager | null;
  statusTicket: string;
  ticketType: string;
  ticketReport: string;
  diagnosis: string;
  createdAt: string;
  closedAt: string | null;
  unavailability: boolean;
  nodeAffected: string;
  oltAffected: string;
  comment: string | null;
  subtickets: unknown[]; // Ajustar si se modelan subtickets desde el backend
}

// --- Modelo interno usado por la aplicación ---
export interface Ticket {
  id: string;
  code: string;
  type: TicketType;
  reportedBy: string;
  initialDiagnosis: string;
  creationDate: string;
  serviceUnavailable: boolean;
  node: string;
  olt: string;
  advisor: string;
  emailStatus: EmailStatus;
  status: TicketStatus;
  closingDate?: string;
  subticketIds: string[];
  pauseHistory: PauseInfo[];
  executionHistory: ExecutionInfo[];
}

// ---------------------- Modelos provenientes del backend para subtickets y server downs ----------------------

export interface BackendClient {
  id: number;
  status: string;
  documentCi: string;
  serialNumber: string;
  orderCode: string;
  portGpon: string;
  district: string;
  boxDescription: string;
  ctoCode: string;
  contrata: string;
}

export interface BackendServerDown {
  id: number;
  client: BackendClient;
}

export interface BackendSubticket {
  id: number;
  code: string;
  createdAt: string;
  closedAt: string | null;
  dateReportPext: string;
  dateStartLabores: string | null;
  dateStopLabores: string | null;
  card: number;
  port: number;
  ctoAffected: string | null;
  city: string | null;
  causeProblem: string | null;
  status: string;
  comment: string | null;
  responsable: string | null;
  countClient: number | null;
  badPraxis: boolean | null;
  solutions: string | null;
  managerAperture: BackendManager;
  managerClose: BackendManager | null;
  serverDowns: BackendServerDown[] | null;
}

// -----------------------------------------------------------------------------------------------------------

export interface Client {
    clientId: number;
    statusAccount: string;
    documentCi: string;
    serialNumber: string;
    orderCode: string;
    portGpon: string;
    descriptionDepartament: string | null;
    descriptionDistrict: string;
    descriptionBox: string;
    codeBox: string;
    contrata: string;
}

export interface ServerDown {
    serverdownId: number;
    subticketId: number;
    client: Client;
}

export interface BackendSubticket {
    subticketId: number;
    subticketCode: string;
    createManagerAt: BackendManager;
    closeManagerAt: BackendManager | null;
    createEventAt: string;
    closeEventAt: string | null;
    dateReportPext: string;
    dateStopLabores: string | null;
    dateStartLabores: string | null;
    card: number;
    port: number;
    ctoAffected: string | null;
    city: string | null;
    causeProblem: string | null;
    countClient: number | null;
    badPraxis: boolean | null;
    solutions: string | null;
    statusSubticket: string;
    commentary: string | null;
    responsable: string | null;
    serverdowns: ServerDown[];
}

export interface Subticket {
  id: string;
  ticketId: string;
  code: string;
  cto: string;
  card: string;
  port: string;
  city: string;
  clientCount: number;
  eventStartDate: string;
  reportedToPextDate: string;
  creator: string;
  status: SubticketStatus;
  node: string;
  olt: string;
  // Closing fields
  closingAdvisor?: string;
  eventEndDate?: string;
  rootCause?: string;
  badPraxis?: boolean;
  solution?: string;
  statusPostSLA?: string;
  comment?: string;
  eventResponsible?: string;
  serverDowns?: ServerDown[];
}

export interface ActionLog {
  id: string;
  ticketCode: string;
  action: string;
  user: string;
  role: UserRole;
  timestamp: string;
}

export type View = 'dashboard' | 'tickets' | 'mail' | 'sql' | 'archived' | 'cargas' | 'userManagement';

export type Theme = 'light' | 'dark' | 'gamer' | 'adult';

export interface UploadedRecord {
  id: string;
  ticket?: string;
  fecha: string;
  estadoCuenta: string;
  numDoc: string;
  sn: string;
  codPedido: string;
  departamento: string;

  distrito: string;
  tipoCaja: string;
  cto: string;
  servicio: string;
  tiempoEnCaida?: string;
  estadoAveria?: string;
  inicioEvento?: string;
  finEvento?: string;
}

export interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
  activeView: View;

  tickets: Ticket[];

  subtickets: Subticket[];
  archivedTickets: Ticket[];
  archivedSubtickets: Subticket[];
  uploadedData: UploadedRecord[];
  actionLogs: ActionLog[];
  users: User[];
  toast: { message: string, type: 'success' | 'error' | 'warning' } | null;
  loading: { [key: string]: boolean };
  theme: Theme;
}

export interface AppContextType extends AppState {
  dispatch: (action: Partial<AppState> | ((prevState: AppState) => Partial<AppState>)) => void;
  changeTheme: (theme: Theme) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning', duration?: number) => void;
  addTicket: (ticketData: Omit<Ticket, 'id' | 'code' | 'advisor' | 'status' | 'emailStatus' | 'subticketIds' | 'pauseHistory' | 'executionHistory'>) => void;
  updateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  closeTicket: (ticketId: string) => Promise<boolean>;
  deleteTicket: (ticketId: string) => void;
  reopenTicket: (ticketId: string) => void;
  restoreTicket: (ticketId: string) => void;
  addSubticket: (subticketData: Omit<Subticket, 'id' | 'code' | 'creator' | 'status'>) => void;
  updateSubticket: (subticketId: string, updates: Partial<Subticket>) => void;
  closeSubticket: (subticketId: string, closingData: Pick<Subticket, 'eventEndDate' | 'rootCause' | 'badPraxis' | 'solution' | 'statusPostSLA' | 'comment' | 'eventResponsible'>) => Promise<boolean>;
  reopenSubticket: (subticketId: string) => void;
  logAction: (ticketCode: string, action: string) => void;
  addUser: (userData: Omit<User, 'id'>) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

export interface RequestCreateTicket {
  managerId: string;
  type: string;
  report: string;
  diagnosis: string;
  createAtEvent: string;
  unavailability: boolean;
  nodeAffected: string;
  oltAffected: string;
}

export interface RequestCreateSubticket {
    createManagerId: string;
    ticketId: number;
    dateReportPext: string;
    card: number;
    port: number;
    cto: string;
    commentary: string;
    serverDown?: RequestCreateServerDown[];
}

export interface RequestCreateServerDown {
    subticketId: number;
    clienteId: number;
}
