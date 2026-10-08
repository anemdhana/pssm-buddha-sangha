(function (global) {
    const SANGHA_KEY = 'pssm_sangha_profile';

    function readSanghaProfile() {
        try {
            return JSON.parse(localStorage.getItem(SANGHA_KEY) || 'null');
        } catch (error) {
            return null;
        }
    }

    function saveSanghaProfile(profile) {
        localStorage.setItem(SANGHA_KEY, JSON.stringify(profile));
    }

    function hasSanghaProfile() {
        return Boolean(readSanghaProfile());
    }

    function copySanghaProfile() {
        const profile = readSanghaProfile();
        if (!profile) return null;
        return JSON.parse(JSON.stringify(profile));
    }

    function composedPassword(profile) {
        if (!profile || !profile.fullName) return '';
        const letters = String(profile.fullName).replace(/[^A-Za-z]/g, '').slice(0, 5);
        const date = String(profile.birthDate || '').padStart(2, '0');
        const month = String(profile.birthMonth || '').padStart(2, '0');
        if (!letters || !profile.birthDate || !profile.birthMonth) return '';
        return 'DMY5' + letters + date + month;
    }

    function bindEventPick() {
        document.querySelectorAll('.event-pick-menu [data-event]').forEach((link) => {
            link.addEventListener('click', (event) => {
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
                pick.querySelectorAll('.event-pick-menu > li').forEach((item) => item.classList.remove('uk-active'));
                link.parentElement.classList.add('uk-active');
                document.title = name;
                if (global.UIkit) {
                    const drop = UIkit.dropdown(pick.querySelector('[uk-dropdown]'));
                    if (drop) drop.hide(false);
                }
            });
        });
    }

    global.PssmProfile = {
        readSanghaProfile,
        saveSanghaProfile,
        hasSanghaProfile,
        copySanghaProfile,
        composedPassword,
        bindEventPick
    };
})(window);
