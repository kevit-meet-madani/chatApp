export type TaskStatus = 'todo' | 'in-progress' | 'done';


export interface Task {
id: string;
name: string;
description?: string;
assignedTo?: string;
status: TaskStatus;
createdAt: string; // ISO timestamp
dueDate?: string | null;
priority?: 'low' | 'medium' | 'high';
}