import { emptyMember, emptyProfile, normalizeMobile, placeLine } from './password.js';

export function registrationPlaceKind(booking) {
  const kind = booking?.place?.kind || booking?.family?.place?.kind;
  return kind === 'rural' ? 'rural' : 'urban';
}

export function registrationPlaceLabel(booking) {
  const place = booking?.place || booking?.family?.place;
  const line = placeLine(place);
  const kind = registrationPlaceKind(booking);
  if (!line) return kind === 'rural' ? 'Rural' : 'Urban';
  return `${kind === 'rural' ? 'Rural' : 'Urban'} · ${line}`;
}

export function registrationPersonCount(booking) {
  if (booking?.personCount != null) return Number(booking.personCount) || 0;
  return Array.isArray(booking?.guests) ? booking.guests.length : 0;
}

export function registrationStats(bookings) {
  const list = Array.isArray(bookings) ? bookings : [];
  let people = 0;
  let rural = 0;
  let urban = 0;
  list.forEach((row) => {
    const count = registrationPersonCount(row);
    people += count;
    if (registrationPlaceKind(row) === 'rural') rural += count;
    else urban += count;
  });
  return {
    families: list.length,
    people,
    rural,
    urban
  };
}

export function filterRegistrationsByMobile(bookings, mobileQuery) {
  const digits = normalizeMobile(mobileQuery);
  if (!digits) return Array.isArray(bookings) ? bookings : [];
  return (Array.isArray(bookings) ? bookings : []).filter((row) => {
    if (normalizeMobile(row.familyMobile).includes(digits)) return true;
    return (row.guests || []).some((g) => normalizeMobile(g.mobile).includes(digits));
  });
}

export function primaryGuest(booking) {
  const guests = booking?.guests;
  if (!Array.isArray(guests) || guests.length === 0) return null;
  return guests.find((g) => g.primary) || guests[0];
}

export function bookingToProfileForm(booking) {
  const base = emptyProfile();
  const family = booking?.family;
  if (family && typeof family === 'object') {
    return {
      ...base,
      ...family,
      mobile: family.mobile || booking.familyMobile || '',
      fullName: family.fullName || booking.familyFullName || '',
      place: { ...base.place, ...(family.place || booking.place || {}) },
      members: (Array.isArray(family.members) ? family.members : []).map((member) => ({
        ...emptyMember(),
        ...member,
        place: { ...emptyMember().place, ...(member.place || {}) }
      }))
    };
  }

  const primary = primaryGuest(booking);
  const members = (booking?.guests || []).filter((g) => !g.primary);
  return {
    ...base,
    fullName: booking?.familyFullName || primary?.name || '',
    mobile: booking?.familyMobile || primary?.mobile || '',
    gender: primary?.gender || '',
    age: primary?.age || 'adult',
    stayStartDate: primary?.stayStartDate || '',
    stayEndDate: primary?.stayEndDate || '',
    place: { ...base.place, ...(booking?.place || {}) },
    members: members.map((g) => ({
      ...emptyMember(),
      name: g.name || '',
      relation: g.relation || '',
      mobile: g.mobile || '',
      gender: g.gender || '',
      age: g.age || 'adult',
      stayStartDate: g.stayStartDate || '',
      stayEndDate: g.stayEndDate || ''
    }))
  };
}

export function planLabel(plan) {
  return plan === 'paid' ? 'Paid' : 'Free';
}

const MEDITATION_LABELS = {
  new: 'New to meditation',
  '1': '1 year in meditation',
  '2': '2 years in meditation',
  '3': '3 years in meditation',
  '4': '4 years in meditation',
  '5': '5 years in meditation',
  '6': 'Over 5 years in meditation'
};

export function meditationLabel(value) {
  const key = String(value || '').trim().toLowerCase();
  if (!key) return 'Meditation not set';
  return MEDITATION_LABELS[key] || `${value} in meditation`;
}

export function ageGroupLabel(value) {
  const key = String(value || '').trim().toLowerCase();
  if (key === 'child') return 'Child';
  if (key === 'senior') return 'Senior';
  if (key === 'adult') return 'Adult';
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Adult';
}

/** City for urban, district for rural (fallback to a readable place line). */
export function registrationLocationShort(place) {
  const p = place && typeof place === 'object' ? place : {};
  const kind = p.kind === 'rural' ? 'rural' : 'urban';
  if (kind === 'rural') {
    const district = String(p.district || '').trim();
    if (district) return district;
  } else {
    const city = String(p.city || p.name || '').trim();
    if (city) return city;
  }
  const line = placeLine(p);
  return line || (kind === 'rural' ? 'Rural' : 'Urban');
}

/**
 * Flatten stay-interest bookings into one tile person each (primary + members).
 * Photos and meditation come from family detail when present.
 */
export function normalizeAgeKey(value) {
  const key = String(value || '').trim().toLowerCase();
  if (key === 'child' || key === 'senior' || key === 'adult') return key;
  return 'adult';
}

export function normalizeGenderKey(value) {
  const key = String(value || '').trim().toLowerCase();
  if (key === 'male' || key === 'female') return key;
  return '';
}

export function normalizeMeditationKey(value) {
  return String(value || '').trim().toLowerCase();
}

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

/** Format ISO `YYYY-MM-DD` as `13-Oct-2026`. */
export function formatStayDay(isoDate) {
  const raw = String(isoDate || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return raw;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!month || month < 1 || month > 12 || !day) return raw;
  return `${day}-${MONTH_SHORT[month - 1]}-${m[1]}`;
}

export function stayRangeKey(start, end) {
  const a = String(start || '').trim();
  const b = String(end || '').trim();
  if (!a || !b) return '';
  return `${a}|${b}`;
}

export function stayRangeLabel(start, end) {
  const a = formatStayDay(start);
  const b = formatStayDay(end);
  if (!a || !b) return '';
  return `${a} to ${b}`;
}

/** Location facet rows for the left filter menu: [{ name, count }]. */
export function registrationLocationFacets(people) {
  const counts = new Map();
  (Array.isArray(people) ? people : []).forEach((person) => {
    const name = registrationLocationShort(person?.place);
    if (!name) return;
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Stay-date range facets: [{ key, label, count }]. */
export function registrationStayRangeFacets(people) {
  const counts = new Map();
  (Array.isArray(people) ? people : []).forEach((person) => {
    const key = stayRangeKey(person?.stayStartDate, person?.stayEndDate);
    if (!key) return;
    const prev = counts.get(key) || { key, label: stayRangeLabel(person.stayStartDate, person.stayEndDate), count: 0 };
    prev.count += 1;
    counts.set(key, prev);
  });
  return Array.from(counts.values()).sort((a, b) => {
    if (a.key < b.key) return -1;
    if (a.key > b.key) return 1;
    return b.count - a.count;
  });
}

/** How many interest tiles to paint at once (full match set can be large). */
export const INTEREST_TILE_DISPLAY_LIMIT = 24;

/**
 * Filter flattened tile people.
 * Empty nameQuery / ageKeys / gender / meditation / location / stayRange = no restriction.
 * nameQuery: case-insensitive substring anywhere in the name.
 * ageKeys: string[] of child|adult|senior (OR).
 */
export function filterTilePeople(people, filters = {}) {
  const list = Array.isArray(people) ? people : [];
  const nameQuery = String(filters.nameQuery || '')
    .trim()
    .toLowerCase();
  const ageKeys = Array.isArray(filters.ageKeys)
    ? filters.ageKeys.map(normalizeAgeKey).filter(Boolean)
    : [];
  const ageSet = new Set(ageKeys);
  const gender = normalizeGenderKey(filters.gender);
  const meditation = normalizeMeditationKey(filters.meditation);
  const location = String(filters.location || '').trim();
  const stayRange = String(filters.stayRange || '').trim();

  return list.filter((person) => {
    if (!person) return false;
    if (nameQuery) {
      const hay = String(person.name || '')
        .trim()
        .toLowerCase();
      if (!hay.includes(nameQuery)) return false;
    }
    if (ageSet.size > 0 && !ageSet.has(normalizeAgeKey(person.age))) return false;
    if (gender && normalizeGenderKey(person.gender) !== gender) return false;
    if (meditation && normalizeMeditationKey(person.meditation) !== meditation) return false;
    if (location && registrationLocationShort(person.place) !== location) return false;
    if (stayRange && stayRangeKey(person.stayStartDate, person.stayEndDate) !== stayRange) return false;
    return true;
  });
}

export function registrationTilePeople(bookings) {
  const list = Array.isArray(bookings) ? bookings : [];
  const people = [];
  list.forEach((booking) => {
    if (!booking || !booking.id) return;
    const family = booking.family && typeof booking.family === 'object' ? booking.family : {};
    const bookingPlace = booking.place || family.place || {};
    const guests = Array.isArray(booking.guests) ? booking.guests : [];
    const primaryGuestRow = guests.find((g) => g && g.primary) || guests[0] || null;
    const members = Array.isArray(family.members) ? family.members : [];

    people.push({
      id: `${booking.id}:primary`,
      bookingId: booking.id,
      plan: booking.plan === 'paid' ? 'paid' : 'free',
      name: family.fullName || booking.familyFullName || primaryGuestRow?.name || '—',
      mobile: family.mobile || booking.familyMobile || primaryGuestRow?.mobile || '',
      livePhoto: family.livePhoto || '',
      meditation: family.meditation || '',
      profession: family.profession || '',
      age: family.age || primaryGuestRow?.age || 'adult',
      gender: family.gender || primaryGuestRow?.gender || '',
      place: family.place || bookingPlace,
      stayStartDate: family.stayStartDate || primaryGuestRow?.stayStartDate || '',
      stayEndDate: family.stayEndDate || primaryGuestRow?.stayEndDate || '',
      memberIndex: -1,
      primary: true
    });

    members.forEach((member, index) => {
      if (!member) return;
      const guest = guests.filter((g) => g && !g.primary)[index];
      const memberPlace =
        member.addrMode === 'new' && member.place ? member.place : bookingPlace;
      people.push({
        id: `${booking.id}:member:${index}`,
        bookingId: booking.id,
        plan: booking.plan === 'paid' ? 'paid' : 'free',
        name: member.name || guest?.name || `Family member ${index + 1}`,
        mobile: member.mobile || guest?.mobile || booking.familyMobile || '',
        livePhoto: member.livePhoto || '',
        meditation: member.meditation || '',
        profession: member.profession || '',
        age: member.age || guest?.age || 'adult',
        gender: member.gender || guest?.gender || '',
        place: memberPlace,
        stayStartDate: member.stayStartDate || guest?.stayStartDate || '',
        stayEndDate: member.stayEndDate || guest?.stayEndDate || '',
        memberIndex: index,
        primary: false
      });
    });
  });
  return people;
}

/** Unique stay booking ids for selected tile people (one family = one booking). */
export function bookingIdsFromSelectedPeople(selectedIds, people) {
  const idSet = selectedIds instanceof Set ? selectedIds : new Set(selectedIds || []);
  const bookingIds = new Set();
  (Array.isArray(people) ? people : []).forEach((person) => {
    if (person && idSet.has(person.id) && person.bookingId) {
      bookingIds.add(person.bookingId);
    }
  });
  return Array.from(bookingIds);
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Names and counts for a remove-registration confirm. */
export function removeRegistrationConfirmSummary(bookingIds, bookings) {
  const ids = Array.isArray(bookingIds) ? bookingIds : [];
  const list = Array.isArray(bookings) ? bookings : [];
  const names = ids.map((id) => {
    const row = list.find((b) => b && b.id === id);
    return String(row?.familyFullName || row?.family?.fullName || 'This family').trim();
  });
  const familyWord = ids.length === 1 ? 'family' : 'families';
  return { count: ids.length, names, familyWord };
}

/** Plain-text fallback for remove-registration confirm. */
export function removeRegistrationConfirmPlain(bookingIds, bookings) {
  const { count, names, familyWord } = removeRegistrationConfirmSummary(bookingIds, bookings);
  if (count === 0) return '';
  const preview =
    names.length <= 3 ? names.join(', ') : `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`;
  return (
    `Remove stay registration for ${count} ${familyWord} (${preview})?\n\n` +
    'People stay on the sangha register — only this event interest is removed.'
  );
}

/** UIkit modal body HTML (rendered inside UIkit.modal.confirm). */
export function removeRegistrationConfirmHtml(bookingIds, bookings) {
  const { count, names, familyWord } = removeRegistrationConfirmSummary(bookingIds, bookings);
  if (count === 0) return '';
  const listItems = names.map((name) => `<li>${escapeHtml(name)}</li>`).join('');
  return (
    `<p class="uk-margin-remove-top">Remove stay registration for ` +
    `<strong>${count} ${familyWord}</strong>?</p>` +
    `<ul class="uk-list uk-list-disc uk-margin-small">${listItems}</ul>` +
    `<p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">` +
    `People stay on the sangha register — only this event interest is removed.</p>`
  );
}
