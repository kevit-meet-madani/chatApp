import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from './task.model';
import { HttpClient } from '@angular/common/http';


const SAMPLE_TASKS: Task[] = [];


@Injectable({ providedIn: 'root' })


export class TaskService {

    constructor(private http:HttpClient) {}

    url = 'http://localhost:7000/tasks'
    private tasks$ = new BehaviorSubject<Task[]>(SAMPLE_TASKS);


    // Observable (if you prefer to subscribe)
    public readonly tasksObservable = this.tasks$.asObservable();


    get snapshot(): Task[] {
        return this.tasks$.getValue();
    }


    getAll(roomid:any): Observable<Task[]> {
       return this.http.get<Task[]>(`${this.url}/${roomid}`);
    }


    add(task: Task) {
        return this.http.post<Task>(`${this.url}/add/${localStorage.getItem('roomid')}`,task);
    }


    update(task: Task) {
        return this.http.patch<Task>(`${this.url}/edit/${task.id}`,task);
    }

    update2(task: Task) {
        return this.http.patch<Task>(`${this.url}/edit/full/${task.id}`,task);
    }


    delete(id: number) {
        return this.http.delete<Task>(`${this.url}/delete/${id}`);
    }
}