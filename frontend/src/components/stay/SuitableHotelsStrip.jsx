import { useEffect, useMemo, useState } from 'react';
import {
  hotelSuggestionPage,
  pageNeedsMoreHotels
} from '../../utils/stayAllotmentSuggest.js';
import { registrationLocationShort } from '../../utils/stayRegistrations.js';

export function SuitableHotelsStrip({
  suggestion,
  pageIndex = 0,
  onPageChange,
  onHotelDrop,
  allotBusy = false,
  selectedCount = 0,
  dragging = false,
  selectedPeople = [],
  onMoveToWaitList,
  onMoveAllToWaitList
}) {
  const ranked = suggestion?.ranked || [];
  const { items, page, totalPages, total } = hotelSuggestionPage(
    ranked,
    pageIndex,
    suggestion?.pageSize || 5
  );
  const needsNav = totalPages > 1 || pageNeedsMoreHotels(suggestion, items);
  const placementHotelIds = new Set((suggestion?.placements || []).map((p) => p.hotelId));
  const coveredPeople = (suggestion?.placements || []).reduce(
    (sum, p) => sum + (p.members?.length || 0),
    0
  );
  const people = useMemo(
    () => (Array.isArray(selectedPeople) ? selectedPeople.filter(Boolean) : []),
    [selectedPeople]
  );
  const selectedPeopleCount = people.length || selectedCount;
  const [dragOverId, setDragOverId] = useState('');
  const [focusIndex, setFocusIndex] = useState(0);

  useEffect(() => {
    if (!dragging) setDragOverId('');
  }, [dragging]);

  const peopleKey = people.map((p) => p.id).join('|');
  useEffect(() => {
    setFocusIndex(0);
  }, [peopleKey]);

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
            · most to least suitable · {coveredPeople}/{selectedPeopleCount} people placeable
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
              disabled={allotBusy || !focused}
              onClick={() => onMoveToWaitList?.(focused)}
            >
              Move to Wait List
            </button>
            <button
              type="button"
              className="uk-button uk-button-default uk-button-small x-suitable-wait-btn"
              disabled={allotBusy || people.length === 0}
              onClick={() => onMoveAllToWaitList?.(people)}
            >
              Move All ({people.length})
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

      {!items.length ? (
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
            const roomHint = roomsForHotel.length
              ? [...new Set(roomsForHotel.map((p) => String(p.roomNumber || '')))]
                  .filter(Boolean)
                  .map((n) => `Rm ${n}`)
                  .join(', ')
              : `${hotel.freeBeds} beds free`;
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
                  title="Drop a selected photo here to allot"
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
                    <span className="x-suitable-hotel-sub">
                      {hotel.distanceKm} km · {roomHint}
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="x-suitable-hotels-hint">
        Drag a selected photo tile onto any of the top hotels to allot.
      </p>
    </div>
  );
}
