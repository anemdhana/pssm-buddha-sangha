import { hotelStats } from './stayHotels.js';
import { parseStayDay } from './stayAllotmentSuggest.js';

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
 * Peak nightly bed demand from stay-range people counts vs open (non-reserved) hotel beds.
 * Stay ranges use the same half-open nights as allotment overlap: [start, end).
 */
export function summarizeRegistrationCapacity({ hotels, stayRanges } = {}) {
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

  const busiestNights = Array.from(demandByNight.entries())
    .map(([night, people]) => ({ night, people }))
    .sort((a, b) => b.people - a.people || a.night.localeCompare(b.night))
    .slice(0, 5);

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
    busiestNights
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
