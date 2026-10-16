import {
  hotelSuggestionPage,
  pageNeedsMoreHotels
} from '../../utils/stayAllotmentSuggest.js';

export function SuitableHotelsStrip({
  suggestion,
  pageIndex = 0,
  onPageChange,
  onHotelClick,
  allotBusy = false,
  selectedCount = 0
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
  const selectedPeople = suggestion?.selectedPeople?.length || selectedCount;

  if (selectedCount === 0) return null;

  if (!items.length) {
    return (
      <div className="x-suitable-hotels x-suitable-hotels-overlay" aria-label="Suitable hotels">
        <p className="x-suitable-hotels-empty">
          No open hotel beds available for this selection (reserved hotels are skipped).
        </p>
      </div>
    );
  }

  return (
    <div
      className="x-suitable-hotels x-suitable-hotels-overlay"
      aria-label="Suitable hotels for selection"
    >
      <div className="x-suitable-hotels-head">
        <h3 className="x-suitable-hotels-title">
          Suitable hotels
          <span className="x-suitable-hotels-meta">
            {' '}
            · most to least suitable · {coveredPeople}/{selectedPeople} people placeable
          </span>
        </h3>
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
              {total > items.length ? ` · ${total} hotels` : ''}
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
          return (
            <li key={hotel.hotelId}>
              <button
                type="button"
                className={`x-suitable-hotel-card${proposed ? ' is-proposed' : ''}`}
                disabled={allotBusy || !proposed}
                title={
                  proposed
                    ? 'Review allotment for people placed here'
                    : 'Not in the current allotment proposal'
                }
                onClick={() => proposed && onHotelClick?.(hotel)}
              >
                <span className="x-suitable-hotel-rank">{rank}</span>
                <span className="x-suitable-hotel-body">
                  <span className="x-suitable-hotel-name">{hotel.hotelName}</span>
                  <span className="x-suitable-hotel-sub">
                    {hotel.distanceKm} km · {roomHint}
                  </span>
                </span>
                {proposed ? <span className="x-suitable-hotel-badge">Allot here</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
