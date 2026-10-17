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
  lookupProfileByMobile: (mobile) =>
    request(`/sangha/profile-by-mobile?mobile=${encodeURIComponent(mobile)}`),
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
  updateEvent: (id, payload) =>
    request(`/events/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }),
  searchPlaces: ({ kind = 'urban', q = '', limit = 25 } = {}) => {
    const params = new URLSearchParams({
      kind,
      limit: String(limit)
    });
    if (q) params.set('q', q);
    return request(`/places?${params.toString()}`);
  },
  rememberPlace: (payload) => request('/places', { method: 'POST', body: JSON.stringify(payload) }),
  searchPyramidCenters: ({ q = '', limit = 25 } = {}) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (q) params.set('q', q);
    return request(`/pyramid-centers?${params.toString()}`);
  },
  rememberPyramidCenter: (payload) =>
    request('/pyramid-centers', { method: 'POST', body: JSON.stringify(payload) }),
  createStayBooking: (payload) => request('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  listStayBookings: (eventId, params = {}) => {
    const query = new URLSearchParams({ eventId: String(eventId || '') });
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value == null || value === '') return;
      if (Array.isArray(value)) {
        if (value.length) query.set(key, value.join(','));
        return;
      }
      query.set(key, String(value));
    });
    return request(`/bookings?${query.toString()}`);
  },
  getStayBooking: (id) => request(`/bookings/${encodeURIComponent(id)}`),
  updateStayBooking: (id, payload) =>
    request(`/bookings/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteStayBooking: (id) =>
    request(`/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  listStayAllotments: (eventId, params = {}) => {
    const query = new URLSearchParams({ eventId: String(eventId || '') });
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value == null || value === '') return;
      query.set(key, String(value));
    });
    return request(`/allotments?${query.toString()}`);
  },
  createStayAllotments: (payload) =>
    request('/allotments', { method: 'POST', body: JSON.stringify(payload) }),
  releaseStayAllotments: (payload) =>
    request('/allotments/release', { method: 'POST', body: JSON.stringify(payload) }),
  listHotels: (eventId) =>
    request(`/hotels?eventId=${encodeURIComponent(String(eventId || ''))}`),
  getHotel: (id) => request(`/hotels/${encodeURIComponent(id)}`),
  createHotel: (payload) => request('/hotels', { method: 'POST', body: JSON.stringify(payload) }),
  updateHotel: (id, payload) =>
    request(`/hotels/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }),
  countPssmAdmins: async () => 0
};

export const api = USE_MOCK ? mockApi : liveApi;
export { USE_MOCK };
