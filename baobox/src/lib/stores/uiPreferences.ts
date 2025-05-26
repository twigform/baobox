import { writable } from 'svelte/store';

interface UIPreferences {
    showShadows: boolean;
    showBorders: boolean;
    showRoundedCorners: boolean;
    fontFamily: string;
}

const defaultFonts = [
    { name: 'Inter', value: 'Inter, system-ui, sans-serif' },
    { name: 'SF Pro Display', value: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' },
    { name: 'Source Code Pro', value: '"Source Code Pro", monospace' },
    { name: 'Roboto', value: 'Roboto, system-ui, sans-serif' },
    { name: 'System UI', value: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }
];

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
            showRoundedCorners: true,
            fontFamily: defaultFonts[0].value // Default to Inter
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
        setFont: (fontValue: string) => {
            update(prefs => {
                const newPrefs = { ...prefs, fontFamily: fontValue };
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
                showRoundedCorners: true,
                fontFamily: defaultFonts[0].value
            };
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('baobox-ui-preferences', JSON.stringify(defaults));
            }
            set(defaults);
        }
    };
}

export const uiPreferences = createUIPreferencesStore();
