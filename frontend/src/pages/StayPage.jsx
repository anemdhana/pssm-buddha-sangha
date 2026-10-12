import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useEventPick } from '../context/EventPickContext.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';
import { emptyProfile } from '../utils/password.js';
import { StayWizard } from './stay/StayWizard.jsx';

const MODE_SELF = 'self';
const MODE_GUEST = 'guest';

function Shell({ children }) {
  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column app-narrow">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium">{children}</div>
      </div>
    </main>
  );
}

function Notice({ title, message, children }) {
  return (
    <Shell>
      <header className="x-step-head form-head">
        <h2 className="form-title">{title}</h2>
        <p className="form-summary">{message}</p>
      </header>
      {children}
    </Shell>
  );
}

export function StayPage() {
  const [params] = useSearchParams();
  const plan = params.get('plan') === 'paid' ? 'paid' : 'free';
  const { signedIn, hasRole, loading } = useAuth();
  const { picked } = useEventPick();
  const isAccommodationVolunteer = hasRole('accommodation_volunteer');
  const canViewRegistrations =
    isAccommodationVolunteer || hasRole('pssm_admin') || hasRole('event_organizer');

  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState(MODE_SELF);

  useEffect(() => {
    if (!signedIn) {
      setProfile(null);
      setProfileLoaded(false);
      return undefined;
    }
    let cancelled = false;
    api
      .getMyProfile()
      .then((res) => {
        if (cancelled) return;
        setProfile({
          ...emptyProfile(),
          ...res.data,
          place: { ...emptyProfile().place, ...(res.data.place || {}) },
          members: Array.isArray(res.data.members) ? res.data.members : []
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load your profile.');
      })
      .finally(() => {
        if (!cancelled) setProfileLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  useEffect(() => {
    if (window.UIkit) window.UIkit.update(document.body);
  }, [mode, profileLoaded, isAccommodationVolunteer]);

  if (loading) {
    return (
      <Shell>
        <p className="hint">Loading…</p>
      </Shell>
    );
  }

  if (!signedIn) {
    return (
      <Notice title="Login to book a stay" message="Sign in with your mobile number to book accommodation.">
        <div className="step-actions">
          <Link className="uk-button uk-button-primary uk-width-1-1" to="/login">
            Login to My Space
          </Link>
        </div>
      </Notice>
    );
  }

  if (!picked.id) {
    return (
      <Notice
        title="Select an event first"
        message="Choose an event from the header picker to book accommodation. The general sangha home has no stay."
      >
        <p className="hint">Use the event name in the header to pick a demo or saved event, then open Stay again.</p>
        <div className="step-actions">
          <Link className="uk-button uk-button-default uk-width-1-1" to="/">
            Back to home
          </Link>
        </div>
      </Notice>
    );
  }

  if (!profileLoaded) {
    return (
      <Shell>
        <p className="hint">Loading your profile…</p>
      </Shell>
    );
  }

  if (error && !profile) {
    return (
      <Shell>
        <p className="hint" role="alert">
          {error}
        </p>
      </Shell>
    );
  }

  const bookingMode = isAccommodationVolunteer ? mode : MODE_SELF;
  const hasProfile = Boolean(profile && String(profile.fullName || '').trim());
  const forSelf = bookingMode === MODE_SELF;
  const event = {
    id: picked.id,
    name: picked.name,
    startDate: picked.startDate,
    endDate: picked.endDate,
    sub: picked.sub
  };

  return (
    <>
      {canViewRegistrations ? (
        <div className="uk-container app-column">
          <p className="uk-text-meta uk-margin-small-bottom">
            <Link to="/stay/registrations">View stay interest for {picked.name}</Link>
          </p>
        </div>
      ) : null}
      {isAccommodationVolunteer ? (
        <div className="uk-container app-column">
          <div className="x-role-chips uk-margin-small-bottom" role="group" aria-label="Book accommodation for">
            <button
              type="button"
              className={`x-role-chip${forSelf ? ' is-active' : ''}`}
              aria-pressed={forSelf}
              onClick={() => setMode(MODE_SELF)}
            >
              Myself
            </button>
            <button
              type="button"
              className={`x-role-chip${!forSelf ? ' is-active' : ''}`}
              aria-pressed={!forSelf}
              onClick={() => setMode(MODE_GUEST)}
            >
              New visitor
            </button>
          </div>
        </div>
      ) : null}
      <StayWizard
        key={`${plan}-${picked.id}-${bookingMode}`}
        plan={plan}
        event={event}
        bookingMode={bookingMode}
        initialForm={forSelf ? profile : null}
        skipToDays={forSelf && hasProfile}
      />
    </>
  );
}
