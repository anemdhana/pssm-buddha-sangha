import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';
import { formatEventBudget, formatEventSub } from '../utils/password.js';

const emptyForm = () => ({
  name: '',
  startDate: '',
  endDate: '',
  location: '',
  expectedBudgetInr: '',
  meditationHoursPerDay: ''
});

export function EventsPage() {
  const { isOrganizer } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    const res = await api.listEvents();
    setEvents(res.data || []);
  }

  useEffect(() => {
    load().catch(() => setEvents([]));
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEdit(evt) {
    setEditingId(evt.id);
    setError('');
    setForm({
      name: evt.name || '',
      startDate: evt.startDate || '',
      endDate: evt.endDate || '',
      location: evt.location || '',
      expectedBudgetInr:
        evt.expectedBudgetInr != null && evt.expectedBudgetInr !== ''
          ? String(evt.expectedBudgetInr)
          : '',
      meditationHoursPerDay:
        evt.meditationHoursPerDay != null && evt.meditationHoursPerDay !== ''
          ? String(evt.meditationHoursPerDay)
          : ''
    });
    requestAnimationFrame(() => {
      document.getElementById('event-name')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('event-name')?.focus();
    });
  }

  function cancelEdit() {
    setEditingId('');
    setForm(emptyForm());
    setError('');
  }

  async function onSave(e) {
    e.preventDefault();
    setError('');
    const budget = Number(form.expectedBudgetInr);
    const hoursRaw = String(form.meditationHoursPerDay || '').trim();
    const payload = {
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      location: form.location,
      expectedBudgetInr: budget
    };
    if (hoursRaw !== '') {
      payload.meditationHoursPerDay = Number(hoursRaw);
    }
    const wasEditing = Boolean(editingId);
    try {
      if (editingId) {
        await api.updateEvent(editingId, payload);
      } else {
        await api.createEvent(payload);
      }
      cancelEdit();
      await load();
      if (window.UIkit) {
        window.UIkit.notification({
          message: wasEditing ? 'Event updated.' : 'Event saved.',
          status: 'success',
          pos: 'top-center',
          timeout: 2000
        });
      }
    } catch (err) {
      setError(err.message || 'Could not save event.');
    }
  }

  const isEditing = Boolean(editingId);

  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column app-narrow">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium">
          <header className="x-step-head form-head">
            <h2 className="form-title">{isEditing ? 'Edit event' : 'Create event'}</h2>
            <p className="form-summary">
              Name, dates, location, and budget — Free and Paid Stay use the event selected in the header.
            </p>
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
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="Dhyana Maha Yagam - 5"
                      required
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
                      value={form.startDate}
                      onChange={(e) => update('startDate', e.target.value)}
                      required
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
                      value={form.endDate}
                      onChange={(e) => update('endDate', e.target.value)}
                      required
                    />
                  </div>
                  <div className="x-field uk-width-1-1">
                    <label className="x-label" htmlFor="event-location">
                      Location
                    </label>
                    <input
                      className="uk-input uk-form-small"
                      id="event-location"
                      value={form.location}
                      onChange={(e) => update('location', e.target.value)}
                      placeholder="Santh Kabir Das Pyramid Centre, Hyderabad"
                      required
                    />
                  </div>
                  <div className="x-field">
                    <label className="x-label" htmlFor="event-budget">
                      Expected budget (INR)
                    </label>
                    <input
                      className="uk-input uk-form-small"
                      id="event-budget"
                      inputMode="decimal"
                      value={form.expectedBudgetInr}
                      onChange={(e) => update('expectedBudgetInr', e.target.value.replace(/[^\d.]/g, ''))}
                      placeholder="500000"
                      required
                    />
                  </div>
                  <div className="x-field">
                    <label className="x-label" htmlFor="event-hours">
                      Meditation hours / day
                    </label>
                    <input
                      className="uk-input uk-form-small"
                      id="event-hours"
                      inputMode="decimal"
                      value={form.meditationHoursPerDay}
                      onChange={(e) => update('meditationHoursPerDay', e.target.value.replace(/[^\d.]/g, ''))}
                      placeholder="Optional, e.g. 3"
                    />
                  </div>
                </div>
                <p className="hint uk-margin-small-top uk-margin-remove-bottom">
                  Free and Paid Stay use the event selected in the header.
                </p>
                {error && (
                  <p className="hint" role="alert">
                    {error}
                  </p>
                )}
              </section>
              <div className="step-actions" style={{ display: 'flex', gap: 8 }}>
                {isEditing ? (
                  <button className="uk-button uk-button-default uk-width-1-2" type="button" onClick={cancelEdit}>
                    Cancel
                  </button>
                ) : null}
                <button
                  className={`uk-button uk-button-primary ${isEditing ? 'uk-width-1-2' : 'uk-width-1-1'}`}
                  type="submit"
                >
                  {isEditing ? 'Update event' : 'Save event'}
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
                <div className={`x-summary-row${editingId === evt.id ? ' is-editing' : ''}`} key={evt.id}>
                  <span>
                    {evt.name}
                    {evt.location ? (
                      <>
                        <br />
                        <span className="hint uk-margin-remove">{evt.location}</span>
                      </>
                    ) : null}
                    <br />
                    <span className="hint uk-margin-remove">
                      {[formatEventSub(evt), formatEventBudget(evt)].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  {isOrganizer ? (
                    <button
                      className="uk-button uk-button-text uk-button-small"
                      type="button"
                      onClick={() => startEdit(evt)}
                    >
                      Edit
                    </button>
                  ) : (
                    <strong>{formatEventSub(evt)}</strong>
                  )}
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
