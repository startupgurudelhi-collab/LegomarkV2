export interface CompanyProfile {
  name: string;
  positioning: string;
  tagline: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    pincode: string;
    fullAddress: string;
  };
  contact: {
    mobile: string;
    mobileRaw: string;
    landline: string;
    landlineRaw: string;
    email: string;
    websites: string[];
    primaryWebsite: string;
    officeHours: string;
    officeHoursSchedule: {
      days: string;
      timing: string;
    };
  };
  founder: {
    name: string;
    designation: string;
    organization: string;
    description: string;
    coreAreas: string[];
  };
}

export interface MediaAsset {
  id: string;
  altText: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide';
  placeholderType?: 'founder' | 'office' | 'certificate' | 'logo' | 'service';
  caption?: string;
  badge?: string;
}

export type ServiceCategory =
  | 'company-registration'
  | 'taxation-gst'
  | 'trademark-ip'
  | 'compliance-roc'
  | 'licenses-registrations'
  | 'advisory-secretarial';

export interface ServiceCategoryMeta {
  id: ServiceCategory;
  name: string;
  shortLabel: string;
  count: string;
  iconName: string;
  description: string;
}

export interface ServiceProcessStep {
  step: string;
  title: string;
  description: string;
}

export interface ServiceFAQ {
  question: string;
  answer: string;
}

export interface ServiceLandingPageData {
  headline?: string;
  description?: string;
  overview: string;
  benefits: string[];
  deliverables: string[];
  documents: string[];
  process: ServiceProcessStep[];
  faqs: ServiceFAQ[];
  tagline?: string;
  packages?: PackageTier[];
}

export interface ServiceItem {
  id: string;
  slug: string;
  category: ServiceCategory;
  title: string;
  shortDesc: string;
  fullDesc: string;
  popular?: boolean;
  timeline: string;
  startingPrice: string;
  pricingType?: 'fixed' | 'recurring' | 'custom';
  governmentFeeNote?: string;
  features: string[];
  iconName: string;
  badge?: string;
  aliases?: string[];
  landingPage?: ServiceLandingPageData;
  packages?: PackageTier[];
}

export interface PackageTier {
  id: string;
  name: string;
  tagline: string;
  price: string;
  period?: string;
  popular?: boolean;
  idealFor: string;
  features: string[];
  ctaLabel: string;
  badge?: string;
}

export interface MatrixRow {
  featureName: string;
  category: string;
  tooltip?: string;
  starter: boolean | string;
  growth: boolean | string;
  enterprise: boolean | string;
}

export interface TestimonialItem {
  id: string;
  clientName: string;
  role: string;
  companyName: string;
  location: string;
  rating: number;
  content: string;
  serviceUsed: string;
  verified: boolean;
}

export interface FAQItem {
  id: string;
  category: 'incorporation' | 'tax' | 'trademark' | 'general';
  question: string;
  answer: string;
}

export interface ClientLogo {
  id: string;
  name: string;
  industry: string;
  location: string;
}

export interface BuyNowItem {
  id?: string;
  name: string;
  title?: string;
  slug?: string;
  priceDisplay: string;
  amount?: number;
  itemType: 'service' | 'package';
  category?: string;
  governmentFeeNote?: string;
  features?: string[];
}
