import { useEffect, useId, useRef, useState } from 'react';
import { api } from '../../services/api.js';

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function PyramidCenterAutocomplete({
  value,
  onChange,
  onSelect,
  id,
  className = '',
  placeholder = '',
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy
}) {
  const listId = useId();
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(-1);
  const searchRef = useRef(null);

  useEffect(() => {
    searchRef.current = debounce(async (q) => {
      try {
        const res = await api.searchPyramidCenters({ q, limit: 25 });
        const rows = Array.isArray(res?.data) ? res.data : [];
        setItems(rows);
        setActive(rows.length ? 0 : -1);
      } catch {
        setItems([]);
        setActive(-1);
      }
    }, 180);
  }, []);

  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function apply(item) {
    const name = item.name || '';
    onChange(name);
    if (typeof onSelect === 'function') {
      onSelect(item);
    }
    setOpen(false);
  }

  function handleChange(e) {
    const next = e.target.value;
    onChange(next);
    setOpen(true);
    searchRef.current?.(next.trim());
  }

  function handleFocus() {
    setOpen(true);
    searchRef.current?.(String(value || '').trim());
  }

  function handleKeyDown(e) {
    if (!open || !items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      apply(items[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="x-place-ac" ref={wrapRef}>
      <div className="uk-inline uk-width-1-1">
        <span className="uk-form-icon" uk-icon="icon: home" />
        <input
          className={`uk-input uk-form-small${className ? ` ${className}` : ''}`}
          id={id}
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />
      </div>
      {open && items.length > 0 ? (
        <ul className="x-place-ac-list" id={listId} role="listbox">
          {items.map((item, index) => (
            <li key={`${item.id || item.name}-${index}`} role="option" aria-selected={index === active}>
              <button
                type="button"
                className={`x-place-ac-option${index === active ? ' is-active' : ''}`}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  apply(item);
                }}
              >
                <span className="x-place-ac-name">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export async function rememberPyramidCenter(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return;
  try {
    await api.rememberPyramidCenter({ name: trimmed });
  } catch {
    /* suggestions are best-effort */
  }
}
