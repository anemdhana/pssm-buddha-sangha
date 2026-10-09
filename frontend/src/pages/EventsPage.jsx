import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';
import { formatEventSub } from '../utils/password.js';

export function EventsPage() {
  const { isOrganizer } = useAuth();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    const res = await api.listEvents();
    setEvents(res.data || []);
  }

  useEffect(() => {
    load().catch(() => setEvents([]));
  }, []);

  async function onSave(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createEvent({ name, startDate, endDate });
      setName('');
      setStartDate('');
      setEndDate('');
      await load();
      if (window.UIkit) {
        window.UIkit.notification({ message: 'Event saved.', status: 'success', pos: 'top-center', timeout: 2000 });
      }
    } catch (err) {
      setError(err.message || 'Could not save event.');
    }
  }

  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column app-narrow">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium">
          <header className="x-step-head form-head">
            <h2 className="form-title">Create event</h2>
            <p className="form-summary">Name the gathering and its dates — Stay can use this event for accommodation later.</p>
          </header>
          {!isOrganizer && (
            <p className="hint">
              Event Organizer role is required. Ask PSSM Admin to assign it under People &amp; roles.
            </p>
          )}
          {isOrganizer && (
            <form className="uk-form-stacked" onSubmit={onSave}>
              <section className="x-group">
                <h3 className="x-group-title">
                  <span uk-icon="icon: calendar; ratio: 0.75" /> Event details
                </h3>
                <div className="uk-grid-small uk-child-width-1-1 uk-child-width-1-2@s" uk-grid="">
                  <div className="x-field uk-width-1-1">
                    <label className="x-label" htmlFor="event-name">
                      Event name
                    </label>
                    <input
                      className="uk-input uk-form-small"
                      id="event-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dhyana Maha Yagam - 5"
                    />
                  </div>
                  <div className="x-field">
                    <label className="x-label" htmlFor="event-start">
                      Start date
                    </label>
                    <input
                      className="uk-input uk-form-small"
                      id="event-start"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="x-field">
                    <label className="x-label" htmlFor="event-end">
                      End date
                    </label>
                    <input
                      className="uk-input uk-form-small"
                      id="event-end"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                {error && (
                  <p className="hint" role="alert">
                    {error}
                  </p>
                )}
              </section>
              <div className="step-actions">
                <button className="uk-button uk-button-primary uk-width-1-1" type="submit">
                  Save event
                </button>
              </div>
            </form>
          )}
          <section className="x-group uk-margin-top">
            <h3 className="x-group-title">
              <span uk-icon="icon: list; ratio: 0.75" /> Your events
            </h3>
            <div className="x-event-list">
              {events.map((evt) => (
                <div className="x-summary-row" key={evt.id}>
                  <span>{evt.name}</span>
                  <strong>{formatEventSub(evt)}</strong>
                </div>
              ))}
            </div>
            {events.length === 0 && <p className="hint uk-margin-remove">No events yet. Create the first one above.</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
