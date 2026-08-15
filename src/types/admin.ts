export type AdminRole = 'ADMIN' | 'EDITOR';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
}

export type BillingType = 'one_time' | 'monthly' | 'yearly' | 'custom';

export interface AdminPackageFeature {
  id?: string;
  featureText: string;
  displayOrder: number;
}

export interface AdminPackage {
  id: string;
  name: string;
  tagline: string | null;
  priceAmount: string;
  currency: string;
  billingType: BillingType;
  priceDisplayOverride: string | null;
  idealFor: string;
  popular: boolean;
  badge: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string | null;
  features: AdminPackageFeature[];
}

export interface PackageFormData {
  id: string;
  name: string;
  tagline: string;
  priceAmount: string;
  currency: string;
  billingType: BillingType;
  priceDisplayOverride: string;
  idealFor: string;
  popular: boolean;
  badge: string;
  isActive: boolean;
  displayOrder: number;
  features: Array<{ id?: string; featureText: string; displayOrder: number }>;
}

export interface ReorderItem {
  id: string;
  displayOrder: number;
}
