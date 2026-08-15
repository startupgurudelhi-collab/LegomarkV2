import { getDatabase, pingDatabase } from '../config/database';
import { officeProfiles, OfficeProfile } from '../../db/schema/index';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

export interface UpdateOfficeProfileInput {
  name?: string;
  premisesPhotoUrl?: string | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  pincode: string;
  fullAddress?: string;
  mobile: string;
  mobileRaw?: string;
  landline: string;
  landlineRaw?: string;
  email: string;
  officeHours: string;
  websites?: string[];
  primaryWebsite?: string;
  checklist?: string[];
  mapEmbedUrl?: string | null;
  isActive?: boolean;
}

export class OfficeRepository {
  /**
   * Public read: Fetch active office profile
   */
  async getPublicProfile(): Promise<OfficeProfile | null> {
    const isConnected = await pingDatabase();
    if (!isConnected) {
      return null;
    }

    try {
      const db = getDatabase();
      const rows = await db
        .select()
        .from(officeProfiles)
        .where(eq(officeProfiles.isActive, true))
        .limit(1);

      return rows[0] || null;
    } catch (error) {
      logger.error('Error in OfficeRepository.getPublicProfile', 'OfficeRepo', error);
      return null;
    }
  }

  /**
   * Admin read: Fetch office profile by ID (defaults to 'primary')
   */
  async getAdminProfile(id = 'primary'): Promise<OfficeProfile | null> {
    const isConnected = await pingDatabase();
    if (!isConnected) {
      return null;
    }

    try {
      const db = getDatabase();
      const rows = await db
        .select()
        .from(officeProfiles)
        .where(eq(officeProfiles.id, id))
        .limit(1);

      return rows[0] || null;
    } catch (error) {
      logger.error('Error in OfficeRepository.getAdminProfile', 'OfficeRepo', error);
      return null;
    }
  }

  /**
   * Update or upsert office profile
   */
  async updateProfile(
    input: UpdateOfficeProfileInput,
    updatedBy?: string,
    id = 'primary'
  ): Promise<OfficeProfile> {
    const db = getDatabase();

    const fullAddress =
      input.fullAddress?.trim() ||
      `${input.addressLine1.trim()}, ${input.addressLine2.trim()}, ${input.city.trim()} – ${input.pincode.trim()}`;

    const mobileRaw = input.mobileRaw || input.mobile.replace(/[^\d+]/g, '');
    const landlineRaw = input.landlineRaw || input.landline.replace(/[^\d]/g, '');

    const defaultChecklist = [
      'Registered office and corporate advisory services in New Delhi',
      'Consultation desk for business incorporation and compliance',
      'Full-service secretarial, taxation and trademark assistance',
      'Digital document processing and nationwide client coordination',
    ];

    const [updated] = await db
      .insert(officeProfiles)
      .values({
        id,
        name: (input.name || 'LEGOMARK INDIA').trim(),
        premisesPhotoUrl: input.premisesPhotoUrl ? input.premisesPhotoUrl.trim() : null,
        addressLine1: input.addressLine1.trim(),
        addressLine2: input.addressLine2.trim(),
        city: input.city.trim(),
        pincode: input.pincode.trim(),
        fullAddress,
        mobile: input.mobile.trim(),
        mobileRaw,
        landline: input.landline.trim(),
        landlineRaw,
        email: input.email.trim(),
        officeHours: input.officeHours.trim(),
        websites: input.websites && input.websites.length > 0 ? input.websites : ['www.legomarkindia.com', 'www.legomark.com'],
        primaryWebsite: input.primaryWebsite || 'www.legomarkindia.com',
        checklist: input.checklist && input.checklist.length > 0 ? input.checklist : defaultChecklist,
        mapEmbedUrl: input.mapEmbedUrl ? input.mapEmbedUrl.trim() : null,
        isActive: input.isActive ?? true,
        updatedBy: updatedBy || 'admin',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: officeProfiles.id,
        set: {
          name: (input.name || 'LEGOMARK INDIA').trim(),
          premisesPhotoUrl: input.premisesPhotoUrl ? input.premisesPhotoUrl.trim() : null,
          addressLine1: input.addressLine1.trim(),
          addressLine2: input.addressLine2.trim(),
          city: input.city.trim(),
          pincode: input.pincode.trim(),
          fullAddress,
          mobile: input.mobile.trim(),
          mobileRaw,
          landline: input.landline.trim(),
          landlineRaw,
          email: input.email.trim(),
          officeHours: input.officeHours.trim(),
          websites: input.websites && input.websites.length > 0 ? input.websites : ['www.legomarkindia.com', 'www.legomark.com'],
          primaryWebsite: input.primaryWebsite || 'www.legomarkindia.com',
          checklist: input.checklist && input.checklist.length > 0 ? input.checklist : defaultChecklist,
          mapEmbedUrl: input.mapEmbedUrl ? input.mapEmbedUrl.trim() : null,
          isActive: input.isActive ?? true,
          updatedBy: updatedBy || 'admin',
          updatedAt: new Date(),
        },
      })
      .returning();

    return updated;
  }
}

export const officeRepository = new OfficeRepository();
