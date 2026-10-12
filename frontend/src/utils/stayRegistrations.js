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
