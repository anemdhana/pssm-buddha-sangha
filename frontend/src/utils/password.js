export function normalizeMobile(value) {
  return String(value || '').replace(/\D/g, '');
}

export function composedPassword(profile) {
  if (!profile || !profile.fullName) return '';
  const letters = String(profile.fullName).replace(/[^A-Za-z]/g, '').slice(0, 5);
  const date = String(profile.birthDate || '').padStart(2, '0');
  const month = String(profile.birthMonth || '').padStart(2, '0');
  if (!letters || !profile.birthDate || !profile.birthMonth) return '';
  return letters + date + month;
}

export function currentPassword(profile) {
  if (!profile) return '';
  if (profile.password) return String(profile.password);
  return composedPassword(profile);
}

export function formatEventSub(event) {
  if (!event) return '';
  const start = event.startDate || '';
  const end = event.endDate || '';
  if (start && end) return `${start} to ${end}`;
  return start || end || '';
}

export const ROLES = {
  pssm_admin: { id: 'pssm_admin', label: 'PSSM Admin', assignable: false },
  event_organizer: { id: 'event_organizer', label: 'Event Organizer', assignable: true },
  pyramid_sevadal: { id: 'pyramid_sevadal', label: 'Pyramid Sevadal', assignable: true },
  pmma_member: { id: 'pmma_member', label: 'PMMA Member', assignable: true }
};

export const ASSIGNABLE_ROLE_IDS = Object.keys(ROLES).filter((id) => ROLES[id].assignable);

export function roleLabel(roleId) {
  return (ROLES[roleId] && ROLES[roleId].label) || roleId;
}

export function normalizeRoles(list) {
  const allowed = Object.keys(ROLES);
  const seen = {};
  return (Array.isArray(list) ? list : [])
    .map((role) => String(role || '').trim())
    .filter((role) => allowed.indexOf(role) >= 0 && !seen[role] && (seen[role] = true));
}

export function normalizeAssignableRoles(list) {
  const seen = {};
  return (Array.isArray(list) ? list : [])
    .map((role) => String(role || '').trim())
    .filter((role) => ASSIGNABLE_ROLE_IDS.indexOf(role) >= 0 && !seen[role] && (seen[role] = true));
}

export function homeAfterLogin(roles) {
  const list = normalizeRoles(roles);
  if (list.indexOf('pssm_admin') >= 0) return '/admin';
  return '/';
}

export function emptyMember() {
  return {
    name: '',
    relation: '',
    mobile: '',
    gender: '',
    age: 'adult',
    meditation: '',
    addrMode: 'same',
    place: { kind: 'rural', village: '', town: '', district: '', city: '', state: '', country: 'India' },
    idType: '',
    livePhoto: '',
    idProofPhoto: ''
  };
}

export function emptyProfile() {
  return {
    fullName: '',
    mobile: '',
    email: '',
    altMobile: '',
    gender: '',
    age: 'adult',
    meditation: '',
    birthDate: '',
    birthMonth: '',
    language: '',
    pyramidCenter: '',
    sinceYear: '',
    idType: '',
    livePhoto: '',
    idProofPhoto: '',
    place: {
      kind: 'rural',
      city: '',
      state: '',
      country: 'India',
      village: '',
      town: '',
      district: ''
    },
    members: [],
    roles: []
  };
}

export function placeLine(place) {
  if (!place) return '';
  if (place.kind === 'urban') {
    return [place.city, place.state, place.country].filter(Boolean).join(', ');
  }
  return [place.village, place.town, place.district, place.state, place.country].filter(Boolean).join(', ');
}
