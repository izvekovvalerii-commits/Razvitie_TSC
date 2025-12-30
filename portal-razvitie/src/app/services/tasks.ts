import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { ProjectTask, TASK_ROLE_MAP } from '../models/task.model';
import { MOCK_USERS, UserRole } from '../models/user.model';
import { NotificationService } from './notification.service';

@Injectable({
    providedIn: 'root'
})
export class TasksService {
    private apiUrl = 'http://localhost:5000/api/tasks';

    constructor(
        private http: HttpClient,
        private notificationService: NotificationService
    ) { }

    getAllTasks(): Observable<ProjectTask[]> {
        return this.http.get<ProjectTask[]>(this.apiUrl).pipe(
            map(tasks => tasks.map(task => {
                task.taskType = task.name;
                return task;
            }))
        );
    }

    getProjectTasks(projectId: number): Observable<ProjectTask[]> {
        return this.http.get<ProjectTask[]>(`${this.apiUrl}/project/${projectId}`).pipe(
            map(tasks => tasks.map(task => {
                task.taskType = task.name;
                return task;
            }))
        );
    }

    /**
     * Автоматически назначает ответственного по роли для типа задачи
     */
    private autoAssignResponsible(task: ProjectTask): ProjectTask {
        console.log('[autoAssignResponsible] Task type:', task.taskType);

        // 1. Сначала пробуем получить роль из самой задачи (из BPMN)
        let requiredRole = '';
        if (task.responsible && (task.responsible === 'МП' || task.responsible === 'МРиЗ' || task.responsible === 'БА')) {
            requiredRole = task.responsible;
        }
        // 2. Иначе пробуем по старой схеме через маппинг
        else {
            requiredRole = TASK_ROLE_MAP[task.taskType];
        }

        console.log('[autoAssignResponsible] Required role:', requiredRole);

        if (requiredRole) {
            // Находим пользователя с нужной ролью
            const user = MOCK_USERS.find(u => u.role === requiredRole);
            console.log('[autoAssignResponsible] Found user:', user);

            if (user) {
                task.responsible = user.name;
                task.responsibleUserId = user.id;
                console.log('[autoAssignResponsible] Assigned:', {
                    responsible: task.responsible,
                    responsibleUserId: task.responsibleUserId
                });
            }
        }
        return task;
    }

    createTask(task: ProjectTask, projectName?: string): Observable<ProjectTask> {
        // Автоназначение ответственного
        const assignedTask = this.autoAssignResponsible(task);

        return this.http.post<ProjectTask>(this.apiUrl, assignedTask).pipe(
            tap(createdTask => {
                // Отправляем уведомление ответственному
                if (createdTask.responsibleUserId && createdTask.id) {
                    this.notificationService.createNotification(
                        createdTask.responsibleUserId,
                        `Вам назначена новая задача "${createdTask.name}" в проекте "${projectName || `#${createdTask.projectId}`}"`,
                        createdTask.id,
                        createdTask.projectId
                    );
                }
            })
        );
    }

    /**
     * Создает задачи для нового проекта с автоназначением
     */
    createProjectTasks(projectId: number, projectName: string, taskTypes: string[]): Observable<ProjectTask[]> {
        console.log('[createProjectTasks] Starting task creation for project:', projectId);
        console.log('[createProjectTasks] Task types:', taskTypes);

        const tasks = taskTypes.map(taskType => {
            const task: ProjectTask = {
                projectId,
                name: taskType,
                taskType,
                responsible: '',
                status: 'Назначена',
                normativeDeadline: this.calculateDeadline(taskType)
            };
            const assignedTask = this.autoAssignResponsible(task);
            console.log('[createProjectTasks] Task created:', {
                name: assignedTask.name,
                responsible: assignedTask.responsible,
                responsibleUserId: assignedTask.responsibleUserId
            });
            return assignedTask;
        });

        // Создаем все задачи и отправляем уведомления
        return new Observable(observer => {
            const requests = tasks.map(task =>
                this.http.post<ProjectTask>(this.apiUrl, task).pipe(
                    tap(createdTask => {
                        console.log('[createProjectTasks] Task saved to DB:', createdTask);
                        if (createdTask.responsibleUserId && createdTask.id) {
                            console.log('[createProjectTasks] Sending notification to user:', createdTask.responsibleUserId);
                            this.notificationService.createNotification(
                                createdTask.responsibleUserId,
                                `Вам назначена новая задача "${createdTask.name}" в проекте "${projectName}"`,
                                createdTask.id,
                                projectId
                            );
                        }
                    })
                ).toPromise()
            );

            Promise.all(requests).then(results => {
                console.log('[createProjectTasks] All tasks created successfully:', results);
                observer.next(results as ProjectTask[]);
                observer.complete();
            }).catch(error => {
                console.error('[createProjectTasks] Error creating tasks:', error);
                observer.error(error);
            });
        });
    }

    private calculateDeadline(taskType: string): string {
        const today = new Date();
        const days = { 'Планирование аудита': 7, 'Согласование контура': 14, 'Расчет бюджета': 21 }[taskType] || 7;
        today.setDate(today.getDate() + days);
        return today.toISOString(); // Возвращаем полный ISO формат
    }

    updateTask(id: number, task: ProjectTask): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, task);
    }

    updateTaskStatus(id: number, status: string): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/status`, JSON.stringify(status), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
