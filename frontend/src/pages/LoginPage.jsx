import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export function LoginPage() {
  const { signedIn, login, sampleAdmin, isPssmAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (signedIn) {
    return <Navigate to={isPssmAdmin ? '/admin' : '/'} replace />;
  }

  async function onLogin() {
    setBusy(true);
    setError('');
    try {
      const data = await login(mobile, password);
      navigate(data.home || '/');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  function fillSample() {
    if (!sampleAdmin) return;
    setMobile(sampleAdmin.mobile);
    setPassword(sampleAdmin.password);
    setShowPassword(true);
  }

  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column app-narrow">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium">
          <header className="x-step-head form-head">
            <h2 className="form-title">Login to My Space</h2>
            <p className="form-summary">Your mobile and join password open the door — same numbers you already know.</p>
          </header>
          <form
            className="uk-form-stacked"
            onSubmit={(e) => {
              e.preventDefault();
              onLogin();
            }}
          >
            <section className="x-group" aria-labelledby="g-login">
              <h3 className="x-group-title" id="g-login">
                <span uk-icon="icon: lock; ratio: 0.75" /> Sign in
              </h3>
              <div className="uk-grid-small uk-child-width-1-1" uk-grid="">
                <div className="x-field">
                  <label className="x-label" htmlFor="mobile">
                    Mobile number
                  </label>
                  <div className="uk-inline uk-width-1-1">
                    <span className="uk-form-icon" uk-icon="icon: receiver" />
                    <input
                      className="uk-input uk-form-small"
                      id="mobile"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="98765 43210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                  </div>
                </div>
                <div className="x-field">
                  <label className="x-label" htmlFor="password">
                    Password
                  </label>
                  <div className="uk-inline uk-width-1-1">
                    <span className="uk-form-icon" uk-icon="icon: lock" />
                    <input
                      className="uk-input uk-form-small"
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Your join password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <p className="hint uk-margin-small-top uk-margin-remove-bottom">
                Password is up to 5 letters of your name, then birthday date and month. Example: Ramak1508.
              </p>
              {error ? (
                <p className="hint" role="alert">
                  {error}
                </p>
              ) : null}
            </section>
            {sampleAdmin ? (
              <section className="x-group" aria-labelledby="g-sample">
                <h3 className="x-group-title" id="g-sample">
                  <span uk-icon="icon: star; ratio: 0.75" /> Sample PSSM Admin
                </h3>
                <p className="hint uk-margin-remove-top">Prototype login to try People &amp; roles.</p>
                <div className="x-admin-person">
                  <div className="x-admin-name">{sampleAdmin.name}</div>
                  <div className="x-admin-meta">
                    Mobile <strong>{sampleAdmin.mobile}</strong> · Password <strong>{sampleAdmin.password}</strong>
                  </div>
                </div>
                <button
                  className="uk-button uk-button-default uk-width-1-1 uk-margin-small-top"
                  type="button"
                  onClick={fillSample}
                >
                  Use sample admin
                </button>
              </section>
            ) : null}
            <div className="step-actions">
              <button className="uk-button uk-button-primary uk-width-1-1" type="submit" disabled={busy}>
                {busy ? 'Signing in…' : 'Login'}
              </button>
            </div>
            <p className="uk-text-center uk-margin-small-top">
              <Link className="uk-button uk-button-text" to="/join">
                New here? Join the sangha
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
