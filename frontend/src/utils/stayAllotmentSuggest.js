import { hotelRoomStats } from './stayHotels.js';
import {
  ageGroupLabel,
  registrationLocationShort,
  stayRangeLabel
} from './stayRegistrations.js';

const PAGE_SIZE = 5;

function normalizeGender(value) {
  const g = String(value || '')
    .trim()
    .toLowerCase();
  if (g === 'male' || g === 'm' || g === 'gents') return 'male';
  if (g === 'female' || g === 'f' || g === 'ladies') return 'female';
  return '';
}

function roomGenderAllowed(room) {
  const g = String(room?.genderAllowed || '')
    .trim()
    .toLowerCase();
  if (g === 'gents' || g === 'gents_only' || g === 'male') return 'male';
  if (g === 'ladies' || g === 'ladies_only' || g === 'female') return 'female';
  return '';
}

function roomKind(room) {
  const k = String(room?.kind || 'regular')
    .trim()
    .toLowerCase();
  if (k === 'dormitory' || k === 'hall') return k;
  return 'regular';
}

function isAc(room) {
  return String(room?.roomType || '').toLowerCase() !== 'non_ac';
}

function partyGenders(people) {
  const set = new Set();
  (people || []).forEach((p) => {
    const g = normalizeGender(p?.gender);
    if (g) set.add(g);
  });
  return set;
}

function isMixedGender(people) {
  return partyGenders(people).size > 1;
}

function hasSeniorOrSpecial(people) {
  return (people || []).some((p) => String(p?.age || '').toLowerCase() === 'senior');
}

function partySize(people) {
  return Array.isArray(people) ? people.length : 0;
}

/** YYYY-MM-DD only; empty when missing/invalid. */
export function parseStayDay(value) {
  const s = String(value || '')
    .trim()
    .slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

/**
 * Stay ranges use half-open [start, end):
 * checkout day frees the bed for a same-day check-in.
 * Missing either side → treat as overlapping (conservative).
 */
export function staysOverlap(startA, endA, startB, endB) {
  const a0 = parseStayDay(startA);
  const a1 = parseStayDay(endA);
  const b0 = parseStayDay(startB);
  const b1 = parseStayDay(endB);
  if (!a0 || !a1 || !b0 || !b1) return true;
  return a0 < b1 && b0 < a1;
}

export function allotmentStayWindow(row) {
  const checkIn = parseStayDay(row?.checkInDate);
  const checkOut = parseStayDay(row?.checkOutDate);
  if (checkIn && checkOut) return { start: checkIn, end: checkOut };
  let start = '';
  let end = '';
  (Array.isArray(row?.guests) ? row.guests : []).forEach((guest) => {
    const s = parseStayDay(guest?.stayStartDate);
    const e = parseStayDay(guest?.stayEndDate);
    if (s && (!start || s < start)) start = s;
    if (e && (!end || e > end)) end = e;
  });
  return { start, end };
}

export function peopleStayWindow(people) {
  let start = '';
  let end = '';
  (Array.isArray(people) ? people : []).forEach((person) => {
    const s = parseStayDay(person?.stayStartDate);
    const e = parseStayDay(person?.stayEndDate);
    if (s && (!start || s < start)) start = s;
    if (e && (!end || e > end)) end = e;
  });
  return { start, end };
}

function mergeStayWindows(windows) {
  let start = '';
  let end = '';
  (Array.isArray(windows) ? windows : []).forEach((w) => {
    const s = parseStayDay(w?.start);
    const e = parseStayDay(w?.end);
    if (s && (!start || s < start)) start = s;
    if (e && (!end || e > end)) end = e;
  });
  return { start, end };
}

/**
 * Free beds per hotel room after existing allotments.
 * @param {object|null} stayWindow optional { start, end }; only overlapping allotments count
 * @param {object[]} extraOccupancies optional pending placements
 *   [{ hotelId, roomNumber, count, start, end }]
 */
export function buildRoomAvailability(hotels, allotments, stayWindow = null, extraOccupancies = []) {
  const windowStart = parseStayDay(stayWindow?.start);
  const windowEnd = parseStayDay(stayWindow?.end);
  const hasWindow = Boolean(windowStart && windowEnd);

  const occupied = new Map();
  function addOccupancy(hotelId, roomNumber, count, start, end) {
    const hid = String(hotelId || '');
    const room = String(roomNumber || '');
    const n = Math.max(0, Number(count) || 0);
    if (!hid || !room || n <= 0) return;
    if (hasWindow && !staysOverlap(start, end, windowStart, windowEnd)) return;
    const key = `${hid}|${room}`;
    occupied.set(key, (occupied.get(key) || 0) + n);
  }

  (Array.isArray(allotments) ? allotments : []).forEach((row) => {
    if (!row) return;
    const stay = allotmentStayWindow(row);
    const count = Array.isArray(row.guests)
      ? row.guests.length
      : Number(row.personCount) || 0;
    addOccupancy(row.hotelId, row.roomNumber, count, stay.start, stay.end);
  });

  (Array.isArray(extraOccupancies) ? extraOccupancies : []).forEach((row) => {
    if (!row) return;
    addOccupancy(row.hotelId, row.roomNumber, row.count, row.start, row.end);
  });

  const byHotel = new Map();
  (Array.isArray(hotels) ? hotels : []).forEach((hotel) => {
    if (!hotel || hotel.active === false || hotel.reserved) return;
    const rooms = (Array.isArray(hotel.rooms) ? hotel.rooms : [])
      .filter((r) => r && String(r.status || 'available') !== 'blocked')
      .map((room) => {
        const key = `${hotel.id}|${room.roomNumber}`;
        const capacity = Math.max(0, Number(room.capacity) || 0);
        const used = occupied.get(key) || 0;
        const free = Math.max(0, capacity - used);
        return {
          ...room,
          hotelId: hotel.id,
          hotelName: hotel.name,
          capacity,
          used,
          free,
          empty: used === 0 && free === capacity && capacity > 0,
          kind: roomKind(room),
          genderGate: roomGenderAllowed(room),
          ac: isAc(room)
        };
      })
      .filter((r) => r.capacity > 0);
    if (!rooms.length) return;
    const freeBeds = rooms.reduce((sum, r) => sum + r.free, 0);
    byHotel.set(hotel.id, {
      hotel,
      rooms,
      freeBeds,
      distanceKm: Number(hotel.distanceKm) >= 0 ? Number(hotel.distanceKm) : 999
    });
  });
  return byHotel;
}

function roomAcceptsParty(room, people) {
  if (!room || room.free < partySize(people)) return false;
  const genders = partyGenders(people);
  if (room.kind === 'dormitory' || room.kind === 'hall') {
    if (genders.size !== 1) return false;
    const only = [...genders][0];
    if (room.genderGate && room.genderGate !== only) return false;
    return true;
  }
  // Regular: if partly occupied, only same-gender fill (occupancy gender unknown → allow when empty or free==capacity)
  if (!room.empty && room.used > 0) {
    // Without knowing current occupants' gender, only allow if free enough and party is single-gender
    // (conservative: skip shared fill for mixed; allow single-gender into non-empty regular)
    if (genders.size !== 1) return false;
  }
  return true;
}

function scoreRoomForParty(room, people) {
  const size = partySize(people);
  if (!roomAcceptsParty(room, people)) return -Infinity;
  let score = 0;
  const exact = room.empty && room.capacity === size;
  if (exact) score += 1000;
  else if (room.free >= size) score += 400 - (room.free - size) * 5;

  if (size === 1 && (room.kind === 'dormitory' || room.kind === 'hall')) score += 200;
  if (size === 1 && room.kind === 'regular' && room.capacity === 1) score -= 50;

  if (room.ac) score += 40;
  else score -= 10;

  if (isMixedGender(people) && (room.kind === 'dormitory' || room.kind === 'hall')) {
    return -Infinity;
  }
  return score;
}

function pickBestRoom(rooms, people) {
  let best = null;
  let bestScore = -Infinity;
  rooms.forEach((room) => {
    const score = scoreRoomForParty(room, people);
    if (score > bestScore) {
      bestScore = score;
      best = room;
    }
  });
  return bestScore > -Infinity ? best : null;
}

/**
 * Place selected parties into rooms of one hotel (greedy, most suitable rooms first).
 * Used when dropping people onto any Suitable-hotels card.
 */
export function suggestPlacementsForHotel({
  hotelId,
  hotels,
  allotments,
  selectedIds,
  people
} = {}) {
  const hid = String(hotelId || '').trim();
  if (!hid) return [];
  const parties = partiesFromSelectedPeople(selectedIds, people).filter((p) => p.size > 0);
  if (!parties.length) return [];

  const ordered = [...parties].sort((a, b) => {
    if (Number(b.needsClose) !== Number(a.needsClose)) return Number(b.needsClose) - Number(a.needsClose);
    return b.size - a.size;
  });

  const pending = [];
  const placements = [];
  ordered.forEach((party) => {
    const stay = party.stayStartDate
      ? { start: party.stayStartDate, end: party.stayEndDate }
      : peopleStayWindow(party.members);
    const availability = buildRoomAvailability(hotels, allotments, stay, pending);
    const entry = availability.get(hid);
    if (!entry) return;
    const room = pickBestRoom(entry.rooms, party.members);
    if (!room) return;
    const usedBefore = Number(room.used) || 0;
    placements.push({
      bookingId: party.bookingId,
      plan: party.plan,
      hotelId: hid,
      hotelName: entry.hotel?.name || '',
      distanceKm: entry.distanceKm,
      roomNumber: room.roomNumber,
      roomType: room.ac ? 'ac' : 'non_ac',
      roomKind: room.kind,
      capacity: room.capacity,
      usedBefore,
      freeBefore: Number(room.free) || 0,
      roomStatusBefore: usedBefore <= 0 ? 'free' : room.free > 0 ? 'partial' : 'full',
      exactMatch: room.empty && room.capacity === party.size,
      members: party.members,
      placeLabel: party.placeLabel,
      stayStartDate: stay.start || '',
      stayEndDate: stay.end || ''
    });
    pending.push({
      hotelId: hid,
      roomNumber: room.roomNumber,
      count: party.size,
      start: stay.start,
      end: stay.end
    });
  });
  return placements;
}

/** Smart-ranked eligible rooms in one hotel for a party (most suitable first). */
export function listSmartRoomOptions(hotelId, members, hotels, allotments) {
  const stay = peopleStayWindow(members);
  const availability = buildRoomAvailability(hotels, allotments, stay);
  const entry = availability.get(String(hotelId || ''));
  if (!entry) return [];
  const size = partySize(members);
  return entry.rooms
    .map((room) => {
      const score = scoreRoomForParty(room, members);
      if (!(score > -Infinity)) return null;
      const usedBefore = Number(room.used) || 0;
      return {
        score,
        roomNumber: room.roomNumber,
        roomType: room.ac ? 'ac' : 'non_ac',
        roomKind: room.kind,
        capacity: room.capacity,
        usedBefore,
        freeBefore: Number(room.free) || 0,
        roomStatusBefore: usedBefore <= 0 ? 'free' : room.free > 0 ? 'partial' : 'full',
        exactMatch: Boolean(room.empty && room.capacity === size)
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.score - a.score || String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, { numeric: true })
    );
}

export function mergePlacementRoomOption(placement, roomOption) {
  if (!placement || !roomOption) return placement;
  return {
    ...placement,
    roomNumber: roomOption.roomNumber,
    roomType: roomOption.roomType,
    roomKind: roomOption.roomKind,
    capacity: roomOption.capacity,
    usedBefore: roomOption.usedBefore,
    freeBefore: roomOption.freeBefore,
    roomStatusBefore: roomOption.roomStatusBefore,
    exactMatch: roomOption.exactMatch
  };
}

/**
 * Collapse placements that share the same hotel room into one UI row,
 * keeping subPlacements for per-booking save fan-out.
 */
export function groupPlacementsByRoom(placements) {
  const map = new Map();
  (Array.isArray(placements) ? placements : []).forEach((placement) => {
    if (!placement) return;
    const key = `${String(placement.hotelId || '')}|${String(placement.roomNumber || '')}`;
    const members = Array.isArray(placement.members) ? placement.members : [];
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        ...placement,
        members: [...members],
        subPlacements: [placement]
      });
      return;
    }
    existing.members = existing.members.concat(members);
    existing.subPlacements.push(placement);
  });
  return Array.from(map.values());
}

/** Fan merged panel choice back to one placement per original booking. */
export function expandGroupedPlacementChoice(panel) {
  if (!panel?.placement) return [];
  const chosen = mergePlacementRoomOption(panel.placement, panel.alternatives?.[panel.altIndex]);
  const subs =
    Array.isArray(panel.subPlacements) && panel.subPlacements.length
      ? panel.subPlacements
      : [panel.placement];
  return subs.map((sub) => mergePlacementRoomOption(sub, chosen));
}

function cloneAvailability(byHotel) {
  const next = new Map();
  byHotel.forEach((entry, id) => {
    next.set(id, {
      ...entry,
      rooms: entry.rooms.map((r) => ({ ...r }))
    });
  });
  return next;
}

function applyPlacement(byHotel, hotelId, roomNumber, count) {
  const entry = byHotel.get(hotelId);
  if (!entry) return;
  const room = entry.rooms.find((r) => String(r.roomNumber) === String(roomNumber));
  if (!room) return;
  room.used += count;
  room.free = Math.max(0, room.capacity - room.used);
  room.empty = room.used === 0;
  entry.freeBeds = entry.rooms.reduce((sum, r) => sum + r.free, 0);
}

/**
 * Group selected tile people into parties (one per booking), primary first.
 */
export function partiesFromSelectedPeople(selectedIds, people) {
  const idSet = selectedIds instanceof Set ? selectedIds : new Set(selectedIds || []);
  const map = new Map();
  (Array.isArray(people) ? people : []).forEach((person) => {
    if (!person || !idSet.has(person.id) || !person.bookingId) return;
    const list = map.get(person.bookingId) || [];
    list.push(person);
    map.set(person.bookingId, list);
  });
  return Array.from(map.entries()).map(([bookingId, members]) => {
    const ordered = [...members].sort((a, b) => Number(b.primary) - Number(a.primary));
    const primary = ordered.find((m) => m.primary) || ordered[0];
    const stay = peopleStayWindow(ordered);
    return {
      bookingId,
      plan: primary?.plan === 'paid' ? 'paid' : 'free',
      placeLabel: registrationLocationShort(primary?.place),
      members: ordered,
      size: ordered.length,
      needsClose: hasSeniorOrSpecial(ordered),
      mixed: isMixedGender(ordered),
      stayStartDate: stay.start || '',
      stayEndDate: stay.end || ''
    };
  });
}

function hotelScore(entry, parties, eventLocationLabel = '') {
  let score = 1000 - entry.distanceKm * 80;
  const anyNeedsClose = parties.some((p) => p.needsClose);
  if (anyNeedsClose) score -= entry.distanceKm * 40;

  // Prefer hotels that can host at least one party
  let canHost = 0;
  parties.forEach((party) => {
    if (pickBestRoom(entry.rooms, party.members)) canHost += 1;
  });
  score += canHost * 120;
  score += Math.min(entry.freeBeds, 40) * 2;

  if (eventLocationLabel) {
    const match = parties.some(
      (p) =>
        p.placeLabel &&
        String(p.placeLabel).toLowerCase() === String(eventLocationLabel).toLowerCase()
    );
    if (match && entry.distanceKm <= 3) score += 50;
  }
  return score;
}

/**
 * Rank hotels for selected parties and propose room placements (greedy, doc rules simplified).
 * Returns { ranked, placements, uncoveredPartyIds, pageSize }.
 */
export function suggestHotelsForSelection({
  hotels,
  allotments,
  selectedIds,
  people,
  eventLocationLabel = ''
} = {}) {
  const parties = partiesFromSelectedPeople(selectedIds, people).filter((p) => p.size > 0);
  const empty = {
    parties,
    ranked: [],
    placements: [],
    uncoveredPartyIds: parties.map((p) => p.bookingId),
    pageSize: PAGE_SIZE,
    selectedPeople: parties.flatMap((p) => p.members)
  };
  if (!parties.length) return empty;

  const selectionWindow = mergeStayWindows(
    parties.map((p) => ({ start: p.stayStartDate, end: p.stayEndDate }))
  );
  const availability = buildRoomAvailability(hotels, allotments, selectionWindow);
  if (!availability.size) return empty;

  const ranked = Array.from(availability.values())
    .map((entry) => ({
      hotelId: entry.hotel.id,
      hotelName: entry.hotel.name,
      address: entry.hotel.address || '',
      distanceKm: entry.distanceKm,
      freeBeds: entry.freeBeds,
      stats: hotelRoomStats(entry.hotel),
      score: hotelScore(entry, parties, eventLocationLabel),
      hotel: entry.hotel
    }))
    .filter((row) => row.freeBeds > 0)
    .sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);

  // Place parties: event-location-ish first, then seniors closer, then larger parties
  const orderedParties = [...parties].sort((a, b) => {
    const aLoc =
      eventLocationLabel &&
      a.placeLabel &&
      String(a.placeLabel).toLowerCase() === String(eventLocationLabel).toLowerCase()
        ? 0
        : 1;
    const bLoc =
      eventLocationLabel &&
      b.placeLabel &&
      String(b.placeLabel).toLowerCase() === String(eventLocationLabel).toLowerCase()
        ? 0
        : 1;
    if (aLoc !== bLoc) return aLoc - bLoc;
    if (Number(b.needsClose) !== Number(a.needsClose)) return Number(b.needsClose) - Number(a.needsClose);
    return b.size - a.size;
  });

  const pending = [];
  const placements = [];
  const uncovered = [];

  orderedParties.forEach((party) => {
    const stay = {
      start: party.stayStartDate || '',
      end: party.stayEndDate || ''
    };
    const partyAvailability = buildRoomAvailability(hotels, allotments, stay, pending);
    // Prefer closer hotels when needsClose; else follow ranked order
    const hotelOrder = [...ranked].sort((a, b) => {
      if (party.needsClose) return a.distanceKm - b.distanceKm || b.score - a.score;
      return b.score - a.score || a.distanceKm - b.distanceKm;
    });

    let placed = false;
    for (const h of hotelOrder) {
      const entry = partyAvailability.get(h.hotelId);
      if (!entry) continue;
      const room = pickBestRoom(entry.rooms, party.members);
      if (!room) continue;
      const usedBefore = Number(room.used) || 0;
      placements.push({
        bookingId: party.bookingId,
        plan: party.plan,
        hotelId: h.hotelId,
        hotelName: h.hotelName,
        distanceKm: h.distanceKm,
        roomNumber: room.roomNumber,
        roomType: room.ac ? 'ac' : 'non_ac',
        roomKind: room.kind,
        capacity: room.capacity,
        usedBefore,
        freeBefore: Number(room.free) || 0,
        roomStatusBefore: usedBefore <= 0 ? 'free' : room.free > 0 ? 'partial' : 'full',
        exactMatch: room.empty && room.capacity === party.size,
        members: party.members,
        placeLabel: party.placeLabel,
        stayStartDate: stay.start || '',
        stayEndDate: stay.end || ''
      });
      pending.push({
        hotelId: h.hotelId,
        roomNumber: room.roomNumber,
        count: party.size,
        start: stay.start,
        end: stay.end
      });
      placed = true;
      break;
    }
    if (!placed) uncovered.push(party.bookingId);
  });

  // Boost ranked hotels that appear in the proposal
  const usedIds = new Set(placements.map((p) => p.hotelId));
  ranked.forEach((row) => {
    if (usedIds.has(row.hotelId)) row.inProposal = true;
    else row.inProposal = false;
  });
  ranked.sort(
    (a, b) =>
      Number(b.inProposal) - Number(a.inProposal) ||
      b.score - a.score ||
      a.distanceKm - b.distanceKm
  );

  return {
    parties,
    ranked,
    placements,
    uncoveredPartyIds: uncovered,
    pageSize: PAGE_SIZE,
    selectedPeople: parties.flatMap((p) => p.members)
  };
}

export function hotelSuggestionPage(ranked, pageIndex = 0, pageSize = PAGE_SIZE) {
  const list = Array.isArray(ranked) ? ranked : [];
  const size = Math.max(1, pageSize || PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(list.length / size) || 1);
  const page = Math.min(Math.max(0, pageIndex), totalPages - 1);
  return {
    items: list.slice(page * size, page * size + size),
    page,
    totalPages,
    total: list.length
  };
}

/** True when hotels on this page alone cannot cover all free-bed need for remaining placements. */
export function pageNeedsMoreHotels(suggestion, pageItems) {
  if (!suggestion || !suggestion.placements?.length) return false;
  const pageIds = new Set((pageItems || []).map((h) => h.hotelId));
  const bedsOnPage = (pageItems || []).reduce((sum, h) => sum + (Number(h.freeBeds) || 0), 0);
  const people = suggestion.selectedPeople?.length || 0;
  const placementsOffPage = suggestion.placements.some((p) => !pageIds.has(p.hotelId));
  return placementsOffPage || bedsOnPage < people;
}

function allotmentPersonCount(row) {
  if (row?.personCount != null) return Number(row.personCount) || 0;
  return Array.isArray(row?.guests) ? row.guests.length : 0;
}

/** Room fill counts for one hotel: full / partial / free. */
export function hotelRoomFillCounts(hotel, allotments) {
  const hotelId = String(hotel?.id || '');
  const rooms = Array.isArray(hotel?.rooms) ? hotel.rooms : [];
  const occupied = new Map();
  (Array.isArray(allotments) ? allotments : []).forEach((row) => {
    if (!row || String(row.hotelId || '') !== hotelId) return;
    const roomNumber = String(row.roomNumber || '');
    if (!roomNumber) return;
    occupied.set(roomNumber, (occupied.get(roomNumber) || 0) + allotmentPersonCount(row));
  });

  let full = 0;
  let partial = 0;
  let free = 0;
  rooms.forEach((room) => {
    if (!room || String(room.status || 'available') === 'blocked') return;
    const capacity = Math.max(0, Number(room.capacity) || 0);
    if (!capacity) return;
    const used = occupied.get(String(room.roomNumber || '')) || 0;
    if (used <= 0) free += 1;
    else if (used >= capacity) full += 1;
    else partial += 1;
  });
  return { full, partial, free, roomCount: full + partial + free };
}

export function hotelPeopleAccommodatedSoFar(hotelId, allotments) {
  const id = String(hotelId || '');
  return (Array.isArray(allotments) ? allotments : [])
    .filter((row) => row && String(row.hotelId || '') === id)
    .reduce((sum, row) => sum + allotmentPersonCount(row), 0);
}

/** Location labels with people counts already at this hotel, e.g. Tirupati(12). */
export function hotelLocationPeopleSummary(hotelId, allotments) {
  const id = String(hotelId || '');
  const counts = new Map();
  (Array.isArray(allotments) ? allotments : []).forEach((row) => {
    if (!row || String(row.hotelId || '') !== id) return;
    const label = registrationLocationShort(row.place) || 'Unknown';
    counts.set(label, (counts.get(label) || 0) + allotmentPersonCount(row));
  });
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function roomCurrentOccupants(hotelId, roomNumber, allotments) {
  return roomCurrentOccupantFamilies(hotelId, roomNumber, allotments).flatMap(
    (family) => family.members || []
  );
}

/**
 * Occupant families already in a room (one allotment row = one family tile).
 * @param {{ start?: string, end?: string }|null} stayWindow when set, skip non-overlapping stays
 */
export function roomCurrentOccupantFamilies(hotelId, roomNumber, allotments, stayWindow = null) {
  const hid = String(hotelId || '');
  const room = String(roomNumber || '');
  const windowStart = parseStayDay(stayWindow?.start);
  const windowEnd = parseStayDay(stayWindow?.end);
  const hasWindow = Boolean(windowStart && windowEnd);
  const families = [];
  (Array.isArray(allotments) ? allotments : []).forEach((row) => {
    if (!row || String(row.hotelId || '') !== hid || String(row.roomNumber || '') !== room) return;
    const allotStay = allotmentStayWindow(row);
    if (hasWindow && !staysOverlap(allotStay.start, allotStay.end, windowStart, windowEnd)) return;
    const location = registrationLocationShort(row.place) || '—';
    const stay = stayRangeLabel(row.checkInDate, row.checkOutDate) || '—';
    const statusRaw = String(row.status || 'allotted').toLowerCase();
    const status = statusRaw === 'checked_in' ? 'checked_in' : 'allotted';
    const guests = Array.isArray(row.guests) ? row.guests : [];
    const members = guests.length
      ? guests.map((g) => ({
          name: g?.name || row.familyFullName || 'Guest',
          livePhoto: g?.livePhoto || '',
          age: g?.age || '',
          location,
          stay:
            stayRangeLabel(g?.stayStartDate || row.checkInDate, g?.stayEndDate || row.checkOutDate) ||
            stay
        }))
      : [
          {
            name: row.familyFullName || 'Guest',
            livePhoto: '',
            age: '',
            location,
            stay
          }
        ];
    families.push({ status, members });
  });
  return families;
}

function personInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function encodeMembersAttr(members) {
  try {
    return encodeURIComponent(JSON.stringify(Array.isArray(members) ? members : []));
  } catch {
    return encodeURIComponent('[]');
  }
}

/** Stage content for one person inside an allot photo tile. */
export function allotPersonStageHtml(person) {
  const photo = String(person?.livePhoto || '').trim();
  const location = String(person?.location || '').trim();
  const age = ageGroupLabel(person?.age);
  const media = photo
    ? `<img class="x-allot-person-photo" src="${escapeHtml(photo)}" alt="">`
    : `<div class="x-allot-person-photo x-allot-person-fallback" aria-hidden="true">${escapeHtml(personInitials(person?.name))}</div>`;
  return (
    media +
    `<div class="x-allot-person-overlay">` +
    `<span class="x-allot-person-name">${escapeHtml(person?.name || 'Guest')}</span>` +
    (location ? `<span class="x-allot-person-meta">${escapeHtml(location)}</span>` : '') +
    (age ? `<span class="x-allot-person-age">${escapeHtml(age)}</span>` : '') +
    `</div>`
  );
}

/** Max visible person tiles per group before pager. */
export const ALLOT_PERSON_PAGE_SIZE = 5;

/**
 * One person photo tile (no in-tile family cycling).
 * @param {'occupied'|'incoming'} kind
 */
export function allotPersonTileHtml(person, { kind = 'incoming', status = '' } = {}) {
  if (!person) return '';
  const badgeStatus = status || person.status || '';
  const badge =
    kind === 'occupied'
      ? badgeStatus === 'checked_in'
        ? `<span class="x-allot-person-badge is-checked-in">Checked in</span>`
        : `<span class="x-allot-person-badge is-allotted">Allotted</span>`
      : `<span class="x-allot-person-badge is-incoming">To allot</span>`;

  return (
    `<article class="x-allot-person-tile is-${kind}">` +
    badge +
    `<div class="x-allot-person-stage">${allotPersonStageHtml(person)}</div>` +
    `</article>`
  );
}

/**
 * Up to 5 person tiles; prev/next edge controls when more people exist.
 * @param {'occupied'|'incoming'} kind
 */
export function allotPersonStripHtml(people, { kind = 'incoming', page = 0 } = {}) {
  const list = (Array.isArray(people) ? people : []).filter(Boolean);
  if (!list.length) return '';
  const pageSize = ALLOT_PERSON_PAGE_SIZE;
  const total = list.length;
  const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1);
  const safePage = Math.min(Math.max(0, Number(page) || 0), maxPage);
  const start = safePage * pageSize;
  const slice = list.slice(start, start + pageSize);
  const tiles = slice
    .map((person) => allotPersonTileHtml(person, { kind, status: person.status || '' }))
    .join('');
  const from = start + 1;
  const to = start + slice.length;
  const hasPager = total > pageSize;
  const pager =
    hasPager
      ? `<div class="x-allot-person-pager" role="navigation" aria-label="More people">` +
        `<button type="button" class="x-allot-person-pager-btn js-person-prev" ${
          safePage <= 0 ? 'disabled ' : ''
        }aria-label="Previous people">` +
        `<span uk-icon="icon: chevron-left; ratio: 1"></span></button>` +
        `<span class="x-allot-person-pager-count" aria-live="polite">${from}–${to} of ${total}</span>` +
        `<button type="button" class="x-allot-person-pager-btn js-person-next" ${
          safePage >= maxPage ? 'disabled ' : ''
        }aria-label="Next people">` +
        `<span uk-icon="icon: chevron-right; ratio: 1"></span></button>` +
        `</div>`
      : '';

  return (
    `<div class="x-allot-person-strip" data-people="${encodeMembersAttr(list)}" ` +
    `data-kind="${escapeHtml(kind)}" data-page="${safePage}">` +
    `<div class="x-allot-person-row">${tiles}</div>` +
    pager +
    `</div>`
  );
}

function normalizeAllotmentMobile(value) {
  return String(value || '').replace(/\D/g, '');
}

function allotmentPersonKey(person, bookingId = '') {
  const mobile = normalizeAllotmentMobile(person?.mobile);
  if (mobile) return `m:${mobile}`;
  const name = String(person?.name || '')
    .trim()
    .toLowerCase();
  if (name) return `n:${String(bookingId || '').trim()}:${name}`;
  return '';
}

function roomMoveLabel(hotelName, roomNumber) {
  const room = String(roomNumber || '').trim();
  const hotel = String(hotelName || '').trim();
  if (hotel && room) return `${hotel} #${room}`;
  if (room) return `Room ${room}`;
  return hotel || 'previous room';
}

/**
 * Prior room assignments for people about to be placed (old room freed on save).
 */
export function priorAllotmentMoves(placement, allotments = []) {
  const toHotelId = String(placement?.hotelId || '').trim();
  const toHotel = String(placement?.hotelName || '').trim();
  const toRoom = String(placement?.roomNumber || '').trim();
  const bookingId = String(placement?.bookingId || '').trim();
  const members = Array.isArray(placement?.members) ? placement.members : [];
  const moves = [];
  const seen = new Set();
  members.forEach((member) => {
    const key = allotmentPersonKey(member, bookingId);
    if (!key || seen.has(key)) return;
    const prior = (Array.isArray(allotments) ? allotments : []).find((row) => {
      if (!row) return false;
      const sameRoom =
        String(row.hotelId || '') === toHotelId && String(row.roomNumber || '') === toRoom;
      if (sameRoom) return false;
      return (Array.isArray(row.guests) ? row.guests : []).some(
        (g) => allotmentPersonKey(g, row.bookingId) === key
      );
    });
    if (!prior) return;
    seen.add(key);
    moves.push({
      name: member?.name || prior.familyFullName || 'Guest',
      fromHotel: prior.hotelName || '',
      fromRoom: prior.roomNumber || '',
      toHotel: toHotel || prior.hotelName || '',
      toRoom
    });
  });
  return moves;
}

/** Plain text summary for notifications / confirm copy. */
export function formatAllotmentMovesMessage(moves) {
  const list = Array.isArray(moves) ? moves.filter(Boolean) : [];
  if (!list.length) return '';
  if (list.length === 1) {
    const m = list[0];
    return `${m.name || 'Guest'}: ${roomMoveLabel(m.fromHotel, m.fromRoom)} → ${roomMoveLabel(
      m.toHotel,
      m.toRoom
    )}`;
  }
  return list
    .map(
      (m) =>
        `${m.name || 'Guest'}: ${roomMoveLabel(m.fromHotel, m.fromRoom)} → ${roomMoveLabel(
          m.toHotel,
          m.toRoom
        )}`
    )
    .join(' · ');
}

function allotMoveNoticeHtml(moves) {
  const list = Array.isArray(moves) ? moves.filter(Boolean) : [];
  if (!list.length) return '';
  const lines = list
    .map((m) => {
      const from = roomMoveLabel(m.fromHotel, m.fromRoom);
      const to = roomMoveLabel(m.toHotel, m.toRoom);
      return (
        `<li><strong>${escapeHtml(m.name || 'Guest')}</strong>: ` +
        `<span class="x-allot-move-from">${escapeHtml(from)}</span>` +
        `<span class="x-allot-move-arrow" aria-hidden="true"> → </span>` +
        `<span class="x-allot-move-to">${escapeHtml(to)}</span>` +
        ` <em>(old room freed)</em></li>`
      );
    })
    .join('');
  return (
    `<div class="x-allot-move-notice" role="status">` +
    `<p class="x-allot-move-notice-title">Moving from previous room</p>` +
    `<ul class="x-allot-move-notice-list">${lines}</ul>` +
    `</div>`
  );
}

/** Inner HTML for one room recommendation panel (supports smart next/prev). */
export function allotRoomPanelInnerHtml(placement, { altIndex = 0, altTotal = 1, allotments = [] } = {}) {
  const status = placement.roomStatusBefore || (placement.usedBefore > 0 ? 'partial' : 'free');
  const incoming = Array.isArray(placement.members) ? placement.members : [];
  const incomingStay = peopleStayWindow(incoming);
  const families =
    Number(placement.usedBefore) > 0 || status === 'partial' || status === 'full'
      ? roomCurrentOccupantFamilies(
          placement.hotelId,
          placement.roomNumber,
          allotments,
          incomingStay
        )
      : [];
  const multi = altTotal > 1;
  const nav =
    `<div class="x-allot-room-nav">` +
    `<button type="button" class="x-allot-room-nav-btn js-room-prev" ${multi ? '' : 'disabled '}aria-label="Previous recommended room">` +
    `<span uk-icon="icon: chevron-left; ratio: 0.9"></span></button>` +
    `<span class="x-allot-room-nav-count">${altIndex + 1}/${altTotal}</span>` +
    `<button type="button" class="x-allot-room-nav-btn js-room-next" ${multi ? '' : 'disabled '}aria-label="Next recommended room">` +
    `<span uk-icon="icon: chevron-right; ratio: 0.9"></span></button>` +
    `</div>`;

  const roomChips =
    `<span class="x-allot-chip ${placement.roomType === 'ac' ? 'is-ac' : 'is-nonac'}">` +
    `${placement.roomType === 'ac' ? 'AC' : 'Non-AC'}</span>` +
    `<span class="x-allot-chip is-muted">${escapeHtml(placement.roomKind || 'regular')}</span>` +
    `<span class="x-allot-chip is-ink"><strong>${placement.capacity || '—'}</strong> beds</span>`;

  const occupiedPeople = families.flatMap((family) =>
    (Array.isArray(family.members) ? family.members : []).map((member) => ({
      ...member,
      status: family.status
    }))
  );

  const incomingMembers = incoming.map((m) => ({
    name: m?.name || 'Guest',
    livePhoto: m?.livePhoto || '',
    age: m?.age || '',
    location: registrationLocationShort(m?.place) || '',
    mobile: m?.mobile || ''
  }));

  const occupiedStrip = allotPersonStripHtml(occupiedPeople, { kind: 'occupied' });
  const incomingStrip = allotPersonStripHtml(incomingMembers, { kind: 'incoming' });
  const moveNotice = allotMoveNoticeHtml(priorAllotmentMoves(placement, allotments));

  const occupiedGroup = occupiedStrip
    ? `<section class="x-allot-room-group is-occupied" aria-label="Already here">${occupiedStrip}</section>`
    : '';

  const incomingGroup = incomingStrip
    ? `<section class="x-allot-room-group is-incoming" aria-label="Going to allot">${incomingStrip}</section>`
    : '';

  return (
    moveNotice +
    `<div class="x-allot-room-layout">` +
    `<aside class="x-allot-room-rail">` +
    `<div class="x-allot-room-number">${escapeHtml(placement.roomNumber)}</div>` +
    `<div class="x-allot-chip-row">${roomChips}</div>` +
    nav +
    `</aside>` +
    `<div class="x-allot-room-groups${occupiedStrip ? ' has-occupied' : ''}">` +
    occupiedGroup +
    incomingGroup +
    `</div></div>`
  );
}

/**
 * Minimal allotment confirm body for one hotel (UIkit modal HTML).
 * @param {object} suggestion
 * @param {{ focusHotelId?: string, hotels?: object[], allotments?: object[], panelStates?: object[] }} opts
 */
export function allotmentConfirmHtml(
  suggestion,
  { focusHotelId = '', hotels = [], allotments = [], panelStates = null } = {}
) {
  const placements = Array.isArray(suggestion?.placements) ? suggestion.placements : [];
  const hotelId = String(focusHotelId || placements[0]?.hotelId || '');
  const rows = placements.filter((p) => String(p.hotelId || '') === hotelId);
  if (!rows.length) {
    return `<p class="uk-margin-remove-top">No suitable rooms found for the selected people.</p>`;
  }

  const hotel =
    (Array.isArray(hotels) ? hotels : []).find((h) => h && String(h.id) === hotelId) || null;
  const hotelName = hotel?.name || rows[0].hotelName || 'Hotel';
  const stats = hotel ? hotelRoomStats(hotel) : { roomCount: 0, capacity: 0 };
  const distanceKm = hotel?.distanceKm ?? rows[0].distanceKm;
  const address = String(hotel?.address || '').trim();
  const image = String(hotel?.image || '').trim();
  const thumb = image
    ? `<img class="x-allot-hotel-thumb" src="${escapeHtml(image)}" alt="">`
    : `<div class="x-allot-hotel-thumb is-empty" aria-hidden="true"><span uk-icon="icon: home; ratio: 1.1"></span></div>`;

  const chips =
    (Number(distanceKm) >= 0
      ? `<span class="x-allot-chip is-gold">${escapeHtml(String(distanceKm))} km</span>`
      : '') +
    (stats.roomCount
      ? `<span class="x-allot-chip is-ink"><strong>${stats.roomCount}</strong> rooms</span>`
      : '') +
    (stats.capacity
      ? `<span class="x-allot-chip is-ink"><strong>${stats.capacity}</strong> beds</span>`
      : '');

  const panels = Array.isArray(panelStates) && panelStates.length ? panelStates : null;
  const panelList = panels || rows.map((p) => ({ placement: p, altIndex: 0, alternatives: [p] }));
  const panelTotal = panelList.length;
  const multiPanel = panelTotal > 1;
  const roomBlocks = panelList
    .map((panel, index) => {
      const placement = panels
        ? mergePlacementRoomOption(panel.placement, panel.alternatives[panel.altIndex])
        : panel.placement || panel;
      const altTotal = panels ? panel.alternatives.length : 1;
      const altIndex = panels ? panel.altIndex : 0;
      const hidden = index === 0 ? '' : ' is-hidden';
      return (
        `<div class="x-allot-room-panel${hidden}" data-panel-index="${index}" data-booking-id="${escapeHtml(placement.bookingId || '')}">` +
        allotRoomPanelInnerHtml(placement, { altIndex, altTotal, allotments }) +
        `</div>`
      );
    })
    .join('');

  const panelCount = multiPanel
    ? `<div class="x-allot-panel-count" role="navigation" aria-label="Room allotments">` +
      `<button type="button" class="x-allot-panel-count-btn js-panel-prev" disabled aria-label="Previous room allotment">` +
      `<span uk-icon="icon: chevron-left; ratio: 1.1"></span></button>` +
      `<span class="x-allot-panel-count-label" aria-live="polite">` +
      `<span class="js-panel-count-current">1</span> of ${panelTotal} rooms` +
      `</span>` +
      `<button type="button" class="x-allot-panel-count-btn js-panel-next" aria-label="Next room allotment">` +
      `<span uk-icon="icon: chevron-right; ratio: 1.1"></span></button>` +
      `</div>`
    : '';

  return (
    `<div class="x-allot-confirm${multiPanel ? ' has-panel-nav' : ''}" data-panel-total="${panelTotal}">` +
    `<div class="x-allot-hotel-head">` +
    thumb +
    `<div class="x-allot-hotel-copy">` +
    `<h3 class="x-allot-confirm-title uk-modal-title">${escapeHtml(hotelName)}</h3>` +
    (address ? `<p class="x-allot-confirm-summary">${escapeHtml(address)}</p>` : '') +
    `<div class="x-allot-chip-row" role="group" aria-label="Hotel facts">${chips}</div>` +
    `</div></div>` +
    `<div class="x-allot-panel-stage" data-active="0" data-total="${panelTotal}">` +
    `<div class="x-allot-panel-viewport">${roomBlocks}</div>` +
    `</div>` +
    panelCount +
    `</div>`
  );
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
