import { describe, expect, it } from 'vitest';
import { composedPassword, homeAfterLogin, normalizeMobile } from './password.js';

describe('composedPassword', () => {
  it('builds ≤5 letters + DDMM', () => {
    expect(
      composedPassword({
        fullName: 'Ramakrishna',
        birthDate: '15',
        birthMonth: '8'
      })
    ).toBe('Ramak1508');
  });

  it('builds sample admin password', () => {
    expect(
      composedPassword({
        fullName: 'Pssm Admin',
        birthDate: '01',
        birthMonth: '01'
      })
    ).toBe('PssmA0101');
  });
});

describe('normalizeMobile', () => {
  it('strips non-digits', () => {
    expect(normalizeMobile('98765 43210')).toBe('9876543210');
  });
});

describe('homeAfterLogin', () => {
  it('sends PSSM Admin to /admin', () => {
    expect(homeAfterLogin(['pssm_admin'])).toBe('/admin');
  });

  it('sends members home', () => {
    expect(homeAfterLogin(['event_organizer'])).toBe('/');
  });
});
