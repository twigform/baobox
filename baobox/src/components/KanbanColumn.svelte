<!-- filepath: src/components/KanbanColumn.svelte -->
<script lang="ts">
    import type { Column, Task } from '$lib/types';
    import { moveTask, draggedTask, dragOverColumn, addTask, deleteTask } from '$lib/stores';
    import { onMount, onDestroy } from 'svelte';
    import { get } from 'svelte/store';
    import ContextMenu from './ContextMenu.svelte';
    import { flip } from 'svelte/animate';
    import { catppuccinMocha } from '$lib/theme';
    import { fade } from 'svelte/transition';
    import { bounceOut, cubicInOut, cubicOut, quintOut, backOut } from 'svelte/easing';
    import { slide } from 'svelte/transition';

    export let column: Column;

    let deletingTasks = new Set<number>();

    let columnElement: HTMLDivElement;
    let mouseUpHandler: (e: MouseEvent) => void;
    let mouseMoveHandler: (e: MouseEvent) => void;
    let ghostElement: HTMLElement | null = null;
    let showAddTask = false;
    let newTaskTitle = '';
    let newTaskDescription = '';

    // Context menu state
    let showContextMenu = false;
    let contextMenuX = 0;
    let contextMenuY = 0;
    let selectedTask: Task | null = null;

    // Reset form function
    function resetForm() {
        newTaskTitle = '';
        newTaskDescription = '';
        showAddTask = false;
    }

    function handleAddTask() {
        if (newTaskTitle.trim()) {
            addTask(column.status, newTaskTitle.trim(), newTaskDescription.trim());
            resetForm();
        }
    }

    function handleDeleteTaskAnimated(task: Task) {
        deletingTasks.add(task.id);
    }

    function onOutroEnd(taskId: number) {
        deleteTask(taskId, column.status);
        deletingTasks.delete(taskId);
    }

    function createGhostElement(task: Task, x: number, y: number) {
        // Remove existing ghost if any
        if (ghostElement) {
            ghostElement.remove();
        }

        ghostElement = document.createElement('div');
        ghostElement.className = 'task-ghost';
        ghostElement.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description}</p>
        `;
        document.body.appendChild(ghostElement);

        // Position the ghost element where the original task is
        ghostElement.style.opacity = '0';
        ghostElement.style.position = 'fixed';
        ghostElement.style.left = `${x}px`;
        ghostElement.style.top = `${y}px`;
        ghostElement.style.width = '280px';
        ghostElement.style.pointerEvents = 'none';
        
        // Trigger animation
        requestAnimationFrame(() => {
            if (ghostElement) {
                ghostElement.style.opacity = '0.9';
                ghostElement.style.transform = 'rotate(2deg) scale(1.02)';
            }
        });
    }

    function startDragging(event: MouseEvent, task: Task) {
        // Only handle left mouse button
        if (event.button !== 0) return;
        event.preventDefault();
        
        const taskElement = (event.target as HTMLElement).closest('.task') as HTMLElement;
        if (!taskElement) return;

        const rect = taskElement.getBoundingClientRect();
        const mouseOffset = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };

        // Create ghost element
        createGhostElement(task, event.clientX - mouseOffset.x, event.clientY - mouseOffset.y);

        draggedTask.set({
            task,
            mouseOffset
        });

        // Create handlers
        mouseUpHandler = (e: MouseEvent) => stopDragging(e);
        mouseMoveHandler = (e: MouseEvent) => handleDragMove(e);

        // Add global event listeners
        window.addEventListener('mouseup', mouseUpHandler);
        window.addEventListener('mousemove', mouseMoveHandler);

        // Add visual feedback
        taskElement.style.opacity = '0.5';
    }

    function handleDragMove(event: MouseEvent) {
        const dragged = get(draggedTask);
        if (!dragged.task || !ghostElement) return;

        // Use requestAnimationFrame for smooth movement
        requestAnimationFrame(() => {
            if (ghostElement) {
                // Move ghost element
                ghostElement.style.left = `${event.clientX - dragged.mouseOffset.x}px`;
                ghostElement.style.top = `${event.clientY - dragged.mouseOffset.y}px`;
            }
        });

        // Find column under cursor
        const columns = document.querySelectorAll('.column');
        let foundColumn = false;
        
        columns.forEach((col) => {
            const rect = col.getBoundingClientRect();
            if (
                event.clientX >= rect.left &&
                event.clientX <= rect.right &&
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom
            ) {
                const columnStatus = col.getAttribute('data-status');
                if (columnStatus) {
                    dragOverColumn.set(columnStatus);
                    foundColumn = true;
                }
            }
        });

        if (!foundColumn) {
            dragOverColumn.set(null);
        }
    }

    function stopDragging(event: MouseEvent) {
        const dragged = get(draggedTask);
        const overColumn = get(dragOverColumn);

        if (dragged.task && overColumn) {
            moveTask(dragged.task.id, dragged.task.status, overColumn);
        }

        // Animate ghost element away
        if (ghostElement) {
            ghostElement.style.opacity = '0';
            ghostElement.style.transform = 'rotate(0deg) scale(0.95)';
            
            // Remove ghost element after animation
            setTimeout(() => {
                if (ghostElement) {
                    ghostElement.remove();
                    ghostElement = null;
                }
            }, 150);
        }

        // Reset opacity of original task with transition
        const tasks = document.querySelectorAll('.task');
        tasks.forEach(task => {
            (task as HTMLElement).style.opacity = '1';
        });

        // Clean up
        draggedTask.set({ task: null, mouseOffset: { x: 0, y: 0 } });
        dragOverColumn.set(null);
        window.removeEventListener('mouseup', mouseUpHandler);
        window.removeEventListener('mousemove', mouseMoveHandler);
    }

    function handleContextMenu(event: MouseEvent, task: Task) {
        event.preventDefault();
        selectedTask = task;
        contextMenuX = event.clientX;
        contextMenuY = event.clientY;
        showContextMenu = true;
    }

    function handleDeleteTask() {
        if (selectedTask) {
            deleteTask(selectedTask.id, selectedTask.status);
            showContextMenu = false;
            selectedTask = null;
        }
    }

    onDestroy(() => {
        if (mouseUpHandler) {
            window.removeEventListener('mouseup', mouseUpHandler);
        }
        if (mouseMoveHandler) {
            window.removeEventListener('mousemove', mouseMoveHandler);
        }
        if (ghostElement) {
            ghostElement.remove();
        }
    });
</script>

<div 
    class="column"
    data-status={column.status}
    bind:this={columnElement}
    class:drag-over={$dragOverColumn === column.status}
>
    <div class="column-header">
        <h2>{column.title}</h2>
        <button class="add-button" on:click={() => showAddTask = true}>+</button>
    </div>

    {#if showAddTask}
        <div class="add-task-form" transition:slide={{ duration: 400, easing: backOut }}>
            <input
                type="text"
                placeholder="Task title"
                bind:value={newTaskTitle}
                on:keydown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTask();
                    } else if (e.key === 'Escape') {
                        resetForm();
                    }
                }}
            />
            <textarea
                placeholder="Task description (optional)"
                bind:value={newTaskDescription}
                rows="3"
                on:keydown={(e) => {
                    if (e.key === 'Escape') {
                        resetForm();
                    }
                }}
            ></textarea>
            <div class="form-actions">
                <button class="cancel" on:click={resetForm}>Cancel</button>
                <button class="add" on:click={handleAddTask}>Add Task</button>
            </div>
        </div>
    {/if}

    <div class="tasks">
        {#each column.tasks as task (task.id)}
            <div
                class="task"
                class:being-dragged={$draggedTask.task?.id === task.id}
                on:mousedown={(e) => startDragging(e, task)}
                on:contextmenu={(e) => handleContextMenu(e, task)}
                role="button"
                tabindex="0"
                animate:flip={{ duration: 300, easing: cubicOut }}
                out:fade={{ duration: 300 }}
                in:slide={{ duration: 400, easing: backOut }}
                on:outroend={() => onOutroEnd(task.id)}
            >
                <h3>{task.title}</h3>
                {#if task.description}
                    <p>{task.description}</p>
                {/if}
                <button
                    class="done-button"
                    aria-label="Mark task done"
                    on:click|stopPropagation={() => deleteTask(task.id, task.status)}
                    on:mousedown|stopPropagation
                    tabindex="0"
                    title="Done"
                >
                    <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent-green)"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    >
                    <polyline points="20 6 9 17 4 12" />
                    </svg>
                </button>
            </div>
        {/each}
    </div>
</div>

<ContextMenu
    bind:show={showContextMenu}
    x={contextMenuX}
    y={contextMenuY}
>
    <button 
        type="button"
        class="context-menu-item delete" 
        on:click={handleDeleteTask}
    >
        Delete Task
    </button>
</ContextMenu>

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
    --subtext: #a6adc8;
    --accent-blue: #89b4fa;
    --accent-green: #a6e3a1;
    --accent-red: #f38ba8;
    --accent-yellow: #f9e2af;
    --accent-mauve: #cba6f7;
    --scroll-thumb: #585b70;
    --scroll-thumb-hover: #6c7086;
}

/* Column */
.column {
    background: var(--base);
    border-radius: 15px;
    min-width: 300px;
    width: 300px;
    min-height: 400px;
    padding: 16px;
    transition: background-color 0.2s ease;
    display: flex;
    flex-direction: column;
}

/* Header */
.column-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

/* Add button */
.add-button {
    background: var(--lavender);
    color: var(--crust);
    border: none;
    border-radius: 8px;
    width: 28px;
    height: 28px;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.2s ease-out;
}

.add-button:hover {
    background: var(--accent-blue);
    transform: scale(1.05);
}

.add-button:active {
    background: var(--accent-blue);
    transform: translateY(2px);
}
/* Drag over state */
.column.drag-over {
    background: var(--mantle);
    box-shadow: 0 0 0 2px var(--accent-blue);
}

/* Tasks container */
.tasks {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-grow: 1;
    overflow-y: auto;
    padding-right: 4px;
}

.tasks::-webkit-scrollbar {
    width: 6px;
}

.tasks::-webkit-scrollbar-track {
    background: transparent;
}

.tasks::-webkit-scrollbar-thumb {
    background: var(--scroll-thumb);
    border-radius: 3px;
}

/* Task card */
.task {
    background: var(--surface0);
    border: solid 2px var(--surface1);
    border-radius: 10px;
    padding: 12px;
    cursor: grab;
    user-select: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.task.being-dragged {
    opacity: 0.5;
    transform: scale(0.95);
}

.task:hover {
    transform: scale(0.98);
}

/* Typography */
h2 {
    margin: 0;
    font-size: 1.2rem;
    color: var(--text);
    font-weight: 600;
}

h3 {
    margin: 0 0 8px 0;
    font-size: 1rem;
    color: var(--text);
}

p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--overlay);
}

/* Add task form */
.add-task-form {
    background: var(--surface0);
    border: solid 2px var(--surface1);
    border-radius: 10px;
    padding: 12px;
    color: var(--text);
    margin-bottom: 8px;
    width: 100%;
    box-sizing: border-box;
}

.add-task-form input,
.add-task-form textarea {
    width: 100%;
    padding: 8px;
    margin-bottom: 8px;
    border: 2px solid var(--surface1);
    border-radius: 10px;
    font-size: 0.9rem;
    background: var(--base);
    color: var(--text);
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
}

.add-task-form textarea {
    resize: vertical;
    min-height: 60px;
}

.add-task-form input::placeholder,
.add-task-form textarea::placeholder {
    color: var(--text);
    opacity: 0.8;
}

/* Form actions */
.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.form-actions button {
    padding: 6px 12px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s ease;
}

.form-actions .add {
    background: var(--surface0);
    border: 2px solid var(--accent-green);
    color: var(--text);
}

.form-actions .add:hover {
    background: var(--surface1);
    transform: scale(1.05);
}

.done-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.task:hover .done-button {
  opacity: 1;
}

.done-button:hover svg {
    transform: scale(1.1);
    transition: all 0.2s ease;
}


.done-button:active svg {
    transform: scale(0.95);
}

.form-actions .add:active {
    background: var(--surface1);
    transform: scale(0.95);
}

.form-actions .cancel {
    background: var(--surface0);
    border: 2px solid var(--accent-red);
    color: var(--text);
}

.form-actions .cancel:hover {
    background: var(--surface1);
    transform: scale(1.05);
}

.form-actions .cancel:active {
    background: var(--surface1);
    transform: scale(0.95);
}

/* Ghost task */
:global(.task-ghost) {
    position: fixed;
    border: solid 2px var(--surface1);
    pointer-events: none;
    z-index: 1000;
    background: var(--surface0);
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
    width: 280px;
    opacity: 0.9;
    transform: rotate(2deg) scale(1.02);
    cursor: grabbing;
    transition: transform 0.1s ease, left 0.15s ease-out, top 0.15s ease-out;
    will-change: transform, left, top;
    backdrop-filter: blur(10px);
}

:global(.task-ghost h3) {
    margin: 0 0 8px 0;
    font-size: 1rem;
    cursor: grabbing;
    color: var(--text);
}

:global(.task-ghost p) {
    margin: 0;
    cursor: grabbing;
    font-size: 0.9rem;
    color: var(--subtext);
}

/* Context menu item */
.context-menu-item {
    animation: popIn 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 8px;
    font-size: 0.9rem;
    color: var(--text);
    transition: background 0.2s ease;
    transition: transform 0.1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    background: transparent;
    border: none;
    width: 100%;
    font-family: inherit;
    text-align: left;
}

.context-menu-item:hover {
    background: var(--surface1);
}

.context-menu-item.delete {
    color: var(--accent-red);
    border: solid 2px var(--accent-red);
}
.context-menu-item.delete:hover {
    background: var(--surface1);
}

.context-menu-item.delete:active {
    transform: scale(0.95);
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes popIn {
    from {
        transform: scale(0.9);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

</style>
