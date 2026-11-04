import { formatBookedAt, formatEventSub } from './password.js';
import { registrationPersonCount, stayRangeLabel } from './stayRegistrations.js';

/** Calendar days from today (local) to ISO date `YYYY-MM-DD`. Negative if past. */
export function daysUntilDate(isoDate, today = new Date()) {
  const raw = String(isoDate || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return null;
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86400000);
}

export function daysUntilPhrase(isoDate, { past = 'Passed', today = 'Today', futurePrefix = 'in' } = {}) {
  const days = daysUntilDate(isoDate);
  if (days == null) return '';
  if (days < 0) return past;
  if (days === 0) return today;
  if (days === 1) return `${futurePrefix} 1 day`;
  return `${futurePrefix} ${days} days`;
}

function guestNames(booking) {
  const guests = Array.isArray(booking?.guests) ? booking.guests.filter(Boolean) : [];
  if (guests.length) {
    return guests.map((g) => String(g.name || '').trim()).filter(Boolean);
  }
  const family = booking?.family || {};
  const names = [];
  if (family.fullName) names.push(String(family.fullName).trim());
  (Array.isArray(family.members) ? family.members : []).forEach((m) => {
    const n = String(m?.name || '').trim();
    if (n) names.push(n);
  });
  return names.filter(Boolean);
}

function primaryStayRange(booking) {
  const guests = Array.isArray(booking?.guests) ? booking.guests : [];
  const primary = guests.find((g) => g && g.primary) || guests[0];
  const start = primary?.stayStartDate || booking?.family?.stayStartDate || '';
  const end = primary?.stayEndDate || booking?.family?.stayEndDate || '';
  return { start, end, label: stayRangeLabel(start, end) };
}

const STATUS_LABEL = {
  pick_event: 'Pick an event',
  loading: 'Loading',
  error: 'Could not load',
  no_interest: 'Interest not recorded',
  awaiting_room: 'Awaiting hotel & room',
  allotted: 'Hotel assigned'
};

/**
 * Build display model for the signed-in home stay summary.
 */
export function buildHomeStaySummary({ picked, mine, loading, error }) {
  if (!picked?.id) {
    return {
      status: 'pick_event',
      statusLabel: STATUS_LABEL.pick_event,
      title: 'Your stay',
      eventTitle: '',
      eventDates: '',
      summary:
        'Choose an event in the header to see who is coming. Hotel and room appear only after Accommodation Volunteer assigns them.',
      highlight: null,
      rows: [],
      cta: null
    };
  }

  if (loading) {
    return {
      status: 'loading',
      statusLabel: STATUS_LABEL.loading,
      title: 'Your stay',
      eventTitle: picked.name || 'Event',
      eventDates: formatEventSub(picked),
      summary: 'Loading your stay interest…',
      highlight: null,
      rows: [],
      cta: null
    };
  }

  if (error) {
    return {
      status: 'error',
      statusLabel: STATUS_LABEL.error,
      title: 'Your stay',
      eventTitle: picked.name || 'Event',
      eventDates: formatEventSub(picked),
      summary: error,
      highlight: null,
      rows: [],
      cta: { to: '/stay', label: 'Open stay interest' }
    };
  }

  const event = mine?.event || {};
  const booking = mine?.booking || null;
  const allotments = Array.isArray(mine?.allotments) ? mine.allotments : [];
  const eventName = event.name || picked.name || 'Event';
  const eventDates = formatEventSub({
    startDate: event.startDate || picked.startDate,
    endDate: event.endDate || picked.endDate
  });
  const startIso = event.startDate || picked.startDate || '';
  const closesOn = event.bookingClosesOn || '';
  const untilEvent = daysUntilPhrase(startIso, {
    past: 'Event has started or ended',
    today: 'Starts today',
    futurePrefix: 'Starts in'
  });

  const base = {
    title: 'Your stay',
    eventTitle: eventName,
    eventDates,
    location: event.location ? String(event.location) : ''
  };

  const rows = [];
  if (event.location) {
    rows.push({ label: 'Place', value: String(event.location) });
  }

  if (!booking) {
    if (closesOn) {
      const untilClose = daysUntilPhrase(closesOn, {
        past: 'Booking window has closed',
        today: 'Closes today',
        futurePrefix: 'Closes in'
      });
      if (untilClose) {
        rows.push({ label: 'Record interest by', value: `${closesOn} · ${untilClose}` });
      }
    }
    return {
      ...base,
      status: 'no_interest',
      statusLabel: STATUS_LABEL.no_interest,
      summary:
        'Record who is coming and stay dates. Hotel and room are assigned later by Accommodation Volunteer — not chosen here.',
      highlight: untilEvent
        ? { label: 'Event', value: untilEvent }
        : null,
      rows,
      cta: { to: '/stay', label: 'Record who is coming' }
    };
  }

  const people = registrationPersonCount(booking);
  const names = guestNames(booking);
  const stay = primaryStayRange(booking);
  rows.push({
    label: 'Who is coming',
    value: `${people} person${people === 1 ? '' : 's'}${names.length ? ` · ${names.join(', ')}` : ''}`
  });
  if (stay.label && stay.label !== '—') {
    rows.push({ label: 'Stay dates', value: `${stay.label} · 11:00 AM` });
  }
  rows.push({
    label: 'Interest recorded',
    value: formatBookedAt(booking.bookedAt || booking.createdAt)
  });

  const untilStay = daysUntilPhrase(stay.start, {
    past: 'Stay has begun or passed',
    today: 'Check-in today',
    futurePrefix: 'Check-in in'
  });

  if (allotments.length === 0) {
    rows.push({
      label: 'Hotel & room',
      value: 'Not assigned yet — Accommodation Volunteer will allot later'
    });
    return {
      ...base,
      status: 'awaiting_room',
      statusLabel: STATUS_LABEL.awaiting_room,
      summary:
        'Interest recorded. Hotel and room details appear here after Accommodation Volunteer assigns them.',
      highlight: untilStay
        ? { label: 'Check-in', value: untilStay }
        : untilEvent
          ? { label: 'Event', value: untilEvent }
          : null,
      rows,
      cta: { to: '/stay', label: 'Update who is coming' }
    };
  }

  allotments.forEach((a, i) => {
    const hotel = String(a.hotelName || 'Hotel').trim();
    const room = String(a.roomNumber || '').trim();
    const bits = [hotel, room ? `Room ${room}` : ''].filter(Boolean).join(' · ');
    rows.push({
      label: allotments.length === 1 ? 'Hotel & room' : `Hotel & room ${i + 1}`,
      value: bits || 'Allotted'
    });
  });

  return {
    ...base,
    status: 'allotted',
    statusLabel: STATUS_LABEL.allotted,
    summary: 'Your stay interest and allotted hotel/room for this event.',
    highlight: untilStay
      ? { label: 'Check-in', value: untilStay }
      : untilEvent
        ? { label: 'Event', value: untilEvent }
        : null,
    rows,
    cta: { to: '/stay', label: 'Update who is coming' }
  };
}
