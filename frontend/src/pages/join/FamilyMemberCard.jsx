import { normalizeMobile } from '../../utils/password.js';
import { AGE_OPTS, ChipGroup, GENDER_OPTS, MEDITATION_OPTS } from './ChipGroup.jsx';
import { FieldError } from './FieldError.jsx';
import { PlaceAutocomplete } from './PlaceAutocomplete.jsx';
import { PhotoSlot } from './PhotoSlot.jsx';

export function validateMemberFields(member) {
  const errors = {};
  if (!String(member.name || '').trim()) errors.name = 'Enter name.';
  if (!String(member.relation || '').trim()) errors.relation = 'Enter relation.';
  const mobile = normalizeMobile(member.mobile);
  if (mobile && mobile.length < 10) errors.mobile = 'Mobile needs at least 10 digits.';
  if (!member.gender) errors.gender = 'Choose gender.';
  if (!member.meditation) errors.meditation = 'Choose how long into meditation.';
  if (member.addrMode === 'new') {
    if (member.place?.kind === 'urban') {
      if (!String(member.place.city || '').trim()) errors.city = 'Enter city.';
    } else if (!String(member.place?.village || '').trim()) {
      errors.village = 'Enter village.';
    }
  }
  return errors;
}

export function FamilyMemberCard({
  index,
  member,
  open,
  errors = {},
  onToggle,
  onChange,
  onRemove,
  onPhoto
}) {
  const personNo = index + 2;
  const sub =
    [member.name, member.relation].filter(Boolean).join(' · ') || 'New family member';
  const prefix = `member-${index}`;

  function set(field, value) {
    onChange({ ...member, [field]: value }, field);
  }

  function setPlace(field, value) {
    const place = { ...member.place, [field]: value };
    if (field === 'kind' && value === 'rural') {
      place.country = 'India';
    }
    onChange({ ...member, place }, field);
  }

  function applyPlaceSuggestion(item) {
    const kind = member.place.kind === 'rural' ? 'rural' : 'urban';
    const name = item.name || item.city || item.village || '';
    const place = {
      ...member.place,
      kind,
      town: item.town || member.place.town || '',
      district: item.district || member.place.district || '',
      state: item.state || member.place.state || '',
      country: item.country || member.place.country || 'India'
    };
    if (kind === 'urban') {
      place.city = name;
      place.village = '';
    } else {
      place.village = name;
      place.city = '';
    }
    onChange({ ...member, place }, kind === 'urban' ? 'city' : 'village');
  }

  return (
    <article
      className={`member x-member${open ? ' is-open' : ''}${Object.keys(errors).length ? ' has-errors' : ''}`}
      data-member-index={index}
    >
      <header className="x-member-head">
        <button type="button" className="x-member-toggle" aria-expanded={open} onClick={onToggle}>
          <span className="x-member-badge">{personNo}</span>
          <span className="x-member-title">
            <span className="person-no">Person {personNo}</span>
            <span className="x-member-sub">{sub}</span>
          </span>
          <span className="x-member-chevron" uk-icon="icon: chevron-down; ratio: 0.85" />
        </button>
        <button className="uk-button uk-button-text uk-button-small" type="button" onClick={onRemove}>
          Remove
        </button>
      </header>
      {!open && Object.keys(errors).length > 0 ? (
        <p className="x-field-error x-member-collapsed-error">Fix the details for this person, then continue.</p>
      ) : null}
      {open ? (
        <div className="x-member-body">
          <section className="x-group">
            <h4 className="x-group-title">
              <span uk-icon="icon: user; ratio: 0.75" /> Identity
            </h4>
            <div className="uk-grid-small uk-child-width-1-1 uk-child-width-1-2@s" uk-grid="">
              <div className="x-field">
                <label className="x-label" htmlFor={`${prefix}-name`}>
                  Name
                </label>
                <div className="uk-inline uk-width-1-1">
                  <span className="uk-form-icon" uk-icon="icon: user" />
                  <input
                    className={`uk-input uk-form-small${errors.name ? ' uk-form-danger' : ''}`}
                    id={`${prefix}-name`}
                    type="text"
                    aria-invalid={errors.name ? 'true' : undefined}
                    aria-describedby={errors.name ? `${prefix}-err-name` : undefined}
                    value={member.name}
                    onChange={(e) => set('name', e.target.value)}
                  />
                </div>
                <FieldError id={`${prefix}-err-name`} message={errors.name} />
              </div>
              <div className="x-field">
                <label className="x-label" htmlFor={`${prefix}-relation`}>
                  Relation
                </label>
                <div className="uk-inline uk-width-1-1">
                  <span className="uk-form-icon" uk-icon="icon: users" />
                  <input
                    className={`uk-input uk-form-small${errors.relation ? ' uk-form-danger' : ''}`}
                    id={`${prefix}-relation`}
                    type="text"
                    list="relation-list"
                    placeholder="Spouse, child, parent"
                    aria-invalid={errors.relation ? 'true' : undefined}
                    aria-describedby={errors.relation ? `${prefix}-err-relation` : undefined}
                    value={member.relation}
                    onChange={(e) => set('relation', e.target.value)}
                  />
                </div>
                <FieldError id={`${prefix}-err-relation`} message={errors.relation} />
              </div>
              <div className="x-field">
                <label className="x-label" htmlFor={`${prefix}-mobile`}>
                  Mobile <span className="uk-text-muted">(optional)</span>
                </label>
                <div className="uk-inline uk-width-1-1">
                  <span className="uk-form-icon" uk-icon="icon: receiver" />
                  <input
                    className={`uk-input uk-form-small${errors.mobile ? ' uk-form-danger' : ''}`}
                    id={`${prefix}-mobile`}
                    type="tel"
                    aria-invalid={errors.mobile ? 'true' : undefined}
                    aria-describedby={errors.mobile ? `${prefix}-err-mobile` : undefined}
                    value={member.mobile}
                    onChange={(e) => set('mobile', e.target.value)}
                  />
                </div>
                <FieldError id={`${prefix}-err-mobile`} message={errors.mobile} />
              </div>
            </div>
          </section>

          <section className="x-group">
            <h4 className="x-group-title">
              <span uk-icon="icon: tag; ratio: 0.75" /> Profile
            </h4>
            <div className="uk-grid-small uk-child-width-1-1 uk-child-width-1-2@s" uk-grid="">
              <div className="x-field">
                <span className="x-label">Gender</span>
                <ChipGroup
                  name={`member-gender-${index}`}
                  value={member.gender}
                  onChange={(v) => set('gender', v)}
                  options={GENDER_OPTS}
                  invalid={Boolean(errors.gender)}
                />
                <FieldError id={`${prefix}-err-gender`} message={errors.gender} />
              </div>
              <div className="x-field">
                <span className="x-label">Age group</span>
                <ChipGroup
                  name={`member-age-${index}`}
                  value={member.age}
                  onChange={(v) => set('age', v)}
                  options={AGE_OPTS}
                />
              </div>
              <div className="x-field uk-width-1-1">
                <span className="x-label">How long into meditation?</span>
                <ChipGroup
                  name={`member-meditation-${index}`}
                  value={member.meditation}
                  onChange={(v) => set('meditation', v)}
                  options={MEDITATION_OPTS}
                  invalid={Boolean(errors.meditation)}
                />
                <FieldError id={`${prefix}-err-meditation`} message={errors.meditation} />
              </div>
            </div>
          </section>

          <section className="x-group">
            <h4 className="x-group-title">
              <span uk-icon="icon: location; ratio: 0.75" /> Address
            </h4>
            <div className="x-field">
              <ChipGroup
                name={`addr-mode-${index}`}
                value={member.addrMode}
                onChange={(v) => set('addrMode', v)}
                options={[
                  { value: 'same', label: 'Same as mine' },
                  { value: 'new', label: 'New address' }
                ]}
              />
              {member.addrMode === 'same' ? (
                <p className="hint uk-margin-small-top uk-margin-remove-bottom">Uses your place from step 2.</p>
              ) : null}
            </div>
            {member.addrMode === 'new' ? (
              <div className="member-addr">
                <ul className="uk-tab x-place-tabs">
                  <li className={member.place.kind === 'rural' ? 'uk-active' : undefined}>
                    <a
                      href="#rural"
                      onClick={(e) => {
                        e.preventDefault();
                        setPlace('kind', 'rural');
                      }}
                    >
                      Rural
                    </a>
                  </li>
                  <li className={member.place.kind === 'urban' ? 'uk-active' : undefined}>
                    <a
                      href="#urban"
                      onClick={(e) => {
                        e.preventDefault();
                        setPlace('kind', 'urban');
                      }}
                    >
                      Urban
                    </a>
                  </li>
                </ul>
                {member.place.kind === 'rural' ? (
                  <div className="uk-grid-small uk-child-width-1-1 uk-child-width-1-2@s uk-margin-small-top" uk-grid="">
                    <div className="x-field">
                      <label className="x-label" htmlFor={`${prefix}-village`}>
                        Village
                      </label>
                      <PlaceAutocomplete
                        id={`${prefix}-village`}
                        kind="rural"
                        className={errors.village ? 'uk-form-danger' : ''}
                        aria-invalid={errors.village ? 'true' : undefined}
                        aria-describedby={errors.village ? `${prefix}-err-village` : undefined}
                        value={member.place.village}
                        onChange={(v) => setPlace('village', v)}
                        onSelect={applyPlaceSuggestion}
                        placeholder="Start typing a village"
                      />
                      <FieldError id={`${prefix}-err-village`} message={errors.village} />
                    </div>
                    <div className="x-field">
                      <label className="x-label">Town</label>
                      <input
                        className="uk-input uk-form-small"
                        value={member.place.town}
                        onChange={(e) => setPlace('town', e.target.value)}
                      />
                    </div>
                    <div className="x-field uk-width-1-1">
                      <label className="x-label">District</label>
                      <input
                        className="uk-input uk-form-small"
                        value={member.place.district}
                        onChange={(e) => setPlace('district', e.target.value)}
                      />
                    </div>
                    <div className="x-field">
                      <label className="x-label">State</label>
                      <input
                        className="uk-input uk-form-small"
                        value={member.place.state}
                        onChange={(e) => setPlace('state', e.target.value)}
                      />
                    </div>
                    <div className="x-field">
                      <label className="x-label">Country</label>
                      <input className="uk-input uk-form-small filled" value="India" readOnly />
                    </div>
                  </div>
                ) : (
                  <div className="uk-grid-small uk-child-width-1-1 uk-child-width-1-2@s uk-margin-small-top" uk-grid="">
                    <div className="x-field uk-width-1-1">
                      <label className="x-label" htmlFor={`${prefix}-city`}>
                        City
                      </label>
                      <PlaceAutocomplete
                        id={`${prefix}-city`}
                        kind="urban"
                        className={errors.city ? 'uk-form-danger' : ''}
                        aria-invalid={errors.city ? 'true' : undefined}
                        aria-describedby={errors.city ? `${prefix}-err-city` : undefined}
                        value={member.place.city}
                        onChange={(v) => setPlace('city', v)}
                        onSelect={applyPlaceSuggestion}
                        placeholder="Start typing a city (India, US, UK)"
                      />
                      <FieldError id={`${prefix}-err-city`} message={errors.city} />
                    </div>
                    <div className="x-field">
                      <label className="x-label">State</label>
                      <input
                        className="uk-input uk-form-small"
                        value={member.place.state}
                        onChange={(e) => setPlace('state', e.target.value)}
                      />
                    </div>
                    <div className="x-field">
                      <label className="x-label">Country</label>
                      <input
                        className="uk-input uk-form-small"
                        value={member.place.country || 'India'}
                        onChange={(e) => setPlace('country', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </section>

          <section className="x-group">
            <h4 className="x-group-title">
              <span uk-icon="icon: camera; ratio: 0.75" /> Photo &amp; ID <span className="x-advised">advised</span>
            </h4>
            <div className="x-photo-bar">
              <PhotoSlot kind="live" preview={member.livePhoto} onOpen={() => onPhoto(index, 'live')} label="Take live photo" />
              <PhotoSlot
                kind="proof"
                preview={member.idProofPhoto}
                onOpen={() => onPhoto(index, 'proof')}
                label="Take ID proof photo"
              />
              <div className="x-photo-type">
                <label className="x-label">ID type</label>
                <select
                  className="uk-select uk-form-small"
                  value={member.idType}
                  onChange={(e) => set('idType', e.target.value)}
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
        </div>
      ) : null}
    </article>
  );
}
