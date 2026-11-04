import { describe, expect, it } from 'vitest';
import { buildHomeStaySummary, daysUntilDate, daysUntilPhrase } from './homeStaySummary.js';

describe('daysUntilDate', () => {
  it('counts calendar days', () => {
    const today = new Date(2026, 10, 4); // 4 Nov 2026
    expect(daysUntilDate('2026-11-04', today)).toBe(0);
    expect(daysUntilDate('2026-11-05', today)).toBe(1);
    expect(daysUntilDate('2026-11-01', today)).toBe(-3);
  });
});

describe('daysUntilPhrase', () => {
  it('formats past dates', () => {
    expect(daysUntilPhrase('1999-01-01', { past: 'Passed' })).toBe('Passed');
  });
});

describe('buildHomeStaySummary', () => {
  const picked = {
    id: 'evt1',
    name: 'Dhyana',
    startDate: '2026-12-21',
    endDate: '2026-12-31'
  };

  it('asks to pick an event when none selected', () => {
    const view = buildHomeStaySummary({ picked: { id: null, name: 'Home' }, mine: null, loading: false });
    expect(view.status).toBe('pick_event');
    expect(view.rows).toEqual([]);
    expect(view.summary).toMatch(/Choose an event/i);
  });

  it('shows not recorded interest state', () => {
    const view = buildHomeStaySummary({
      picked,
      mine: {
        event: {
          id: 'evt1',
          name: 'Dhyana',
          startDate: '2026-12-21',
          endDate: '2026-12-31',
          bookingClosesOn: '2026-12-19'
        },
        booking: null,
        allotments: []
      },
      loading: false
    });
    expect(view.status).toBe('no_interest');
    expect(view.summary).toMatch(/who is coming/i);
    expect(view.summary).toMatch(/Accommodation Volunteer/i);
    expect(view.cta?.label).toMatch(/who is coming/i);
    expect(view.eventTitle).toBe('Dhyana');
    expect(view.highlight?.label).toBe('Event');
  });

  it('summarises a registered party waiting for a room', () => {
    const view = buildHomeStaySummary({
      picked,
      mine: {
        event: {
          id: 'evt1',
          name: 'Dhyana',
          startDate: '2026-12-21',
          endDate: '2026-12-31',
          location: 'Hyderabad'
        },
        booking: {
          bookedAt: '2026-11-01T10:00:00Z',
          guests: [
            {
              name: 'Ramakrishna',
              primary: true,
              stayStartDate: '2026-12-21',
              stayEndDate: '2026-12-28'
            },
            { name: 'Padma', primary: false, stayStartDate: '2026-12-21', stayEndDate: '2026-12-28' }
          ]
        },
        allotments: []
      },
      loading: false
    });
    expect(view.status).toBe('awaiting_room');
    expect(view.rows.find((r) => r.label === 'Who is coming')?.value).toMatch(/2 persons/);
    expect(view.rows.find((r) => r.label === 'Who is coming')?.value).toMatch(/Ramakrishna/);
    expect(view.rows.find((r) => r.label === 'Hotel & room')?.value).toMatch(/Not assigned yet/);
    expect(view.summary).toMatch(/Accommodation Volunteer/i);
    expect(view.highlight?.label).toBe('Check-in');
    expect(view.cta?.to).toBe('/stay');
  });

  it('shows allotted hotel room', () => {
    const view = buildHomeStaySummary({
      picked,
      mine: {
        event: { id: 'evt1', name: 'Dhyana', startDate: '2026-12-21', endDate: '2026-12-31' },
        booking: {
          guests: [{ name: 'Ramakrishna', primary: true, stayStartDate: '2026-12-21', stayEndDate: '2026-12-25' }]
        },
        allotments: [{ hotelName: 'Hotel Pearl', roomNumber: '12' }]
      },
      loading: false
    });
    expect(view.status).toBe('allotted');
    expect(view.rows.find((r) => r.label === 'Hotel & room')?.value).toBe('Hotel Pearl · Room 12');
  });
});
