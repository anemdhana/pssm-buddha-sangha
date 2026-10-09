import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { emptyProfile, roleLabel } from '../utils/password.js';

export function ProfilePage() {
  const [form, setForm] = useState(emptyProfile());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .getMyProfile()
      .then((res) => {
        setForm({ ...emptyProfile(), ...res.data, place: { ...emptyProfile().place, ...(res.data.place || {}) } });
        setLoaded(true);
      })
      .catch((err) => setError(err.message));
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updatePlace(field, value) {
    setForm((prev) => ({ ...prev, place: { ...prev.place, [field]: value } }));
  }

  async function onSave(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.updateMyProfile(form);
      setForm({ ...emptyProfile(), ...res.data, place: { ...emptyProfile().place, ...(res.data.place || {}) } });
      if (window.UIkit) {
        window.UIkit.notification({ message: 'Profile saved.', status: 'success', pos: 'top-center', timeout: 2000 });
      }
    } catch (err) {
      setError(err.message || 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  if (!loaded && !error) {
    return (
      <main className="uk-section uk-section-small">
        <div className="uk-container app-column app-narrow">
          <p className="hint">Loading profile…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column app-narrow">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium">
          <header className="x-step-head form-head">
            <h2 className="form-title">My Profile</h2>
            <p className="form-summary">Update your sangha details. Roles are assigned by PSSM Admin.</p>
          </header>
          <form className="uk-form-stacked" onSubmit={onSave}>
            <section className="x-group">
              <h3 className="x-group-title">
                <span uk-icon="icon: user; ratio: 0.75" /> Who
              </h3>
              <div className="uk-grid-small uk-child-width-1-1" uk-grid="">
                <div className="x-field">
                  <label className="x-label" htmlFor="fullName">
                    Full name
                  </label>
                  <input
                    className="uk-input uk-form-small"
                    id="fullName"
                    value={form.fullName || ''}
                    onChange={(e) => update('fullName', e.target.value)}
                  />
                </div>
                <div className="x-field">
                  <label className="x-label" htmlFor="mobile">
                    Mobile
                  </label>
                  <input className="uk-input uk-form-small" id="mobile" value={form.mobile || ''} disabled />
                </div>
                <div className="x-field">
                  <label className="x-label" htmlFor="pyramidCenter">
                    Pyramid center or group
                  </label>
                  <input
                    className="uk-input uk-form-small"
                    id="pyramidCenter"
                    value={form.pyramidCenter || ''}
                    onChange={(e) => update('pyramidCenter', e.target.value)}
                  />
                </div>
                <div className="x-field">
                  <label className="x-label" htmlFor="sinceYear">
                    Since year
                  </label>
                  <input
                    className="uk-input uk-form-small"
                    id="sinceYear"
                    value={form.sinceYear || ''}
                    onChange={(e) => update('sinceYear', e.target.value)}
                  />
                </div>
              </div>
            </section>
            <section className="x-group">
              <h3 className="x-group-title">
                <span uk-icon="icon: location; ratio: 0.75" /> Place
              </h3>
              <div className="uk-grid-small uk-child-width-1-1" uk-grid="">
                <div className="x-field">
                  <label className="x-label" htmlFor="city">
                    City / town
                  </label>
                  <input
                    className="uk-input uk-form-small"
                    id="city"
                    value={form.place?.city || form.place?.town || ''}
                    onChange={(e) => updatePlace(form.place?.kind === 'rural' ? 'town' : 'city', e.target.value)}
                  />
                </div>
                <div className="x-field">
                  <label className="x-label" htmlFor="state">
                    State
                  </label>
                  <input
                    className="uk-input uk-form-small"
                    id="state"
                    value={form.place?.state || ''}
                    onChange={(e) => updatePlace('state', e.target.value)}
                  />
                </div>
              </div>
            </section>
            <section className="x-group">
              <h3 className="x-group-title">
                <span uk-icon="icon: star; ratio: 0.75" /> Roles
              </h3>
              <div className="x-role-chips">
                {(form.roles || []).length === 0 && <span className="x-role-empty">No roles yet</span>}
                {(form.roles || []).map((id) => (
                  <span className="x-role-chip" key={id}>
                    {roleLabel(id)}
                  </span>
                ))}
              </div>
              <p className="hint">Roles are read-only here. PSSM Admin assigns them under People &amp; roles.</p>
            </section>
            {error && (
              <p className="hint" role="alert">
                {error}
              </p>
            )}
            <div className="step-actions">
              <button className="uk-button uk-button-primary uk-width-1-1" type="submit" disabled={busy}>
                Save profile
              </button>
            </div>
            <p className="uk-text-center uk-margin-small-top">
              <Link className="uk-button uk-button-text" to="/password">
                Change my password
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
