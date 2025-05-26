<script lang="ts">
  import KanbanColumn from '../components/KanbanColumn.svelte';
  import SettingsModal from '../components/SettingsModal.svelte';
  import { columns } from '$lib/stores';
  import { getCurrentWindow } from '@tauri-apps/api/window';

  let isSettingsOpen = false;

  import * as win from '@tauri-apps/api/window';
  console.log(win);

  const appWindow = getCurrentWindow();
  let isMaximized = false;
  appWindow.isMaximized().then(maximized => {
    isMaximized = maximized;
  });

  function dragWindow(event: MouseEvent) {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('.window-controls')) return;
    appWindow.startDragging();
  }

  async function minimizeWindow() {
    await appWindow.minimize();
  }

  async function maximizeWindow() {
    try {
      if (isMaximized) {
        await appWindow.unmaximize();
        isMaximized = false;
      } else {
        await appWindow.maximize();
        isMaximized = true;
      }
    } catch (error) {
      console.error('Maximize error:', error);
      try {
        await appWindow.toggleMaximize();
        isMaximized = await appWindow.isMaximized();
      } catch (fallbackError) {
        console.error('Toggle maximize fallback error:', fallbackError);
      }
    }
  }

  async function closeWindow() {
    await appWindow.close();
  }

  // Import the icon SVG content
  const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <g>
    <path style="fill: currentColor;" d="m500,959.14c-52.36,0-103.16-10.26-150.99-30.49-46.19-19.54-87.67-47.5-123.29-83.12s-63.58-77.1-83.12-123.29c-20.23-47.84-30.49-98.64-30.49-150.99,0-76.27,22.13-150.09,63.99-213.48,36.08-54.64,84.97-98.98,142.4-129.41-8.51-17.55-12.93-36.8-12.93-56.77,0-72.09,58.65-130.73,130.73-130.73,28.81,0,56.14,9.2,79.02,26.59,15.25,11.6,27.82,26.55,36.71,43.42,9.31-2.88,19.05-4.36,28.93-4.36,53.99,0,97.91,43.92,97.91,97.91,0,7.28-.78,14.41-2.33,21.37,59.47,30.42,110.07,75.62,147.17,131.7,41.99,63.45,64.18,137.37,64.18,213.76,0,52.36-10.26,103.16-30.49,150.99-19.54,46.19-47.5,87.67-83.12,123.29-35.62,35.62-77.1,63.58-123.29,83.12-47.84,20.23-98.64,30.49-150.99,30.49Z"/>
    <path style="fill: var(--lavender);" d="m436.3,63.36c49.16,0,90.64,32.79,103.83,77.68,11.77-7.6,25.78-12.03,40.84-12.03,41.65,0,75.41,33.76,75.41,75.41,0,11.84-2.74,23.04-7.6,33.01,127.65,56.98,216.62,185,216.62,333.82,0,201.8-163.59,365.39-365.39,365.39s-365.39-163.59-365.39-365.39c0-148.59,88.69-276.45,216.02-333.55-14.13-18.29-22.56-41.2-22.56-66.1,0-59.78,48.46-108.23,108.23-108.23"/>
  </g>
  <path style="fill: none; stroke: var(--lavender); stroke-linecap: round; stroke-linejoin: round; stroke-width: 45px;" d="m261.06,581.3c58.19,34.92,116.38,34.92,174.58,0"/>
  <path style="fill: none; stroke: var(--lavender); stroke-linecap: round; stroke-linejoin: round; stroke-width: 45px;" d="m564.36,581.3c58.19,34.92,116.38,34.92,174.58,0"/>
  <path style="fill: none; stroke: var(--lavender); stroke-linecap: round; stroke-linejoin: round; stroke-width: 45px;" d="m324.56,758.64c116.96,70.18,233.93,70.18,350.89,0"/>
</svg>`;
</script>

<main>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <header on:mousedown={dragWindow}>
    <div class="header-content">
      <div class="title-container">
        <div class="app-icon">
          {@html iconSvg}
        </div>
        <h1>BaoBox Board</h1>
      </div>
      <div class="window-controls">
        <button class="control-btn settings" on:click={() => isSettingsOpen = true} title="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fill-rule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
          </svg>
        </button>
        <button class="control-btn minimize" on:click|stopPropagation={minimizeWindow} title="Minimize">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fill-rule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clip-rule="evenodd" />
          </svg>
        </button>
        <button class="control-btn maximize" on:click|stopPropagation={maximizeWindow} title="Maximize">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fill-rule="evenodd" d="M5.25 4A1.25 1.25 0 004 5.25v9.5A1.25 1.25 0 005.25 16h9.5A1.25 1.25 0 0016 14.75v-9.5A1.25 1.25 0 0014.75 4h-9.5zM5.5 5.5h9v9h-9v-9z" clip-rule="evenodd" />
          </svg>
        </button>
        <button class="control-btn close" on:click|stopPropagation={closeWindow} title="Close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fill-rule="evenodd" d="M4.22 4.22a.75.75 0 011.06 0L10 8.94l4.72-4.72a.75.75 0 111.06 1.06L11.06 10l4.72 4.72a.75.75 0 01-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 01-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 010-1.06z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </header>

  <div class="board">
    {#each $columns as column (column.id)}
      <KanbanColumn {column} />
    {/each}
  </div>
</main>

<style>
  :root {
    font-family: Source Code Pro, monospace;
  }

  main {
    padding: 15px;
    height: calc(100vh - 2vh);
    box-sizing: border-box;
    background: var(--mantle);
    color: var(--text);
    display: flex;
    flex-direction: column;
    animation: fadeIn 1s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 10px;
  }

  header {
    margin-bottom: 15px;
    animation: slideDown 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 8px;
  }

  .title-container {
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideRight 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .app-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--lavender);
  }

  .app-icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  h1 {
    margin: 0;
    color: var(--lavender);
    font-size: 22px;
    font-weight: 600;
  }

  .board {
    display: flex;
    gap: 16px;
    height: calc(100% - 60px);
    overflow-x: auto;
    background: var(--base);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: slideIn 1s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .board::-webkit-scrollbar {
    height: 8px;
  }

  .board::-webkit-scrollbar-track {
    background: var(--surface1);
  }

  .board::-webkit-scrollbar-thumb {
    background: var(--overlay);
    border-radius: 4px;
  }

  .window-controls {
    display: flex;
    gap: 8px;
    align-items: center;
    animation: slideLeft 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .control-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    background: var(--mantle);
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: 
      background 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
      color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .control-btn:hover {
    background: var(--base);
    transform: translateY(-3px) scale(1.08);
  }

  .control-btn:active {
    transform: translateY(1px) scale(0.95);
  }

  .control-btn.settings:hover svg {
    transition: transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform: rotate(180deg);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      filter: blur(5px);
    }
    to {
      opacity: 1;
      filter: blur(0);
    }
  }

  @keyframes slideDown {
    from {
      transform: translateY(-30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      transform: translateX(-30px);
      opacity: 0;
      filter: blur(5px);
    }
    to {
      transform: translateX(0);
      opacity: 1;
      filter: blur(0);
    }
  }

  @keyframes slideRight {
    from {
      transform: translateX(-30px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideLeft {
    from {
      transform: translateX(30px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
</style>

<SettingsModal bind:isOpen={isSettingsOpen} />
