import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectsService } from '../../services/projects';
import { TasksService } from '../../services/tasks';
import { DocumentsService } from '../../services/documents';
import { WorkflowService } from '../../services/workflow.service';
import { UserActivityService } from '../../services/user-activity.service'; // Added
import { Project, PROJECT_STATUSES } from '../../models/project.model';
import { ProjectTask, TASK_TYPES, TASK_STATUSES, TASK_RESPONSIBLE_MAP, TASK_DEADLINE_DAYS } from '../../models/task.model';
import { ProjectDocument, DOCUMENT_TYPES } from '../../models/document.model';
import { STORE_OPENING_TASKS } from '../../config/store-opening-process.config';

interface TeamMember {
    name: string;
    role: string;
    phone: string;
    initials: string;
    color: string;
}

@Component({
    selector: 'app-project-details',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './project-details.html',
    styleUrls: ['./project-details.css']
})
export class ProjectDetailsComponent implements OnInit {
    project: Project | null = null;
    loading = true;
    projectStatuses = PROJECT_STATUSES;

    // Tasks
    projectTasks: ProjectTask[] = [];
    projectTeam: TeamMember[] = [];
    ganttTasks: ProjectTask[] = [];
    newTask: Partial<ProjectTask> = {
        taskType: '',
        status: 'Назначена'
    };
    taskTypes = TASK_TYPES;
    taskStatuses = TASK_STATUSES;

    showCreateTaskModal = false;

    // Edit Task
    showEditTaskModal = false;
    selectedTask: ProjectTask | null = null;
    prevTaskNames: string = '';
    nextTaskNames: string = '';

    // Documents
    documents: ProjectDocument[] = [];
    docTypes = DOCUMENT_TYPES;
    isUploading = false;
    selectedFile: File | null = null;
    selectedDocType = DOCUMENT_TYPES[0];

    // Gantt Data
    ganttDates: Date[] = [];
    isGanttExpanded = true;
    ganttViewMode: 'day' | 'week' | 'month' | 'quarter' = 'day';

    // Helper to calculate precise positions
    ganttTimelineStart: Date | null = null;
    ganttTimelineEnd: Date | null = null;

    // Status Dropdown
    statusDropdownOpen = false;

    // Gantt Task Info Modal
    showGanttTaskInfoModal = false;
    ganttSelectedTask: ProjectTask | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private projectsService: ProjectsService,
        private tasksService: TasksService,
        private docsService: DocumentsService,
        private workflowService: WorkflowService,
        private activityService: UserActivityService, // Added
        private cdr: ChangeDetectorRef
    ) { }

    toggleGantt() {
        this.isGanttExpanded = !this.isGanttExpanded;
    }

    ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            const id = +idParam;
            this.loadProject(id);

            // Check if we need to open edit task modal
            const editTaskId = this.route.snapshot.queryParamMap.get('editTask');
            if (editTaskId) {
                this.pendingEditTaskId = +editTaskId;
            }
        } else {
            this.router.navigate(['/projects']);
        }
    }

    private pendingEditTaskId: number | null = null;

    loadProject(id: number) {
        this.projectsService.getProject(id).subscribe({
            next: (data) => {
                this.project = data;
                this.loading = false;
                this.loadProjectTasks();
                this.loadDocuments();
            },
            error: (err) => {
                console.error('Error loading project', err);
                this.loading = false;
            }
        });
    }

    loadProjectTasks() {
        if (!this.project?.id) return;
        this.tasksService.getProjectTasks(this.project.id).subscribe({
            next: (tasks) => {
                this.projectTasks = tasks;
                this.calculateProjectTeam();
                this.calculateGanttTimeline();

                // If we have a pending task to edit, open the modal
                if (this.pendingEditTaskId) {
                    const taskToEdit = tasks.find(t => t.id === this.pendingEditTaskId);
                    if (taskToEdit) {
                        this.openEditTaskModal(taskToEdit);
                    }
                    this.pendingEditTaskId = null;
                    // Clear query params
                    this.router.navigate([], {
                        queryParams: {},
                        replaceUrl: true
                    });
                }

                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error loading tasks', err)
        });
    }

    loadDocuments() {
        if (!this.project?.id) return;
        this.docsService.getByProject(this.project.id).subscribe({
            next: (docs) => {
                this.documents = docs;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error loading docs', err)
        });
    }

    goBack() {
        this.router.navigate(['/projects']);
    }

    updateStatus(newStatus: string) {
        if (this.project?.id) {
            this.project.status = newStatus; // Optimistic update
            this.projectsService.updateStatus(this.project.id, newStatus).subscribe({
                error: (err) => console.error('Error updating status', err)
            });
        }
    }

    getTaskStatusClass(status: string): string {
        const map: { [key: string]: string } = {
            'Назначена': 'task-assigned',
            'В работе': 'task-in-progress',
            'Завершена': 'task-completed',
            'Срыв сроков': 'task-overdue',
            'Запланирована': 'task-planned'
        };
        return map[status] || 'task-planned';
    }

    getStatusColor(status: string): string {
        const colors: { [key: string]: string } = {
            'Создан': 'linear-gradient(135deg, #64B5F6 0%, #42A5F5 100%)',
            'Аудит': '#FFB700',
            'Бюджет сформирован': 'linear-gradient(135deg, #81C784 0%, #66BB6A 100%)',
            'Утвержден ИК': 'linear-gradient(135deg, #9575CD 0%, #7E57C2 100%)',
            'Подписан договор': 'linear-gradient(135deg, #4DB6AC 0%, #26A69A 100%)',
            'РСР': 'linear-gradient(135deg, #FFB74D 0%, #FFA726 100%)',
            'Открыт': 'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)',
            'Слетел': 'linear-gradient(135deg, #E57373 0%, #EF5350 100%)'
        };
        return colors[status] || 'linear-gradient(135deg, #64B5F6 0%, #42A5F5 100%)';
    }

    toggleStatusDropdown() {
        this.statusDropdownOpen = !this.statusDropdownOpen;
    }

    selectStatus(status: string) {
        if (this.project) {
            this.project.status = status;
            this.updateStatus(status);
            this.statusDropdownOpen = false;
        }
    }

    // --- Task Creation Logic ---
    openCreateTaskModal() {
        this.showCreateTaskModal = true;
        this.resetTaskForm();
    }

    closeCreateTaskModal() {
        this.showCreateTaskModal = false;
        this.resetTaskForm();
    }

    resetTaskForm() {
        this.newTask = { taskType: '', status: 'Назначена' };
    }

    onTaskTypeChange() {
        if (!this.newTask.taskType || !this.project) return;
        this.newTask.responsible = TASK_RESPONSIBLE_MAP[this.newTask.taskType] || '';
        this.newTask.name = `${this.newTask.taskType} - ${this.project.store?.name || 'Проект'}`;
        const days = TASK_DEADLINE_DAYS[this.newTask.taskType] || 14;
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + days);
        this.newTask.normativeDeadline = deadline.toISOString().split('T')[0];
    }

    createTask() {
        if (!this.project?.id) return;
        if (!this.newTask.taskType || !this.newTask.name || !this.newTask.responsible || !this.newTask.normativeDeadline) {
            alert('Заполните обязательные поля');
            return;
        }

        const task: ProjectTask = {
            projectId: this.project.id,
            name: this.newTask.name,
            taskType: this.newTask.taskType,
            responsible: this.newTask.responsible,
            normativeDeadline: new Date(this.newTask.normativeDeadline).toISOString(),
            status: this.newTask.status || 'Назначена'
        };

        this.tasksService.createTask(task).subscribe({
            next: () => {
                this.loadProjectTasks();
                this.closeCreateTaskModal();
            },
            error: (err) => alert('Error creating task: ' + err.message)
        });
    }

    // --- Task Start Logic ---
    startTask(task: ProjectTask) {
        if (!task.id || !this.project?.id) return;
        if (task.status === 'В работе' || task.status === 'Завершена') return;

        task.status = 'В работе';
        task.startedAt = new Date().toISOString();

        this.tasksService.updateTask(task.id, task).subscribe({
            next: () => {
                this.activityService.addActivity({
                    id: Date.now(),
                    userId: task.responsibleUserId || 0,
                    userName: task.responsible,
                    userRole: this.getRoleByName(task.responsible),
                    action: 'взял в работу',
                    taskId: task.id!,
                    taskName: task.name,
                    projectId: this.project?.id || 0,
                    timestamp: new Date().toISOString(),
                    details: 'Статус изменен: Назначена → В работе'
                });
                this.loadProjectTasks();
            },
            error: (err) => console.error('Error starting task', err)
        });
    }

    // --- Task Creation Logic --- (helper for reference, not changing)

    private validateTaskCompletion(task: ProjectTask): boolean {
        if (task.name === 'Подготовка к аудиту') {
            if (!task.plannedAuditDate) {
                alert('Поле "Плановая дата аудита" обязательно для заполнения!');
                return false;
            }
            if (!task.projectFolderLink) {
                alert('Поле "Ссылка на папку проекта" обязательно для заполнения!');
                return false;
            }
            // Check for mandatory document "Технический план"
            const hasTechPlan = this.taskDocuments.some(d => d.type === 'Технический план');
            if (!hasTechPlan) {
                const currentTypes = this.taskDocuments.map(d => d.type).join(', ');
                alert(`Необходимо загрузить файл "Технический план"! Текущие вложения: ${currentTypes || 'нет'}`);
                return false;
            }
        }
        if (task.name === 'Аудит объекта') {
            if (!task.actualAuditDate) {
                alert('Поле "Фактическая дата аудита" обязательно для заполнения!');
                return false;
            }
        }
        if (task.name === 'Площадка ТБО') {
            if (!task.tboDocsLink) {
                alert('Поле "Ссылка на документы для площадки ТБО" обязательно для заполнения!');
                return false;
            }
            if (!task.tboAgreementDate) {
                alert('Поле "Дата согласования" обязательно для заполнения!');
                return false;
            }
            if (!task.tboRegistryDate) {
                alert('Поле "Дата внесения в Реестр ТБО" обязательно для заполнения!');
                return false;
            }
        }
        if (task.name === 'Контур планировки') {
            if (!task.planningContourAgreementDate) {
                alert('Поле "Дата согласования контура планировки" обязательно для заполнения!');
                return false;
            }
            if (!this.hasDocType('Фотографии объекта')) {
                alert('Необходимо загрузить "Фотографии объекта"!');
                return false;
            }
            if (!this.hasDocType('Обмерный план')) {
                alert('Необходимо загрузить "Обмерный план"!');
                return false;
            }
            if (!this.hasDocType('Предварительный контур')) {
                alert('Необходимо загрузить "Предварительный контур планировки"!');
                return false;
            }
        }
        if (task.name === 'Визуализация') {
            if (!task.visualizationAgreementDate) {
                alert('Поле "Дата согласования визуализации" обязательно для заполнения!');
                return false;
            }
            if (!this.hasDocType('Концепт визуализации')) {
                alert('Необходимо загрузить "Концепт визуализации"!');
                return false;
            }
            if (!this.hasDocType('Выписка ЕГРН')) {
                alert('Необходимо загрузить "Выписка ЕГРН"!');
                return false;
            }
            if (!this.hasDocType('Визуализация внешнего вида магазина')) {
                alert('Необходимо загрузить "Визуализация внешнего вида магазина"!');
                return false;
            }
        }
        if (task.name === 'Оценка логистики') {
            if (task.logisticsNbkpEligibility === undefined) {
                alert('Поле "Возможность НБКП" обязательно для заполнения!');
                return false;
            }
            if (!this.hasDocType('Схема подъездных путей')) {
                alert('Необходимо загрузить "Схема подъездных путей"!');
                return false;
            }
            if (!this.hasDocType('Оценка логистики и подъездных путей')) {
                alert('Необходимо загрузить "Оценка логистики и подъездных путей"!');
                return false;
            }
            if (!this.hasDocType('Оценка возможности НБКП')) {
                alert('Необходимо загрузить "Оценка возможности НБКП"!');
                return false;
            }
        }
        if (task.name === 'Планировка с расстановкой') {
            if (!task.layoutAgreementDate) {
                alert('Поле "Дата согласования планировки" обязательно для заполнения!');
                return false;
            }
            if (!this.hasDocType('Технологическая планировка (DWG)')) {
                alert('Необходимо загрузить "Технологическая планировка (DWG)"!');
                return false;
            }
            if (!this.hasDocType('Технологическая планировка (PDF)')) {
                alert('Необходимо загрузить "Технологическая планировка (PDF)"!');
                return false;
            }
        }
        if (task.name === 'Расчет бюджета оборудования') {
            if (!task.equipmentCostNoVat) {
                alert('Поле "Сумма затрат на оборудование" обязательно для заполнения!');
                return false;
            }
            if (!this.hasDocType('Расчет затрат на оборудование')) {
                alert('Необходимо загрузить "Расчет затрат на оборудование (XLS)"!');
                return false;
            }
        }
        if (task.name === 'Расчет бюджета СБ') {
            if (!task.securityBudgetNoVat) {
                alert('Поле "Сумма бюджета СБ" обязательно для заполнения!');
                return false;
            }
            if (!this.hasDocType('Анкета СБ')) {
                alert('Необходимо загрузить "Анкета СБ"!');
                return false;
            }
            if (!this.hasDocType('Расчет затрат на оборудование СБ')) {
                alert('Необходимо загрузить "Расчет затрат на оборудование СБ (XLS)"!');
                return false;
            }
        }
        if (task.name === 'ТЗ и расчет бюджета РСР') {
            if (!task.rsrBudgetNoVat) {
                alert('Поле "Сумма бюджета РСР" обязательно для заполнения!');
                return false;
            }
            if (!this.hasDocType('Распределительная ведомость')) {
                alert('Необходимо загрузить "Распределительная ведомость"!');
                return false;
            }
            if (!this.hasDocType('Расчет бюджета РСР')) {
                alert('Необходимо загрузить "Расчет бюджета РСР (XLS)"!');
                return false;
            }
        }
        if (task.name === 'Расчет бюджета ПиС') {
            if (!task.pisBudgetNoVat) {
                alert('Поле "Сумма бюджета ПИС" обязательно для заполнения!');
                return false;
            }
        }
        if (task.name === 'Общий бюджет проекта') {
            if (!task.totalBudgetNoVat) {
                alert('Поле "Сумма общего бюджета" обязательно для заполнения!');
                return false;
            }
        }
        return true;
    }

    private prepareTaskDates(task: ProjectTask) {
        const ensureIso = (dateStr?: string) => {
            if (!dateStr) return undefined;
            // If it's already a full ISO string (has T and usually Z or offset), leave it.
            // But input[type=date] gives 'YYYY-MM-DD'.
            if (dateStr.length === 10 && dateStr.includes('-')) {
                return new Date(dateStr).toISOString();
            }
            return dateStr;
        };

        if (task.plannedAuditDate) task.plannedAuditDate = ensureIso(task.plannedAuditDate);
        if (task.actualAuditDate) task.actualAuditDate = ensureIso(task.actualAuditDate);
        if (task.tboAgreementDate) task.tboAgreementDate = ensureIso(task.tboAgreementDate);
        if (task.tboRegistryDate) task.tboRegistryDate = ensureIso(task.tboRegistryDate);
        if (task.planningContourAgreementDate) task.planningContourAgreementDate = ensureIso(task.planningContourAgreementDate);
        if (task.visualizationAgreementDate) task.visualizationAgreementDate = ensureIso(task.visualizationAgreementDate);
        if (task.layoutAgreementDate) task.layoutAgreementDate = ensureIso(task.layoutAgreementDate);
    }

    // --- Task Completion Logic ---
    completeTask(task: ProjectTask) {
        if (!task.id || !this.project?.id) return;
        if (task.status === 'Завершена') return;

        // Validate mandatory fields
        if (!this.validateTaskCompletion(task)) return;

        const taskToSend = { ...task };
        this.prepareTaskDates(taskToSend);

        taskToSend.status = 'Завершена';
        taskToSend.completedAt = new Date().toISOString();
        taskToSend.actualDate = new Date().toISOString();

        this.tasksService.updateTask(taskToSend.id!, taskToSend).subscribe({
            next: () => {
                this.closeEditTaskModal();
                this.activityService.addActivity({
                    id: Date.now(),
                    userId: task.responsibleUserId || 0,
                    userName: task.responsible,
                    userRole: this.getRoleByName(task.responsible),
                    action: 'завершил задачу',
                    taskId: task.id!,
                    taskName: task.name,
                    projectId: this.project?.id || 0,
                    timestamp: new Date().toISOString(),
                    details: 'Задача выполнена'
                });

                const updatedList = this.projectTasks.map(t => t.id === task.id ? { ...t, status: 'Завершена', completedAt: task.completedAt, actualDate: task.actualDate } : t);
                const newTasks = this.workflowService.determineNextTasks(this.project!.id!, updatedList);

                if (newTasks.length > 0) {
                    let count = 0;
                    newTasks.forEach(nt => {
                        this.tasksService.createTask(nt).subscribe(() => {
                            count++;
                            if (count === newTasks.length) this.loadProjectTasks();
                        });
                    });
                } else {
                    this.loadProjectTasks();
                }
            },
            error: (err) => {
                console.error('Error completing task', err);
                alert('Ошибка при сохранении задачи: ' + (err.message || JSON.stringify(err)));
            }
        });
    }

    // Task Documents
    taskDocuments: ProjectDocument[] = [];
    isTaskUploading = false;

    // --- Edit Task Logic ---
    openEditTaskModal(task: ProjectTask) {
        this.selectedTask = { ...task };
        this.showEditTaskModal = true;
        this.taskDocuments = [];
        if (task.id) {
            this.loadTaskDocuments(task.id);
        }

        if (task.code) {
            const def = STORE_OPENING_TASKS.find(t => t.code === task.code);
            if (def) {
                const prevDefs = STORE_OPENING_TASKS.filter(t => def.dependsOn.includes(t.code));
                this.prevTaskNames = prevDefs.map(t => t.name).join(', ') || 'Нет (Стартовая задача)';
                const nextDefs = STORE_OPENING_TASKS.filter(t => t.dependsOn.includes(def.code));
                this.nextTaskNames = nextDefs.map(t => t.name).join(', ') || 'Нет (Конечная задача)';
            } else {
                this.prevTaskNames = 'Не найдено в BPMN';
                this.nextTaskNames = 'Не найдено в BPMN';
            }
        } else {
            this.prevTaskNames = 'Ручная задача';
            this.nextTaskNames = '-';
        }
    }

    loadTaskDocuments(taskId: number) {
        this.docsService.getByTask(taskId).subscribe({
            next: (docs) => {
                this.taskDocuments = docs;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error loading task docs', err)
        });
    }

    onTaskFileSelected(event: any, docType: string = 'Вложение к задаче') {
        const file = event.target.files ? event.target.files[0] : null;
        if (file && this.selectedTask?.id && this.project?.id) {
            // DWG Validation for specific types
            if (docType === 'Обмерный план' || docType === 'Предварительный контур' || docType === 'Технологическая планировка (DWG)') {
                if (!file.name.toLowerCase().endsWith('.dwg')) {
                    alert('Для этого поля разрешен только формат .dwg');
                    event.target.value = ''; // Reset input
                    return;
                }
            }

            // PDF Validation
            if (docType === 'Оценка логистики и подъездных путей' || docType === 'Оценка возможности НБКП' || docType === 'Технологическая планировка (PDF)') {
                if (!file.name.toLowerCase().endsWith('.pdf')) {
                    alert('Для этого поля разрешен только формат .pdf');
                    event.target.value = ''; // Reset input
                    return;
                }
            }

            // XLS Validation
            if (docType === 'Расчет затрат на оборудование' || docType === 'Расчет затрат на оборудование СБ' || docType === 'Расчет бюджета РСР' || docType === 'Расчет бюджета ПИС') {
                const lower = file.name.toLowerCase();
                if (!lower.endsWith('.xls') && !lower.endsWith('.xlsx')) {
                    alert('Для этого поля разрешен только формат .xls или .xlsx');
                    event.target.value = ''; // Reset input
                    return;
                }
            }

            this.isTaskUploading = true;
            this.docsService.upload(this.project.id, file, docType, this.selectedTask.id).subscribe({
                next: (doc) => {
                    this.taskDocuments.unshift(doc);
                    this.isTaskUploading = false;
                    this.documents.unshift(doc);
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error(err);
                    alert('Ошибка при загрузке файла: ' + (err.message || 'Неизвестная ошибка'));
                    this.isTaskUploading = false;
                }
            });
        }
    }

    // --- Document Helpers for UI ---
    getDocsByType(type: string): ProjectDocument[] {
        return this.taskDocuments.filter(d => d.type === type);
    }

    getDocsExcludeType(type: string): ProjectDocument[] {
        return this.taskDocuments.filter(d => d.type !== type);
    }

    hasDocType(type: string): boolean {
        return this.taskDocuments.some(d => d.type === type);
    }

    saveTaskChanges() {
        if (!this.selectedTask || !this.selectedTask.id) return;

        const taskToSend = { ...this.selectedTask };
        this.prepareTaskDates(taskToSend);

        // Validate mandatory fields if completing
        if (taskToSend.status === 'Завершена') {
            if (!this.validateTaskCompletion(taskToSend)) return;
        }

        // Ensure normativeDeadline is in ISO format
        if (taskToSend.normativeDeadline) {
            const dateVal = new Date(taskToSend.normativeDeadline);
            if (!isNaN(dateVal.getTime())) {
                taskToSend.normativeDeadline = dateVal.toISOString();
            }
        }

        // Logic for activity tracking (based on status change)
        const originalTask = this.projectTasks.find(t => t.id === taskToSend.id);
        let activityAction = '';
        let activityDetails = '';

        if (originalTask && originalTask.status !== taskToSend.status) {
            const now = new Date().toISOString();
            if (taskToSend.status === 'В работе') {
                if (!taskToSend.startedAt) taskToSend.startedAt = now;
                activityAction = 'взял в работу';
                activityDetails = 'Статус изменен: Назначена → В работе';
            }
            if (taskToSend.status === 'Завершена') {
                if (!taskToSend.completedAt) taskToSend.completedAt = now;
                if (!taskToSend.actualDate) taskToSend.actualDate = now;
                activityAction = 'завершил задачу';
                activityDetails = 'Задача выполнена';
            }
        }

        this.tasksService.updateTask(taskToSend.id!, taskToSend).subscribe({
            next: () => {
                // Log activity
                if (activityAction) {
                    this.activityService.addActivity({
                        id: Date.now(),
                        userId: taskToSend.responsibleUserId || 0,
                        userName: taskToSend.responsible,
                        userRole: this.getRoleByName(taskToSend.responsible),
                        action: activityAction,
                        taskId: taskToSend.id!,
                        taskName: taskToSend.name,
                        projectId: this.project?.id || 0,
                        timestamp: new Date().toISOString(),
                        details: activityDetails
                    });
                }

                alert('Изменения сохранены');
                this.loadProjectTasks();
                this.closeEditTaskModal();
            },
            error: (err) => {
                console.error('Error saving task', err);
                alert('Ошибка при сохранении: ' + (err.message || JSON.stringify(err)));
            }
        });
    }

    private getRoleByName(name: string): string {
        if (name.includes('Петров')) return 'МП';
        if (name.includes('Сидорова')) return 'МРиЗ';
        if (name.includes('Смирнов')) return 'БА';
        return 'Сотрудник';
    }

    deleteProject() {
        if (!this.project || !this.project.id) return;
        if (confirm('Вы действительно хотите удалить этот проект? Это действие нельзя отменить.')) {
            this.projectsService.deleteProject(this.project.id).subscribe({
                next: () => {
                    this.router.navigate(['/']); // Navigate to home/dashboard
                },
                error: (err) => console.error('Failed to delete project', err)
            });
        }
    }

    showAllTasks = true;

    get displayedTasks(): ProjectTask[] {
        if (this.showAllTasks) {
            return this.ganttTasks;
        }
        return this.ganttTasks.filter(t => t.isActive);
    }

    toggleTasksView() {
        this.showAllTasks = !this.showAllTasks;
    }

    closeEditTaskModal() {
        this.showEditTaskModal = false;
        this.selectedTask = null;
        this.taskDocuments = [];
    }

    // --- Documents Logic ---
    onFileSelected(event: any) {
        this.selectedFile = event.target.files[0];
    }

    uploadDocument() {
        if (!this.selectedFile || !this.project?.id) return;
        this.isUploading = true;
        this.docsService.upload(this.project.id, this.selectedFile, this.selectedDocType).subscribe({
            next: (doc) => {
                this.documents.unshift(doc);
                this.isUploading = false;
                this.selectedFile = null;
            },
            error: (err) => {
                console.error(err);
                this.isUploading = false;
            }
        });
    }

    downloadDoc(doc: ProjectDocument) {
        this.docsService.download(doc.id).subscribe(blob => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = doc.name;
            link.click();
        });
    }

    deleteDoc(doc: ProjectDocument) {
        if (!confirm('Удалить?')) return;
        this.docsService.delete(doc.id).subscribe(() => {
            this.documents = this.documents.filter(d => d.id !== doc.id);
        });
    }

    getFriendlyFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // --- Gantt Logic ---
    calculateGanttTimeline() {
        const combinedTasks: ProjectTask[] = [];
        const taskMap = new Map<string, ProjectTask>();
        this.projectTasks.forEach(t => { if (t.code) taskMap.set(t.code, t); });

        let projectStartDate = this.project?.createdAt ? new Date(this.project.createdAt) : new Date();

        STORE_OPENING_TASKS.forEach(def => {
            let task = taskMap.get(def.code);
            if (!task) {
                task = {
                    projectId: this.project?.id || 0,
                    name: def.name,
                    code: def.code,
                    taskType: def.type,
                    responsible: def.role,
                    status: 'Запланирована',
                    isActive: false,
                    normativeDeadline: new Date().toISOString()
                };
            }
            combinedTasks.push(task);
        });

        combinedTasks.forEach(task => {
            if (!task.createdAt || (task.status === 'Запланирована' && !taskMap.has(task.code!))) {
                const def = STORE_OPENING_TASKS.find(d => d.code === task.code);
                let startDate = projectStartDate;
                if (def && def.dependsOn.length > 0) {
                    let maxDepEnd = 0;
                    def.dependsOn.forEach(depCode => {
                        const depTask = combinedTasks.find(t => t.code === depCode);
                        if (depTask) {
                            const dEnd = depTask.normativeDeadline ? new Date(depTask.normativeDeadline).getTime() : 0;
                            if (dEnd > maxDepEnd) maxDepEnd = dEnd;
                        }
                    });
                    if (maxDepEnd > 0) {
                        startDate = new Date(maxDepEnd);
                        startDate.setDate(startDate.getDate() + 1);
                    }
                }
                task.createdAt = startDate.toISOString();
                const duration = def?.duration || 3;
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + duration);
                task.normativeDeadline = endDate.toISOString();
            }
        });

        // Collect all relevant dates from ALL tasks (not just filtered ones)
        // This ensures the timeline covers the entire project period
        const dates: Date[] = [];
        combinedTasks.forEach(t => {
            if (t.createdAt) dates.push(new Date(t.createdAt));
            if (t.normativeDeadline) dates.push(new Date(t.normativeDeadline));
            if (t.actualDate) dates.push(new Date(t.actualDate));
            if (t.startedAt) dates.push(new Date(t.startedAt));
        });

        if (dates.length === 0) {
            this.ganttDates = [];
            this.totalGanttDays = 0;
            this.ganttStartDate = null;
            // Still set filtered tasks
            if (this.activeFilter !== 'Все') {
                this.ganttTasks = combinedTasks.filter(t => t.status === this.activeFilter);
            } else {
                this.ganttTasks = combinedTasks;
            }
            return;
        }

        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

        this.ganttDates = [];
        let start = new Date(minDate);
        let end = new Date(maxDate);

        if (this.ganttViewMode === 'day') {
            start.setDate(start.getDate() - 3);
            end.setDate(end.getDate() + 5);

            const curr = new Date(start);
            while (curr <= end) {
                this.ganttDates.push(new Date(curr));
                curr.setDate(curr.getDate() + 1);
            }
        } else if (this.ganttViewMode === 'week') {
            const day = start.getDay();
            const diff = start.getDate() - day + (day == 0 ? -6 : 1);
            start = new Date(start.setDate(diff - 7));

            const endDay = end.getDay();
            const endDiff = end.getDate() - endDay + (endDay == 0 ? -6 : 1);
            end = new Date(end.setDate(endDiff + 14));

            const curr = new Date(start);
            while (curr <= end) {
                this.ganttDates.push(new Date(curr));
                curr.setDate(curr.getDate() + 7);
            }
        } else if (this.ganttViewMode === 'month') {
            start.setDate(1);
            start.setMonth(start.getMonth() - 1);

            end.setDate(1);
            end.setMonth(end.getMonth() + 2);

            const curr = new Date(start);
            while (curr <= end) {
                this.ganttDates.push(new Date(curr));
                curr.setMonth(curr.getMonth() + 1);
            }
        } else if (this.ganttViewMode === 'quarter') {
            start.setDate(1);
            const q = Math.floor(start.getMonth() / 3);
            start.setMonth(q * 3 - 3);

            end.setDate(1);
            const qEnd = Math.floor(end.getMonth() / 3);
            end.setMonth(qEnd * 3 + 6);

            const curr = new Date(start);
            while (curr <= end) {
                this.ganttDates.push(new Date(curr));
                curr.setMonth(curr.getMonth() + 3);
            }
        }

        if (this.ganttDates.length > 0) {
            this.ganttTimelineStart = new Date(this.ganttDates[0]);
            this.ganttTimelineEnd = new Date(this.ganttDates[this.ganttDates.length - 1]);

            // Adjust end date to cover the full last unit
            if (this.ganttViewMode === 'day') this.ganttTimelineEnd.setDate(this.ganttTimelineEnd.getDate() + 1);
            if (this.ganttViewMode === 'week') this.ganttTimelineEnd.setDate(this.ganttTimelineEnd.getDate() + 7);
            if (this.ganttViewMode === 'month') this.ganttTimelineEnd.setMonth(this.ganttTimelineEnd.getMonth() + 1);
            if (this.ganttViewMode === 'quarter') this.ganttTimelineEnd.setMonth(this.ganttTimelineEnd.getMonth() + 3);
        }

        this.totalGanttDays = this.ganttDates.length;
        this.ganttStartDate = this.ganttDates.length > 0 ? this.ganttDates[0] : null;

        // Apply filter
        if (this.activeFilter !== 'Все') {
            this.ganttTasks = combinedTasks.filter(t => t.status === this.activeFilter);
        } else {
            this.ganttTasks = combinedTasks;
        }
    }

    setGanttViewMode(mode: 'day' | 'week' | 'month' | 'quarter') {
        this.ganttViewMode = mode;
        this.calculateGanttTimeline();
    }

    calculateTaskDeviation(task: ProjectTask): { days: number, type: 'early' | 'late' } | undefined {
        if (!task.actualDate || !task.normativeDeadline || !this.ganttStartDate || this.totalGanttDays === 0) {
            return undefined;
        }

        const actualDate = new Date(task.actualDate);
        actualDate.setHours(0, 0, 0, 0);
        const planDate = new Date(task.normativeDeadline);
        planDate.setHours(0, 0, 0, 0);

        const actual = actualDate.getTime();
        const plan = planDate.getTime();

        if (actual === plan) return undefined;

        const dayMs = 1000 * 60 * 60 * 24;
        const diffDays = Math.round((actual - plan) / dayMs);

        if (diffDays === 0) return undefined;

        return {
            days: Math.abs(diffDays),
            type: diffDays > 0 ? 'late' : 'early'
        };
    }

    getDeviationLabelLeft(task: ProjectTask): number {
        if (!task.actualDate || !task.normativeDeadline || !this.ganttStartDate || this.totalGanttDays === 0) return 0;

        const actual = new Date(task.actualDate).getTime();
        const plan = new Date(task.normativeDeadline).getTime();
        const maxEnd = Math.max(actual, plan);

        const startGantt = this.ganttStartDate.getTime();
        const dayMs = 1000 * 60 * 60 * 24;
        const totalMs = this.totalGanttDays * dayMs;

        // Position at the end of the max date (approx +1 day duration relative to start)
        const diff = (maxEnd - startGantt) / dayMs + 1;
        return (diff / this.totalGanttDays) * 100;
    }

    ganttStartDate: Date | null = null;
    totalGanttDays = 0;

    activeFilter = 'Все';
    filterOptions = ['Все', 'В работе', 'Завершена', 'Срыв сроков'];

    setFilter(filter: string) {
        this.activeFilter = filter;
        this.calculateGanttTimeline();
    }

    // --- Precise Positioning Logic ---

    private getDiffInUnits(start: Date, end: Date, mode: string): number {
        if (mode === 'day') {
            return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        }
        if (mode === 'week') {
            return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7);
        }
        if (mode === 'month') {
            return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) +
                (end.getDate() - 1) / new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
        }
        if (mode === 'quarter') {
            const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) +
                (end.getDate() - 1) / new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
            return months / 3;
        }
        return 0;
    }

    getTaskLeftPercent(task: ProjectTask): number {
        if (!this.ganttTimelineStart || !task.createdAt || this.ganttDates.length === 0) return 0;
        const start = new Date(task.createdAt);
        if (start < this.ganttTimelineStart) return 0; // Or handle clipping

        const unitsPassed = this.getDiffInUnits(this.ganttTimelineStart, start, this.ganttViewMode);
        return (unitsPassed / this.ganttDates.length) * 100;
    }

    getTaskWidthPercent(task: ProjectTask): number {
        if (this.ganttDates.length === 0 || !task.createdAt) return 0;
        const start = new Date(task.createdAt);
        const end = task.normativeDeadline ? new Date(task.normativeDeadline) : start;

        const durationUnits = this.getDiffInUnits(start, end, this.ganttViewMode);
        const width = (durationUnits / this.ganttDates.length) * 100;
        return Math.max(width, 100 / this.ganttDates.length / 10); // Find minimal wisible width
    }

    getTaskStartOffset(task: ProjectTask): number {
        if (!this.ganttDates.length) return 0;
        const startDate = task.createdAt ? new Date(task.createdAt) : new Date();
        const minDate = this.ganttDates[0];
        const diffTime = Math.abs(startDate.getTime() - minDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getTaskDuration(task: ProjectTask): number {
        if (!task.createdAt || !task.normativeDeadline) return 0;
        const start = new Date(task.createdAt).getTime();
        const end = new Date(task.normativeDeadline).getTime();
        return Math.ceil((end - start) / (1000 * 3600 * 24));
    }

    getMonthLabel(date: Date): string {
        const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        return months[date.getMonth()];
    }

    isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }
    getTaskConnections(): string[] {
        const connections: string[] = [];
        const taskMap = new Map<string, number>();
        this.ganttTasks.forEach((t, i) => { if (t.code) taskMap.set(t.code, i); });

        // Row height including border (40px content + 1px border)
        const ROW_H = 41;
        const HALF_H = 20;

        this.ganttTasks.forEach((task, i) => {
            if (!task.code) return;
            // Find definition to get dependencies
            const def = STORE_OPENING_TASKS.find(d => d.code === task.code);
            if (!def || !def.dependsOn || def.dependsOn.length === 0) return;

            def.dependsOn.forEach(depCode => {
                const depIndex = taskMap.get(depCode);
                if (depIndex !== undefined) {
                    const depTask = this.ganttTasks[depIndex];

                    const startX = this.getTaskLeftPercent(depTask) + this.getTaskWidthPercent(depTask);
                    const startY = depIndex * ROW_H + HALF_H;

                    const endX = this.getTaskLeftPercent(task);
                    const endY = i * ROW_H + HALF_H;

                    // Curvature control points
                    // We want a curve that goes right from start, then vertical, then right to end
                    // Control points: (startX + gap, startY) and (endX - gap, endY)
                    // Gap in percent. 2% seems reasonable?

                    // Simple logic:
                    // M startX startY
                    // L endX endY (Straight line test first? No, curves are better)

                    // Bezier:
                    // C cp1x cp1y, cp2x cp2y, endX endY

                    const cp1x = startX + 2;
                    const cp1y = startY;
                    const cp2x = endX - 2;
                    const cp2y = endY;

                    // If going backwards (dependency is visually after?), handle differently? 
                    // Usually Gantt goes forward.

                    connections.push(`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`);
                }
            });
        });
        return connections;
    }

    getResponsibleDisplay(task: ProjectTask): string {
        // Если есть ResponsibleUserId, значит это новая задача с именем пользователя
        if (task.responsibleUserId) {
            // Находим пользователя по ID
            const user = [
                { id: 1, name: 'Иван Петров', role: 'МП' },
                { id: 2, name: 'Мария Сидорова', role: 'МРиЗ' },
                { id: 3, name: 'Алексей Смирнов', role: 'БА' }
            ].find(u => u.id === task.responsibleUserId);

            if (user) {
                const lastName = user.name.split(' ')[1] || user.name;
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
        if (task.responsible && task.responsible.includes(' ')) {
            const parts = task.responsible.split(' ');
            const lastName = parts[1] || parts[0];
            const nameToRole: { [key: string]: string } = {
                'Иван Петров': 'МП',
                'Мария Сидорова': 'МРиЗ',
                'Алексей Смирнов': 'БА'
            };
            const role = nameToRole[task.responsible];
            return role ? `${lastName} (${role})` : task.responsible;
        }

        return task.responsible || '';
    }

    get isCurrentUserMp(): boolean {
        const user = this.getCurrentUser();
        return user && user.role === 'МП';
    }

    canEditTask(task: ProjectTask): boolean {
        // Получаем текущего пользователя из AuthService
        const currentUser = this.getCurrentUser();
        if (!currentUser) return false;

        // Все авторизованные пользователи могут просматривать любые задачи
        return true;
    }

    private getCurrentUser() {
        // Получаем пользователя из localStorage (так же как в AuthService)
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    }

    // --- Gantt Task Info Modal ---
    openGanttTaskInfo(task: ProjectTask) {
        this.ganttSelectedTask = { ...task };
        this.showGanttTaskInfoModal = true;
    }

    closeGanttTaskInfo() {
        this.showGanttTaskInfoModal = false;
        this.ganttSelectedTask = null;
    }

    // --- Project Team ---
    // --- Project Team ---
    calculateProjectTeam() {
        const teamMap = new Map<string, TeamMember>();

        // Helpers
        const getPhone = (name: string) => {
            let hash = 0;
            for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
            const rand = Math.abs(hash);
            const p1 = (Math.abs(hash * 13) % 900) + 100;
            const p2 = (Math.abs(hash * 7) % 90) + 10;
            const p3 = (Math.abs(hash * 23) % 90) + 10;
            return `+7 (9${rand % 9 + 1}) ${p1}-${p2}-${p3}`;
        };
        const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];
        const getColor = (name: string) => {
            let hash = 0;
            for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
            return colors[Math.abs(hash) % colors.length];
        };

        const createMember = (name: string, role: string): TeamMember => ({
            name,
            role,
            phone: getPhone(name),
            initials: getInitials(name),
            color: getColor(name)
        });

        // Список пользователей для маппинга
        const users = [
            { id: 1, name: 'Иван Петров', role: 'МП' },
            { id: 2, name: 'Мария Сидорова', role: 'МРиЗ' },
            { id: 3, name: 'Алексей Смирнов', role: 'БА' }
        ];

        this.projectTasks.forEach(task => {
            if (task.responsibleUserId) {
                // Новые задачи с ID пользователя
                const user = users.find(u => u.id === task.responsibleUserId);
                if (user) {
                    teamMap.set(user.name, createMember(user.name, user.role));
                }
            } else if (task.responsible) {
                // Старые задачи
                if (task.responsible.includes(' ')) {
                    // Полное имя
                    const nameToRole: { [key: string]: string } = {
                        'Иван Петров': 'МП',
                        'Мария Сидорова': 'МРиЗ',
                        'Алексей Смирнов': 'БА'
                    };
                    const role = nameToRole[task.responsible] || 'Исполнитель';
                    teamMap.set(task.responsible, createMember(task.responsible, role));
                } else if (['МП', 'МРиЗ', 'БА'].includes(task.responsible)) {
                    // Только роль
                    const roleToUser: { [key: string]: { name: string, role: string } } = {
                        'МП': { name: 'Иван Петров', role: 'МП' },
                        'МРиЗ': { name: 'Мария Сидорова', role: 'МРиЗ' },
                        'БА': { name: 'Алексей Смирнов', role: 'БА' }
                    };
                    const user = roleToUser[task.responsible];
                    if (user) {
                        teamMap.set(user.name, createMember(user.name, user.role));
                    }
                }
            }
        });

        this.projectTeam = Array.from(teamMap.values());
    }

    // --- Task Deviation Calculation ---
    getTaskDeviation(task: ProjectTask | null): { days: number, type: 'early' | 'late' } | undefined {
        if (!task || !task.actualDate || !task.normativeDeadline) {
            return undefined;
        }

        const actualDate = new Date(task.actualDate);
        actualDate.setHours(0, 0, 0, 0);
        const planDate = new Date(task.normativeDeadline);
        planDate.setHours(0, 0, 0, 0);

        const actual = actualDate.getTime();
        const plan = planDate.getTime();

        if (actual === plan) return undefined;

        const dayMs = 1000 * 60 * 60 * 24;
        const diffDays = Math.round((actual - plan) / dayMs);

        if (diffDays === 0) return undefined;

        return {
            days: Math.abs(diffDays),
            type: diffDays > 0 ? 'late' : 'early'
        };
    }
}
