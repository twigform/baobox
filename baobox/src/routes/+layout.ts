// Tauri doesn't have a Node.js server to do proper SSR
// so we will use adapter-static to prerender the app (SSG)
// See: https://v2.tauri.app/start/frontend/sveltekit/ for more info
export const prerender = true;
export const ssr = false;

import { browser } from '$app/environment';
import { initUIPreferencesSync } from '$lib/uiPreferencesSync';

// Initialize UI preferences sync when the app loads in the browser
if (browser) {
    initUIPreferencesSync();
}
