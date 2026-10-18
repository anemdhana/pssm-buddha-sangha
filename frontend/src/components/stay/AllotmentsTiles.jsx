import {
  ageGroupLabel,
  allotmentRoomKindLabel,
  allotmentRoomTypeLabel,
  allotmentStatusLabel,
  registrationLocationShort
} from '../../utils/stayAllotments.js';

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`x-interest-filter-chip${active ? ' is-active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function AllotmentTile({ person }) {
  const photo = String(person.livePhoto || '').trim();
  const location = registrationLocationShort(person.place);
  const age = ageGroupLabel(person.age);

  return (
    <article className={`x-interest-tile x-allot-tile${person.status === 'checked_in' ? ' is-checked-in' : ''}`}>
      <div className="x-interest-tile-hit x-allot-tile-hit">
        {photo ? (
          <img className="x-interest-tile-photo" src={photo} alt="" />
        ) : (
          <div className="x-interest-tile-photo x-interest-tile-fallback" aria-hidden="true">
            {initials(person.name)}
          </div>
        )}
        <div className="x-interest-tile-overlay">
          <span className="x-interest-tile-name">{person.name}</span>
          <span className="x-interest-tile-meta">{person.hotelName}</span>
          <span className="x-interest-tile-meta">
            Room {person.roomNumber} · {allotmentRoomTypeLabel(person.roomType)}
          </span>
          <span className="x-interest-tile-meta">
            {allotmentRoomKindLabel(person.roomKind)} · {allotmentStatusLabel(person.status)}
          </span>
          <span className="x-interest-tile-meta">{location}</span>
          <span className="x-interest-tile-age">{age}</span>
        </div>
      </div>
    </article>
  );
}

export function AllotmentsTiles({
  people = [],
  stats,
  facets,
  total = 0,
  page = 0,
  totalPages = 0,
  onPageChange,
  refreshing = false,
  filtersActive,
  onClearFilters,
  nameSearch,
  onNameSearchChange,
  onNameSearchClear,
  hotelId,
  onHotelIdChange,
  roomType,
  onRoomTypeChange,
  roomKind,
  onRoomKindChange,
  gender,
  onGenderChange,
  status,
  onStatusChange,
  location,
  onLocationChange
}) {
  const hotels = Array.isArray(facets?.hotels) ? facets.hotels : [];
  const locations = Array.isArray(facets?.locations) ? facets.locations : [];
  const peopleTotal = stats?.people ?? 0;

  function pick(current, next, setter) {
    setter(current === next ? '' : next);
  }

  return (
    <div className="x-interest-layout x-allot-layout">
      <aside className="x-interest-side x-interest-panel x-allot-filter-side" aria-label="Hotels">
        <div className="x-allot-filter-head">
          <h2 className="x-interest-panel-title">
            <span uk-icon="icon: home; ratio: 0.7" /> Hotels
          </h2>
          {hotelId ? (
            <button
              type="button"
              className="x-interest-text-btn"
              onClick={() => onHotelIdChange?.('')}
            >
              Clear
            </button>
          ) : null}
        </div>
        {hotels.length > 0 ? (
          <ul className="x-interest-location-list x-allot-hotel-list">
            {hotels.map((facet) => (
              <li key={facet.key}>
                <button
                  type="button"
                  className={`x-interest-location-item${hotelId === facet.key ? ' is-active' : ''}`}
                  title={facet.label}
                  onClick={() => pick(hotelId, facet.key, onHotelIdChange)}
                >
                  <span className="x-interest-location-name">{facet.label}</span>
                  <span className="x-interest-location-count">{facet.count}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="x-interest-side-empty">No hotels</p>
        )}
      </aside>

      <div className={`x-interest-tiles-wrap${refreshing ? ' is-refreshing' : ''}`}>
        <div className="x-interest-panel x-interest-toolbar-panel x-allot-toolbar-panel">
          <div className="x-allot-toolbar-row">
            <div className="uk-inline x-hotel-toolbar-input">
              <span className="uk-form-icon" uk-icon="icon: search" />
              <input
                className="uk-input uk-form-small"
                id="allotment-name-search"
                value={nameSearch}
                onChange={(e) => onNameSearchChange(e.target.value)}
                placeholder="Search name, hotel, or room"
                aria-label="Search who is staying"
              />
              {nameSearch ? (
                <button
                  type="button"
                  className="uk-form-icon uk-form-icon-flip x-interest-text-btn"
                  onClick={onNameSearchClear}
                  aria-label="Clear search"
                >
                  <span uk-icon="icon: close; ratio: 0.8" />
                </button>
              ) : null}
            </div>

            <div className="x-allot-toolbar-filters" aria-label="Quick filters">
              <div className="x-allot-filter-group" role="group" aria-label="Status">
                <span className="x-allot-filter-group-label">Status</span>
                <div className="x-interest-filter-chips x-allot-filter-chips">
                  <Chip active={status === 'allotted'} onClick={() => pick(status, 'allotted', onStatusChange)}>
                    Allotted
                  </Chip>
                  <Chip
                    active={status === 'checked_in'}
                    onClick={() => pick(status, 'checked_in', onStatusChange)}
                  >
                    In
                  </Chip>
                </div>
              </div>
              <div className="x-allot-filter-group" role="group" aria-label="Gender">
                <span className="x-allot-filter-group-label">Gender</span>
                <div className="x-interest-filter-chips x-allot-filter-chips">
                  <Chip active={gender === 'male'} onClick={() => pick(gender, 'male', onGenderChange)}>
                    Gents
                  </Chip>
                  <Chip active={gender === 'female'} onClick={() => pick(gender, 'female', onGenderChange)}>
                    Ladies
                  </Chip>
                </div>
              </div>
              <div className="x-allot-filter-group" role="group" aria-label="Room type">
                <span className="x-allot-filter-group-label">Type</span>
                <div className="x-interest-filter-chips x-allot-filter-chips">
                  <Chip active={roomType === 'ac'} onClick={() => pick(roomType, 'ac', onRoomTypeChange)}>
                    AC
                  </Chip>
                  <Chip
                    active={roomType === 'non_ac'}
                    onClick={() => pick(roomType, 'non_ac', onRoomTypeChange)}
                  >
                    Non-AC
                  </Chip>
                </div>
              </div>
              <div className="x-allot-filter-group" role="group" aria-label="Room kind">
                <span className="x-allot-filter-group-label">Kind</span>
                <div className="x-interest-filter-chips x-allot-filter-chips">
                  <Chip
                    active={roomKind === 'regular'}
                    onClick={() => pick(roomKind, 'regular', onRoomKindChange)}
                  >
                    Regular
                  </Chip>
                  <Chip
                    active={roomKind === 'dormitory'}
                    onClick={() => pick(roomKind, 'dormitory', onRoomKindChange)}
                  >
                    Dorm
                  </Chip>
                  <Chip active={roomKind === 'hall'} onClick={() => pick(roomKind, 'hall', onRoomKindChange)}>
                    Hall
                  </Chip>
                </div>
              </div>
              {filtersActive ? (
                <button type="button" className="x-interest-text-btn x-allot-filter-clear" onClick={onClearFilters}>
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>

          <div className="x-allot-stats-row" aria-label="People by hometown">
            <span className="x-hotel-stat is-open">
              <span className="x-hotel-stat-value">{peopleTotal}</span>
              <span className="x-hotel-stat-label">
                {peopleTotal === 1 ? 'person' : 'people'}
              </span>
            </span>
            {locations.map((loc) => {
              const active = location === loc.name;
              return (
                <button
                  key={loc.name}
                  type="button"
                  className={`x-hotel-stat${active ? ' is-active' : ''}`}
                  title={`Filter by ${loc.name}`}
                  aria-pressed={active}
                  onClick={() => pick(location, loc.name, onLocationChange)}
                >
                  <span className="x-hotel-stat-value">{loc.count}</span>
                  <span className="x-hotel-stat-label">{loc.name}</span>
                </button>
              );
            })}
          </div>
          {filtersActive ? (
            <p className="x-hotel-filter-note x-allot-filter-note">
              {total} part{total === 1 ? 'y' : 'ies'} match · page {page + 1}
              {totalPages ? ` of ${totalPages}` : ''}
            </p>
          ) : null}
        </div>

        {people.length === 0 ? (
          <div className="x-interest-empty-panel">
            <p>No one matches these filters.</p>
            {filtersActive ? (
              <button type="button" className="uk-button uk-button-default" onClick={onClearFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="x-interest-tiles" role="list">
              {people.map((person) => (
                <div key={person.id} role="listitem">
                  <AllotmentTile person={person} />
                </div>
              ))}
            </div>
            {totalPages > 1 ? (
              <div className="x-page-bar">
                <button
                  type="button"
                  className="uk-button uk-button-default uk-button-small"
                  disabled={page <= 0}
                  onClick={() => onPageChange?.(page - 1)}
                >
                  Previous
                </button>
                <span className="uk-text-meta">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  className="uk-button uk-button-default uk-button-small"
                  disabled={page + 1 >= totalPages}
                  onClick={() => onPageChange?.(page + 1)}
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
