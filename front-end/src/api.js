const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

let onSessionExpired = null;
export const setSessionExpiredHandler = (handler) => {
  onSessionExpired = handler;
};

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check that the backend is running.');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // A wrong password is also a 401, but it says nothing about the saved login.
    if (response.status === 401 && token && path !== '/auth/login') {
      clearToken();
      onSessionExpired?.();
    }
    const error = new Error(data?.message || `The request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}
