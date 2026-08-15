import { getDatabase, pingDatabase } from '../config/database';
import { founderProfiles, FounderProfile } from '../../db/schema/index';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { COMPANY_PROFILE } from '../../src/data/websiteData';

export interface UpdateFounderProfileInput {
  name: string;
  designation: string;
  organization?: string;
  photoUrl?: string | null;
  description: string;
  quote?: string | null;
  coreAreas: string[];
  isActive?: boolean;
}

export class FounderRepository {
  /**
   * Public read: Fetch active founder profile
   */
  async getPublicProfile(): Promise<FounderProfile | null> {
    const isConnected = await pingDatabase();
    if (!isConnected) {
      return null;
    }

    try {
      const db = getDatabase();
      const rows = await db
        .select()
        .from(founderProfiles)
        .where(eq(founderProfiles.isActive, true))
        .limit(1);

      return rows[0] || null;
    } catch (error) {
      logger.error('Error in FounderRepository.getPublicProfile', 'FounderRepo', error);
      return null;
    }
  }

  /**
   * Admin read: Fetch founder profile by ID (defaults to 'primary')
   */
  async getAdminProfile(id = 'primary'): Promise<FounderProfile | null> {
    const isConnected = await pingDatabase();
    if (!isConnected) {
      return null;
    }

    try {
      const db = getDatabase();
      const rows = await db
        .select()
        .from(founderProfiles)
        .where(eq(founderProfiles.id, id))
        .limit(1);

      return rows[0] || null;
    } catch (error) {
      logger.error('Error in FounderRepository.getAdminProfile', 'FounderRepo', error);
      return null;
    }
  }

  /**
   * Update or upsert founder profile
   */
  async updateProfile(
    input: UpdateFounderProfileInput,
    updatedBy?: string,
    id = 'primary'
  ): Promise<FounderProfile> {
    const db = getDatabase();

    const [updated] = await db
      .insert(founderProfiles)
      .values({
        id,
        name: input.name.trim(),
        designation: input.designation.trim(),
        organization: (input.organization || 'LEGOMARK INDIA').trim(),
        photoUrl: input.photoUrl ? input.photoUrl.trim() : null,
        description: input.description.trim(),
        quote: input.quote ? input.quote.trim() : null,
        coreAreas: input.coreAreas,
        isActive: input.isActive ?? true,
        updatedBy: updatedBy || 'admin',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: founderProfiles.id,
        set: {
          name: input.name.trim(),
          designation: input.designation.trim(),
          organization: (input.organization || 'LEGOMARK INDIA').trim(),
          photoUrl: input.photoUrl ? input.photoUrl.trim() : null,
          description: input.description.trim(),
          quote: input.quote ? input.quote.trim() : null,
          coreAreas: input.coreAreas,
          isActive: input.isActive ?? true,
          updatedBy: updatedBy || 'admin',
          updatedAt: new Date(),
        },
      })
      .returning();

    return updated;
  }
}

export const founderRepository = new FounderRepository();
