import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';

const emptyPage = {
  items: [],
  total: 0,
  page: 0,
  size: 24,
  totalPages: 0,
  stats: { families: 0, people: 0, rural: 0, urban: 0, waitList: 0, allotted: 0 },
  facets: { locations: [], stayRanges: [] }
};

function normalizePage(payload) {
  if (!payload || typeof payload !== 'object') return emptyPage;
  // Backward-compatible: older mock/API returning a bare array.
  if (Array.isArray(payload)) {
    return {
      ...emptyPage,
      items: payload,
      total: payload.length,
      totalPages: 1,
      stats: {
        families: payload.length,
        people: payload.reduce((sum, row) => sum + (Number(row?.personCount) || 0), 0),
        rural: 0,
        urban: 0
      }
    };
  }
  return {
    items: Array.isArray(payload.items) ? payload.items : [],
    total: Number(payload.total) || 0,
    page: Number(payload.page) || 0,
    size: Number(payload.size) || 24,
    totalPages: Number(payload.totalPages) || 0,
    stats: payload.stats || emptyPage.stats,
    facets: payload.facets || emptyPage.facets
  };
}

export function useEventRegistrations(eventId, enabled, filters = {}) {
  const [pageData, setPageData] = useState(emptyPage);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const hasLoadedRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    hasLoadedRef.current = false;
  }, [eventId]);

  const refresh = useCallback(async () => {
    if (!enabled || !eventId) {
      setPageData(emptyPage);
      setError('');
      hasLoadedRef.current = false;
      return;
    }
    const requestId = ++requestIdRef.current;
    const initial = !hasLoadedRef.current;
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const res = await api.listStayBookings(eventId, {
        q: filters.q || undefined,
        gender: filters.gender || undefined,
        ages: filters.ages || undefined,
        meditation: filters.meditation || undefined,
        location: filters.location || undefined,
        stayRange: filters.stayRange || undefined,
        page: filters.page ?? 0,
        size: filters.size ?? 24
      });
      if (requestId !== requestIdRef.current) return;
      setPageData(normalizePage(res.data));
      hasLoadedRef.current = true;
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setPageData(emptyPage);
      setError(err.message || 'Could not load registrations.');
      hasLoadedRef.current = true;
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [
    enabled,
    eventId,
    filters.q,
    filters.gender,
    filters.ages,
    filters.meditation,
    filters.location,
    filters.stayRange,
    filters.page,
    filters.size
  ]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    rows: pageData.items,
    total: pageData.total,
    page: pageData.page,
    size: pageData.size,
    totalPages: pageData.totalPages,
    stats: pageData.stats,
    facets: pageData.facets,
    loading,
    refreshing,
    error,
    refresh
  };
}
