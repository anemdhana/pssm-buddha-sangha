import { Link } from 'react-router-dom';
import { formatBookedAt, formatEventDate } from '../../utils/password.js';
import {
  planLabel,
  registrationPersonCount,
  registrationPlaceLabel,
  primaryGuest
} from '../../utils/stayRegistrations.js';
import { RegistrationMobileSearch } from './RegistrationMobileSearch.jsx';

function stayRange(start, end) {
  const a = formatEventDate(start);
  const b = formatEventDate(end);
  if (a && b) return `${a} – ${b}`;
  return a || b || '—';
}

function genderLabel(gender) {
  if (gender === 'male') return 'Male';
  if (gender === 'female') return 'Female';
  return gender || '—';
}

export function RegistrationsTable({ rows, mobileSearch, onMobileSearchChange, onMobileSearchClear }) {
  return (
    <div className="x-reg-table-wrap">
      <div className="x-reg-table-head">
        <RegistrationMobileSearch
          value={mobileSearch}
          onChange={onMobileSearchChange}
          onClear={onMobileSearchClear}
        />
      </div>
      <div className="uk-overflow-auto">
      <table className="uk-table uk-table-small uk-table-divider uk-table-middle uk-table-responsive x-reg-table">
        <thead>
          <tr>
            <th scope="col">Registered</th>
            <th scope="col">Main person</th>
            <th scope="col">Mobile</th>
            <th scope="col">Place</th>
            <th scope="col">Family</th>
            <th scope="col">Plan</th>
            <th scope="col">Stay</th>
            <th scope="col" className="uk-table-shrink">
              Edit
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="uk-text-muted">
                No matching registrations.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const primary = primaryGuest(row);
              const familyCount = row.familyCount ?? Math.max(0, registrationPersonCount(row) - 1);
              const editPlan = row.plan === 'paid' ? 'paid' : 'free';
              return (
                <tr key={row.id}>
                  <td>{formatBookedAt(row.bookedAt || row.createdAt)}</td>
                  <td>
                    <span className="uk-text-bold">{row.familyFullName || primary?.name || '—'}</span>
                    <div className="uk-text-meta">
                      {genderLabel(primary?.gender)}
                      {primary?.age ? ` · ${primary.age}` : ''}
                    </div>
                  </td>
                  <td>{row.familyMobile || '—'}</td>
                  <td>{registrationPlaceLabel(row)}</td>
                  <td>{familyCount === 0 ? 'Alone' : `+${familyCount}`}</td>
                  <td>{planLabel(row.plan)}</td>
                  <td>{stayRange(primary?.stayStartDate, primary?.stayEndDate)}</td>
                  <td className="uk-text-right">
                    <Link
                      className="uk-button uk-button-default uk-button-small"
                      to={`/stay/edit/${encodeURIComponent(row.id)}?plan=${editPlan}`}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
