import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export function LoginPage() {
  const { signedIn, login, isPssmAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column app-narrow">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium">
          <header className="x-step-head form-head">
            <h2 className="form-title">Login to My Space</h2>
            <p className="form-summary">
              Sign in with the mobile number and password from when you joined. The first password is up to 5 letters of
              your name, then birth date and month.
            </p>
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
                      type="password"
                      autoComplete="current-password"
                      placeholder="Your join password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <p className="hint uk-margin-small-top uk-margin-remove-bottom">
                Example: Ramakrishna, 15 August → Ramak1508.
              </p>
              {error ? (
                <p className="hint" role="alert">
                  {error}
                </p>
              ) : null}
            </section>
            <div className="step-actions is-split">
              <Link className="step-actions-side" to="/join">
                New here? Join the sangha
              </Link>
              <button className="uk-button uk-button-primary" type="submit" disabled={busy}>
                {busy ? 'Signing in…' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
