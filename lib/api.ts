/**
 * Central API Client Foundation for LMS Frontend
 *
 * Single source of truth: NEXT_PUBLIC_API_SERVER_URL
 * Example: http://localhost:5000
 * All API endpoints are derived from this base server URL.
 */

const getEnv = (key: string, fallback: string): string => {
  if (typeof window !== "undefined" && (window as any).__ENV__?.[key]) {
    return (window as any).__ENV__[key];
  }
  return process.env[key] || fallback;
};

/** The backend server origin, e.g. http://localhost:5000 */
const API_SERVER_URL = getEnv("NEXT_PUBLIC_API_SERVER_URL", "http://localhost:5000");

/** The versioned API base, derived from the single server URL */
const API_BASE_URL = `${API_SERVER_URL}/api/v1`;

export { API_SERVER_URL, API_BASE_URL };

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
}

export function getImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  return `${API_SERVER_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Generate a secure, authenticated file access URL for ANY Azure-stored module content.
 * Works for PDF, Video (MP4/WEBM), PPT/PPTX, Images, and any future file type.
 *
 * This URL points to the backend stream endpoint which:
 *   1. Authenticates the user (Bearer header OR ?token= query)
 *   2. Checks authorization (role + enrollment)
 *   3. Generates a fresh SAS URL on every request
 *   4. Returns a 302 redirect to Azure Blob (preserving Range support for video seeking)
 *
 * Used as src for <video>, <img>, <iframe>, <a href>, etc.
 * The JWT is passed via query string because native browser elements cannot set headers.
 */
export function getSecureFileUrl(contentId: string): string {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('lms_auth_token')
    : null;
  const base = `${API_BASE_URL}/modules/content/${contentId}/file`;
  // Token in query string is necessary for browser-initiated requests (<video>, <img>, etc.)
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
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

export async function apiFetchBlob(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ blob: Blob | null; error: string | null }> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {};

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

  try {
    const response = await fetch(url, {
      ...options,
      headers: finalHeaders,
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch {
        // If response isn't JSON, use the status message
      }
      return { blob: null, error: errorMsg };
    }

    const blob = await response.blob();
    return { blob, error: null };
  } catch (error: any) {
    return {
      blob: null,
      error: error.message || 'Failed to fetch file',
    };
  }
}
