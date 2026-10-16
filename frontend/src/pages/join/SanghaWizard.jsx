import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import {
  composedPassword,
  emptyMember,
  emptyProfile,
  normalizeMobile,
  placeLine,
  roleLabel
} from '../../utils/password.js';
import { CameraModal } from './CameraModal.jsx';
import { ChipGroup, GENDER_OPTS, AGE_OPTS, MEDITATION_OPTS } from './ChipGroup.jsx';
import { FamilyMemberCard, validateMemberFields } from './FamilyMemberCard.jsx';
import { FieldError } from './FieldError.jsx';
import { PlaceAutocomplete, rememberPlacePayload } from './PlaceAutocomplete.jsx';
import { PyramidCenterAutocomplete, rememberPyramidCenter } from './PyramidCenterAutocomplete.jsx';
import { PhotoSlot } from './PhotoSlot.jsx';

const JOIN_STEPS = [
  { id: 'who', label: 'Who is joining?' },
  { id: 'place', label: 'Where are you from?' },
  { id: 'family', label: 'Family with you' },
  { id: 'review', label: 'Review & finish' },
  { id: 'done', label: "You're in" }
];

const PROFILE_STEPS = [
  { id: 'who', label: 'Your details' },
  { id: 'place', label: 'Your place' },
  { id: 'family', label: 'Your family' },
  { id: 'review', label: 'Review your profile' },
  { id: 'done', label: 'Profile saved' }
];

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

function daysInMonth(month) {
  if (month === 2) return 29;
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  return 31;
}

function birthDateError(form) {
  const d = String(form.birthDate || '').trim();
  const m = String(form.birthMonth || '').trim();
  if (!d) return 'Enter date.';
  const day = Number(d);
  const month = Number(m);
  if (!Number.isFinite(day) || day < 1) return 'Date must be 1–31.';
  if (m && Number.isFinite(month) && month >= 1 && month <= 12 && day > daysInMonth(month)) {
    return 'That date is not valid for this month.';
  }
  if (day > 31) return 'Date must be 1–31.';
  return '';
}

function birthMonthError(form) {
  const m = String(form.birthMonth || '').trim();
  if (!m) return 'Enter month.';
  const month = Number(m);
  if (!Number.isFinite(month) || month < 1 || month > 12) return 'Month must be 1–12.';
  return '';
}

const FIELD_FOCUS = {
  fullName: 'full-name',
  mobile: 'mobile',
  gender: 'visitor-gender',
  meditation: 'meditation',
  birthDate: 'birth-date',
  birthMonth: 'birth-month',
  village: 'village',
  city: 'city'
};

function focusEl(el) {
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (typeof el.focus === 'function') {
    try {
      el.focus({ preventScroll: true });
    } catch {
      /* chips wrapper may not be focusable */
    }
  }
}

function focusField(key) {
  const id = FIELD_FOCUS[key];
  if (!id) return;
  focusEl(
    document.getElementById(id) ||
      document.querySelector(`[data-field="${id}"]`) ||
      document.querySelector(`[data-choice="${id}"]`)
  );
}

function focusMemberField(index, key) {
  const map = {
    name: `member-${index}-name`,
    relation: `member-${index}-relation`,
    mobile: `member-${index}-mobile`,
    gender: `member-gender-${index}`,
    meditation: `member-meditation-${index}`,
    village: `member-${index}-village`,
    city: `member-${index}-city`
  };
  const id = map[key];
  focusEl(
    (id && document.getElementById(id)) ||
      document.querySelector(`[data-choice="${id}"]`) ||
      document.querySelector(`[data-member-index="${index}"]`)
  );
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

export function SanghaWizard({
  mode = 'join',
  initialForm = null,
  initialStep = 0,
  initialOpenMember = 0,
  onExit = null
}) {
  const isProfile = mode === 'profile';
  const STEPS = isProfile ? PROFILE_STEPS : JOIN_STEPS;
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 0), STEPS.length - 1));
  const [form, setForm] = useState(() =>
    initialForm
      ? {
          ...emptyProfile(),
          ...initialForm,
          meditation: initialForm.meditation || 'new',
          place: { ...emptyProfile().place, ...(initialForm.place || {}) },
          members: Array.isArray(initialForm.members) ? initialForm.members : []
        }
      : emptyProfile()
  );
  const [openMember, setOpenMember] = useState(initialOpenMember);
  const [fieldErrors, setFieldErrors] = useState({});
  const [memberErrors, setMemberErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [camera, setCamera] = useState(null);

  useEffect(() => {
    if (window.UIkit) window.UIkit.update(document.body);
  }, [step, form.members.length, camera]);

  function leaveWizard() {
    if (onExit) onExit(form);
  }

  function clearFieldError(key) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function update(field, value) {
    setFieldErrors((prev) => {
      if (!prev[field] && !(field === 'birthDate' || field === 'birthMonth')) return prev;
      const next = { ...prev };
      delete next[field];
      if (field === 'birthDate' || field === 'birthMonth') {
        delete next.birthDate;
        delete next.birthMonth;
      }
      return next;
    });
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updatePlace(field, value) {
    clearFieldError(field);
    setForm((prev) => {
      const place = { ...prev.place, [field]: value };
      if (field === 'kind' && value === 'rural') {
        place.country = 'India';
      }
      return { ...prev, place };
    });
  }

  function applyPlaceSuggestion(item) {
    clearFieldError(form.place.kind === 'urban' ? 'city' : 'village');
    setForm((prev) => {
      const kind = prev.place.kind === 'rural' ? 'rural' : 'urban';
      const name = item.name || item.city || item.village || '';
      const next = {
        ...prev.place,
        kind,
        town: item.town || prev.place.town || '',
        district: item.district || prev.place.district || '',
        state: item.state || prev.place.state || '',
        country: item.country || prev.place.country || 'India'
      };
      if (kind === 'urban') {
        next.city = name;
        next.village = '';
      } else {
        next.village = name;
        next.city = '';
        next.country = item.country || 'India';
      }
      return { ...prev, place: next };
    });
  }

  function validateWhoFields() {
    const errors = {};
    if (!form.fullName.trim()) errors.fullName = 'Enter your full name.';
    const mobile = normalizeMobile(form.mobile);
    if (!mobile) errors.mobile = 'Enter your mobile number.';
    else if (mobile.length < 10) errors.mobile = 'Mobile needs at least 10 digits.';
    if (!form.gender) errors.gender = 'Choose gender.';
    if (!form.meditation) errors.meditation = 'Choose how long into meditation.';
    const monthMsg = birthMonthError(form);
    const dateMsg = birthDateError(form);
    if (monthMsg) errors.birthMonth = monthMsg;
    if (dateMsg) errors.birthDate = dateMsg;
    return errors;
  }

  function validatePlaceFields() {
    const errors = {};
    if (form.place.kind === 'urban') {
      if (!form.place.city.trim()) errors.city = 'Enter city.';
    } else if (!form.place.village.trim()) {
      errors.village = 'Enter village.';
    }
    return errors;
  }

  function validateFamilyFields() {
    const byIndex = {};
    form.members.forEach((member, index) => {
      const errors = validateMemberFields(member);
      if (Object.keys(errors).length) byIndex[index] = errors;
    });
    return byIndex;
  }

  function goNext() {
    setError('');
    if (STEPS[step].id === 'who') {
      const errors = validateWhoFields();
      setFieldErrors(errors);
      setMemberErrors({});
      const first = ['fullName', 'mobile', 'gender', 'meditation', 'birthDate', 'birthMonth'].find(
        (k) => errors[k]
      );
      if (first) {
        requestAnimationFrame(() => focusField(first));
        return;
      }
      rememberPyramidCenter(form.pyramidCenter);
    }
    if (STEPS[step].id === 'place') {
      const errors = validatePlaceFields();
      setFieldErrors(errors);
      setMemberErrors({});
      const first = ['village', 'city'].find((k) => errors[k]);
      if (first) {
        requestAnimationFrame(() => focusField(first));
        return;
      }
      rememberPlacePayload(form.place);
    }
    if (STEPS[step].id === 'family') {
      const byIndex = validateFamilyFields();
      setMemberErrors(byIndex);
      setFieldErrors({});
      const firstIndex = Object.keys(byIndex)
        .map(Number)
        .sort((a, b) => a - b)[0];
      if (firstIndex !== undefined) {
        setOpenMember(firstIndex);
        const firstKey = ['name', 'relation', 'mobile', 'gender', 'meditation', 'village', 'city'].find(
          (k) => byIndex[firstIndex][k]
        );
        requestAnimationFrame(() => focusMemberField(firstIndex, firstKey || 'name'));
        return;
      }
      form.members.forEach((member) => {
        if (member.addrMode === 'new') {
          rememberPlacePayload(member.place);
        }
      });
    }
    setFieldErrors({});
    setMemberErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setError('');
    setFieldErrors({});
    setMemberErrors({});
    if (step === 0 && isProfile && onExit) {
      leaveWizard();
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function finish() {
    setBusy(true);
    setError('');
    try {
      if (isProfile) {
        const res = await api.updateMyProfile(form);
        setForm({
          ...emptyProfile(),
          ...res.data,
          meditation: res.data.meditation || 'new',
          place: { ...emptyProfile().place, ...(res.data.place || {}) },
          members: Array.isArray(res.data.members) ? res.data.members : []
        });
      } else {
        const res = await api.join(form);
        setTempPassword(res.data.temporaryPassword || composedPassword(form));
      }
      setStep(STEPS.findIndex((s) => s.id === 'done'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const message = err.message || (isProfile ? 'Could not save.' : 'Could not join.');
      const mobileTaken =
        !isProfile &&
        (err.status === 409 ||
          (err.body && err.body.error && err.body.error.code === 'MOBILE_TAKEN') ||
          /already registered/i.test(message));
      if (mobileTaken) {
        const takenMsg = 'This mobile is already registered. Login to My Space instead.';
        setError(takenMsg);
        setFieldErrors({ mobile: takenMsg });
        setStep(STEPS.findIndex((s) => s.id === 'who'));
        requestAnimationFrame(() => focusField('mobile'));
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  function addMember() {
    setForm((prev) => ({ ...prev, members: [...prev.members, emptyMember()] }));
    setOpenMember(form.members.length);
  }

  function updateMember(index, next, changedField) {
    setMemberErrors((prev) => {
      const current = prev[index];
      if (!current) return prev;
      const nextErrors = { ...current };
      if (changedField) delete nextErrors[changedField];
      if (changedField === 'village' || changedField === 'city' || changedField === 'kind' || changedField === 'addrMode') {
        delete nextErrors.village;
        delete nextErrors.city;
      }
      const copy = { ...prev };
      if (Object.keys(nextErrors).length) copy[index] = nextErrors;
      else delete copy[index];
      return copy;
    });
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
    setMemberErrors((prev) => {
      const next = {};
      Object.keys(prev).forEach((key) => {
        const i = Number(key);
        if (i < index) next[i] = prev[i];
        else if (i > index) next[i - 1] = prev[i];
      });
      return next;
    });
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
        <div className={`step-bar${isProfile ? ' step-bar-split' : ''}`}>
          {isProfile ? (
            <nav className="stay-crumb" aria-label="Profile path">
              <button
                type="button"
                className="stay-crumb-link stay-crumb-current stay-crumb-exit"
                onClick={leaveWizard}
              >
                <span uk-icon="icon: reply; ratio: 0.85" aria-hidden="true" />
                My Profile
              </button>
            </nav>
          ) : null}
          <div className="step-bar-current">
            <button
              className="uk-button uk-button-text chrome-back"
              type="button"
              aria-label="Previous step"
              hidden={STEPS[step].id === 'done' || (step === 0 && !isProfile)}
              onClick={goBack}
            >
              <span uk-icon="icon: chevron-left; ratio: 0.85" />
            </button>
            <p className="step-label">
              Step {Math.min(step + 1, 5)} of 5 · {stepMeta.label}
            </p>
          </div>
        </div>
        <div className="app-progress">
          <progress
            className="uk-progress"
            value={step + 1}
            max={5}
            aria-label={isProfile ? 'Profile progress' : 'Join progress'}
          />
        </div>

        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium">
          {STEPS[step].id === 'who' && (
            <>
              <header className="x-step-head form-head">
                <h2 className="form-title">{isProfile ? 'Your details' : 'Who is joining?'}</h2>
                <p className="form-summary">
                  {isProfile
                    ? 'See and update what you shared when you joined. Changes here update your sangha profile.'
                    : 'A few details about you. Your mobile and a name-and-birthday password open My Space later.'}
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
                          className={`uk-input uk-form-small${fieldErrors.fullName ? ' uk-form-danger' : ''}`}
                          id="full-name"
                          placeholder="Ramakrishna"
                          autoComplete="name"
                          aria-invalid={fieldErrors.fullName ? 'true' : undefined}
                          aria-describedby={fieldErrors.fullName ? 'err-full-name' : undefined}
                          value={form.fullName}
                          onChange={(e) => update('fullName', e.target.value)}
                        />
                      </div>
                      <FieldError id="err-full-name" message={fieldErrors.fullName} />
                    </div>
                    <div className="x-field">
                      <label className="x-label" htmlFor="mobile">
                        Mobile
                      </label>
                      <div className="uk-inline uk-width-1-1">
                        <span className="uk-form-icon" uk-icon="icon: receiver" />
                        <input
                          className={`uk-input uk-form-small${fieldErrors.mobile ? ' uk-form-danger' : ''}${isProfile ? ' filled' : ''}`}
                          id="mobile"
                          type="tel"
                          inputMode="tel"
                          placeholder="98765 43210"
                          autoComplete="tel"
                          readOnly={isProfile}
                          aria-invalid={fieldErrors.mobile ? 'true' : undefined}
                          aria-describedby={fieldErrors.mobile ? 'err-mobile' : undefined}
                          value={form.mobile}
                          onChange={(e) => !isProfile && update('mobile', e.target.value)}
                        />
                      </div>
                      <FieldError id="err-mobile" message={fieldErrors.mobile} />
                      {!isProfile && fieldErrors.mobile && /already registered/i.test(fieldErrors.mobile) ? (
                        <p className="hint uk-margin-small-top uk-margin-remove-bottom">
                          <Link to="/login">Login to My Space</Link>
                        </p>
                      ) : null}
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
                        invalid={Boolean(fieldErrors.gender)}
                      />
                      <FieldError id="err-gender" message={fieldErrors.gender} />
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
                        invalid={Boolean(fieldErrors.meditation)}
                      />
                      <FieldError id="err-meditation" message={fieldErrors.meditation} />
                    </div>
                    <div className="x-field uk-width-1-1">
                      <label className="x-label" htmlFor="profession">
                        Work / profession
                      </label>
                      <div className="uk-inline uk-width-1-1">
                        <span className="uk-form-icon" uk-icon="icon: pencil" />
                        <input
                          className="uk-input uk-form-small"
                          id="profession"
                          type="text"
                          placeholder="Teacher, farmer, student…"
                          value={form.profession || ''}
                          onChange={(e) => update('profession', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {isProfile ? (
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
                ) : null}

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
                          className={`uk-input uk-form-small${fieldErrors.birthDate ? ' uk-form-danger' : ''}`}
                          id="birth-date"
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="15"
                          aria-invalid={fieldErrors.birthDate ? 'true' : undefined}
                          aria-describedby={fieldErrors.birthDate ? 'err-birth-date' : undefined}
                          value={form.birthDate}
                          onChange={(e) => update('birthDate', e.target.value.replace(/\D/g, '').slice(0, 2))}
                        />
                      </div>
                      <FieldError id="err-birth-date" message={fieldErrors.birthDate} />
                    </div>
                    <div className="x-field">
                      <label className="x-label" htmlFor="birth-month">
                        Month
                      </label>
                      <div className="uk-inline uk-width-1-1">
                        <span className="uk-form-icon" uk-icon="icon: calendar" />
                        <input
                          className={`uk-input uk-form-small${fieldErrors.birthMonth ? ' uk-form-danger' : ''}`}
                          id="birth-month"
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="8"
                          aria-invalid={fieldErrors.birthMonth ? 'true' : undefined}
                          aria-describedby={fieldErrors.birthMonth ? 'err-birth-month' : undefined}
                          value={form.birthMonth}
                          onChange={(e) => update('birthMonth', e.target.value.replace(/\D/g, '').slice(0, 2))}
                        />
                      </div>
                      <FieldError id="err-birth-month" message={fieldErrors.birthMonth} />
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
                      <PyramidCenterAutocomplete
                        id="center"
                        placeholder="Start typing a center or group"
                        value={form.pyramidCenter}
                        onChange={(v) => update('pyramidCenter', v)}
                      />
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
                <h2 className="form-title">{isProfile ? 'Your place' : 'Where are you from?'}</h2>
                <p className="form-summary">
                  {isProfile
                    ? 'Keep your village or city current — suggestions still help fill the rest.'
                    : 'Village or city — start typing, and we’ll fill what we know. You can always change it.'}
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
                        <PlaceAutocomplete
                          id="village"
                          kind="rural"
                          className={fieldErrors.village ? 'uk-form-danger' : ''}
                          aria-invalid={fieldErrors.village ? 'true' : undefined}
                          aria-describedby={fieldErrors.village ? 'err-village' : undefined}
                          value={form.place.village}
                          onChange={(v) => updatePlace('village', v)}
                          onSelect={applyPlaceSuggestion}
                          placeholder="Start typing a village"
                        />
                        <FieldError id="err-village" message={fieldErrors.village} />
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
                        <PlaceAutocomplete
                          id="city"
                          kind="urban"
                          className={fieldErrors.city ? 'uk-form-danger' : ''}
                          aria-invalid={fieldErrors.city ? 'true' : undefined}
                          aria-describedby={fieldErrors.city ? 'err-city' : undefined}
                          value={form.place.city}
                          onChange={(v) => updatePlace('city', v)}
                          onSelect={applyPlaceSuggestion}
                          placeholder="Start typing a city (India, US, UK)"
                        />
                        <FieldError id="err-city" message={fieldErrors.city} />
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
                <h2 className="form-title">{isProfile ? 'Your family' : 'Family with you'}</h2>
                <p className="form-summary">
                  {isProfile
                    ? 'Add or update family linked to your profile. Leave empty if you are alone.'
                    : 'Coming with family? Add them here. Alone? Just continue.'}
                </p>
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
                    errors={memberErrors[index] || {}}
                    onToggle={() => setOpenMember(openMember === index ? -1 : index)}
                    onChange={(next, field) => updateMember(index, next, field)}
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
                <h2 className="form-title">{isProfile ? 'Review your profile' : 'Review & finish'}</h2>
                <p className="form-summary">
                  {isProfile
                    ? 'Check everything once. Save to keep these updates on your sangha profile.'
                    : 'A quick look before you join. Change anything with Back, then Finish.'}
                </p>
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
                  <SummaryRow label="Profession" value={form.profession || '—'} />
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
                        m.profession,
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
              {error ? (
                <div className="uk-alert-danger" uk-alert="" role="alert">
                  <p className="uk-margin-remove">{error}</p>
                  {!isProfile && /already registered/i.test(error) ? (
                    <p className="uk-margin-small-top uk-margin-remove-bottom">
                      <Link to="/login">Go to Login to My Space</Link>
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="step-actions">
                <button
                  className="uk-button uk-button-primary uk-width-1-1"
                  type="button"
                  onClick={finish}
                  disabled={busy}
                >
                  {busy ? 'Saving…' : isProfile ? 'Save profile' : 'Finish'}
                </button>
              </div>
            </>
          )}

          {STEPS[step].id === 'done' && (
            <>
              <header className="x-step-head form-head">
                <h2 className="form-title">{isProfile ? 'Profile saved' : 'You’re in'}</h2>
                <p className="form-summary">
                  {isProfile
                    ? 'Your sangha profile is up to date. You can open any photo again to edit more.'
                    : tempPassword
                      ? 'Welcome to the sangha. Login with your mobile number and this password.'
                      : 'Welcome to the sangha. Login with your mobile number and your name-and-birthday password.'}
                </p>
              </header>
              {!isProfile && tempPassword ? (
                <p className="password-line uk-margin-small-bottom">Password: {tempPassword}</p>
              ) : null}
              <div className={`step-actions${isProfile ? ' is-split' : ''}`}>
                {isProfile ? (
                  <>
                    <Link className="step-actions-side" to="/password">
                      Change my password
                    </Link>
                    <button className="uk-button uk-button-primary" type="button" onClick={leaveWizard}>
                      Back to photos
                    </button>
                  </>
                ) : (
                  <Link className="uk-button uk-button-primary uk-width-1-1" to="/login">
                    Login to My Space
                  </Link>
                )}
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
