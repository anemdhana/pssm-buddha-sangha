export function RegistrationStatsBar({ stats, filteredFamilies, searchActive, filteredLabel }) {
  const { families, people, rural, urban } = stats;
  const showing = filteredFamilies ?? families;
  const unit = filteredLabel === 'people' ? (showing === 1 ? 'person' : 'people') : null;
  return (
    <p className="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">
      {searchActive ? (
        unit ? (
          <>
            Showing {showing} of {people} {people === 1 ? 'person' : 'people'}
          </>
        ) : (
          <>
            Showing {showing} of {families} {families === 1 ? 'family' : 'families'}
          </>
        )
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
