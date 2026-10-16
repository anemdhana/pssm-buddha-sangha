import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HotelsList } from '../components/stay/HotelsList.jsx';
import { StayBreadcrumb } from '../components/stay/StayBreadcrumb.jsx';
import { useEventPick } from '../context/EventPickContext.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';

function Gate({ title, message, children }) {
  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column app-narrow">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium x-interest-sheet">
          <StayBreadcrumb crumbs={[{ label: 'Stay' }, { label: 'Hotels & rooms' }]} />
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

export function StayHotelsPage() {
  const { signedIn, isAccommodationAdmin, isPssmAdmin, loading: authLoading } = useAuth();
  const { picked } = useEventPick();
  const canManage = isAccommodationAdmin || isPssmAdmin;

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [active, setActive] = useState('');
  const [reserved, setReserved] = useState('');
  const [roomType, setRoomType] = useState('');
  const [kind, setKind] = useState('');
  const [distance, setDistance] = useState('');

  const filtersActive = Boolean(
    String(nameSearch || '').trim() || active || reserved || roomType || kind || distance
  );

  function clearFilters() {
    setNameSearch('');
    setActive('');
    setReserved('');
    setRoomType('');
    setKind('');
    setDistance('');
  }

  useEffect(() => {
    if (!signedIn || !canManage || !picked.id) {
      setHotels([]);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .listHotels(picked.id)
      .then((res) => {
        if (!cancelled) setHotels(res.data || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setHotels([]);
          setError(err.message || 'Could not load hotels.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, canManage, picked.id]);

  if (authLoading) {
    return (
      <main className="uk-section uk-section-small uk-padding-remove-top">
        <div className="uk-container app-column">
          <p className="hint">Loading…</p>
        </div>
      </main>
    );
  }

  if (!signedIn || !canManage) {
    return (
      <Gate
        title="Hotels & rooms"
        message="Only Accommodation Admin or PSSM Admin can manage hotels and rooms."
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
        title="Hotels & rooms"
        message="Pick an event in the header. Hotels belong to that event only."
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
          <StayBreadcrumb crumbs={[{ label: 'Stay' }, { label: 'Hotels & rooms' }]} />

          <header className="x-step-head form-head x-hotel-list-head">
            <div>
              <h2 className="form-title">Hotels &amp; rooms</h2>
              <p className="form-summary">
                {picked.name} — hotels for this event only. Nearest hotels help allotment first.
              </p>
            </div>
            <Link className="uk-button uk-button-primary uk-button-small" to="/stay/hotels/new">
              <span uk-icon="icon: plus; ratio: 0.8" /> Add hotel
            </Link>
          </header>

          {error ? (
            <p className="hint" role="alert">
              {error}
            </p>
          ) : null}
          {loading ? <p className="hint">Loading…</p> : null}

          {!loading && hotels.length === 0 ? (
            <div className="x-interest-empty">
              <p>No hotels for this event yet. Add the first partner hotel and its rooms.</p>
              <Link className="uk-button uk-button-primary" to="/stay/hotels/new">
                Add hotel
              </Link>
            </div>
          ) : null}

          {!loading && hotels.length > 0 ? (
            <HotelsList
              hotels={hotels}
              filtersActive={filtersActive}
              onClearFilters={clearFilters}
              nameSearch={nameSearch}
              onNameSearchChange={setNameSearch}
              onNameSearchClear={() => setNameSearch('')}
              active={active}
              onActiveChange={setActive}
              reserved={reserved}
              onReservedChange={setReserved}
              roomType={roomType}
              onRoomTypeChange={setRoomType}
              kind={kind}
              onKindChange={setKind}
              distance={distance}
              onDistanceChange={setDistance}
            />
          ) : null}

          {!loading && hotels.length > 0 ? (
            <div className="step-actions">
              <Link className="uk-button uk-button-primary uk-width-1-1" to="/stay/hotels/new">
                Add another hotel
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
