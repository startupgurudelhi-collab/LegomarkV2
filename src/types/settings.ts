export interface WebsiteSettingsData {
  id: string;
  companyName: string;
  positioning: string;
  tagline: string;
  businessDescription: string;
  phone: string;
  mobile: string;
  landline: string;
  email: string;
  whatsapp: string;
  primaryWebsite: string;
  secondaryWebsite?: string;
  officeHours: string;
  registeredOfficeAddress: string;
  logoUrl?: string | null;
  fontFamily?: string;
  updatedAt?: string;
  updatedBy?: string | null;
}

export interface UpdateWebsiteSettingsInput {
  companyName?: string;
  positioning?: string;
  tagline?: string;
  businessDescription?: string;
  phone?: string;
  mobile?: string;
  landline?: string;
  email?: string;
  whatsapp?: string;
  primaryWebsite?: string;
  secondaryWebsite?: string;
  officeHours?: string;
  registeredOfficeAddress?: string;
  logoUrl?: string | null;
  fontFamily?: string;
}
