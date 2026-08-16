export interface ClientLogoData {
  id: string;
  name: string;
  logoUrl: string;
  category: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string | null;
}

export interface CreateClientLogoInput {
  name: string;
  logoUrl: string;
  category?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateClientLogoInput {
  name?: string;
  logoUrl?: string;
  category?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface ReorderClientLogosInput {
  orderedIds: string[];
}
