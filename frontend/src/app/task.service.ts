import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Task } from './task.model';


const SAMPLE_TASKS: Task[] = [
{
id: 't1',
name: 'Fix login bug',
description: 'Users sometimes lose session after refresh',
assignedTo: 'Priya',
status: 'in-progress',
createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
priority: 'high',
},
{
id: 't2',
name: 'Design landing page',
description: 'New hero section + CTA',
assignedTo: 'Alice',
status: 'todo',
createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
priority: 'medium',
},
{
id: 't3',
name: 'Database backup',
description: 'Add scheduled backup and test restore',
assignedTo: 'Arjun',
status: 'done',
createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
priority: 'low',
},
];


@Injectable({ providedIn: 'root' })
export class TaskService {
private tasks$ = new BehaviorSubject<Task[]>(SAMPLE_TASKS);


// Observable (if you prefer to subscribe)
public readonly tasksObservable = this.tasks$.asObservable();


get snapshot(): Task[] {
return this.tasks$.getValue();
}


getAll(): Task[] {
return this.snapshot;
}


add(task: Task) {
this.tasks$.next([task, ...this.snapshot]);
}


update(task: Task) {
const next = this.snapshot.map((t) => (t.id === task.id ? task : t));
this.tasks$.next(next);
}


delete(id: string) {
this.tasks$.next(this.snapshot.filter((t) => t.id !== id));
}
}