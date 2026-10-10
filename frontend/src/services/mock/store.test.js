import { beforeEach, describe, expect, it } from 'vitest';
import { mockApi } from './store.js';

beforeEach(() => {
  localStorage.clear();
  mockApi.ensureSampleAdmin();
});

describe('mock login', () => {
  it('logs in sample admin', async () => {
    const sample = mockApi.ensureSampleAdmin();
    const res = await mockApi.login({ mobile: sample.mobile, password: sample.password });
    expect(res.data.roles).toContain('pssm_admin');
    expect(res.data.home).toBe('/admin');
  });

  it('rejects bad password', async () => {
    await expect(mockApi.login({ mobile: '9000000001', password: 'wrong' })).rejects.toThrow(
      /not correct/i
    );
  });
});

describe('mock join', () => {
  it('returns temporary password', async () => {
    const res = await mockApi.join({
      fullName: 'Test User',
      mobile: '9111222333',
      birthDate: '10',
      birthMonth: '05',
      place: { kind: 'urban', city: 'Hyderabad', state: 'Telangana' },
      pyramidCenter: 'Test Center'
    });
    expect(res.data.temporaryPassword).toBe('TestU1005');
  });

  it('rejects a mobile that is already registered', async () => {
    const payload = {
      fullName: 'Test User',
      mobile: '9222333444',
      birthDate: '10',
      birthMonth: '05',
      place: { kind: 'urban', city: 'Hyderabad', state: 'Telangana' }
    };
    await mockApi.join(payload);
    await expect(
      mockApi.join({ ...payload, fullName: 'Another User', birthDate: '01', birthMonth: '01' })
    ).rejects.toMatchObject({
      status: 409,
      message: 'This mobile is already registered. Login to My Space instead.'
    });
  });
});
