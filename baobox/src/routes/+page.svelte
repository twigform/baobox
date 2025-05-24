<script lang="ts">
  import KanbanColumn from '../components/KanbanColumn.svelte';
  import { columns } from '$lib/stores';
  import { catppuccinMocha } from '$lib/theme';
  import { getCurrentWindow } from '@tauri-apps/api/window';


  // Set CSS variables for the theme
  const theme = catppuccinMocha;
  document.documentElement.style.setProperty('--base', theme.base);
  document.documentElement.style.setProperty('--mantle', theme.mantle);
  document.documentElement.style.setProperty('--crust', theme.crust);
  document.documentElement.style.setProperty('--text', theme.text);
  document.documentElement.style.setProperty('--lavender', theme.lavender);
  document.documentElement.style.setProperty('--surface0', theme.surface0);
  document.documentElement.style.setProperty('--surface1', theme.surface1);
  document.documentElement.style.setProperty('--overlay', theme.overlay);

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
  <header on:mousedown={dragWindow}>
    <div class="header-content">
      <h1>BaoBox Board</h1>
      <div class="window-controls">
        <button class="control-btn minimize" on:click|stopPropagation={minimizeWindow} title="Minimize">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="2" y="5" width="8" height="2" fill="currentColor"/>
          </svg>
        </button>
        <button class="control-btn maximize" on:click|stopPropagation={maximizeWindow} title="Maximize">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="2" y="2" width="8" height="8" stroke="currentColor" stroke-width="1.5" fill="none"/>
          </svg>
        </button>
        <button class="control-btn close" on:click|stopPropagation={closeWindow} title="Close">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
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
    --base: #1e1e2e;
    --mantle: #181825;
    --crust: #11111b;
    --text: #cdd6f4;
    --lavender: #b4befe;
    --surface0: #313244;
    --surface1: #45475a;
    --overlay: #6c7086;
    font-family: Source Code Pro, monospace;
    background-color: #11111b;
  }

  

  main {
    padding: 24px;
    height: calc(100vh - 2vh);
    box-sizing: border-box;
    background: var(--base);
    color: var(--text);
    display: flex;
    flex-direction: column;
    animation: fadeIn 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    border-radius: 10px;
  }

  header {
    margin-bottom: 24px;
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
    font-weight: 700;
  }

  .board {
    display: flex;
    gap: 16px;
    height: calc(100% - 60px);
    overflow-x: auto;
    background: var(--surface0);
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
    background: var(--surface0);
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    position: relative;
  }

  .control-btn:hover {
    background: var(--surface1);
    transform: translateY(-1px);
  }

  .control-btn:active {
    transform: translateY(0);
  }

  .control-btn.minimize:hover {
    background: #f9e2af;
    color: #2c3e50;
  }

  .control-btn.maximize:hover {
    background: #a6e3a1;
    color: #2c3e50;
  }

  .control-btn.close:hover {
    background: #f38ba8;
    color: #2c3e50;
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
