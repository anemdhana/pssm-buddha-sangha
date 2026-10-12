import { describe, expect, it } from 'vitest';
import { filterRegistrationsByMobile, registrationStats } from './stayRegistrations.js';

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
});
