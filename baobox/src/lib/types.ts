export interface Tag {
    name: string;
    color?: string; // Optional custom color, falls back to default if not set
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'inProgress' | 'done';
    tags: Tag[]; // Change from string[] to Tag[]
}

export interface Column {
    id: string;
    title: string;
    status: 'todo' | 'inProgress' | 'done';
    tasks: Task[];
}
