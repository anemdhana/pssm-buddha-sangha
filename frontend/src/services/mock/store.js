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
import seedCenters from '../../data/sangha_pyramid_centers.json';
import { hotelPlaceholderImage } from '../../utils/hotelImage.js';

const PEOPLE_KEY = 'pssm_sangha_people';
const SESSION_KEY = 'pssm_sangha_session';
const EVENTS_KEY = 'pssm_events';
const ROLE_ASSIGN_KEY = 'pssm_role_assignments';
const PLACES_KEY = 'pssm_sangha_places';
const CENTERS_KEY = 'pssm_sangha_pyramid_centers';
const STAY_BOOKINGS_KEY = 'pssm_stay_bookings';
const HOTELS_KEY = 'pssm_hotels';
const ALLOTMENTS_KEY = 'pssm_stay_allotments';
const ALLOTMENTS_SEED_KEY = 'pssm_stay_allotments_seed';
/** Bump to force-reset localStorage allotments (clears duplicate room assignments). */
const ALLOTMENTS_SEED_VERSION = '2';

const SAMPLE_ADMIN = {
  fullName: 'Srinivasa Rao',
  mobile: '7093405071',
  email: 'srinivasa@pssm.example',
  gender: 'male',
  age: 'adult',
  meditation: '6',
  profession: 'Administrator',
  birthDate: '01',
  birthMonth: '01',
  language: 'Telugu',
  pyramidCenter: 'Santh Kabir Das Pyramid Centre',
  sinceYear: '2010',
  place: { kind: 'urban', city: 'Hyderabad', state: 'Telangana', country: 'India' },
  members: [],
  roles: ['pssm_admin']
};

const SAMPLE_PEOPLE = [
  {
    fullName: 'Chaitanya Krishna',
    mobile: '9246470416',
    gender: 'male',
    age: 'adult',
    meditation: '5',
    profession: 'Teacher',
    birthDate: '15',
    birthMonth: '08',
    language: 'Telugu',
    pyramidCenter: 'Himalaya Pyramid Meditation Centre',
    sinceYear: '2016',
    place: { kind: 'urban', city: 'Vijayawada', state: 'Andhra Pradesh', country: 'India' },
    members: [],
    roles: ['event_organizer']
  },
  {
    fullName: 'Sowjanya Lakshmi',
    mobile: '9845055103',
    gender: 'female',
    age: 'adult',
    meditation: '4',
    profession: 'Nurse',
    birthDate: '22',
    birthMonth: '03',
    language: 'Kannada',
    pyramidCenter: 'Jayanagar Pyramid Care Centre',
    sinceYear: '2020',
    place: { kind: 'urban', city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    members: [],
    roles: ['pyramid_sevadal']
  },
  {
    fullName: 'Meenakshi Devi',
    mobile: '9966362691',
    gender: 'female',
    age: 'adult',
    meditation: '3',
    profession: 'Accountant',
    birthDate: '10',
    birthMonth: '05',
    language: 'Telugu',
    pyramidCenter: 'Atma Ganga Pyramid Dhyana Kendram',
    sinceYear: '2019',
    place: { kind: 'urban', city: 'Hyderabad', state: 'Telangana', country: 'India' },
    members: [],
    roles: ['accommodation_volunteer', 'pmma_member']
  },
  {
    fullName: 'Subhash Reddy',
    mobile: '7780254680',
    gender: 'male',
    age: 'adult',
    meditation: '5',
    profession: 'Volunteer coordinator',
    birthDate: '14',
    birthMonth: '02',
    language: 'Telugu',
    pyramidCenter: 'Brahmarshi Patriji Pyramid Care Centre',
    sinceYear: '2015',
    place: { kind: 'urban', city: 'Guntur', state: 'Andhra Pradesh', country: 'India' },
    members: [],
    roles: ['accommodation_admin']
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

function toCenterRow(raw, index) {
  const name = String(raw.name || '').trim();
  const locality = String(raw.locality || '').trim();
  const city = String(raw.city || '').trim();
  const state = String(raw.state || '').trim();
  const country = String(raw.country || '').trim();
  const address = String(raw.address || '').trim();
  return {
    id: raw.id || `seed_center_${index}`,
    name,
    locality,
    city,
    state,
    country,
    address,
    usageCount: Number(raw.usageCount) || 0,
    label: locality ? `${name} — ${locality}` : name
  };
}

function ensureCenters() {
  const seeded = (Array.isArray(seedCenters) ? seedCenters : []).map((row, i) => toCenterRow(row, i));
  const existing = readJson(CENTERS_KEY, null);
  if (!Array.isArray(existing) || existing.length === 0) {
    writeJson(CENTERS_KEY, seeded);
    return seeded;
  }
  const byName = new Map(
    existing.map((c) => [String(c.name || '').toLowerCase(), c]).filter(([name]) => name)
  );
  const merged = seeded.map((seed) => {
    const prev = byName.get(seed.name.toLowerCase());
    if (!prev) return seed;
    return {
      ...seed,
      id: prev.id || seed.id,
      usageCount: Number(prev.usageCount) || seed.usageCount
    };
  });
  existing
    .filter((c) => String(c.id || '').startsWith('user_'))
    .forEach((userCenter) => {
      const dup = merged.some(
        (c) => c.name.toLowerCase() === String(userCenter.name || '').toLowerCase()
      );
      if (!dup) merged.push(toCenterRow(userCenter, merged.length));
    });
  writeJson(CENTERS_KEY, merged);
  return merged;
}

function readCenters() {
  return ensureCenters();
}

function saveCenters(list) {
  writeJson(CENTERS_KEY, list);
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

const SAMPLE_HOTELS = [
  {
    id: 'htl_sample_sai_prakash',
    eventId: 'evt_sample_anandotsavam',
    name: 'Hotel Sai Prakash',
    address: 'Public Garden Road, near Nampally Exhibition Grounds, Hyderabad',
    contact: '040-23203131',
    distanceKm: 0.4,
    active: true,
    reserved: false,
    rooms: [
      { roomNumber: '231', capacity: 4, kind: 'regular', roomType: 'ac', genderAllowed: '', status: 'available' },
      { roomNumber: '232', capacity: 4, kind: 'regular', roomType: 'ac', genderAllowed: '', status: 'available' },
      { roomNumber: '233', capacity: 4, kind: 'regular', roomType: 'non_ac', genderAllowed: '', status: 'available' },
      { roomNumber: '234', capacity: 4, kind: 'regular', roomType: 'non_ac', genderAllowed: '', status: 'available' }
    ],
    createdBy: '7780254680',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'htl_sample_three_castle',
    eventId: 'evt_sample_anandotsavam',
    name: 'Three Castle Executive',
    address: 'Nampally Station Road, beside Exhibition Grounds, Hyderabad',
    contact: '040-24605678',
    distanceKm: 0.6,
    active: true,
    reserved: true,
    rooms: [
      { roomNumber: '101', capacity: 3, kind: 'regular', roomType: 'ac', genderAllowed: '', status: 'available' },
      { roomNumber: '103', capacity: 3, kind: 'regular', roomType: 'non_ac', genderAllowed: '', status: 'available' }
    ],
    createdBy: '7780254680',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'htl_sample_abids_inn',
    eventId: 'evt_sample_anandotsavam',
    name: 'Abids Comfort Inn',
    address: 'Troop Bazaar, Abids, Hyderabad (towards Exhibition Grounds)',
    contact: '040-23204567',
    distanceKm: 1.4,
    active: true,
    reserved: false,
    rooms: [
      { roomNumber: '201', capacity: 3, kind: 'regular', roomType: 'ac', genderAllowed: '', status: 'available' },
      {
        roomNumber: 'D-G1',
        capacity: 24,
        kind: 'dormitory',
        roomType: 'ac',
        genderAllowed: 'gents',
        status: 'available'
      },
      {
        roomNumber: 'D-L1',
        capacity: 20,
        kind: 'dormitory',
        roomType: 'non_ac',
        genderAllowed: 'ladies',
        status: 'available'
      }
    ],
    createdBy: '7780254680',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'htl_sample_basheerbagh_lodge',
    eventId: 'evt_sample_anandotsavam',
    name: 'Basheerbagh Stay Lodge',
    address: 'Near Assembly, Basheerbagh Road, Hyderabad',
    contact: '040-23207890',
    distanceKm: 2.2,
    active: false,
    reserved: false,
    rooms: [
      { roomNumber: '11', capacity: 2, kind: 'regular', roomType: 'non_ac', genderAllowed: '', status: 'available' },
      {
        roomNumber: 'HALL-A',
        capacity: 40,
        kind: 'hall',
        roomType: 'non_ac',
        genderAllowed: 'gents',
        status: 'available'
      }
    ],
    createdBy: '7780254680',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'htl_sample_lakdikapul_residency',
    eventId: 'evt_sample_anandotsavam',
    name: 'Lakdi-ka-pul Residency',
    address: 'Opposite Railway Bridge, Lakdi-ka-pul, Hyderabad',
    contact: '040-23311234',
    distanceKm: 2.8,
    active: true,
    reserved: false,
    rooms: [
      { roomNumber: '501', capacity: 4, kind: 'regular', roomType: 'ac', genderAllowed: '', status: 'available' },
      {
        roomNumber: 'HALL-L',
        capacity: 35,
        kind: 'hall',
        roomType: 'ac',
        genderAllowed: 'ladies',
        status: 'available'
      }
    ],
    createdBy: '7780254680',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'htl_sample_banjara_park',
    eventId: 'evt_sample_dussehra',
    name: 'Banjara Park Hotel',
    address: 'Road No. 1, Banjara Hills, Hyderabad',
    contact: '040-23356677',
    distanceKm: 4.5,
    active: true,
    reserved: true,
    rooms: [
      { roomNumber: '701', capacity: 2, kind: 'regular', roomType: 'ac', genderAllowed: '', status: 'available' },
      { roomNumber: '704', capacity: 3, kind: 'regular', roomType: 'non_ac', genderAllowed: '', status: 'available' }
    ],
    createdBy: '7780254680',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'htl_sample_mehdipatnam_yatra',
    eventId: 'evt_sample_dussehra',
    name: 'Mehdipatnam Yatra Nest',
    address: 'Near Sarojini Devi Eye Hospital, Mehdipatnam, Hyderabad',
    contact: '040-23534567',
    distanceKm: 5.2,
    active: true,
    reserved: false,
    rooms: [
      { roomNumber: 'A1', capacity: 4, kind: 'regular', roomType: 'non_ac', genderAllowed: '', status: 'available' },
      {
        roomNumber: 'D-L2',
        capacity: 28,
        kind: 'dormitory',
        roomType: 'non_ac',
        genderAllowed: 'ladies',
        status: 'available'
      },
      {
        roomNumber: 'HALL-B',
        capacity: 50,
        kind: 'hall',
        roomType: 'non_ac',
        genderAllowed: 'gents',
        status: 'available'
      }
    ],
    createdBy: '7780254680',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'htl_sample_koti_guest',
    eventId: 'evt_sample_dussehra',
    name: 'Koti Guest House (Inactive demo)',
    address: 'Sultan Bazar, Koti, Hyderabad',
    contact: '040-24751212',
    distanceKm: 1.8,
    active: false,
    reserved: true,
    rooms: [
      { roomNumber: '1', capacity: 2, kind: 'regular', roomType: 'ac', genderAllowed: '', status: 'available' },
      { roomNumber: '2', capacity: 2, kind: 'regular', roomType: 'non_ac', genderAllowed: '', status: 'available' }
    ],
    createdBy: '7780254680',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  }
].map((hotel) => ({
  ...hotel,
  image: hotelPlaceholderImage(hotel.name)
}));

function readHotels() {
  const list = readJson(HOTELS_KEY, null);
  if (!Array.isArray(list) || list.length === 0) {
    writeJson(HOTELS_KEY, SAMPLE_HOTELS);
    return SAMPLE_HOTELS.slice();
  }
  // One-time migrate older mock rows that had no event link.
  if (list.some((h) => h && !String(h.eventId || '').trim())) {
    writeJson(HOTELS_KEY, SAMPLE_HOTELS);
    return SAMPLE_HOTELS.slice();
  }
  // Soft-fill sample hotel thumbnails when missing (keep custom hotels intact).
  const sampleById = Object.fromEntries(SAMPLE_HOTELS.map((h) => [h.id, h]));
  let changed = false;
  const next = list.map((hotel) => {
    if (!hotel || String(hotel.image || '').trim()) return hotel;
    const sample = sampleById[hotel.id];
    if (!sample?.image) return { ...hotel, image: '' };
    changed = true;
    return { ...hotel, image: sample.image };
  });
  if (changed) writeJson(HOTELS_KEY, next);
  return next;
}

function writeHotels(list) {
  writeJson(HOTELS_KEY, Array.isArray(list) ? list : []);
}

const SAMPLE_ALLOTMENTS = [
  {
    id: 'allot_sample_meenakshi',
    eventId: 'evt_sample_anandotsavam',
    eventName: 'Dhyana Dussera Anandotsavam - 2026',
    bookingId: 'stay_sample_meenakshi_alone',
    plan: 'free',
    status: 'checked_in',
    hotelId: 'htl_sample_sai_prakash',
    hotelName: 'Hotel Sai Prakash',
    roomNumber: '231',
    roomType: 'ac',
    roomKind: 'regular',
    familyMobile: '9966362691',
    familyFullName: 'Meenakshi Devi',
    place: { kind: 'urban', city: 'Hyderabad', state: 'Telangana', country: 'India' },
    guests: [
      {
        name: 'Meenakshi Devi',
        relation: '',
        mobile: '9966362691',
        gender: 'female',
        age: 'adult',
        livePhoto: '',
        primary: true
      }
    ],
    checkInDate: '2026-10-26',
    checkOutDate: '2026-11-05',
    personCount: 1
  },
  {
    id: 'allot_sample_anitha',
    eventId: 'evt_sample_anandotsavam',
    eventName: 'Dhyana Dussera Anandotsavam - 2026',
    bookingId: 'stay_sample_anitha_paid',
    plan: 'paid',
    status: 'allotted',
    hotelId: 'htl_sample_sai_prakash',
    hotelName: 'Hotel Sai Prakash',
    roomNumber: '232',
    roomType: 'ac',
    roomKind: 'regular',
    familyMobile: '9395324465',
    familyFullName: 'Anitha Reddy',
    place: { kind: 'urban', city: 'Hyderabad', state: 'Telangana', country: 'India' },
    guests: [
      {
        name: 'Anitha Reddy',
        relation: '',
        mobile: '9395324465',
        gender: 'female',
        age: 'adult',
        livePhoto: '',
        primary: true
      }
    ],
    checkInDate: '2026-10-29',
    checkOutDate: '2026-10-30',
    personCount: 1
  },
  {
    id: 'allot_sample_veeraiah',
    eventId: 'evt_sample_anandotsavam',
    eventName: 'Dhyana Dussera Anandotsavam - 2026',
    bookingId: 'stay_sample_veeraiah_rural_family',
    plan: 'free',
    status: 'allotted',
    hotelId: 'htl_sample_lakdikapul_residency',
    hotelName: 'Lakdi-ka-pul Residency',
    roomNumber: '501',
    roomType: 'ac',
    roomKind: 'regular',
    familyMobile: '9959129737',
    familyFullName: 'Veeraiah',
    place: { kind: 'rural', village: 'Chilakaluripet', state: 'Andhra Pradesh', country: 'India' },
    guests: [
      {
        name: 'Veeraiah',
        relation: '',
        mobile: '9959129737',
        gender: 'male',
        age: 'senior',
        livePhoto: '',
        primary: true
      },
      {
        name: 'Padma',
        relation: 'Spouse',
        mobile: '7382463452',
        gender: 'female',
        age: 'senior',
        livePhoto: '',
        primary: false
      },
      {
        name: 'Karthik',
        relation: 'Child',
        mobile: '9542495504',
        gender: 'male',
        age: 'adult',
        livePhoto: '',
        primary: false
      }
    ],
    checkInDate: '2026-10-26',
    checkOutDate: '2026-11-05',
    personCount: 3
  },
  {
    id: 'allot_sample_vasavi',
    eventId: 'evt_sample_anandotsavam',
    eventName: 'Dhyana Dussera Anandotsavam - 2026',
    bookingId: 'stay_sample_vasavi_alone',
    plan: 'free',
    status: 'allotted',
    hotelId: 'htl_sample_three_castle',
    hotelName: 'Three Castle Executive',
    roomNumber: '101',
    roomType: 'ac',
    roomKind: 'regular',
    familyMobile: '9032123366',
    familyFullName: 'Vasavi Kumari',
    place: { kind: 'urban', city: 'Hyderabad', state: 'Telangana', country: 'India' },
    guests: [
      {
        name: 'Vasavi Kumari',
        relation: '',
        mobile: '9032123366',
        gender: 'female',
        age: 'adult',
        livePhoto: '',
        primary: true
      }
    ],
    checkInDate: '2026-10-28',
    checkOutDate: '2026-10-30',
    personCount: 1
  },
  {
    id: 'allot_sample_sowjanya',
    eventId: 'evt_sample_dussehra',
    eventName: 'Dussehra Sangeetha Dhyana Maha Yagnam',
    bookingId: 'stay_sample_sowjanya_couple',
    plan: 'free',
    status: 'checked_in',
    hotelId: 'htl_sample_abids_inn',
    hotelName: 'Abids Comfort Inn',
    roomNumber: '201',
    roomType: 'ac',
    roomKind: 'regular',
    familyMobile: '9845055103',
    familyFullName: 'Sowjanya Lakshmi',
    place: { kind: 'urban', city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    guests: [
      {
        name: 'Sowjanya Lakshmi',
        relation: '',
        mobile: '9845055103',
        gender: 'female',
        age: 'adult',
        livePhoto: '',
        primary: true
      },
      {
        name: 'Venkat Rao',
        relation: 'Spouse',
        mobile: '9379060510',
        gender: 'male',
        age: 'adult',
        livePhoto: '',
        primary: false
      }
    ],
    checkInDate: '2026-10-15',
    checkOutDate: '2026-10-24',
    personCount: 2
  },
  {
    id: 'allot_sample_uma',
    eventId: 'evt_sample_dussehra',
    eventName: 'Dussehra Sangeetha Dhyana Maha Yagnam',
    bookingId: 'stay_sample_uma_paid',
    plan: 'paid',
    status: 'allotted',
    hotelId: 'htl_sample_abids_inn',
    hotelName: 'Abids Comfort Inn',
    roomNumber: 'D-L1',
    roomType: 'non_ac',
    roomKind: 'dormitory',
    familyMobile: '8667684104',
    familyFullName: 'Uma Maheshwari',
    place: { kind: 'urban', city: 'Hyderabad', state: 'Telangana', country: 'India' },
    guests: [
      {
        name: 'Uma Maheshwari',
        relation: '',
        mobile: '8667684104',
        gender: 'female',
        age: 'adult',
        livePhoto: '',
        primary: true
      }
    ],
    checkInDate: '2026-10-15',
    checkOutDate: '2026-10-24',
    personCount: 1
  }
];

function allotmentGuestKey(guest, bookingId = '') {
  const mobile = normalizeMobile(guest?.mobile);
  if (mobile) return `m:${mobile}`;
  const name = String(guest?.name || '')
    .trim()
    .toLowerCase();
  if (name) return `n:${String(bookingId || '').trim()}:${name}`;
  return '';
}

/** Remove guests (by mobile/name) from existing event allotments so a person is never in two rooms. */
function stripGuestsFromEventAllotments(list, eventId, guestKeys) {
  const id = String(eventId || '').trim();
  if (!id || !guestKeys?.size) return Array.isArray(list) ? list.slice() : [];
  return (Array.isArray(list) ? list : [])
    .map((row) => {
      if (!row || String(row.eventId || '') !== id) return row;
      const guests = Array.isArray(row.guests) ? row.guests : [];
      const kept = guests.filter((g) => {
        const key = allotmentGuestKey(g, row.bookingId);
        return !key || !guestKeys.has(key);
      });
      if (kept.length === guests.length) return row;
      if (!kept.length) return null;
      const primary = kept.find((g) => g.primary) || kept[0] || {};
      return {
        ...row,
        guests: kept,
        personCount: kept.length,
        familyMobile: primary.mobile || '',
        familyFullName: primary.name || ''
      };
    })
    .filter(Boolean);
}

function allotmentsHaveDuplicatePeople(list) {
  const seen = new Set();
  for (const row of Array.isArray(list) ? list : []) {
    if (!row) continue;
    const eventId = String(row.eventId || '');
    const guests = Array.isArray(row.guests) ? row.guests : [];
    for (const g of guests) {
      const key = allotmentGuestKey(g, row.bookingId);
      if (!key) continue;
      const full = `${eventId}|${key}`;
      if (seen.has(full)) return true;
      seen.add(full);
    }
  }
  return false;
}

function readAllotments() {
  const seeded = String(readJson(ALLOTMENTS_SEED_KEY, '') || '');
  const list = readJson(ALLOTMENTS_KEY, null);
  const needsReset =
    seeded !== ALLOTMENTS_SEED_VERSION ||
    !Array.isArray(list) ||
    list.length === 0 ||
    allotmentsHaveDuplicatePeople(list);
  if (needsReset) {
    writeJson(ALLOTMENTS_KEY, SAMPLE_ALLOTMENTS);
    writeJson(ALLOTMENTS_SEED_KEY, ALLOTMENTS_SEED_VERSION);
    return SAMPLE_ALLOTMENTS.slice();
  }
  return list;
}

function requireHotelAdmin() {
  if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
  const session = readSession();
  const roles = rolesForMobile(session.mobile);
  if (roles.indexOf('accommodation_admin') < 0 && roles.indexOf('pssm_admin') < 0) {
    throw apiError(403, 'FORBIDDEN', 'Only an Accommodation Admin can manage hotels and rooms.');
  }
  return session;
}

function requireHotelReader() {
  if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
  const session = readSession();
  const roles = rolesForMobile(session.mobile);
  const ok =
    roles.indexOf('accommodation_admin') >= 0 ||
    roles.indexOf('accommodation_volunteer') >= 0 ||
    roles.indexOf('event_organizer') >= 0 ||
    roles.indexOf('pssm_admin') >= 0;
  if (!ok) throw apiError(403, 'FORBIDDEN', 'Not allowed to view hotels.');
  return session;
}

function requireAllotmentManager() {
  return requireHotelReader();
}

function enrichHotel(hotel) {
  const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : [];
  const capacityTotal = rooms.reduce((sum, room) => sum + Math.max(0, Number(room.capacity) || 0), 0);
  return {
    ...hotel,
    rooms,
    roomCount: rooms.length,
    capacityTotal
  };
}

function normalizeHotelPayload(payload, { id, createdBy, createdAt, eventId: eventIdOpt }) {
  const name = String(payload?.name || '').trim();
  const address = String(payload?.address || '').trim();
  const contact = String(payload?.contact || '').trim();
  const image = String(payload?.image || '').trim();
  const distanceKm = Number(payload?.distanceKm);
  const eventId = String(eventIdOpt || payload?.eventId || '').trim();
  if (!eventId) throw apiError(400, 'VALIDATION', 'Select an event before adding a hotel.');
  if (!name) throw apiError(400, 'VALIDATION', 'Enter the hotel name.');
  if (!address) throw apiError(400, 'VALIDATION', 'Enter the hotel address.');
  if (!contact) throw apiError(400, 'VALIDATION', 'Enter the hotel contact number.');
  if (!(distanceKm >= 0)) {
    throw apiError(400, 'VALIDATION', 'Enter distance from the event place in kilometres (0 or more).');
  }
  const roomsIn = Array.isArray(payload?.rooms) ? payload.rooms : [];
  const seen = {};
  const rooms = roomsIn.map((room, index) => {
    const roomNumber = String(room?.roomNumber || '').trim();
    if (!roomNumber) {
      throw apiError(400, 'VALIDATION', `Enter room number for room row ${index + 1}.`);
    }
    const key = roomNumber.toLowerCase();
    if (seen[key]) {
      throw apiError(400, 'VALIDATION', `Room number ${roomNumber} is duplicated in this hotel.`);
    }
    seen[key] = true;
    const capacity = Number(room?.capacity);
    if (!(capacity >= 1)) {
      throw apiError(400, 'VALIDATION', `Enter capacity (persons) for room ${roomNumber}.`);
    }
    let kind = String(room?.kind || 'regular').trim().toLowerCase();
    if (kind === 'dorm') kind = 'dormitory';
    if (kind !== 'dormitory' && kind !== 'hall') kind = 'regular';
    const roomType = String(room?.roomType || 'ac').trim().toLowerCase() === 'non_ac' ? 'non_ac' : 'ac';
    let genderAllowed = '';
    if (kind === 'dormitory' || kind === 'hall') {
      const g = String(room?.genderAllowed || '').trim().toLowerCase();
      if (g === 'ladies' || g === 'ladies_only' || g === 'female') genderAllowed = 'ladies';
      else if (g === 'gents' || g === 'gents_only' || g === 'male') genderAllowed = 'gents';
      else {
        throw apiError(
          400,
          'VALIDATION',
          `Choose who may stay (Gents or Ladies) for dormitory/hall room ${roomNumber}.`
        );
      }
    }
    return {
      roomNumber,
      capacity,
      kind,
      roomType,
      genderAllowed,
      status: 'available'
    };
  });
  return {
    id,
    eventId,
    name,
    address,
    contact,
    image,
    distanceKm,
    active: payload?.active === false ? false : true,
    reserved: Boolean(payload?.reserved),
    rooms,
    createdBy,
    createdAt,
    updatedAt: new Date().toISOString()
  };
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

function familySnapshotFromForm(form, digits, fullName) {
  const snap = JSON.parse(JSON.stringify(form || {}));
  snap.fullName = fullName;
  snap.mobile = digits;
  delete snap.password;
  return snap;
}

function enrichStayBookingRow(booking) {
  if (!booking) return booking;
  const guests = Array.isArray(booking.guests) ? booking.guests : [];
  const personCount = guests.length;
  const family = booking.family || {
    fullName: booking.familyFullName,
    mobile: booking.familyMobile,
    place: booking.place || {},
    members: []
  };
  const place = booking.place || family.place || {};
  return {
    ...booking,
    guests,
    family,
    place,
    personCount,
    familyCount: Math.max(0, personCount - 1)
  };
}

function readStayBookings() {
  const list = readJson(STAY_BOOKINGS_KEY, []);
  return Array.isArray(list) ? list : [];
}

function writeStayBookings(list) {
  writeJson(STAY_BOOKINGS_KEY, Array.isArray(list) ? list : []);
}

function buildStayGuestsFromFamily(form, eventStart, eventEnd) {
  const fullName = String(form.fullName || '').trim();
  const digits = normalizeMobile(form.mobile);
  function validateStay(startRaw, endRaw, who) {
    const start = String(startRaw || '').trim();
    const end = String(endRaw || '').trim();
    if (!start) throw apiError(400, 'VALIDATION', `Enter stay start date for ${who}.`);
    if (!end) throw apiError(400, 'VALIDATION', `Enter stay end date for ${who}.`);
    if (end < start) {
      throw apiError(400, 'VALIDATION', `Stay end must be on or after stay start for ${who}.`);
    }
    if (eventStart && start < eventStart) {
      throw apiError(400, 'VALIDATION', `Stay start is before the event for ${who}.`);
    }
    if (eventEnd && end > eventEnd) {
      throw apiError(400, 'VALIDATION', `Stay end is after the event for ${who}.`);
    }
    return { stayStartDate: start, stayEndDate: end };
  }
  const guests = [
    {
      name: fullName,
      relation: '',
      mobile: digits,
      gender: form.gender || '',
      age: form.age || '',
      primary: true,
      ...validateStay(form.stayStartDate, form.stayEndDate, 'your')
    }
  ];
  (Array.isArray(form.members) ? form.members : []).forEach((member, index) => {
    const name = String((member && member.name) || '').trim() || `Family member ${index + 1}`;
    guests.push({
      name,
      relation: (member && member.relation) || '',
      mobile: normalizeMobile(member && member.mobile),
      gender: (member && member.gender) || '',
      age: (member && member.age) || '',
      primary: false,
      ...validateStay(member && member.stayStartDate, member && member.stayEndDate, name)
    });
  });
  return { guests, fullName, digits };
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

  async lookupProfileByMobile(mobileQuery) {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    const roles = rolesForMobile(readSession().mobile);
    const canLookup =
      roles.indexOf('accommodation_volunteer') >= 0 ||
      roles.indexOf('event_organizer') >= 0 ||
      roles.indexOf('pssm_admin') >= 0;
    if (!canLookup) throw apiError(403, 'FORBIDDEN', 'Role not allowed.');
    const digits = normalizeMobile(mobileQuery);
    if (!digits || digits.length < 10) {
      throw apiError(400, 'VALIDATION', 'Enter a mobile number with at least 10 digits.');
    }
    const profile = findPerson(digits);
    if (!profile) throw apiError(404, 'NOT_FOUND', 'No sangha member found for that mobile.');
    const { password, ...rest } = profile;
    return { data: { ...rest, mobile: digits, roles: rolesForMobile(digits) } };
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

  async searchPyramidCenters({ q = '', limit = 25 } = {}) {
    const query = String(q || '')
      .trim()
      .toLowerCase();
    const size = Math.min(Math.max(Number(limit) || 25, 1), 50);
    const rows = readCenters()
      .filter((c) => {
        if (!query) return true;
        const hay = [c.name, c.locality, c.city, c.state, c.address]
          .map((v) => String(v || '').toLowerCase())
          .join(' ');
        return hay.includes(query);
      })
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0) || a.name.localeCompare(b.name))
      .slice(0, size);
    return { data: rows };
  },

  async rememberPyramidCenter(body) {
    const name = String(body?.name || body?.pyramidCenter || '').trim();
    if (!name) throw apiError(400, 'VALIDATION', 'Enter a pyramid center or group.');
    const list = readCenters();
    const idx = list.findIndex((c) => c.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) {
      const next = {
        ...list[idx],
        usageCount: (list[idx].usageCount || 0) + 1
      };
      list[idx] = next;
      saveCenters(list);
      return { data: next };
    }
    const created = toCenterRow(
      {
        id: `user_center_${Date.now()}`,
        name,
        usageCount: 1
      },
      list.length
    );
    list.push(created);
    saveCenters(list);
    return { data: created };
  },

  async createEvent({ name, startDate, endDate, location, expectedBudgetInr, meditationHoursPerDay }) {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    const session = readSession();
    if (rolesForMobile(session.mobile).indexOf('event_organizer') < 0) {
      throw apiError(403, 'FORBIDDEN', 'Only an Event Organizer can create an event.');
    }
    const eventName = String(name || '').trim();
    const start = String(startDate || '').trim();
    const end = String(endDate || '').trim();
    const place = String(location || '').trim();
    const budget = Number(expectedBudgetInr);
    if (!eventName) throw apiError(400, 'VALIDATION', 'Enter the event name.');
    if (!start) throw apiError(400, 'VALIDATION', 'Enter the start date.');
    if (!end) throw apiError(400, 'VALIDATION', 'Enter the end date.');
    if (end < start) throw apiError(400, 'VALIDATION', 'End date must be on or after the start date.');
    if (!place) throw apiError(400, 'VALIDATION', 'Enter the event location.');
    if (!(budget > 0)) {
      throw apiError(400, 'VALIDATION', 'Enter an expected budget greater than zero (INR).');
    }
    let hours = null;
    if (meditationHoursPerDay !== undefined && meditationHoursPerDay !== null && String(meditationHoursPerDay).trim() !== '') {
      hours = Number(meditationHoursPerDay);
      if (!(hours >= 0)) {
        throw apiError(400, 'VALIDATION', 'Meditation hours per day cannot be negative.');
      }
    }
    const event = {
      id: `evt_${Date.now()}`,
      name: eventName,
      startDate: start,
      endDate: end,
      location: place,
      expectedBudgetInr: budget,
      meditationHoursPerDay: hours,
      createdBy: session.mobile,
      createdAt: Date.now()
    };
    const list = readJson(EVENTS_KEY, []);
    const next = Array.isArray(list) ? list : [];
    next.unshift(event);
    writeJson(EVENTS_KEY, next);
    return { data: event };
  },

  async createStayBooking({ plan, eventId, eventName, registerFamily, family }) {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    const session = readSession();
    const roles = rolesForMobile(session.mobile);
    const canManage =
      roles.indexOf('accommodation_volunteer') >= 0 ||
      roles.indexOf('event_organizer') >= 0 ||
      roles.indexOf('pssm_admin') >= 0;
    const wantRegister = Boolean(registerFamily);
    if (wantRegister && !canManage) {
      throw apiError(403, 'FORBIDDEN', 'Only an Accommodation Volunteer can register a new visitor while booking.');
    }
    const eventKey = String(eventId || '').trim();
    if (!eventKey) throw apiError(400, 'VALIDATION', 'Select an event before booking.');
    const events = readJson(EVENTS_KEY, []);
    const known = Array.isArray(events) ? events.find((e) => e.id === eventKey) : null;
    const resolvedName =
      (known && known.name) || String(eventName || '').trim() || 'Event';
    const eventStart = known ? String(known.startDate || '').trim() : '';
    const eventEnd = known ? String(known.endDate || '').trim() : '';

    const form = family || {};
    const fullName = String(form.fullName || '').trim();
    const digits = normalizeMobile(form.mobile);
    if (!fullName) throw apiError(400, 'VALIDATION', 'Enter the visitor full name.');
    if (!digits) throw apiError(400, 'VALIDATION', 'Enter the visitor mobile number.');

    let temporaryPassword = null;
    let newlyRegistered = false;
    if (wantRegister) {
      if (findPerson(digits)) {
        throw apiError(
          409,
          'MOBILE_TAKEN',
          'This mobile is already registered. Book for them as an existing member, or use another mobile.'
        );
      }
      if (!form.birthDate || !form.birthMonth) {
        throw apiError(400, 'VALIDATION', 'Enter birth date and month.');
      }
      const profile = {
        ...form,
        fullName,
        mobile: digits,
        roles: []
      };
      delete profile.password;
      delete profile.stayStartDate;
      delete profile.stayEndDate;
      upsertPerson(profile);
      temporaryPassword = composedPassword(profile);
      newlyRegistered = true;
    } else if (digits !== normalizeMobile(session.mobile) && !canManage) {
      throw apiError(403, 'FORBIDDEN', 'You can only book accommodation for your own family.');
    }

    const { guests, fullName: nameLine, digits: mobileDigits } = buildStayGuestsFromFamily(
      { ...form, fullName, mobile: digits },
      eventStart,
      eventEnd
    );

    const booking = enrichStayBookingRow({
      id: `stay_${Date.now()}`,
      eventId: eventKey,
      eventName: resolvedName,
      plan: plan === 'paid' ? 'paid' : 'free',
      status: 'registered',
      familyMobile: mobileDigits,
      familyFullName: nameLine,
      registeredFamily: newlyRegistered,
      createdByMobile: session.mobile,
      bookedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      place: form.place || { kind: 'urban', country: 'India' },
      family: familySnapshotFromForm(form, mobileDigits, nameLine),
      guests
    });
    const next = readStayBookings();
    next.unshift(booking);
    writeStayBookings(next);

    const data = { booking };
    if (temporaryPassword) {
      data.temporaryPassword = temporaryPassword;
      data.registeredFamily = true;
    }
    return { data };
  },

  async listStayBookings(eventId, params = {}) {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    const session = readSession();
    const roles = rolesForMobile(session.mobile);
    const allowed =
      roles.indexOf('accommodation_volunteer') >= 0 ||
      roles.indexOf('pssm_admin') >= 0 ||
      roles.indexOf('event_organizer') >= 0;
    if (!allowed) {
      throw apiError(403, 'FORBIDDEN', 'Not allowed to view event registrations.');
    }
    const id = String(eventId || '').trim();
    if (!id) throw apiError(400, 'VALIDATION', 'Event id is required.');
    const q = String(params.q || '').trim().toLowerCase();
    const gender = String(params.gender || '').trim().toLowerCase();
    const ages = String(params.ages || '')
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    const meditation = String(params.meditation || '').trim().toLowerCase();
    const location = String(params.location || '').trim().toLowerCase();
    const stayRange = String(params.stayRange || '').trim();
    const page = Math.max(0, Number(params.page) || 0);
    const size = Math.min(100, Math.max(1, Number(params.size) || 24));

    const matchesBooking = (b) => {
      if (!b || b.eventId !== id) return false;
      const guests = Array.isArray(b.guests) ? b.guests : [];
      const family = b.family || {};
      if (q) {
        const hay = [b.familyFullName, b.familyMobile, ...guests.map((g) => `${g?.name || ''} ${g?.mobile || ''}`)]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (gender && !guests.some((g) => String(g?.gender || '').toLowerCase() === gender)) return false;
      if (ages.length && !guests.some((g) => ages.includes(String(g?.age || '').toLowerCase()))) return false;
      if (meditation && String(family.meditation || '').toLowerCase() !== meditation) return false;
      if (location) {
        const place = b.place || family.place || {};
        const labels = [place.city, place.district, place.name, place.village]
          .map((v) => String(v || '').trim().toLowerCase())
          .filter(Boolean);
        if (!labels.includes(location)) return false;
      }
      if (stayRange) {
        const [start, end] = stayRange.split('|');
        const primary = guests.find((g) => g?.primary) || guests[0];
        if (!primary || primary.stayStartDate !== start || primary.stayEndDate !== end) return false;
      }
      return true;
    };

    const matched = readStayBookings()
      .filter(matchesBooking)
      .sort((a, b) =>
        String(b.bookedAt || b.createdAt || '').localeCompare(String(a.bookedAt || a.createdAt || ''))
      )
      .map(enrichStayBookingRow);

    const total = matched.length;
    const items = matched.slice(page * size, page * size + size);
    let people = 0;
    let rural = 0;
    let urban = 0;
    matched.forEach((row) => {
      const count = Number(row.personCount) || (row.guests || []).length;
      people += count;
      if (row.place?.kind === 'rural') rural += count;
      else urban += count;
    });

    const eventBookings = readStayBookings()
      .filter((b) => b && b.eventId === id)
      .map(enrichStayBookingRow);
    const allotments = readAllotments().filter((a) => a && a.eventId === id);
    const allottedBookingIds = new Set(
      allotments.map((a) => String(a.bookingId || '').trim()).filter(Boolean)
    );
    const allottedMobiles = new Set(
      allotments.map((a) => normalizeMobile(a.familyMobile)).filter(Boolean)
    );
    let waitList = 0;
    let allotted = 0;
    eventBookings.forEach((row) => {
      const count = Number(row.personCount) || (row.guests || []).length;
      const mobile = normalizeMobile(row.familyMobile);
      const isAllotted =
        allottedBookingIds.has(String(row.id || '')) || (mobile && allottedMobiles.has(mobile));
      if (isAllotted) allotted += count;
      else waitList += count;
    });

    const locCounts = {};
    const rangeCounts = {};
    matched.forEach((row) => {
      const guests = Array.isArray(row.guests) ? row.guests.filter(Boolean) : [];
      const members = Array.isArray(row.family?.members) ? row.family.members.filter(Boolean) : [];
      const personCount = Math.max(
        Number(row.personCount) || 0,
        guests.length,
        members.length > 0 ? members.length + 1 : 0,
        1
      );
      const place = row.place || {};
      const loc =
        place.kind === 'rural'
          ? String(place.district || 'Rural')
          : String(place.city || place.name || 'Urban');
      locCounts[loc] = (locCounts[loc] || 0) + personCount;
      if (guests.length > 0) {
        guests.forEach((guest) => {
          if (!guest?.stayStartDate || !guest?.stayEndDate) return;
          const key = `${guest.stayStartDate}|${guest.stayEndDate}`;
          rangeCounts[key] = rangeCounts[key] || {
            key,
            label: `${guest.stayStartDate} to ${guest.stayEndDate}`,
            count: 0
          };
          rangeCounts[key].count += 1;
        });
      } else {
        const primary = row.family || {};
        if (primary.stayStartDate && primary.stayEndDate) {
          const key = `${primary.stayStartDate}|${primary.stayEndDate}`;
          rangeCounts[key] = rangeCounts[key] || {
            key,
            label: `${primary.stayStartDate} to ${primary.stayEndDate}`,
            count: 0
          };
          rangeCounts[key].count += personCount;
        }
      }
    });

    return {
      data: {
        items,
        total,
        page,
        size,
        totalPages: Math.ceil(total / size) || 0,
        stats: { families: total, people, rural, urban, waitList, allotted },
        facets: {
          locations: Object.entries(locCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
          stayRanges: Object.values(rangeCounts).sort((a, b) =>
            String(a.key || '').localeCompare(String(b.key || ''))
          )
        }
      }
    };
  },

  async getStayBooking(id) {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    const session = readSession();
    const roles = rolesForMobile(session.mobile);
    const allowed =
      roles.indexOf('accommodation_volunteer') >= 0 ||
      roles.indexOf('pssm_admin') >= 0 ||
      roles.indexOf('event_organizer') >= 0;
    if (!allowed) throw apiError(403, 'FORBIDDEN', 'Not allowed to view event registrations.');
    const key = String(id || '').trim();
    const row = readStayBookings().find((b) => b && b.id === key);
    if (!row) throw apiError(404, 'NOT_FOUND', 'Registration not found.');
    return { data: { booking: enrichStayBookingRow(row) } };
  },

  async updateStayBooking(id, { plan, family, updateSanghaProfile }) {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    const session = readSession();
    const roles = rolesForMobile(session.mobile);
    const allowed =
      roles.indexOf('accommodation_volunteer') >= 0 ||
      roles.indexOf('pssm_admin') >= 0 ||
      roles.indexOf('event_organizer') >= 0;
    if (!allowed) throw apiError(403, 'FORBIDDEN', 'Not allowed to update registrations.');
    const key = String(id || '').trim();
    const list = readStayBookings();
    const idx = list.findIndex((b) => b && b.id === key);
    if (idx < 0) throw apiError(404, 'NOT_FOUND', 'Registration not found.');
    const existing = list[idx];
    const form = family || {};
    const events = readJson(EVENTS_KEY, []);
    const known = Array.isArray(events) ? events.find((e) => e.id === existing.eventId) : null;
    const eventStart = known ? String(known.startDate || '').trim() : '';
    const eventEnd = known ? String(known.endDate || '').trim() : '';
    const { guests, fullName, digits } = buildStayGuestsFromFamily(form, eventStart, eventEnd);
    if (!fullName) throw apiError(400, 'VALIDATION', 'Enter the visitor full name.');
    if (!digits) throw apiError(400, 'VALIDATION', 'Enter the visitor mobile number.');
    if (updateSanghaProfile && findPerson(digits)) {
      const profile = { ...form, fullName, mobile: digits, roles: rolesForMobile(digits) };
      delete profile.password;
      upsertPerson(profile);
    }
    const updated = enrichStayBookingRow({
      ...existing,
      plan: plan === 'paid' ? 'paid' : plan === 'free' ? 'free' : existing.plan,
      familyFullName: fullName,
      familyMobile: digits,
      place: form.place || existing.place,
      family: familySnapshotFromForm(form, digits, fullName),
      guests
    });
    list[idx] = updated;
    writeStayBookings(list);
    return { data: { booking: updated } };
  },

  async deleteStayBooking(id) {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    const session = readSession();
    const roles = rolesForMobile(session.mobile);
    const allowed =
      roles.indexOf('accommodation_volunteer') >= 0 ||
      roles.indexOf('pssm_admin') >= 0 ||
      roles.indexOf('event_organizer') >= 0;
    if (!allowed) throw apiError(403, 'FORBIDDEN', 'Not allowed to remove registrations.');
    const key = String(id || '').trim();
    const list = readStayBookings();
    const next = list.filter((b) => b && b.id !== key);
    if (next.length === list.length) throw apiError(404, 'NOT_FOUND', 'Registration not found.');
    writeStayBookings(next);
    return { data: { deleted: true, id: key } };
  },

  async listStayAllotments(eventId, params = {}) {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    const session = readSession();
    const roles = rolesForMobile(session.mobile);
    const allowed =
      roles.indexOf('accommodation_volunteer') >= 0 ||
      roles.indexOf('accommodation_admin') >= 0 ||
      roles.indexOf('pssm_admin') >= 0 ||
      roles.indexOf('event_organizer') >= 0;
    if (!allowed) throw apiError(403, 'FORBIDDEN', 'Not allowed to view who is staying in hotels.');
    const id = String(eventId || '').trim();
    if (!id) throw apiError(400, 'VALIDATION', 'Event id is required.');
    const q = String(params.q || '').trim().toLowerCase();
    const hotelId = String(params.hotelId || '').trim();
    const roomType = String(params.roomType || '').trim().toLowerCase();
    const roomKind = String(params.roomKind || '').trim().toLowerCase();
    const gender = String(params.gender || '').trim().toLowerCase();
    const status = String(params.status || '').trim().toLowerCase();
    const location = String(params.location || '').trim().toLowerCase();
    const page = Math.max(0, Number(params.page) || 0);
    const size = Math.min(100, Math.max(1, Number(params.size) || 24));

    function hometownLabel(place) {
      const p = place || {};
      return p.kind === 'rural'
        ? String(p.district || 'Rural')
        : String(p.city || p.name || 'Urban');
    }

    function matchesRow(row, { omitLocation = false } = {}) {
      if (!row || row.eventId !== id) return false;
      const guests = Array.isArray(row.guests) ? row.guests : [];
      if (q) {
        const hay = [
          row.familyFullName,
          row.familyMobile,
          row.hotelName,
          row.roomNumber,
          ...guests.map((g) => `${g?.name || ''} ${g?.mobile || ''}`)
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (hotelId && row.hotelId !== hotelId) return false;
      if (roomType) {
        const normalized = roomType === 'non_ac' ? 'non_ac' : 'ac';
        if ((row.roomType === 'non_ac' ? 'non_ac' : 'ac') !== normalized) return false;
      }
      if (roomKind && String(row.roomKind || 'regular') !== roomKind) return false;
      if (status && String(row.status || '') !== status) return false;
      if (gender && !guests.some((g) => String(g?.gender || '').toLowerCase() === gender)) return false;
      if (!omitLocation && location) {
        if (hometownLabel(row.place).toLowerCase() !== location) return false;
      }
      return true;
    }

    const enrich = (row) => ({
      ...row,
      personCount: Array.isArray(row.guests) ? row.guests.length : row.personCount || 0
    });

    const matched = readAllotments()
      .filter((row) => matchesRow(row))
      .slice()
      .sort((a, b) => {
        const h = String(a.hotelName || '').localeCompare(String(b.hotelName || ''));
        if (h !== 0) return h;
        return String(a.roomNumber || '').localeCompare(String(b.roomNumber || ''), undefined, {
          numeric: true
        });
      })
      .map(enrich);

    const facetBase = readAllotments()
      .filter((row) => matchesRow(row, { omitLocation: true }))
      .map(enrich);

    const total = matched.length;
    const items = matched.slice(page * size, page * size + size);
    let people = 0;
    let checkedIn = 0;
    const hotelSet = new Set();
    const hotelCounts = {};
    matched.forEach((row) => {
      const personCount = row.personCount || 0;
      people += personCount;
      hotelSet.add(row.hotelId || row.hotelName);
      if (row.status === 'checked_in') checkedIn += 1;
      const key = row.hotelId || row.hotelName;
      hotelCounts[key] = hotelCounts[key] || { key, label: row.hotelName || key, count: 0 };
      hotelCounts[key].count += 1;
    });

    const locCounts = {};
    facetBase.forEach((row) => {
      const loc = hometownLabel(row.place);
      if (loc) locCounts[loc] = (locCounts[loc] || 0) + (row.personCount || 1);
    });

    return {
      data: {
        items,
        total,
        page,
        size,
        totalPages: Math.ceil(total / size) || 0,
        stats: {
          parties: total,
          people,
          hotels: hotelSet.size,
          checkedIn,
          allotted: Math.max(0, total - checkedIn)
        },
        facets: {
          hotels: Object.values(hotelCounts).sort((a, b) => a.label.localeCompare(b.label)),
          locations: Object.entries(locCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        }
      }
    };
  },

  async listHotels(eventId) {
    requireHotelReader();
    const id = String(eventId || '').trim();
    if (!id) throw apiError(400, 'VALIDATION', 'Event id is required.');
    const list = readHotels()
      .filter((h) => h && String(h.eventId || '') === id)
      .slice()
      .sort((a, b) => {
        const d = Number(a.distanceKm) - Number(b.distanceKm);
        if (d !== 0) return d;
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
    return { data: list.map(enrichHotel) };
  },

  async getHotel(id) {
    requireHotelReader();
    const hotel = readHotels().find((h) => h && h.id === String(id || '').trim());
    if (!hotel) throw apiError(404, 'NOT_FOUND', 'Hotel not found.');
    return { data: enrichHotel(hotel) };
  },

  async createStayAllotments(payload) {
    requireAllotmentManager();
    const eventId = String(payload?.eventId || '').trim();
    if (!eventId) throw apiError(400, 'VALIDATION', 'Event id is required.');
    const placements = Array.isArray(payload?.placements) ? payload.placements : [];
    if (!placements.length) throw apiError(400, 'VALIDATION', 'No room placements to save.');

    const hotels = readHotels();
    const guestKeys = new Set();
    const prepared = [];
    placements.forEach((p, index) => {
      const hotelId = String(p?.hotelId || '').trim();
      const hotel = hotels.find((h) => h && h.id === hotelId);
      if (!hotel || hotel.reserved || hotel.active === false) {
        throw apiError(400, 'VALIDATION', `Hotel not available for allotment (${hotelId || 'missing'}).`);
      }
      const bookingId = String(p?.bookingId || '').trim();
      const members = Array.isArray(p?.members) ? p.members : [];
      const guests = members.map((m, i) => ({
        name: m.name || '',
        relation: m.relation || '',
        mobile: normalizeMobile(m.mobile),
        gender: m.gender || '',
        age: m.age || '',
        livePhoto: m.livePhoto || '',
        primary: Boolean(m.primary) || i === 0
      }));
      if (!guests.length) {
        throw apiError(400, 'VALIDATION', 'Each placement needs at least one person.');
      }
      guests.forEach((g) => {
        const key = allotmentGuestKey(g, bookingId);
        if (key) guestKeys.add(key);
      });
      const primary = guests.find((g) => g.primary) || guests[0] || {};
      prepared.push({
        id: `allot_${Date.now()}_${index}`,
        eventId,
        eventName: String(payload?.eventName || '').trim(),
        bookingId,
        plan: p?.plan === 'paid' ? 'paid' : 'free',
        status: 'allotted',
        hotelId,
        hotelName: hotel.name,
        roomNumber: String(p?.roomNumber || '').trim(),
        roomType: p?.roomType === 'non_ac' ? 'non_ac' : 'ac',
        roomKind: p?.roomKind || 'regular',
        familyMobile: primary.mobile || '',
        familyFullName: primary.name || '',
        place: p?.place || {},
        guests,
        personCount: guests.length,
        checkInDate: p?.checkInDate || '',
        checkOutDate: p?.checkOutDate || '',
        createdAt: new Date().toISOString()
      });
    });

    const next = stripGuestsFromEventAllotments(readAllotments(), eventId, guestKeys);
    prepared.forEach((row) => next.unshift(row));
    writeJson(ALLOTMENTS_KEY, next);
    writeJson(ALLOTMENTS_SEED_KEY, ALLOTMENTS_SEED_VERSION);
    return { data: { created: prepared.length, allotments: prepared } };
  },

  async createHotel(payload) {
    const session = requireHotelAdmin();
    const hotel = normalizeHotelPayload(payload, {
      id: `htl_${Date.now()}`,
      createdBy: session.mobile,
      createdAt: new Date().toISOString()
    });
    const list = readHotels();
    list.push(hotel);
    writeHotels(list);
    return { data: enrichHotel(hotel) };
  },

  async updateHotel(id, payload) {
    requireHotelAdmin();
    const hotelId = String(id || '').trim();
    const list = readHotels();
    const idx = list.findIndex((h) => h && h.id === hotelId);
    if (idx < 0) throw apiError(404, 'NOT_FOUND', 'Hotel not found.');
    const hotel = normalizeHotelPayload(payload, {
      id: hotelId,
      eventId: payload?.eventId || list[idx].eventId,
      createdBy: list[idx].createdBy,
      createdAt: list[idx].createdAt
    });
    list[idx] = hotel;
    writeHotels(list);
    return { data: enrichHotel(hotel) };
  },

  async updateEvent(id, { name, startDate, endDate, location, expectedBudgetInr, meditationHoursPerDay }) {
    if (!isSignedIn()) throw apiError(401, 'UNAUTHORIZED', 'Please login again.');
    const session = readSession();
    if (rolesForMobile(session.mobile).indexOf('event_organizer') < 0) {
      throw apiError(403, 'FORBIDDEN', 'Only an Event Organizer can update an event.');
    }
    const eventId = String(id || '').trim();
    if (!eventId) throw apiError(400, 'VALIDATION', 'Event id is required.');
    const list = readJson(EVENTS_KEY, []);
    const next = Array.isArray(list) ? list : [];
    const idx = next.findIndex((e) => e.id === eventId);
    if (idx < 0) throw apiError(404, 'NOT_FOUND', 'Event not found.');

    const eventName = String(name || '').trim();
    const start = String(startDate || '').trim();
    const end = String(endDate || '').trim();
    const place = String(location || '').trim();
    const budget = Number(expectedBudgetInr);
    if (!eventName) throw apiError(400, 'VALIDATION', 'Enter the event name.');
    if (!start) throw apiError(400, 'VALIDATION', 'Enter the start date.');
    if (!end) throw apiError(400, 'VALIDATION', 'Enter the end date.');
    if (end < start) throw apiError(400, 'VALIDATION', 'End date must be on or after the start date.');
    if (!place) throw apiError(400, 'VALIDATION', 'Enter the event location.');
    if (!(budget > 0)) {
      throw apiError(400, 'VALIDATION', 'Enter an expected budget greater than zero (INR).');
    }
    let hours = null;
    if (meditationHoursPerDay !== undefined && meditationHoursPerDay !== null && String(meditationHoursPerDay).trim() !== '') {
      hours = Number(meditationHoursPerDay);
      if (!(hours >= 0)) {
        throw apiError(400, 'VALIDATION', 'Meditation hours per day cannot be negative.');
      }
    }
    const updated = {
      ...next[idx],
      name: eventName,
      startDate: start,
      endDate: end,
      location: place,
      expectedBudgetInr: budget,
      meditationHoursPerDay: hours
    };
    next[idx] = updated;
    writeJson(EVENTS_KEY, next);
    return { data: updated };
  },

  countPssmAdmins,
  ASSIGNABLE_ROLE_IDS
};
