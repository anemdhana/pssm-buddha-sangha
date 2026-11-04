import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useEventPick } from '../context/EventPickContext.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';
import { formatEventDate, formatEventSub } from '../utils/password.js';

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

function stayNightCount(start, end) {
  const a = Date.parse(String(start || '').trim());
  const b = Date.parse(String(end || '').trim());
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.round((b - a) / 86400000);
}

function notify(message, status = 'success') {
  if (window.UIkit) {
    window.UIkit.notification({ message, status, pos: 'top-center', timeout: 2200 });
  }
}

const STATUS_VIEW = {
  allotted: { label: 'Waiting', tone: 'waiting', doneLine: '' },
  checked_in: { label: 'In hotel', tone: 'in', doneLine: '' },
  checked_out: { label: 'Left', tone: 'out', doneLine: 'Checkout done' },
  did_not_arrive: { label: 'No show', tone: 'missed', doneLine: 'Marked as no show' }
};

const STATE_CHIPS = [
  { id: 'allotted', label: 'Waiting' },
  { id: 'checked_in', label: 'In hotel' },
  { id: 'checked_out', label: 'Left' },
  { id: 'did_not_arrive', label: 'No show' }
];

function GuestRow({ guest, date, canMarkDidNotArrive, busy, onAction }) {
  const status = guest.personStatus || 'allotted';
  const view = STATUS_VIEW[status] || STATUS_VIEW.allotted;
  const nights = stayNightCount(guest.checkInDate, guest.checkOutDate);
  const inLabel = formatEventDate(guest.checkInDate) || guest.checkInDate || '—';
  const outLabel = formatEventDate(guest.checkOutDate) || guest.checkOutDate || '—';
  const canCheckIn = status === 'allotted';
  const canCheckOut = status === 'checked_in';
  const canNoShow =
    status === 'allotted' && canMarkDidNotArrive && guest.checkInDate === date;

  return (
    <li className={`x-hotel-desk-guest is-${view.tone}${guest.checkingOutOnDate ? ' is-leaving' : ''}`}>
      <div className="x-hotel-desk-guest-left">
        <div className="x-hotel-desk-room-block" aria-label={`Room ${guest.roomNumber || '—'}`}>
          <span className="x-hotel-desk-room-label">Room</span>
          <span className="x-hotel-desk-room-num">{guest.roomNumber || '—'}</span>
        </div>
        <div className="x-hotel-desk-guest-copy">
          <div className="x-hotel-desk-guest-topline">
            <strong className="x-hotel-desk-guest-name">{guest.name}</strong>
            <span className={`x-hotel-desk-status is-${view.tone}`}>{view.label}</span>
          </div>
          <p className="x-hotel-desk-stay-line">
            Stay <strong>{inLabel}</strong>
            <span className="x-hotel-desk-stay-arrow" aria-hidden="true">
              →
            </span>
            <strong>{outLabel}</strong>
            {nights > 0 ? (
              <span className="x-hotel-desk-nights">
                {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
            ) : null}
          </p>
          {guest.checkingOutOnDate ? (
            <p className="x-hotel-desk-leaving-note">Leaving today — remind by 11:00 AM</p>
          ) : null}
        </div>
      </div>

      <div className="x-hotel-desk-guest-actions">
        {canCheckIn ? (
          <button
            type="button"
            className="x-hotel-desk-action is-arrive"
            disabled={busy}
            onClick={() => onAction('check_in')}
          >
            Guest arrived
          </button>
        ) : null}
        {canCheckOut ? (
          <button
            type="button"
            className="x-hotel-desk-action is-leave"
            disabled={busy}
            onClick={() => onAction('check_out')}
          >
            Guest left
          </button>
        ) : null}
        {canNoShow ? (
          <button
            type="button"
            className="x-hotel-desk-action is-noshow"
            disabled={busy}
            onClick={() => onAction('did_not_arrive')}
          >
            Did not come
          </button>
        ) : null}
        {!canCheckIn && !canCheckOut ? (
          <span className="x-hotel-desk-done">{view.doneLine || view.label}</span>
        ) : null}
      </div>
    </li>
  );
}

export function HotelDeskPage() {
  const { signedIn, hasRole, loading: authLoading, logout, user } = useAuth();
  const isHotelDesk = hasRole('hotel_desk');
  const navigate = useNavigate();
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
          ? 'Guest arrived — marked in hotel.'
          : kind === 'check_out'
            ? 'Guest left — checkout done.'
            : 'Marked as no show.'
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
    navigate('/login');
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
            <div className="x-hotel-desk-head-row">
              <h2 className="form-title uk-margin-remove">{hotelName}</h2>
              <button
                type="button"
                className="uk-button uk-button-default uk-button-small x-hotel-desk-logout"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
            <p className="form-summary">
              Find the guest by <strong>room</strong> or <strong>name</strong>. When they come, press{' '}
              <strong>Guest arrived</strong>. When they go, press <strong>Guest left</strong>. After 3:00
              PM, if they still did not come, press <strong>Did not come</strong>.
            </p>
            <p className="uk-text-meta uk-margin-remove">Keep room keys at the desk.</p>
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
                  Find room
                </label>
                <input
                  className="uk-input uk-form-small"
                  id="desk-room"
                  value={roomQuery}
                  onChange={(e) => setRoomQuery(e.target.value)}
                  placeholder="Type room number"
                />
              </div>
              <div className="x-field">
                <label className="x-label" htmlFor="desk-name">
                  Find name
                </label>
                <input
                  className="uk-input uk-form-small"
                  id="desk-name"
                  value={nameQuery}
                  onChange={(e) => setNameQuery(e.target.value)}
                  placeholder="Type guest name"
                />
              </div>
            </div>

            <div className="x-hotel-desk-chips uk-margin-small-top" role="group" aria-label="Show">
              <button
                type="button"
                className={`uk-button uk-button-small ${!statusFilter ? 'uk-button-primary' : 'uk-button-default'}`}
                onClick={() => setStatusFilter('')}
              >
                All guests
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
                Leaving today
              </button>
            </div>
          </div>

          {error ? <p className="uk-text-danger uk-margin-small">{error}</p> : null}

          {loading ? (
            <p className="hint">Loading guests…</p>
          ) : guests.length === 0 ? (
            <p className="uk-text-meta">No guests for this date and filter.</p>
          ) : (
            <ul className="uk-list uk-list-divider x-hotel-desk-list">
              {guests.map((guest) => (
                <GuestRow
                  key={guest.personId}
                  guest={guest}
                  date={date}
                  canMarkDidNotArrive={canMarkDidNotArrive}
                  busy={busyId === guest.personId}
                  onAction={(kind) => runAction(guest.personId, kind)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
