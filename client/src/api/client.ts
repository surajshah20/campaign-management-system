export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

class ApiError extends Error {
  code: string;
  details?: any[];
  statusCode: number;

  constructor(message: string, code = 'API_ERROR', statusCode = 500, details?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

let activeAgencyId: string | null = null;
let authToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('agency_os_token') : null;

export const setActiveAgencyHeader = (agencyId: string | null) => {
  activeAgencyId = agencyId;
};

export const getActiveAgencyHeader = () => activeAgencyId;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('agency_os_token', token);
    } else {
      localStorage.removeItem('agency_os_token');
    }
  }
};

export const getAuthToken = () => authToken;

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (activeAgencyId) {
    headers['x-agency-id'] = activeAgencyId;
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const rawBaseUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const url = endpoint.startsWith('http') ? endpoint : `${rawBaseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends HTTP-only session cookies
  });

  const data: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error: {
      code: 'NETWORK_OR_PARSE_ERROR',
      message: 'Failed to parse response from server',
    },
  }));

  if (!response.ok || !data.success) {
    const errorMsg = data.error?.message || `HTTP error ${response.status}`;
    const errorCode = data.error?.code || `HTTP_${response.status}`;
    throw new ApiError(errorMsg, errorCode, response.status, data.error?.details);
  }

  return data.data as T;
}
