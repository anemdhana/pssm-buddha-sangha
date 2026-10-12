import { createContext, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'pssm_picked_event';
const HOME = { id: null, name: 'PSSM Buddha Sangha', sub: 'Join the sangha · support events', startDate: '', endDate: '' };

const EventPickContext = createContext(null);

export function EventPickProvider({ children }) {
  const [picked, setPickedState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.name) return { ...HOME, ...parsed };
      }
    } catch {}
    return HOME;
  });

  function setPicked(next) {
    const value = next && next.name ? { ...HOME, ...next } : HOME;
    setPickedState(value);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch {}
    document.title = value.name;
  }

  const value = useMemo(() => ({ picked, setPicked, isEventSelected: Boolean(picked.id) }), [picked]);
  return <EventPickContext.Provider value={value}>{children}</EventPickContext.Provider>;
}

export function useEventPick() {
  const ctx = useContext(EventPickContext);
  if (!ctx) throw new Error('useEventPick requires EventPickProvider');
  return ctx;
}
