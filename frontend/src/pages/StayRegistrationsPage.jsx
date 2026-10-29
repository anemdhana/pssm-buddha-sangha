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
import {
  formatAllotmentMovesMessage,
  suggestHotelsForSelection,
  suggestPlacementsForHotel
} from '../utils/stayAllotmentSuggest.js';
import { fetchAllStayAllotments } from '../utils/stayAllotments.js';
import { applySelectedRegistrationRemovals } from '../utils/stayRegistrationRemove.js';
import { filterTilePeople, registrationTilePeople } from '../utils/stayRegistrations.js';
import { uikitDialogChoice } from '../utils/uikitDialog.js';

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
  const [age, setAge] = useState('');
  const [meditation, setMeditation] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [stayRange, setStayRange] = useState('');
  const [familySize, setFamilySize] = useState('');
  const [showOnlyAllotted, setShowOnlyAllotted] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [hotels, setHotels] = useState([]);
  const [allotments, setAllotments] = useState([]);
  const [hotelPage, setHotelPage] = useState(0);
  const [peopleDragging, setPeopleDragging] = useState(false);

  const debouncedQ = useDebouncedValue(nameSearch, 300);

  const filtersActive = Boolean(
    String(nameSearch || '').trim() ||
      age ||
      meditation ||
      gender ||
      location ||
      stayRange ||
      familySize ||
      showOnlyAllotted
  );

  useEffect(() => {
    setPage(0);
  }, [debouncedQ, age, meditation, gender, location, stayRange, familySize, showOnlyAllotted, picked.id]);

  useEffect(() => {
    setHotelPage(0);
  }, [selectedIds, picked.id]);

  const { rows, total, totalPages, stats, facets, loading, refreshing, error, refresh } =
    useEventRegistrations(picked.id, signedIn && canView && Boolean(picked.id), {
      q: debouncedQ,
      gender,
      ages: age || undefined,
      meditation,
      location,
      stayRange,
      familySize: familySize || undefined,
      allotment: showOnlyAllotted ? 'allotted' : 'wait',
      page,
      size: 24
    });

  const allPeople = useMemo(() => {
    const people = registrationTilePeople(rows);
    // Server returns whole bookings that contain a matching guest; keep only people
    // whose own stay dates match the selected stay filter (split-stay siblings).
    if (!stayRange) return people;
    return filterTilePeople(people, { stayRange });
  }, [rows, stayRange]);
  const selectedPeople = useMemo(
    () => allPeople.filter((p) => p && selectedIds.has(p.id)),
    [allPeople, selectedIds]
  );

  async function loadHotelsAndAllotments() {
    if (!picked.id || !signedIn || !canView) {
      setHotels([]);
      setAllotments([]);
      return;
    }
    try {
      const [hotelRes, allotments] = await Promise.all([
        api.listHotels(picked.id),
        fetchAllStayAllotments(api, picked.id)
      ]);
      setHotels(Array.isArray(hotelRes.data) ? hotelRes.data : []);
      setAllotments(Array.isArray(allotments) ? allotments : []);
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

  function toggleFamilyMembers(ids) {
    const list = Array.isArray(ids) ? ids.filter(Boolean) : [];
    if (!list.length) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allOn = list.every((id) => next.has(id));
      if (allOn) list.forEach((id) => next.delete(id));
      else list.forEach((id) => next.add(id));
      return next;
    });
  }

  function selectAllVisible(ids) {
    const list = Array.isArray(ids) ? ids.filter(Boolean) : [];
    setSelectedIds((prev) => {
      const next = new Set(prev);
      list.forEach((id) => next.add(id));
      return next;
    });
  }

  function clearFilters() {
    setNameSearch('');
    setAge('');
    setMeditation('');
    setGender('');
    setLocation('');
    setStayRange('');
    setFamilySize('');
    setShowOnlyAllotted(false);
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

  function membersPayload(people) {
    return (Array.isArray(people) ? people : [])
      .filter(Boolean)
      .map((p) => ({
        name: p.name || '',
        mobile: p.mobile || '',
        primary: Boolean(p.primary),
        bookingId: p.bookingId || ''
      }));
  }

  async function releasePeopleToWaitList(people, { clearSelection = false } = {}) {
    const list = Array.isArray(people) ? people.filter(Boolean) : [];
    if (!list.length || !picked.id) return;
    setAllotBusy(true);
    setActionError('');
    try {
      const bookingIds = [
        ...new Set(list.map((p) => String(p.bookingId || '').trim()).filter(Boolean))
      ];
      const res = await api.releaseStayAllotments({
        eventId: picked.id,
        members: membersPayload(list),
        // Clear whole-family allotments so wait-list stats/tiles update immediately.
        bookingIds
      });
      const released = Number(res?.data?.released) || 0;
      if (clearSelection) setSelectedIds(new Set());
      else {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          list.forEach((p) => next.delete(p.id));
          return next;
        });
      }
      // Return to wait-list view so released families are visible after refresh.
      // Pass allotment:'wait' explicitly — setState has not flipped yet in this tick.
      const nextAllotment = released > 0 ? 'wait' : showOnlyAllotted ? 'allotted' : 'wait';
      if (released > 0 && showOnlyAllotted) {
        setShowOnlyAllotted(false);
      }
      await loadHotelsAndAllotments();
      await refresh({ allotment: nextAllotment });
      if (window.UIkit) {
        window.UIkit.notification({
          message:
            released > 0
              ? `Moved ${released} ${released === 1 ? 'person' : 'people'} to Wait List.`
              : 'No hotel allotment found for the selected people.',
          status: released > 0 ? 'success' : 'warning',
          pos: 'top-center',
          timeout: 3200
        });
      }
    } catch (err) {
      setActionError(err.message || 'Could not move to wait list.');
      if (window.UIkit) {
        window.UIkit.notification({
          message: err.message || 'Could not move to wait list.',
          status: 'danger',
          pos: 'top-center',
          timeout: 4000
        });
      }
    } finally {
      setAllotBusy(false);
    }
  }

  async function moveSelectedToWaitList(people) {
    const list = Array.isArray(people) ? people.filter(Boolean) : [];
    if (!list.length) return;
    const names = list
      .slice(0, 3)
      .map((p) => p.name || 'Guest')
      .join(', ');
    const extra = list.length > 3 ? ` and ${list.length - 3} more` : '';
    const choice = await uikitDialogChoice(
      `<p class="uk-margin-remove-top">Move <strong>${list.length}</strong> selected ${
        list.length === 1 ? 'person' : 'people'
      } to Wait List?</p>` +
        `<p class="uk-text-meta uk-margin-small-top">${names}${extra} will be removed from their current hotel room(s).</p>`,
      [{ id: 'ok', label: 'Move to Wait List', buttonClass: 'uk-button-primary' }]
    );
    if (choice !== 'ok') return;
    await releasePeopleToWaitList(list, { clearSelection: true });
  }

  async function confirmAllotment(hotel) {
    const focusHotelId = hotel?.hotelId || '';
    let basePlacements = focusHotelId
      ? (suggestion.placements || []).filter((p) => p.hotelId === focusHotelId)
      : suggestion.placements || [];
    if (!basePlacements.length && focusHotelId) {
      basePlacements = suggestPlacementsForHotel({
        hotelId: focusHotelId,
        hotels,
        allotments,
        selectedIds,
        people: allPeople
      });
    }
    if (!basePlacements.length) {
      if (window.UIkit) {
        window.UIkit.notification({
          message: 'Could not fit the selected people into rooms at this hotel.',
          status: 'warning',
          pos: 'top-center',
          timeout: 3500
        });
      }
      return;
    }

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
      const saveRes = await api.createStayAllotments({
        eventId: picked.id,
        eventName: picked.name,
        placements: chosenPlacements.map((p) => ({
          bookingId: p.bookingId,
          plan: p.plan,
          hotelId: p.hotelId,
          roomNumber: p.roomNumber,
          roomType: p.roomType,
          roomKind: p.roomKind,
          checkInDate: p.stayStartDate || p.checkInDate || '',
          checkOutDate: p.stayEndDate || p.checkOutDate || '',
          place: p.members?.[0]?.place || {},
          members: (p.members || []).map((m) => ({
            name: m.name,
            relation: m.relation || '',
            mobile: m.mobile,
            gender: m.gender,
            age: m.age,
            livePhoto: m.livePhoto || '',
            idProofPhoto: m.idProofPhoto || '',
            idType: m.idType || '',
            stayStartDate: m.stayStartDate || p.stayStartDate || '',
            stayEndDate: m.stayEndDate || p.stayEndDate || '',
            primary: Boolean(m.primary)
          }))
        }))
      });
      setSelectedIds(new Set());
      await loadHotelsAndAllotments();
      await refresh();
      if (window.UIkit) {
        const peopleCount = chosenPlacements.reduce((n, p) => n + (p.members?.length || 0), 0);
        const moveText = formatAllotmentMovesMessage(saveRes?.data?.moves || []);
        window.UIkit.notification({
          message: moveText
            ? `Allotted ${peopleCount}. ${moveText}`
            : `Allotted ${peopleCount} people.`,
          status: 'success',
          pos: 'top-center',
          timeout: moveText ? 5500 : 2800
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
  const emptyWaitButAllotted = emptyUnfiltered && (stats?.allotted ?? 0) > 0;
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
              {emptyWaitButAllotted ? (
                <>
                  <p>No one left on the wait list — registered people are already allotted.</p>
                  <button
                    type="button"
                    className="uk-button uk-button-primary"
                    onClick={() => setShowOnlyAllotted(true)}
                  >
                    Show only Allotted
                  </button>
                </>
              ) : (
                <>
                  <p>No registrations yet for this event.</p>
                  <Link className="uk-button uk-button-primary" to="/stay?plan=free&from=interest">
                    Register a family
                  </Link>
                </>
              )}
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
              age={age}
              onAgeChange={setAge}
              meditation={meditation}
              onMeditationChange={setMeditation}
              gender={gender}
              onGenderChange={setGender}
              location={location}
              onLocationChange={setLocation}
              stayRange={stayRange}
              onStayRangeChange={setStayRange}
              familySize={familySize}
              onFamilySizeChange={setFamilySize}
              showOnlyAllotted={showOnlyAllotted}
              onShowOnlyAllottedChange={setShowOnlyAllotted}
              selectedIds={selectedIds}
              onToggleFamily={toggleFamilyMembers}
              onSelectAll={selectAllVisible}
              allotBusy={allotBusy}
              onPeopleDragStart={() => setPeopleDragging(true)}
              onPeopleDragEnd={() => setPeopleDragging(false)}
            />
          ) : null}

          {!loading && !emptyUnfiltered && selectedIds.size > 0 ? (
            <SuitableHotelsStrip
              suggestion={suggestion}
              hotels={hotels}
              allotments={allotments}
              pageIndex={hotelPage}
              onPageChange={setHotelPage}
              onHotelDrop={confirmAllotment}
              allotBusy={allotBusy}
              selectedCount={selectedIds.size}
              dragging={peopleDragging}
              selectedPeople={selectedPeople}
              onMoveToWaitList={moveSelectedToWaitList}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
