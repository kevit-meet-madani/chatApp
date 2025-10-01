import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, TaskStatus } from '../task.model';
import { TaskService } from '../task.service';
import { io } from 'socket.io-client';



@Component({
selector: 'app-task-lists',
templateUrl: './tasklist.component.html',
styles: []
})

export class TaskListsComponent {

    socket!:any
    users:any = [];
    ngOnInit(){
    
    this.socket = io('http://localhost:7000', {
           transports: ['websocket'], // ensures pure WS (optional, avoids polling)
           reconnectionAttempts: 3
     }); 
     

    this.socket.on("onlineUsers", (users: string[]) => {
       this.users = users;
     });
  }

    

    tasks: Task[] = [];
    search = '';
    filterStatus: '' | TaskStatus = '';


    isDrawerOpen = false;
    editingId: string | null = null;


     form: Partial<Task> = {
         name: '',
         description: '',
         assignedTo: '',
         status: 'todo',
      };


constructor(private taskService: TaskService) {
         this.tasks = this.taskService.getAll();
         this.taskService.tasksObservable.subscribe((t) => (this.tasks = t));
  }


get filteredTasks(): Task[] {
         const q = this.search.trim().toLowerCase();
         return this.tasks
        .filter((t) => {
         const matchesStatus = !this.filterStatus || t.status === this.filterStatus;
         const matchesQuery =
         !q ||
        t.name.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.assignedTo || '').toLowerCase().includes(q);
        return matchesStatus && matchesQuery;
     })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }


     statusText(s: TaskStatus) {
              switch (s) {
                    case 'todo':
                       return 'To do';
                    case 'in-progress':
                       return 'In progress';
                    case 'done':
                       return 'Done';
               }
      }


        statusBadgeClass(s: TaskStatus) {
// base classes plus status-specific color
              const base = 'px-3 py-1 rounded-full text-sm font-semibold';
              if (s === 'todo') return base + ' bg-yellow-400 text-gray-900';
              if (s === 'in-progress') return base + ' bg-blue-500 text-white';
            return base + ' bg-green-600 text-white';
        }


       private generateId() {
           return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        }


       openAdd() {
           this.isDrawerOpen = true;
           this.editingId = null;
           this.form = { name: '', description: '', assignedTo: '', status: 'todo' };
        }


       editTask(task: Task) {
            this.isDrawerOpen = true;
            this.editingId = task.id;
            this.form = { ...task };
        }
      closeDrawer() {
           this.isDrawerOpen = false;
           this.editingId = null;
           this.form = { name: '', description: '', assignedTo: '', status: 'todo' };
       }


     save() {
          if (!this.form.name || !this.form.status) return alert('Please provide a name and status');


          if (this.editingId) {
// update existing
              const updated: Task = {
              id: this.editingId,
              name: this.form.name!.trim(),
              description: this.form.description || '',
              assignedTo: this.form.assignedTo || '',
              status: this.form.status as TaskStatus,
              createdAt: new Date().toISOString(),
              };
             this.taskService.update(updated);
          } 
          else {
// add new
           const newTask: Task = {
           id: this.generateId(),
           name: this.form.name!.trim(),
           description: this.form.description || '',
           assignedTo: this.form.assignedTo || '',
           status: this.form.status as TaskStatus,
           createdAt: new Date().toISOString(),
           };
          this.taskService.add(newTask);
        }


        this.closeDrawer();
    }


       toggleStatus(task: Task) {
           const next: Task = { ...task };
           if (task.status === 'todo') next.status = 'in-progress';
           else if (task.status === 'in-progress') next.status = 'done';
           else next.status = 'todo';
           this.taskService.update(next);
        }


     deleteTask(task: Task) {
         if (!confirm('Delete this task?')) return;
         this.taskService.delete(task.id);
      }
}