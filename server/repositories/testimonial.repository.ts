import { getDatabase, pingDatabase } from '../config/database';
import { testimonials, Testimonial, NewTestimonial } from '../../db/schema/index';
import { eq, desc, asc, ilike, or, and, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export interface TestimonialFilterOptions {
  search?: string;
  status?: 'all' | 'published' | 'draft';
  hasVideo?: boolean;
  sortBy?: 'displayOrder' | 'createdAt' | 'clientName';
  sortOrder?: 'asc' | 'desc';
}

export interface TestimonialStats {
  total: number;
  published: number;
  draft: number;
  withVideo: number;
}

export interface CreateTestimonialInput {
  clientName: string;
  company?: string | null;
  designation?: string | null;
  quote: string;
  rating?: number;
  avatarUrl?: string | null;
  videoUrl?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateTestimonialInput {
  clientName?: string;
  company?: string | null;
  designation?: string | null;
  quote?: string;
  rating?: number;
  avatarUrl?: string | null;
  videoUrl?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    clientName: 'Rahul Sharma',
    company: 'Apex Innovations Pvt Ltd',
    designation: 'Director',
    quote: 'LEGOMARK INDIA handled our private limited incorporation and GST registration with zero friction. Truly dependable corporate legal counsel.',
    rating: 5,
    avatarUrl: null,
    videoUrl: null,
    isActive: true,
    displayOrder: 1,
    createdAt: new Date('2026-01-15T10:00:00.000Z'),
    updatedAt: new Date('2026-01-15T10:00:00.000Z'),
    updatedBy: 'System Seed',
  },
  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    clientName: 'Dr. Priya Nair',
    company: 'Aarogya Health Foundation',
    designation: 'Managing Trustee',
    quote: 'Prompt Section 8 NGO licensing and FCRA guidance. The direct founder involvement gave us absolute clarity on statutory compliance.',
    rating: 5,
    avatarUrl: null,
    videoUrl: null,
    isActive: true,
    displayOrder: 2,
    createdAt: new Date('2026-02-20T11:30:00.000Z'),
    updatedAt: new Date('2026-02-20T11:30:00.000Z'),
    updatedBy: 'System Seed',
  },
];

class TestimonialRepository {
  private fallbackStore: Testimonial[] = [...INITIAL_TESTIMONIALS];

  /**
   * Public Read: Get only active/published testimonials ordered by displayOrder asc
   */
  async getPublicTestimonials(): Promise<Testimonial[]> {
    const dbStatus = await pingDatabase();
    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .select()
          .from(testimonials)
          .where(eq(testimonials.isActive, true))
          .orderBy(asc(testimonials.displayOrder), asc(testimonials.createdAt));

        if (rows && rows.length > 0) {
          return rows;
        }
      } catch (err) {
        logger.error('Error fetching public testimonials from DB', 'TestimonialRepo', err);
      }
    }

    return this.fallbackStore
      .filter((t) => t.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /**
   * Admin Read: Get all testimonials with optional search, status filtering, and sorting
   */
  async getAdminTestimonials(options: TestimonialFilterOptions = {}): Promise<{
    testimonials: Testimonial[];
    total: number;
    stats: TestimonialStats;
  }> {
    const dbStatus = await pingDatabase();
    let allRecords: Testimonial[] = [];

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .select()
          .from(testimonials)
          .orderBy(asc(testimonials.displayOrder), desc(testimonials.createdAt));

        if (rows && rows.length > 0) {
          allRecords = rows;
        } else {
          allRecords = [...this.fallbackStore];
        }
      } catch (err) {
        logger.error('Error fetching admin testimonials from DB', 'TestimonialRepo', err);
        allRecords = [...this.fallbackStore];
      }
    } else {
      allRecords = [...this.fallbackStore];
    }

    // Calculate real stats from allRecords
    const stats: TestimonialStats = {
      total: allRecords.length,
      published: allRecords.filter((t) => t.isActive).length,
      draft: allRecords.filter((t) => !t.isActive).length,
      withVideo: allRecords.filter((t) => Boolean(t.videoUrl && t.videoUrl.trim() !== '')).length,
    };

    // Filter by search query
    let filtered = [...allRecords];
    if (options.search && options.search.trim() !== '') {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.clientName.toLowerCase().includes(q) ||
          (t.company && t.company.toLowerCase().includes(q)) ||
          (t.designation && t.designation.toLowerCase().includes(q)) ||
          t.quote.toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (options.status === 'published') {
      filtered = filtered.filter((t) => t.isActive);
    } else if (options.status === 'draft') {
      filtered = filtered.filter((t) => !t.isActive);
    }

    // Filter by video existence
    if (options.hasVideo === true) {
      filtered = filtered.filter((t) => Boolean(t.videoUrl && t.videoUrl.trim() !== ''));
    }

    // Sort
    const sortBy = options.sortBy || 'displayOrder';
    const sortOrder = options.sortOrder || 'asc';
    filtered.sort((a, b) => {
      if (sortBy === 'displayOrder') {
        const diff = a.displayOrder - b.displayOrder;
        return sortOrder === 'asc' ? diff : -diff;
      }
      if (sortBy === 'clientName') {
        const comp = a.clientName.localeCompare(b.clientName);
        return sortOrder === 'asc' ? comp : -comp;
      }
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return {
      testimonials: filtered,
      total: filtered.length,
      stats,
    };
  }

  /**
   * Get single testimonial by ID
   */
  async getById(id: string): Promise<Testimonial | null> {
    const dbStatus = await pingDatabase();
    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .select()
          .from(testimonials)
          .where(eq(testimonials.id, id))
          .limit(1);

        if (rows && rows.length > 0) return rows[0];
      } catch (err) {
        logger.error('Error fetching testimonial by ID from DB', 'TestimonialRepo', err);
      }
    }

    return this.fallbackStore.find((t) => t.id === id) || null;
  }

  /**
   * Create new client review/testimonial
   */
  async create(input: CreateTestimonialInput, author = 'Admin'): Promise<Testimonial> {
    const dbStatus = await pingDatabase();
    const newId = crypto.randomUUID();
    const now = new Date();

    // Determine default displayOrder
    const displayOrder =
      typeof input.displayOrder === 'number'
        ? input.displayOrder
        : this.fallbackStore.length + 1;

    const newRecord: Testimonial = {
      id: newId,
      clientName: input.clientName.trim(),
      company: input.company?.trim() || null,
      designation: input.designation?.trim() || null,
      quote: input.quote.trim(),
      rating: typeof input.rating === 'number' ? input.rating : 5,
      avatarUrl: input.avatarUrl?.trim() || null,
      videoUrl: input.videoUrl?.trim() || null,
      isActive: input.isActive ?? true,
      displayOrder,
      createdAt: now,
      updatedAt: now,
      updatedBy: author,
    };

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const inserted = await db.insert(testimonials).values(newRecord).returning();
        if (inserted && inserted.length > 0) {
          this.fallbackStore.unshift(inserted[0]);
          return inserted[0];
        }
      } catch (err) {
        logger.error('Error inserting testimonial into DB', 'TestimonialRepo', err);
      }
    }

    this.fallbackStore.unshift(newRecord);
    return newRecord;
  }

  /**
   * Update existing testimonial
   */
  async update(id: string, input: UpdateTestimonialInput, author = 'Admin'): Promise<Testimonial | null> {
    const dbStatus = await pingDatabase();
    const now = new Date();

    const patch: Partial<Testimonial> = {
      updatedAt: now,
      updatedBy: author,
    };

    if (input.clientName !== undefined) patch.clientName = input.clientName.trim();
    if (input.company !== undefined) patch.company = input.company?.trim() || null;
    if (input.designation !== undefined) patch.designation = input.designation?.trim() || null;
    if (input.quote !== undefined) patch.quote = input.quote.trim();
    if (input.rating !== undefined) patch.rating = input.rating;
    if (input.avatarUrl !== undefined) patch.avatarUrl = input.avatarUrl?.trim() || null;
    if (input.videoUrl !== undefined) patch.videoUrl = input.videoUrl?.trim() || null;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    if (input.displayOrder !== undefined) patch.displayOrder = input.displayOrder;

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const updated = await db
          .update(testimonials)
          .set(patch)
          .where(eq(testimonials.id, id))
          .returning();

        if (updated && updated.length > 0) {
          const idx = this.fallbackStore.findIndex((t) => t.id === id);
          if (idx >= 0) this.fallbackStore[idx] = updated[0];
          return updated[0];
        }
      } catch (err) {
        logger.error('Error updating testimonial in DB', 'TestimonialRepo', err);
      }
    }

    const idx = this.fallbackStore.findIndex((t) => t.id === id);
    if (idx >= 0) {
      this.fallbackStore[idx] = {
        ...this.fallbackStore[idx],
        ...patch,
      };
      return this.fallbackStore[idx];
    }

    return null;
  }

  /**
   * Reorder display orders
   */
  async updateDisplayOrders(
    orderItems: { id: string; displayOrder: number }[],
    author = 'Admin'
  ): Promise<boolean> {
    const dbStatus = await pingDatabase();

    // Update in-memory fallback
    for (const item of orderItems) {
      const found = this.fallbackStore.find((t) => t.id === item.id);
      if (found) {
        found.displayOrder = item.displayOrder;
        found.updatedAt = new Date();
        found.updatedBy = author;
      }
    }

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        for (const item of orderItems) {
          await db
            .update(testimonials)
            .set({
              displayOrder: item.displayOrder,
              updatedAt: new Date(),
              updatedBy: author,
            })
            .where(eq(testimonials.id, item.id));
        }
      } catch (err) {
        logger.error('Error updating testimonial display orders in DB', 'TestimonialRepo', err);
      }
    }

    return true;
  }

  /**
   * Delete testimonial
   */
  async delete(id: string): Promise<boolean> {
    const dbStatus = await pingDatabase();
    this.fallbackStore = this.fallbackStore.filter((t) => t.id !== id);

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        await db.delete(testimonials).where(eq(testimonials.id, id));
        return true;
      } catch (err) {
        logger.error('Error deleting testimonial from DB', 'TestimonialRepo', err);
      }
    }

    return true;
  }
}

export const testimonialRepository = new TestimonialRepository();
