export function RegistrationStatsBar({ stats, filteredFamilies, searchActive }) {
  const { families, people, rural, urban } = stats;
  const showing = filteredFamilies ?? families;
  return (
    <p className="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">
      {searchActive ? (
        <>
          Showing {showing} of {families} {families === 1 ? 'family' : 'families'}
        </>
      ) : (
        <>
          {families} {families === 1 ? 'family' : 'families'} · {people}{' '}
          {people === 1 ? 'person' : 'people'} total
        </>
      )}
      {!searchActive && people > 0 ? (
        <>
          {' '}
          · {rural} rural · {urban} urban
        </>
      ) : null}
    </p>
  );
}
