import { Component, HostListener, OnInit } from '@angular/core';
import { Task, TaskStatus } from '../task.model';
import { TaskService } from '../task.service';
import { subscribe } from 'node:diagnostics_channel';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-task-lists',
  templateUrl: './tasklist.component.html',
  styles: []
})
export class TaskListsComponent implements OnInit {
  tasks: Task[] = [];
  search = '';
  filterStatus: '' | TaskStatus = '';

  isDrawerOpen = false;
  editingId: number | null = null;
  showReport = false;

  // --- New state for AI report ---
  isReportOpen = false;
  isGeneratingReport = false;
  reportContent = '';

  form: Partial<Task> = {
    name: '',
    description: '',
    assigned_to: '',
    status: 'todo',
  };

  constructor(private taskService: TaskService,private http:HttpClient) {}

  ngOnInit(): void {
     this.getTasks();
  }

  getTasks(){
    this.taskService.getAll(localStorage.getItem('roomid')).subscribe({
      next:(response) => {
         this.tasks = response;
         console.log(response)
      },

      error: (error) => {
        console.log(error);
      }
    });
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
        (t.assigned_to || '').toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    })
    .sort((a, b) => {
      const dateA = a.createdAt || '';
      const dateB = b.createdAt || '';
      return dateB.localeCompare(dateA);
    });
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
    const base = 'px-3 py-1 rounded-full text-sm font-semibold';
    if (s === 'todo') return base + ' bg-yellow-400 text-gray-900';
    if (s === 'in-progress') return base + ' bg-blue-500 text-white';
    return base + ' bg-green-600 text-white';
  }

  private generateId() {
    return Number(Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
  }

  openAdd() {
    this.isDrawerOpen = true;
    this.editingId = null;
    this.form = { name: '', description: '', assigned_to: '', status: 'todo' };
  }

  editTask(task: Task) {
    this.isDrawerOpen = true;
    this.editingId = task.id ?? null;
    this.form = { ...task };
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.editingId = null;
    this.form = { name: '', description: '', assigned_to: '', status: 'todo' };
  }

  save() {
    if (!this.form.name || !this.form.status) return alert('Please provide a name and status');

    if (this.editingId !== null) {
      // update existing
      const updated: Task = {
        id: this.editingId,
        name: this.form.name!.trim(),
        description: this.form.description || '',
        assigned_to: this.form.assigned_to || '',
        status: this.form.status as TaskStatus,
        createdAt: new Date().toISOString(),
      };
      alert(JSON.stringify(updated))
      const index = this.tasks.findIndex(t => t.id === this.form.id);
  if (index > -1) this.tasks[index] = updated;
      this.taskService.update2(updated).subscribe({
        next: (response) => {
          console.log(response);
        },

        error: (error) => {
          console.log(error);
        }
      });
    } else {
      // add new
      const newTask: Task = {
        id: this.generateId(),
        name: this.form.name!.trim(),
        description: this.form.description || '',
        assigned_to: this.form.assigned_to || '',
        status: this.form.status as TaskStatus,
        createdAt: new Date().toISOString(),
      };
      this.tasks.push(newTask);
      this.taskService.add(newTask).subscribe({
        next:(response) => {
          console.log(response);
          this.getTasks();
        },

        error:(error) => {
          console.log(error);
        }
      });
    }

    this.closeDrawer();
  }

  toggleStatus(task: Task) {
  const next: Task = { ...task };

  switch ((task.status || '').toLowerCase()) {
    case 'todo':
      next.status = 'in-progress';
      break;
    case 'in-progress':
      next.status = 'done';
      break;
    default:
      next.status = 'todo';
  }
  const index = this.tasks.findIndex(t => t.id === task.id);
  if (index > -1) this.tasks[index].status = next.status;
  this.taskService.update(next).subscribe({
    next: (updated) => {
      // Update the task in the array to trigger UI change
      
    },
    error: (err) => console.error('Update failed:', err)
  });
}



  // ...existing code...
deleteTask(task: Task) {
  if (!confirm('Delete this task?')) return;

  this.tasks = this.tasks.filter(t => t.id !== task.id);
  if (typeof task.id === 'number') {
    this.taskService.delete(task.id).subscribe({
      next: (response) => {
        console.log("deleted");
      },

      error: (error) => {
        console.log(error);
      }
    });
  } else {
    console.error('Invalid task id:', task.id);
  }
}
// ...existing code...

  // ---------------- AI Report Logic ----------------
  generateReport() {
  this.isReportOpen = true;
  this.isGeneratingReport = true;
  this.reportContent = '';
  this.showReport = true;

  // Prepare data to send to your API if needed

  // Call your API
  this.http.get(`http://172.24.2.207:7000/ai/generate-ai-report/${localStorage.getItem('roomid')}`)
    .subscribe({
      next: (res) => {
        // The API returns markdown text
        this.reportContent = JSON.stringify(res);
        console.log(res);
        this.isGeneratingReport = false;
      },
      error: (err) => {
        console.error('Failed to generate report', err);
        this.reportContent = 'Failed to generate report. Please try again.';
        this.isGeneratingReport = false;
      }
    });
}


  closeReport() {
    this.isReportOpen = false;
    this.isGeneratingReport = false;
    this.reportContent = '';
    this.showReport = false;
  }

  // Close modal/drawer on ESC key
  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(_: KeyboardEvent) {
    if (this.isReportOpen) this.closeReport();
    if (this.isDrawerOpen) this.closeDrawer();
  }
}
