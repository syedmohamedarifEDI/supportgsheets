export interface User {
  username: string;
  loggedIn: boolean;
}

export interface Project {
  _id: string;
  projectName: string;
  createdAt: string;
}

export interface Technician {
  _id: string;
  name: string;
  email: string;
}

export type BusinessCriticality = 'P1' | 'P2' | 'P3' | 'P4';
export type TicketStatus = 'Open' | 'In Progress' | 'On Hold' | 'Resolved' | 'Closed';

export interface StatusHistory {
  status: string;
  changedAt: string;
  changedBy: string;
}

export interface Ticket {
  _id: string;
  projectId: Project | string;
  serialNumber: number;
  incidentStartTime: string;
  incidentEndTime: string;
  issue: string;
  assignedTo: Technician | string;
  systemsImpacted: string;
  businessCriticality: BusinessCriticality;
  rca: string;
  interfaceName: string;
  executionId: string;
  fixesDetails: string;
  status: TicketStatus;
  statusHistory: StatusHistory[];
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  createdAt: string;
}

export interface TicketListResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface DashboardSummary {
  total: number;
  open: number;
  inProgress: number;
  onHold: number;
  resolved: number;
  closed: number;
  recentTickets: Ticket[];
}
