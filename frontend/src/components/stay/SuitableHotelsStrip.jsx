import { useEffect, useMemo, useState } from 'react';
import {
  buildRoomAvailability,
  hotelSuggestionPage,
  pageNeedsMoreHotels,
  peopleStayWindow
} from '../../utils/stayAllotmentSuggest.js';
import { hotelRoomStats } from '../../utils/stayHotels.js';
import { registrationLocationShort } from '../../utils/stayRegistrations.js';

const SORT_OPTIONS = [
  { id: 'best', label: 'Best match', meta: 'smart fit first' },
  { id: 'distance', label: 'Closest', meta: 'nearest first' },
  { id: 'same_location', label: 'Same place', meta: 'most people from same place first' },
  { id: 'free_beds', label: 'Most beds', meta: 'most free beds first' },
  { id: 'ac', label: 'More AC', meta: 'more AC rooms first' }
];

function acShare(hotel) {
  const stats = hotel?.stats;
  const rooms = Number(stats?.roomCount) || 0;
  if (rooms <= 0) return 0;
  return (Number(stats?.ac) || 0) / rooms;
}

function compareHotels(a, b, sortBy) {
  if (sortBy === 'distance') {
    return (
      a.distanceKm - b.distanceKm ||
      (b.score || 0) - (a.score || 0) ||
      String(a.hotelName).localeCompare(String(b.hotelName))
    );
  }
  if (sortBy === 'same_location') {
    return (
      (b.sameLocationGuests || 0) - (a.sameLocationGuests || 0) ||
      a.distanceKm - b.distanceKm ||
      (b.score || 0) - (a.score || 0)
    );
  }
  if (sortBy === 'free_beds') {
    return (
      (b.freeBeds || 0) - (a.freeBeds || 0) ||
      a.distanceKm - b.distanceKm ||
      (b.score || 0) - (a.score || 0)
    );
  }
  if (sortBy === 'ac') {
    return (
      acShare(b) - acShare(a) ||
      (Number(b.stats?.ac) || 0) - (Number(a.stats?.ac) || 0) ||
      a.distanceKm - b.distanceKm ||
      (b.score || 0) - (a.score || 0)
    );
  }
  return (
    (b.score || 0) - (a.score || 0) ||
    (b.sameLocationGuests || 0) - (a.sameLocationGuests || 0) ||
    a.distanceKm - b.distanceKm
  );
}

function toHotelOption(row) {
  if (!row) return null;
  const hotelId = String(row.hotelId || row.id || '').trim();
  if (!hotelId) return null;
  return {
    hotelId,
    hotelName: row.hotelName || row.name || 'Hotel',
    distanceKm: Number(row.distanceKm) >= 0 ? Number(row.distanceKm) : 999,
    freeBeds: Number(row.freeBeds) || 0,
    sameLocationGuests: Number(row.sameLocationGuests) || 0,
    stats: row.stats || null,
    score: Number(row.score) || 0
  };
}

function hotelDetailLines(hotel, roomHint) {
  const sameLoc = Number(hotel.sameLocationGuests) || 0;
  const sameLocLabel = Array.isArray(hotel.sameLocationLabels)
    ? hotel.sameLocationLabels.filter(Boolean)[0]
    : '';
  const stats = hotel.stats || {};
  const ac = Number(stats.ac) || 0;
  const nonAc = Number(stats.nonAc) || 0;
  const bits = [];
  if (Number.isFinite(hotel.distanceKm) && hotel.distanceKm < 900) {
    bits.push(`${hotel.distanceKm} km`);
  }
  bits.push(roomHint);
  if (sameLoc > 0) {
    bits.push(sameLocLabel ? `${sameLoc} from ${sameLocLabel}` : `${sameLoc} same place`);
  }
  if (ac + nonAc > 0) {
    bits.push(nonAc > 0 ? `${ac} AC / ${nonAc} non-AC` : `${ac} AC`);
  }
  if (hotel.freeBeds > 0 && !String(roomHint).includes('beds free')) {
    bits.push(`${hotel.freeBeds} beds free`);
  }
  return bits.filter(Boolean);
}

export function SuitableHotelsStrip({
  suggestion,
  hotels = [],
  allotments = [],
  pageIndex = 0,
  onPageChange,
  onHotelDrop,
  allotBusy = false,
  selectedCount = 0,
  dragging = false,
  selectedPeople = [],
  onMoveToWaitList
}) {
  const ranked = suggestion?.ranked || [];
  const people = useMemo(
    () => (Array.isArray(selectedPeople) ? selectedPeople.filter(Boolean) : []),
    [selectedPeople]
  );
  const selectedPeopleCount = people.length || selectedCount;
  const peopleKey = people.map((p) => p.id).join('|');
  const [dragOverId, setDragOverId] = useState('');
  const [focusIndex, setFocusIndex] = useState(0);
  const [otherHotelId, setOtherHotelId] = useState('');
  const [sortBy, setSortBy] = useState('best');

  const sortedRanked = useMemo(
    () => [...ranked].sort((a, b) => compareHotels(a, b, sortBy)),
    [ranked, sortBy]
  );

  const sortMeta = SORT_OPTIONS.find((o) => o.id === sortBy)?.meta || 'smart fit first';
  const { items, page, totalPages } = hotelSuggestionPage(
    sortedRanked,
    pageIndex,
    suggestion?.pageSize || 5
  );
  const needsNav = totalPages > 1 || pageNeedsMoreHotels(suggestion, items);
  const placementHotelIds = new Set((suggestion?.placements || []).map((p) => p.hotelId));
  const coveredPeople = (suggestion?.placements || []).reduce(
    (sum, p) => sum + (p.members?.length || 0),
    0
  );

  const otherHotels = useMemo(() => {
    const shownIds = new Set(items.map((h) => String(h.hotelId || '')));
    const fromRanked = sortedRanked
      .filter((h) => h && !shownIds.has(String(h.hotelId || '')))
      .map(toHotelOption)
      .filter(Boolean);

    const rankedIds = new Set(sortedRanked.map((h) => String(h.hotelId || '')));
    const stay = peopleStayWindow(people);
    const availability = buildRoomAvailability(hotels, allotments, stay);
    const fromCatalog = [];
    availability.forEach((entry, hotelId) => {
      if (!hotelId || shownIds.has(hotelId) || rankedIds.has(hotelId)) return;
      if ((Number(entry.freeBeds) || 0) <= 0) return;
      fromCatalog.push(
        toHotelOption({
          hotelId,
          hotelName: entry.hotel?.name,
          distanceKm: entry.distanceKm,
          freeBeds: entry.freeBeds,
          stats: entry.hotel ? hotelRoomStats(entry.hotel) : null
        })
      );
    });

    return [...fromRanked, ...fromCatalog]
      .filter(Boolean)
      .sort((a, b) => compareHotels(a, b, sortBy));
  }, [items, sortedRanked, hotels, allotments, people, sortBy]);

  useEffect(() => {
    if (!dragging) setDragOverId('');
  }, [dragging]);

  useEffect(() => {
    setFocusIndex(0);
    setOtherHotelId('');
    setSortBy('best');
  }, [peopleKey]);

  useEffect(() => {
    setOtherHotelId('');
  }, [pageIndex]);

  useEffect(() => {
    if (pageIndex !== 0) onPageChange?.(0);
    // Reset to first page whenever sort mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  useEffect(() => {
    if (focusIndex >= people.length && people.length > 0) {
      setFocusIndex(people.length - 1);
    }
  }, [focusIndex, people.length]);

  if (selectedCount === 0) return null;

  const focused = people[Math.min(focusIndex, Math.max(0, people.length - 1))] || null;
  const focusPlace = focused ? registrationLocationShort(focused.place) : '';
  const multiPeople = people.length > 1;

  function allowHotelDrop(e, hotelId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== hotelId) setDragOverId(hotelId);
  }

  function dropOnHotel(e, hotel) {
    e.preventDefault();
    setDragOverId('');
    if (allotBusy) return;
    onHotelDrop?.(hotel);
  }

  function stepPerson(direction) {
    if (people.length <= 1) return;
    setFocusIndex((prev) => (prev + direction + people.length) % people.length);
  }

  function pickOtherHotel(hotelId) {
    const id = String(hotelId || '').trim();
    setOtherHotelId(id);
    if (!id || allotBusy) return;
    const hotel = otherHotels.find((h) => h.hotelId === id);
    if (!hotel) return;
    onHotelDrop?.(hotel);
    setOtherHotelId('');
  }

  return (
    <div
      className={`x-suitable-hotels x-suitable-hotels-overlay${dragging ? ' is-dragging' : ''}`}
      aria-label="Suitable hotels for selection"
    >
      <div className="x-suitable-hotels-head">
        <h3 className="x-suitable-hotels-title">
          Suitable hotels
          <span className="x-suitable-hotels-meta">
            {' '}
            · {sortMeta} · {coveredPeople}/{selectedPeopleCount} people placeable
          </span>
        </h3>

        {focused ? (
          <div className="x-suitable-focus-inline" aria-label="Selected person">
            <button
              type="button"
              className="x-suitable-focus-nav"
              disabled={!multiPeople || allotBusy}
              onClick={() => stepPerson(-1)}
              aria-label="Previous selected person"
            >
              <span uk-icon="icon: chevron-left; ratio: 0.85" />
            </button>
            <span className="x-suitable-focus-name">{focused.name || 'Guest'}</span>
            {focusPlace ? <span className="x-suitable-focus-place">· {focusPlace}</span> : null}
            {multiPeople ? (
              <span className="x-suitable-focus-count">
                {focusIndex + 1}/{people.length}
              </span>
            ) : null}
            <button
              type="button"
              className="x-suitable-focus-nav"
              disabled={!multiPeople || allotBusy}
              onClick={() => stepPerson(1)}
              aria-label="Next selected person"
            >
              <span uk-icon="icon: chevron-right; ratio: 0.85" />
            </button>
            <button
              type="button"
              className="uk-button uk-button-default uk-button-small x-suitable-wait-btn"
              disabled={allotBusy || people.length === 0}
              onClick={() => onMoveToWaitList?.(people)}
            >
              Move to Wait List
              {people.length > 1 ? ` (${people.length})` : ''}
            </button>
          </div>
        ) : null}

        {needsNav ? (
          <div className="x-suitable-hotels-nav">
            <button
              type="button"
              className="uk-button uk-button-default uk-button-small"
              disabled={page <= 0 || allotBusy}
              onClick={() => onPageChange?.(page - 1)}
              aria-label="Previous hotels"
            >
              <span uk-icon="icon: chevron-left; ratio: 0.85" />
            </button>
            <span className="uk-text-meta">
              {page + 1}/{totalPages}
            </span>
            <button
              type="button"
              className="uk-button uk-button-default uk-button-small"
              disabled={page + 1 >= totalPages || allotBusy}
              onClick={() => onPageChange?.(page + 1)}
              aria-label="Next hotels"
            >
              <span uk-icon="icon: chevron-right; ratio: 0.85" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="x-suitable-hotels-sort" role="group" aria-label="Sort hotels">
        <span className="x-suitable-hotels-sort-label">Sort</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`x-suitable-sort-chip${sortBy === opt.id ? ' is-active' : ''}`}
            aria-pressed={sortBy === opt.id}
            disabled={allotBusy}
            onClick={() => setSortBy(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {!items.length && !otherHotels.length ? (
        <p className="x-suitable-hotels-empty">
          No open hotel beds available for this selection (reserved hotels are skipped).
        </p>
      ) : (
        <ul className="x-suitable-hotels-list">
          {items.map((hotel, index) => {
            const proposed = placementHotelIds.has(hotel.hotelId);
            const rank = page * (suggestion?.pageSize || 5) + index + 1;
            const roomsForHotel = (suggestion?.placements || []).filter(
              (p) => p.hotelId === hotel.hotelId
            );
            const roomNumbers = [
              ...new Set(roomsForHotel.map((p) => String(p.roomNumber || '')).filter(Boolean))
            ];
            const peopleHere = roomsForHotel.reduce((sum, p) => sum + (p.members?.length || 0), 0);
            const roomHint = roomNumbers.length
              ? roomNumbers.length > 1
                ? `${roomNumbers.length} rooms · ${roomNumbers.map((n) => `Rm ${n}`).join(', ')} · ${peopleHere} ppl`
                : `Rm ${roomNumbers[0]}${peopleHere ? ` · ${peopleHere} ppl` : ''}`
              : `${hotel.freeBeds} beds free`;
            const detailBits = hotelDetailLines(hotel, roomHint);
            const isTarget = dragOverId === hotel.hotelId;
            return (
              <li key={hotel.hotelId}>
                <div
                  className={`x-suitable-hotel-card${proposed ? ' is-proposed' : ''}${
                    isTarget ? ' is-drop-target' : ''
                  }`}
                  role="button"
                  tabIndex={allotBusy ? -1 : 0}
                  aria-disabled={allotBusy}
                  aria-label={`Drop ${selectedCount} people on ${hotel.hotelName}`}
                  title={detailBits.join(' · ')}
                  onDragOver={(e) => allowHotelDrop(e, hotel.hotelId)}
                  onDragEnter={(e) => allowHotelDrop(e, hotel.hotelId)}
                  onDragLeave={() => {
                    if (dragOverId === hotel.hotelId) setDragOverId('');
                  }}
                  onDrop={(e) => dropOnHotel(e, hotel)}
                  onClick={() => {
                    if (!allotBusy) onHotelDrop?.(hotel);
                  }}
                  onKeyDown={(e) => {
                    if (allotBusy) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onHotelDrop?.(hotel);
                    }
                  }}
                >
                  <span className="x-suitable-hotel-rank">{rank}</span>
                  <span className="x-suitable-hotel-body">
                    <span className="x-suitable-hotel-name">{hotel.hotelName}</span>
                    <span className="x-suitable-hotel-sub">{detailBits.join(' · ')}</span>
                    {proposed ? <span className="x-suitable-hotel-badge">Suggested</span> : null}
                  </span>
                </div>
              </li>
            );
          })}
          {otherHotels.length > 0 ? (
            <li className="x-suitable-hotel-more">
              <label className="x-suitable-hotel-more-card" htmlFor="suitable-other-hotel">
                <span className="x-suitable-hotel-more-label">Other hotels</span>
                <select
                  id="suitable-other-hotel"
                  className="uk-select uk-form-small x-suitable-hotel-more-select"
                  value={otherHotelId}
                  disabled={allotBusy}
                  aria-label="Choose another hotel not listed above"
                  onChange={(e) => pickOtherHotel(e.target.value)}
                >
                  <option value="">Choose hotel…</option>
                  {otherHotels.map((hotel) => (
                    <option key={hotel.hotelId} value={hotel.hotelId}>
                      {hotel.hotelName}
                      {Number.isFinite(hotel.distanceKm) && hotel.distanceKm < 900
                        ? ` · ${hotel.distanceKm} km`
                        : ''}
                      {hotel.freeBeds > 0 ? ` · ${hotel.freeBeds} beds` : ''}
                      {hotel.sameLocationGuests > 0
                        ? ` · ${hotel.sameLocationGuests} same place`
                        : ''}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ) : null}
        </ul>
      )}
      <p className="x-suitable-hotels-hint">
        Sort the strip, then drag a selected photo onto a hotel (or pick another hotel). Large
        families can fill across rooms when one room is too small.
      </p>
    </div>
  );
}
