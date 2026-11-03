import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useEventPick } from '../context/EventPickContext.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';
import { formatEventSub } from '../utils/password.js';

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function afterThreePm() {
  return new Date().getHours() >= 15;
}

function notify(message, status = 'success') {
  if (window.UIkit) {
    window.UIkit.notification({ message, status, pos: 'top-center', timeout: 2200 });
  }
}

const STATE_CHIPS = [
  { id: 'allotted', label: 'Allotted' },
  { id: 'checked_in', label: 'Checked-in' },
  { id: 'checked_out', label: 'Checked-out' },
  { id: 'did_not_arrive', label: 'Did not arrive' }
];

export function HotelDeskPage() {
  const { signedIn, hasRole, loading: authLoading, logout, user } = useAuth();
  const isHotelDesk = hasRole('hotel_desk');
  const { picked, setPicked } = useEventPick();

  const [desk, setDesk] = useState(null);
  const [date, setDate] = useState(todayIso);
  const [statusFilter, setStatusFilter] = useState('');
  const [checkingOutOnly, setCheckingOutOnly] = useState(false);
  const [roomQuery, setRoomQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const eventBounds = useMemo(
    () => ({
      min: String(picked.startDate || '').trim(),
      max: String(picked.endDate || '').trim()
    }),
    [picked.startDate, picked.endDate]
  );

  useEffect(() => {
    if (!signedIn || !isHotelDesk) return undefined;
    let cancelled = false;
    api
      .receptionMe()
      .then(async (res) => {
        if (cancelled) return;
        const ctx = res.data || {};
        setDesk(ctx);
        if (ctx.eventId) {
          try {
            const eventsRes = await api.listEvents();
            const list = eventsRes.data || [];
            const evt = list.find((e) => e.id === ctx.eventId);
            if (evt) {
              setPicked({
                id: evt.id,
                name: evt.name,
                sub: formatEventSub(evt),
                startDate: evt.startDate || '',
                endDate: evt.endDate || ''
              });
            }
          } catch {
            /* keep current pick */
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load hotel desk.');
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, isHotelDesk, setPicked]);

  const loadGuests = useCallback(async () => {
    if (!signedIn || !isHotelDesk) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.receptionGuests({
        date,
        status: statusFilter || undefined,
        checkingOutOnDate: checkingOutOnly || undefined,
        roomNumber: roomQuery.trim() || undefined,
        q: nameQuery.trim() || undefined
      });
      setGuests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setGuests([]);
      setError(err.message || 'Could not load guests.');
    } finally {
      setLoading(false);
    }
  }, [signedIn, isHotelDesk, date, statusFilter, checkingOutOnly, roomQuery, nameQuery]);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  async function runAction(personId, kind) {
    if (!personId || busyId) return;
    setBusyId(personId);
    setError('');
    try {
      if (kind === 'check_in') await api.receptionCheckIn({ personId });
      else if (kind === 'check_out') await api.receptionCheckOut({ personId });
      else if (kind === 'did_not_arrive') await api.receptionDidNotArrive({ personId });
      notify(
        kind === 'check_in'
          ? 'Marked checked-in.'
          : kind === 'check_out'
            ? 'Marked checked-out.'
            : 'Marked did not arrive.'
      );
      await loadGuests();
    } catch (err) {
      setError(err.message || 'Could not update status.');
      notify(err.message || 'Update failed.', 'danger');
    } finally {
      setBusyId('');
    }
  }

  async function onLogout(e) {
    e.preventDefault();
    await logout();
  }

  if (authLoading) {
    return (
      <main className="uk-section uk-section-small">
        <div className="uk-container app-column">
          <p className="hint">Loading…</p>
        </div>
      </main>
    );
  }

  if (!signedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isHotelDesk) {
    return (
      <main className="uk-section uk-section-small">
        <div className="uk-container app-column app-narrow">
          <div className="uk-card uk-card-default uk-card-body">
            <h2 className="form-title">Hotel Desk</h2>
            <p className="form-summary">This page is for Hotel Desk logins only.</p>
            <Link className="uk-button uk-button-default" to="/">
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const hotelName = desk?.hotelName || user?.hotelName || 'Your hotel';
  const canMarkDidNotArrive = afterThreePm();

  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium x-hotel-desk">
          <header className="x-step-head form-head">
            <h2 className="form-title">{hotelName}</h2>
            <p className="form-summary">
              Hotel Desk — verify by room and name, then mark check-in / check-out. Expected check-in{' '}
              <strong>11:00 AM</strong>; second chance until <strong>~3:00 PM</strong>, then mark Did not
              arrive. Remind guests checking out on the selected date (11:00 AM).
            </p>
            <p className="uk-text-meta uk-margin-remove">
              Room keys stay at reception.{' '}
              <a href="#logout" onClick={onLogout}>
                Logout
              </a>
            </p>
          </header>

          <div className="x-hotel-desk-filters uk-margin">
            <div className="uk-grid-small uk-child-width-1-1 uk-child-width-auto@s" uk-grid="">
              <div className="x-field">
                <label className="x-label" htmlFor="desk-date">
                  Date
                </label>
                <input
                  className="uk-input uk-form-small"
                  id="desk-date"
                  type="date"
                  value={date}
                  min={eventBounds.min || undefined}
                  max={eventBounds.max || undefined}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="x-field">
                <label className="x-label" htmlFor="desk-room">
                  Room
                </label>
                <input
                  className="uk-input uk-form-small"
                  id="desk-room"
                  value={roomQuery}
                  onChange={(e) => setRoomQuery(e.target.value)}
                  placeholder="Room number"
                />
              </div>
              <div className="x-field">
                <label className="x-label" htmlFor="desk-name">
                  Name
                </label>
                <input
                  className="uk-input uk-form-small"
                  id="desk-name"
                  value={nameQuery}
                  onChange={(e) => setNameQuery(e.target.value)}
                  placeholder="Guest name"
                />
              </div>
            </div>

            <div className="x-hotel-desk-chips uk-margin-small-top" role="group" aria-label="State filter">
              <button
                type="button"
                className={`uk-button uk-button-small ${!statusFilter ? 'uk-button-primary' : 'uk-button-default'}`}
                onClick={() => setStatusFilter('')}
              >
                All states
              </button>
              {STATE_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  className={`uk-button uk-button-small ${statusFilter === chip.id ? 'uk-button-primary' : 'uk-button-default'}`}
                  onClick={() => setStatusFilter(chip.id)}
                >
                  {chip.label}
                </button>
              ))}
              <button
                type="button"
                className={`uk-button uk-button-small ${checkingOutOnly ? 'uk-button-primary' : 'uk-button-default'}`}
                onClick={() => setCheckingOutOnly((v) => !v)}
              >
                Checking out on this date
              </button>
            </div>
          </div>

          {error ? <p className="uk-text-danger uk-margin-small">{error}</p> : null}

          {loading ? (
            <p className="hint">Loading guests…</p>
          ) : guests.length === 0 ? (
            <p className="uk-text-meta">No guests match this date and filters.</p>
          ) : (
            <ul className="uk-list uk-list-divider x-hotel-desk-list">
              {guests.map((guest) => {
                const status = guest.personStatus || 'allotted';
                const personId = guest.personId;
                const busy = busyId === personId;
                return (
                  <li key={personId} className="x-hotel-desk-row">
                    <div className="x-hotel-desk-row-main">
                      <div>
                        <strong>{guest.name}</strong>
                        {guest.checkingOutOnDate ? (
                          <span className="x-hotel-desk-tag"> Checking out on this date</span>
                        ) : null}
                        <p className="uk-text-meta uk-margin-remove">
                          Room {guest.roomNumber || '—'} · In {guest.checkInDate} 11:00 · Out{' '}
                          {guest.checkOutDate} 11:00
                        </p>
                      </div>
                    </div>
                    <div className="x-hotel-desk-checks" role="group" aria-label={`Status for ${guest.name}`}>
                      <label className="x-hotel-desk-check is-readonly">
                        <input type="checkbox" checked={status === 'allotted'} readOnly disabled />
                        <span>Allotted</span>
                      </label>
                      <label className="x-hotel-desk-check">
                        <input
                          type="checkbox"
                          className="x-hotel-desk-checkbox"
                          checked={status === 'checked_in' || status === 'checked_out'}
                          disabled={busy || status !== 'allotted'}
                          onChange={() => {
                            if (status === 'allotted') runAction(personId, 'check_in');
                          }}
                        />
                        <span>Checked-in now</span>
                      </label>
                      <label className="x-hotel-desk-check">
                        <input
                          type="checkbox"
                          className="x-hotel-desk-checkbox"
                          checked={status === 'checked_out'}
                          disabled={busy || status !== 'checked_in'}
                          onChange={() => {
                            if (status === 'checked_in') runAction(personId, 'check_out');
                          }}
                        />
                        <span>Checked-out now</span>
                      </label>
                      <label
                        className={`x-hotel-desk-check${!canMarkDidNotArrive && status === 'allotted' ? ' is-muted' : ''}`}
                      >
                        <input
                          type="checkbox"
                          className="x-hotel-desk-checkbox"
                          checked={status === 'did_not_arrive'}
                          disabled={
                            busy ||
                            status !== 'allotted' ||
                            !canMarkDidNotArrive ||
                            guest.checkInDate !== date
                          }
                          onChange={() => {
                            if (status === 'allotted') runAction(personId, 'did_not_arrive');
                          }}
                        />
                        <span>Did not arrive</span>
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
