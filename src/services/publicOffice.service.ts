import { COMPANY_PROFILE } from '../data/websiteData';

export interface PublicOfficeData {
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
  isFallback?: boolean;
}

export function getStaticFallbackOffice(): PublicOfficeData {
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
    websites: [...COMPANY_PROFILE.contact.websites],
    primaryWebsite: COMPANY_PROFILE.contact.primaryWebsite,
    checklist: [
      'Registered office and corporate advisory services in New Delhi',
      'Consultation desk for business incorporation and compliance',
      'Full-service secretarial, taxation and trademark assistance',
      'Digital document processing and nationwide client coordination',
    ],
    mapEmbedUrl: null,
    isActive: true,
    isFallback: true,
  };
}

export async function fetchPublicOffice(): Promise<PublicOfficeData> {
  try {
    const response = await fetch('/api/office', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return getStaticFallbackOffice();
    }

    const result = await response.json();
    if (result.success && result.data) {
      const data = result.data;
      return {
        id: data.id || 'primary',
        name: data.name || COMPANY_PROFILE.name,
        premisesPhotoUrl: data.premisesPhotoUrl || null,
        addressLine1: data.addressLine1 || COMPANY_PROFILE.address.line1,
        addressLine2: data.addressLine2 || COMPANY_PROFILE.address.line2,
        city: data.city || COMPANY_PROFILE.address.city,
        pincode: data.pincode || COMPANY_PROFILE.address.pincode,
        fullAddress: data.fullAddress || COMPANY_PROFILE.address.fullAddress,
        mobile: data.mobile || COMPANY_PROFILE.contact.mobile,
        mobileRaw: data.mobileRaw || COMPANY_PROFILE.contact.mobileRaw,
        landline: data.landline || COMPANY_PROFILE.contact.landline,
        landlineRaw: data.landlineRaw || COMPANY_PROFILE.contact.landlineRaw,
        email: data.email || COMPANY_PROFILE.contact.email,
        officeHours: data.officeHours || COMPANY_PROFILE.contact.officeHours,
        websites: Array.isArray(data.websites) && data.websites.length > 0
          ? data.websites
          : [...COMPANY_PROFILE.contact.websites],
        primaryWebsite: data.primaryWebsite || COMPANY_PROFILE.contact.primaryWebsite,
        checklist: Array.isArray(data.checklist) && data.checklist.length > 0
          ? data.checklist
          : [
              'Registered office and corporate advisory services in New Delhi',
              'Consultation desk for business incorporation and compliance',
              'Full-service secretarial, taxation and trademark assistance',
              'Digital document processing and nationwide client coordination',
            ],
        mapEmbedUrl: data.mapEmbedUrl || null,
        isActive: data.isActive ?? true,
        isFallback: false,
      };
    }

    return getStaticFallbackOffice();
  } catch (error) {
    return getStaticFallbackOffice();
  }
}
