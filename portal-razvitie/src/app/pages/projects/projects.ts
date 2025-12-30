import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectsService } from '../../services/projects';
import { StoresService } from '../../services/stores';
import { TasksService } from '../../services/tasks';
import { AuthService } from '../../services/auth.service';
import { Project, PROJECT_TYPES, PROJECT_STATUSES, REGIONS, CFO_LIST } from '../../models/project.model';
import { User, MOCK_USERS, UserRole } from '../../models/user.model';
import { Store } from '../../models/store.model';
import { WorkflowService } from '../../services/workflow.service';

@Component({
  selector: 'app-projects',
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.html',
  styleUrl: './projects.css'
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  stores: Store[] = [];
  loading = true;
  showCreateModal = false;
  currentUser: User | null = null;

  searchQuery: string = '';
  viewMode: 'grid' | 'table' = 'grid';

  get filteredProjects(): Project[] {
    if (!this.searchQuery) return this.projects;
    const q = this.searchQuery.toLowerCase();
    return this.projects.filter(p =>
      (p.gisCode && p.gisCode.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q)) ||
      (p.projectType && p.projectType.toLowerCase().includes(q))
    );
  }

  // Create form
  newProject: Partial<Project> = {
    projectType: '',
    status: 'Создан',
    mp: 'Менеджер проекта',
    nor: 'Начальник отдела развития',
    stMRiZ: 'Старший менеджер',
    rnr: 'Руководитель направления развития'
  };
  selectedStoreId: number | null = null;

  projectTypes = PROJECT_TYPES;
  projectStatuses = PROJECT_STATUSES;
  regions = REGIONS;
  cfoList = CFO_LIST;
  managers = MOCK_USERS.filter(u => u.role === UserRole.MP);

  constructor(
    private router: Router,
    private projectsService: ProjectsService,
    private storesService: StoresService,
    private tasksService: TasksService,
    private workflowService: WorkflowService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
    this.loadProjects();
    this.loadStores();
  }

  loadProjects() {
    this.projectsService.getProjects().subscribe({
      next: (data) => {
        this.projects = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading projects:', err)
    });
  }

  loadStores() {
    this.storesService.getStores().subscribe({
      next: (data) => {
        this.stores = data;
        console.log('Loaded stores from API:', data.length, 'First store ID:', data[0]?.id);
      },
      error: (err) => console.error('Error loading stores:', err)
    });
  }

  openCreateModal() {
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.selectedStoreId = null;
  }

  selectStore() {
    if (!this.selectedStoreId) return;

    const store = this.stores.find(s => s.id === this.selectedStoreId);
    if (store) {
      this.newProject.address = store.address;
      this.newProject.totalArea = store.totalArea;
      this.newProject.tradeArea = store.tradeArea;
      this.newProject.region = store.region;
    }
  }

  createProject() {
    if (!this.selectedStoreId || !this.newProject.projectType || !this.newProject.gisCode) {
      alert('Заполните обязательные поля');
      return;
    }

    const project: Project = {
      storeId: Number(this.selectedStoreId),
      projectType: this.newProject.projectType!,
      status: this.newProject.status || 'Создан',
      gisCode: this.newProject.gisCode!,
      address: this.newProject.address!,
      totalArea: this.newProject.totalArea,
      tradeArea: this.newProject.tradeArea,
      region: this.newProject.region!,
      cfo: this.newProject.cfo!,
      mp: this.newProject.mp!,
      nor: this.newProject.nor!,
      stMRiZ: this.newProject.stMRiZ!,
      rnr: this.newProject.rnr!
    };

    this.projectsService.createProject(project).subscribe({
      next: (createdProject) => {
        console.log('Project created:', createdProject);
        // Создаем ВСЕ начальные задачи из workflow с автоназначением
        if (createdProject && createdProject.id) {
          const projectName = `${createdProject.gisCode} - ${createdProject.address}`;

          // Получаем начальные задачи из workflow (те, у которых нет зависимостей)
          const initialTasks = this.workflowService.getInitialTasks(createdProject.id);
          console.log('Creating initial workflow tasks:', initialTasks.length);

          // Создаем каждую задачу с автоназначением
          const createTaskPromises = initialTasks.map(task =>
            this.tasksService.createTask(task, projectName).toPromise()
          );

          Promise.all(createTaskPromises).then(tasks => {
            console.log('All initial tasks created:', tasks);
            this.loadProjects();
            this.closeCreateModal();
            this.resetForm();
          }).catch(err => {
            console.error('Failed to create tasks', err);
            this.loadProjects();
            this.closeCreateModal();
            this.resetForm();
          });
        } else {
          console.warn('No project ID, skipping task creation');
          this.loadProjects();
          this.closeCreateModal();
          this.resetForm();
        }
      },
      error: (err) => console.error('Error creating project:', err)
    });
  }

  resetForm() {
    this.newProject = {
      projectType: '',
      status: 'Создан',
      mp: '', // Allow selection
      nor: 'Начальник отдела развития',
      stMRiZ: 'Старший менеджер',
      rnr: 'Руководитель направления развития'
    };
    this.selectedStoreId = null;
  }

  viewProject(project: Project) {
    if (project.id) {
      this.router.navigate(['/projects', project.id]);
    }
  }

  canCreateProject(): boolean {
    // БА и МРиЗ могут создавать проекты
    return this.currentUser?.role === 'БА' || this.currentUser?.role === 'МРиЗ';
  }
}
