import { Ticket, Subticket, ActionLog, User, TicketStatus, TicketType } from '../types';

// Payloads for creating new records
export type CreateTicketPayload = Omit<Ticket, 'id' | 'code' | 'advisor' | 'status' | 'emailStatus' | 'subticketIds' | 'pauseHistory' | 'executionHistory' | 'closingDate'>;
export type CreateSubticketPayload = Omit<Subticket, 'id' | 'code' | 'creator' | 'status' | 'closingAdvisor' | 'eventEndDate' | 'rootCause' | 'badPraxis' | 'solution' | 'statusPostSLA' | 'comment' | 'eventResponsible'>;
export type CreateActionLogPayload = Omit<ActionLog, 'id' | 'timestamp'>;

// Payloads for updating records
export type UpdateTicketPayload = Partial<Omit<Ticket, 'id' | 'subticketIds'>>;
export type UpdateSubticketPayload = Partial<Omit<Subticket, 'id' | 'ticketId' | 'code'>>;
export type CloseSubticketPayload = Pick<Subticket, 'eventEndDate' | 'rootCause' | 'badPraxis' | 'solution' | 'statusPostSLA' | 'comment' | 'eventResponsible'>;

// Generic API response for success/failure on actions that don't return full objects
export interface ApiResponse {
  success: boolean;
  message?: string;
}


export interface UpdateSubticketRequest {
  ticketId: number;
  subticketId: number;
  updateManagerId: string;
  createEventAt: string;       // ISO 8601 datetime format
  dateReportPext: string;      // ISO 8601 datetime format
  card: number;
  port: number;
  cto: string;
  commentary: string;
  city: string;
  countClient: number
}


export type RequestCreateTicket = {
  managerId: String,
  type: TicketType,
  report: string,
  diagnosis: string,
  createAtEvent: Date,
  unavailability: boolean,
  nodeaffected: string,
  oltaffected: string,
}

export interface RequestUpdateTicket extends RequestCreateTicket {
  codeTicket: String
}


export type ResponseCreateTicket = {
  ticketId: number,
  codeTicket: string,
  createManagerId: number,
  type: string,
  report: string
  diagnosis: string,
  createAtEvent: Date,
  unavailability: boolean,
  nodeAffected: string,
  oltAffected: string,
  comment: string,
  status: string
}


export type RequestCreateSubticket = {
  createManagerId: number,
  ticketId: number,
  dateReportPext: Date,
  card: number,
  port: number
  serverDown: RequestCreateServerDown[]
}


export type RequestCreateServerDown = {
  subticketId: number,
  clienteId: number
}

export type RequestCloseTicket = {
  ticketId: number;
  managerId: string;
};

export type ResponseCloseTicket = {
  ticketId: number;
  managerId: string;
  ticketStatus: string;
};

export type CloseTicketResult = {
  ok: boolean;
  response?: ResponseCloseTicket;
  message?: string;
};
export type RequestCloseSubticket = {
  ticketId: number,
  subticketId: number,
  managerId: string,
  eventStartDate: string,
  reportedToPextDate: string,
  eventEndDate: string,
  causeRoot: string;
  solution: string;
  eventResponsible: string;
  badPraxis: boolean | null;
  statusPostSLA: string | null;
  comment: string | null;
}

export interface ResponseCloseSubticket {
  data: {
    message: string;
    subticketId: number;
    closedBy: string;  // UUID
    status: string
  };
}


export interface ResponseTicketStatus {
  data: {
    message: string;
    subticketId: number;
    closedBy: string;  // UUID
    status: string
  };
}