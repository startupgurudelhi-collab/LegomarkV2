import { COMPANY_PROFILE } from '../data/websiteData';

export interface PublicFounderData {
  id: string;
  name: string;
  designation: string;
  organization: string;
  photoUrl: string | null;
  description: string;
  quote: string | null;
  coreAreas: string[];
  isActive: boolean;
  isFallback?: boolean;
}

/**
 * Fallback data source to ensure zero downtime and preservation of genuine assets
 */
export function getStaticFallbackFounder(): PublicFounderData {
  return {
    id: 'primary',
    name: COMPANY_PROFILE.founder.name,
    designation: COMPANY_PROFILE.founder.designation,
    organization: COMPANY_PROFILE.founder.organization,
    photoUrl: null,
    description: COMPANY_PROFILE.founder.description,
    quote: null,
    coreAreas: [...COMPANY_PROFILE.founder.coreAreas],
    isActive: true,
    isFallback: true,
  };
}

/**
 * Fetch dynamic founder profile with transparent fallback
 */
export async function fetchPublicFounder(): Promise<PublicFounderData> {
  try {
    const response = await fetch('/api/founder', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return getStaticFallbackFounder();
    }

    const result = await response.json();
    if (result.success && result.data) {
      return {
        id: result.data.id || 'primary',
        name: result.data.name || COMPANY_PROFILE.founder.name,
        designation: result.data.designation || COMPANY_PROFILE.founder.designation,
        organization: result.data.organization || COMPANY_PROFILE.founder.organization,
        photoUrl: result.data.photoUrl || null,
        description: result.data.description || COMPANY_PROFILE.founder.description,
        quote: result.data.quote || null,
        coreAreas: Array.isArray(result.data.coreAreas) && result.data.coreAreas.length > 0
          ? result.data.coreAreas
          : [...COMPANY_PROFILE.founder.coreAreas],
        isActive: result.data.isActive ?? true,
        isFallback: false,
      };
    }

    return getStaticFallbackFounder();
  } catch (error) {
    return getStaticFallbackFounder();
  }
}
