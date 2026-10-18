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

const ALLOT_DRAG_MIME = 'application/x-pssm-allot-people';

function FamilyInterestTile({
  members,
  selectedIds,
  selectedCount = 0,
  allotBusy = false,
  onToggleFamily,
  onPeopleDragStart,
  onPeopleDragEnd
}) {
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
  const memberIds = list.map((m) => m.id);
  const selectedInFamily = memberIds.filter((id) => selected.has(id)).length;
  const allSelected = selectedInFamily === memberIds.length;
  const someSelected = selectedInFamily > 0 && !allSelected;
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

  function toggleFamily() {
    onToggleFamily?.(memberIds);
  }

  const canDrag = !allotBusy && selectedCount > 0 && selectedInFamily > 0;

  function handleDragStart(e) {
    if (!canDrag) {
      e.preventDefault();
      return;
    }
    const block = e.target?.closest?.(
      'a, label, input, .x-interest-tile-nav, .x-interest-tile-check, .x-interest-tile-edit'
    );
    if (block) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData(ALLOT_DRAG_MIME, String(selectedCount));
    e.dataTransfer.setData(
      'text/plain',
      `${selectedCount} ${selectedCount === 1 ? 'person' : 'people'}`
    );
    e.dataTransfer.effectAllowed = 'move';
    const ghost = document.createElement('div');
    ghost.className = 'x-suitable-drag-ghost';
    ghost.textContent = `${selectedCount} ${selectedCount === 1 ? 'person' : 'people'}`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 48, 24);
    requestAnimationFrame(() => {
      try {
        ghost.remove();
      } catch {
        /* ignore */
      }
    });
    onPeopleDragStart?.(e);
  }

  return (
    <article
      className={`x-interest-tile x-interest-family-tile${allSelected ? ' is-selected' : ''}${
        someSelected ? ' is-partial' : ''
      }${multi ? ' has-family-nav' : ''}${canDrag ? ' is-draggable' : ''}`}
      aria-selected={allSelected}
      draggable={canDrag}
      onDragStart={handleDragStart}
      onDragEnd={() => onPeopleDragEnd?.()}
      title={canDrag ? 'Drag onto a suitable hotel to allot' : undefined}
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
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={toggleFamily}
          aria-label={
            multi
              ? `Select all ${list.length} family members`
              : `Select ${person.name}`
          }
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

      <div
        className="x-interest-tile-hit"
        role="button"
        tabIndex={0}
        aria-pressed={allSelected}
        onClick={toggleFamily}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFamily();
          }
        }}
      >
        <div key={animKey} className={`x-interest-tile-stage${animClass ? ` ${animClass}` : ''}`}>
          {photo ? (
            <img className="x-interest-tile-photo" src={photo} alt="" draggable={false} />
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
      </div>
    </article>
  );
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
  age,
  onAgeChange,
  meditation,
  onMeditationChange,
  gender,
  onGenderChange,
  location,
  onLocationChange,
  stayRange,
  onStayRangeChange,
  familySize = '',
  onFamilySizeChange,
  showOnlyAllotted = false,
  onShowOnlyAllottedChange,
  selectedIds,
  onToggleFamily,
  onSelectAll,
  allotBusy = false,
  onPeopleDragStart,
  onPeopleDragEnd
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
  const familySizes = (Array.isArray(facets?.familySizes) ? facets.familySizes : [])
    .map((row) => ({
      size: Number(row?.size) || 0,
      count: Number(row?.count) || 0
    }))
    .filter((row) => row.size > 0)
    .sort((a, b) => b.size - a.size);
  const selected = selectedIds instanceof Set ? selectedIds : new Set(selectedIds || []);
  const matchTotal = Number(total) || 0;
  const families = useMemo(() => groupTilePeopleByFamily(people), [people]);
  const visibleIds = useMemo(
    () => (Array.isArray(people) ? people.map((p) => p.id).filter(Boolean) : []),
    [people]
  );
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const familySizeKey = familySize ? String(familySize) : '';

  function pickGender(next) {
    onGenderChange(gender === next ? '' : next);
  }

  function pickLocation(name) {
    onLocationChange(location === name ? '' : name);
  }

  function pickStayRange(key) {
    onStayRangeChange(stayRange === key ? '' : key);
  }

  function pickFamilySize(size) {
    const next = String(size);
    onFamilySizeChange?.(familySizeKey === next ? '' : next);
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
            <div className="x-interest-panel-head-main">
              <h2 className="x-interest-panel-title">
                <span uk-icon="icon: search; ratio: 0.7" /> Find people
              </h2>
              <p className="x-interest-stats-line">
                {stats?.families ?? matchTotal} {(stats?.families ?? matchTotal) === 1 ? 'family' : 'families'} ·{' '}
                {stats?.people ?? 0} {(stats?.people ?? 0) === 1 ? 'person' : 'people'}
                {(stats?.people ?? 0) > 0 ? ` · ${stats.rural || 0} rural · ${stats.urban || 0} urban` : ''}
                {filtersActive ? ` · page ${page + 1}${totalPages ? ` of ${totalPages}` : ''}` : ''}
                {selectedCount > 0 ? ` · ${selectedCount} selected` : ''}
              </p>
            </div>
            <div className="x-interest-panel-actions">
              {filtersActive ? (
                <button type="button" className="x-interest-text-btn" onClick={onClearFilters}>
                  Clear filters
                </button>
              ) : null}
              {visibleIds.length > 0 ? (
                <button
                  type="button"
                  className="x-interest-text-btn"
                  disabled={removeBusy}
                  onClick={() => (allVisibleSelected ? onClearSelection?.() : onSelectAll?.(visibleIds))}
                >
                  {allVisibleSelected ? 'Deselect all' : 'Select all'}
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
          <div className="x-interest-tiles-toolbar">
            <div className="x-interest-tiles-search">
              <RegistrationNameSearch
                value={nameSearch}
                onChange={onNameSearchChange}
                onClear={onNameSearchClear}
                compact
              />
            </div>

            <div className="x-interest-filter-chips" role="group" aria-label="Gender">
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
            </div>

            <div className="x-field uk-margin-remove x-interest-age-filter">
              <label className="uk-hidden" htmlFor="interest-age">
                Age
              </label>
              <select
                className="uk-select uk-form-small"
                id="interest-age"
                aria-label="Age"
                value={age || ''}
                onChange={(e) => onAgeChange?.(e.target.value)}
              >
                <option value="">Age</option>
                {AGE_FILTER_OPTS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="x-field uk-margin-remove x-interest-meditation-filter">
              <label className="uk-hidden" htmlFor="interest-meditation">
                Meditation
              </label>
              <select
                className="uk-select uk-form-small"
                id="interest-meditation"
                aria-label="Meditation"
                value={meditation || ''}
                onChange={(e) => onMeditationChange(e.target.value)}
              >
                <option value="">Meditation</option>
                {MEDITATION_OPTS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="x-interest-allotted-toggle" htmlFor="interest-show-allotted">
              <input
                id="interest-show-allotted"
                type="checkbox"
                className="uk-checkbox"
                checked={Boolean(showOnlyAllotted)}
                onChange={(e) => onShowOnlyAllottedChange?.(e.target.checked)}
              />
              <span>Allotted</span>
            </label>

            {familySizes.length > 0 ? (
              <div
                className="x-interest-family-size-group"
                role="group"
                aria-label="Filter by family size"
              >
                <span className="x-interest-family-size-label">Size</span>
                <div className="x-interest-family-size-chips">
                  {familySizes.map((row) => {
                    const key = String(row.size);
                    const active = familySizeKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`x-interest-family-size-chip${active ? ' is-active' : ''}`}
                        aria-pressed={active}
                        title={`${row.size} ${row.size === 1 ? 'person' : 'people'}`}
                        onClick={() => pickFamilySize(row.size)}
                      >
                        {row.size}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
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
                    selectedCount={selectedCount}
                    allotBusy={allotBusy}
                    onToggleFamily={onToggleFamily}
                    onPeopleDragStart={onPeopleDragStart}
                    onPeopleDragEnd={onPeopleDragEnd}
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
