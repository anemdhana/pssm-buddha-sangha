import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AllotmentsTiles } from '../components/stay/AllotmentsTiles.jsx';
import { StayBreadcrumb } from '../components/stay/StayBreadcrumb.jsx';
import { useEventPick } from '../context/EventPickContext.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { api } from '../services/api.js';
import { allotmentTilePeople } from '../utils/stayAllotments.js';

const emptyPage = {
  items: [],
  total: 0,
  page: 0,
  size: 24,
  totalPages: 0,
  stats: { parties: 0, people: 0, hotels: 0, allotted: 0, checkedIn: 0 },
  facets: { hotels: [], locations: [], stayRanges: [] }
};

function Gate({ title, message, children }) {
  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column app-narrow">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium x-interest-sheet">
          <StayBreadcrumb crumbs={[{ label: 'Stay' }, { label: 'Who is staying where' }]} />
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

function normalizePage(payload) {
  if (!payload || typeof payload !== 'object') return emptyPage;
  if (Array.isArray(payload)) {
    return {
      ...emptyPage,
      items: payload,
      total: payload.length,
      totalPages: 1
    };
  }
  return {
    items: Array.isArray(payload.items) ? payload.items : [],
    total: Number(payload.total) || 0,
    page: Number(payload.page) || 0,
    size: Number(payload.size) || 24,
    totalPages: Number(payload.totalPages) || 0,
    stats: payload.stats || emptyPage.stats,
    facets: payload.facets || emptyPage.facets
  };
}

export function StayAllotmentsPage() {
  const { signedIn, hasRole, loading: authLoading } = useAuth();
  const { picked } = useEventPick();
  const canView =
    hasRole('accommodation_volunteer') ||
    hasRole('accommodation_admin') ||
    hasRole('pssm_admin') ||
    hasRole('event_organizer');

  const [pageData, setPageData] = useState(emptyPage);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [hotelId, setHotelId] = useState('');
  const [roomType, setRoomType] = useState('');
  const [roomKind, setRoomKind] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');
  const [stayRange, setStayRange] = useState('');
  const [page, setPage] = useState(0);
  const hasLoadedRef = useRef(false);
  const requestIdRef = useRef(0);

  const debouncedQ = useDebouncedValue(nameSearch, 300);

  const filtersActive = Boolean(
    String(nameSearch || '').trim() ||
      hotelId ||
      roomType ||
      roomKind ||
      gender ||
      status ||
      location ||
      stayRange
  );

  useEffect(() => {
    setPage(0);
  }, [debouncedQ, hotelId, roomType, roomKind, gender, status, location, stayRange, picked.id]);

  useEffect(() => {
    hasLoadedRef.current = false;
  }, [picked.id]);

  const refresh = useCallback(async () => {
    if (!signedIn || !canView || !picked.id) {
      setPageData(emptyPage);
      hasLoadedRef.current = false;
      return;
    }
    const requestId = ++requestIdRef.current;
    const initial = !hasLoadedRef.current;
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const res = await api.listStayAllotments(picked.id, {
        q: debouncedQ || undefined,
        hotelId: hotelId || undefined,
        roomType: roomType || undefined,
        roomKind: roomKind || undefined,
        gender: gender || undefined,
        status: status || undefined,
        location: location || undefined,
        stayRange: stayRange || undefined,
        page,
        size: 24
      });
      if (requestId !== requestIdRef.current) return;
      setPageData(normalizePage(res.data));
      hasLoadedRef.current = true;
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setPageData(emptyPage);
      setError(err.message || 'Could not load allotments.');
      hasLoadedRef.current = true;
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [
    signedIn,
    canView,
    picked.id,
    debouncedQ,
    hotelId,
    roomType,
    roomKind,
    gender,
    status,
    location,
    stayRange,
    page
  ]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const people = useMemo(() => allotmentTilePeople(pageData.items), [pageData.items]);

  function clearFilters() {
    setNameSearch('');
    setHotelId('');
    setRoomType('');
    setRoomKind('');
    setGender('');
    setStatus('');
    setLocation('');
    setStayRange('');
    setPage(0);
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
        title="Who is staying where"
        message="Only Accommodation Volunteer, Accommodation Admin, Event Organizer, or PSSM Admin can open this list."
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
        title="Who is staying where"
        message="Pick an event in the header to see who is allotted to which hotel and room."
      >
        <Link className="uk-button uk-button-default uk-border-rounded" to="/">
          Back to home
        </Link>
      </Gate>
    );
  }

  const emptyUnfiltered = !loading && pageData.total === 0 && !filtersActive;

  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium x-interest-sheet">
          <StayBreadcrumb crumbs={[{ label: 'Stay' }, { label: 'Who is staying where' }]} />

          <header className="x-step-head form-head">
            <h2 className="form-title">Who is staying where</h2>
            <p className="form-summary">
              {picked.name} — Search and left filters run on the server for large guest lists.
            </p>
          </header>

          {error ? (
            <p className="hint" role="alert">
              {error}
            </p>
          ) : null}
          {loading ? <p className="hint">Loading…</p> : null}

          {emptyUnfiltered ? (
            <div className="x-interest-empty">
              <p>No room allotments yet for this event.</p>
              <Link className="uk-button uk-button-default" to="/stay/registrations">
                View Friends and Masters List
              </Link>
            </div>
          ) : null}

          {!loading && !emptyUnfiltered ? (
            <AllotmentsTiles
              people={people}
              stats={pageData.stats}
              facets={pageData.facets}
              total={pageData.total}
              page={pageData.page}
              totalPages={pageData.totalPages}
              onPageChange={setPage}
              refreshing={refreshing}
              filtersActive={filtersActive}
              onClearFilters={clearFilters}
              nameSearch={nameSearch}
              onNameSearchChange={setNameSearch}
              onNameSearchClear={() => setNameSearch('')}
              hotelId={hotelId}
              onHotelIdChange={setHotelId}
              roomType={roomType}
              onRoomTypeChange={setRoomType}
              roomKind={roomKind}
              onRoomKindChange={setRoomKind}
              gender={gender}
              onGenderChange={setGender}
              status={status}
              onStatusChange={setStatus}
              location={location}
              onLocationChange={setLocation}
              stayRange={stayRange}
              onStayRangeChange={setStayRange}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
