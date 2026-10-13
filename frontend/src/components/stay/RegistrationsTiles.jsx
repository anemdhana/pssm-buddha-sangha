import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MEDITATION_OPTS } from '../../pages/join/ChipGroup.jsx';
import {
  INTEREST_TILE_DISPLAY_LIMIT,
  ageGroupLabel,
  filterTilePeople,
  meditationLabel,
  registrationLocationFacets,
  registrationLocationShort,
  registrationStayRangeFacets,
  registrationTilePeople
} from '../../utils/stayRegistrations.js';
import { RegistrationNameSearch } from './RegistrationNameSearch.jsx';

const AGE_FILTER_OPTS = [
  { value: 'child', label: 'Child' },
  { value: 'adult', label: 'Adult' },
  { value: 'senior', label: 'Senior' }
];

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function InterestTile({ person, selected, onToggle }) {
  const photo = String(person.livePhoto || '').trim();
  const location = registrationLocationShort(person.place);
  const age = ageGroupLabel(person.age);
  const meditation = meditationLabel(person.meditation);
  const profession = String(person.profession || '').trim() || 'Profession not set';
  const editPlan = person.plan === 'paid' ? 'paid' : 'free';
  const editQuery = person.primary
    ? `plan=${editPlan}&step=who`
    : `plan=${editPlan}&step=family&member=${person.memberIndex ?? 0}`;

  return (
    <article
      className={`x-interest-tile${selected ? ' is-selected' : ''}`}
      aria-selected={selected}
    >
      <label className="x-interest-tile-check">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(person.id)}
          aria-label={`Select ${person.name}`}
        />
        <span className="x-interest-tile-check-box" aria-hidden="true" />
      </label>

      <button
        type="button"
        className="x-interest-tile-hit"
        onClick={() => onToggle(person.id)}
        aria-pressed={selected}
      >
        {photo ? (
          <img className="x-interest-tile-photo" src={photo} alt="" />
        ) : (
          <div className="x-interest-tile-photo x-interest-tile-fallback" aria-hidden="true">
            {initials(person.name)}
          </div>
        )}
        <div className="x-interest-tile-overlay">
          <span className="x-interest-tile-name">{person.name}</span>
          <span className="x-interest-tile-meta">{location}</span>
          <span className="x-interest-tile-meta">{profession}</span>
          <span className="x-interest-tile-meta">{meditation}</span>
          <span className="x-interest-tile-age">{age}</span>
        </div>
      </button>

      <Link
        className="x-interest-tile-edit"
        to={`/stay/edit/${encodeURIComponent(person.bookingId)}?${editQuery}`}
        onClick={(e) => e.stopPropagation()}
      >
        Edit
      </Link>
    </article>
  );
}

function toggleAgeKey(ageKeys, value) {
  const next = new Set(ageKeys);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return Array.from(next);
}

export function RegistrationsTiles({
  rows,
  stats,
  filtersActive,
  onClearFilters,
  selectedCount,
  onClearSelection,
  onRemoveSelected,
  removeBusy,
  nameSearch,
  onNameSearchChange,
  onNameSearchClear,
  ageKeys,
  onAgeKeysChange,
  meditation,
  onMeditationChange,
  gender,
  onGenderChange,
  location,
  onLocationChange,
  stayRange,
  onStayRangeChange,
  selectedIds,
  onToggleSelect
}) {
  const allPeople = useMemo(() => registrationTilePeople(rows), [rows]);

  // Facet counts use the full match set (not the limited tile list).
  const facetBase = useMemo(
    () =>
      filterTilePeople(allPeople, {
        nameQuery: nameSearch,
        ageKeys,
        gender,
        meditation
        // location / stayRange omitted so facet counts stay useful while choosing
      }),
    [allPeople, nameSearch, ageKeys, gender, meditation]
  );

  const locations = useMemo(() => registrationLocationFacets(facetBase), [facetBase]);
  const stayRanges = useMemo(() => registrationStayRangeFacets(facetBase), [facetBase]);

  const matchedPeople = useMemo(
    () =>
      filterTilePeople(allPeople, {
        nameQuery: nameSearch,
        ageKeys,
        meditation,
        gender,
        location,
        stayRange
      }),
    [allPeople, nameSearch, ageKeys, meditation, gender, location, stayRange]
  );

  const people = useMemo(
    () => matchedPeople.slice(0, INTEREST_TILE_DISPLAY_LIMIT),
    [matchedPeople]
  );
  const matchTotal = matchedPeople.length;
  const displayLimited = matchTotal > people.length;

  const selected = selectedIds instanceof Set ? selectedIds : new Set(selectedIds || []);

  function pickGender(next) {
    onGenderChange(gender === next ? '' : next);
  }

  function pickLocation(name) {
    onLocationChange(location === name ? '' : name);
  }

  function pickStayRange(key) {
    onStayRangeChange(stayRange === key ? '' : key);
  }

  return (
    <div className="x-interest-layout">
      <aside className="x-interest-side x-interest-panel" aria-label="Gender, location, and stay filters">
        <h2 className="x-interest-panel-title">
          <span uk-icon="icon: users; ratio: 0.75" /> Filter
        </h2>
        <div className="x-interest-gender-tabs" role="tablist" aria-label="Gender">
          <button
            type="button"
            role="tab"
            className={`x-interest-gender-tab${gender === 'male' ? ' is-active' : ''}`}
            aria-selected={gender === 'male'}
            onClick={() => pickGender('male')}
          >
            Male
          </button>
          <button
            type="button"
            role="tab"
            className={`x-interest-gender-tab${gender === 'female' ? ' is-active' : ''}`}
            aria-selected={gender === 'female'}
            onClick={() => pickGender('female')}
          >
            Female
          </button>
        </div>

        <p className="x-interest-side-label">Locations</p>
        {locations.length === 0 ? (
          <p className="x-interest-side-empty">No locations</p>
        ) : (
          <ul className="x-interest-location-list">
            {locations.map((row) => (
              <li key={row.name}>
                <button
                  type="button"
                  className={`x-interest-location-item${location === row.name ? ' is-active' : ''}`}
                  aria-pressed={location === row.name}
                  onClick={() => pickLocation(row.name)}
                >
                  <span className="x-interest-location-name">{row.name}</span>
                  <span className="x-interest-location-count">({row.count})</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="x-interest-side-label uk-margin-small-top">Stay dates</p>
        {stayRanges.length === 0 ? (
          <p className="x-interest-side-empty">No stay dates</p>
        ) : (
          <ul className="x-interest-location-list">
            {stayRanges.map((row) => (
              <li key={row.key}>
                <button
                  type="button"
                  className={`x-interest-location-item${stayRange === row.key ? ' is-active' : ''}`}
                  aria-pressed={stayRange === row.key}
                  onClick={() => pickStayRange(row.key)}
                >
                  <span className="x-interest-location-name">{row.label}</span>
                  <span className="x-interest-location-count">({row.count})</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className="x-interest-tiles-wrap">
        <section className="x-interest-panel x-interest-toolbar-panel" aria-label="Search and age filters">
          <div className="x-interest-panel-head">
            <h2 className="x-interest-panel-title">
              <span uk-icon="icon: search; ratio: 0.75" /> Find people
            </h2>
            <div className="x-interest-panel-actions">
              {filtersActive ? (
                <button type="button" className="x-interest-text-btn" onClick={onClearFilters}>
                  Clear filters
                </button>
              ) : null}
              {selectedCount > 0 ? (
                <>
                  <button
                    type="button"
                    className="x-interest-text-btn x-interest-text-btn-danger"
                    disabled={removeBusy}
                    onClick={onRemoveSelected}
                  >
                    {removeBusy ? 'Removing…' : 'Remove registration'}
                  </button>
                  <button type="button" className="x-interest-text-btn" onClick={onClearSelection} disabled={removeBusy}>
                    Clear selection ({selectedCount})
                  </button>
                </>
              ) : null}
            </div>
          </div>
          <p className="x-interest-stats-line">
            {stats?.families ?? 0} {(stats?.families ?? 0) === 1 ? 'family' : 'families'} ·{' '}
            {stats?.people ?? 0} {(stats?.people ?? 0) === 1 ? 'person' : 'people'}
            {(stats?.people ?? 0) > 0 ? ` · ${stats.rural} rural · ${stats.urban} urban` : ''}
            {filtersActive || displayLimited
              ? ` · showing ${people.length}${matchTotal !== people.length ? ` of ${matchTotal}` : ''}`
              : ''}
            {selectedCount > 0 ? ` · ${selectedCount} selected` : ''}
          </p>
          <div className="x-interest-tiles-toolbar">
            <div className="x-interest-tiles-search">
              <RegistrationNameSearch
                value={nameSearch}
                onChange={onNameSearchChange}
                onClear={onNameSearchClear}
              />
            </div>

            <div className="x-interest-filter-chips" role="group" aria-label="Age group">
              {AGE_FILTER_OPTS.map((opt) => {
                const active = ageKeys.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`x-interest-filter-chip${active ? ' is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => onAgeKeysChange(toggleAgeKey(ageKeys, opt.value))}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="x-field uk-margin-remove x-interest-meditation-filter">
              <label className="x-label" htmlFor="interest-meditation">
                Meditation
              </label>
              <select
                className="uk-select uk-form-small"
                id="interest-meditation"
                value={meditation || ''}
                onChange={(e) => onMeditationChange(e.target.value)}
              >
                <option value="">Any length</option>
                {MEDITATION_OPTS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {matchTotal === 0 ? (
          <div className="x-interest-empty-panel">
            <p>No matching people for these filters.</p>
          </div>
        ) : (
          <>
            <div className="x-interest-tiles" role="list">
              {people.map((person) => (
                <div key={person.id} role="listitem">
                  <InterestTile
                    person={person}
                    selected={selected.has(person.id)}
                    onToggle={onToggleSelect}
                  />
                </div>
              ))}
            </div>
            {displayLimited ? (
              <p className="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">
                Showing first {people.length} of {matchTotal} matches. Narrow with name or filters —
                left-pane counts include everyone.
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
