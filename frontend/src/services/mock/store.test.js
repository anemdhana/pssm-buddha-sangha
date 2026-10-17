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

describe('mock stay allotments', () => {
  it('replaces prior room assignment so a person is not duplicated', async () => {
    const sample = mockApi.ensureSampleAdmin();
    await mockApi.login({ mobile: sample.mobile, password: sample.password });

    const first = await mockApi.createStayAllotments({
      eventId: 'evt_sample_anandotsavam',
      eventName: 'Dhyana Dussera Anandotsavam - 2026',
      placements: [
        {
          bookingId: 'stay_test_dup',
          hotelId: 'htl_sample_sai_prakash',
          roomNumber: '231',
          roomType: 'ac',
          roomKind: 'regular',
          members: [{ name: 'Dup Guest', mobile: '9000111222', gender: 'male', age: 'adult', primary: true }]
        }
      ]
    });
    expect(first.data.created).toBe(1);

    const second = await mockApi.createStayAllotments({
      eventId: 'evt_sample_anandotsavam',
      eventName: 'Dhyana Dussera Anandotsavam - 2026',
      placements: [
        {
          bookingId: 'stay_test_dup',
          hotelId: 'htl_sample_sai_prakash',
          roomNumber: '232',
          roomType: 'ac',
          roomKind: 'regular',
          members: [{ name: 'Dup Guest', mobile: '9000111222', gender: 'male', age: 'adult', primary: true }]
        }
      ]
    });
    expect(second.data.moves).toEqual([
      expect.objectContaining({
        name: 'Dup Guest',
        fromRoom: '231',
        toRoom: '232'
      })
    ]);

    const listed = await mockApi.listStayAllotments('evt_sample_anandotsavam', { size: 200 });
    const matches = (listed.data.items || []).filter((row) =>
      (row.guests || []).some((g) => String(g.mobile) === '9000111222')
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].roomNumber).toBe('232');
  });
});
