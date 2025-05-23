<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';

    export let x = 0;
    export let y = 0;
    export let show = false;

    const dispatch = createEventDispatcher();
    let menu: HTMLDivElement;

    function handleClickOutside(event: MouseEvent) {
        if (menu && !menu.contains(event.target as Node)) {
            show = false;
        }
    }

    onMount(() => {
        document.addEventListener('click', handleClickOutside);
        // Ensure menu stays within viewport
        if (menu) {
            const rect = menu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            if (x + rect.width > viewportWidth) {
                x = viewportWidth - rect.width;
            }
            if (y + rect.height > viewportHeight) {
                y = viewportHeight - rect.height;
            }
        }
    });

    onDestroy(() => {
        document.removeEventListener('click', handleClickOutside);
    });
</script>

<div 
    class="context-menu" 
    class:show
    bind:this={menu}
    style="left: {x}px; top: {y}px;"
>
    <slot />
</div>

<style>
.context-menu {
    position: fixed;
    background: var(--surface0);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    padding: 4px 0;
    min-width: 160px;
    z-index: 1000;
    display: none;
}

.context-menu.show {
    display: block;
}

:global(.context-menu-item) {
    padding: 8px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text);
    background-color: transparent;
    transition: background-color 0.2s ease;
}

:global(.context-menu-item:hover) {
    background-color: var(--surface1);
}

:global(.context-menu-item.delete) {
    color: var(--accent-red);
}

</style>
