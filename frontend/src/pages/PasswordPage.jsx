import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';

export function PasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSave(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setDone(false);
    try {
      await api.changePassword({ currentPassword, newPassword, confirmPassword });
      setDone(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (window.UIkit) {
        window.UIkit.notification({ message: 'Password updated.', status: 'success', pos: 'top-center', timeout: 2000 });
      }
    } catch (err) {
      setError(err.message || 'Could not update password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column app-narrow">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium">
          <header className="x-step-head form-head">
            <h2 className="form-title">Change my password</h2>
            <p className="form-summary">Keep your space safe — set a password only you will use next time.</p>
          </header>
          <form className="uk-form-stacked" onSubmit={onSave}>
            <section className="x-group">
              <h3 className="x-group-title">
                <span uk-icon="icon: lock; ratio: 0.75" /> New password
              </h3>
              <div className="uk-grid-small uk-child-width-1-1" uk-grid="">
                <div className="x-field">
                  <label className="x-label" htmlFor="current-password">
                    Current password
                  </label>
                  <input
                    className="uk-input uk-form-small"
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="x-field">
                  <label className="x-label" htmlFor="new-password">
                    New password
                  </label>
                  <input
                    className="uk-input uk-form-small"
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="x-field">
                  <label className="x-label" htmlFor="confirm-password">
                    Confirm new password
                  </label>
                  <input
                    className="uk-input uk-form-small"
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <p className="hint uk-margin-small-top">After you save, only the new password works with your mobile number.</p>
              {error && (
                <p className="hint" role="alert">
                  {error}
                </p>
              )}
              {done && <p className="hint">Password updated.</p>}
            </section>
            <div className="step-actions">
              <button className="uk-button uk-button-primary uk-width-1-1" type="submit" disabled={busy}>
                Save password
              </button>
            </div>
            <p className="uk-text-center uk-margin-small-top">
              <Link className="uk-button uk-button-text" to="/profile">
                Back to My Profile
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
