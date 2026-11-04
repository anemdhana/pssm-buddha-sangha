import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEventPick } from '../context/EventPickContext.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';
import { buildHomeStaySummary } from '../utils/homeStaySummary.js';

function HomeTile({ to, icon, title, meta }) {
  return (
    <Link className="home-tile" to={to}>
      <span className="home-tile-icon" uk-icon={`icon: ${icon}; ratio: 1.05`} aria-hidden="true" />
      <span className="home-tile-copy">
        <span className="home-tile-title">{title}</span>
        <span className="home-tile-meta">{meta}</span>
      </span>
      <span className="home-tile-chevron" uk-icon="icon: chevron-right; ratio: 0.9" aria-hidden="true" />
    </Link>
  );
}

function StaySummaryPanel({ picked }) {
  const [mine, setMine] = useState(null);
  const [loading, setLoading] = useState(Boolean(picked?.id));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!picked?.id) {
      setMine(null);
      setLoading(false);
      setError('');
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .getMyStayBooking(picked.id)
      .then((res) => {
        if (cancelled) return;
        setMine(res.data || null);
      })
      .catch((err) => {
        if (cancelled) return;
        setMine(null);
        setError(err.message || 'Could not load your stay summary.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [picked?.id]);

  const view = buildHomeStaySummary({ picked, mine, loading, error });

  return (
    <section className={`home-stay is-${view.status}`} aria-labelledby="home-stay-title">
      <div className="home-stay-top">
        <div className="home-stay-heading">
          <p className="home-kicker">Selected event</p>
          <h2 className="home-stay-title" id="home-stay-title">
            {view.eventTitle || view.title}
          </h2>
          {view.eventDates ? <p className="home-stay-dates">{view.eventDates}</p> : null}
        </div>
        <span className={`home-status home-status-${view.status}`}>{view.statusLabel}</span>
      </div>

      <p className="home-stay-summary">{view.summary}</p>

      {view.highlight ? (
        <div className="home-highlight" aria-label={view.highlight.label}>
          <span className="home-highlight-label">{view.highlight.label}</span>
          <strong className="home-highlight-value">{view.highlight.value}</strong>
        </div>
      ) : null}

      {view.rows.length ? (
        <dl className="home-facts">
          {view.rows.map((row) => (
            <div className="home-fact" key={`${row.label}:${row.value}`}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {view.cta ? (
        <Link className="uk-button uk-button-primary uk-width-1-1 home-stay-cta" to={view.cta.to}>
          {view.cta.label}
        </Link>
      ) : null}
    </section>
  );
}

export function HomePage() {
  const { signedIn, isPssmAdmin, user } = useAuth();
  const { picked } = useEventPick();
  const firstName = String(user?.name || '')
    .trim()
    .split(/\s+/)[0];

  return (
    <main className="home-page uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column home-page-inner">
        <header className="home-hero">
          <p className="home-kicker">{signedIn ? 'My Space' : 'Welcome'}</p>
          <h1 className="home-brand">PSSM Buddha Sangha</h1>
          <p className="home-lead">
            {signedIn
              ? firstName
                ? `Namaste, ${firstName}. See your stay for the selected event, then open profile or record who is coming.`
                : 'See your stay for the selected event, then open profile or record who is coming.'
              : 'A club of Buddhas. Join with your details and family, or login to My Space with your mobile and password.'}
          </p>
        </header>

        {signedIn ? <StaySummaryPanel picked={picked} /> : null}

        <section className="home-actions" aria-label={signedIn ? 'Shortcuts' : 'Get started'}>
          <div className="home-section-head">
            <h2 className="home-section-title">{signedIn ? 'Shortcuts' : 'Get started'}</h2>
            {signedIn ? (
              <p className="home-section-note">Profile and stay interest. Hotel and room come after allotment.</p>
            ) : null}
          </div>
          <div className="home-tile-list">
            {!signedIn ? (
              <>
                <HomeTile to="/join" icon="users" title="Join PSSM Buddha Sangha" meta="You and family with you" />
                <HomeTile to="/login" icon="sign-in" title="Login to My Space" meta="Mobile number and password" />
              </>
            ) : (
              <>
                {isPssmAdmin ? (
                  <HomeTile
                    to="/admin"
                    icon="users"
                    title="People & roles"
                    meta="Search by mobile · assign roles · remove"
                  />
                ) : null}
                <HomeTile to="/profile" icon="user" title="My Profile" meta="Sangha details and family" />
                <HomeTile
                  to="/stay"
                  icon="home"
                  title="Stay interest"
                  meta="Who is coming and for how long"
                />
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
