/**
 * Central API Client Foundation for LMS Frontend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Authorization token if present in localStorage or cookies in client browser
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('lms_auth_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const finalHeaders = {
    ...defaultHeaders,
    ...options.headers,
  };

  // If sending FormData, browser will automatically set the correct Content-Type with boundary
  if (options.body instanceof FormData) {
    delete (finalHeaders as any)['Content-Type'];
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: finalHeaders,
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Network request failed',
      errorCode: 'NETWORK_ERROR',
    };
  }
}
