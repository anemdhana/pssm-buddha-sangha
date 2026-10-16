import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MEDITATION_OPTS } from '../../pages/join/ChipGroup.jsx';
import {
  ageGroupLabel,
  compareStayRangeKeys,
  groupTilePeopleByFamily,
  meditationLabel,
  registrationLocationShort,
  stayRangeLabel
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

function primaryIndex(members) {
  const list = Array.isArray(members) ? members : [];
  const idx = list.findIndex((m) => m && m.primary);
  return idx >= 0 ? idx : 0;
}

function FamilyInterestTile({ members, selectedIds, onToggle }) {
  const list = Array.isArray(members) ? members.filter(Boolean) : [];
  const selected = selectedIds instanceof Set ? selectedIds : new Set(selectedIds || []);
  const [index, setIndex] = useState(() => primaryIndex(list));
  const [animClass, setAnimClass] = useState('');
  const [animKey, setAnimKey] = useState(0);

  const memberKey = list.map((m) => m.id).join('|');
  useEffect(() => {
    setIndex((prev) => {
      if (list.length === 0) return 0;
      if (prev >= 0 && prev < list.length && list[prev]) return prev;
      return primaryIndex(list);
    });
    // memberKey captures list identity; list is read for clamp/primary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberKey]);

  useEffect(() => {
    if (window.UIkit) window.UIkit.update();
  }, [animKey]);

  if (list.length === 0) return null;

  const safeIndex = Math.min(index, list.length - 1);
  const person = list[safeIndex];
  const multi = list.length > 1;
  const isSelected = selected.has(person.id);
  const photo = String(person.livePhoto || '').trim();
  const location = registrationLocationShort(person.place);
  const age = ageGroupLabel(person.age);
  const meditation = meditationLabel(person.meditation);
  const profession = String(person.profession || '').trim() || 'Profession not set';
  const editPlan = person.plan === 'paid' ? 'paid' : 'free';
  const editQuery = person.primary
    ? `plan=${editPlan}&step=who`
    : `plan=${editPlan}&step=family&member=${person.memberIndex ?? 0}`;

  function go(delta) {
    if (!multi) return;
    const next = (safeIndex + delta + list.length) % list.length;
    setAnimClass(
      delta > 0 ? 'uk-animation-slide-right-small' : 'uk-animation-slide-left-small'
    );
    setAnimKey((k) => k + 1);
    setIndex(next);
  }

  return (
    <article
      className={`x-interest-tile x-interest-family-tile${isSelected ? ' is-selected' : ''}${
        multi ? ' has-family-nav' : ''
      }`}
      aria-selected={isSelected}
    >
      {multi ? (
        <>
          <button
            type="button"
            className="x-interest-tile-nav x-interest-tile-nav-prev"
            aria-label="Previous family member"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
          >
            <span uk-icon="icon: chevron-left; ratio: 0.9" />
          </button>
          <button
            type="button"
            className="x-interest-tile-nav x-interest-tile-nav-next"
            aria-label="Next family member"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
          >
            <span uk-icon="icon: chevron-right; ratio: 0.9" />
          </button>
          <span className="x-interest-tile-nav-count" aria-live="polite">
            {safeIndex + 1}/{list.length}
          </span>
        </>
      ) : null}

      <label className="x-interest-tile-check">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(person.id)}
          aria-label={`Select ${person.name}`}
        />
        <span className="x-interest-tile-check-box" aria-hidden="true" />
      </label>

      <Link
        className="x-interest-tile-edit"
        to={`/stay/edit/${encodeURIComponent(person.bookingId)}?${editQuery}`}
        onClick={(e) => e.stopPropagation()}
      >
        Edit
      </Link>

      <button
        type="button"
        className="x-interest-tile-hit"
        onClick={() => onToggle(person.id)}
        aria-pressed={isSelected}
      >
        <div key={animKey} className={`x-interest-tile-stage${animClass ? ` ${animClass}` : ''}`}>
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
        </div>
      </button>
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
  const locations = Array.isArray(facets?.locations) ? facets.locations : [];
  const stayRanges = (Array.isArray(facets?.stayRanges) ? facets.stayRanges : [])
    .map((row) => {
      const [start, end] = String(row.key || '').split('|');
      return {
        ...row,
        label: stayRangeLabel(start, end) || row.label || row.key
      };
    })
    .sort((a, b) => compareStayRangeKeys(a.key, b.key));
  const selected = selectedIds instanceof Set ? selectedIds : new Set(selectedIds || []);
  const matchTotal = Number(total) || 0;
  const families = useMemo(() => groupTilePeopleByFamily(people), [people]);

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
      <aside className="x-interest-side x-interest-panel" aria-label="Stay date and location filters">
        <div
          className="x-accommodation-chip x-accommodation-chip-side"
          title="Accommodation status for this event"
          aria-label={`Accommodation: ${stats?.waitList ?? 0} wait list, ${stats?.allotted ?? 0} allotted`}
        >
          <span className="x-accommodation-chip-title">Accommodation</span>
          <span className="x-accommodation-chip-parts">
            <span className="x-accommodation-chip-part is-wait">
              <strong>{stats?.waitList ?? 0}</strong> Wait List
            </span>
            <span className="x-accommodation-chip-part is-allotted">
              <strong>{stats?.allotted ?? 0}</strong> Allotted
            </span>
          </span>
        </div>

        <p className="x-interest-side-label">Stay dates</p>
        {stayRanges.length === 0 ? (
          <p className="x-interest-side-empty">No stay dates</p>
        ) : (
          <ul className="x-interest-stay-list">
            {stayRanges.map((row) => (
              <li key={row.key}>
                <button
                  type="button"
                  className={`x-interest-location-item x-interest-stay-item${
                    stayRange === row.key ? ' is-active' : ''
                  }`}
                  aria-pressed={stayRange === row.key}
                  onClick={() => pickStayRange(row.key)}
                >
                  <span className="x-interest-stay-range">{row.label}</span>
                  <span className="x-interest-location-count">({row.count})</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="x-interest-side-label uk-margin-small-top">Locations</p>
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
      </aside>

      <div className={`x-interest-tiles-wrap${refreshing ? ' is-refreshing' : ''}`}>
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
            {stats?.families ?? matchTotal} {(stats?.families ?? matchTotal) === 1 ? 'family' : 'families'} ·{' '}
            {stats?.people ?? 0} {(stats?.people ?? 0) === 1 ? 'person' : 'people'}
            {(stats?.people ?? 0) > 0 ? ` · ${stats.rural || 0} rural · ${stats.urban || 0} urban` : ''}
            {filtersActive ? ` · page ${page + 1}${totalPages ? ` of ${totalPages}` : ''}` : ''}
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

            <div className="x-interest-filter-chips" role="group" aria-label="Gender and age">
              <button
                type="button"
                className={`x-interest-filter-chip${gender === 'male' ? ' is-active' : ''}`}
                aria-pressed={gender === 'male'}
                onClick={() => pickGender('male')}
              >
                Male
              </button>
              <button
                type="button"
                className={`x-interest-filter-chip${gender === 'female' ? ' is-active' : ''}`}
                aria-pressed={gender === 'female'}
                onClick={() => pickGender('female')}
              >
                Female
              </button>
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

        {families.length === 0 ? (
          <div className="x-interest-empty-panel">
            <p>No matching people for these filters.</p>
          </div>
        ) : (
          <>
            <div className="x-interest-tiles" role="list">
              {families.map((family) => (
                <div key={family.bookingId} role="listitem">
                  <FamilyInterestTile
                    members={family.members}
                    selectedIds={selected}
                    onToggle={onToggleSelect}
                  />
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
