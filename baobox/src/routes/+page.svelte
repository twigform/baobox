<script lang="ts">
  import KanbanColumn from '../components/KanbanColumn.svelte';
  import { columns } from '$lib/stores';
  import { catppuccinMocha } from '$lib/theme';

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
</script>

<main>
  <header>
    <h1>BaoBox Board</h1>
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
