export type LeadStatus = 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'CONVERTED' | 'CLOSED';

export interface LeadItem {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  city: string | null;
  serviceInterested: string;
  serviceId: string | null;
  message: string | null;
  source: string;
  status: LeadStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  inProgress: number;
  converted: number;
  closed: number;
}

export interface LeadFilters {
  search?: string;
  status?: string;
  service?: string;
  dateRange?: 'all' | 'today' | '7d' | '30d';
  sortBy?: 'createdAt' | 'fullName' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PublicConsultationPayload {
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  selectedService?: string;
  serviceInterested?: string;
  serviceId?: string;
  notes?: string;
  message?: string;
  source?: string;
}
