import {
  ageGroupLabel,
  allotmentRoomKindLabel,
  allotmentRoomTypeLabel,
  allotmentStatusLabel,
  registrationLocationShort
} from './stayAllotments.js';
import { stayRangeLabel } from './stayRegistrations.js';

const ID_LABELS = {
  aadhaar: 'Aadhaar',
  voter: 'Voter ID',
  pan: 'PAN',
  passport: 'Passport',
  driving: 'Driving licence',
  other: 'Other ID'
};

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stayNightCount(start, end) {
  const a = Date.parse(String(start || '').trim());
  const b = Date.parse(String(end || '').trim());
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.round((b - a) / 86400000);
}

function namesMatch(a, b) {
  return (
    String(a || '')
      .trim()
      .toLowerCase() ===
    String(b || '')
      .trim()
      .toLowerCase()
  );
}

function pickSourceFromBooking(person, booking) {
  const family = booking?.family && typeof booking.family === 'object' ? booking.family : {};
  const members = Array.isArray(family.members) ? family.members : [];
  if (person?.primary) return family;
  const byName = members.find((m) => namesMatch(m?.name, person?.name));
  if (byName) return byName;
  const idx = Number(person?.guestIndex);
  if (Number.isFinite(idx) && idx >= 0 && members[idx]) return members[idx];
  return {};
}

export function enrichAllotmentPersonDetail(person, booking) {
  const base = person && typeof person === 'object' ? person : {};
  const source = pickSourceFromBooking(base, booking);
  const family = booking?.family && typeof booking.family === 'object' ? booking.family : {};
  return {
    ...base,
    livePhoto: String(base.livePhoto || source.livePhoto || family.livePhoto || '').trim(),
    idProofPhoto: String(base.idProofPhoto || source.idProofPhoto || family.idProofPhoto || '').trim(),
    idType: String(base.idType || source.idType || family.idType || '').trim(),
    mobile: String(base.mobile || source.mobile || family.mobile || booking?.familyMobile || '').trim(),
    familyMobile: String(base.familyMobile || booking?.familyMobile || family.mobile || '').trim(),
    relation: String(base.relation || source.relation || (base.primary ? 'Self' : '')).trim(),
    meditation: String(base.meditation || source.meditation || family.meditation || '').trim(),
    profession: String(base.profession || source.profession || family.profession || '').trim(),
    gender: String(base.gender || source.gender || family.gender || '').trim(),
    age: String(base.age || source.age || family.age || '').trim(),
    place: base.place || source.place || family.place || booking?.place || {},
    eventName: base.eventName || booking?.eventName || ''
  };
}

function detailField(label, valueHtml, { wide = false } = {}) {
  const raw = typeof valueHtml === 'string' ? valueHtml.trim() : '';
  if (!raw) return '';
  return (
    `<div class="x-allot-detail-field${wide ? ' is-wide' : ''}">` +
    `<span class="x-allot-detail-label">${escapeHtml(label)}</span>` +
    `<span class="x-allot-detail-value">${raw}</span>` +
    `</div>`
  );
}

function detailText(label, value, opts) {
  const text = String(value || '').trim();
  if (!text) return '';
  return detailField(label, escapeHtml(text), opts);
}

function telLink(mobile) {
  const digits = String(mobile || '').replace(/\D/g, '');
  if (!digits) return '';
  const display = String(mobile || '').trim() || digits;
  return `<a class="x-allot-detail-tel" href="tel:${escapeHtml(digits)}">${escapeHtml(display)}</a>`;
}

function photoBlock(src, label, kind) {
  const url = String(src || '').trim();
  if (url) {
    return (
      `<figure class="x-allot-detail-photo is-${kind}">` +
      `<img src="${escapeHtml(url)}" alt="${escapeHtml(label)}" />` +
      `<figcaption>${escapeHtml(label)}</figcaption>` +
      `</figure>`
    );
  }
  return (
    `<figure class="x-allot-detail-photo is-${kind} is-empty">` +
    `<div class="x-allot-detail-photo-empty" aria-hidden="true">No ${escapeHtml(label.toLowerCase())}</div>` +
    `<figcaption>${escapeHtml(label)}</figcaption>` +
    `</figure>`
  );
}

export function allotmentPersonDetailHtml(person) {
  const p = person && typeof person === 'object' ? person : {};
  const stayLabel = stayRangeLabel(p.checkInDate, p.checkOutDate);
  const nights = stayNightCount(p.checkInDate, p.checkOutDate);
  const stayText = stayLabel
    ? `${stayLabel}${nights > 0 ? ` · ${nights} ${nights === 1 ? 'night' : 'nights'}` : ''}`
    : '';
  const place = registrationLocationShort(p.place);
  const idType = ID_LABELS[p.idType] || p.idType || 'ID card';
  const mobileHtml = telLink(p.mobile);
  const familyMobileHtml =
    p.familyMobile && p.familyMobile !== p.mobile ? telLink(p.familyMobile) : '';

  const fields =
    (mobileHtml ? detailField('Mobile', mobileHtml) : '') +
    (familyMobileHtml ? detailField('Family mobile', familyMobileHtml) : '') +
    detailText('Hotel', p.hotelName, { wide: true }) +
    detailText(
      'Room',
      [p.roomNumber ? `#${p.roomNumber}` : '', allotmentRoomTypeLabel(p.roomType), allotmentRoomKindLabel(p.roomKind)]
        .filter(Boolean)
        .join(' · ')
    ) +
    detailText('Status', allotmentStatusLabel(p.status)) +
    detailText('Stay', stayText, { wide: true }) +
    detailText('Gender', p.gender) +
    detailText('Age', ageGroupLabel(p.age) || p.age) +
    detailText('Relation', p.relation) +
    detailText('Profession', p.profession) +
    detailText('Meditation', p.meditation) +
    detailText('Hometown', place) +
    detailText('Plan', p.plan === 'paid' ? 'Paid' : p.plan === 'free' ? 'Free' : '') +
    detailText('Event', p.eventName, { wide: true });

  return (
    `<div class="x-allot-detail">` +
    `<header class="x-allot-detail-head">` +
    `<h3 class="x-allot-detail-title">${escapeHtml(p.name || 'Guest')}</h3>` +
    (p.primary ? `<span class="x-allot-detail-badge">Primary</span>` : '') +
    `</header>` +
    `<div class="x-allot-detail-top">` +
    `<div class="x-allot-detail-photos">` +
    photoBlock(p.livePhoto, 'Live photo', 'live') +
    photoBlock(p.idProofPhoto, idType, 'id') +
    `</div>` +
    `<div class="x-allot-detail-grid">${fields}</div>` +
    `</div>` +
    `</div>`
  );
}

/**
 * Compact person detail modal for an allotted guest.
 * Enriches from the linked stay booking when possible (ID card, meditation, etc.).
 */
export async function openAllotmentPersonDetailDialog(person, { api } = {}) {
  if (!person) return;
  let detail = enrichAllotmentPersonDetail(person, null);

  if (api?.getStayBooking && person.bookingId) {
    try {
      const res = await api.getStayBooking(person.bookingId);
      const booking = res?.data?.booking || res?.data || null;
      if (booking) detail = enrichAllotmentPersonDetail(person, booking);
    } catch {
      /* keep allotment-only details */
    }
  }

  const bodyHtml = allotmentPersonDetailHtml(detail);
  const UIkit = typeof window !== 'undefined' ? window.UIkit : null;
  if (!UIkit?.modal?.dialog) {
    window.alert(`${detail.name || 'Guest'}\n${detail.hotelName || ''} Room ${detail.roomNumber || ''}`);
    return;
  }

  const html =
    `<button class="uk-modal-close-default" type="button" uk-close aria-label="Close"></button>` +
    `<div class="uk-modal-body x-allot-detail-body">${bodyHtml}</div>`;

  const modal = UIkit.modal.dialog(html, { stack: true });
  const el = modal.$el;
  const dialog = el.querySelector('.uk-modal-dialog');
  if (dialog) {
    dialog.classList.add('x-allot-detail-dialog', 'uk-margin-auto-vertical');
  }
  if (typeof UIkit.update === 'function') {
    try {
      UIkit.update(el);
    } catch {
      /* ignore */
    }
  }
}
