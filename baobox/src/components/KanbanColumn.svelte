<!-- filepath: src/components/KanbanColumn.svelte -->
<script lang="ts">
    import type { Column, Task } from '$lib/types';
    import { moveTask, draggedTask, dragOverColumn, addTask, deleteTask, editTask } from '$lib/stores';
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
    let titleInput: HTMLInputElement | null = null;
    let descInput: HTMLTextAreaElement | null = null;

    let columnElement: HTMLDivElement;
    let mouseUpHandler: (e: MouseEvent) => void;
    let mouseMoveHandler: (e: MouseEvent) => void;
    let ghostElement: HTMLElement | null = null;
    let showAddTask = false;
    let newTaskTitle = '';
    let newTaskDescription = '';
    let editingTaskId: string | null = null;

    onMount(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't' && column.status === 'todo') {
                e.preventDefault();
                showAddTask = true;

                setTimeout(() => {
                    titleInput?.focus();
                }, 0);
            }
        };

        window.addEventListener('keydown', handleKeydown);
        return () => {
            window.removeEventListener('keydown', handleKeydown);
        };
    });

    

    let showContextMenu = false;
    let contextMenuX = 0;
    let contextMenuY = 0;
    let selectedTask: Task | null = null;

    function resetForm() {
        newTaskTitle = '';
        newTaskDescription = '';
        showAddTask = false;
        editingTaskId = null;
    }

    function handleAddTask() {
        if (newTaskTitle.trim()) {
            if (editingTaskId !== null) {
                // Edit mode: update the task in the store
                editTask(editingTaskId, column.status, newTaskTitle.trim(), newTaskDescription.trim());
            } else {
                // Add mode
                addTask(column.status, newTaskTitle.trim(), newTaskDescription.trim());
            }
            resetForm();
        }
    }

    function handleDeleteTaskAnimated(task: Task) {
        const taskElement = document.querySelector(`[data-task-id="${task.id}"]`) as HTMLElement;
        if (taskElement) {
            taskElement.style.transform = 'scale(0.9)';
            taskElement.style.opacity = '0';
        }
        
        setTimeout(() => {
            deleteTask(task.id, task.status);
        }, 300); 
    }

    function onOutroEnd(taskId: string) {
        deleteTask(taskId, column.status);
        deletingTasks.delete(taskId);
    }

    function createGhostElement(task: Task, x: number, y: number) {
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

        ghostElement.style.opacity = '0';
        ghostElement.style.position = 'fixed';
        ghostElement.style.left = `${x}px`;
        ghostElement.style.top = `${y}px`;
        ghostElement.style.width = '280px';
        ghostElement.style.pointerEvents = 'none';
        
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

        createGhostElement(task, event.clientX - mouseOffset.x, event.clientY - mouseOffset.y);

        draggedTask.set({
            task,
            mouseOffset
        });

        mouseUpHandler = (e: MouseEvent) => stopDragging(e);
        mouseMoveHandler = (e: MouseEvent) => handleDragMove(e);

        window.addEventListener('mouseup', mouseUpHandler);
        window.addEventListener('mousemove', mouseMoveHandler);

        taskElement.style.opacity = '0.5';
    }

    function handleDragMove(event: MouseEvent) {
        const dragged = get(draggedTask);
        if (!dragged.task || !ghostElement) return;

        requestAnimationFrame(() => {
            if (ghostElement) {
                // Move ghost element
                ghostElement.style.left = `${event.clientX - dragged.mouseOffset.x}px`;
                ghostElement.style.top = `${event.clientY - dragged.mouseOffset.y}px`;
            }
        });

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
            // Ensure overColumn is a valid status
            if (overColumn === 'todo' || overColumn === 'inProgress' || overColumn === 'done') {
                moveTask(dragged.task.id, dragged.task.status, overColumn);
            }
        }

        if (ghostElement) {
            ghostElement.style.opacity = '0';
            ghostElement.style.transform = 'rotate(0deg) scale(0.95)';
            
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

    function handleEditTask() {
        if (selectedTask) {
            newTaskTitle = selectedTask.title;
            newTaskDescription = selectedTask.description || '';
            editingTaskId = selectedTask.id;
            showAddTask = true;
            showContextMenu = false;
            setTimeout(() => {
                titleInput?.focus();
            }, 0);
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
                bind:this={titleInput}
                on:keydown={(e) => {
                    if (e.key === "Enter") {
                    e.preventDefault();
                    descInput?.focus();
                    }
                }}
            />
            <textarea
                placeholder="Task description (optional)"
                bind:value={newTaskDescription}
                bind:this={descInput}
                rows="3"
                on:keydown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTask(); // submit
                    } else if (e.key === 'Escape') {
                        resetForm();
                    }
                }}
            ></textarea>
            <div class="form-actions">
                <button class="cancel" on:click={resetForm}>Cancel</button>
                <button class="add" on:click={handleAddTask}>{editingTaskId !== null ? 'Save Changes' : 'Add Task'}</button>
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
                animate:flip={{ duration: 300 }}
                out:fade={{ duration: 300 }}
                data-task-id={task.id}
            >
                <h3>{task.title}</h3>
                {#if task.description}
                    <p>{task.description}</p>
                {/if}
                <button
                    class="done-button"
                    aria-label="Mark task done"
                    on:click|stopPropagation={() => handleDeleteTaskAnimated(task)}
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
        class="context-menu-item edit" 
        on:click={handleEditTask}
    >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:middle;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
        Edit Task
    </button>
    <button 
        type="button"
        class="context-menu-item delete" 
        on:click={handleDeleteTask}
    >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:middle;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
    background: var(--surface0);
    border-radius: 15px;
    min-width: 300px;
    width: 300px;
    min-height: 400px;
    padding: 16px;
    transition: background-color 0.2s ease, transform 0.2s ease-out;
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

.column.drag-over {
    background: var(--surface0);
    box-shadow: 0 0 0 2px var(--accent-blue);
    transform: scale(1.01);
}


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


.task {
    background: var(--base);
    border: solid 2px var(--surface1);
    border-radius: 10px;
    padding: 12px;
    cursor: grab;
    user-select: none;
    text-wrap: pretty;
    hyphens: auto;
    word-break: break-word;
    height: fit-content;
    transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
    position: relative;
}

.task.being-dragged {
    opacity: 0.5;
    transform: scale(0.95);

}

.task:hover {
    transform: scale(0.98);
}


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


.add-task-form {
    background: var(--base);
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
    background: var(--surface0);
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

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0;
    margin-top: 8px;
}

.form-actions button {
    padding: 6px 18px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    margin-left: 8px;
    margin-right: 0;
}

.form-actions button:first-child {
    margin-left: 0;
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


:global(.task-ghost) {
    position: fixed;
    border: solid 2px var(--surface1);
    pointer-events: none;
    z-index: 1000;
    background: var(--base);
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
    width: 280px;
    text-wrap: pretty;
    hyphens: auto;
    word-break: break-word;
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


.context-menu-item {
    animation: popIn 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    padding: 10px 18px;
    cursor: pointer;
    border-radius: 8px;
    font-size: 1rem;
    color: var(--text);
    transition: background 0.2s ease, transform 0.1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    background: transparent;
    border: none;
    width: 100%;
    font-family: inherit;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}

.context-menu-item:last-child {
    margin-bottom: 0;
}

.context-menu-item svg {
    display: inline-block;
    vertical-align: middle;
    margin-right: 8px;
    flex-shrink: 0;
}

.context-menu-item.edit {
    color: var(--accent-blue);
    border: solid 2px var(--accent-blue);
}
.context-menu-item.edit:hover {
    background: var(--surface1);
}
.context-menu-item.edit:active {
    transform: scale(0.95);
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
