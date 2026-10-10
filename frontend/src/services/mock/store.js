import {
  ASSIGNABLE_ROLE_IDS,
  composedPassword,
  currentPassword,
  homeAfterLogin,
  normalizeAssignableRoles,
  normalizeMobile,
  normalizeRoles
} from '../../utils/password.js';
import seedPlaces from '../../data/sangha_places.json';

const PEOPLE_KEY = 'pssm_sangha_people';
const SESSION_KEY = 'pssm_sangha_session';
const EVENTS_KEY = 'pssm_events';
const ROLE_ASSIGN_KEY = 'pssm_role_assignments';
const PLACES_KEY = 'pssm_sangha_places';

const SAMPLE_ADMIN = {
  fullName: 'Pssm Admin',
  mobile: '9000000001',
  email: 'admin@pssm.example',
  gender: 'male',
  age: 'adult',
  meditation: '6',
  birthDate: '01',
  birthMonth: '01',
  language: 'English',
  pyramidCenter: 'Pyramid Meditation Center, Hyderabad',
  sinceYear: '2010',
  place: { kind: 'urban', city: 'Hyderabad', state: 'Telangana', country: 'India' },
  members: [],
  roles: ['pssm_admin']
};

const SAMPLE_PEOPLE = [
  {
    fullName: 'Ramakrishna',
    mobile: '9876543210',
    gender: 'male',
    age: 'adult',
    meditation: '5',
    birthDate: '15',
    birthMonth: '08',
    language: 'Telugu',
    pyramidCenter: 'Pyramid Meditation Center, Vijayawada',
    sinceYear: '2019',
    place: { kind: 'urban', city: 'Vijayawada', state: 'Andhra Pradesh', country: 'India' },
    members: [],
    roles: []
  },
  {
    fullName: 'Lakshmi Devi',
    mobile: '9876501234',
    gender: 'female',
    age: 'adult',
    meditation: '3',
    birthDate: '22',
    birthMonth: '03',
    language: 'Telugu',
    pyramidCenter: 'Indiranagar Pyramid Group',
    sinceYear: '2021',
    place: { kind: 'urban', city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    members: [],
    roles: ['pyramid_sevadal']
  }
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function placeLabel(place) {
  return [place.name, place.district, place.state, place.country].filter(Boolean).join(' · ');
}

function toPlaceRow(raw, index) {
  const kind = raw.kind === 'rural' ? 'rural' : 'urban';
  const name = String(raw.name || raw.city || raw.village || '').trim();
  return {
    id: raw.id || `seed_${kind}_${index}`,
    kind,
    name,
    city: kind === 'urban' ? name : null,
    village: kind === 'rural' ? name : null,
    town: raw.town || null,
    district: raw.district || null,
    state: raw.state || null,
    country: raw.country || 'India',
    usageCount: Number(raw.usageCount) || 0,
    label: placeLabel({
      name,
      district: raw.district,
      state: raw.state,
      country: raw.country || 'India'
    })
  };
}

function ensurePlaces() {
  const seeded = (Array.isArray(seedPlaces) ? seedPlaces : []).map((row, i) => toPlaceRow(row, i));
  const existing = readJson(PLACES_KEY, null);
  if (!Array.isArray(existing) || existing.length === 0) {
    writeJson(PLACES_KEY, seeded);
    return seeded;
  }
  if (existing.length >= seeded.length) {
    return existing;
  }
  const merged = [...seeded];
  existing
    .filter((p) => String(p.id || '').startsWith('user_'))
    .forEach((userPlace) => {
      const dup = merged.some(
        (p) =>
          p.kind === userPlace.kind &&
          p.name.toLowerCase() === String(userPlace.name || '').toLowerCase() &&
          String(p.state || '').toLowerCase() === String(userPlace.state || '').toLowerCase() &&
          String(p.country || '').toLowerCase() === String(userPlace.country || '').toLowerCase()
      );
      if (!dup) merged.push(userPlace);
    });
  writeJson(PLACES_KEY, merged);
  return merged;
}

function readPlaces() {
  return ensurePlaces();
}

function savePlaces(list) {
  writeJson(PLACES_KEY, list);
}

function readPeople() {
  const map = readJson(PEOPLE_KEY, {});
  return typeof map === 'object' && !Array.isArray(map) ? map : {};
}

function savePeople(map) {
  writeJson(PEOPLE_KEY, map || {});
}

function findPerson(mobile) {
  const digits = normalizeMobile(mobile);
  if (!digits) return null;
  return readPeople()[digits] || null;
}

function upsertPerson(profile) {
  const digits = normalizeMobile(profile.mobile);
  if (!digits) return null;
  const people = readPeople();
  const next = { ...profile, mobile: digits };
  people[digits] = next;
  savePeople(people);
  return next;
}

function readRoleAssignments() {
  return readJson(ROLE_ASSIGN_KEY, {}) || {};
}

function saveRoleAssignments(map) {
  writeJson(ROLE_ASSIGN_KEY, map || {});
}

function rolesForMobile(mobile) {
  const digits = normalizeMobile(mobile);
  const map = readRoleAssignments();
  if (digits && Array.isArray(map[digits])) return normalizeRoles(map[digits]);
  const person = findPerson(digits);
  if (person) return normalizeRoles(person.roles);
  return [];
}

function writeRolesForMobile(mobile, roles) {
  const digits = normalizeMobile(mobile);
  if (!digits) return { ok: false, message: 'Mobile is required.' };
  const next = normalizeRoles(roles);
  const map = readRoleAssignments();
  map[digits] = next;
  saveRoleAssignments(map);
  const person = findPerson(digits);
  if (person) {
    person.roles = next.slice();
    upsertPerson(person);
  }
  const session = readSession();
  if (session && normalizeMobile(session.mobile) === digits) {
    writeJson(SESSION_KEY, {
      ...session,
      roles: next,
      name: (person && person.fullName) || session.name
    });
  }
  return { ok: true, roles: next };
}

function readSession() {
  return readJson(SESSION_KEY, null);
}

function setSession(profile) {
  writeJson(SESSION_KEY, {
    mobile: normalizeMobile(profile && profile.mobile),
    name: profile && profile.fullName ? profile.fullName : '',
    roles: normalizeRoles(profile && profile.roles),
    signedInAt: Date.now()
  });
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function isSignedIn() {
  const session = readSession();
  if (!session || !session.mobile) return false;
  return Boolean(findPerson(session.mobile));
}

function countPssmAdmins() {
  const seen = {};
  const map = readRoleAssignments();
  Object.keys(map).forEach((mobile) => {
    if (normalizeRoles(map[mobile]).indexOf('pssm_admin') >= 0) seen[mobile] = true;
  });
  Object.values(readPeople()).forEach((person) => {
    const dig = normalizeMobile(person.mobile);
    if (dig && normalizeRoles(person.roles).indexOf('pssm_admin') >= 0) seen[dig] = true;
  });
  return Object.keys(seen).length;
}

function ensureSampleAdmin() {
  const admin = { ...SAMPLE_ADMIN, roles: ['pssm_admin'] };
  upsertPerson(admin);
  writeRolesForMobile(admin.mobile, ['pssm_admin']);
  SAMPLE_PEOPLE.forEach((person) => {
    const digits = normalizeMobile(person.mobile);
    if (!findPerson(digits)) {
      upsertPerson({ ...person });
      writeRolesForMobile(digits, normalizeRoles(person.roles));
    }
  });
  return {
    mobile: SAMPLE_ADMIN.mobile,
    password: composedPassword(SAMPLE_ADMIN),
    name: SAMPLE_ADMIN.fullName
  };
}

function apiError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.body = { error: { code, message } };
  return err;
}

export const mockApi = {
  ensureSampleAdmin,

  async login({ mobile, password }) {
    ensureSampleAdmin();
    const digits = normalizeMobile(mobile);
    const pass = String(password || '').trim();
    if (!digits) throw apiError(400, 'VALIDATION', 'Enter your mobile number.');
    if (!pass) throw apiError(400, 'VALIDATION', 'Enter your password.');
    let profile = findPerson(digits);
    if (!profile) {
      throw apiError(401, 'UNAUTHORIZED', 'No sangha join found for this mobile. Join first, then login.');
    }
    if (currentPassword(profile) !== pass) {
      throw apiError(401, 'UNAUTHORIZED', 'Mobile number or password is not correct.');
    }
    const roles = rolesForMobile(digits);
    profile = { ...profile, roles };
    upsertPerson(profile);
    setSession(profile);
    return {
      data: {
        mobile: profile.mobile,
        name: profile.fullName,
        roles,
        home: homeAfterLogin(roles)
      }
    };
  },

  async logout() {
    clearSession();
    return { data: { ok: true } };
  },

  async me() {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Not signed in.');
    const session = readSession();
    const roles = rolesForMobile(session.mobile);
    return {
      data: {
        mobile: session.mobile,
        name: session.name,
        roles
      }
    };
  },

  async changePassword({ currentPassword: current, newPassword, confirmPassword }) {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    const cur = String(current || '').trim();
    const next = String(newPassword || '').trim();
    const confirm = String(confirmPassword || '').trim();
    if (!cur) throw apiError(400, 'VALIDATION', 'Enter your current password.');
    if (!next) throw apiError(400, 'VALIDATION', 'Enter a new password.');
    if (next.length < 6) throw apiError(400, 'VALIDATION', 'New password must be at least 6 characters.');
    if (next !== confirm) throw apiError(400, 'VALIDATION', 'New password and confirm do not match.');
    const profile = findPerson(readSession().mobile);
    if (!profile) throw apiError(404, 'NOT_FOUND', 'Profile not found.');
    if (currentPassword(profile) !== cur) {
      throw apiError(400, 'VALIDATION', 'Current password is not correct.');
    }
    if (next === cur) {
      throw apiError(400, 'VALIDATION', 'Choose a new password that is different from the current one.');
    }
    profile.password = next;
    upsertPerson(profile);
    setSession(profile);
    return { data: { ok: true } };
  },

  async join(body) {
    const digits = normalizeMobile(body && body.mobile);
    const fullName = String((body && body.fullName) || '').trim();
    if (!fullName) throw apiError(400, 'VALIDATION', 'Enter your full name.');
    if (!digits) throw apiError(400, 'VALIDATION', 'Enter your mobile number.');
    if (!(body && body.birthDate) || !(body && body.birthMonth)) {
      throw apiError(400, 'VALIDATION', 'Enter birth date and month.');
    }
    if (findPerson(digits)) {
      throw apiError(
        409,
        'MOBILE_TAKEN',
        'This mobile is already registered. Login to My Space instead.'
      );
    }
    const profile = {
      ...body,
      fullName,
      mobile: digits,
      roles: rolesForMobile(digits)
    };
    delete profile.password;
    upsertPerson(profile);
    const temporaryPassword = composedPassword(profile);
    return {
      data: {
        profile: { mobile: profile.mobile, fullName: profile.fullName, roles: profile.roles },
        temporaryPassword
      }
    };
  },

  async getMyProfile() {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    const session = readSession();
    const profile = findPerson(session.mobile);
    if (!profile) throw apiError(404, 'NOT_FOUND', 'Profile not found.');
    return { data: { ...profile, roles: rolesForMobile(session.mobile) } };
  },

  async updateMyProfile(body) {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    const session = readSession();
    const existing = findPerson(session.mobile);
    if (!existing) throw apiError(404, 'NOT_FOUND', 'Profile not found.');
    const next = {
      ...existing,
      ...body,
      mobile: session.mobile,
      roles: rolesForMobile(session.mobile),
      password: existing.password
    };
    upsertPerson(next);
    setSession(next);
    return { data: next };
  },

  async searchPeople(mobileQuery) {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    if (rolesForMobile(readSession().mobile).indexOf('pssm_admin') < 0) {
      throw apiError(403, 'FORBIDDEN', 'PSSM Admin only.');
    }
    const digits = normalizeMobile(mobileQuery);
    if (!digits) throw apiError(400, 'VALIDATION', 'Enter a mobile number.');
    const people = readPeople();
    const matches = Object.keys(people)
      .filter((mobile) => mobile.indexOf(digits) >= 0 || digits.indexOf(mobile) >= 0)
      .map((mobile) => {
        const person = people[mobile];
        return {
          mobile,
          fullName: person.fullName,
          pyramidCenter: person.pyramidCenter || '',
          roles: rolesForMobile(mobile)
        };
      })
      .sort((a, b) => String(a.fullName || '').localeCompare(String(b.fullName || '')));
    if (!matches.length) throw apiError(404, 'NOT_FOUND', 'No person found for that mobile.');
    return { data: matches };
  },

  async updateRoles(mobile, roles) {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    if (rolesForMobile(readSession().mobile).indexOf('pssm_admin') < 0) {
      throw apiError(403, 'FORBIDDEN', 'PSSM Admin only.');
    }
    const digits = normalizeMobile(mobile);
    if (!findPerson(digits)) throw apiError(404, 'NOT_FOUND', 'No joined person found for that mobile.');
    const keepAdmin = rolesForMobile(digits).indexOf('pssm_admin') >= 0;
    const next = normalizeAssignableRoles(roles);
    if (keepAdmin) next.unshift('pssm_admin');
    const result = writeRolesForMobile(digits, next);
    return { data: { mobile: digits, roles: result.roles } };
  },

  async removePerson(mobile) {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    if (rolesForMobile(readSession().mobile).indexOf('pssm_admin') < 0) {
      throw apiError(403, 'FORBIDDEN', 'Only PSSM Admin can remove a person.');
    }
    const digits = normalizeMobile(mobile);
    const session = readSession();
    if (session && normalizeMobile(session.mobile) === digits) {
      throw apiError(409, 'CONFLICT', 'You cannot remove your own account while signed in.');
    }
    if (!findPerson(digits)) throw apiError(404, 'NOT_FOUND', 'No joined person found for that mobile.');
    const people = readPeople();
    delete people[digits];
    savePeople(people);
    const map = readRoleAssignments();
    delete map[digits];
    saveRoleAssignments(map);
    return { data: { ok: true } };
  },

  async claimAdmin() {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    if (countPssmAdmins() > 0) throw apiError(409, 'CONFLICT', 'A PSSM Admin is already assigned.');
    const session = readSession();
    const roles = rolesForMobile(session.mobile).filter((id) => id !== 'pssm_admin');
    roles.unshift('pssm_admin');
    const result = writeRolesForMobile(session.mobile, roles);
    const profile = findPerson(session.mobile);
    if (profile) setSession({ ...profile, roles: result.roles });
    return { data: { roles: result.roles } };
  },

  async listEvents() {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    const list = readJson(EVENTS_KEY, []);
    return { data: Array.isArray(list) ? list : [] };
  },

  async searchPlaces({ kind = 'urban', q = '', limit = 25 } = {}) {
    const normalizedKind = kind === 'rural' ? 'rural' : 'urban';
    const query = String(q || '')
      .trim()
      .toLowerCase();
    const size = Math.min(Math.max(Number(limit) || 25, 1), 50);
    const rows = readPlaces()
      .filter((p) => p.kind === normalizedKind)
      .filter((p) => {
        if (!query) return true;
        const hay = [p.name, p.town, p.district, p.state, p.country]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0) || a.name.localeCompare(b.name))
      .slice(0, size);
    return { data: rows };
  },

  async rememberPlace(body) {
    const kind = body?.kind === 'rural' ? 'rural' : 'urban';
    let name = String(body?.name || '').trim();
    if (!name) {
      name = String(kind === 'urban' ? body?.city || '' : body?.village || '').trim();
    }
    if (!name) throw apiError(400, 'VALIDATION', 'Enter a place name.');
    const state = String(body?.state || '').trim();
    const country = String(body?.country || '').trim() || 'India';
    const town = String(body?.town || '').trim() || null;
    const district = String(body?.district || '').trim() || null;
    const list = readPlaces();
    const idx = list.findIndex(
      (p) =>
        p.kind === kind &&
        p.name.toLowerCase() === name.toLowerCase() &&
        String(p.state || '').toLowerCase() === state.toLowerCase() &&
        String(p.country || '').toLowerCase() === country.toLowerCase()
    );
    if (idx >= 0) {
      const next = {
        ...list[idx],
        town: town || list[idx].town,
        district: district || list[idx].district,
        usageCount: (list[idx].usageCount || 0) + 1,
        label: placeLabel({
          name,
          district: district || list[idx].district,
          state,
          country
        })
      };
      list[idx] = next;
      savePlaces(list);
      return { data: next };
    }
    const created = toPlaceRow(
      {
        id: `user_${Date.now()}`,
        kind,
        name,
        town,
        district,
        state: state || null,
        country,
        usageCount: 1
      },
      list.length
    );
    list.push(created);
    savePlaces(list);
    return { data: created };
  },

  async createEvent({ name, startDate, endDate }) {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    const session = readSession();
    if (rolesForMobile(session.mobile).indexOf('event_organizer') < 0) {
      throw apiError(403, 'FORBIDDEN', 'Only an Event Organizer can create an event.');
    }
    const eventName = String(name || '').trim();
    const start = String(startDate || '').trim();
    const end = String(endDate || '').trim();
    if (!eventName) throw apiError(400, 'VALIDATION', 'Enter the event name.');
    if (!start) throw apiError(400, 'VALIDATION', 'Enter the start date.');
    if (!end) throw apiError(400, 'VALIDATION', 'Enter the end date.');
    if (end < start) throw apiError(400, 'VALIDATION', 'End date must be on or after the start date.');
    const event = {
      id: `evt_${Date.now()}`,
      name: eventName,
      startDate: start,
      endDate: end,
      createdBy: session.mobile,
      createdAt: Date.now()
    };
    const list = readJson(EVENTS_KEY, []);
    const next = Array.isArray(list) ? list : [];
    next.unshift(event);
    writeJson(EVENTS_KEY, next);
    return { data: event };
  },

  countPssmAdmins,
  ASSIGNABLE_ROLE_IDS
};
