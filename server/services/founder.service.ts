import { founderRepository, UpdateFounderProfileInput } from '../repositories/founder.repository';
import { FounderProfile } from '../../db/schema/index';
import { COMPANY_PROFILE } from '../../src/data/websiteData';
import { logger } from '../utils/logger';

export interface FormattedFounderProfile {
  id: string;
  name: string;
  designation: string;
  organization: string;
  photoUrl: string | null;
  description: string;
  quote: string | null;
  coreAreas: string[];
  isActive: boolean;
  updatedAt?: string;
}

export class FounderService {
  /**
   * Public: Get active founder profile with automatic fallback
   */
  async getPublicProfile(): Promise<FormattedFounderProfile> {
    try {
      const profile = await founderRepository.getPublicProfile();
      if (profile) {
        return {
          id: profile.id,
          name: profile.name,
          designation: profile.designation,
          organization: profile.organization,
          photoUrl: profile.photoUrl,
          description: profile.description,
          quote: profile.quote,
          coreAreas: profile.coreAreas,
          isActive: profile.isActive,
          updatedAt: profile.updatedAt ? new Date(profile.updatedAt).toISOString() : undefined,
        };
      }
    } catch (err) {
      logger.error('Failed to retrieve founder profile from database, falling back to static config', 'FounderService', err);
    }

    // Static fallback to preserve genuine data
    return {
      id: 'primary',
      name: COMPANY_PROFILE.founder.name,
      designation: COMPANY_PROFILE.founder.designation,
      organization: COMPANY_PROFILE.founder.organization,
      photoUrl: null,
      description: COMPANY_PROFILE.founder.description,
      quote: null,
      coreAreas: COMPANY_PROFILE.founder.coreAreas,
      isActive: true,
    };
  }

  /**
   * Admin: Get founder profile for editing
   */
  async getAdminProfile(): Promise<FormattedFounderProfile> {
    try {
      const profile = await founderRepository.getAdminProfile('primary');
      if (profile) {
        return {
          id: profile.id,
          name: profile.name,
          designation: profile.designation,
          organization: profile.organization,
          photoUrl: profile.photoUrl,
          description: profile.description,
          quote: profile.quote,
          coreAreas: profile.coreAreas,
          isActive: profile.isActive,
          updatedAt: profile.updatedAt ? new Date(profile.updatedAt).toISOString() : undefined,
        };
      }
    } catch (err) {
      logger.error('Failed to retrieve admin founder profile from database, returning default', 'FounderService', err);
    }

    return {
      id: 'primary',
      name: COMPANY_PROFILE.founder.name,
      designation: COMPANY_PROFILE.founder.designation,
      organization: COMPANY_PROFILE.founder.organization,
      photoUrl: null,
      description: COMPANY_PROFILE.founder.description,
      quote: null,
      coreAreas: COMPANY_PROFILE.founder.coreAreas,
      isActive: true,
    };
  }

  /**
   * Admin: Update founder profile
   */
  async updateProfile(input: UpdateFounderProfileInput, updatedBy?: string): Promise<FormattedFounderProfile> {
    if (!input.name || !input.name.trim()) {
      throw new Error('Founder name is required');
    }
    if (!input.designation || !input.designation.trim()) {
      throw new Error('Founder designation is required');
    }
    if (!input.description || !input.description.trim()) {
      throw new Error('Founder biography/description is required');
    }
    if (!Array.isArray(input.coreAreas) || input.coreAreas.length === 0) {
      throw new Error('At least one core area is required');
    }

    const updated = await founderRepository.updateProfile(input, updatedBy, 'primary');

    return {
      id: updated.id,
      name: updated.name,
      designation: updated.designation,
      organization: updated.organization,
      photoUrl: updated.photoUrl,
      description: updated.description,
      quote: updated.quote,
      coreAreas: updated.coreAreas,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : undefined,
    };
  }
}

export const founderService = new FounderService();
