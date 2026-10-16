import { ageGroupLabel, registrationLocationShort } from './stayRegistrations.js';

export const ALLOTMENT_TILE_DISPLAY_LIMIT = 48;

export function allotmentPersonCount(row) {
  if (row?.personCount != null) return Number(row.personCount) || 0;
  return Array.isArray(row?.guests) ? row.guests.length : 0;
}

export function allotmentStats(rows) {
  const list = Array.isArray(rows) ? rows : [];
  let people = 0;
  let allotted = 0;
  let checkedIn = 0;
  const hotels = new Set();
  list.forEach((row) => {
    people += allotmentPersonCount(row);
    hotels.add(row.hotelId || row.hotelName);
    if (row.status === 'checked_in') checkedIn += 1;
    else allotted += 1;
  });
  return {
    parties: list.length,
    people,
    hotels: hotels.size,
    allotted,
    checkedIn
  };
}

/** Flatten allotment parties into one tile person each (primary + members share room). */
export function allotmentTilePeople(rows) {
  const people = [];
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    if (!row) return;
    const guests = Array.isArray(row.guests) ? row.guests : [];
    guests.forEach((guest, index) => {
      const primary = Boolean(guest?.primary) || index === 0;
      people.push({
        id: `${row.id}__${index}`,
        allotmentId: row.id,
        bookingId: row.bookingId,
        name: guest?.name || (primary ? row.familyFullName : `Guest ${index + 1}`),
        mobile: guest?.mobile || (primary ? row.familyMobile : ''),
        gender: guest?.gender || '',
        age: guest?.age || '',
        livePhoto: guest?.livePhoto || '',
        primary,
        place: row.place,
        hotelId: row.hotelId,
        hotelName: row.hotelName,
        roomNumber: row.roomNumber,
        roomType: row.roomType === 'non_ac' ? 'non_ac' : 'ac',
        roomKind: row.roomKind || 'regular',
        status: row.status || 'allotted',
        plan: row.plan === 'paid' ? 'paid' : 'free',
        checkInDate: row.checkInDate,
        checkOutDate: row.checkOutDate
      });
    });
  });
  return people;
}

export function allotmentHotelFacets(people) {
  const map = new Map();
  (Array.isArray(people) ? people : []).forEach((person) => {
    const key = person.hotelId || person.hotelName || '';
    if (!key) return;
    const prev = map.get(key) || { key, label: person.hotelName || key, count: 0 };
    prev.count += 1;
    map.set(key, prev);
  });
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function filterAllotmentPeople(people, filters = {}) {
  const list = Array.isArray(people) ? people : [];
  const q = String(filters.nameQuery || '')
    .trim()
    .toLowerCase();
  const hotelId = filters.hotelId || '';
  const roomType = filters.roomType || '';
  const roomKind = filters.roomKind || '';
  const gender = filters.gender || '';
  const status = filters.status || '';

  return list.filter((person) => {
    if (!person) return false;
    if (q) {
      const hay = [person.name, person.hotelName, person.roomNumber, person.mobile]
        .map((v) => String(v || '').toLowerCase())
        .join(' ');
      if (!hay.includes(q)) return false;
    }
    if (hotelId && (person.hotelId || person.hotelName) !== hotelId) return false;
    if (roomType && person.roomType !== roomType) return false;
    if (roomKind && person.roomKind !== roomKind) return false;
    if (gender) {
      const g = String(person.gender || '').toLowerCase();
      if (gender === 'male' && g !== 'male') return false;
      if (gender === 'female' && g !== 'female') return false;
    }
    if (status && person.status !== status) return false;
    return true;
  });
}

export function allotmentStatusLabel(status) {
  if (status === 'checked_in') return 'Checked in';
  if (status === 'checked_out') return 'Checked out';
  return 'Allotted';
}

export function allotmentRoomTypeLabel(roomType) {
  return roomType === 'non_ac' ? 'Non-AC' : 'AC';
}

export function allotmentRoomKindLabel(kind) {
  if (kind === 'dormitory') return 'Dormitory';
  if (kind === 'hall') return 'Hall';
  return 'Regular';
}

export { ageGroupLabel, registrationLocationShort };
