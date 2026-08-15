import { AdminService, AdminCategory } from '../types/adminService';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  meta?: {
    total: number;
    active: number;
    inactive: number;
  };
}

export const adminServiceApi = {
  /**
   * Fetch all services for admin with joined category and dynamic counts
   */
  async getAllServices(): Promise<{ services: AdminService[]; meta?: { total: number; active: number; inactive: number } }> {
    const res = await fetch('/api/admin/services', {
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    const json: ApiResponse<AdminService[]> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to fetch services');
    }

    return {
      services: json.data || [],
      meta: json.meta,
    };
  },

  /**
   * Fetch complete single service by ID
   */
  async getServiceById(id: string): Promise<AdminService> {
    const res = await fetch(`/api/admin/services/${encodeURIComponent(id)}`, {
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    const json: ApiResponse<AdminService> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || `Failed to fetch service ${id}`);
    }

    return json.data;
  },

  /**
   * Create a new service
   */
  async createService(payload: Partial<AdminService>): Promise<AdminService> {
    const res = await fetch('/api/admin/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const json: ApiResponse<AdminService> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to create service');
    }

    return json.data;
  },

  /**
   * Update an existing service metadata and child items
   */
  async updateService(id: string, payload: Partial<AdminService>): Promise<AdminService> {
    const res = await fetch(`/api/admin/services/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const json: ApiResponse<AdminService> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update service');
    }

    return json.data;
  },

  /**
   * Toggle active/inactive status of a service
   */
  async updateStatus(id: string, isActive: boolean): Promise<AdminService> {
    const res = await fetch(`/api/admin/services/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ isActive }),
    });

    const json: ApiResponse<AdminService> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update service status');
    }

    return json.data;
  },

  /**
   * Reorder services in bulk
   */
  async reorderServices(items: { id: string; categoryId?: string; displayOrder: number }[]): Promise<AdminService[]> {
    const res = await fetch('/api/admin/services/reorder', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ items }),
    });

    const json: ApiResponse<AdminService[]> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to reorder services');
    }

    return json.data;
  },

  /**
   * Delete service
   */
  async deleteService(id: string): Promise<void> {
    const res = await fetch(`/api/admin/services/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    const json: ApiResponse<null> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to delete service');
    }
  },

  /**
   * Fetch all categories
   */
  async getAllCategories(): Promise<AdminCategory[]> {
    const res = await fetch('/api/admin/service-categories', {
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    const json: ApiResponse<AdminCategory[]> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to fetch categories');
    }

    return json.data || [];
  },

  /**
   * Create category
   */
  async createCategory(payload: Partial<AdminCategory>): Promise<AdminCategory> {
    const res = await fetch('/api/admin/service-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const json: ApiResponse<AdminCategory> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to create category');
    }

    return json.data;
  },

  /**
   * Update category
   */
  async updateCategory(id: string, payload: Partial<AdminCategory>): Promise<AdminCategory> {
    const res = await fetch(`/api/admin/service-categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const json: ApiResponse<AdminCategory> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update category');
    }

    return json.data;
  },

  /**
   * Toggle category active status
   */
  async updateCategoryStatus(id: string, isActive: boolean): Promise<AdminCategory> {
    const res = await fetch(`/api/admin/service-categories/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ isActive }),
    });

    const json: ApiResponse<AdminCategory> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update category status');
    }

    return json.data;
  },

  /**
   * Reorder categories
   */
  async reorderCategories(items: { id: string; displayOrder: number }[]): Promise<AdminCategory[]> {
    const res = await fetch('/api/admin/service-categories/reorder', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ items }),
    });

    const json: ApiResponse<AdminCategory[]> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to reorder categories');
    }

    return json.data;
  },

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`/api/admin/service-categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    const json: ApiResponse<null> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to delete category');
    }
  },
};
