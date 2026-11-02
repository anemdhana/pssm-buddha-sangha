import { describe, expect, it } from 'vitest';
import {
  eachStayNight,
  formatStayCapacityButtonLabel,
  mergeStayRangeFacets,
  suggestHotelsToCoverRegistrations,
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
    expect(summary.nightlyDemand).toEqual([
      { night: '2026-10-01', people: 5, shortfall: 0, covered: true },
      { night: '2026-10-02', people: 9, shortfall: 3, covered: false },
      { night: '2026-10-03', people: 4, shortfall: 0, covered: true }
    ]);
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

  it('suggests a compact hotel set to keep active for peak demand', () => {
    const hotels = [
      {
        id: 'far_big',
        name: 'Far Big',
        distanceKm: 5,
        active: true,
        reserved: false,
        rooms: [{ capacity: 20 }]
      },
      {
        id: 'near_small',
        name: 'Near Small',
        distanceKm: 0.5,
        active: false,
        reserved: false,
        rooms: [{ capacity: 4 }]
      },
      {
        id: 'near_mid',
        name: 'Near Mid',
        distanceKm: 1,
        active: true,
        reserved: false,
        rooms: [{ capacity: 6 }]
      },
      {
        id: 'reserved',
        name: 'Reserved',
        distanceKm: 0.2,
        active: true,
        reserved: true,
        rooms: [{ capacity: 50 }]
      }
    ];
    const allotments = [
      { hotelId: 'near_mid', personCount: 3 },
      { hotelId: 'far_big', personCount: 1 }
    ];
    const plan = suggestHotelsToCoverRegistrations({
      hotels,
      peakPeople: 8,
      allotments
    });
    // Prefers allotted + nearer: near_mid (6) then near_small (4) covers 8 without far_big.
    expect(plan.suggested.map((h) => h.hotelId)).toEqual(['near_mid', 'near_small']);
    expect(plan.coversPeak).toBe(true);
    expect(plan.activate.map((h) => h.hotelId)).toEqual(['near_small']);
    expect(plan.deactivate.map((h) => h.hotelId)).toEqual(['far_big']);
  });
});
