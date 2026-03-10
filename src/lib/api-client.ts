/**
 * Authenticated API client for hellonoid admin operations
 */

let getAuthToken: (() => string | null) | null = null;

export function setAuthTokenProvider(provider: () => string | null) {
  getAuthToken = provider;
}

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function apiCall(
  endpoint: string, 
  options: ApiOptions = {}
): Promise<Response> {
  const { requireAuth = true, ...fetchOptions } = options;
  
  const headers = new Headers(fetchOptions.headers);
  
  // Add auth header if required
  if (requireAuth && getAuthToken) {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      throw new Error('Authentication required but no token available');
    }
  }
  
  // Ensure content-type for POST/PUT
  if (!headers.has('Content-Type') && 
      (fetchOptions.method === 'POST' || fetchOptions.method === 'PUT')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...fetchOptions,
    headers,
  });

  return response;
}

export async function apiJson<T = any>(
  endpoint: string, 
  options: ApiOptions = {}
): Promise<T> {
  const response = await apiCall(endpoint, options);
  
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Use status text if JSON parsing fails
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
}

// Convenience methods
export const api = {
  get: <T = any>(endpoint: string, options?: ApiOptions) => 
    apiJson<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T = any>(endpoint: string, data?: any, options?: ApiOptions) => 
    apiJson<T>(endpoint, { 
      ...options, 
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  put: <T = any>(endpoint: string, data?: any, options?: ApiOptions) => 
    apiJson<T>(endpoint, { 
      ...options, 
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  delete: <T = any>(endpoint: string, options?: ApiOptions) => 
    apiJson<T>(endpoint, { ...options, method: 'DELETE' }),

  // For form data uploads
  upload: async (endpoint: string, formData: FormData, options?: ApiOptions) => {
    const response = await apiCall(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      // Don't set Content-Type for FormData - browser sets it with boundary
      headers: options?.headers ? new Headers(options.headers) : undefined,
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    return response.json();
  },
};