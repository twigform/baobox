import { writable, get } from 'svelte/store';
import type { Task, Column, Tag } from './types';

// Load tasks from localStorage if available
const savedColumns = localStorage.getItem('kanbanColumns');
const initialColumns: Column[] = savedColumns ? JSON.parse(savedColumns) : [
    {
        id: '1',
        title: 'To Do',
        status: 'todo',
        tasks: [
            {
                id: '1',
                title: 'Create Kanban Board',
                description: 'Implement a Kanban board with drag and drop',
                status: 'todo',
                tags: []
            }
        ]
    },
    {
        id: '2',
        title: 'In Progress',
        status: 'inProgress',
        tasks: []
    },
    {
        id: '3',
        title: 'Done',
        status: 'done',
        tasks: []
    }
];

// Load tags from localStorage if available
const savedTags = localStorage.getItem('kanbanTags');
let initialTags: Tag[] = [];
if (savedTags) {
    const parsed = JSON.parse(savedTags);
    // Handle backward compatibility: convert string tags to Tag objects
    initialTags = parsed.map((tag: any) => {
        if (typeof tag === 'string') {
            return { name: tag };
        }
        return tag;
    });
} else {
    initialTags = [];
}

// Also handle backward compatibility for tasks
if (savedColumns) {
    const parsedColumns = JSON.parse(savedColumns);
    parsedColumns.forEach((col: any) => {
        col.tasks.forEach((task: any) => {
            if (task.tags && Array.isArray(task.tags)) {
                task.tags = task.tags.map((tag: any) => {
                    if (typeof tag === 'string') {
                        return { name: tag };
                    }
                    return tag;
                });
            }
        });
    });
    // Update the initial columns with converted data
    initialColumns.splice(0, initialColumns.length, ...parsedColumns);
}

export const columns = writable<Column[]>(initialColumns);
export const tags = writable<Tag[]>(initialTags);

// Save tasks and tags to localStorage whenever they change
columns.subscribe((value) => {
    localStorage.setItem('kanbanColumns', JSON.stringify(value));
});

tags.subscribe((value) => {
    localStorage.setItem('kanbanTags', JSON.stringify(value));
});

// Dragging state
export const draggedTask = writable<{ task: Task | null, mouseOffset: { x: number, y: number } }>({
    task: null,
    mouseOffset: { x: 0, y: 0 }
});

export const dragOverColumn = writable<string | null>(null);

// Generate a unique ID for new tasks
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function addTask(columnStatus: 'todo' | 'inProgress' | 'done', title: string, description: string, tags: Tag[] = []) {
    const newTask: Task = {
        id: generateId(),
        title,
        description,
        status: columnStatus,
        tags: [...tags]
    };

    columns.update(cols => {
        const targetColumn = cols.find(col => col.status === columnStatus);
        if (targetColumn) {
            targetColumn.tasks = [...targetColumn.tasks, newTask];
        }
        return cols;
    });
}

export function deleteTask(taskId: string, status: string) {
    columns.update(cols => {
        const column = cols.find(col => col.status === status);
        if (column) {
            column.tasks = column.tasks.filter(task => task.id !== taskId);
        }
        return cols;
    });
}

export function moveTask(taskId: string, fromStatus: 'todo' | 'inProgress' | 'done', toStatus: 'todo' | 'inProgress' | 'done', insertIndex: number | null = null) {
    columns.update(cols => {
        const fromColumn = cols.find(col => col.status === fromStatus);
        const toColumn = cols.find(col => col.status === toStatus);
        
        if (!fromColumn || !toColumn) return cols;
        
        const taskIndex = fromColumn.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return cols;
        
        // Remove task from source
        const [task] = fromColumn.tasks.splice(taskIndex, 1);
        task.status = toStatus;
        
        // Insert task at target position
        if (insertIndex !== null) {
            toColumn.tasks.splice(insertIndex, 0, task);
        } else {
            toColumn.tasks.push(task);
        }
        
        return cols;
    });
}

export function editTask(taskId: string, status: string, newTitle: string, newDescription: string, newTags: Tag[] = []) {
    columns.update(cols => {
        const column = cols.find(col => col.status === status);
        if (column) {
            const idx = column.tasks.findIndex(task => task.id === taskId);
            if (idx !== -1) {
                column.tasks[idx] = {
                    ...column.tasks[idx],
                    title: newTitle,
                    description: newDescription,
                    tags: newTags
                };
            }
        }
        return cols;
    });
}

// Tag management functions
export function addTag(tag: Tag) {
    tags.update(currentTags => {
        if (!currentTags.find(t => t.name === tag.name)) {
            return [...currentTags, tag];
        }
        return currentTags;
    });
}

export function deleteTag(tagName: string) {
    tags.update(currentTags => currentTags.filter(t => t.name !== tagName));
    
    // Remove the tag from all tasks
    columns.update(cols => {
        return cols.map(col => ({
            ...col,
            tasks: col.tasks.map(task => ({
                ...task,
                tags: task.tags.filter(t => t.name !== tagName)
            }))
        }));
    });
}

export function updateTag(oldName: string, newTag: Tag) {
    tags.update(currentTags => 
        currentTags.map(t => t.name === oldName ? newTag : t)
    );
    
    // Update the tag in all tasks
    columns.update(cols => {
        return cols.map(col => ({
            ...col,
            tasks: col.tasks.map(task => ({
                ...task,
                tags: task.tags.map(t => t.name === oldName ? newTag : t)
            }))
        }));
    });
}

export function addTagToTask(taskId: string, status: string, tag: Tag) {
    columns.update(cols => {
        const column = cols.find(col => col.status === status);
        if (column) {
            const task = column.tasks.find(t => t.id === taskId);
            if (task && !task.tags.find(t => t.name === tag.name)) {
                task.tags = [...task.tags, tag];
            }
        }
        return cols;
    });
}

export function removeTagFromTask(taskId: string, status: string, tagName: string) {
    columns.update(cols => {
        const column = cols.find(col => col.status === status);
        if (column) {
            const task = column.tasks.find(t => t.id === taskId);
            if (task) {
                task.tags = task.tags.filter(t => t.name !== tagName);
            }
        }
        return cols;
    });
}
