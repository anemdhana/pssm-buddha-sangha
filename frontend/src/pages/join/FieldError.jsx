export function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p className="x-field-error" id={id} role="alert">
      {message}
    </p>
  );
}
