import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  filterHotels,
  hotelDistanceFacets,
  hotelRoomStats,
  hotelStats
} from '../../utils/stayHotels.js';
import { hotelTelHref } from '../../utils/hotelImage.js';

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

function HotelCard({ hotel }) {
  const stats = hotelRoomStats(hotel);
  const active = hotel.active !== false;
  const image = String(hotel.image || '').trim();
  const contact = String(hotel.contact || '').trim();
  const tel = hotelTelHref(contact);
  return (
    <article className={`x-hotel-card${!active ? ' is-inactive' : ''}${hotel.reserved ? ' is-reserved' : ''}`}>
      <div className={`x-hotel-card-thumb${image ? '' : ' is-empty'}`} aria-hidden={!image}>
        {image ? <img src={image} alt="" /> : <span uk-icon="icon: image; ratio: 1.1" />}
      </div>
      <div className="x-hotel-card-body">
        <div className="x-hotel-card-top">
          <h3 className="x-hotel-card-name">{hotel.name}</h3>
          <div className="x-hotel-card-badges">
            {!active ? <span className="x-hotel-badge">Inactive</span> : null}
            {hotel.reserved ? <span className="x-hotel-badge is-reserved">Reserved</span> : null}
          </div>
        </div>
        <p className="x-hotel-card-meta">{hotel.address}</p>
        <p className="x-hotel-card-meta">
          {hotel.distanceKm} km · {stats.roomCount} room{stats.roomCount === 1 ? '' : 's'} ·{' '}
          {stats.capacity} bed{stats.capacity === 1 ? '' : 's'}
          {stats.ac ? ` · ${stats.ac} AC` : ''}
          {stats.nonAc ? ` · ${stats.nonAc} Non-AC` : ''}
        </p>
        {contact ? (
          <p className="x-hotel-card-meta x-hotel-card-contact">
            <span uk-icon="icon: receiver; ratio: 0.75" />{' '}
            {tel ? (
              <a href={tel} onClick={(e) => e.stopPropagation()}>
                {contact}
              </a>
            ) : (
              contact
            )}
          </p>
        ) : null}
      </div>
      <Link
        className="uk-button uk-button-default uk-button-small"
        to={`/stay/hotels/${encodeURIComponent(hotel.id)}/edit`}
      >
        Edit
      </Link>
    </article>
  );
}

export function HotelsList({
  hotels,
  filtersActive,
  onClearFilters,
  nameSearch,
  onNameSearchChange,
  onNameSearchClear,
  active,
  onActiveChange,
  reserved,
  onReservedChange,
  roomType,
  onRoomTypeChange,
  kind,
  onKindChange,
  distance,
  onDistanceChange
}) {
  const facetBase = useMemo(
    () =>
      filterHotels(hotels, {
        nameQuery: nameSearch,
        active,
        reserved,
        roomType,
        kind
        // distance omitted so distance facet stays useful while choosing
      }),
    [hotels, nameSearch, active, reserved, roomType, kind]
  );

  const distanceFacets = useMemo(() => hotelDistanceFacets(facetBase), [facetBase]);

  const matched = useMemo(
    () =>
      filterHotels(hotels, {
        nameQuery: nameSearch,
        active,
        reserved,
        roomType,
        kind,
        distance
      }),
    [hotels, nameSearch, active, reserved, roomType, kind, distance]
  );

  const stats = useMemo(() => hotelStats(matched), [matched]);
  const totalHotels = hotels.length;

  function pick(current, next, setter) {
    setter(current === next ? '' : next);
  }

  return (
    <div className="x-interest-layout">
      <aside className="x-interest-side x-interest-panel" aria-label="Hotel filters">
        <h2 className="x-interest-panel-title">
          <span uk-icon="icon: settings; ratio: 0.75" /> Filter
        </h2>

        <p className="x-interest-side-label">Status</p>
        <div className="x-interest-filter-chips">
          <Chip active={active === 'yes'} onClick={() => pick(active, 'yes', onActiveChange)}>
            Active
          </Chip>
          <Chip active={active === 'no'} onClick={() => pick(active, 'no', onActiveChange)}>
            Inactive
          </Chip>
        </div>

        <p className="x-interest-side-label">Assignment</p>
        <div className="x-interest-filter-chips">
          <Chip active={reserved === 'no'} onClick={() => pick(reserved, 'no', onReservedChange)}>
            Open pool
          </Chip>
          <Chip active={reserved === 'yes'} onClick={() => pick(reserved, 'yes', onReservedChange)}>
            Reserved
          </Chip>
        </div>

        <p className="x-interest-side-label">Has room type</p>
        <div className="x-interest-filter-chips">
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

        <p className="x-interest-side-label">Has kind</p>
        <div className="x-interest-filter-chips">
          <Chip active={kind === 'regular'} onClick={() => pick(kind, 'regular', onKindChange)}>
            Regular
          </Chip>
          <Chip
            active={kind === 'dormitory'}
            onClick={() => pick(kind, 'dormitory', onKindChange)}
          >
            Dormitory
          </Chip>
          <Chip active={kind === 'hall'} onClick={() => pick(kind, 'hall', onKindChange)}>
            Hall
          </Chip>
        </div>

        {distanceFacets.length > 0 ? (
          <>
            <p className="x-interest-side-label">Distance</p>
            <ul className="x-interest-location-list">
              {distanceFacets.map((facet) => (
                <li key={facet.key}>
                  <button
                    type="button"
                    className={`x-interest-location-item${distance === facet.key ? ' is-active' : ''}`}
                    onClick={() => pick(distance, facet.key, onDistanceChange)}
                  >
                    <span className="x-interest-location-name">{facet.label}</span>
                    <span className="x-interest-location-count">{facet.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="x-interest-side-empty">No distance groups yet.</p>
        )}
      </aside>

      <div className="x-interest-tiles-wrap">
        <div className="x-interest-panel x-interest-toolbar-panel">
          <div className="x-hotel-toolbar">
            <div className="uk-inline x-hotel-toolbar-input">
              <span className="uk-form-icon" uk-icon="icon: search" />
              <input
                className="uk-input uk-form-small"
                id="hotel-name-search"
                value={nameSearch}
                onChange={(e) => onNameSearchChange(e.target.value)}
                placeholder="Search hotels — name, address, or contact"
                aria-label="Search hotels"
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

            <div className="x-hotel-stat-grid" aria-label="Active hotel capacity">
              <div
                className="x-hotel-stat"
                title={`${stats.active} active hotel${stats.active === 1 ? '' : 's'}`}
              >
                <span className="x-hotel-stat-value">{stats.active}</span>
                <span className="x-hotel-stat-label">hotels</span>
              </div>
              <div
                className="x-hotel-stat is-open"
                title={`${stats.openHotels} open hotel${stats.openHotels === 1 ? '' : 's'} · ${stats.openRooms} room${stats.openRooms === 1 ? '' : 's'}`}
              >
                <span className="x-hotel-stat-value">{stats.openBeds}</span>
                <span className="x-hotel-stat-label">
                  open
                  <span className="x-hotel-stat-sub">
                    {stats.openHotels}h · {stats.openRooms}r
                  </span>
                </span>
              </div>
              <div
                className="x-hotel-stat is-reserved"
                title={`${stats.reservedHotels} reserved hotel${stats.reservedHotels === 1 ? '' : 's'} · ${stats.reservedRooms} room${stats.reservedRooms === 1 ? '' : 's'}`}
              >
                <span className="x-hotel-stat-value">{stats.reservedBeds}</span>
                <span className="x-hotel-stat-label">
                  reserved
                  <span className="x-hotel-stat-sub">
                    {stats.reservedHotels}h · {stats.reservedRooms}r
                  </span>
                </span>
              </div>
            </div>
          </div>
          {filtersActive ? (
            <div className="x-hotel-toolbar-meta">
              <p className="x-hotel-filter-note">
                Showing {matched.length} of {totalHotels} hotel{totalHotels === 1 ? '' : 's'}
              </p>
              <button type="button" className="x-interest-text-btn" onClick={onClearFilters}>
                Clear filters
              </button>
            </div>
          ) : null}
        </div>

        {matched.length === 0 ? (
          <div className="x-interest-empty-panel">
            <p>No hotels match these filters.</p>
            {filtersActive ? (
              <button type="button" className="uk-button uk-button-default" onClick={onClearFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="x-hotel-list" role="list">
            {matched.map((hotel) => (
              <div key={hotel.id} role="listitem">
                <HotelCard hotel={hotel} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
