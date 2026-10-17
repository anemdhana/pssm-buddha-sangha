import {
  allotmentConfirmHtml,
  allotPersonStripHtml,
  allotRoomPanelInnerHtml,
  ALLOT_PERSON_PAGE_SIZE,
  expandGroupedPlacementChoice,
  groupPlacementsByRoom,
  listSmartRoomOptions,
  mergePlacementRoomOption
} from './stayAllotmentSuggest.js';

function roomConflicts(state, panelIndex, roomNumber) {
  const room = String(roomNumber || '');
  return state.some((panel, index) => {
    if (index === panelIndex) return false;
    const chosen = panel.alternatives[panel.altIndex];
    return chosen && String(chosen.roomNumber) === room;
  });
}

function stepAltIndex(state, panelIndex, direction) {
  const panel = state[panelIndex];
  const total = panel.alternatives.length;
  if (total <= 1) return false;
  let next = panel.altIndex;
  for (let step = 0; step < total; step += 1) {
    next = (next + direction + total) % total;
    const option = panel.alternatives[next];
    if (!option) continue;
    if (!roomConflicts(state, panelIndex, option.roomNumber)) {
      panel.altIndex = next;
      return true;
    }
  }
  return false;
}

function parsePeopleAttr(strip) {
  try {
    const raw = strip?.getAttribute?.('data-people') || '';
    const parsed = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function stepPersonStrip(strip, direction) {
  if (!strip) return false;
  const people = parsePeopleAttr(strip);
  if (people.length <= ALLOT_PERSON_PAGE_SIZE) return false;
  const maxPage = Math.max(0, Math.ceil(people.length / ALLOT_PERSON_PAGE_SIZE) - 1);
  let page = Number(strip.getAttribute('data-page')) || 0;
  const next = page + direction;
  if (next < 0 || next > maxPage) return false;
  const kind = strip.getAttribute('data-kind') || 'incoming';
  const html = allotPersonStripHtml(people, { kind, page: next });
  strip.outerHTML = html;
  return true;
}

function refreshPanel(el, state, panelIndex, allotments) {
  const panel = state[panelIndex];
  const node = el.querySelector(`.x-allot-room-panel[data-panel-index="${panelIndex}"]`);
  if (!node || !panel) return;
  const placement = mergePlacementRoomOption(panel.placement, panel.alternatives[panel.altIndex]);
  node.innerHTML = allotRoomPanelInnerHtml(placement, {
    altIndex: panel.altIndex,
    altTotal: panel.alternatives.length,
    allotments
  });
  if (window.UIkit?.update) {
    try {
      window.UIkit.update(node);
    } catch {
      /* ignore */
    }
  }
}

function showPanel(el, index) {
  const stage = el.querySelector('.x-allot-panel-stage');
  if (!stage) return false;
  const total = Number(stage.getAttribute('data-total')) || 0;
  if (total <= 1) return false;
  const next = Math.min(Math.max(0, index), total - 1);
  stage.setAttribute('data-active', String(next));
  el.querySelectorAll('.x-allot-room-panel').forEach((node) => {
    const i = Number(node.getAttribute('data-panel-index'));
    node.classList.toggle('is-hidden', i !== next);
  });
  const prevBtn = el.querySelector('.js-panel-prev');
  const nextBtn = el.querySelector('.js-panel-next');
  if (prevBtn) prevBtn.disabled = next <= 0;
  if (nextBtn) nextBtn.disabled = next >= total - 1;
  const count = el.querySelector('.js-panel-count-current');
  if (count) count.textContent = String(next + 1);
  return true;
}

function buildPanelState(placements, hotels, allotments) {
  return groupPlacementsByRoom(placements).map((placement) => {
    const subPlacements = Array.isArray(placement.subPlacements)
      ? placement.subPlacements
      : [placement];
    const alternatives = listSmartRoomOptions(
      placement.hotelId,
      placement.members,
      hotels,
      allotments
    );
    let altIndex = alternatives.findIndex(
      (opt) => String(opt.roomNumber) === String(placement.roomNumber)
    );
    if (altIndex < 0) {
      alternatives.unshift({
        score: 0,
        roomNumber: placement.roomNumber,
        roomType: placement.roomType,
        roomKind: placement.roomKind,
        capacity: placement.capacity,
        usedBefore: placement.usedBefore || 0,
        freeBefore: placement.freeBefore || 0,
        roomStatusBefore: placement.roomStatusBefore || 'free',
        exactMatch: Boolean(placement.exactMatch)
      });
      altIndex = 0;
    }
    return {
      placement,
      subPlacements,
      alternatives: alternatives.length ? alternatives : [placement],
      altIndex
    };
  });
}

/**
 * Interactive allot confirm: prev/next cycles smart room recommendations
 * and paginates person strips (max 3 tiles visible).
 * Same-room bookings share one panel; confirm still returns one placement per booking.
 * Resolves to final placements array, or null if cancelled.
 */
export function openAllotmentConfirmDialog({
  suggestion,
  focusHotelId,
  hotels,
  allotments
} = {}) {
  if (typeof window === 'undefined') return Promise.resolve(null);

  const placements = (suggestion?.placements || []).filter(
    (p) => !focusHotelId || String(p.hotelId) === String(focusHotelId)
  );
  if (!placements.length) return Promise.resolve(null);

  const state = buildPanelState(placements, hotels, allotments);

  const bodyHtml = allotmentConfirmHtml(
    { ...suggestion, placements },
    { focusHotelId, hotels, allotments, panelStates: state }
  );

  const UIkit = window.UIkit;
  if (!UIkit?.modal?.dialog) {
    const ok = window.confirm('Allot the recommended rooms?');
    if (!ok) return Promise.resolve(null);
    return Promise.resolve(state.flatMap((panel) => expandGroupedPlacementChoice(panel)));
  }

  const multiPanel = state.length > 1;
  const edgeNav = multiPanel
    ? `<button type="button" class="x-allot-panel-edge x-allot-panel-edge-prev js-panel-prev" aria-label="Previous room allotment">` +
      `<span uk-icon="icon: chevron-left; ratio: 1.5"></span></button>` +
      `<button type="button" class="x-allot-panel-edge x-allot-panel-edge-next js-panel-next" aria-label="Next room allotment">` +
      `<span uk-icon="icon: chevron-right; ratio: 1.5"></span></button>`
    : '';

  const html =
    `<button class="uk-modal-close-default" type="button" uk-close aria-label="Close"></button>` +
    edgeNav +
    `<div class="uk-modal-body x-allot-confirm-body">${bodyHtml}</div>` +
    `<div class="uk-modal-footer uk-text-right">` +
    `<button type="button" class="uk-button uk-button-default uk-modal-close">Cancel</button>` +
    `<button type="button" class="uk-button uk-button-primary uk-margin-small-left js-uikit-choice" data-choice="ok">Allot rooms</button>` +
    `</div>`;

  return new Promise((resolve) => {
    const modal = UIkit.modal.dialog(html, { stack: true });
    const el = modal.$el;
    const dialog = el.querySelector('.uk-modal-dialog');
    if (dialog) {
      dialog.classList.add('x-allot-confirm-dialog', 'uk-margin-auto-vertical');
      if (multiPanel) dialog.classList.add('has-panel-nav');
    }
    if (typeof UIkit.update === 'function') {
      try {
        UIkit.update(el);
      } catch {
        /* ignore */
      }
    }
    showPanel(el, 0);

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      try {
        modal.hide();
      } catch {
        /* already closing */
      }
      resolve(value);
    };

    UIkit.util.on(el, 'click', (e) => {
      const personPrev = e.target?.closest?.('.js-person-prev');
      const personNext = e.target?.closest?.('.js-person-next');
      const personNav = personPrev || personNext;
      if (personNav && el.contains(personNav) && !personNav.disabled) {
        e.preventDefault();
        e.stopPropagation();
        const strip = personNav.closest('.x-allot-person-strip');
        const group = personNav.closest('.x-allot-room-group') || el;
        if (stepPersonStrip(strip, personPrev ? -1 : 1) && window.UIkit?.update) {
          try {
            window.UIkit.update(group);
          } catch {
            /* ignore */
          }
        }
        return;
      }

      const panelPrev = e.target?.closest?.('.js-panel-prev');
      const panelNext = e.target?.closest?.('.js-panel-next');
      const panelNav = panelPrev || panelNext;
      if (panelNav && el.contains(panelNav) && !panelNav.disabled) {
        e.preventDefault();
        e.stopPropagation();
        const stage = el.querySelector('.x-allot-panel-stage');
        const active = Number(stage?.getAttribute('data-active')) || 0;
        showPanel(el, active + (panelPrev ? -1 : 1));
        return;
      }

      const prevBtn = e.target?.closest?.('.js-room-prev');
      const nextBtn = e.target?.closest?.('.js-room-next');
      const navBtn = prevBtn || nextBtn;
      if (navBtn && el.contains(navBtn) && !navBtn.disabled) {
        e.preventDefault();
        e.stopPropagation();
        const panelEl = navBtn.closest('.x-allot-room-panel');
        const panelIndex = Number(panelEl?.getAttribute('data-panel-index'));
        if (!Number.isFinite(panelIndex)) return;
        const moved = stepAltIndex(state, panelIndex, prevBtn ? -1 : 1);
        if (moved) refreshPanel(el, state, panelIndex, allotments);
        return;
      }

      const choiceBtn = e.target?.closest?.('.js-uikit-choice');
      if (!choiceBtn || !el.contains(choiceBtn)) return;
      e.preventDefault();
      e.stopPropagation();
      if (choiceBtn.getAttribute('data-choice') !== 'ok') {
        finish(null);
        return;
      }
      finish(state.flatMap((panel) => expandGroupedPlacementChoice(panel)));
    });
    UIkit.util.on(el, 'hidden', () => finish(null));
  });
}
