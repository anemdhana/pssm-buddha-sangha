import { bookingToProfileForm, registrationPersonCount } from './stayRegistrations.js';
import { uikitConfirm } from './uikitConfirm.js';
import { uikitDialogChoice } from './uikitDialog.js';

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeAgeKey(age) {
  const raw = String(age || '')
    .trim()
    .toLowerCase();
  if (raw === 'senior' || raw === 'adult' || raw === 'child') return raw;
  return '';
}

/** Group selected tile people by stay booking id. */
export function groupSelectedPeopleByBooking(selectedIds, people) {
  const idSet = selectedIds instanceof Set ? selectedIds : new Set(selectedIds || []);
  const map = new Map();
  (Array.isArray(people) ? people : []).forEach((person) => {
    if (!person || !idSet.has(person.id) || !person.bookingId) return;
    const list = map.get(person.bookingId) || [];
    list.push(person);
    map.set(person.bookingId, list);
  });
  return map;
}

export function promoteMemberToPrimary(form, memberIndex) {
  const members = Array.isArray(form?.members) ? form.members : [];
  if (memberIndex < 0 || memberIndex >= members.length) return form;
  const member = members[memberIndex];
  const rest = members.filter((_, index) => index !== memberIndex);
  const place =
    member.addrMode === 'new' && member.place && typeof member.place === 'object'
      ? { ...(form.place || {}), ...member.place }
      : form.place;
  const memberMobile = String(member.mobile || '').replace(/\D/g, '');
  return {
    ...form,
    fullName: member.name || form.fullName,
    // Keep family mobile if the new main has none (API requires a primary mobile).
    mobile: memberMobile || form.mobile,
    gender: member.gender || form.gender,
    age: member.age || form.age,
    meditation: member.meditation ?? form.meditation,
    profession: member.profession ?? form.profession,
    livePhoto: member.livePhoto ?? form.livePhoto,
    idProofPhoto: member.idProofPhoto ?? form.idProofPhoto,
    idType: member.idType ?? form.idType,
    stayStartDate: member.stayStartDate || form.stayStartDate,
    stayEndDate: member.stayEndDate || form.stayEndDate,
    place,
    members: rest
  };
}

export function removeMembersAtIndices(form, indices) {
  const drop = new Set(Array.isArray(indices) ? indices : []);
  return {
    ...form,
    members: (form.members || []).filter((_, index) => !drop.has(index))
  };
}

/**
 * First remaining senior, else first remaining adult, else first remaining member.
 * Skips indices in removeMemberIndices. Returns -1 if nobody left.
 */
export function firstSeniorOrAdultMemberIndex(form, removeMemberIndices = []) {
  const members = Array.isArray(form?.members) ? form.members : [];
  const drop = new Set(Array.isArray(removeMemberIndices) ? removeMemberIndices : []);
  const remaining = members
    .map((member, index) => ({ member, index }))
    .filter(({ index }) => !drop.has(index));
  if (remaining.length === 0) return -1;
  const senior = remaining.find(({ member }) => normalizeAgeKey(member?.age) === 'senior');
  if (senior) return senior.index;
  const adult = remaining.find(({ member }) => normalizeAgeKey(member?.age) === 'adult');
  if (adult) return adult.index;
  return remaining[0].index;
}

/**
 * Primary leaves; one member becomes main; optional other member indices removed.
 * Indices refer to the form before promotion.
 */
export function applyPrimaryLeavesFamily(form, promoteMemberIndex, removeMemberIndices = []) {
  const members = Array.isArray(form?.members) ? form.members : [];
  if (promoteMemberIndex < 0 || promoteMemberIndex >= members.length) return form;
  const removeSet = new Set(
    (Array.isArray(removeMemberIndices) ? removeMemberIndices : []).filter((i) => i !== promoteMemberIndex)
  );
  let next = promoteMemberToPrimary(form, promoteMemberIndex);
  if (removeSet.size === 0) return next;
  const remapped = [...removeSet]
    .filter((i) => i >= 0 && i < members.length && i !== promoteMemberIndex)
    .map((i) => (i > promoteMemberIndex ? i - 1 : i));
  return removeMembersAtIndices(next, remapped);
}

function memberRemoveConfirmHtml(names) {
  const listItems = names.map((name) => `<li>${escapeHtml(name)}</li>`).join('');
  return (
    `<p class="uk-margin-remove-top">Remove <strong>${names.length}</strong> ` +
    `${names.length === 1 ? 'person' : 'people'} from this stay registration?</p>` +
    `<ul class="uk-list uk-list-disc uk-margin-small">${listItems}</ul>` +
    `<p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">` +
    `The main person and other family members stay registered for this event. ` +
    `Sangha profiles are not deleted.</p>`
  );
}

function wholeFamilyChoiceHtml(primaryName, otherNames, nextMainName) {
  const others =
    otherNames.length > 0
      ? `<ul class="uk-list uk-list-disc uk-margin-small">${otherNames
          .map((n) => `<li>${escapeHtml(n)}</li>`)
          .join('')}</ul>`
      : '';
  const nextMainNote = nextMainName
    ? `<p class="uk-text-meta uk-margin-small-top">If the family is still joining, ` +
      `<strong>${escapeHtml(nextMainName)}</strong> will become the main person ` +
      `(first senior or adult remaining).</p>`
    : '';
  return (
    `<h2 class="uk-modal-title uk-margin-remove-top">Remove ${escapeHtml(primaryName)}?</h2>` +
    `<p>Are all family members also not joining this event?</p>` +
    others +
    nextMainNote
  );
}

function mainOnlyConfirmHtml(primaryName, nextMainName, stillJoiningNames) {
  const listItems = stillJoiningNames.map((name) => `<li>${escapeHtml(name)}</li>`).join('');
  return (
    `<p class="uk-margin-remove-top">Remove <strong>${escapeHtml(primaryName)}</strong> from this stay registration?</p>` +
    `<p><strong>${escapeHtml(nextMainName)}</strong> will become the main person. ` +
    `These family members stay registered:</p>` +
    `<ul class="uk-list uk-list-disc uk-margin-small">${listItems}</ul>` +
    `<p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">` +
    `Sangha profiles are not deleted.</p>`
  );
}

async function confirmDeleteWholeBooking(names) {
  const listItems = names.map((name) => `<li>${escapeHtml(name)}</li>`).join('');
  return uikitConfirm(
    `<p class="uk-margin-remove-top">Remove stay registration for this family?</p>` +
      `<ul class="uk-list uk-list-disc uk-margin-small">${listItems}</ul>` +
      `<p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">` +
      `People stay on the sangha register — only this event interest is removed.</p>`,
    {
      ok: 'Remove registration',
      cancel: 'Cancel',
      plainText: `Remove stay registration for ${names.join(', ')}? Sangha profiles are kept.`
    }
  );
}

/**
 * Apply removals for one booking. Returns 'deleted' | 'updated' | 'skipped'.
 */
export async function processBookingRegistrationRemoval(booking, selectedPeople, api) {
  if (!booking?.id || !Array.isArray(selectedPeople) || selectedPeople.length === 0) {
    return 'skipped';
  }

  const primarySelected = selectedPeople.filter((p) => p.primary);
  const memberSelected = selectedPeople.filter((p) => !p.primary);
  const memberIndices = memberSelected.map((p) => p.memberIndex).filter((i) => i >= 0);
  const peopleCount = registrationPersonCount(booking);

  if (primarySelected.length === 0 && memberSelected.length > 0) {
    const names = memberSelected.map((p) => p.name);
    const ok = await uikitConfirm(memberRemoveConfirmHtml(names), {
      ok: 'Remove from registration',
      cancel: 'Cancel',
      plainText: `Remove ${names.join(', ')} from this stay? Others stay registered.`
    });
    if (!ok) return 'skipped';

    let form = bookingToProfileForm(booking);
    form = removeMembersAtIndices(form, memberIndices);
    await api.updateStayBooking(booking.id, {
      plan: booking.plan,
      family: form,
      updateSanghaProfile: false
    });
    return 'updated';
  }

  if (primarySelected.length > 0) {
    const primaryName = primarySelected[0].name || booking.familyFullName || 'Main person';
    const form = bookingToProfileForm(booking);
    const otherMemberNames = (form.members || []).map((m) => m.name).filter(Boolean);

    if (peopleCount <= 1 && memberSelected.length === 0) {
      const ok = await confirmDeleteWholeBooking([primaryName]);
      if (!ok) return 'skipped';
      await api.deleteStayBooking(booking.id);
      return 'deleted';
    }

    const promoteIndex = firstSeniorOrAdultMemberIndex(form, memberIndices);
    const nextMain =
      promoteIndex >= 0
        ? form.members[promoteIndex]?.name || `Family member ${promoteIndex + 1}`
        : '';

    if (promoteIndex < 0) {
      const allNames = [primaryName, ...otherMemberNames];
      const ok = await confirmDeleteWholeBooking(allNames);
      if (!ok) return 'skipped';
      await api.deleteStayBooking(booking.id);
      return 'deleted';
    }

    const choice = await uikitDialogChoice(
      wholeFamilyChoiceHtml(primaryName, otherMemberNames, nextMain),
      [
        { id: 'whole_family', label: 'Whole family not joining', buttonClass: 'uk-button-danger' },
        { id: 'main_only', label: 'Family still joining', buttonClass: 'uk-button-primary' }
      ]
    );
    if (!choice) return 'skipped';

    if (choice === 'whole_family') {
      const allNames = [primaryName, ...otherMemberNames];
      const ok = await confirmDeleteWholeBooking(allNames);
      if (!ok) return 'skipped';
      await api.deleteStayBooking(booking.id);
      return 'deleted';
    }

    const stillJoining = (form.members || [])
      .filter((_, index) => !memberIndices.includes(index))
      .map((m) => m.name)
      .filter(Boolean);
    const ok = await uikitConfirm(mainOnlyConfirmHtml(primaryName, nextMain, stillJoining), {
      ok: 'Make main & remove',
      cancel: 'Cancel',
      plainText:
        `Remove ${primaryName}? ${nextMain} will become the main person. ` +
        `Still joining: ${stillJoining.join(', ')}.`
    });
    if (!ok) return 'skipped';

    const updated = applyPrimaryLeavesFamily(form, promoteIndex, memberIndices);
    await api.updateStayBooking(booking.id, {
      plan: booking.plan,
      family: updated,
      updateSanghaProfile: false
    });
    return 'updated';
  }

  return 'skipped';
}

/** Process all selected tiles across bookings. */
export async function applySelectedRegistrationRemovals({ selectedIds, allPeople, bookings, api }) {
  const byBooking = groupSelectedPeopleByBooking(selectedIds, allPeople);
  let deleted = 0;
  let updated = 0;
  for (const [bookingId, selectedPeople] of byBooking) {
    const booking = (Array.isArray(bookings) ? bookings : []).find((b) => b && b.id === bookingId);
    if (!booking) continue;
    const result = await processBookingRegistrationRemoval(booking, selectedPeople, api);
    if (result === 'deleted') deleted += 1;
    if (result === 'updated') updated += 1;
  }
  return { deleted, updated };
}
