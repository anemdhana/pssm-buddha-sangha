import { AGE_OPTS, ChipGroup, GENDER_OPTS, MEDITATION_OPTS } from './ChipGroup.jsx';
import { PhotoSlot } from './PhotoSlot.jsx';

export function FamilyMemberCard({ index, member, open, onToggle, onChange, onRemove, onPhoto }) {
  const personNo = index + 2;
  const sub =
    [member.name, member.relation].filter(Boolean).join(' · ') || 'New family member';

  function set(field, value) {
    onChange({ ...member, [field]: value });
  }

  function setPlace(field, value) {
    onChange({ ...member, place: { ...member.place, [field]: value } });
  }

  return (
    <article className={`member x-member${open ? ' is-open' : ''}`}>
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
      {open ? (
        <div className="x-member-body">
          <section className="x-group">
            <h4 className="x-group-title">
              <span uk-icon="icon: user; ratio: 0.75" /> Identity
            </h4>
            <div className="uk-grid-small uk-child-width-1-1 uk-child-width-1-2@s" uk-grid="">
              <div className="x-field">
                <label className="x-label">Name</label>
                <div className="uk-inline uk-width-1-1">
                  <span className="uk-form-icon" uk-icon="icon: user" />
                  <input
                    className="uk-input uk-form-small"
                    type="text"
                    value={member.name}
                    onChange={(e) => set('name', e.target.value)}
                  />
                </div>
              </div>
              <div className="x-field">
                <label className="x-label">Relation</label>
                <div className="uk-inline uk-width-1-1">
                  <span className="uk-form-icon" uk-icon="icon: users" />
                  <input
                    className="uk-input uk-form-small"
                    type="text"
                    list="relation-list"
                    placeholder="Spouse, child, parent"
                    value={member.relation}
                    onChange={(e) => set('relation', e.target.value)}
                  />
                </div>
              </div>
              <div className="x-field">
                <label className="x-label">
                  Mobile <span className="uk-text-muted">(optional)</span>
                </label>
                <div className="uk-inline uk-width-1-1">
                  <span className="uk-form-icon" uk-icon="icon: receiver" />
                  <input
                    className="uk-input uk-form-small"
                    type="tel"
                    value={member.mobile}
                    onChange={(e) => set('mobile', e.target.value)}
                  />
                </div>
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
                />
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
                />
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
                      <label className="x-label">Village</label>
                      <input
                        className="uk-input uk-form-small"
                        value={member.place.village}
                        onChange={(e) => setPlace('village', e.target.value)}
                      />
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
                      <label className="x-label">City</label>
                      <input
                        className="uk-input uk-form-small"
                        value={member.place.city}
                        onChange={(e) => setPlace('city', e.target.value)}
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
