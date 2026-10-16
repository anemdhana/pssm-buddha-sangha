import { Link } from 'react-router-dom';

/** Compact Stay path: Stay › Hotels & rooms › Add hotel */
export function StayBreadcrumb({ crumbs }) {
  const trail = Array.isArray(crumbs) ? crumbs.filter((c) => c && c.label) : [];
  if (trail.length === 0) return null;

  return (
    <nav className="stay-crumb stay-crumb-page" aria-label="Stay path">
      {trail.map((crumb, index) => {
        const last = index === trail.length - 1;
        const to = crumb.to ? String(crumb.to) : '';
        return (
          <span key={`${crumb.label}-${index}`} className="stay-crumb-item">
            {index > 0 ? (
              <span
                className="stay-crumb-sep"
                uk-icon="icon: chevron-right; ratio: 0.7"
                aria-hidden="true"
              />
            ) : null}
            {to && !last ? (
              <Link className="stay-crumb-link" to={to}>
                {crumb.label}
              </Link>
            ) : (
              <span className="stay-crumb-current" aria-current={last ? 'page' : undefined}>
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
