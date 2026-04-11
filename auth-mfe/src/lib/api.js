const DEFAULT_API_BASE_URL = window.__API_BASE_URL__ || 'http://localhost:8080';

export const apiBaseUrl = DEFAULT_API_BASE_URL;

export async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof data === 'object' && data?.message ? data.message : 'Request failed';
    throw new Error(message);
  }

  return data;
}

export function getStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem('mf_auth') || 'null');
  } catch (error) {
    return null;
  }
}

export function setStoredAuth(value) {
  localStorage.setItem('mf_auth', JSON.stringify(value));
  window.dispatchEvent(new Event('mf-auth-changed'));
}

export function clearStoredAuth() {
  localStorage.removeItem('mf_auth');
  window.dispatchEvent(new Event('mf-auth-changed'));
}

export function getAuthToken() {
  return getStoredAuth()?.token || '';
}

export function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
