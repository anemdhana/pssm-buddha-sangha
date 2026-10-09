import { Link } from 'react-router-dom';

export function StayComingSoonPage() {
  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column app-narrow">
        <div className="uk-card uk-card-default uk-card-small uk-card-body uk-box-shadow-medium">
          <header className="x-step-head form-head">
            <h2 className="form-title">Accommodation</h2>
            <p className="form-summary">Free and Paid Stay will land in the next module. Join and My Space are ready now.</p>
          </header>
          <p className="hint">Coming soon — smart allotment and receptionist desk are not in this React pass.</p>
          <div className="step-actions">
            <Link className="uk-button uk-button-primary uk-width-1-1" to="/">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
