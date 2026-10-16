import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useEventPick } from '../context/EventPickContext.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';
import { bookingToProfileForm } from '../utils/stayRegistrations.js';
import { StayWizard } from './stay/StayWizard.jsx';

const STEP_BY_ID = {
  who: 0,
  place: 1,
  family: 2,
  days: 3,
  review: 4
};

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

export function StayEditPage() {
  const { bookingId } = useParams();
  const [params] = useSearchParams();
  const plan = params.get('plan') === 'paid' ? 'paid' : 'free';
  const stepParam = String(params.get('step') || '').trim().toLowerCase();
  const memberParam = Number(params.get('member'));
  const initialStep = Object.prototype.hasOwnProperty.call(STEP_BY_ID, stepParam)
    ? STEP_BY_ID[stepParam]
    : null;
  const initialOpenMember =
    Number.isFinite(memberParam) && memberParam >= 0 ? memberParam : 0;

  const { signedIn, hasRole, loading: authLoading } = useAuth();
  const { picked } = useEventPick();
  const canEdit =
    hasRole('accommodation_volunteer') || hasRole('pssm_admin') || hasRole('event_organizer');

  const [initialForm, setInitialForm] = useState(null);
  const [bookingPlan, setBookingPlan] = useState(plan);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!signedIn || !canEdit || !bookingId) {
      setInitialForm(null);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    api
      .getStayBooking(bookingId)
      .then((res) => {
        if (cancelled) return;
        const booking = res.data?.booking || res.data;
        if (!booking) {
          setLoadError('Registration not found.');
          return;
        }
        setBookingPlan(booking.plan === 'paid' ? 'paid' : plan);
        setInitialForm(bookingToProfileForm(booking));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Could not load registration.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, canEdit, bookingId, plan]);

  if (authLoading || loading) {
    return (
      <main className="uk-section uk-section-small uk-padding-remove-top">
        <div className="uk-container app-column">
          <p className="hint">Loading…</p>
        </div>
      </main>
    );
  }

  if (!signedIn || !canEdit) {
    return (
      <Gate title="Edit registration" message="Only Accommodation Volunteer, Event Organizer, or PSSM Admin can edit.">
        <Link className="uk-button uk-button-default" to="/">
          Back to home
        </Link>
      </Gate>
    );
  }

  if (loadError || !initialForm) {
    return (
      <Gate title="Edit registration" message={loadError || 'Registration not found.'}>
        <Link className="uk-button uk-button-default" to="/stay/registrations">
          Back to list
        </Link>
      </Gate>
    );
  }

  const event = {
    id: picked.id || '',
    name: picked.name,
    startDate: picked.startDate,
    endDate: picked.endDate,
    sub: picked.sub
  };

  return (
    <StayWizard
      key={`${bookingId}:${stepParam}:${initialOpenMember}`}
      plan={bookingPlan}
      event={event}
      bookingMode="guest"
      initialForm={initialForm}
      skipToDays={false}
      initialStep={initialStep}
      initialOpenMember={initialOpenMember}
      bookingId={bookingId}
      updateSanghaProfile
      cancelTo="/stay/registrations"
      crumbs={[
        { label: 'Stay' },
        { label: 'Friends and Masters List', to: '/stay/registrations' },
        { label: 'Edit' }
      ]}
    />
  );
}
