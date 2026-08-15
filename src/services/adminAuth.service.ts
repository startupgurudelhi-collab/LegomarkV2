import { AdminUser } from '../types/admin';

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    user: AdminUser;
    expiresAt: string;
  };
  error?: string;
}

export interface MeResponse {
  success: boolean;
  data?: {
    user: AdminUser;
  };
  error?: string;
}

/**
 * Sign in admin user and set HttpOnly session cookie
 */
export async function loginAdmin(email: string, password: string): Promise<AdminUser> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const data: LoginResponse = await response.json();

  if (!response.ok || !data.success || !data.data?.user) {
    throw new Error(data.error || 'Authentication failed. Please check your email and password.');
  }

  return data.data.user;
}

/**
 * Retrieve authenticated user profile from session cookie
 */
export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (response.status === 401 || response.status === 403) {
      return null;
    }

    const data: MeResponse = await response.json();
    if (!response.ok || !data.success || !data.data?.user) {
      return null;
    }

    return data.data.user;
  } catch (error) {
    console.error('Failed to verify admin authentication session:', error);
    return null;
  }
}

/**
 * Terminate current admin session and clear cookie
 */
export async function logoutAdmin(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
}
