import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RegistrationsTiles } from '../components/stay/RegistrationsTiles.jsx';
import { SuitableHotelsStrip } from '../components/stay/SuitableHotelsStrip.jsx';
import { useEventPick } from '../context/EventPickContext.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useEventRegistrations } from '../hooks/useEventRegistrations.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';
import { openAllotmentConfirmDialog } from '../utils/allotmentConfirmDialog.js';
import { suggestHotelsForSelection } from '../utils/stayAllotmentSuggest.js';
import { applySelectedRegistrationRemovals } from '../utils/stayRegistrationRemove.js';
import { registrationTilePeople } from '../utils/stayRegistrations.js';

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

  const [nameSearch, setNameSearch] = useState('');
  const [removeBusy, setRemoveBusy] = useState(false);
  const [allotBusy, setAllotBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [ageKeys, setAgeKeys] = useState([]);
  const [meditation, setMeditation] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [stayRange, setStayRange] = useState('');
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [hotels, setHotels] = useState([]);
  const [allotments, setAllotments] = useState([]);
  const [hotelPage, setHotelPage] = useState(0);

  const debouncedQ = useDebouncedValue(nameSearch, 300);

  const filtersActive = Boolean(
    String(nameSearch || '').trim() ||
      ageKeys.length ||
      meditation ||
      gender ||
      location ||
      stayRange
  );

  useEffect(() => {
    setPage(0);
  }, [debouncedQ, ageKeys, meditation, gender, location, stayRange, picked.id]);

  useEffect(() => {
    setHotelPage(0);
  }, [selectedIds, picked.id]);

  const { rows, total, totalPages, stats, facets, loading, refreshing, error, refresh } =
    useEventRegistrations(picked.id, signedIn && canView && Boolean(picked.id), {
      q: debouncedQ,
      gender,
      ages: ageKeys,
      meditation,
      location,
      stayRange,
      page,
      size: 24
    });

  const allPeople = useMemo(() => registrationTilePeople(rows), [rows]);

  async function loadHotelsAndAllotments() {
    if (!picked.id || !signedIn || !canView) {
      setHotels([]);
      setAllotments([]);
      return;
    }
    try {
      const [hotelRes, allotRes] = await Promise.all([
        api.listHotels(picked.id),
        api.listStayAllotments(picked.id, { size: 500 })
      ]);
      setHotels(Array.isArray(hotelRes.data) ? hotelRes.data : []);
      const allotData = allotRes.data;
      setAllotments(Array.isArray(allotData?.items) ? allotData.items : Array.isArray(allotData) ? allotData : []);
    } catch {
      setHotels([]);
      setAllotments([]);
    }
  }

  useEffect(() => {
    loadHotelsAndAllotments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked.id, signedIn, canView]);

  const suggestion = useMemo(
    () =>
      suggestHotelsForSelection({
        hotels,
        allotments,
        selectedIds,
        people: allPeople,
        eventLocationLabel: location || ''
      }),
    [hotels, allotments, selectedIds, allPeople, location]
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
    setPage(0);
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
      await loadHotelsAndAllotments();
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

  async function confirmAllotment(hotel) {
    const focusHotelId = hotel?.hotelId || '';
    const basePlacements = focusHotelId
      ? (suggestion.placements || []).filter((p) => p.hotelId === focusHotelId)
      : suggestion.placements || [];
    if (!basePlacements.length) return;

    const chosenPlacements = await openAllotmentConfirmDialog({
      suggestion: { ...suggestion, placements: basePlacements },
      focusHotelId,
      hotels,
      allotments
    });
    if (!chosenPlacements?.length) return;

    setAllotBusy(true);
    setActionError('');
    try {
      await api.createStayAllotments({
        eventId: picked.id,
        eventName: picked.name,
        placements: chosenPlacements.map((p) => ({
          bookingId: p.bookingId,
          plan: p.plan,
          hotelId: p.hotelId,
          roomNumber: p.roomNumber,
          roomType: p.roomType,
          roomKind: p.roomKind,
          place: p.members?.[0]?.place || {},
          members: (p.members || []).map((m) => ({
            name: m.name,
            relation: m.relation || '',
            mobile: m.mobile,
            gender: m.gender,
            age: m.age,
            livePhoto: m.livePhoto || '',
            primary: Boolean(m.primary)
          }))
        }))
      });
      setSelectedIds(new Set());
      await loadHotelsAndAllotments();
      await refresh();
      if (window.UIkit) {
        window.UIkit.notification({
          message: `Allotted ${chosenPlacements.reduce((n, p) => n + (p.members?.length || 0), 0)} people.`,
          status: 'success',
          pos: 'top-center',
          timeout: 2800
        });
      }
    } catch (err) {
      setActionError(err.message || 'Could not save allotment.');
      if (window.UIkit) {
        window.UIkit.notification({
          message: err.message || 'Could not save allotment.',
          status: 'danger',
          pos: 'top-center',
          timeout: 4000
        });
      }
    } finally {
      setAllotBusy(false);
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
        title="Friends and Masters List"
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
        title="Friends and Masters List"
        message="Pick an event in the header to see who registered interest."
      >
        <Link className="uk-button uk-button-default uk-border-rounded" to="/">
          Back to home
        </Link>
      </Gate>
    );
  }

  const emptyUnfiltered = !loading && total === 0 && !filtersActive;
  const showTiles = !loading || filtersActive || rows.length > 0;

  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column">
        <div
          className={`uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium x-interest-sheet${
            selectedIds.size > 0 ? ' has-hotel-overlay' : ''
          }`}
        >
          <header className="x-step-head form-head x-interest-page-head">
            <div>
              <h2 className="form-title">Friends and Masters List</h2>
              <p className="form-summary">
                {picked.name} — Search and filters run on the server for large lists.
              </p>
            </div>
            {total > 0 ? (
              <Link
                className="uk-button uk-button-primary uk-button-small x-interest-register-btn"
                to="/stay?plan=free&from=interest"
              >
                Register another family
              </Link>
            ) : null}
          </header>

          {error || actionError ? (
            <p className="hint" role="alert">
              {actionError || error}
            </p>
          ) : null}
          {loading ? <p className="hint">Loading…</p> : null}

          {emptyUnfiltered ? (
            <div className="x-interest-empty">
              <p>No registrations yet for this event.</p>
              <Link className="uk-button uk-button-primary" to="/stay?plan=free&from=interest">
                Register a family
              </Link>
            </div>
          ) : null}

          {!loading && showTiles && !emptyUnfiltered ? (
            <RegistrationsTiles
              rows={rows}
              people={allPeople}
              stats={stats}
              facets={facets}
              total={total}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              refreshing={refreshing}
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

          {!loading && !emptyUnfiltered && selectedIds.size > 0 ? (
            <SuitableHotelsStrip
              suggestion={suggestion}
              pageIndex={hotelPage}
              onPageChange={setHotelPage}
              onHotelClick={confirmAllotment}
              allotBusy={allotBusy}
              selectedCount={selectedIds.size}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
