import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RegistrationsTiles } from '../components/stay/RegistrationsTiles.jsx';
import { useEventPick } from '../context/EventPickContext.jsx';
import { useEventRegistrations } from '../hooks/useEventRegistrations.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';
import { applySelectedRegistrationRemovals } from '../utils/stayRegistrationRemove.js';
import { registrationStats, registrationTilePeople } from '../utils/stayRegistrations.js';

function Gate({ title, message, children }) {
  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column app-narrow">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium x-interest-sheet">
          <header className="x-step-head form-head">
            <h2 className="form-title">{title}</h2>
            <p className="form-summary">{message}</p>
          </header>
          {children}
        </div>
      </div>
    </main>
  );
}

export function StayRegistrationsPage() {
  const { signedIn, hasRole, loading: authLoading } = useAuth();
  const { picked } = useEventPick();
  const canView =
    hasRole('accommodation_volunteer') || hasRole('pssm_admin') || hasRole('event_organizer');

  const { rows, loading, error, refresh } = useEventRegistrations(
    picked.id,
    signedIn && canView && Boolean(picked.id)
  );
  const [nameSearch, setNameSearch] = useState('');
  const [removeBusy, setRemoveBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [ageKeys, setAgeKeys] = useState([]);
  const [meditation, setMeditation] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [stayRange, setStayRange] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const stats = useMemo(() => registrationStats(rows), [rows]);
  const allPeople = useMemo(() => registrationTilePeople(rows), [rows]);

  const filtersActive = Boolean(
    String(nameSearch || '').trim() ||
      ageKeys.length ||
      meditation ||
      gender ||
      location ||
      stayRange
  );
  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearFilters() {
    setNameSearch('');
    setAgeKeys([]);
    setMeditation('');
    setGender('');
    setLocation('');
    setStayRange('');
  }

  async function removeSelectedRegistrations() {
    if (selectedIds.size === 0) return;

    setRemoveBusy(true);
    setActionError('');
    try {
      const { deleted, updated } = await applySelectedRegistrationRemovals({
        selectedIds,
        allPeople,
        bookings: rows,
        api
      });
      if (deleted === 0 && updated === 0) {
        return;
      }
      setSelectedIds(new Set());
      await refresh();
      if (window.UIkit) {
        const parts = [];
        if (updated > 0) parts.push(`${updated} updated`);
        if (deleted > 0) parts.push(`${deleted} removed`);
        window.UIkit.notification({
          message: `Registration ${parts.join(', ')}.`,
          status: 'success',
          pos: 'top-center',
          timeout: 2500
        });
      }
    } catch (err) {
      setActionError(err.message || 'Could not remove registration.');
      if (window.UIkit) {
        window.UIkit.notification({
          message: err.message || 'Could not remove registration.',
          status: 'danger',
          pos: 'top-center',
          timeout: 4000
        });
      }
    } finally {
      setRemoveBusy(false);
    }
  }

  if (authLoading) {
    return (
      <main className="uk-section uk-section-small uk-padding-remove-top">
        <div className="uk-container app-column">
          <p className="hint">Loading…</p>
        </div>
      </main>
    );
  }

  if (!signedIn || !canView) {
    return (
      <Gate
        title="Interested Friends and Masters"
        message="Only Accommodation Volunteer, Event Organizer, or PSSM Admin can open this list."
      >
        <Link className="uk-button uk-button-default uk-border-rounded" to="/">
          Back to home
        </Link>
      </Gate>
    );
  }

  if (!picked.id) {
    return (
      <Gate
        title="Interested Friends and Masters"
        message="Pick an event in the header to see who registered interest."
      >
        <Link className="uk-button uk-button-default uk-border-rounded" to="/">
          Back to home
        </Link>
      </Gate>
    );
  }

  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium x-interest-sheet">
          <header className="x-step-head form-head">
            <h2 className="form-title">Interested Friends and Masters</h2>
            <p className="form-summary">
              {picked.name} — interest only; room allocation later. Tap filters to narrow who you see.
            </p>
          </header>

          {error || actionError ? (
            <p className="hint" role="alert">
              {actionError || error}
            </p>
          ) : null}
          {loading ? <p className="hint">Loading…</p> : null}

          {!loading && rows.length === 0 ? (
            <div className="x-interest-empty">
              <p>No registrations yet for this event.</p>
              <Link className="uk-button uk-button-primary" to="/stay?plan=free&from=interest">
                Register a family
              </Link>
            </div>
          ) : null}

          {!loading && rows.length > 0 ? (
            <RegistrationsTiles
              rows={rows}
              stats={stats}
              filtersActive={filtersActive}
              onClearFilters={clearFilters}
              selectedCount={selectedIds.size}
              onClearSelection={() => setSelectedIds(new Set())}
              onRemoveSelected={removeSelectedRegistrations}
              removeBusy={removeBusy}
              nameSearch={nameSearch}
              onNameSearchChange={setNameSearch}
              onNameSearchClear={() => setNameSearch('')}
              ageKeys={ageKeys}
              onAgeKeysChange={setAgeKeys}
              meditation={meditation}
              onMeditationChange={setMeditation}
              gender={gender}
              onGenderChange={setGender}
              location={location}
              onLocationChange={setLocation}
              stayRange={stayRange}
              onStayRangeChange={setStayRange}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          ) : null}

          {!loading && rows.length > 0 ? (
            <div className="step-actions">
              <Link className="uk-button uk-button-primary uk-width-1-1" to="/stay?plan=free&from=interest">
                Register another family
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
