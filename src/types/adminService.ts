export interface AdminCategory {
  id: string;
  name: string;
  shortLabel: string;
  description?: string | null;
  iconName: string;
  displayOrder: number;
  isActive: boolean;
  serviceCount?: number;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string | null;
}

export interface ServiceHighlightItem {
  id?: string;
  title: string;
  description: string;
  iconName?: string;
  displayOrder?: number;
}

export interface ServiceProcessStepItem {
  id?: string;
  stepNumber?: string;
  title: string;
  description: string;
  displayOrder?: number;
}

export interface ServiceFaqItem {
  id?: string;
  question: string;
  answer: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface AdminService {
  id: string;
  slug: string;
  categoryId: string;
  title: string;
  shortLabel: string | null;
  shortDesc: string;
  fullDesc: string;
  startingPrice: string;
  priceAmount: string | number;
  currency: string;
  pricingType: 'fixed' | 'recurring' | 'custom' | string;
  priceDisplayOverride: string | null;
  governmentFeeNote: string | null;
  timeline: string;
  popular: boolean;
  badge: string | null;
  iconName: string;
  displayOrder: number;
  isActive: boolean;
  headline: string | null;
  overview: string | null;
  aliases: string[];
  seoTitle: string | null;
  metaDescription: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  updatedBy?: string | null;
  category?: AdminCategory | null;
  counts?: {
    featureCount: number;
    highlightCount: number;
    benefitCount: number;
    deliverableCount: number;
    documentCount: number;
    processStepCount: number;
    faqCount: number;
    relatedServiceCount: number;
    packageCount?: number;
  };
  features?: string[];
  highlights?: ServiceHighlightItem[];
  benefits?: string[];
  deliverables?: string[];
  documents?: string[];
  processSteps?: ServiceProcessStepItem[];
  faqs?: ServiceFaqItem[];
  relatedServiceIds?: string[];
  packageIds?: string[];
  assignedPackages?: Array<{
    packageId: string;
    displayOrder: number;
    name?: string;
    price?: string;
    isActive?: boolean;
  }>;
}

export interface ServiceCompletenessScore {
  percentage: number;
  missingItems: string[];
  passedItems: string[];
  status: 'complete' | 'good' | 'incomplete' | 'draft';
}
