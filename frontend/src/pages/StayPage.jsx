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
  const fromInterest = params.get('from') === 'interest';
  const { signedIn, hasRole, loading } = useAuth();
  const { picked } = useEventPick();
  const isAccommodationVolunteer = hasRole('accommodation_volunteer');

  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState(MODE_SELF);

  useEffect(() => {
    if (fromInterest) {
      setMode(MODE_GUEST);
    }
  }, [fromInterest]);

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
          meditation: res.data.meditation || 'new',
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

  // From the interest list: always book a new visitor (someone else).
  const bookingMode = fromInterest
    ? MODE_GUEST
    : isAccommodationVolunteer
      ? mode
      : MODE_SELF;
  const hasProfile = Boolean(profile && String(profile.fullName || '').trim());
  const forSelf = bookingMode === MODE_SELF;
  const event = {
    id: picked.id,
    name: picked.name,
    startDate: picked.startDate,
    endDate: picked.endDate,
    sub: picked.sub
  };

  const planCrumb = plan === 'paid' ? 'Paid Accommodation' : 'Free Accommodation';
  const crumbs = fromInterest
    ? [
        { label: 'Stay' },
        { label: 'Friends and Masters List', to: '/stay/registrations' },
        { label: 'Register family' }
      ]
    : [{ label: 'Stay' }, { label: planCrumb }];

  return (
    <StayWizard
      key={`${plan}-${picked.id}-${bookingMode}-${fromInterest ? 'interest' : 'direct'}`}
      plan={plan}
      event={event}
      bookingMode={bookingMode}
      initialForm={forSelf ? profile : null}
      skipToDays={forSelf && hasProfile}
      cancelTo={fromInterest ? '/stay/registrations' : null}
      crumbs={crumbs}
      showBookingModePicker={isAccommodationVolunteer && !fromInterest}
      onBookingModeChange={setMode}
    />
  );
}
