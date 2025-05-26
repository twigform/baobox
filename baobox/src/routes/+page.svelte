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

</script>


<main>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <header on:mousedown={dragWindow}>
    <div class="header-content">
      <h1>BaoBox Board</h1>
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
    animation: fadeIn 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    border-radius: 10px;
  }

  header {
    margin-bottom: 15px;
    animation: slideDown 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  }
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h1 {
    margin: 0;
    color: var(--lavender);
    font-size: 28px;
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
    animation: slideIn 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55);
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
      background 0.3s ease,
      transform 0.15s ease,
      color 0.3s ease;
  }

  .control-btn:hover {
    background: var(--base);
    transform: translateY(-2px) scale(1.05);
  }

  .control-btn:active {
    transform: translateY(0) scale(0.97);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideDown {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>

<SettingsModal bind:isOpen={isSettingsOpen} />
