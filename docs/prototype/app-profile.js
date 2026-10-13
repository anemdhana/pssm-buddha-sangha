(function (global) {
    const SANGHA_KEY = 'pssm_sangha_profile';
    const PEOPLE_KEY = 'pssm_sangha_people';
    const SESSION_KEY = 'pssm_sangha_session';
    const EVENTS_KEY = 'pssm_events';
    const ROLE_ASSIGN_KEY = 'pssm_role_assignments';

    const ROLES = {
        pssm_admin: { id: 'pssm_admin', label: 'PSSM Admin', assignable: false },
        event_organizer: { id: 'event_organizer', label: 'Event Organizer', assignable: true },
        pyramid_sevadal: { id: 'pyramid_sevadal', label: 'Pyramid Sevadal', assignable: true },
        pmma_member: { id: 'pmma_member', label: 'PMMA Member', assignable: true },
        accommodation_volunteer: {
            id: 'accommodation_volunteer',
            label: 'Accommodation Volunteer',
            assignable: true
        }
    };

    const ASSIGNABLE_ROLE_IDS = Object.keys(ROLES).filter((id) => ROLES[id].assignable);

    function normalizeMobile(value) {
        return String(value || '').replace(/\D/g, '');
    }

    function normalizeRoles(list) {
        const allowed = Object.keys(ROLES);
        const seen = {};
        return (Array.isArray(list) ? list : [])
            .map((role) => String(role || '').trim())
            .filter((role) => allowed.indexOf(role) >= 0 && !seen[role] && (seen[role] = true));
    }

    function normalizeAssignableRoles(list) {
        const seen = {};
        return (Array.isArray(list) ? list : [])
            .map((role) => String(role || '').trim())
            .filter((role) => ASSIGNABLE_ROLE_IDS.indexOf(role) >= 0 && !seen[role] && (seen[role] = true));
    }

    function readPeopleRaw() {
        try {
            const map = JSON.parse(localStorage.getItem(PEOPLE_KEY) || '{}') || {};
            return typeof map === 'object' && !Array.isArray(map) ? map : {};
        } catch (error) {
            return {};
        }
    }

    function savePeople(map) {
        localStorage.setItem(PEOPLE_KEY, JSON.stringify(map || {}));
    }

    function migrateLegacyProfile() {
        try {
            const legacy = JSON.parse(localStorage.getItem(SANGHA_KEY) || 'null');
            if (!legacy || !legacy.mobile) return;
            const digits = normalizeMobile(legacy.mobile);
            if (!digits) return;
            const people = readPeopleRaw();
            if (!people[digits]) {
                people[digits] = legacy;
                savePeople(people);
            }
        } catch (error) {
            // ignore
        }
    }

    function readPeople() {
        migrateLegacyProfile();
        return readPeopleRaw();
    }

    function findPersonByMobile(mobile) {
        const digits = normalizeMobile(mobile);
        if (!digits) return null;
        const people = readPeople();
        return people[digits] || null;
    }

    function upsertPerson(profile) {
        if (!profile) return null;
        const digits = normalizeMobile(profile.mobile);
        if (!digits) return null;
        const people = readPeople();
        const next = Object.assign({}, profile, { mobile: digits });
        people[digits] = next;
        savePeople(people);
        localStorage.setItem(SANGHA_KEY, JSON.stringify(next));
        return next;
    }

    function readSanghaProfile() {
        const session = readSession();
        if (session && session.mobile) {
            const person = findPersonByMobile(session.mobile);
            if (person) return person;
        }
        try {
            return JSON.parse(localStorage.getItem(SANGHA_KEY) || 'null');
        } catch (error) {
            return null;
        }
    }

    function saveSanghaProfile(profile) {
        upsertPerson(profile);
    }

    function hasSanghaProfile() {
        return Boolean(readSanghaProfile()) || Object.keys(readPeople()).length > 0;
    }

    function copySanghaProfile() {
        const profile = readSanghaProfile();
        if (!profile) return null;
        return JSON.parse(JSON.stringify(profile));
    }

    function listPeople() {
        const people = readPeople();
        return Object.keys(people)
            .map((mobile) => people[mobile])
            .filter(Boolean)
            .sort((a, b) => String(a.fullName || '').localeCompare(String(b.fullName || '')));
    }

    function composedPassword(profile) {
        if (!profile || !profile.fullName) return '';
        const letters = String(profile.fullName).replace(/[^A-Za-z]/g, '').slice(0, 5);
        const date = String(profile.birthDate || '').padStart(2, '0');
        const month = String(profile.birthMonth || '').padStart(2, '0');
        if (!letters || !profile.birthDate || !profile.birthMonth) return '';
        return letters + date + month;
    }

    function currentPassword(profile) {
        if (!profile) return '';
        if (profile.password) return String(profile.password);
        return composedPassword(profile);
    }

    function readRoleAssignments() {
        try {
            return JSON.parse(localStorage.getItem(ROLE_ASSIGN_KEY) || '{}') || {};
        } catch (error) {
            return {};
        }
    }

    function saveRoleAssignments(map) {
        localStorage.setItem(ROLE_ASSIGN_KEY, JSON.stringify(map || {}));
    }

    function rolesForMobile(mobile) {
        const digits = normalizeMobile(mobile);
        const map = readRoleAssignments();
        if (digits && Array.isArray(map[digits])) return normalizeRoles(map[digits]);
        const person = findPersonByMobile(digits);
        if (person) return normalizeRoles(person.roles);
        return [];
    }

    function writeRolesForMobile(mobile, roles) {
        const digits = normalizeMobile(mobile);
        if (!digits) return { ok: false, message: 'Mobile is required.' };
        const next = normalizeRoles(roles);
        const map = readRoleAssignments();
        map[digits] = next;
        saveRoleAssignments(map);
        const person = findPersonByMobile(digits);
        if (person) {
            person.roles = next.slice();
            upsertPerson(person);
        }
        const session = readSession();
        if (session && normalizeMobile(session.mobile) === digits && isSignedIn()) {
            setSession(person || Object.assign({}, session, { roles: next }));
        }
        return { ok: true, roles: next };
    }

    /** PSSM Admin assigns/removes assignable roles (keeps PSSM Admin if already set). */
    function assignRoles(mobile, roles) {
        const digits = normalizeMobile(mobile);
        if (!digits) return { ok: false, message: 'Mobile is required.' };
        if (!findPersonByMobile(digits)) {
            return { ok: false, message: 'No joined person found for that mobile.' };
        }
        const keepAdmin = rolesForMobile(digits).indexOf('pssm_admin') >= 0;
        const next = normalizeAssignableRoles(roles);
        if (keepAdmin) next.unshift('pssm_admin');
        return writeRolesForMobile(digits, next);
    }

    function syncRolesOntoProfile(profile) {
        if (!profile) return profile;
        const assigned = rolesForMobile(profile.mobile);
        profile.roles = assigned.length ? assigned : normalizeRoles(profile.roles);
        return profile;
    }

    function currentRoles() {
        if (!isSignedIn()) return [];
        const profile = syncRolesOntoProfile(readSanghaProfile());
        if (profile) {
            upsertPerson(profile);
            return normalizeRoles(profile.roles);
        }
        return [];
    }

    function hasRole(roleId) {
        return currentRoles().indexOf(roleId) >= 0;
    }

    function roleLabel(roleId) {
        return (ROLES[roleId] && ROLES[roleId].label) || roleId;
    }

    function isPssmAdmin() {
        return hasRole('pssm_admin');
    }

    function countPssmAdmins() {
        const seen = {};
        const map = readRoleAssignments();
        Object.keys(map).forEach((mobile) => {
            if (normalizeRoles(map[mobile]).indexOf('pssm_admin') >= 0) seen[mobile] = true;
        });
        listPeople().forEach((person) => {
            const dig = normalizeMobile(person.mobile);
            if (dig && normalizeRoles(person.roles).indexOf('pssm_admin') >= 0) seen[dig] = true;
        });
        return Object.keys(seen).length;
    }

    const SAMPLE_ADMIN = {
        fullName: 'Srinivasa Rao',
        mobile: '7093405071',
        email: 'srinivasa@pssm.example',
        gender: 'male',
        age: 'adult',
        meditation: '6',
        birthDate: '01',
        birthMonth: '01',
        language: 'Telugu',
        pyramidCenter: 'Santh Kabir Das Pyramid Centre',
        sinceYear: '2010',
        place: { kind: 'urban', city: 'Hyderabad', state: 'Telangana' },
        members: [],
        roles: ['pssm_admin']
    };

    const SAMPLE_PEOPLE = [
        {
            fullName: 'Chaitanya Krishna',
            mobile: '9246470416',
            gender: 'male',
            age: 'adult',
            meditation: '5',
            birthDate: '15',
            birthMonth: '08',
            language: 'Telugu',
            pyramidCenter: 'Himalaya Pyramid Meditation Centre',
            sinceYear: '2016',
            place: { kind: 'urban', city: 'Vijayawada', state: 'Andhra Pradesh' },
            members: [],
            roles: ['event_organizer']
        },
        {
            fullName: 'Sowjanya Lakshmi',
            mobile: '9845055103',
            gender: 'female',
            age: 'adult',
            meditation: '4',
            birthDate: '22',
            birthMonth: '03',
            language: 'Kannada',
            pyramidCenter: 'Jayanagar Pyramid Care Centre',
            sinceYear: '2020',
            place: { kind: 'urban', city: 'Bengaluru', state: 'Karnataka' },
            members: [],
            roles: ['pyramid_sevadal']
        }
    ];

    function sampleAdminCredentials() {
        return {
            mobile: SAMPLE_ADMIN.mobile,
            password: composedPassword(SAMPLE_ADMIN),
            name: SAMPLE_ADMIN.fullName
        };
    }

    /** Ensures prototype sample admin + a few people exist for UI checks. */
    function ensureSampleAdmin() {
        const admin = Object.assign({}, SAMPLE_ADMIN);
        admin.roles = ['pssm_admin'];
        upsertPerson(admin);
        writeRolesForMobile(admin.mobile, ['pssm_admin']);
        SAMPLE_PEOPLE.forEach((person) => {
            const digits = normalizeMobile(person.mobile);
            if (!findPersonByMobile(digits)) {
                const copy = Object.assign({}, person);
                upsertPerson(copy);
                writeRolesForMobile(digits, normalizeRoles(person.roles));
            }
        });
        return sampleAdminCredentials();
    }

    /** Prototype bootstrap when no PSSM Admin exists yet. */
    function claimPssmAdmin() {
        if (!isSignedIn()) return { ok: false, message: 'Please login again.' };
        if (countPssmAdmins() > 0) {
            return { ok: false, message: 'A PSSM Admin is already assigned.' };
        }
        const profile = readSanghaProfile();
        if (!profile) return { ok: false, message: 'Profile not found.' };
        const roles = rolesForMobile(profile.mobile).filter((id) => id !== 'pssm_admin');
        roles.unshift('pssm_admin');
        const result = writeRolesForMobile(profile.mobile, roles);
        if (result.ok) {
            const next = syncRolesOntoProfile(readSanghaProfile());
            setSession(next);
        }
        return result;
    }

    function searchPeopleByMobile(query) {
        const digits = normalizeMobile(query);
        if (!digits) return { ok: false, message: 'Enter a mobile number.', people: [] };
        const people = readPeople();
        const matches = Object.keys(people)
            .filter((mobile) => mobile.indexOf(digits) >= 0 || digits.indexOf(mobile) >= 0)
            .map((mobile) => {
                const person = Object.assign({}, people[mobile]);
                person.roles = rolesForMobile(mobile);
                return person;
            })
            .sort((a, b) => String(a.fullName || '').localeCompare(String(b.fullName || '')));
        if (!matches.length) {
            return { ok: false, message: 'No person found for that mobile.', people: [] };
        }
        return { ok: true, people: matches };
    }

    function removePerson(mobile) {
        if (!isSignedIn() || !isPssmAdmin()) {
            return { ok: false, message: 'Only PSSM Admin can remove a person.' };
        }
        const digits = normalizeMobile(mobile);
        if (!digits) return { ok: false, message: 'Mobile is required.' };
        const session = readSession();
        if (session && normalizeMobile(session.mobile) === digits) {
            return { ok: false, message: 'You cannot remove your own account while signed in.' };
        }
        if (!findPersonByMobile(digits)) {
            return { ok: false, message: 'No joined person found for that mobile.' };
        }
        const people = readPeople();
        delete people[digits];
        savePeople(people);
        const map = readRoleAssignments();
        delete map[digits];
        saveRoleAssignments(map);
        try {
            const legacy = JSON.parse(localStorage.getItem(SANGHA_KEY) || 'null');
            if (legacy && normalizeMobile(legacy.mobile) === digits) {
                localStorage.removeItem(SANGHA_KEY);
            }
        } catch (error) {
            // ignore
        }
        return { ok: true };
    }

    function readEvents() {
        try {
            const list = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
            return Array.isArray(list) ? list : [];
        } catch (error) {
            return [];
        }
    }

    function saveEvents(list) {
        localStorage.setItem(EVENTS_KEY, JSON.stringify(list || []));
    }

    function createEvent(input) {
        if (!isSignedIn()) return { ok: false, message: 'Please login again.' };
        if (!hasRole('event_organizer')) {
            return { ok: false, message: 'Only an Event Organizer can create an event.' };
        }
        const name = String(input && input.name || '').trim();
        const startDate = String(input && input.startDate || '').trim();
        const endDate = String(input && input.endDate || '').trim();
        if (!name) return { ok: false, message: 'Enter the event name.' };
        if (!startDate) return { ok: false, message: 'Enter the start date.' };
        if (!endDate) return { ok: false, message: 'Enter the end date.' };
        if (endDate < startDate) {
            return { ok: false, message: 'End date must be on or after the start date.' };
        }
        const session = readSession();
        const event = {
            id: 'evt_' + Date.now(),
            name: name,
            startDate: startDate,
            endDate: endDate,
            createdBy: session && session.mobile ? session.mobile : '',
            createdAt: Date.now()
        };
        const list = readEvents();
        list.unshift(event);
        saveEvents(list);
        return { ok: true, event: event, events: list };
    }

    function formatEventSub(event) {
        if (!event) return '';
        const start = event.startDate || '';
        const end = event.endDate || '';
        if (start && end) return start + ' to ' + end;
        return start || end || '';
    }

    function readSession() {
        try {
            return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
        } catch (error) {
            return null;
        }
    }

    function isSignedIn() {
        const session = readSession();
        if (!session || !session.mobile) return false;
        return Boolean(findPersonByMobile(session.mobile));
    }

    function setSession(profile) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            mobile: normalizeMobile(profile && profile.mobile),
            name: profile && profile.fullName ? profile.fullName : '',
            roles: normalizeRoles(profile && profile.roles),
            signedInAt: Date.now()
        }));
    }

    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }

    function homeAfterLogin(profile) {
        const roles = normalizeRoles(profile && profile.roles);
        if (roles.indexOf('pssm_admin') >= 0) return 'admin.html';
        return 'index.html';
    }

    function loginWithMobile(mobile, password) {
        const digits = normalizeMobile(mobile);
        const pass = String(password || '').trim();
        if (!digits) return { ok: false, message: 'Enter your mobile number.' };
        if (!pass) return { ok: false, message: 'Enter your password.' };
        let profile = findPersonByMobile(digits);
        if (!profile) {
            return { ok: false, message: 'No sangha join found for this mobile. Join first, then login.' };
        }
        if (currentPassword(profile) !== pass) {
            return { ok: false, message: 'Mobile number or password is not correct.' };
        }
        profile = syncRolesOntoProfile(profile);
        upsertPerson(profile);
        setSession(profile);
        return { ok: true, profile: profile, home: homeAfterLogin(profile) };
    }

    function logout() {
        clearSession();
    }

    function changePassword(currentPass, newPass, confirmPass) {
        const current = String(currentPass || '').trim();
        const next = String(newPass || '').trim();
        const confirm = String(confirmPass || '').trim();
        if (!isSignedIn()) {
            return { ok: false, message: 'Please login again.' };
        }
        if (!current) return { ok: false, message: 'Enter your current password.' };
        if (!next) return { ok: false, message: 'Enter a new password.' };
        if (next.length < 6) return { ok: false, message: 'New password must be at least 6 characters.' };
        if (next !== confirm) return { ok: false, message: 'New password and confirm do not match.' };
        const profile = readSanghaProfile();
        if (!profile) return { ok: false, message: 'Profile not found.' };
        if (currentPassword(profile) !== current) {
            return { ok: false, message: 'Current password is not correct.' };
        }
        if (next === current) {
            return { ok: false, message: 'Choose a new password that is different from the current one.' };
        }
        profile.password = next;
        upsertPerson(profile);
        setSession(profile);
        return { ok: true, profile: profile };
    }

    function requireSignedIn(redirectTo) {
        if (isSignedIn()) return true;
        global.location.href = redirectTo || 'login.html';
        return false;
    }

    function requirePssmAdmin(redirectTo) {
        if (!requireSignedIn(redirectTo || 'login.html')) return false;
        if (isPssmAdmin()) return true;
        global.location.href = redirectTo || 'index.html';
        return false;
    }

    function bindEventPick() {
        refreshEventPickMenus();
        document.querySelectorAll('.event-pick-menu').forEach((menu) => {
            if (menu.dataset.boundPick === '1') return;
            menu.dataset.boundPick = '1';
            menu.addEventListener('click', (event) => {
                const link = event.target.closest('[data-event]');
                if (!link || !menu.contains(link)) return;
                event.preventDefault();
                const name = link.dataset.event;
                const sub = link.dataset.sub || '';
                const pick = link.closest('.event-pick');
                if (!pick) return;
                pick.querySelector('.event-pick-label').textContent = name;
                const subEl = pick.querySelector('.event-pick-sub');
                if (subEl) {
                    subEl.textContent = sub;
                    subEl.hidden = !sub;
                }
                menu.querySelectorAll(':scope > li').forEach((item) => item.classList.remove('uk-active'));
                link.parentElement.classList.add('uk-active');
                document.title = name;
                if (global.UIkit) {
                    const drop = UIkit.dropdown(pick.querySelector('[uk-dropdown]'));
                    if (drop) drop.hide(false);
                }
            });
        });
    }

    function refreshEventPickMenus() {
        const events = readEvents();
        document.querySelectorAll('.event-pick-menu').forEach((menu) => {
            const staticItems = [...menu.querySelectorAll(':scope > li')].filter((li) => !li.dataset.dynamicEvent);
            menu.innerHTML = '';
            staticItems.forEach((li) => menu.appendChild(li));
            events.forEach((evt) => {
                const li = document.createElement('li');
                li.dataset.dynamicEvent = '1';
                const a = document.createElement('a');
                a.href = '#';
                a.dataset.event = evt.name;
                a.dataset.sub = formatEventSub(evt);
                a.innerHTML = '<span class="event-name"></span><span class="event-sub"></span>';
                a.querySelector('.event-name').textContent = evt.name;
                a.querySelector('.event-sub').textContent = formatEventSub(evt);
                li.appendChild(a);
                menu.appendChild(li);
            });
        });
    }

    function applyChromeNav() {
        const signedIn = isSignedIn();
        const organizer = signedIn && hasRole('event_organizer');
        const admin = signedIn && isPssmAdmin();
        document.querySelectorAll('[data-auth="out"]').forEach((el) => {
            el.hidden = signedIn;
        });
        document.querySelectorAll('[data-auth="in"]').forEach((el) => {
            el.hidden = !signedIn;
        });
        document.querySelectorAll('[data-role="event_organizer"]').forEach((el) => {
            el.hidden = !organizer;
        });
        document.querySelectorAll('[data-role="pssm_admin"]').forEach((el) => {
            el.hidden = !admin;
        });
        document.querySelectorAll('[data-logout]').forEach((link) => {
            if (link.dataset.boundLogout === '1') return;
            link.dataset.boundLogout = '1';
            link.addEventListener('click', (event) => {
                event.preventDefault();
                logout();
                global.location.href = 'index.html';
            });
        });
    }

    global.PssmProfile = {
        ROLES,
        ASSIGNABLE_ROLE_IDS,
        readSanghaProfile,
        saveSanghaProfile,
        hasSanghaProfile,
        copySanghaProfile,
        listPeople,
        findPersonByMobile,
        composedPassword,
        currentPassword,
        normalizeMobile,
        normalizeRoles,
        normalizeAssignableRoles,
        assignRoles,
        rolesForMobile,
        syncRolesOntoProfile,
        currentRoles,
        hasRole,
        roleLabel,
        isPssmAdmin,
        countPssmAdmins,
        claimPssmAdmin,
        ensureSampleAdmin,
        sampleAdminCredentials,
        searchPeopleByMobile,
        removePerson,
        readEvents,
        createEvent,
        formatEventSub,
        loginWithMobile,
        logout,
        changePassword,
        isSignedIn,
        readSession,
        setSession,
        homeAfterLogin,
        requireSignedIn,
        requirePssmAdmin,
        bindEventPick,
        refreshEventPickMenus,
        applyChromeNav
    };
})(window);
