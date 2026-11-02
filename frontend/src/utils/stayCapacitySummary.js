import { hotelRoomStats, hotelStats } from './stayHotels.js';
import { parseStayDay } from './stayAllotmentSuggest.js';

function allotmentPeopleCount(row) {
  if (row?.personCount != null) return Math.max(0, Number(row.personCount) || 0);
  return Array.isArray(row?.guests) ? row.guests.length : 0;
}

/** Add N calendar days to a YYYY-MM-DD string (UTC date math). */
export function addStayDays(day, days) {
  const d = parseStayDay(day);
  if (!d) return '';
  const dt = new Date(`${d}T00:00:00.000Z`);
  if (Number.isNaN(dt.getTime())) return '';
  dt.setUTCDate(dt.getUTCDate() + Number(days || 0));
  return dt.toISOString().slice(0, 10);
}

/** Nights in half-open stay [start, end). */
export function eachStayNight(start, end) {
  const nights = [];
  let cursor = parseStayDay(start);
  const last = parseStayDay(end);
  if (!cursor || !last || cursor >= last) return nights;
  while (cursor < last) {
    nights.push(cursor);
    cursor = addStayDays(cursor, 1);
    if (!cursor) break;
  }
  return nights;
}

/** Merge stay-range facet rows by key, summing people counts. */
export function mergeStayRangeFacets(...lists) {
  const map = new Map();
  lists.flat().forEach((row) => {
    if (!row) return;
    const key = String(row.key || '').trim();
    if (!key || !key.includes('|')) return;
    const count = Math.max(0, Number(row.count) || 0);
    const prev = map.get(key);
    if (prev) {
      prev.count += count;
      return;
    }
    map.set(key, {
      key,
      label: String(row.label || key.replace('|', ' to ')),
      count
    });
  });
  return Array.from(map.values()).sort((a, b) => String(a.key).localeCompare(String(b.key)));
}

/**
 * Pick a compact non-reserved hotel set whose beds cover peak nightly demand.
 * Prefers hotels that already have allotments, then nearer, then larger capacity.
 * Includes inactive hotels so the UI can recommend activating them.
 */
export function suggestHotelsToCoverRegistrations({
  hotels,
  peakPeople = 0,
  allotments = []
} = {}) {
  const need = Math.max(0, Number(peakPeople) || 0);
  const allottedByHotel = new Map();
  (Array.isArray(allotments) ? allotments : []).forEach((row) => {
    if (!row) return;
    const id = String(row.hotelId || '');
    if (!id) return;
    allottedByHotel.set(id, (allottedByHotel.get(id) || 0) + allotmentPeopleCount(row));
  });

  const candidates = (Array.isArray(hotels) ? hotels : [])
    .filter((hotel) => hotel && hotel.reserved !== true)
    .map((hotel) => {
      const beds = hotelRoomStats(hotel).capacity;
      const distanceKm = Number(hotel.distanceKm) >= 0 ? Number(hotel.distanceKm) : 999;
      const hotelId = String(hotel.id || '');
      return {
        hotelId,
        hotelName: hotel.name || 'Hotel',
        beds,
        distanceKm,
        allottedPeople: allottedByHotel.get(hotelId) || 0,
        active: hotel.active !== false
      };
    })
    .filter((row) => row.hotelId && row.beds > 0)
    .sort((a, b) => {
      const scoreOf = (hotel) =>
        hotel.allottedPeople * 50 -
        hotel.distanceKm * 20 +
        Math.min(hotel.beds, need || hotel.beds) * 2;
      return (
        scoreOf(b) - scoreOf(a) ||
        a.distanceKm - b.distanceKm ||
        b.beds - a.beds ||
        String(a.hotelName).localeCompare(String(b.hotelName))
      );
    });

  const suggested = [];
  let suggestedBeds = 0;
  if (need > 0) {
    for (const hotel of candidates) {
      if (suggestedBeds >= need) break;
      suggested.push(hotel);
      suggestedBeds += hotel.beds;
    }
  }

  const suggestedIds = new Set(suggested.map((h) => h.hotelId));
  const activate = suggested.filter((h) => !h.active);
  const deactivate = candidates.filter((h) => h.active && !suggestedIds.has(h.hotelId));
  const availableBeds = candidates.reduce((sum, h) => sum + h.beds, 0);

  return {
    suggested,
    suggestedBeds,
    availableBeds,
    peakPeople: need,
    coversPeak: need <= 0 ? true : suggestedBeds >= need,
    shortfall: Math.max(0, need - suggestedBeds),
    activate,
    deactivate,
    candidateCount: candidates.length
  };
}

/**
 * Peak nightly bed demand from stay-range people counts vs open (non-reserved) hotel beds.
 * Stay ranges use the same half-open nights as allotment overlap: [start, end).
 */
export function summarizeRegistrationCapacity({ hotels, stayRanges, allotments = [] } = {}) {
  const inventory = hotelStats(hotels);
  const ranges = Array.isArray(stayRanges) ? stayRanges : [];
  const demandByNight = new Map();

  ranges.forEach((row) => {
    const key = String(row?.key || '');
    const [start, end] = key.split('|');
    const count = Math.max(0, Number(row?.count) || 0);
    if (!count) return;
    eachStayNight(start, end).forEach((night) => {
      demandByNight.set(night, (demandByNight.get(night) || 0) + count);
    });
  });

  let peakNight = '';
  let peakPeople = 0;
  demandByNight.forEach((people, night) => {
    if (people > peakPeople || (people === peakPeople && (!peakNight || night < peakNight))) {
      peakPeople = people;
      peakNight = night;
    }
  });

  const totalPeople = ranges.reduce((sum, row) => sum + Math.max(0, Number(row?.count) || 0), 0);
  const openBeds = Number(inventory.openBeds) || 0;
  const shortfall = Math.max(0, peakPeople - openBeds);
  const sufficient = peakPeople <= openBeds;

  const nightlyDemand = Array.from(demandByNight.entries())
    .map(([night, people]) => ({
      night,
      people,
      shortfall: Math.max(0, people - openBeds),
      covered: people <= openBeds
    }))
    .sort((a, b) => a.night.localeCompare(b.night));

  const busiestNights = [...nightlyDemand]
    .sort((a, b) => b.people - a.people || a.night.localeCompare(b.night))
    .slice(0, 5);

  const hotelPlan = suggestHotelsToCoverRegistrations({
    hotels,
    peakPeople,
    allotments
  });

  return {
    sufficient,
    shortfall,
    peakPeople,
    peakNight,
    totalPeople,
    openBeds,
    openHotels: inventory.openHotels,
    openRooms: inventory.openRooms,
    reservedBeds: inventory.reservedBeds,
    activeHotels: inventory.active,
    rangeCount: ranges.length,
    nightlyDemand,
    busiestNights,
    hotelPlan
  };
}

export function formatStayCapacityButtonLabel(summary) {
  if (!summary) return 'Capacity check';
  if (!summary.openBeds && !summary.totalPeople) return 'Capacity check';
  if (!summary.openBeds) return 'No open beds';
  if (!summary.totalPeople) return `Capacity · ${summary.openBeds} beds`;
  if (summary.sufficient) return `Capacity OK · peak ${summary.peakPeople}/${summary.openBeds}`;
  return `Need ${summary.shortfall} beds · peak ${summary.peakPeople}/${summary.openBeds}`;
}
