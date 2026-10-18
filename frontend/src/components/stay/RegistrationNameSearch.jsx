export function RegistrationNameSearch({ value, onChange, onClear, compact = false }) {
  return (
    <div className={`x-field uk-margin-remove${compact ? ' x-interest-search-compact' : ''}`}>
      {compact ? (
        <label className="uk-hidden" htmlFor="reg-name-search">
          Search by name
        </label>
      ) : (
        <label className="x-label uk-text-meta" htmlFor="reg-name-search">
          Search by name
        </label>
      )}
      <div className="uk-inline uk-width-1-1">
        <span className="uk-form-icon" uk-icon="icon: search" />
        <input
          className="uk-input uk-form-small"
          id="reg-name-search"
          type="search"
          autoComplete="off"
          aria-label={compact ? 'Search by name' : undefined}
          placeholder={compact ? 'Search name' : 'Letters anywhere in the name'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value ? (
          <button
            className="uk-form-icon uk-form-icon-flip uk-button uk-button-link"
            type="button"
            aria-label="Clear search"
            onClick={onClear}
          >
            <span uk-icon="icon: close; ratio: 0.8" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
