import { mockApi } from './mock/store.js';

const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';
const BASE = '/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (body.error && body.error.message) || res.statusText || 'Request failed';
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

const liveApi = {
  ensureSampleAdmin: () => ({ mobile: '', password: '', name: '' }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST', body: '{}' }),
  me: () => request('/auth/me'),
  changePassword: (payload) => request('/auth/password', { method: 'POST', body: JSON.stringify(payload) }),
  join: (payload) => request('/sangha/join', { method: 'POST', body: JSON.stringify(payload) }),
  getMyProfile: () => request('/sangha/me'),
  updateMyProfile: (payload) => request('/sangha/me', { method: 'PUT', body: JSON.stringify(payload) }),
  searchPeople: (mobile) => request(`/sangha/people?mobile=${encodeURIComponent(mobile)}`),
  updateRoles: (mobile, roles) =>
    request(`/sangha/people/${encodeURIComponent(mobile)}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roles })
    }),
  removePerson: (mobile) =>
    request(`/sangha/people/${encodeURIComponent(mobile)}`, { method: 'DELETE' }),
  claimAdmin: () => request('/sangha/admin/claim', { method: 'POST', body: '{}' }),
  listEvents: () => request('/events'),
  createEvent: (payload) => request('/events', { method: 'POST', body: JSON.stringify(payload) }),
  countPssmAdmins: async () => 0
};

export const api = USE_MOCK ? mockApi : liveApi;
export { USE_MOCK };
