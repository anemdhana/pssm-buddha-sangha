export function ChipGroup({ name, value, onChange, options, invalid = false }) {
  return (
    <div
      className={`x-chips${invalid ? ' is-invalid' : ''}`}
      data-choice={name}
      data-field={name}
      aria-invalid={invalid ? 'true' : undefined}
    >
      {options.map((opt) => (
        <label className="x-chip" key={opt.value}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

export const GENDER_OPTS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
];

export const AGE_OPTS = [
  { value: 'child', label: 'Child · <12' },
  { value: 'adult', label: 'Adult · 12–59' },
  { value: 'senior', label: 'Senior · 60+' }
];

export const MEDITATION_OPTS = [
  { value: 'new', label: 'New' },
  { value: '1', label: '1 yr' },
  { value: '2', label: '2 yr' },
  { value: '3', label: '3 yr' },
  { value: '4', label: '4 yr' },
  { value: '5', label: '5 yr' },
  { value: '6', label: '> 5 yr' }
];

