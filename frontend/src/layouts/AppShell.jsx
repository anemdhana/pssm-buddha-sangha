import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';
import { formatEventSub } from '../utils/password.js';

const DEMO_EVENTS = [
  { id: 'demo_dhyana', name: 'Dhyana Maha Yagam - 5', sub: 'December 21 to 31 · Kailasapuri' },
  { id: 'demo_dussehra', name: 'Dussehra Sangeetha Dhyana Maha Yagnam', sub: 'October 17 to 20 · Vishakhapatnam' }
];

export function AppShell() {
  const { signedIn, isPssmAdmin, isOrganizer, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [picked, setPicked] = useState({
    name: 'PSSM Buddha Sangha',
    sub: 'Join the sangha · support events'
  });

  useEffect(() => {
    if (!signedIn) {
      setEvents([]);
      return;
    }
    api
      .listEvents()
      .then((res) => setEvents(res.data || []))
      .catch(() => setEvents([]));
  }, [signedIn]);

  useEffect(() => {
    if (window.UIkit) {
      window.UIkit.update(document.body);
    }
  }, [signedIn, isPssmAdmin, isOrganizer, events, picked]);

  async function onLogout(e) {
    e.preventDefault();
    await logout();
    navigate('/');
  }

  function pickEvent(name, sub) {
    setPicked({ name, sub: sub || '' });
    document.title = name;
  }

  if (loading) {
    return (
      <main className="uk-section uk-section-small">
        <div className="uk-container app-column app-narrow">
          <p className="hint">Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <div className="app-top">
        <header className="app-header">
          <div className="brand-mark">
            <img className="patriji" src="/assets/patriji.jpg" alt="Patriji" />
            <img className="logo" src="/assets/pssm-logo.png" alt="Pyramid Spiritual Societies Movement" />
          </div>
          <div className="event-pick">
            <button className="event-pick-toggle" type="button" aria-label="Choose event">
              <span className="event-pick-copy">
                <span className="event-pick-label">{picked.name}</span>
                {picked.sub ? <span className="event-pick-sub">{picked.sub}</span> : null}
              </span>
              <span uk-icon="icon: chevron-down; ratio: 0.7" />
            </button>
            <div uk-dropdown="mode: click; pos: bottom-left; offset: -1; delay-hide: 0">
              <ul className="uk-nav uk-dropdown-nav event-pick-menu">
                <li className={picked.name === 'PSSM Buddha Sangha' ? 'uk-active' : undefined}>
                  <a
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      pickEvent('PSSM Buddha Sangha', 'Join the sangha · support events');
                    }}
                  >
                    <span className="event-name">PSSM Buddha Sangha</span>
                    <span className="event-sub">Join the sangha · support events</span>
                  </a>
                </li>
                {DEMO_EVENTS.map((evt) => (
                  <li key={evt.id} className={picked.name === evt.name ? 'uk-active' : undefined}>
                    <a
                      href="#event"
                      onClick={(e) => {
                        e.preventDefault();
                        pickEvent(evt.name, evt.sub);
                      }}
                    >
                      <span className="event-name">{evt.name}</span>
                      <span className="event-sub">{evt.sub}</span>
                    </a>
                  </li>
                ))}
                {events.map((evt) => (
                  <li key={evt.id} className={picked.name === evt.name ? 'uk-active' : undefined}>
                    <a
                      href="#event"
                      onClick={(e) => {
                        e.preventDefault();
                        pickEvent(evt.name, formatEventSub(evt));
                      }}
                    >
                      <span className="event-name">{evt.name}</span>
                      <span className="event-sub">{formatEventSub(evt)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <nav
            className="app-nav uk-visible@m"
            uk-navbar="mode: click; align: right; offset: 0; flip: false; delay-hide: 0"
            aria-label="Main"
          >
            <ul className="uk-navbar-nav">
              {signedIn && (
                <li>
                  <a href="#stay">
                    Stay <span uk-navbar-parent-icon="" />
                  </a>
                  <div className="uk-navbar-dropdown">
                    <ul className="uk-nav uk-navbar-dropdown-nav">
                      <li>
                        <Link to="/stay">Free Accommodation</Link>
                      </li>
                      <li>
                        <Link to="/stay">Paid Accommodation</Link>
                      </li>
                    </ul>
                  </div>
                </li>
              )}
              {!signedIn && (
                <li>
                  <a href="#sangha">
                    Sangha <span uk-navbar-parent-icon="" />
                  </a>
                  <div className="uk-navbar-dropdown">
                    <ul className="uk-nav uk-navbar-dropdown-nav">
                      <li>
                        <NavLink to="/join">Join PSSM Buddha Sangha</NavLink>
                      </li>
                      <li>
                        <NavLink to="/login">Login to My Space</NavLink>
                      </li>
                    </ul>
                  </div>
                </li>
              )}
              {signedIn && (
                <li>
                  <a href="#account">
                    Account <span uk-navbar-parent-icon="" />
                  </a>
                  <div className="uk-navbar-dropdown">
                    <ul className="uk-nav uk-navbar-dropdown-nav">
                      {isPssmAdmin && (
                        <li>
                          <NavLink to="/admin">People &amp; roles</NavLink>
                        </li>
                      )}
                      <li>
                        <NavLink to="/profile">My Profile</NavLink>
                      </li>
                      <li>
                        <NavLink to="/password">Change my password</NavLink>
                      </li>
                      {isOrganizer && (
                        <li>
                          <NavLink to="/events">Create event</NavLink>
                        </li>
                      )}
                      <li>
                        <a href="#logout" onClick={onLogout}>
                          Logout
                        </a>
                      </li>
                    </ul>
                  </div>
                </li>
              )}
            </ul>
          </nav>

          <div className="app-nav-mobile uk-hidden@m">
            <button className="uk-button uk-button-text app-menu-toggle" type="button" aria-label="Open menu">
              <span uk-icon="icon: menu" />
            </button>
            <div uk-dropdown="mode: click; pos: bottom-right; offset: 0; flip: false; delay-hide: 0">
              <ul className="uk-nav uk-dropdown-nav">
                {signedIn && (
                  <>
                    <li className="uk-nav-header">Stay</li>
                    <li>
                      <Link to="/stay">Free Accommodation</Link>
                    </li>
                    <li>
                      <Link to="/stay">Paid Accommodation</Link>
                    </li>
                  </>
                )}
                {!signedIn && (
                  <>
                    <li className="uk-nav-header">Sangha</li>
                    <li>
                      <Link to="/join">Join PSSM Buddha Sangha</Link>
                    </li>
                    <li>
                      <Link to="/login">Login to My Space</Link>
                    </li>
                  </>
                )}
                {signedIn && (
                  <>
                    <li className="uk-nav-header">Account</li>
                    {isPssmAdmin && (
                      <li>
                        <Link to="/admin">People &amp; roles</Link>
                      </li>
                    )}
                    <li>
                      <Link to="/profile">My Profile</Link>
                    </li>
                    <li>
                      <Link to="/password">Change my password</Link>
                    </li>
                    {isOrganizer && (
                      <li>
                        <Link to="/events">Create event</Link>
                      </li>
                    )}
                    <li>
                      <a href="#logout" onClick={onLogout}>
                        Logout
                      </a>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </header>
      </div>
      <Outlet />
    </>
  );
}
