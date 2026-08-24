export interface AssociationLogoData {
  id: string;
  name: string;
  logoUrl: string;
  category?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAssociationLogoInput {
  name: string;
  logoUrl: string;
  category?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateAssociationLogoInput {
  name?: string;
  logoUrl?: string;
  category?: string;
  isActive?: boolean;
  displayOrder?: number;
}
