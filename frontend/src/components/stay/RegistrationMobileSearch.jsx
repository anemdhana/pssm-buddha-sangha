export function RegistrationMobileSearch({ value, onChange, onClear }) {
  return (
    <div className="x-field uk-margin-remove">
      <label className="x-label uk-text-meta" htmlFor="reg-mobile-search">
        Search by mobile
      </label>
      <div className="uk-inline uk-width-1-1">
        <span className="uk-form-icon" uk-icon="icon: receiver" />
        <input
          className="uk-input uk-form-small"
          id="reg-mobile-search"
          type="tel"
          inputMode="tel"
          placeholder="Digits anywhere in family mobile"
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
