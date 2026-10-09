export function PhotoSlot({ kind, preview, onOpen, label }) {
  const isId = kind === 'proof';
  return (
    <button
      type="button"
      className={`x-pass-shot${isId ? ' x-pass-shot--id' : ''}${preview ? ' has-photo' : ''}`}
      onClick={onOpen}
      aria-label={label}
    >
      {preview ? <img className="x-pass-shot-img" src={preview} alt="" /> : null}
      {!preview ? (
        <span className="x-pass-shot-ph" uk-icon={`icon: ${isId ? 'file-text' : 'camera'}; ratio: 0.85`} />
      ) : null}
      <span className="x-pass-shot-label">{isId ? 'ID' : 'Photo'}</span>
    </button>
  );
}
