export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'inProgress' | 'done';
}

export interface Column {
    id: string;
    title: string;
    status: 'todo' | 'inProgress' | 'done';
    tasks: Task[];
}
