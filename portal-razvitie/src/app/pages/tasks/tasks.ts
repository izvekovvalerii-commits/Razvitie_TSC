import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TasksService } from '../../services/tasks';
import { AuthService } from '../../services/auth.service';
import { ProjectTask, TASK_STATUSES } from '../../models/task.model';
import { User } from '../../models/user.model';

@Component({
    selector: 'app-tasks',
    imports: [CommonModule, FormsModule],
    templateUrl: './tasks.html',
    styleUrl: './tasks.css'
})
export class TasksComponent implements OnInit {
    allTasks: ProjectTask[] = [];
    filteredTasks: ProjectTask[] = [];
    loading = true;
    currentUser: User | null = null;

    searchQuery = '';
    statusFilter = '';
    typeFilter = '';
    responsibleFilter = '';
    taskStatuses = TASK_STATUSES;
    showOnlyOverdue = false;
    showOnlyExpiringSoon = false;

    get uniqueTaskTypes(): string[] {
        return Array.from(new Set(this.allTasks.map(t => t.taskType).filter(Boolean))).sort();
    }

    get uniqueResponsibles(): string[] {
        const responsibles = this.allTasks.map(t => this.getResponsibleDisplay(t)).filter(Boolean);
        return Array.from(new Set(responsibles)).sort();
    }

    constructor(
        private tasksService: TasksService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        // Получаем текущего пользователя
        this.authService.currentUser.subscribe(user => {
            this.currentUser = user;

            // Читаем query параметры
            this.route.queryParams.subscribe(params => {
                if (params['status']) {
                    this.statusFilter = params['status'];
                }
                if (params['overdue'] === 'true') {
                    this.showOnlyOverdue = true;
                }
                if (params['expiringSoon'] === 'true') {
                    this.showOnlyExpiringSoon = true;
                }
                this.loadTasks();
            });
        });
    }

    loadTasks() {
        this.loading = true;
        this.tasksService.getAllTasks().subscribe({
            next: (data) => {
                this.allTasks = data;
                this.filterTasks();
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading tasks:', err);
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    sortColumn = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    sortTasks(column: string) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        this.filterTasks();
    }

    filterTasks() {
        this.filteredTasks = this.allTasks.filter(task => {
            // БА видит все задачи, остальные - только свои (если нужно такое ограничение)
            // Но пользователь просит переделать вид списка, возможно, ограничения стоит смягчить или оставить.
            // Пока оставляем базовую проверку доступа, если она была критична.
            // Если пользователь хочет видеть ВСЕ задачи, он должен быть БА или админом.

            const matchUser = !this.currentUser ||
                this.currentUser.role === 'БА' ||
                task.responsibleUserId === this.currentUser.id ||
                task.responsible === this.currentUser.name ||
                task.responsible === this.currentUser.role;

            const matchSearch = !this.searchQuery ||
                task.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (task.projectId && task.projectId.toString().includes(this.searchQuery));

            const matchStatus = !this.statusFilter || task.status === this.statusFilter;
            const matchType = !this.typeFilter || task.taskType === this.typeFilter;

            // Фильтр по ответственному
            const taskResp = this.getResponsibleDisplay(task);
            const matchResp = !this.responsibleFilter || taskResp === this.responsibleFilter;

            // Фильтр просроченных задач
            let matchOverdue = true;
            if (this.showOnlyOverdue) {
                const deadline = new Date(task.normativeDeadline);
                const now = new Date();
                deadline.setHours(0, 0, 0, 0);
                now.setHours(0, 0, 0, 0);
                matchOverdue = deadline < now && task.status !== 'Выполнена' && task.status !== 'Завершена';
            }

            // Фильтр истекающих через 1 день задач
            let matchExpiringSoon = true;
            if (this.showOnlyExpiringSoon) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);

                const dayAfterTomorrow = new Date(tomorrow);
                dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

                const deadline = new Date(task.normativeDeadline);
                deadline.setHours(0, 0, 0, 0);

                matchExpiringSoon = deadline >= tomorrow && deadline < dayAfterTomorrow &&
                    task.status !== 'Выполнена' && task.status !== 'Завершена';
            }

            return matchUser && matchSearch && matchStatus && matchType && matchResp && matchOverdue && matchExpiringSoon;
        });

        // Sorting
        if (this.sortColumn) {
            this.filteredTasks.sort((a, b) => {
                let valA = this.getSortValue(a, this.sortColumn);
                let valB = this.getSortValue(b, this.sortColumn);

                // Handle dates and numbers
                if (typeof valA === 'string' && !isNaN(Date.parse(valA)) && (this.sortColumn.includes('Date') || this.sortColumn.includes('Deadline') || this.sortColumn.includes('At'))) {
                    valA = new Date(valA).getTime();
                }
                if (typeof valB === 'string' && !isNaN(Date.parse(valB)) && (this.sortColumn.includes('Date') || this.sortColumn.includes('Deadline') || this.sortColumn.includes('At'))) {
                    valB = new Date(valB).getTime();
                }

                if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        console.log(`[TasksComponent] Filtered tasks:`, this.filteredTasks.length);
    }

    private getSortValue(task: ProjectTask, column: string): any {
        switch (column) {
            case 'name': return task.name || '';
            case 'projectId': return task.projectId || 0;
            case 'taskType': return task.taskType || '';
            case 'status': return task.status || '';
            case 'responsible': return this.getResponsibleDisplay(task) || '';
            case 'normativeDeadline': return task.normativeDeadline || '';
            case 'actualDate': return task.actualDate || '';
            case 'createdAt': return task.createdAt || '';
            default: return '';
        }
    }

    getTaskDeviation(task: ProjectTask): { days: number, type: 'early' | 'late' } | undefined {
        if (!task || !task.normativeDeadline || !task.actualDate) {
            return undefined;
        }

        const dayMs = 1000 * 60 * 60 * 24;
        const planDate = new Date(task.normativeDeadline);
        const actualDate = new Date(task.actualDate);

        // Positive diff means Plan > Actual (Early finish - good!)
        // Negative diff means Plan < Actual (Late finish - bad!)
        const diff = (planDate.getTime() - actualDate.getTime()) / dayMs;

        if (diff > 0) return { days: Math.round(diff), type: 'early' };
        if (diff < 0) return { days: Math.round(Math.abs(diff)), type: 'late' };

        return undefined;
    }

    getStatusClass(status: string): string {
        const map: { [key: string]: string } = {
            'Назначена': 'status-assigned',
            'В работе': 'status-in-progress',
            'Завершена': 'status-completed',
            'Срыв сроков': 'status-overdue'
        };
        return map[status] || '';
    }

    getInitials(name: string): string {
        if (!name) return '?';
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    }

    getDeadlineClass(deadlineStr: string): string {
        if (!deadlineStr) return '';
        const deadline = new Date(deadlineStr);
        const now = new Date();

        // Reset time for accurate comparison
        now.setHours(0, 0, 0, 0);
        deadline.setHours(0, 0, 0, 0);

        if (deadline < now) {
            return 'deadline-overdue';
        }

        // Check if deadline is within next 3 days
        const threeDaysFromNow = new Date(now);
        threeDaysFromNow.setDate(now.getDate() + 3);

        if (deadline <= threeDaysFromNow) {
            return 'deadline-soon';
        }

        return '';
    }

    getResponsibleDisplay(task: ProjectTask): string {
        // Если есть ResponsibleUserId, значит это новая задача с именем пользователя
        if (task.responsibleUserId && this.currentUser) {
            // Находим пользователя по ID
            const user = [
                { id: 1, name: 'Иван Петров', role: 'МП' },
                { id: 2, name: 'Мария Сидорова', role: 'МРиЗ' },
                { id: 3, name: 'Алексей Смирнов', role: 'БА' }
            ].find(u => u.id === task.responsibleUserId);

            if (user) {
                const lastName = user.name.split(' ')[1] || user.name; // Берем фамилию
                return `${lastName} (${user.role})`;
            }
        }

        // Если это старая задача с ролью
        if (task.responsible === 'МП' || task.responsible === 'МРиЗ' || task.responsible === 'БА') {
            const roleToUser: { [key: string]: string } = {
                'МП': 'Петров (МП)',
                'МРиЗ': 'Сидорова (МРиЗ)',
                'БА': 'Смирнов (БА)'
            };
            return roleToUser[task.responsible] || task.responsible;
        }

        // Если это новая задача с полным именем
        if (task.responsible.includes(' ')) {
            const parts = task.responsible.split(' ');
            const lastName = parts[1] || parts[0];
            // Определяем роль по имени
            const nameToRole: { [key: string]: string } = {
                'Иван Петров': 'МП',
                'Мария Сидорова': 'МРиЗ',
                'Алексей Смирнов': 'БА'
            };
            const role = nameToRole[task.responsible];
            return role ? `${lastName} (${role})` : task.responsible;
        }

        return task.responsible;
    }

    // Navigate to project page with task editing
    openEditModal(task: ProjectTask) {
        // Navigate to project details page with task ID as query parameter
        this.router.navigate(['/projects', task.projectId], {
            queryParams: { editTask: task.id }
        });
    }
}
