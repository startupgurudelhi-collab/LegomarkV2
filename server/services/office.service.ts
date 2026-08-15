import { officeRepository, UpdateOfficeProfileInput } from '../repositories/office.repository';
import { OfficeProfile } from '../../db/schema/index';
import { COMPANY_PROFILE } from '../../src/data/websiteData';
import { logger } from '../utils/logger';

export interface FormattedOfficeProfile {
  id: string;
  name: string;
  premisesPhotoUrl: string | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  pincode: string;
  fullAddress: string;
  mobile: string;
  mobileRaw: string;
  landline: string;
  landlineRaw: string;
  email: string;
  officeHours: string;
  websites: string[];
  primaryWebsite: string;
  checklist: string[];
  mapEmbedUrl: string | null;
  isActive: boolean;
  updatedAt?: string;
}

export class OfficeService {
  /**
   * Public: Get active office profile with automatic fallback
   */
  async getPublicProfile(): Promise<FormattedOfficeProfile> {
    try {
      const profile = await officeRepository.getPublicProfile();
      if (profile) {
        return {
          id: profile.id,
          name: profile.name,
          premisesPhotoUrl: profile.premisesPhotoUrl,
          addressLine1: profile.addressLine1,
          addressLine2: profile.addressLine2,
          city: profile.city,
          pincode: profile.pincode,
          fullAddress: profile.fullAddress,
          mobile: profile.mobile,
          mobileRaw: profile.mobileRaw,
          landline: profile.landline,
          landlineRaw: profile.landlineRaw,
          email: profile.email,
          officeHours: profile.officeHours,
          websites: profile.websites,
          primaryWebsite: profile.primaryWebsite,
          checklist: profile.checklist,
          mapEmbedUrl: profile.mapEmbedUrl,
          isActive: profile.isActive,
          updatedAt: profile.updatedAt ? new Date(profile.updatedAt).toISOString() : undefined,
        };
      }
    } catch (err) {
      logger.error('Failed to retrieve office profile from database, falling back to static config', 'OfficeService', err);
    }

    // Static fallback
    return {
      id: 'primary',
      name: COMPANY_PROFILE.name,
      premisesPhotoUrl: null,
      addressLine1: COMPANY_PROFILE.address.line1,
      addressLine2: COMPANY_PROFILE.address.line2,
      city: COMPANY_PROFILE.address.city,
      pincode: COMPANY_PROFILE.address.pincode,
      fullAddress: COMPANY_PROFILE.address.fullAddress,
      mobile: COMPANY_PROFILE.contact.mobile,
      mobileRaw: COMPANY_PROFILE.contact.mobileRaw,
      landline: COMPANY_PROFILE.contact.landline,
      landlineRaw: COMPANY_PROFILE.contact.landlineRaw,
      email: COMPANY_PROFILE.contact.email,
      officeHours: COMPANY_PROFILE.contact.officeHours,
      websites: COMPANY_PROFILE.contact.websites,
      primaryWebsite: COMPANY_PROFILE.contact.primaryWebsite,
      checklist: [
        'Registered office and corporate advisory services in New Delhi',
        'Consultation desk for business incorporation and compliance',
        'Full-service secretarial, taxation and trademark assistance',
        'Digital document processing and nationwide client coordination',
      ],
      mapEmbedUrl: null,
      isActive: true,
    };
  }

  /**
   * Admin: Get office profile for editing
   */
  async getAdminProfile(): Promise<FormattedOfficeProfile> {
    try {
      const profile = await officeRepository.getAdminProfile('primary');
      if (profile) {
        return {
          id: profile.id,
          name: profile.name,
          premisesPhotoUrl: profile.premisesPhotoUrl,
          addressLine1: profile.addressLine1,
          addressLine2: profile.addressLine2,
          city: profile.city,
          pincode: profile.pincode,
          fullAddress: profile.fullAddress,
          mobile: profile.mobile,
          mobileRaw: profile.mobileRaw,
          landline: profile.landline,
          landlineRaw: profile.landlineRaw,
          email: profile.email,
          officeHours: profile.officeHours,
          websites: profile.websites,
          primaryWebsite: profile.primaryWebsite,
          checklist: profile.checklist,
          mapEmbedUrl: profile.mapEmbedUrl,
          isActive: profile.isActive,
          updatedAt: profile.updatedAt ? new Date(profile.updatedAt).toISOString() : undefined,
        };
      }
    } catch (err) {
      logger.error('Failed to retrieve admin office profile from database, returning default', 'OfficeService', err);
    }

    return {
      id: 'primary',
      name: COMPANY_PROFILE.name,
      premisesPhotoUrl: null,
      addressLine1: COMPANY_PROFILE.address.line1,
      addressLine2: COMPANY_PROFILE.address.line2,
      city: COMPANY_PROFILE.address.city,
      pincode: COMPANY_PROFILE.address.pincode,
      fullAddress: COMPANY_PROFILE.address.fullAddress,
      mobile: COMPANY_PROFILE.contact.mobile,
      mobileRaw: COMPANY_PROFILE.contact.mobileRaw,
      landline: COMPANY_PROFILE.contact.landline,
      landlineRaw: COMPANY_PROFILE.contact.landlineRaw,
      email: COMPANY_PROFILE.contact.email,
      officeHours: COMPANY_PROFILE.contact.officeHours,
      websites: COMPANY_PROFILE.contact.websites,
      primaryWebsite: COMPANY_PROFILE.contact.primaryWebsite,
      checklist: [
        'Registered office and corporate advisory services in New Delhi',
        'Consultation desk for business incorporation and compliance',
        'Full-service secretarial, taxation and trademark assistance',
        'Digital document processing and nationwide client coordination',
      ],
      mapEmbedUrl: null,
      isActive: true,
    };
  }

  /**
   * Admin: Update office profile
   */
  async updateProfile(input: UpdateOfficeProfileInput, updatedBy?: string): Promise<FormattedOfficeProfile> {
    if (!input.addressLine1 || !input.addressLine1.trim()) {
      throw new Error('Address line 1 is required');
    }
    if (!input.city || !input.city.trim()) {
      throw new Error('City is required');
    }
    if (!input.pincode || !input.pincode.trim()) {
      throw new Error('Pincode is required');
    }
    if (!input.mobile || !input.mobile.trim()) {
      throw new Error('Mobile number is required');
    }
    if (!input.email || !input.email.trim()) {
      throw new Error('Email is required');
    }

    const updated = await officeRepository.updateProfile(input, updatedBy, 'primary');

    return {
      id: updated.id,
      name: updated.name,
      premisesPhotoUrl: updated.premisesPhotoUrl,
      addressLine1: updated.addressLine1,
      addressLine2: updated.addressLine2,
      city: updated.city,
      pincode: updated.pincode,
      fullAddress: updated.fullAddress,
      mobile: updated.mobile,
      mobileRaw: updated.mobileRaw,
      landline: updated.landline,
      landlineRaw: updated.landlineRaw,
      email: updated.email,
      officeHours: updated.officeHours,
      websites: updated.websites,
      primaryWebsite: updated.primaryWebsite,
      checklist: updated.checklist,
      mapEmbedUrl: updated.mapEmbedUrl,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : undefined,
    };
  }
}

export const officeService = new OfficeService();
