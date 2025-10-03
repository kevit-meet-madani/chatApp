import { Component, HostListener, OnInit } from '@angular/core';
import { Task, TaskStatus } from '../task.model';
import { TaskService } from '../task.service';

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
    assignedTo: '',
    status: 'todo',
  };

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {

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
      .sort((a, b) => b.createdAt!.localeCompare(a.createdAt!));
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
    this.form = { name: '', description: '', assignedTo: '', status: 'todo' };
  }

  editTask(task: Task) {
    this.isDrawerOpen = true;
    this.editingId = task.id ?? null;
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
    } else {
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

  // ---------------- AI Report Logic ----------------
  generateReport() {
    this.isReportOpen = true;
    this.isGeneratingReport = true;
    this.reportContent = '';
    this.showReport = true;

    setTimeout(() => {
      const counts: any = { todo: 0, 'in-progress': 0, done: 0 };
      this.tasks.forEach((t) => (counts[t.status] = (counts[t.status] || 0) + 1));

      const top = this.tasks
        .slice(0, 5)
        .map(
          (t) =>
            `• ${t.name} (${t.assignedTo || 'Unassigned'}) [${this.statusText(t.status)}]`
        )
        .join('\n');

      this.reportContent = `AI-generated summary\n\nTotals:\nTo do: ${counts.todo}\nIn progress: ${counts['in-progress']}\nDone: ${counts.done}\n\nTop tasks:\n${top}\n\nGenerated at ${new Date().toLocaleString()}`;
      this.isGeneratingReport = false;
    }, 900);
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
