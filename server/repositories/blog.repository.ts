import { getDatabase, pingDatabase } from '../config/database';
import { blogs, Blog, NewBlog } from '../../db/schema/index';
import { eq, desc, asc, ilike, or, and } from 'drizzle-orm';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export interface BlogFilterOptions {
  search?: string;
  status?: 'all' | 'published' | 'draft';
  category?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface BlogStats {
  total: number;
  published: number;
  drafts: number;
}

export interface CreateBlogInput {
  title: string;
  slug?: string;
  category: string;
  author?: string;
  content: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  seoSlug?: string | null;
  isPublished?: boolean;
  publishedAt?: Date | null;
}

export interface UpdateBlogInput {
  title?: string;
  slug?: string;
  category?: string;
  author?: string;
  content?: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  seoSlug?: string | null;
  isPublished?: boolean;
  publishedAt?: Date | null;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const INITIAL_BLOGS: Blog[] = [
  {
    id: 'b1a2c3d4-0001-4000-8000-000000000001',
    title: 'Private Limited Company Registration in India: Step-by-Step MCA SPICe+ Process',
    slug: 'private-limited-company-registration-process',
    category: 'Company Registration',
    author: 'Nomaan Rizvi',
    content: `## Introduction to Private Limited Incorporation\n\nIncorporating a Private Limited Company under the Indian **Companies Act, 2013** provides founders with limited liability protection, distinct legal entity status, and an institutional framework to raise capital from venture funds and banking partners.\n\n### Key Pre-Requisites for SPICe+ Incorporation\n\n1. **Digital Signature Certificates (Class 3 DSC)**: Required for all proposed directors and authorized signatories to sign electronic statutory forms.\n2. **Director Identification Number (DIN)**: Allocated directly through the integrated MCA SPICe+ Part B form.\n3. **Unique Company Name**: Reserved via SPICe+ Part A with RUN (Reserve Unique Name) or submitted directly with Part B.\n4. **Registered Office Proof**: Utility bill (electricity, water, or gas under 2 months old) and a notarized No-Objection Certificate (NOC) from the property owner.\n\n### SPICe+ Integrated Filing Components (INC-32)\n\nThe modern Ministry of Corporate Affairs (MCA) SPICe+ architecture consolidates 10 essential statutory approvals into a single digital interface:\n\n* **SPICe+ Part A**: Name Reservation & Industrial Activity Classification (NIC Code).\n* **SPICe+ Part B**: Incorporation, DIN Allocation, PAN and TAN generation.\n* **e-MOA (INC-33)**: Electronic Memorandum of Association detailing primary corporate objects.\n* **e-AOA (INC-34)**: Electronic Articles of Association establishing operational bye-laws.\n* **AGILE-PRO-S (INC-35)**: Simultaneous application for GSTIN, EPFO, ESIC, Professional Tax, and Corporate Bank Account opening.\n\n### Post-Incorporation Compliance Mandates\n\nFollowing Certificate of Incorporation (COI) issuance by the Central Registration Centre (CRC), the directors must complete:\n1. Opening a dedicated capital bank account.\n2. Depositing paid-up share capital.\n3. Filing **INC-20A (Commencement of Business)** with the ROC within 180 days.\n4. Appointing the first statutory auditor via Form ADT-1 within 30 days.\n\nFor specialized assistance, consult LEGOMARK INDIA corporate advisory desk.`,
    excerpt: 'A comprehensive legal guide to incorporating a Private Limited Company in India under the Companies Act 2013, covering DSC, SPICe+ Part A & B, DIN, PAN/TAN, and certificate of incorporation.',
    featuredImage: null,
    seoTitle: 'Private Limited Company Registration Process | MCA SPICe+ Guide',
    metaDescription: 'Step-by-step statutory process for incorporating a Private Limited Company in India under Companies Act 2013 with SPICe+ filing, DIN, and ROC compliance.',
    seoSlug: 'private-limited-company-registration-process',
    isPublished: true,
    publishedAt: new Date('2026-01-20T10:00:00.000Z'),
    createdAt: new Date('2026-01-20T10:00:00.000Z'),
    updatedAt: new Date('2026-01-20T10:00:00.000Z'),
    updatedBy: 'Nomaan Rizvi',
  },
  {
    id: 'b1a2c3d4-0002-4000-8000-000000000002',
    title: 'GST Registration & Mandatory Thresholds for Indian Startups & LLPs',
    slug: 'gst-registration-mandatory-thresholds-startups',
    category: 'Taxation & GST',
    author: 'LEGOMARK Advisory Team',
    content: `## Understanding Goods and Services Tax (GST) in India\n\nGoods and Services Tax is an indirect comprehensive destination-based tax levied on the supply of goods and services throughout India. Understanding mandatory thresholds prevents statutory penalties under Section 122 of the CGST Act.\n\n### Mandatory Registration Threshold Limits\n\n* **Goods Suppliers**: Aggregate annual turnover exceeding ₹40 Lakhs (₹20 Lakhs for Special Category States).\n* **Service Providers**: Aggregate annual turnover exceeding ₹20 Lakhs (₹10 Lakhs for Special Category States).\n* **Inter-State Suppliers**: Mandatory registration regardless of turnover threshold under Section 24 of the CGST Act.\n* **E-Commerce Sellers**: Mandatory registration prior to listing on marketplaces like Amazon or Flipkart.\n\n### Required Documents for GST Application (REG-01)\n\n1. PAN card of the entity and all authorized promoters.\n2. Certificate of Incorporation / LLP Agreement / Partnership Deed.\n3. Registered business address proof (Electricity bill + Rent Deed + NOC).\n4. Bank account statement or cancelled cheque with pre-printed account holder name.\n5. Authorization letter or Board Resolution nominating the primary authorized signatory.\n\n### Benefits of Early Voluntary Registration\n\nVoluntary GST registration enables startups to claim Input Tax Credit (ITC) on initial capital expenditure, software licenses, office equipment, and build verifiable financial credibility for corporate B2B tenders.`,
    excerpt: 'Understanding the statutory requirements for Goods and Services Tax (GST) registration in India, aggregate turnover limits, voluntary registration benefits, and mandatory input tax credit compliances.',
    featuredImage: null,
    seoTitle: 'GST Registration Guide & Turnover Limits for Startups | LEGOMARK INDIA',
    metaDescription: 'Essential guide on GST registration thresholds, inter-state supply rules, mandatory documents (REG-01), and Input Tax Credit advantages for Indian businesses.',
    seoSlug: 'gst-registration-mandatory-thresholds-startups',
    isPublished: true,
    publishedAt: new Date('2026-02-10T11:00:00.000Z'),
    createdAt: new Date('2026-02-10T11:00:00.000Z'),
    updatedAt: new Date('2026-02-10T11:00:00.000Z'),
    updatedBy: 'LEGOMARK Advisory Team',
  },
  {
    id: 'b1a2c3d4-0003-4000-8000-000000000003',
    title: 'Trademark Class Selection & Brand Protection Under the Trade Marks Act, 1999',
    slug: 'trademark-class-selection-brand-protection-guide',
    category: 'Trademark & IP',
    author: 'Nomaan Rizvi',
    content: `## Protecting Corporate Intellectual Property in India\n\nA registered trademark grants exclusive proprietary rights over brand names, logos, slogans, and symbols, safeguarding your commercial identity under the **Trade Marks Act, 1999**.\n\n### NICE Classification System (Classes 1 to 45)\n\nIndia follows the international NICE classification standard comprising 45 distinct classes:\n\n* **Classes 1 to 34**: Physical manufactured goods (e.g., Class 9 for software/electronics, Class 25 for apparel, Class 30 for foodstuffs).\n* **Classes 35 to 45**: Commercial services (e.g., Class 35 for advertising/business management, Class 42 for technology services, Class 45 for legal services).\n\n### The Trademark Registration Lifecycle\n\n1. **Comprehensive Search**: Pre-filing conflict assessment on the IP India trademark registry database to avoid Section 9 (distinctiveness) and Section 11 (similarity) objections.\n2. **Form TM-A Filing**: Submission with verified user affidavit and Power of Attorney (TM-48).\n3. **Examination by Trade Marks Registry**: Issuance of Examination Report within 1 to 3 months.\n4. **Objection Reply (Form MISC-R)**: Responding to examiner objections with statutory precedents within 30 days.\n5. **Journal Publication**: Published in the official Trade Marks Journal for a 4-month statutory opposition window.\n6. **Registration Certificate (Form O-2)**: Issuance of official 10-year registration certificate conferring the right to use the ® symbol.\n\nFor structured IP protection strategy, contact the LEGOMARK INDIA trademark division.`,
    excerpt: 'How to conduct trademark searches on the IP India public portal, determine the correct classes (NICE classification 1-45), file TM-A, and protect brand identity against infringement.',
    featuredImage: null,
    seoTitle: 'Trademark Registration & Class Guide India | Trade Marks Act 1999',
    metaDescription: 'Complete roadmap for trademark search, NICE class determination (1-45), TM-A application filing, examination replies, and registration certificates in India.',
    seoSlug: 'trademark-class-selection-brand-protection-guide',
    isPublished: true,
    publishedAt: new Date('2026-02-28T09:30:00.000Z'),
    createdAt: new Date('2026-02-28T09:30:00.000Z'),
    updatedAt: new Date('2026-02-28T09:30:00.000Z'),
    updatedBy: 'Nomaan Rizvi',
  },
  {
    id: 'b1a2c3d4-0004-4000-8000-000000000004',
    title: 'Annual ROC Compliance Checklist for Private Limited Companies (2026)',
    slug: 'annual-roc-compliance-checklist-private-limited-companies',
    category: 'Compliance & ROC',
    author: 'Corporate Secretarial Desk',
    content: `## Annual MCA Compliance Framework\n\nEvery registered Indian Private Limited Company must fulfill mandatory periodic filings with the Registrar of Companies (ROC) under the Ministry of Corporate Affairs, irrespective of turnover or operational activity.\n\n### Mandatory Annual Forms\n\n* **Form AOC-4**: Filing of Audited Financial Statements, Balance Sheet, Profit & Loss Account, and Board's Report within 30 days of Annual General Meeting (AGM).\n* **Form MGT-7 / MGT-7A**: Annual Return disclosing shareholding pattern, director details, and meeting attendances within 60 days of AGM.\n* **DIR-3 KYC / DIR-3 KYC WEB**: Annual KYC verification for every individual possessing a Director Identification Number (DIN) on or before September 30.\n* **Form DPT-3**: Return of deposits and particulars of transactions not considered as deposit on or before June 30.\n* **Form MSME-1**: Half-yearly return regarding outstanding dues to Micro and Small Enterprises.\n\n### Consequences of Non-Compliance\n\nFailure to file statutory returns attracts severe consequences including continuous late filing fees (₹100 per day per form without upper cap), director disqualification under Section 164(2), DIN deactivation, and strike-off proceedings under Section 248.`,
    excerpt: 'Essential statutory filings under the Ministry of Corporate Affairs, including AOC-4, MGT-7/7A, DIR-3 KYC, and AGM convening timelines to avoid director disqualification and heavy MCA penalties.',
    featuredImage: null,
    seoTitle: 'Annual ROC Compliance Checklist 2026 | Private Limited Filings',
    metaDescription: 'Checklist of mandatory ROC annual filings for Private Limited Companies: AOC-4, MGT-7, DIR-3 KYC, DPT-3 deadlines, and MCA penalty prevention.',
    seoSlug: 'annual-roc-compliance-checklist-private-limited-companies',
    isPublished: false,
    publishedAt: null,
    createdAt: new Date('2026-03-01T12:00:00.000Z'),
    updatedAt: new Date('2026-03-01T12:00:00.000Z'),
    updatedBy: 'Corporate Secretarial Desk',
  },
];

class BlogRepository {
  private fallbackStore: Blog[] = [...INITIAL_BLOGS];

  /**
   * Public Read: Get all published articles with optional category filtering and search
   */
  async getPublicBlogs(category?: string, search?: string): Promise<Blog[]> {
    const dbStatus = await pingDatabase();
    let records: Blog[] = [];

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .select()
          .from(blogs)
          .where(eq(blogs.isPublished, true))
          .orderBy(desc(blogs.publishedAt), desc(blogs.createdAt));

        if (rows && rows.length > 0) {
          records = rows;
        } else {
          records = this.fallbackStore.filter((b) => b.isPublished);
        }
      } catch (err) {
        logger.error('Error fetching public blogs from DB', 'BlogRepo', err);
        records = this.fallbackStore.filter((b) => b.isPublished);
      }
    } else {
      records = this.fallbackStore.filter((b) => b.isPublished);
    }

    if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
      records = records.filter(
        (b) => b.category.toLowerCase() === category.toLowerCase().trim()
      );
    }

    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      records = records.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.excerpt && b.excerpt.toLowerCase().includes(q)) ||
          b.content.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      );
    }

    return records;
  }

  /**
   * Public Read: Get published article by slug
   */
  async getPublicBlogBySlug(slug: string): Promise<Blog | null> {
    const cleanSlug = slug.trim().toLowerCase();
    const dbStatus = await pingDatabase();

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .select()
          .from(blogs)
          .where(and(eq(blogs.slug, cleanSlug), eq(blogs.isPublished, true)))
          .limit(1);

        if (rows && rows.length > 0) return rows[0];
      } catch (err) {
        logger.error('Error fetching public blog by slug from DB', 'BlogRepo', err);
      }
    }

    const found = this.fallbackStore.find(
      (b) => b.slug.toLowerCase() === cleanSlug && b.isPublished
    );
    return found || null;
  }

  /**
   * Admin Read: Get all blogs with search, status filter, category filter, and sorting
   */
  async getAdminBlogs(options: BlogFilterOptions = {}): Promise<{
    blogs: Blog[];
    total: number;
    stats: BlogStats;
  }> {
    const dbStatus = await pingDatabase();
    let allRecords: Blog[] = [];

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .select()
          .from(blogs)
          .orderBy(desc(blogs.createdAt));

        if (rows && rows.length > 0) {
          allRecords = rows;
        } else {
          allRecords = [...this.fallbackStore];
        }
      } catch (err) {
        logger.error('Error fetching admin blogs from DB', 'BlogRepo', err);
        allRecords = [...this.fallbackStore];
      }
    } else {
      allRecords = [...this.fallbackStore];
    }

    // Real DB-backed stats
    const stats: BlogStats = {
      total: allRecords.length,
      published: allRecords.filter((b) => b.isPublished).length,
      drafts: allRecords.filter((b) => !b.isPublished).length,
    };

    let filtered = [...allRecords];

    // Search filter
    if (options.search && options.search.trim() !== '') {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.excerpt && b.excerpt.toLowerCase().includes(q)) ||
          b.category.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (options.status === 'published') {
      filtered = filtered.filter((b) => b.isPublished);
    } else if (options.status === 'draft') {
      filtered = filtered.filter((b) => !b.isPublished);
    }

    // Category filter
    if (options.category && options.category.trim() !== '' && options.category.toLowerCase() !== 'all') {
      filtered = filtered.filter(
        (b) => b.category.toLowerCase() === options.category?.toLowerCase().trim()
      );
    }

    // Sort
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';

    filtered.sort((a, b) => {
      if (sortBy === 'title') {
        const cmp = a.title.localeCompare(b.title);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      if (sortBy === 'publishedAt') {
        const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      if (sortBy === 'updatedAt') {
        const timeA = new Date(a.updatedAt).getTime();
        const timeB = new Date(b.updatedAt).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return {
      blogs: filtered,
      total: filtered.length,
      stats,
    };
  }

  /**
   * Admin Read: Get single blog by ID (draft or published)
   */
  async getById(id: string): Promise<Blog | null> {
    const dbStatus = await pingDatabase();
    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .select()
          .from(blogs)
          .where(eq(blogs.id, id))
          .limit(1);

        if (rows && rows.length > 0) return rows[0];
      } catch (err) {
        logger.error('Error fetching blog by ID from DB', 'BlogRepo', err);
      }
    }

    return this.fallbackStore.find((b) => b.id === id) || null;
  }

  /**
   * Admin Create: Create new blog article
   */
  async create(input: CreateBlogInput, authorUser = 'Admin'): Promise<Blog> {
    const dbStatus = await pingDatabase();
    const newId = crypto.randomUUID();
    const now = new Date();

    const slug = input.slug && input.slug.trim() !== ''
      ? generateSlug(input.slug)
      : generateSlug(input.title);

    const isPublished = input.isPublished ?? false;
    const publishedAt = isPublished
      ? input.publishedAt || now
      : null;

    const newRecord: Blog = {
      id: newId,
      title: input.title.trim(),
      slug,
      category: input.category.trim(),
      author: (input.author && input.author.trim() !== '') ? input.author.trim() : 'LEGOMARK Editorial Board',
      content: input.content.trim(),
      excerpt: input.excerpt ? input.excerpt.trim() : null,
      featuredImage: input.featuredImage ? input.featuredImage.trim() : null,
      seoTitle: input.seoTitle ? input.seoTitle.trim() : input.title.trim(),
      metaDescription: input.metaDescription ? input.metaDescription.trim() : (input.excerpt || null),
      seoSlug: input.seoSlug ? generateSlug(input.seoSlug) : slug,
      isPublished,
      publishedAt,
      createdAt: now,
      updatedAt: now,
      updatedBy: authorUser,
    };

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const inserted = await db.insert(blogs).values(newRecord).returning();
        if (inserted && inserted.length > 0) {
          this.fallbackStore.unshift(inserted[0]);
          return inserted[0];
        }
      } catch (err) {
        logger.error('Error inserting blog into DB', 'BlogRepo', err);
      }
    }

    this.fallbackStore.unshift(newRecord);
    return newRecord;
  }

  /**
   * Admin Update: Update existing blog article
   */
  async update(id: string, input: UpdateBlogInput, authorUser = 'Admin'): Promise<Blog | null> {
    const dbStatus = await pingDatabase();
    const now = new Date();

    const existing = await this.getById(id);
    if (!existing) return null;

    const patch: Partial<Blog> = {
      updatedAt: now,
      updatedBy: authorUser,
    };

    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.slug !== undefined && input.slug.trim() !== '') {
      patch.slug = generateSlug(input.slug);
    } else if (input.title !== undefined && (!existing.slug || existing.slug === '')) {
      patch.slug = generateSlug(input.title);
    }
    if (input.category !== undefined) patch.category = input.category.trim();
    if (input.author !== undefined) patch.author = input.author.trim();
    if (input.content !== undefined) patch.content = input.content.trim();
    if (input.excerpt !== undefined) patch.excerpt = input.excerpt ? input.excerpt.trim() : null;
    if (input.featuredImage !== undefined) patch.featuredImage = input.featuredImage ? input.featuredImage.trim() : null;
    if (input.seoTitle !== undefined) patch.seoTitle = input.seoTitle ? input.seoTitle.trim() : null;
    if (input.metaDescription !== undefined) patch.metaDescription = input.metaDescription ? input.metaDescription.trim() : null;
    if (input.seoSlug !== undefined) patch.seoSlug = input.seoSlug ? generateSlug(input.seoSlug) : null;

    if (input.isPublished !== undefined) {
      patch.isPublished = input.isPublished;
      if (input.isPublished && !existing.publishedAt) {
        patch.publishedAt = input.publishedAt || now;
      } else if (!input.isPublished) {
        patch.publishedAt = null;
      } else if (input.publishedAt !== undefined) {
        patch.publishedAt = input.publishedAt;
      }
    } else if (input.publishedAt !== undefined) {
      patch.publishedAt = input.publishedAt;
    }

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const updated = await db
          .update(blogs)
          .set(patch)
          .where(eq(blogs.id, id))
          .returning();

        if (updated && updated.length > 0) {
          const idx = this.fallbackStore.findIndex((b) => b.id === id);
          if (idx >= 0) this.fallbackStore[idx] = updated[0];
          return updated[0];
        }
      } catch (err) {
        logger.error('Error updating blog in DB', 'BlogRepo', err);
      }
    }

    const idx = this.fallbackStore.findIndex((b) => b.id === id);
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
   * Admin Toggle Publish Status
   */
  async togglePublish(id: string, authorUser = 'Admin'): Promise<Blog | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const newPublishedState = !existing.isPublished;
    return this.update(
      id,
      {
        isPublished: newPublishedState,
        publishedAt: newPublishedState ? (existing.publishedAt || new Date()) : null,
      },
      authorUser
    );
  }

  /**
   * Admin Delete: Remove blog article
   */
  async delete(id: string): Promise<boolean> {
    const dbStatus = await pingDatabase();
    this.fallbackStore = this.fallbackStore.filter((b) => b.id !== id);

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        await db.delete(blogs).where(eq(blogs.id, id));
        return true;
      } catch (err) {
        logger.error('Error deleting blog from DB', 'BlogRepo', err);
      }
    }

    return true;
  }
}

export const blogRepository = new BlogRepository();
