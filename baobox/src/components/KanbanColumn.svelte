<script lang="ts">
    import type { Column, Task, Tag } from '$lib/types';
    import { moveTask, draggedTask, dragOverColumn, addTask, deleteTask, editTask, tags, addTag, deleteTag, addTagToTask, removeTagFromTask, updateTag } from '$lib/stores';
    import { uiPreferences } from '$lib/stores/uiPreferences';
    import { onMount, onDestroy } from 'svelte';
    import { get } from 'svelte/store';
    import ContextMenu from './ContextMenu.svelte';
    import { flip } from 'svelte/animate';
    import { catppuccinMocha } from '$lib/theme';
    import { fade, scale } from 'svelte/transition';
    import { bounceOut, cubicInOut, cubicOut, quintOut, backOut } from 'svelte/easing';
    import { slide } from 'svelte/transition';

    export let column: Column;

    let deletingTasks = new Set<string>();
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
    let newTag = '';
    let newTagColor = '';
    let selectedTaskTags: Tag[] = [];
    let showTagInput = false;
    let showContextMenu = false;
    let contextMenuX = 0;
    let contextMenuY = 0;
    let selectedTask: Task | null = null;
    let showColorPicker = false;

    $: availableTags = $tags;

    function handleClickOutside(event: MouseEvent) {
        if (showColorPicker) {
            const colorPickerContainer = document.querySelector('.color-picker-container');
            if (colorPickerContainer && !colorPickerContainer.contains(event.target as Node)) {
                showColorPicker = false;
            }
        }
    }

    onMount(() => {
        document.addEventListener('click', handleClickOutside);
    });

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
        if (placeholderElement) {
            placeholderElement.remove();
        }
        document.removeEventListener('click', handleClickOutside);
    });

    const colorPalette = [
        '#f38ba8', // pink
        '#fab387', // peach
        '#f9e2af', // yellow
        '#a6e3a1', // green
        '#94e2d5', // teal
        '#89dceb', // sky
        '#74c7ec', // sapphire
        '#89b4fa', // blue
        '#cba6f7', // mauve
        '#f5c2e7', // flamingo
        '#eba0ac', // maroon
    ];

    function getContrastColor(hexColor: string): string {
        const color = hexColor.replace('#', '');
        
        const r = parseInt(color.substr(0, 2), 16);
        const g = parseInt(color.substr(2, 2), 16);
        const b = parseInt(color.substr(4, 2), 16);
        
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    function resetForm() {
        newTaskTitle = '';
        newTaskDescription = '';
        selectedTaskTags = [];
        showAddTask = false;
        editingTaskId = null;
        showTagInput = false;
        newTagColor = '';
        showColorPicker = false;
    }

    function selectColor(color: string) {
        newTagColor = color;
        showColorPicker = false;
    }

    function handleAddTag() {
        if (newTag.trim()) {
            const trimmedTag = newTag.trim();
            const tag: Tag = { 
                name: trimmedTag, 
                color: newTagColor || undefined 
            };
            addTag(tag);
            selectedTaskTags = [...selectedTaskTags, tag];
            newTag = '';
            newTagColor = '';
        }
    }

    function handleTagSelection(tag: Tag) {
        if (selectedTaskTags.find(t => t.name === tag.name)) {
            selectedTaskTags = selectedTaskTags.filter(t => t.name !== tag.name);
        } else {
            selectedTaskTags = [...selectedTaskTags, tag];
        }
    }

    function handleAddTask() {
        if (newTaskTitle.trim()) {
            const trimmedTitle = newTaskTitle.trim();
            const trimmedDescription = newTaskDescription.trim();
            
            if (editingTaskId !== null) {
                editTask(editingTaskId, column.status, trimmedTitle, trimmedDescription, [...selectedTaskTags]);
            } else {
                addTask(column.status, trimmedTitle, trimmedDescription, [...selectedTaskTags]);
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
            ${task.tags && task.tags.length > 0 ? `
                <div class="task-tags">
                    ${task.tags.map(tag => `<span class="tag" style="${tag.color ? `background-color: ${tag.color}; color: ${getContrastColor(tag.color)}; border-color: ${tag.color}` : ''}">${tag.name}</span>`).join('')}
                </div>
            ` : ''}
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

    let placeholderElement: HTMLElement | null = null;
    let currentInsertIndex: number | null = null;

    let dropTarget = {
        columnStatus: null as string | null,
        index: null as number | null
    };

    function handleDragMove(event: MouseEvent) {
        const dragged = get(draggedTask);
        if (!dragged.task || !ghostElement) return;

        requestAnimationFrame(() => {
            if (ghostElement) {
                ghostElement.style.left = `${event.clientX - dragged.mouseOffset.x}px`;
                ghostElement.style.top = `${event.clientY - dragged.mouseOffset.y}px`;
            }
        });

        const columns = document.querySelectorAll('.column');
        let foundColumn = false;

        if (!placeholderElement) {
            placeholderElement = document.createElement('div');
            placeholderElement.className = 'task-placeholder';
            placeholderElement.style.transition = 'transform 0.15s ease';
        }

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

                    const tasksContainer = col.querySelector('.tasks');
                    if (tasksContainer) {
                        const tasks = Array.from(tasksContainer.children).filter(
                            el => el !== placeholderElement && !el.classList.contains('being-dragged')
                        );
                        
                        let insertIndex = 0;
                        
                        if (tasks.length > 0) {
                            for (let i = 0; i < tasks.length; i++) {
                                const taskRect = tasks[i].getBoundingClientRect();
                                if (event.clientY < taskRect.top + taskRect.height / 2) {
                                    insertIndex = i;
                                    break;
                                }
                                if (i === tasks.length - 1) {
                                    insertIndex = tasks.length;
                                }
                            }
                        }

                        dropTarget = {
                            columnStatus,
                            index: insertIndex
                        };

                        if (placeholderElement && (!placeholderElement.parentElement || 
                            placeholderElement.nextElementSibling !== (tasks[insertIndex] || null))) {
                            
                            if (tasks.length === 0 || insertIndex === tasks.length) {
                                tasksContainer.appendChild(placeholderElement);
                            } else {
                                tasksContainer.insertBefore(placeholderElement, tasks[insertIndex]);
                            }
                        }
                    }
                }
            }
        });

        if (!foundColumn) {
            dragOverColumn.set(null);
            if (placeholderElement.parentElement) {
                placeholderElement.remove();
            }
            dropTarget = { columnStatus: null, index: null };
        }
    }

    function stopDragging(event: MouseEvent) {
        const dragged = get(draggedTask);
        
        if (dragged.task && dropTarget.columnStatus) {
            if (dropTarget.columnStatus === 'todo' || 
                dropTarget.columnStatus === 'inProgress' || 
                dropTarget.columnStatus === 'done') {
                moveTask(dragged.task.id, dragged.task.status, dropTarget.columnStatus, dropTarget.index);
            }
        }

        dropTarget = { columnStatus: null, index: null };

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

        const tasks = document.querySelectorAll('.task');
        tasks.forEach(task => {
            (task as HTMLElement).style.opacity = '1';
        });

        draggedTask.set({ task: null, mouseOffset: { x: 0, y: 0 } });
        dragOverColumn.set(null);
        window.removeEventListener('mouseup', mouseUpHandler);
        window.removeEventListener('mousemove', mouseMoveHandler);

        if (placeholderElement) {
            placeholderElement.remove();
            placeholderElement = null;
        }
        currentInsertIndex = null;
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
            selectedTaskTags = [...(selectedTask.tags || [])];
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
        if (placeholderElement) {
            placeholderElement.remove();
        }
        document.removeEventListener('click', handleClickOutside);
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
                        handleAddTask();
                    } else if (e.key === 'Escape') {
                        resetForm();
                    }
                }}
            ></textarea>
            
            <!-- Tags Section -->
            <div class="tags-section">
                <div class="selected-tags">
                    {#each selectedTaskTags as tag}
                        <span class="tag" style={tag.color ? `background-color: ${tag.color}; color: ${getContrastColor(tag.color)}; border-color: ${tag.color}` : ''}>
                            {tag.name}
                            <button 
                                class="remove-tag" 
                                on:click={() => {
                                    if (editingTaskId) {
                                        removeTagFromTask(editingTaskId, column.status, tag.name);
                                    }
                                    selectedTaskTags = selectedTaskTags.filter(t => t.name !== tag.name);
                                }}
                            >
                                &times;
                            </button>
                        </span>
                    {/each}
                </div>
                
                <div class="tag-input">
                    <div class="new-tag">
                        <input
                            type="text"
                            placeholder="New tag"
                            bind:value={newTag}
                            on:keydown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddTag();
                                }
                            }}
                        />
                        <div class="color-picker-container">
                            <button
                                type="button"
                                class="color-picker-button"
                                style={newTagColor ? `background-color: ${newTagColor}` : ''}
                                on:click={() => showColorPicker = !showColorPicker}
                                title="Choose tag color"
                            >
                                {#if newTagColor}
                                    <div class="color-preview" style="background-color: {newTagColor}"></div>
                                {:else}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z" />
                                    </svg>
                                {/if}
                            </button>
                            {#if showColorPicker}
                                <div 
                                    class="color-picker-menu"
                                    in:scale={{ duration: 200, start: 0.95, opacity: 0 }}
                                    out:scale={{ duration: 150, start: 1, opacity: 0 }}
                                >
                                    <div class="color-grid">
                                        {#each colorPalette as color}
                                            <button
                                                type="button"
                                                class="color-option"
                                                style="background-color: {color}"
                                                on:click={() => selectColor(color)}
                                                title={color}
                                            ></button>
                                        {/each}
                                        <button
                                            type="button"
                                            class="color-option clear-color"
                                            on:click={() => selectColor('')}
                                            title="No color"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            {/if}
                        </div>
                        <button on:click={handleAddTag}>+</button>
                    </div>
                    <div class="available-tags">
                        {#each availableTags as tag}
                            <div 
                                class="tag-option"
                                class:selected={selectedTaskTags.find(t => t.name === tag.name)}
                                style={tag.color ? `background-color: ${tag.color}; color: ${getContrastColor(tag.color)}; border-color: ${tag.color}` : ''}
                                on:click={() => {
                                    if (selectedTaskTags.find(t => t.name === tag.name)) {
                                        if (editingTaskId) {
                                            removeTagFromTask(editingTaskId, column.status, tag.name);
                                        }
                                        selectedTaskTags = selectedTaskTags.filter(t => t.name !== tag.name);
                                    } else {
                                        if (editingTaskId) {
                                            addTagToTask(editingTaskId, column.status, tag);
                                        }
                                        selectedTaskTags = [...selectedTaskTags, tag];
                                    }
                                }}
                            >
                                <span>{tag.name}</span>
                                <button 
                                    class="delete-tag"
                                    on:click|stopPropagation={() => deleteTag(tag.name)}
                                    title="Delete tag"
                                >
                                    &times;
                                </button>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>

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
                {#if task.tags && task.tags.length > 0}
                    <div class="task-tags">
                        {#each task.tags as tag}
                            <span class="tag" style={tag.color ? `background-color: ${tag.color}; color: ${getContrastColor(tag.color)}; border-color: ${tag.color}` : ''}>{tag.name}</span>
                        {/each}
                    </div>
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
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
        Edit
    </button>
    <button 
        type="button"
        class="context-menu-item delete" 
        on:click={handleDeleteTask}
    >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        </svg>
        Delete
    </button>
</ContextMenu>

<style>
/* Column */
.column {
    background: var(--surface0);
    border-radius: var(--column-radius);
    min-width: 300px;
    width: 300px;
    min-height: 400px;
    padding: 16px;
    transition: all 0.2s ease-out;
    display: flex;
    flex-direction: column;
    border: var(--column-border);
    box-shadow: var(--column-shadow);
}

/* Set dynamic variables based on preferences */
:global(:root) {
    --task-radius: var(--rounded-corners);
    --column-radius: var(--rounded-corners);
    --task-border: var(--border-style);
    --column-border: var(--border-style);
    --task-shadow: var(--shadow-style);
    --column-shadow: var(--shadow-style);
}

:global(:root[data-shadows="true"]) {
    --shadow-style: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

:global(:root[data-shadows="false"]) {
    --shadow-style: none;
}

:global(:root[data-borders="true"]) {
    --border-style: 2px solid var(--surface1);
}

:global(:root[data-borders="false"]) {
    --border-style: none;
}

:global(:root[data-rounded="true"]) {
    --rounded-corners: 15px;
}

:global(:root[data-rounded="false"]) {
    --rounded-corners: 0px;
}

.task {
    background: var(--base);
    border: var(--task-border);
    border-radius: var(--task-radius);
    padding: 12px;
    cursor: grab;
    user-select: none;
    text-wrap: pretty;
    hyphens: auto;
    word-break: break-word;
    height: fit-content;
    transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
    position: relative;
    box-shadow: var(--task-shadow);
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
    transform: scale(1.05);
}

.add-button:active {
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
    border: var(--task-border);
    border-radius: var(--task-radius);
    padding: 12px;
    cursor: grab;
    user-select: none;
    text-wrap: pretty;
    hyphens: auto;
    word-break: break-word;
    height: fit-content;
    transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
    position: relative;
    box-shadow: var(--task-shadow);
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
    border-radius: var(--task-radius);
    padding: 16px;
    color: var(--text);
    margin-bottom: 12px;
    width: 100%;
    box-sizing: border-box;
    box-shadow: var(--task-shadow);
    transition: transform 0.2s ease, border-color 0.2s ease;
}

.add-task-form:focus-within {
    border-color: var(--lavender);
    transform: translateY(-1px);
}

.add-task-form input,
.add-task-form textarea {
    width: 100%;
    padding: 12px;
    margin-bottom: 12px;
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
    opacity: 0.5;
    transition: opacity 0.2s ease;
}

.add-task-form input:focus::placeholder,
.add-task-form textarea:focus::placeholder {
    opacity: 0.3;
}

.add-task-form input:focus,
.add-task-form textarea:focus {
    border-color: var(--lavender);
    background: var(--base);
    outline: none;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
}

.form-actions button {
    padding: 8px 20px;
    border-radius: 8px;
    border: 2px solid transparent;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 100px;
}

.form-actions .add {
    background: var(--surface0);
    color: var(--text);
    border: 2px solid var(--surface2);
}

.form-actions .add:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--accent-green-rgb), 0.2);
}

.form-actions .add:active {
    transform: translateY(0);
}

.form-actions .cancel {
    background: var(--surface0);
    color: var(--text);
    border: 2px solid var(--surface2);
}

.form-actions .cancel:hover {
    background: var(--surface1);
    border-color: var(--surface1);
    transform: translateY(-2px);
}

.form-actions .cancel:active {
    transform: translateY(0);
}

.done-button {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: 2px solid var(--accent-green);
    padding: 4px;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50% !important;
    width: 28px;
    height: 28px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    color: var(--accent-green);
}

.task:hover .done-button {
    opacity: 1;
}

.done-button:hover {
    transform: scale(1.1);
    background: none;
    border-color: var(--accent-green);
}

.done-button:active {
    transform: scale(0.95);
}

.done-button svg {
    width: 14px;
    height: 14px;
    color: inherit;
}

:global(.task-ghost) {
    position: fixed;
    border: var(--task-border);
    pointer-events: none;
    z-index: 1000;
    background: var(--base);
    border-radius: var(--task-radius);
    padding: 12px;
    box-shadow: var(--task-shadow);
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
    color: var(--text);
    font-family: inherit;
}

:global(.task-ghost p) {
    margin: 0;
    font-size: 0.9rem;
    color: var(--overlay);
    font-family: inherit;
}

:global(.task-ghost .task-tags) {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
}

:global(.task-ghost .tag) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: var(--surface0);
    border: 1px solid var(--surface1);
    border-radius: 12px;
    font-size: 0.8rem;
    color: var(--text);
}

.context-menu-item {
    animation: popIn 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    padding: 10px 18px;
    cursor: pointer;
    border-radius: 8px !important;
    font-size: 1rem;
    color: var(--text);
    transition: all 0.2s ease;
    background: var(--surface0);
    border: 2px solid transparent;
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
    stroke-width: 2;
}

.context-menu-item.edit {
    color: var(--accent-blue);
    border: 2px solid var(--accent-blue);
}

.context-menu-item.edit:hover {
    background: var(--surface1);
    transform: translateY(-1px);
}

.context-menu-item.edit:active {
    transform: scale(0.98);
}

.context-menu-item.delete {
    color: var(--accent-red);
    border: 2px solid var(--accent-red);
}

.context-menu-item.delete:hover {
    background: var(--surface1);
    transform: translateY(-1px);
}

.context-menu-item.delete:active {
    transform: scale(0.98);
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

:global(.task-placeholder) {
    min-height: 80px;
    border: 2px dashed var(--surface2);
    border-radius: var(--task-radius);
    background: var(--surface0);
    margin: 8px 0;
    pointer-events: none;
    will-change: transform, opacity;
    transition: all 200ms cubic-bezier(0.2, 0, 0, 1);
    box-shadow: 0 0 0 1px rgba(203, 166, 247, 0.1);
    position: relative;
    overflow: hidden;
}

:global(.task-placeholder)::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        135deg,
        var(--surface0) 25%,
        var(--surface1) 25%,
        var(--surface1) 50%,
        var(--surface0) 50%,
        var(--surface0) 75%,
        var(--surface1) 75%
    );
    background-size: 8px 8px;
    opacity: 0.4;
    animation: moveBackground 30s linear infinite;
}

@keyframes moveBackground {
    0% {
        background-position: 0 0;
    }
    100% {
        background-position: 100px 100px;
    }
}

.tags-section {
    margin-bottom: 12px;
    background: var(--surface0);
    border-radius: 8px;
    padding: 12px;
    border: 2px solid var(--surface1);
    position: relative;
    overflow: visible;
}

.selected-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
}

.new-tag {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.new-tag input[type="text"] {
    flex: 1;
    padding: 8px;
    border: 2px solid var(--surface1);
    border-radius: 6px;
    background: var(--base);
    color: var(--text);
}

.color-picker-container {
    position: relative;
}

.color-picker-button {
    width: 40px;
    height: 36px;
    padding: 2px;
    border: 2px solid var(--surface1);
    border-radius: 6px;
    background: var(--base);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
}

.color-picker-button:hover {
    border-color: var(--lavender);
    transform: translateY(-1px);
}

.color-preview {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.color-picker-menu {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 9999;
    background: var(--base);
    border: 2px solid var(--surface1);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
    margin-top: 4px;
    backdrop-filter: blur(12px);
    overflow: visible;
    width: 255px;
    transform-origin: top left;
}

.color-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
    width: 184px;
}

.color-option {
    width: 24px;
    height: 24px;
    border: 2px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.color-option:hover {
    transform: scale(1.15);
    border-color: var(--text);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.clear-color {
    background: var(--surface0) !important;
    color: var(--text);
    border: 2px dashed var(--surface2) !important;
}

.clear-color:hover {
    border-color: var(--text) !important;
    background: var(--surface1) !important;
}

.new-tag button {
    width: 36px;
    height: 36px;
    padding: 0;
    background: var(--surface0);
    color: var(--text);
    border: 2px solid var(--surface2);
    border-radius: 6px;
    cursor: pointer;
    font-size: 1.2rem;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.new-tag button:hover {
    transform: translateY(-1px);
    border-color: var(--lavender);
    background: var(--surface1);
}

.new-tag button:active {
    transform: translateY(0);
}

.available-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.tag-option {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--surface0);
    border: 1px solid var(--surface1);
    border-radius: 15px;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
}

.tag-option:hover {
    background: var(--surface1);
}

.tag-option span {
    flex: 1;
}

.tag-option.selected {
    background: var(--lavender);
    color: var(--base);
    border-color: var(--lavender);
}

.delete-tag {
    padding: 0 4px;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
    opacity: 0.6;
}

.delete-tag:hover {
    opacity: 1;
}

.tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: var(--surface0);
    border: 1px solid var(--surface1);
    border-radius: 12px;
    font-size: 0.8rem;
    color: var(--text);
}

.remove-tag {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0;
    font-size: 1.1rem;
    line-height: 1;
    opacity: 0.6;
}

.remove-tag:hover {
    opacity: 1;
}

.task-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
}
</style>
