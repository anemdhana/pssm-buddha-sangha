import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RegistrationStatsBar } from '../components/stay/RegistrationStatsBar.jsx';
import { RegistrationsTable } from '../components/stay/RegistrationsTable.jsx';
import { useEventPick } from '../context/EventPickContext.jsx';
import { useEventRegistrations } from '../hooks/useEventRegistrations.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { filterRegistrationsByMobile, registrationStats } from '../utils/stayRegistrations.js';

function Gate({ title, message, children }) {
  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column app-narrow">
        <div className="uk-card uk-card-default uk-card-small uk-card-body">
          <h2 className="form-title">{title}</h2>
          <p className="form-summary">{message}</p>
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

  const { rows, loading, error } = useEventRegistrations(picked.id, signedIn && canView && Boolean(picked.id));
  const [mobileSearch, setMobileSearch] = useState('');

  const stats = useMemo(() => registrationStats(rows), [rows]);
  const filtered = useMemo(
    () => filterRegistrationsByMobile(rows, mobileSearch),
    [rows, mobileSearch]
  );
  const searchActive = Boolean(String(mobileSearch || '').replace(/\D/g, ''));

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
        title="Event registrations"
        message="Only Accommodation Volunteer, Event Organizer, or PSSM Admin can open this list."
      >
        <Link className="uk-button uk-button-default" to="/">
          Back to home
        </Link>
      </Gate>
    );
  }

  if (!picked.id) {
    return (
      <Gate title="Event registrations" message="Pick an event in the header to see who registered interest.">
        <Link className="uk-button uk-button-default" to="/">
          Back to home
        </Link>
      </Gate>
    );
  }

  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column">
        <header className="form-head">
          <h2 className="form-title">Stay interest</h2>
          <p className="form-summary">{picked.name} — stay interest only; room allocation later.</p>
          <RegistrationStatsBar stats={stats} filteredFamilies={filtered.length} searchActive={searchActive} />
        </header>

        {error ? (
          <p className="hint" role="alert">
            {error}
          </p>
        ) : null}
        {loading ? <p className="hint">Loading…</p> : null}

        {!loading && rows.length === 0 ? <p className="hint">No registrations yet for this event.</p> : null}

        {!loading && rows.length > 0 ? (
          <RegistrationsTable
            rows={filtered}
            mobileSearch={mobileSearch}
            onMobileSearchChange={setMobileSearch}
            onMobileSearchClear={() => setMobileSearch('')}
          />
        ) : null}

        <div className="uk-margin-top uk-grid-small" uk-grid="">
          <div>
            <Link className="uk-button uk-button-primary" to="/stay?plan=free">
              Register another family
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
