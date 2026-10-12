import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';

export function useEventRegistrations(eventId, enabled) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!enabled || !eventId) {
      setRows([]);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.listStayBookings(eventId);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setRows([]);
      setError(err.message || 'Could not load registrations.');
    } finally {
      setLoading(false);
    }
  }, [enabled, eventId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rows, loading, error, refresh };
}
