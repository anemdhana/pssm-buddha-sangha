import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';
import { ASSIGNABLE_ROLE_IDS, roleLabel } from '../utils/password.js';

export function AdminPage() {
  const { isPssmAdmin, refresh } = useAuth();
  const [canClaim, setCanClaim] = useState(false);
  const [query, setQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [matches, setMatches] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState(null);
  const [roleDraft, setRoleDraft] = useState([]);
  const [personError, setPersonError] = useState('');

  useEffect(() => {
    if (!isPssmAdmin) {
      try {
        setCanClaim(api.countPssmAdmins() === 0);
      } catch {
        setCanClaim(false);
      }
    } else {
      setCanClaim(false);
    }
  }, [isPssmAdmin]);

  async function onClaim() {
    try {
      await api.claimAdmin();
      await refresh();
      setCanClaim(false);
    } catch (err) {
      setSearchError(err.message);
    }
  }

  async function onSearch(e) {
    e.preventDefault();
    setSearchError('');
    setSelected(null);
    try {
      const res = await api.searchPeople(query);
      setMatches(res.data || []);
      setCollapsed(true);
    } catch (err) {
      setMatches([]);
      setCollapsed(false);
      setSearchError(err.message || 'No person found.');
    }
  }

  function selectPerson(person) {
    setSelected(person);
    setRoleDraft(person.roles.filter((r) => ASSIGNABLE_ROLE_IDS.includes(r)));
    setPersonError('');
  }

  function toggleRole(roleId) {
    setRoleDraft((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  }

  async function saveRoles() {
    if (!selected) return;
    setPersonError('');
    try {
      const res = await api.updateRoles(selected.mobile, roleDraft);
      const next = { ...selected, roles: res.data.roles };
      setSelected(next);
      setMatches((list) => list.map((p) => (p.mobile === next.mobile ? next : p)));
      setRoleDraft(res.data.roles.filter((r) => ASSIGNABLE_ROLE_IDS.includes(r)));
      if (window.UIkit) {
        window.UIkit.notification({ message: 'Roles saved.', status: 'success', pos: 'top-center', timeout: 2000 });
      }
    } catch (err) {
      setPersonError(err.message);
    }
  }

  async function removePerson() {
    if (!selected) return;
    const ok = window.confirm(`Remove ${selected.fullName || selected.mobile} from the sangha?`);
    if (!ok) return;
    setPersonError('');
    try {
      await api.removePerson(selected.mobile);
      setMatches((list) => list.filter((p) => p.mobile !== selected.mobile));
      setSelected(null);
      if (window.UIkit) {
        window.UIkit.notification({ message: 'Person removed.', status: 'success', pos: 'top-center', timeout: 2000 });
      }
    } catch (err) {
      setPersonError(err.message);
    }
  }

  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column app-narrow">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium">
          <header className="x-step-head form-head">
            <h2 className="form-title">People &amp; roles</h2>
            <p className="form-summary">Find a person by mobile, set their roles, or remove them from the sangha.</p>
          </header>

          {canClaim && (
            <div className="x-group">
              <h3 className="x-group-title">
                <span uk-icon="icon: star; ratio: 0.75" /> Prototype bootstrap
              </h3>
              <p className="hint uk-margin-remove-top">
                No PSSM Admin is assigned yet. Claim it for your signed-in account to open this desk.
              </p>
              <button className="uk-button uk-button-primary uk-width-1-1" type="button" onClick={onClaim}>
                Become PSSM Admin
              </button>
            </div>
          )}

          {!isPssmAdmin && !canClaim && (
            <div className="x-group">
              <h3 className="x-group-title">
                <span uk-icon="icon: lock; ratio: 0.75" /> PSSM Admin only
              </h3>
              <p className="hint uk-margin-remove-top">
                This landing is for PSSM Admin. Login with an admin account, or claim admin above when none exists yet.
              </p>
              <Link className="uk-button uk-button-default uk-width-1-1" to="/">
                Back to home
              </Link>
            </div>
          )}

          {isPssmAdmin && (
            <div>
              {collapsed && (
                <section className="x-group">
                  <h3 className="x-group-title">
                    <span uk-icon="icon: search; ratio: 0.75" /> Search
                  </h3>
                  <div className="x-admin-search-bar">
                    <div>
                      <div className="x-admin-name">
                        {matches.length === 1 ? '1 person found' : `${matches.length} people found`}
                      </div>
                      <div className="x-admin-meta">Mobile · {query || '—'}</div>
                    </div>
                    <button
                      className="uk-button uk-button-default uk-button-small"
                      type="button"
                      onClick={() => setCollapsed(false)}
                    >
                      Change
                    </button>
                  </div>
                </section>
              )}

              {!collapsed && (
                <form className="uk-form-stacked" onSubmit={onSearch}>
                  <section className="x-group">
                    <h3 className="x-group-title">
                      <span uk-icon="icon: search; ratio: 0.75" /> Find person
                    </h3>
                    <div className="x-field">
                      <label className="x-label" htmlFor="search-mobile">
                        Mobile number
                      </label>
                      <input
                        className="uk-input uk-form-small"
                        id="search-mobile"
                        type="tel"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="98765 43210"
                      />
                    </div>
                    {searchError && (
                      <p className="hint" role="alert">
                        {searchError}
                      </p>
                    )}
                    <div className="x-admin-actions uk-margin-top">
                      <button className="uk-button uk-button-primary" type="submit">
                        Search
                      </button>
                    </div>
                  </section>
                </form>
              )}

              {matches.length > 0 && (
                <section className="x-group">
                  <h3 className="x-group-title">
                    <span uk-icon="icon: users; ratio: 0.75" /> Results{' '}
                    <span className="x-admin-count">({matches.length})</span>
                  </h3>
                  <div className="x-admin-results" role="list">
                    {matches.map((person) => (
                      <button
                        key={person.mobile}
                        type="button"
                        className={`x-admin-result${selected && selected.mobile === person.mobile ? ' is-selected' : ''}`}
                        role="listitem"
                        onClick={() => selectPerson(person)}
                      >
                        <span className="x-admin-result-main">
                          <span className="x-admin-name">{person.fullName || 'Unnamed'}</span>
                          <span className="x-admin-meta">
                            {person.mobile}
                            {person.pyramidCenter ? ` · ${person.pyramidCenter}` : ''}
                          </span>
                        </span>
                        <span className="x-role-chips">
                          {person.roles.length === 0 && <span className="x-role-empty">No roles yet</span>}
                          {person.roles.map((id) => (
                            <span className="x-role-chip" key={id}>
                              {roleLabel(id)}
                            </span>
                          ))}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {selected && (
                <section className="x-group">
                  <h3 className="x-group-title">
                    <span uk-icon="icon: user; ratio: 0.75" /> Roles
                  </h3>
                  <div className="x-admin-person">
                    <div>
                      <div className="x-admin-name">{selected.fullName || 'Unnamed'}</div>
                      <div className="x-admin-meta">{selected.mobile}</div>
                    </div>
                    <div className="x-role-chips">
                      {selected.roles.length === 0 && <span className="x-role-empty">No roles yet</span>}
                      {selected.roles.map((id) => (
                        <span className="x-role-chip" key={id}>
                          {roleLabel(id)}
                        </span>
                      ))}
                    </div>
                    <div className="x-field">
                      <span className="x-label">Assign roles</span>
                      <div className="x-chips">
                        {ASSIGNABLE_ROLE_IDS.map((id) => (
                          <label className="x-chip" key={id}>
                            <input
                              type="checkbox"
                              checked={roleDraft.includes(id)}
                              onChange={() => toggleRole(id)}
                            />
                            <span>{roleLabel(id)}</span>
                          </label>
                        ))}
                      </div>
                      <p className="hint uk-margin-small-top uk-margin-remove-bottom">Tick to assign, untick to remove.</p>
                    </div>
                    <div className="x-admin-actions">
                      <button className="uk-button uk-button-primary" type="button" onClick={saveRoles}>
                        Save roles
                      </button>
                      <button className="uk-button uk-button-danger" type="button" onClick={removePerson}>
                        Remove person
                      </button>
                    </div>
                    {personError && (
                      <p className="hint" role="alert">
                        {personError}
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
