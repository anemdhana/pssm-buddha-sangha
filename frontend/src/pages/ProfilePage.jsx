import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { emptyProfile, placeLine, roleLabel } from '../utils/password.js';
import { MEDITATION_OPTS } from './join/ChipGroup.jsx';
import { SanghaWizard } from './join/SanghaWizard.jsx';

const STEP_WHO = 0;
const STEP_PLACE = 1;
const STEP_FAMILY = 2;
const STEP_REVIEW = 3;

const MEDITATION_LABELS = Object.fromEntries(MEDITATION_OPTS.map((opt) => [opt.value, opt.label]));

function meditationLine(value) {
  return MEDITATION_LABELS[value] || 'Meditation —';
}

function PersonShot({ photo, name, meditation, onClick }) {
  return (
    <button type="button" className="x-profile-shot is-passport" onClick={onClick}>
      {photo ? (
        <img className="x-profile-shot-img" src={photo} alt="" />
      ) : (
        <span className="x-profile-shot-empty" uk-icon="icon: user; ratio: 1.6" />
      )}
      <span className="x-profile-shot-overlay">
        <span className="x-profile-shot-name">{name}</span>
        <span className="x-profile-shot-meta">{meditationLine(meditation)}</span>
      </span>
    </button>
  );
}

function ActionShot({ icon, name, meta, onClick }) {
  return (
    <button type="button" className="x-profile-shot is-action" onClick={onClick}>
      <span className="x-profile-shot-frame is-icon">
        <span uk-icon={`icon: ${icon}; ratio: 1.4`} />
      </span>
      <span className="x-profile-shot-name">{name}</span>
      {meta ? <span className="x-profile-shot-meta">{meta}</span> : null}
    </button>
  );
}

export function ProfilePage() {
  const [form, setForm] = useState(emptyProfile());
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(null);

  function loadProfile() {
    return api
      .getMyProfile()
      .then((res) => {
        const next = {
          ...emptyProfile(),
          ...res.data,
          place: { ...emptyProfile().place, ...(res.data.place || {}) },
          members: Array.isArray(res.data.members) ? res.data.members : []
        };
        setForm(next);
        setLoaded(true);
        return next;
      })
      .catch((err) => {
        setError(err.message || 'Could not load profile.');
        setLoaded(true);
        return null;
      });
  }

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (window.UIkit) window.UIkit.update(document.body);
  }, [editing, loaded, form.members.length]);

  function openStep(step, openMember = 0) {
    setEditing({ step, openMember });
  }

  async function leaveWizard(updatedForm) {
    if (updatedForm) {
      setForm({
        ...emptyProfile(),
        ...updatedForm,
        place: { ...emptyProfile().place, ...(updatedForm.place || {}) },
        members: Array.isArray(updatedForm.members) ? updatedForm.members : []
      });
    } else {
      await loadProfile();
    }
    setEditing(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!loaded) {
    return (
      <main className="uk-section uk-section-small">
        <div className="uk-container app-column app-narrow">
          <p className="hint">Loading profile…</p>
        </div>
      </main>
    );
  }

  if (error && !form.mobile) {
    return (
      <main className="uk-section uk-section-small">
        <div className="uk-container app-column app-narrow">
          <p className="hint" role="alert">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (editing) {
    return (
      <SanghaWizard
        mode="profile"
        initialForm={form}
        initialStep={editing.step}
        initialOpenMember={editing.openMember}
        onExit={leaveWizard}
      />
    );
  }

  const members = form.members || [];
  const place = placeLine(form.place) || 'Add your place';

  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium">
          <header className="x-step-head form-head">
            <h2 className="form-title">My Profile</h2>
            <p className="form-summary">
              Tap a photo to open that part of your profile and edit it — same steps as join.
            </p>
          </header>

          <section className="x-group" aria-labelledby="g-people">
            <h3 className="x-group-title" id="g-people">
              <span uk-icon="icon: users; ratio: 0.75" /> You &amp; family
            </h3>
            <div
              className="uk-grid-small uk-child-width-1-2 uk-child-width-1-3@s uk-child-width-1-4@m"
              uk-grid=""
              uk-height-match="target: > div > .x-profile-shot"
            >
              <div>
                <PersonShot
                  photo={form.livePhoto}
                  name={form.fullName || 'You'}
                  meditation={form.meditation}
                  onClick={() => openStep(STEP_WHO)}
                />
              </div>
              {members.map((member, index) => (
                <div key={index}>
                  <PersonShot
                    photo={member.livePhoto}
                    name={member.name || `Person ${index + 2}`}
                    meditation={member.meditation}
                    onClick={() => openStep(STEP_FAMILY, index)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="x-group" aria-labelledby="g-more">
            <h3 className="x-group-title" id="g-more">
              <span uk-icon="icon: pencil; ratio: 0.75" /> Other steps
            </h3>
            <div className="uk-grid-small uk-child-width-1-2 uk-child-width-1-3@s" uk-grid="">
              <div>
                <ActionShot
                  icon="location"
                  name="Your place"
                  meta={place}
                  onClick={() => openStep(STEP_PLACE)}
                />
              </div>
              <div>
                <ActionShot
                  icon="users"
                  name="Your family"
                  meta={members.length ? `${members.length} member${members.length === 1 ? '' : 's'}` : 'Add family'}
                  onClick={() => openStep(STEP_FAMILY, 0)}
                />
              </div>
              <div>
                <ActionShot
                  icon="check"
                  name="Review & save"
                  meta="Step 4 · then save"
                  onClick={() => openStep(STEP_REVIEW)}
                />
              </div>
            </div>
          </section>

          <section className="x-group" aria-labelledby="g-roles">
            <h3 className="x-group-title" id="g-roles">
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

          <div className="step-actions is-split">
            <Link className="step-actions-side" to="/password">
              Change my password
            </Link>
            <button className="uk-button uk-button-primary" type="button" onClick={() => openStep(STEP_WHO)}>
              Edit details
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
