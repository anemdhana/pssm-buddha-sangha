import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  composedPassword,
  emptyMember,
  emptyProfile,
  placeLine
} from '../utils/password.js';
import { CameraModal } from './join/CameraModal.jsx';
import { ChipGroup, GENDER_OPTS, AGE_OPTS, MEDITATION_OPTS } from './join/ChipGroup.jsx';
import { FamilyMemberCard } from './join/FamilyMemberCard.jsx';
import { PhotoSlot } from './join/PhotoSlot.jsx';

const STEPS = [
  { id: 'who', label: 'Who is joining?' },
  { id: 'place', label: 'Where are you from?' },
  { id: 'family', label: 'Family with you' },
  { id: 'review', label: 'Review & finish' },
  { id: 'done', label: "You're in" }
];

const CITY_HINTS = {
  hyderabad: { state: 'Telangana', country: 'India' },
  bengaluru: { state: 'Karnataka', country: 'India' },
  bangalore: { state: 'Karnataka', country: 'India' },
  chennai: { state: 'Tamil Nadu', country: 'India' },
  mumbai: { state: 'Maharashtra', country: 'India' },
  'new delhi': { state: 'Delhi', country: 'India' }
};

const VILLAGE_HINTS = {
  kadthal: { district: 'Ranga Reddy', state: 'Telangana', country: 'India' }
};

const ID_LABELS = {
  aadhaar: 'Aadhaar',
  pan: 'PAN',
  voter: 'Voter ID',
  passport: 'Passport',
  driving: 'Driving Licence',
  other: 'Other'
};

function labelMap(map, key) {
  return (key && map[key]) || '—';
}

function birthError(form) {
  const d = String(form.birthDate || '').trim();
  const m = String(form.birthMonth || '').trim();
  if (!d || !m) return 'Enter birth date and month.';
  const day = Number(d);
  const month = Number(m);
  if (!Number.isFinite(day) || day < 1 || day > 31) return 'Birth date must be 1–31.';
  if (!Number.isFinite(month) || month < 1 || month > 12) return 'Birth month must be 1–12.';
  return '';
}

function SummaryRow({ label, value }) {
  return (
    <div className="x-summary-row">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  );
}

function SummaryPhotos({ live, proof }) {
  if (!live && !proof) return <SummaryRow label="Photos" value="Not provided" />;
  return (
    <div className="x-summary-photos">
      {live ? (
        <figure className="is-pass">
          <img src={live} alt="Live photo" />
          <figcaption>Photo</figcaption>
        </figure>
      ) : null}
      {proof ? (
        <figure className="is-id">
          <img src={proof} alt="ID proof" />
          <figcaption>ID</figcaption>
        </figure>
      ) : null}
    </div>
  );
}

export function JoinPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyProfile());
  const [openMember, setOpenMember] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [camera, setCamera] = useState(null);

  const passPreview = useMemo(() => {
    if (birthError(form)) return '—';
    return composedPassword(form) || '—';
  }, [form]);

  useEffect(() => {
    if (window.UIkit) window.UIkit.update(document.body);
  }, [step, form.members.length, camera]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updatePlace(field, value) {
    setForm((prev) => {
      const place = { ...prev.place, [field]: value };
      if (field === 'city') {
        const hint = CITY_HINTS[String(value).trim().toLowerCase()];
        if (hint) Object.assign(place, hint);
      }
      if (field === 'village') {
        const hint = VILLAGE_HINTS[String(value).trim().toLowerCase()];
        if (hint) Object.assign(place, hint);
      }
      return { ...prev, place };
    });
  }

  function validateWho() {
    if (!form.fullName.trim() || !String(form.mobile).replace(/\D/g, '') || !form.gender) {
      return 'Enter name, mobile, and gender.';
    }
    if (!form.meditation) return 'Choose how long into meditation.';
    return birthError(form);
  }

  function validatePlace() {
    if (form.place.kind === 'urban') {
      if (!form.place.city.trim()) return 'Enter city.';
    } else if (!form.place.village.trim()) {
      return 'Enter village.';
    }
    return '';
  }

  function goNext() {
    setError('');
    if (STEPS[step].id === 'who') {
      const msg = validateWho();
      if (msg) return setError(msg);
    }
    if (STEPS[step].id === 'place') {
      const msg = validatePlace();
      if (msg) return setError(msg);
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function finish() {
    setBusy(true);
    setError('');
    try {
      const res = await api.join(form);
      setTempPassword(res.data.temporaryPassword || composedPassword(form));
      setStep(STEPS.findIndex((s) => s.id === 'done'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Could not join.');
    } finally {
      setBusy(false);
    }
  }

  function addMember() {
    setForm((prev) => ({ ...prev, members: [...prev.members, emptyMember()] }));
    setOpenMember(form.members.length);
  }

  function updateMember(index, next) {
    setForm((prev) => {
      const members = prev.members.slice();
      members[index] = next;
      return { ...prev, members };
    });
  }

  function removeMember(index) {
    setForm((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
    setOpenMember(0);
  }

  function openCamera(owner, slot) {
    setCamera({ owner, slot });
  }

  function applyPhoto(dataUrl) {
    if (!camera) return;
    if (camera.owner === 'self') {
      update(camera.slot === 'live' ? 'livePhoto' : 'idProofPhoto', dataUrl);
    } else {
      const idx = camera.owner;
      const member = form.members[idx];
      if (!member) return;
      updateMember(idx, {
        ...member,
        [camera.slot === 'live' ? 'livePhoto' : 'idProofPhoto']: dataUrl
      });
    }
  }

  const stepMeta = STEPS[step];
  const partyCount = 1 + form.members.length;

  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column">
        <div className="step-bar">
          <button
            className="uk-button uk-button-text chrome-back"
            type="button"
            aria-label="Back"
            hidden={step === 0 || STEPS[step].id === 'done'}
            onClick={goBack}
          >
            <span uk-icon="icon: chevron-left; ratio: 0.85" />
          </button>
          <p className="step-label">
            Step {Math.min(step + 1, 5)} of 5 · {stepMeta.label}
          </p>
        </div>
        <div className="app-progress">
          <progress
            className="uk-progress"
            value={step + 1}
            max={5}
            aria-label="Join progress"
          />
        </div>

        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium">
          {STEPS[step].id === 'who' && (
            <>
              <header className="x-step-head form-head">
                <h2 className="form-title">Who is joining?</h2>
                <p className="form-summary">
                  A few details about you. Your mobile and a name-and-birthday password open My Space later.
                </p>
              </header>
              <form className="uk-form-stacked" onSubmit={(e) => e.preventDefault()}>
                <section className="x-group" aria-labelledby="g-identity">
                  <h3 className="x-group-title" id="g-identity">
                    <span uk-icon="icon: user; ratio: 0.75" /> Identity
                  </h3>
                  <div className="uk-grid-small uk-child-width-1-1 uk-child-width-1-2@s" uk-grid="">
                    <div className="x-field">
                      <label className="x-label" htmlFor="full-name">
                        Full name
                      </label>
                      <div className="uk-inline uk-width-1-1">
                        <span className="uk-form-icon" uk-icon="icon: user" />
                        <input
                          className="uk-input uk-form-small"
                          id="full-name"
                          placeholder="Ramakrishna"
                          autoComplete="name"
                          value={form.fullName}
                          onChange={(e) => update('fullName', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="x-field">
                      <label className="x-label" htmlFor="mobile">
                        Mobile
                      </label>
                      <div className="uk-inline uk-width-1-1">
                        <span className="uk-form-icon" uk-icon="icon: receiver" />
                        <input
                          className="uk-input uk-form-small"
                          id="mobile"
                          type="tel"
                          inputMode="tel"
                          placeholder="98765 43210"
                          autoComplete="tel"
                          value={form.mobile}
                          onChange={(e) => update('mobile', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="x-field">
                      <label className="x-label" htmlFor="email">
                        Email <span className="uk-text-muted">(optional)</span>
                      </label>
                      <div className="uk-inline uk-width-1-1">
                        <span className="uk-form-icon" uk-icon="icon: mail" />
                        <input
                          className="uk-input uk-form-small"
                          id="email"
                          type="email"
                          placeholder="name@email.com"
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="x-field">
                      <label className="x-label" htmlFor="alt-mobile">
                        Alt. mobile <span className="uk-text-muted">(optional)</span>
                      </label>
                      <div className="uk-inline uk-width-1-1">
                        <span className="uk-form-icon" uk-icon="icon: phone" />
                        <input
                          className="uk-input uk-form-small"
                          id="alt-mobile"
                          type="tel"
                          placeholder="Optional"
                          value={form.altMobile}
                          onChange={(e) => update('altMobile', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="x-group" aria-labelledby="g-profile">
                  <h3 className="x-group-title" id="g-profile">
                    <span uk-icon="icon: tag; ratio: 0.75" /> Profile
                  </h3>
                  <div className="uk-grid-small uk-child-width-1-1 uk-child-width-1-2@s" uk-grid="">
                    <div className="x-field">
                      <span className="x-label">Gender</span>
                      <ChipGroup
                        name="visitor-gender"
                        value={form.gender}
                        onChange={(v) => update('gender', v)}
                        options={GENDER_OPTS}
                      />
                    </div>
                    <div className="x-field">
                      <span className="x-label">Age group</span>
                      <ChipGroup
                        name="visitor-age"
                        value={form.age}
                        onChange={(v) => update('age', v)}
                        options={AGE_OPTS}
                      />
                    </div>
                    <div className="x-field uk-width-1-1">
                      <span className="x-label">How long into meditation?</span>
                      <ChipGroup
                        name="meditation"
                        value={form.meditation}
                        onChange={(v) => update('meditation', v)}
                        options={MEDITATION_OPTS}
                      />
                    </div>
                  </div>
                </section>

                <section className="x-group" aria-labelledby="g-birth">
                  <h3 className="x-group-title" id="g-birth">
                    <span uk-icon="icon: calendar; ratio: 0.75" /> Birth · login key
                  </h3>
                  <div className="uk-grid-small uk-child-width-1-2 uk-child-width-1-4@s" uk-grid="">
                    <div className="x-field">
                      <label className="x-label" htmlFor="birth-date">
                        Date
                      </label>
                      <div className="uk-inline uk-width-1-1">
                        <span className="uk-form-icon" uk-icon="icon: calendar" />
                        <input
                          className="uk-input uk-form-small"
                          id="birth-date"
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="15"
                          value={form.birthDate}
                          onChange={(e) => update('birthDate', e.target.value.replace(/\D/g, '').slice(0, 2))}
                        />
                      </div>
                    </div>
                    <div className="x-field">
                      <label className="x-label" htmlFor="birth-month">
                        Month
                      </label>
                      <div className="uk-inline uk-width-1-1">
                        <span className="uk-form-icon" uk-icon="icon: calendar" />
                        <input
                          className="uk-input uk-form-small"
                          id="birth-month"
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="8"
                          value={form.birthMonth}
                          onChange={(e) => update('birthMonth', e.target.value.replace(/\D/g, '').slice(0, 2))}
                        />
                      </div>
                    </div>
                    <div className="x-field uk-width-1-1@s uk-width-1-2@s">
                      <label className="x-label" htmlFor="language">
                        Preferred language
                      </label>
                      <select
                        className="uk-select uk-form-small"
                        id="language"
                        value={form.language}
                        onChange={(e) => update('language', e.target.value)}
                      >
                        <option value="">Select</option>
                        <option>English</option>
                        <option>Telugu</option>
                        <option>Hindi</option>
                        <option>Tamil</option>
                        <option>Kannada</option>
                      </select>
                    </div>
                  </div>
                  <div className="x-pass">
                    <div>
                      <small>Login password preview</small>
                      <div>
                        <strong>{passPreview}</strong>
                      </div>
                    </div>
                    <small>≤5 letters + DDMM</small>
                  </div>
                  {error ? <p className="hint">{error}</p> : null}
                </section>

                <section className="x-group" aria-labelledby="g-sangha">
                  <h3 className="x-group-title" id="g-sangha">
                    <span uk-icon="icon: users; ratio: 0.75" /> Sangha links
                  </h3>
                  <div className="uk-grid-small uk-child-width-1-1 uk-child-width-1-2@s" uk-grid="">
                    <div className="x-field">
                      <label className="x-label" htmlFor="center">
                        Pyramid center / group
                      </label>
                      <div className="uk-inline uk-width-1-1">
                        <span className="uk-form-icon" uk-icon="icon: location" />
                        <input
                          className="uk-input uk-form-small"
                          id="center"
                          list="center-list"
                          placeholder="Optional"
                          value={form.pyramidCenter}
                          onChange={(e) => update('pyramidCenter', e.target.value)}
                        />
                      </div>
                      <datalist id="center-list">
                        <option value="Pyramid Meditation Center, Vijayawada" />
                        <option value="Indiranagar Pyramid Group" />
                        <option value="Pyramid Meditation Center, Hyderabad" />
                      </datalist>
                    </div>
                    <div className="x-field">
                      <label className="x-label" htmlFor="since">
                        Since year
                      </label>
                      <div className="uk-inline uk-width-1-1">
                        <span className="uk-form-icon" uk-icon="icon: history" />
                        <input
                          className="uk-input uk-form-small"
                          id="since"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="2019"
                          value={form.sinceYear}
                          onChange={(e) => update('sinceYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="x-group" aria-labelledby="g-photos">
                  <h3 className="x-group-title" id="g-photos">
                    <span uk-icon="icon: camera; ratio: 0.75" /> Photo &amp; ID{' '}
                    <span className="x-advised">advised</span>
                  </h3>
                  <div className="x-photo-bar">
                    <PhotoSlot
                      kind="live"
                      preview={form.livePhoto}
                      onOpen={() => openCamera('self', 'live')}
                      label="Take live photo"
                    />
                    <PhotoSlot
                      kind="proof"
                      preview={form.idProofPhoto}
                      onOpen={() => openCamera('self', 'proof')}
                      label="Take ID proof photo"
                    />
                    <div className="x-photo-type">
                      <label className="x-label" htmlFor="id-type">
                        ID type
                      </label>
                      <select
                        className="uk-select uk-form-small"
                        id="id-type"
                        value={form.idType}
                        onChange={(e) => update('idType', e.target.value)}
                      >
                        <option value="">Later</option>
                        <option value="aadhaar">Aadhaar</option>
                        <option value="pan">PAN</option>
                        <option value="voter">Voter ID</option>
                        <option value="passport">Passport</option>
                        <option value="driving">Driving Licence</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </section>

                <div className="step-actions">
                  <button className="uk-button uk-button-primary uk-width-1-1" type="button" onClick={goNext}>
                    Continue
                  </button>
                </div>
              </form>
            </>
          )}

          {STEPS[step].id === 'place' && (
            <>
              <header className="x-step-head form-head">
                <h2 className="form-title">Where are you from?</h2>
                <p className="form-summary">
                  Village or city — start typing, and we’ll fill what we know. You can always change it.
                </p>
              </header>
              <form className="uk-form-stacked" onSubmit={(e) => e.preventDefault()}>
                <section className="x-group">
                  <h3 className="x-group-title">
                    <span uk-icon="icon: location; ratio: 0.75" /> Your place
                  </h3>
                  <ul className="uk-tab x-place-tabs">
                    <li className={form.place.kind === 'rural' ? 'uk-active' : undefined}>
                      <a
                        href="#rural"
                        onClick={(e) => {
                          e.preventDefault();
                          updatePlace('kind', 'rural');
                        }}
                      >
                        Rural
                      </a>
                    </li>
                    <li className={form.place.kind === 'urban' ? 'uk-active' : undefined}>
                      <a
                        href="#urban"
                        onClick={(e) => {
                          e.preventDefault();
                          updatePlace('kind', 'urban');
                        }}
                      >
                        Urban
                      </a>
                    </li>
                  </ul>
                  {form.place.kind === 'rural' ? (
                    <div className="uk-grid-small uk-child-width-1-1 uk-child-width-1-2@s uk-margin-small-top" uk-grid="">
                      <div className="x-field">
                        <label className="x-label" htmlFor="village">
                          Village
                        </label>
                        <div className="uk-inline uk-width-1-1">
                          <span className="uk-form-icon" uk-icon="icon: location" />
                          <input
                            className="uk-input uk-form-small"
                            id="village"
                            list="village-list"
                            value={form.place.village}
                            onChange={(e) => updatePlace('village', e.target.value)}
                          />
                        </div>
                        <datalist id="village-list">
                          <option value="Kadthal" />
                        </datalist>
                      </div>
                      <div className="x-field">
                        <label className="x-label" htmlFor="town">
                          Town
                        </label>
                        <div className="uk-inline uk-width-1-1">
                          <span className="uk-form-icon" uk-icon="icon: home" />
                          <input
                            className="uk-input uk-form-small"
                            id="town"
                            value={form.place.town}
                            onChange={(e) => updatePlace('town', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="x-field uk-width-1-1">
                        <label className="x-label" htmlFor="district">
                          District
                        </label>
                        <div className="uk-inline uk-width-1-1">
                          <span className="uk-form-icon" uk-icon="icon: location" />
                          <input
                            className="uk-input uk-form-small"
                            id="district"
                            value={form.place.district}
                            onChange={(e) => updatePlace('district', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="x-field">
                        <label className="x-label" htmlFor="state-rural">
                          State
                        </label>
                        <div className="uk-inline uk-width-1-1">
                          <span className="uk-form-icon" uk-icon="icon: world" />
                          <input
                            className="uk-input uk-form-small"
                            id="state-rural"
                            value={form.place.state}
                            onChange={(e) => updatePlace('state', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="x-field">
                        <label className="x-label" htmlFor="country-rural">
                          Country
                        </label>
                        <div className="uk-inline uk-width-1-1">
                          <span className="uk-form-icon" uk-icon="icon: world" />
                          <input className="uk-input uk-form-small filled" id="country-rural" value="India" readOnly />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="uk-grid-small uk-child-width-1-1 uk-child-width-1-2@s uk-margin-small-top" uk-grid="">
                      <div className="x-field uk-width-1-1">
                        <label className="x-label" htmlFor="city">
                          City
                        </label>
                        <div className="uk-inline uk-width-1-1">
                          <span className="uk-form-icon" uk-icon="icon: location" />
                          <input
                            className="uk-input uk-form-small"
                            id="city"
                            list="city-list"
                            value={form.place.city}
                            onChange={(e) => updatePlace('city', e.target.value)}
                          />
                        </div>
                        <datalist id="city-list">
                          <option value="Hyderabad" />
                          <option value="Bengaluru" />
                          <option value="Chennai" />
                          <option value="Mumbai" />
                          <option value="New Delhi" />
                        </datalist>
                      </div>
                      <div className="x-field">
                        <label className="x-label" htmlFor="state-urban">
                          State
                        </label>
                        <div className="uk-inline uk-width-1-1">
                          <span className="uk-form-icon" uk-icon="icon: world" />
                          <input
                            className="uk-input uk-form-small"
                            id="state-urban"
                            value={form.place.state}
                            onChange={(e) => updatePlace('state', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="x-field">
                        <label className="x-label" htmlFor="country-urban">
                          Country
                        </label>
                        <div className="uk-inline uk-width-1-1">
                          <span className="uk-form-icon" uk-icon="icon: world" />
                          <input
                            className="uk-input uk-form-small"
                            id="country-urban"
                            value={form.place.country || 'India'}
                            onChange={(e) => updatePlace('country', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </section>
                {error ? <p className="hint">{error}</p> : null}
                <div className="step-actions">
                  <button className="uk-button uk-button-primary uk-width-1-1" type="button" onClick={goNext}>
                    Continue
                  </button>
                </div>
              </form>
            </>
          )}

          {STEPS[step].id === 'family' && (
            <>
              <header className="x-step-head form-head">
                <h2 className="form-title">Family with you</h2>
                <p className="form-summary">Coming with family? Add them here. Alone? Just continue.</p>
              </header>
              <p className="uk-text-meta uk-margin-remove-top">
                {partyCount} person{partyCount === 1 ? '' : 's'}
              </p>
              <div>
                {form.members.map((member, index) => (
                  <FamilyMemberCard
                    key={index}
                    index={index}
                    member={member}
                    open={openMember === index}
                    onToggle={() => setOpenMember(openMember === index ? -1 : index)}
                    onChange={(next) => updateMember(index, next)}
                    onRemove={() => removeMember(index)}
                    onPhoto={(idx, slot) => openCamera(idx, slot)}
                  />
                ))}
              </div>
              <button className="uk-button uk-button-default uk-width-1-1 uk-margin-small" type="button" onClick={addMember}>
                <span uk-icon="icon: plus; ratio: 0.85" />
                <span className="uk-margin-small-left">Add a family member</span>
              </button>
              <div className="step-actions">
                <button className="uk-button uk-button-primary uk-width-1-1" type="button" onClick={goNext}>
                  Continue
                </button>
              </div>
            </>
          )}

          {STEPS[step].id === 'review' && (
            <>
              <header className="x-step-head form-head">
                <h2 className="form-title">Review &amp; finish</h2>
                <p className="form-summary">A quick look before you join. Change anything with Back, then Finish.</p>
              </header>
              <div className="x-summary">
                <section className="x-group">
                  <h3 className="x-group-title">
                    <span uk-icon="icon: user; ratio: 0.75" /> You
                  </h3>
                  <SummaryRow label="Name" value={form.fullName} />
                  <SummaryRow label="Mobile" value={form.mobile} />
                  <SummaryRow label="Email" value={form.email || '—'} />
                  <SummaryRow
                    label="Gender / age"
                    value={`${labelMap({ male: 'Male', female: 'Female' }, form.gender)} · ${labelMap(
                      { child: 'Child · under 12', adult: 'Adult · 12–59', senior: 'Senior · 60+' },
                      form.age
                    )}`}
                  />
                  <SummaryRow
                    label="Meditation"
                    value={labelMap(
                      { new: 'New', 1: '1 yr', 2: '2 yr', 3: '3 yr', 4: '4 yr', 5: '5 yr', 6: 'Over 5 yr' },
                      form.meditation
                    )}
                  />
                  <SummaryRow
                    label="Birth"
                    value={`${form.birthDate || '—'} / ${form.birthMonth || '—'}`}
                  />
                  <SummaryRow label="Language" value={form.language || '—'} />
                  <SummaryRow label="Center" value={form.pyramidCenter || '—'} />
                  <SummaryRow label="Since" value={form.sinceYear || '—'} />
                  <SummaryRow label="ID type" value={ID_LABELS[form.idType] || '—'} />
                  <SummaryPhotos live={form.livePhoto} proof={form.idProofPhoto} />
                </section>
                <section className="x-group">
                  <h3 className="x-group-title">
                    <span uk-icon="icon: location; ratio: 0.75" /> Place
                  </h3>
                  <SummaryRow label="Address" value={placeLine(form.place) || '—'} />
                </section>
                <section className="x-group">
                  <h3 className="x-group-title">
                    <span uk-icon="icon: users; ratio: 0.75" /> Family
                  </h3>
                  {form.members.length === 0 ? (
                    <SummaryRow label="Family" value="None — joining alone" />
                  ) : (
                    form.members.map((m, i) => {
                      const bits = [
                        m.name || `Person ${i + 2}`,
                        m.relation,
                        labelMap(
                          { child: 'Child · under 12', adult: 'Adult · 12–59', senior: 'Senior · 60+' },
                          m.age
                        )
                      ]
                        .filter(Boolean)
                        .join(' · ');
                      return (
                        <div key={i}>
                          <SummaryRow label={`Family ${i + 1}`} value={bits} />
                          <SummaryRow label="ID type" value={ID_LABELS[m.idType] || '—'} />
                          <SummaryPhotos live={m.livePhoto} proof={m.idProofPhoto} />
                        </div>
                      );
                    })
                  )}
                </section>
              </div>
              {error ? <p className="hint">{error}</p> : null}
              <div className="step-actions">
                <button
                  className="uk-button uk-button-primary uk-width-1-1"
                  type="button"
                  onClick={finish}
                  disabled={busy}
                >
                  {busy ? 'Saving…' : 'Finish'}
                </button>
              </div>
            </>
          )}

          {STEPS[step].id === 'done' && (
            <>
              <header className="x-step-head form-head">
                <h2 className="form-title">You’re in</h2>
                <p className="form-summary">
                  {tempPassword
                    ? 'Welcome to the sangha. Login with your mobile number and this password.'
                    : 'Welcome to the sangha. Login with your mobile number and your name-and-birthday password.'}
                </p>
              </header>
              {tempPassword ? <p className="password-line uk-margin-small-bottom">Password: {tempPassword}</p> : null}
              <div className="step-actions">
                <Link className="uk-button uk-button-primary uk-width-1-1" to="/login">
                  Login to My Space
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <datalist id="relation-list">
        <option value="Spouse" />
        <option value="Child" />
        <option value="Parent" />
        <option value="Sibling" />
      </datalist>

      <CameraModal
        open={Boolean(camera)}
        slot={camera ? camera.slot : 'live'}
        onClose={() => setCamera(null)}
        onUse={applyPhoto}
      />
    </main>
  );
}
