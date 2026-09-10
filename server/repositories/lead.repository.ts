import { getDatabase, pingDatabase } from '../config/database';
import { leads, Lead, NewLead } from '../../db/schema/index';
import { eq, desc, asc, ilike, or, and, gte, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'CONVERTED' | 'CLOSED';

export interface CreateLeadInput {
  fullName: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  serviceInterested: string;
  serviceId?: string | null;
  message?: string | null;
  source?: string;
}

export interface LeadFilterOptions {
  search?: string;
  status?: string;
  service?: string;
  dateRange?: 'all' | 'today' | '7d' | '30d';
  sortBy?: 'createdAt' | 'fullName' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  inProgress: number;
  converted: number;
  closed: number;
}

export interface LeadRecord extends Lead {
  formattedDate?: string;
}

/**
 * Lead Repository
 * Manages persistent storage and retrieval for client consultation requests and inbound leads.
 * Connects to PostgreSQL via Drizzle ORM with in-memory fallback for container/sandbox resiliency.
 */
class LeadRepository {
  // In-memory fallback cache
  private memoryLeads: Lead[] = [];

  /**
   * Create a new inbound lead / consultation enquiry
   */
  async createLead(data: CreateLeadInput): Promise<Lead> {
    const isConnected = await pingDatabase();

    const newLeadRecord: Lead = {
      id: crypto.randomUUID(),
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || null,
      city: data.city?.trim() || null,
      serviceInterested: data.serviceInterested.trim(),
      serviceId: data.serviceId || null,
      message: data.message?.trim() || null,
      source: data.source || 'Website Consultation Modal',
      status: 'NEW',
      adminNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: null,
    };

    if (isConnected) {
      try {
        const db = getDatabase();
        const [inserted] = await db
          .insert(leads)
          .values({
            id: newLeadRecord.id,
            fullName: newLeadRecord.fullName,
            phone: newLeadRecord.phone,
            email: newLeadRecord.email,
            city: newLeadRecord.city,
            serviceInterested: newLeadRecord.serviceInterested,
            serviceId: newLeadRecord.serviceId,
            message: newLeadRecord.message,
            source: newLeadRecord.source,
            status: newLeadRecord.status,
            adminNotes: newLeadRecord.adminNotes,
            createdAt: newLeadRecord.createdAt,
            updatedAt: newLeadRecord.updatedAt,
            updatedBy: newLeadRecord.updatedBy,
          })
          .returning();

        // Also add to memory cache for fast sync
        this.memoryLeads.unshift(inserted || newLeadRecord);
        return inserted || newLeadRecord;
      } catch (err) {
        logger.error('Error inserting lead to database, falling back to memory store', 'LeadRepo', err);
      }
    }

    this.memoryLeads.unshift(newLeadRecord);
    return newLeadRecord;
  }

  /**
   * Get filtered and paginated leads for administrative dashboard
   */
  async getLeads(options: LeadFilterOptions = {}): Promise<{ leads: Lead[]; total: number; stats: LeadStats }> {
    const isConnected = await pingDatabase();
    let allLeads: Lead[] = [];

    if (isConnected) {
      try {
        const db = getDatabase();
        const dbLeads = await db.select().from(leads).orderBy(desc(leads.createdAt));
        allLeads = dbLeads;
      } catch (err) {
        logger.error('Error fetching leads from database, falling back to memory store', 'LeadRepo', err);
        allLeads = [...this.memoryLeads];
      }
    } else {
      allLeads = [...this.memoryLeads];
    }

    // Compute aggregate statistics across ALL leads in the database
    const stats: LeadStats = {
      total: allLeads.length,
      new: allLeads.filter((l) => l.status === 'NEW').length,
      contacted: allLeads.filter((l) => l.status === 'CONTACTED').length,
      inProgress: allLeads.filter((l) => l.status === 'IN_PROGRESS').length,
      converted: allLeads.filter((l) => l.status === 'CONVERTED').length,
      closed: allLeads.filter((l) => l.status === 'CLOSED').length,
    };

    // Apply Filters
    let filtered = [...allLeads];

    // 1. Status Filter
    if (options.status && options.status !== 'all') {
      const targetStatus = options.status.toUpperCase();
      filtered = filtered.filter((l) => l.status.toUpperCase() === targetStatus);
    }

    // 2. Service Filter
    if (options.service && options.service !== 'all') {
      const targetService = options.service.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.serviceInterested.toLowerCase().includes(targetService) ||
          (l.serviceId && l.serviceId.toLowerCase() === targetService)
      );
    }

    // 3. Search Filter (Name, Email, Phone, Service, Message)
    if (options.search && options.search.trim() !== '') {
      const term = options.search.toLowerCase().trim();
      filtered = filtered.filter(
        (l) =>
          l.fullName.toLowerCase().includes(term) ||
          (l.email && l.email.toLowerCase().includes(term)) ||
          l.phone.toLowerCase().includes(term) ||
          l.serviceInterested.toLowerCase().includes(term) ||
          (l.city && l.city.toLowerCase().includes(term)) ||
          (l.message && l.message.toLowerCase().includes(term))
      );
    }

    // 4. Date Range Filter
    if (options.dateRange && options.dateRange !== 'all') {
      const now = new Date();
      let threshold = new Date(0);

      if (options.dateRange === 'today') {
        threshold = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (options.dateRange === '7d') {
        threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (options.dateRange === '30d') {
        threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      filtered = filtered.filter((l) => new Date(l.createdAt) >= threshold);
    }

    // Sort order
    const sortOrder = options.sortOrder || 'desc';
    const sortBy = options.sortBy || 'createdAt';

    filtered.sort((a, b) => {
      if (sortBy === 'createdAt') {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      if (sortBy === 'fullName') {
        return sortOrder === 'asc'
          ? a.fullName.localeCompare(b.fullName)
          : b.fullName.localeCompare(a.fullName);
      }
      if (sortBy === 'status') {
        return sortOrder === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
      return 0;
    });

    const total = filtered.length;

    // Pagination
    if (options.page && options.limit) {
      const page = Math.max(1, options.page);
      const limit = Math.max(1, options.limit);
      const startIndex = (page - 1) * limit;
      filtered = filtered.slice(startIndex, startIndex + limit);
    }

    return {
      leads: filtered,
      total,
      stats,
    };
  }

  /**
   * Get single lead by ID
   */
  async getLeadById(id: string): Promise<Lead | null> {
    const isConnected = await pingDatabase();

    if (isConnected) {
      try {
        const db = getDatabase();
        const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
        if (rows.length > 0) {
          return rows[0];
        }
      } catch (err) {
        logger.error('Error fetching lead by ID from database', 'LeadRepo', err);
      }
    }

    const found = this.memoryLeads.find((l) => l.id === id);
    return found || null;
  }

  /**
   * Find an existing lead by ID, phone, or email to prevent duplicate lead creation.
   * Matches by ID first, then by matching normalized 10-digit phone, then by email.
   */
  async findExistingLead(params: { id?: string; phone?: string; email?: string }): Promise<Lead | null> {
    const isConnected = await pingDatabase();
    const cleanId = params.id?.trim();
    const cleanPhone = (params.phone || '').replace(/[^0-9]/g, '');
    const cleanEmail = (params.email || '').toLowerCase().trim();

    if (cleanId) {
      const byId = await this.getLeadById(cleanId);
      if (byId) return byId;
    }

    if (!cleanPhone && !cleanEmail) {
      return null;
    }

    const matchesContact = (l: Lead): boolean => {
      const lPhone = (l.phone || '').replace(/[^0-9]/g, '');
      const lEmail = (l.email || '').toLowerCase().trim();

      if (cleanPhone && lPhone) {
        if (cleanPhone === lPhone) return true;
        if (cleanPhone.length >= 10 && lPhone.length >= 10 && cleanPhone.slice(-10) === lPhone.slice(-10)) {
          return true;
        }
      }

      if (cleanEmail && lEmail && cleanEmail === lEmail) {
        return true;
      }

      return false;
    };

    if (isConnected) {
      try {
        const db = getDatabase();
        const allDb = await db.select().from(leads).orderBy(desc(leads.createdAt));
        const matched = allDb.find(matchesContact);
        if (matched) return matched;
      } catch (err) {
        logger.error('Error finding existing lead in database', 'LeadRepo', err);
      }
    }

    const memMatched = this.memoryLeads.find(matchesContact);
    return memMatched || null;
  }

  /**
   * Record direct package purchase intent on an existing lead
   */
  async recordPurchaseIntentOnLead(
    id: string,
    details: {
      serviceInterested: string;
      additionalMessage?: string;
      city?: string;
    }
  ): Promise<Lead | null> {
    const isConnected = await pingDatabase();
    const now = new Date();

    const existingLead = await this.getLeadById(id);
    if (!existingLead) return null;

    let updatedMessage = existingLead.message;
    if (details.additionalMessage) {
      updatedMessage = existingLead.message
        ? `${existingLead.message}\n\n${details.additionalMessage}`
        : details.additionalMessage;
    }

    const newCity = details.city || existingLead.city;

    if (isConnected) {
      try {
        const db = getDatabase();
        const [updated] = await db
          .update(leads)
          .set({
            serviceInterested: details.serviceInterested,
            message: updatedMessage,
            city: newCity,
            updatedAt: now,
          })
          .where(eq(leads.id, id))
          .returning();

        if (updated) {
          const idx = this.memoryLeads.findIndex((l) => l.id === id);
          if (idx !== -1) {
            this.memoryLeads[idx] = updated;
          } else {
            this.memoryLeads.unshift(updated);
          }
          return updated;
        }
      } catch (err) {
        logger.error('Error updating lead with purchase intent in database', 'LeadRepo', err);
      }
    }

    const memLead = this.memoryLeads.find((l) => l.id === id);
    if (memLead) {
      memLead.serviceInterested = details.serviceInterested;
      memLead.message = updatedMessage;
      memLead.city = newCity;
      memLead.updatedAt = now;
      return memLead;
    }

    const fallbackRecord: Lead = {
      ...existingLead,
      serviceInterested: details.serviceInterested,
      message: updatedMessage,
      city: newCity,
      updatedAt: now,
    };
    this.memoryLeads.unshift(fallbackRecord);
    return fallbackRecord;
  }

  /**
   * Record verified payment on an existing lead
   */
  async recordPaymentOnLead(
    id: string,
    paymentDetails: {
      serviceInterested?: string;
      source?: string;
      additionalMessage?: string;
      status?: LeadStatus;
      updatedBy?: string;
    }
  ): Promise<Lead | null> {
    const isConnected = await pingDatabase();
    const now = new Date();

    const existingLead = await this.getLeadById(id);
    if (!existingLead) return null;

    const newServiceInterested = paymentDetails.serviceInterested || existingLead.serviceInterested;
    const newSource = paymentDetails.source || existingLead.source;
    const newStatus = paymentDetails.status || existingLead.status;

    let updatedMessage = existingLead.message;
    if (paymentDetails.additionalMessage) {
      updatedMessage = existingLead.message
        ? `${existingLead.message}\n\n${paymentDetails.additionalMessage}`
        : paymentDetails.additionalMessage;
    }

    if (isConnected) {
      try {
        const db = getDatabase();
        const [updated] = await db
          .update(leads)
          .set({
            serviceInterested: newServiceInterested,
            source: newSource,
            status: newStatus,
            message: updatedMessage,
            updatedAt: now,
            updatedBy: paymentDetails.updatedBy || 'Payment Gateway',
          })
          .where(eq(leads.id, id))
          .returning();

        if (updated) {
          const idx = this.memoryLeads.findIndex((l) => l.id === id);
          if (idx !== -1) {
            this.memoryLeads[idx] = updated;
          } else {
            this.memoryLeads.unshift(updated);
          }
          return updated;
        }
      } catch (err) {
        logger.error('Error updating lead with payment details in database', 'LeadRepo', err);
      }
    }

    const memLead = this.memoryLeads.find((l) => l.id === id);
    if (memLead) {
      memLead.serviceInterested = newServiceInterested;
      memLead.source = newSource;
      memLead.status = newStatus;
      memLead.message = updatedMessage;
      memLead.updatedAt = now;
      memLead.updatedBy = paymentDetails.updatedBy || 'Payment Gateway';
      return memLead;
    }

    const fallbackPaymentRecord: Lead = {
      ...existingLead,
      serviceInterested: newServiceInterested,
      source: newSource,
      status: newStatus,
      message: updatedMessage,
      updatedAt: now,
      updatedBy: paymentDetails.updatedBy || 'Payment Gateway',
    };
    this.memoryLeads.unshift(fallbackPaymentRecord);
    return fallbackPaymentRecord;
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(id: string, status: LeadStatus, updatedBy?: string): Promise<Lead | null> {
    const isConnected = await pingDatabase();
    const now = new Date();

    if (isConnected) {
      try {
        const db = getDatabase();
        const [updated] = await db
          .update(leads)
          .set({
            status,
            updatedAt: now,
            updatedBy: updatedBy || 'Admin',
          })
          .where(eq(leads.id, id))
          .returning();

        if (updated) {
          // Update in-memory cache
          const idx = this.memoryLeads.findIndex((l) => l.id === id);
          if (idx !== -1) {
            this.memoryLeads[idx] = updated;
          }
          return updated;
        }
      } catch (err) {
        logger.error('Error updating lead status in database', 'LeadRepo', err);
      }
    }

    const memLead = this.memoryLeads.find((l) => l.id === id);
    if (!memLead) return null;

    memLead.status = status;
    memLead.updatedAt = now;
    memLead.updatedBy = updatedBy || 'Admin';
    return memLead;
  }

  /**
   * Update internal admin notes
   */
  async updateLeadNotes(id: string, adminNotes: string, updatedBy?: string): Promise<Lead | null> {
    const isConnected = await pingDatabase();
    const now = new Date();

    if (isConnected) {
      try {
        const db = getDatabase();
        const [updated] = await db
          .update(leads)
          .set({
            adminNotes,
            updatedAt: now,
            updatedBy: updatedBy || 'Admin',
          })
          .where(eq(leads.id, id))
          .returning();

        if (updated) {
          const idx = this.memoryLeads.findIndex((l) => l.id === id);
          if (idx !== -1) {
            this.memoryLeads[idx] = updated;
          }
          return updated;
        }
      } catch (err) {
        logger.error('Error updating lead notes in database', 'LeadRepo', err);
      }
    }

    const memLead = this.memoryLeads.find((l) => l.id === id);
    if (!memLead) return null;

    memLead.adminNotes = adminNotes;
    memLead.updatedAt = now;
    memLead.updatedBy = updatedBy || 'Admin';
    return memLead;
  }

  /**
   * Delete lead by ID
   */
  async deleteLead(id: string): Promise<boolean> {
    const isConnected = await pingDatabase();

    if (isConnected) {
      try {
        const db = getDatabase();
        await db.delete(leads).where(eq(leads.id, id));
        this.memoryLeads = this.memoryLeads.filter((l) => l.id !== id);
        return true;
      } catch (err) {
        logger.error('Error deleting lead from database', 'LeadRepo', err);
      }
    }

    const initialLen = this.memoryLeads.length;
    this.memoryLeads = this.memoryLeads.filter((l) => l.id !== id);
    return this.memoryLeads.length < initialLen;
  }

  /**
   * Get real lead stats
   */
  async getLeadStats(): Promise<LeadStats> {
    const { stats } = await this.getLeads();
    return stats;
  }
}

export const leadRepository = new LeadRepository();
