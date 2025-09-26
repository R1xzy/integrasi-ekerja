/**
 * Client-side authentication utilities
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
  tokenType: string;
}

/**
 * Get stored authentication data
 */
export function getAuthData(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userStr && token) {
      const user = JSON.parse(userStr);
      return {
        ...user,
        token: token
      };
    }
  } catch (error) {
    console.error('Error parsing auth data:', error);
    clearAuthData();
  }
  
  return null;
}

/**
 * Store authentication data
 */
export function setAuthData(userData: AuthUser): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('user', JSON.stringify({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      tokenType: userData.tokenType
    }));
    localStorage.setItem('token', userData.token);
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('userLogin', {
      detail: userData
    }));
  } catch (error) {
    console.error('Error storing auth data:', error);
  }
}

/**
 * Clear authentication data
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  
  // Dispatch event to notify components
  window.dispatchEvent(new CustomEvent('userLogout'));
}

/**
 * Get authorization headers for API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const authData = getAuthData();
  
  if (!authData || !authData.token) {
    return {};
  }
  
  return {
    'Authorization': `${authData.tokenType || 'Bearer'} ${authData.token}`
  };
}

/**
 * Make authenticated API request
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Ambil token dari localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Siapkan header, mulai dengan header kustom dari options
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Jika token ada, tambahkan header Authorization
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // --- [PERBAIKAN UTAMA] ---
  // HANYA atur 'Content-Type' ke 'application/json' jika body BUKAN FormData.
  // Jika body adalah FormData, kita biarkan browser yang mengaturnya secara otomatis.
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Gabungkan header yang sudah benar dengan sisa options
  const mergedOptions: RequestInit = {
    ...options,
    headers: headers,
  };
  
  // Lakukan fetch dengan options yang sudah digabungkan
  // Menambahkan NEXT_PUBLIC_API_BASE_URL jika ada untuk konsistensi
  const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}${url}`;
  return fetch(fullUrl, mergedOptions);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthData() !== null;
}

/**
 * Check if user has specific role
 */
export function hasRole(role: string): boolean {
  const authData = getAuthData();
  return authData?.role === role;
}

/**
 * Get user role
 */
export function getUserRole(): string | null {
  const authData = getAuthData();
  return authData?.role || null;
}

/**
 * Redirect based on user role
 */
export function redirectByRole(): void {
  const role = getUserRole();
  
  if (role === 'admin') {
    window.location.href = '/dashboard';
  } else if (role === 'provider') {
    window.location.href = '/provider/dashboard';
  } else if (role === 'customer') {
    window.location.href = '/customer/dashboard';
  } else {
    window.location.href = '/';
  }
}

/**
 * Logout user and clear authentication data
 */
export async function logout(): Promise<void> {
  try {
    // Call logout API to clear server-side cookies
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // Always clear client-side data
    clearAuthData();
    
    // Redirect to login page
    window.location.href = '/login';
  }
}

/**
 * Check if user authentication is still valid
 */
export async function validateAuth(): Promise<boolean> {
  try {
    const response = await authenticatedFetch('/api/auth/me');
    if (response.ok) {
      const data = await response.json();
      return data.success;
    }
  } catch (error) {
    console.error('Auth validation error:', error);
  }
  
  return false;
}

/**
 * Auto-refresh token if needed (placeholder for future implementation)
 */
export async function refreshTokenIfNeeded(): Promise<boolean> {
  // For now, just validate existing token
  return await validateAuth();
}


