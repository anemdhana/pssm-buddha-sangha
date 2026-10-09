import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export function ProtectedRoute({ children, role }) {
  const { loading, signedIn, hasRole } = useAuth();
  if (loading) {
    return (
      <main className="uk-section uk-section-small">
        <div className="uk-container app-column app-narrow">
          <p className="hint">Loading…</p>
        </div>
      </main>
    );
  }
  if (!signedIn) return <Navigate to="/login" replace />;
  if (role && !hasRole(role)) return <Navigate to="/" replace />;
  return children;
}
