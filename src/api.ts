const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('motolarry_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('motolarry_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('motolarry_token');
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuthToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'API Request failed');
  }

  return data;
}
