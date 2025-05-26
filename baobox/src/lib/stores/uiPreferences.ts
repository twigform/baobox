import { writable } from 'svelte/store';

interface UIPreferences {
    showShadows: boolean;
    showBorders: boolean;
    showRoundedCorners: boolean;
}

function createUIPreferencesStore() {
    // Get saved preferences from localStorage or use defaults
    const getInitialPreferences = (): UIPreferences => {
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('baobox-ui-preferences');
            if (saved) {
                return JSON.parse(saved);
            }
        }
        return {
            showShadows: true,
            showBorders: true,
            showRoundedCorners: true
        };
    };

    const { subscribe, set, update } = writable<UIPreferences>(getInitialPreferences());

    return {
        subscribe,
        togglePreference: (key: keyof UIPreferences) => {
            update(prefs => {
                const newPrefs = { ...prefs, [key]: !prefs[key] };
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('baobox-ui-preferences', JSON.stringify(newPrefs));
                }
                return newPrefs;
            });
        },
        reset: () => {
            const defaults = {
                showShadows: true,
                showBorders: true,
                showRoundedCorners: true
            };
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('baobox-ui-preferences', JSON.stringify(defaults));
            }
            set(defaults);
        }
    };
}

export const uiPreferences = createUIPreferencesStore();
