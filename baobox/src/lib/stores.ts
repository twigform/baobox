import { writable, get } from 'svelte/store';
import type { Task, Column } from './types';

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
                status: 'todo'
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

export const columns = writable<Column[]>(initialColumns);

// Save tasks to localStorage whenever they change
columns.subscribe((value) => {
    localStorage.setItem('kanbanColumns', JSON.stringify(value));
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

export function addTask(columnStatus: 'todo' | 'inProgress' | 'done', title: string, description: string) {
    const newTask: Task = {
        id: generateId(),
        title,
        description,
        status: columnStatus
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

export function editTask(taskId: string, status: string, newTitle: string, newDescription: string) {
    columns.update(cols => {
        const column = cols.find(col => col.status === status);
        if (column) {
            const idx = column.tasks.findIndex(task => task.id === taskId);
            if (idx !== -1) {
                column.tasks[idx] = {
                    ...column.tasks[idx],
                    title: newTitle,
                    description: newDescription
                };
            }
        }
        return cols;
    });
}
