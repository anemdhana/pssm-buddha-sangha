import { describe, expect, it } from 'vitest';
import {
  ageGroupLabel,
  filterRegistrationsByMobile,
  filterTilePeople,
  formatStayDay,
  meditationLabel,
  registrationLocationFacets,
  registrationLocationShort,
  registrationStayRangeFacets,
  registrationStats,
  registrationTilePeople,
  removeRegistrationConfirmHtml,
  removeRegistrationConfirmPlain,
  stayRangeKey,
  stayRangeLabel
} from './stayRegistrations.js';

describe('stayRegistrations', () => {
  const sample = [
    {
      familyMobile: '9876543210',
      personCount: 2,
      place: { kind: 'urban' },
      guests: [{ primary: true }, { primary: false }]
    },
    {
      familyMobile: '9123456789',
      personCount: 1,
      place: { kind: 'rural' },
      guests: [{ primary: true }]
    }
  ];

  it('counts people and rural/urban', () => {
    expect(registrationStats(sample)).toEqual({
      families: 2,
      people: 3,
      rural: 1,
      urban: 2
    });
  });

  it('filters by mobile digits', () => {
    expect(filterRegistrationsByMobile(sample, '98765')).toHaveLength(1);
    expect(filterRegistrationsByMobile(sample, '')).toHaveLength(2);
  });

  it('labels meditation and age', () => {
    expect(meditationLabel('3')).toBe('3 years in meditation');
    expect(meditationLabel('new')).toBe('New to meditation');
    expect(ageGroupLabel('senior')).toBe('Senior');
  });

  it('uses city for urban and district for rural', () => {
    expect(registrationLocationShort({ kind: 'urban', city: 'Hyderabad' })).toBe('Hyderabad');
    expect(registrationLocationShort({ kind: 'rural', district: 'Ranga Reddy', village: 'Kadthal' })).toBe(
      'Ranga Reddy'
    );
  });

  it('flattens bookings into tile people with photos', () => {
    const people = registrationTilePeople([
      {
        id: 'stay_1',
        plan: 'free',
        familyFullName: 'Ravi Kumar',
        place: { kind: 'rural', district: 'Ranga Reddy' },
        family: {
          fullName: 'Ravi Kumar',
          meditation: '6',
          profession: 'Farmer',
          age: 'senior',
          livePhoto: 'data:image/jpeg;base64,abc',
          place: { kind: 'rural', district: 'Ranga Reddy' },
          members: [{ name: 'Padma', age: 'senior', meditation: '5', profession: 'Homemaker', livePhoto: '' }]
        },
        guests: [
          { primary: true, name: 'Ravi Kumar', age: 'senior' },
          { primary: false, name: 'Padma', age: 'senior' }
        ]
      }
    ]);
    expect(people).toHaveLength(2);
    expect(people[0]).toMatchObject({
      name: 'Ravi Kumar',
      age: 'senior',
      meditation: '6',
      profession: 'Farmer',
      primary: true
    });
    expect(people[1].name).toBe('Padma');
    expect(people[1].profession).toBe('Homemaker');
    expect(people[1].memberIndex).toBe(0);
    expect(registrationLocationShort(people[0].place)).toBe('Ranga Reddy');
  });

  it('formats stay date ranges like 13-Oct-2026 to 20-Oct-2026', () => {
    expect(formatStayDay('2026-10-13')).toBe('13-Oct-2026');
    expect(stayRangeLabel('2026-10-13', '2026-10-20')).toBe('13-Oct-2026 to 20-Oct-2026');
    expect(stayRangeKey('2026-10-13', '2026-10-20')).toBe('2026-10-13|2026-10-20');
  });

  it('filters people by name age gender meditation location stay range', () => {
    const people = [
      {
        id: '1',
        name: 'Chaitanya Krishna',
        age: 'adult',
        gender: 'male',
        meditation: '6',
        place: { kind: 'urban', city: 'Hyderabad' },
        stayStartDate: '2026-10-13',
        stayEndDate: '2026-10-20'
      },
      {
        id: '2',
        name: 'Meenakshi Devi',
        age: 'senior',
        gender: 'female',
        meditation: '3',
        place: { kind: 'urban', city: 'Hyderabad' },
        stayStartDate: '2026-10-13',
        stayEndDate: '2026-10-20'
      },
      {
        id: '3',
        name: 'Ananya',
        age: 'child',
        gender: 'female',
        meditation: 'new',
        place: { kind: 'urban', city: 'Vijayawada' },
        stayStartDate: '2026-10-15',
        stayEndDate: '2026-10-18'
      }
    ];
    expect(filterTilePeople(people, { ageKeys: ['senior', 'child'] })).toHaveLength(2);
    expect(filterTilePeople(people, { gender: 'male' })).toHaveLength(1);
    expect(filterTilePeople(people, { meditation: '3' })[0].id).toBe('2');
    expect(filterTilePeople(people, { location: 'Vijayawada' })).toHaveLength(1);
    expect(filterTilePeople(people, { nameQuery: 'nakshi' })).toHaveLength(1);
    expect(filterTilePeople(people, { nameQuery: 'AN' })).toHaveLength(2);
    expect(filterTilePeople(people, { stayRange: '2026-10-13|2026-10-20' })).toHaveLength(2);
    expect(registrationLocationFacets(people)).toEqual([
      { name: 'Hyderabad', count: 2 },
      { name: 'Vijayawada', count: 1 }
    ]);
    expect(registrationStayRangeFacets(people)).toEqual([
      { key: '2026-10-13|2026-10-20', label: '13-Oct-2026 to 20-Oct-2026', count: 2 },
      { key: '2026-10-15|2026-10-18', label: '15-Oct-2026 to 18-Oct-2026', count: 1 }
    ]);
  });

  it('builds remove registration confirmation mentioning sangha registry', () => {
    const bookings = [{ id: 'b1', familyFullName: 'Veeraiah' }];
    expect(removeRegistrationConfirmPlain(['b1'], bookings)).toContain('Veeraiah');
    expect(removeRegistrationConfirmPlain(['b1'], bookings)).toContain('sangha register');
    const html = removeRegistrationConfirmHtml(['b1'], bookings);
    expect(html).toContain('Veeraiah');
    expect(html).toContain('uk-list');
    expect(html).toContain('uk-text-meta');
  });
});
