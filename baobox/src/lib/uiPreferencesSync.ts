import { uiPreferences } from './stores/uiPreferences';

// Update root element data attributes based on UI preferences
export function initUIPreferencesSync() {
    if (typeof document === 'undefined') return;

    return uiPreferences.subscribe(prefs => {
        document.documentElement.dataset.shadows = String(prefs.showShadows);
        document.documentElement.dataset.borders = String(prefs.showBorders);
        document.documentElement.dataset.rounded = String(prefs.showRoundedCorners);
    });
}
