import { describe, expect, it } from 'vitest';
import {
  eachStayNight,
  formatStayCapacityButtonLabel,
  mergeStayRangeFacets,
  summarizeRegistrationCapacity
} from './stayCapacitySummary.js';

describe('stayCapacitySummary', () => {
  it('lists half-open stay nights', () => {
    expect(eachStayNight('2026-10-01', '2026-10-04')).toEqual([
      '2026-10-01',
      '2026-10-02',
      '2026-10-03'
    ]);
    expect(eachStayNight('2026-10-05', '2026-10-05')).toEqual([]);
  });

  it('merges wait + allotted stay-range facets', () => {
    expect(
      mergeStayRangeFacets(
        [{ key: '2026-10-01|2026-10-05', label: 'A', count: 10 }],
        [
          { key: '2026-10-01|2026-10-05', label: 'A', count: 4 },
          { key: '2026-10-02|2026-10-04', label: 'B', count: 3 }
        ]
      )
    ).toEqual([
      { key: '2026-10-01|2026-10-05', label: 'A', count: 14 },
      { key: '2026-10-02|2026-10-04', label: 'B', count: 3 }
    ]);
  });

  it('reports shortfall when peak nightly demand exceeds open beds', () => {
    const hotels = [
      {
        id: 'h1',
        active: true,
        reserved: false,
        rooms: [{ capacity: 4 }, { capacity: 2 }]
      },
      {
        id: 'h2',
        active: true,
        reserved: true,
        rooms: [{ capacity: 20 }]
      }
    ];
    const summary = summarizeRegistrationCapacity({
      hotels,
      stayRanges: [
        { key: '2026-10-01|2026-10-03', count: 5 },
        { key: '2026-10-02|2026-10-04', count: 4 }
      ]
    });
    // Oct 1: 5, Oct 2: 9, Oct 3: 4 → peak 9 vs open beds 6
    expect(summary.openBeds).toBe(6);
    expect(summary.peakPeople).toBe(9);
    expect(summary.peakNight).toBe('2026-10-02');
    expect(summary.sufficient).toBe(false);
    expect(summary.shortfall).toBe(3);
    expect(formatStayCapacityButtonLabel(summary)).toContain('Need 3 beds');
  });

  it('reports OK when open beds cover the peak night', () => {
    const hotels = [
      {
        id: 'h1',
        active: true,
        reserved: false,
        rooms: [{ capacity: 10 }]
      }
    ];
    const summary = summarizeRegistrationCapacity({
      hotels,
      stayRanges: [{ key: '2026-10-01|2026-10-03', count: 7 }]
    });
    expect(summary.sufficient).toBe(true);
    expect(summary.shortfall).toBe(0);
    expect(formatStayCapacityButtonLabel(summary)).toContain('Capacity OK');
  });
});
