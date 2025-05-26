<script lang="ts">
    import { currentTheme, themes } from '$lib/themes';
    import { uiPreferences } from '$lib/stores/uiPreferences';
    import { fade } from 'svelte/transition';

    export let isOpen = false;
    let activeTab: 'themes' | 'interface' = 'themes';

    const fonts = [
        { name: 'Inter', value: 'Inter, system-ui, sans-serif' },
        { name: 'SF Pro Display', value: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' },
        { name: 'Source Code Pro', value: '"Source Code Pro", monospace' },
        { name: 'Roboto', value: 'Roboto, system-ui, sans-serif' },
        { name: 'System UI', value: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }
    ];

    function handleThemeChange(theme: { name: string; theme: any }) {
        currentTheme.setTheme(theme);
    }

    function togglePreference(key: 'showShadows' | 'showBorders' | 'showRoundedCorners') {
        uiPreferences.togglePreference(key);
    }

    function setFont(event: Event) {
        const select = event.target as HTMLSelectElement;
        uiPreferences.setFont(select.value);
    }

    function closeModal() {
        isOpen = false;
    }

    function setTab(tab: typeof activeTab) {
        activeTab = tab;
    }
</script>

{#if isOpen}
<div class="modal-overlay" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
        <div class="modal-header">
            <h2>Settings</h2>
            <button class="close-btn" on:click={closeModal}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                    <path fill-rule="evenodd" d="M4.22 4.22a.75.75 0 011.06 0L10 8.94l4.72-4.72a.75.75 0 111.06 1.06L11.06 10l4.72 4.72a.75.75 0 01-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 01-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 010-1.06z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>

        <div class="tabs">
            <button 
                class="tab-button" 
                class:active={activeTab === 'themes'}
                on:click={() => setTab('themes')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle></svg>
                Themes
            </button>
            <button 
                class="tab-button" 
                class:active={activeTab === 'interface'}
                on:click={() => setTab('interface')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                Interface
            </button>
        </div>

        {#if activeTab === 'themes'}
            <div class="tab-content" in:fade={{ duration: 150 }}>
                <div class="settings-section">
                    <h3>Theme</h3>
                    <div class="theme-options">
                        {#each themes as theme}
                            <button
                                class="theme-btn"
                                class:active={$currentTheme.name === theme.name}
                                on:click={() => handleThemeChange(theme)}
                            >
                                <div class="theme-preview" style="
                                    --preview-base: {theme.theme.base};
                                    --preview-surface0: {theme.theme.surface0};
                                    --preview-text: {theme.theme.text};
                                ">
                                    <div class="preview-header"></div>
                                    <div class="preview-content"></div>
                                </div>
                                {theme.name}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>
        {:else}
            <div class="tab-content" in:fade={{ duration: 150 }}>
                <div class="settings-section">
                    <h3>Interface Options</h3>
                    <div class="interface-options">
                        <div class="select-wrapper">
                            <label for="font-select">Font</label>
                            <select 
                                id="font-select" 
                                value={$uiPreferences.fontFamily} 
                                on:change={setFont}
                            >
                                {#each fonts as font}
                                    <option value={font.value}>{font.name}</option>
                                {/each}
                            </select>
                        </div>

                        <label class="toggle-wrapper">
                            <span>Show Shadows</span>
                            <button
                                class="toggle-button"
                                class:active={$uiPreferences.showShadows}
                                on:click={() => togglePreference('showShadows')}
                                aria-pressed={$uiPreferences.showShadows}
                            >
                                <div class="toggle-slider"></div>
                            </button>
                        </label>

                        <label class="toggle-wrapper">
                            <span>Show Borders</span>
                            <button
                                class="toggle-button"
                                class:active={$uiPreferences.showBorders}
                                on:click={() => togglePreference('showBorders')}
                                aria-pressed={$uiPreferences.showBorders}
                            >
                                <div class="toggle-slider"></div>
                            </button>
                        </label>

                        <label class="toggle-wrapper">
                            <span>Rounded Corners</span>
                            <button
                                class="toggle-button"
                                class:active={$uiPreferences.showRoundedCorners}
                                on:click={() => togglePreference('showRoundedCorners')}
                                aria-pressed={$uiPreferences.showRoundedCorners}
                            >
                                <div class="toggle-slider"></div>
                            </button>
                        </label>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .modal-content {
        background: var(--surface0);
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        color: var(--text);
        animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        transform-origin: center center;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .close-btn {
        background: none;
        border: none;
        color: var(--text);
        cursor: pointer;
        padding: 8px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .close-btn:hover {
        background: var(--surface1);
        transform: translateY(-2px);
    }

    .close-btn:active {
        transform: translateY(2px) scale(0.95);
    }

    .tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid var(--surface1);
    }

    .tab-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: transparent;
        border: none;
        color: var(--text);
        cursor: pointer;
        border-radius: 6px;
        font-size: 0.95rem;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform-origin: center;
    }

    .tab-button svg {
        opacity: 0.7;
        transition: all 0.2s ease;
    }

    .tab-button:hover {
        background: var(--surface1);
        transform: translateY(-2px);
    }

    .tab-button:active {
        transform: translateY(0) scale(0.95);
    }

    .tab-button.active {
        background: var(--surface1);
        color: var(--blue);
    }

    .tab-button.active svg {
        opacity: 1;
        stroke: var(--blue);
    }

    .tab-content {
        min-height: 200px;
    }

    .settings-section:first-child {
        margin-top: 0;
    }

    .settings-section {
        margin-bottom: 24px;
    }

    .settings-section h3 {
        margin: 0 0 16px 0;
        font-size: 1.1rem;
        font-weight: 500;
        color: var(--subtext);
    }

    .theme-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 16px;
    }

    .theme-btn {
        background: var(--surface1);
        border: 2px solid transparent;
        border-radius: 8px;
        padding: 12px;
        color: var(--text);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform-origin: center;
    }

    .theme-btn:hover {
        background: var(--surface2);
        transform: translateY(-3px) scale(1.02);
    }

    .theme-btn:active {
        transform: translateY(0) scale(0.98);
    }

    .theme-btn.active {
        border-color: var(--blue);
        background: var(--surface2);
        transform: translateY(-2px);
    }

    .theme-preview {
        width: 100%;
        height: 80px;
        background: var(--preview-base);
        border-radius: 6px;
        overflow: hidden;
    }

    .preview-header {
        height: 20px;
        background: var(--preview-surface0);
    }

    .preview-content {
        padding: 8px;
    }

    .preview-content::before {
        content: "";
        display: block;
        width: 70%;
        height: 8px;
        background: var(--preview-text);
        opacity: 0.7;
        border-radius: 4px;
        margin-bottom: 6px;
    }

    .preview-content::after {
        content: "";
        display: block;
        width: 40%;
        height: 8px;
        background: var(--preview-text);
        opacity: 0.5;
        border-radius: 4px;
    }

    .interface-options {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .select-wrapper {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .select-wrapper label {
        color: var(--subtext);
        font-size: 0.95rem;
    }    select {
        background: var(--surface1);
        border: 2px solid var(--surface2);
        border-radius: 6px;
        color: var(--text);
        padding: 8px 12px;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
    }

    select:hover {
        background: var(--surface2);
    }

    select:focus {
        outline: none;
        border-color: var(--blue);
    }

    .toggle-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--text);
        font-size: 0.95rem;
    }

    .toggle-button {
        position: relative;
        width: 48px;
        height: 24px;
        border-radius: 12px;
        background: var(--surface1);
        border: 2px solid var(--surface2);
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 0;
    }

    .toggle-button:hover {
        background: var(--surface2);
    }

    .toggle-button .toggle-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        background: var(--text);
        border-radius: 50%;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toggle-button.active {
        background: var(--blue);
        border-color: var(--blue);
    }

    .toggle-button.active .toggle-slider {
        transform: translateX(24px);
        background: white;
    }

    .toggle-button:active .toggle-slider {
        width: 20px;
    }

    .toggle-button.active:active .toggle-slider {
        transform: translateX(20px);
        width: 20px;
    }

    .toggle-button:focus {
        outline: none;
        box-shadow: 0 0 0 2px var(--blue);
    }

    @keyframes fadeIn {
        from { 
            opacity: 0;
            backdrop-filter: blur(0px);
        }
        to { 
            opacity: 1;
            backdrop-filter: blur(4px);
        }
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
</style>
