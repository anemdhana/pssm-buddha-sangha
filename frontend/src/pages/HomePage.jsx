import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

function Tile({ to, icon, title, meta }) {
  return (
    <div>
      <Link className="uk-card uk-card-default uk-card-hover uk-card-body uk-card-small uk-link-reset" to={to}>
        <div className="uk-grid-small uk-flex-middle" uk-grid="">
          <div className="uk-width-auto">
            <span className="app-tile-icon" uk-icon={`icon: ${icon}; ratio: 1.1`} />
          </div>
          <div className="uk-width-expand">
            <div className="uk-text-bold">{title}</div>
            <div className="uk-text-meta">{meta}</div>
          </div>
          <div className="uk-width-auto uk-text-muted">
            <span uk-icon="icon: chevron-right" />
          </div>
        </div>
      </Link>
    </div>
  );
}

export function HomePage() {
  const { signedIn, isPssmAdmin } = useAuth();

  return (
    <main className="uk-section uk-section-small uk-padding-remove-top">
      <div className="uk-container app-column">
        <header className="form-head">
          <h2 className="form-title">PSSM Buddha Sangha</h2>
          <p className="form-summary">
            {signedIn
              ? 'Your sangha space. Open My Profile anytime, or choose accommodation for an event.'
              : 'A club of Buddhas. Join with your details and family, or login to My Space with your mobile and password.'}
          </p>
        </header>
        <div className="uk-grid-small uk-child-width-1-1" uk-grid="">
          {!signedIn && (
            <>
              <Tile to="/join" icon="users" title="Join PSSM Buddha Sangha" meta="You and family with you" />
              <Tile to="/login" icon="sign-in" title="Login to My Space" meta="Mobile number and password" />
            </>
          )}
          {signedIn && isPssmAdmin && (
            <Tile to="/admin" icon="users" title="People & roles" meta="Search by mobile · assign roles · remove" />
          )}
          {signedIn && (
            <Tile to="/profile" icon="user" title="My Profile" meta="See and update your sangha details" />
          )}
        </div>
        {signedIn && (
          <>
            <header className="form-head uk-margin-medium-top">
              <h2 className="form-title">Accommodation</h2>
              <p className="form-summary">Choose free or paid stay for the event.</p>
            </header>
            <div className="uk-grid-small uk-child-width-1-1 uk-child-width-1-2@s" uk-grid="">
              <Tile to="/stay" icon="home" title="Free Accommodation" meta="Event stay at no charge" />
              <Tile to="/stay" icon="credit-card" title="Paid Accommodation" meta="Self-booked stay" />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
