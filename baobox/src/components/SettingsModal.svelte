<script lang="ts">
    import { currentTheme, themes } from '$lib/themes';

    export let isOpen = false;    function handleThemeChange(theme) {
        currentTheme.setTheme(theme);
    }

    function closeModal() {
        isOpen = false;
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
        animation: fadeIn 0.2s ease;
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
        animation: slideIn 0.3s ease;
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
        transition: background-color 0.2s ease;
    }

    .close-btn:hover {
        background: var(--surface1);
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
        transition: all 0.2s ease;
    }

    .theme-btn:hover {
        background: var(--surface2);
        transform: translateY(-2px);
    }

    .theme-btn.active {
        border-color: var(--blue);
        background: var(--surface2);
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

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
