import { describe, expect, it } from 'vitest';
import {
  applyPrimaryLeavesFamily,
  firstSeniorOrAdultMemberIndex,
  promoteMemberToPrimary,
  removeMembersAtIndices
} from './stayRegistrationRemove.js';

describe('stayRegistrationRemove', () => {
  const form = {
    fullName: 'Veeraiah',
    mobile: '9959129737',
    gender: 'male',
    age: 'senior',
    members: [
      { name: 'Padma', mobile: '7382463452', gender: 'female', age: 'senior' },
      { name: 'Karthik', mobile: '9542495504', gender: 'male', age: 'adult' }
    ]
  };

  it('removes family members by index', () => {
    const next = removeMembersAtIndices(form, [1]);
    expect(next.members).toHaveLength(1);
    expect(next.members[0].name).toBe('Padma');
    expect(next.fullName).toBe('Veeraiah');
  });

  it('promotes a member to main person', () => {
    const next = promoteMemberToPrimary(form, 0);
    expect(next.fullName).toBe('Padma');
    expect(next.mobile).toBe('7382463452');
    expect(next.members).toHaveLength(1);
    expect(next.members[0].name).toBe('Karthik');
  });

  it('promotes one member and removes another selected member', () => {
    const next = applyPrimaryLeavesFamily(form, 0, [1]);
    expect(next.fullName).toBe('Padma');
    expect(next.members).toHaveLength(0);
  });

  it('picks first senior, else first adult, skipping removed members', () => {
    expect(firstSeniorOrAdultMemberIndex(form)).toBe(0);
    expect(firstSeniorOrAdultMemberIndex(form, [0])).toBe(1);

    const childFirst = {
      members: [
        { name: 'Ananya', age: 'child' },
        { name: 'Ravi', age: 'adult' },
        { name: 'Padma', age: 'senior' }
      ]
    };
    expect(firstSeniorOrAdultMemberIndex(childFirst)).toBe(2);
    expect(firstSeniorOrAdultMemberIndex(childFirst, [2])).toBe(1);
    expect(firstSeniorOrAdultMemberIndex(childFirst, [1, 2])).toBe(0);
    expect(firstSeniorOrAdultMemberIndex(childFirst, [0, 1, 2])).toBe(-1);
  });
});
