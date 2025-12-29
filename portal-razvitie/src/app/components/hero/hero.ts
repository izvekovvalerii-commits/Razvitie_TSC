import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TasksService } from '../../services/tasks';
import { ProjectsService } from '../../services/projects';
import { NotificationService } from '../../services/notification.service';
import { UserActivityService } from '../../services/user-activity.service';
import { User } from '../../models/user.model';
import { ProjectTask } from '../../models/task.model';
import { Project } from '../../models/project.model';
import { Notification } from '../../models/notification.model';
import { UserActivity } from '../../models/user-activity.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-hero',
  imports: [CommonModule, RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.css'
})
export class HeroComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  loading = true;

  // Dynamic data from API
  myTasks: ProjectTask[] = [];
  newTasks: ProjectTask[] = [];
  activeTasks: ProjectTask[] = [];
  myProjects: Project[] = [];
  notifications: Notification[] = [];

  // Activity log for BA role (and now for everyone)
  recentActivities: UserActivity[] = [];

  // Metrics
  avgTaskTime: string = '-';
  busyUser: { name: string; count: number } | null = null;
  projectStats = { active: 0, planning: 0, renovation: 0, total: 0 };
  detailedStats: { name: string; count: number; percent: number; color: string }[] = [];
  today: Date = new Date();
  currentTime: Date = new Date();
  private timeInterval: any;

  // Collapsed state for blocks
  blocksCollapsed = {
    metrics: false,
    tasks: false,
    projects: false,
    activity: false
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private tasksService: TasksService,
    private projectsService: ProjectsService,
    private notificationService: NotificationService,
    private activityService: UserActivityService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadDashboardData();
      } else {
        this.loading = false;
      }
    });

    this.startClock();
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  startClock() {
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
      this.cdr.detectChanges();
    }, 1000);
  }

  loadDashboardData() {
    this.loading = true;

    forkJoin({
      tasks: this.tasksService.getAllTasks(),
      projects: this.projectsService.getProjects()
    }).subscribe({
      next: ({ tasks, projects }) => {
        this.processTasks(tasks);
        this.processProjects(projects);
        this.calculateMetrics(tasks); // Calculate metrics for all tasks
        this.loadRecentActivities(tasks, projects); // Load activities

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private processTasks(allTasks: ProjectTask[]) {
    if (!this.currentUser) return;

    // БА sees all tasks, others only their own
    if (this.currentUser.role === 'БА') {
      this.myTasks = allTasks;
    } else {
      // Filter tasks for current user
      this.myTasks = allTasks.filter(task => {
        return task.responsibleUserId === this.currentUser!.id ||
          task.responsible === this.currentUser!.name ||
          task.responsible === this.currentUser!.role;
      });
    }

    // Sort by deadline (urgent first)
    this.myTasks.sort((a, b) => {
      const dateA = new Date(a.normativeDeadline).getTime();
      const dateB = new Date(b.normativeDeadline).getTime();
      return dateA - dateB;
    });

    this.newTasks = this.myTasks.filter(t => t.status === 'Назначена');
    this.activeTasks = this.myTasks.filter(t => t.status === 'В работе');
  }

  private processProjects(allProjects: Project[]) {
    if (!this.currentUser) return;

    // Find projects where user has tasks
    const myProjectIds = new Set(this.myTasks.map(t => t.projectId));

    // If user is BA, show all projects; otherwise show only projects with assigned tasks
    if (this.currentUser.role === 'БА') {
      this.myProjects = allProjects;
    } else {
      this.myProjects = allProjects.filter(p => p.id && myProjectIds.has(p.id));
    }
    this.calculateProjectStats();
  }

  private calculateProjectStats() {
    this.projectStats.total = this.myProjects.length;
    this.projectStats.active = this.myProjects.filter(p => ['Active', 'Открыт'].includes(p.status)).length;
    this.projectStats.planning = this.myProjects.filter(p => ['Planning', 'Создан', 'Аудит', 'Бюджет сформирован', 'Утвержден ИК', 'Подписан договор'].includes(p.status)).length;
    this.projectStats.renovation = this.myProjects.filter(p => ['Renovation', 'СМР', 'Ремонт', 'Рср'].includes(p.status)).length;

    // Detailed breakdown by status
    const statusCounts: { [key: string]: number } = {};
    this.myProjects.forEach(p => {
      const s = p.status || 'Без статуса';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    this.detailedStats = Object.keys(statusCounts).map(status => ({
      name: status,
      count: statusCounts[status],
      percent: Math.round((statusCounts[status] / this.projectStats.total) * 100),
      color: this.getDetailedStatusColor(status)
    })).sort((a, b) => b.count - a.count).slice(0, 5); // Show top 5
  }

  getDetailedStatusColor(status: string): string {
    const s = status.toLowerCase();
    if (s.includes('открыт') || s.includes('active')) return '#4CAF50';
    if (s.includes('смр') || s.includes('ремонт') || s.includes('renovation')) return '#F44336';
    if (s.includes('аудит')) return '#FF9800';
    if (s.includes('бюджет')) return '#FFC107';
    if (s.includes('утвержден')) return '#FFB74D';
    if (s.includes('договор')) return '#FB8C00';
    return '#E0E0E0';
  }

  private calculateMetrics(allTasks: ProjectTask[]) {
    // 1. Average time for tasks in progress
    const inProgressTasks = allTasks.filter(t => t.status === 'В работе' && t.createdAt);
    if (inProgressTasks.length > 0) {
      const now = new Date().getTime();
      const totalTimeMs = inProgressTasks.reduce((acc, t) => {
        return acc + (now - new Date(t.createdAt!).getTime());
      }, 0);

      const avgMs = totalTimeMs / inProgressTasks.length;
      const days = Math.round(avgMs / (1000 * 60 * 60 * 24));
      this.avgTaskTime = `${days} ${this.getDaysWord(days)}`;
    } else {
      this.avgTaskTime = '0 дней';
    }

    // 2. User with most tasks
    const activeTasks = allTasks.filter(t => t.status !== 'Выполнена' && t.status !== 'Отменена');
    const userCounts: { [key: string]: number } = {};

    activeTasks.forEach(t => {
      if (t.responsible) {
        userCounts[t.responsible] = (userCounts[t.responsible] || 0) + 1;
      }
    });

    let maxCount = 0;
    let topUser = '';

    Object.entries(userCounts).forEach(([user, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topUser = user;
      }
    });

    if (topUser) {
      this.busyUser = { name: topUser, count: maxCount };
    }
  }

  private loadRecentActivities(tasks: ProjectTask[], projects: Project[]) {
    // Get only real activities from the service (no fake generation)
    const storedActivities = this.activityService.getActivities();

    // Create a map for fast project lookup
    const projectMap = new Map(projects.map(p => [p.id, p]));

    // Sort by time descending and take last 20
    this.recentActivities = storedActivities
      .map(a => {
        const p = projectMap.get(a.projectId);
        let pName = 'Проект #' + a.projectId;
        if (p) {
          pName = p.store?.name || p.address || p.projectType || pName;
        }
        return {
          ...a,
          projectName: pName
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    console.log('[Hero] Loaded activities count:', this.recentActivities.length);
  }

  private getRoleByName(name: string): string {
    if (name.includes('Петров')) return 'МП';
    if (name.includes('Сидорова')) return 'МРиЗ';
    if (name.includes('Смирнов')) return 'БА';
    return 'Сотрудник';
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    return `${diffDays} дн назад`;
  }

  getRoleColor(role: string): string {
    const colors: { [key: string]: string } = {
      'МП': '#42A5F5',
      'МРиЗ': '#66BB6A',
      'БА': '#FFA726',
      'НОР': '#AB47BC',
      'РНР': '#EF5350'
    };
    return colors[role] || '#999';
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '-');
  }

  toggleBlock(blockName: keyof typeof this.blocksCollapsed): void {
    this.blocksCollapsed[blockName] = !this.blocksCollapsed[blockName];
  }

  // Days until deadline helpers
  getDaysUntilDeadline(task: ProjectTask): { days: number; text: string; isOverdue: boolean; isUrgent: boolean; isGreen: boolean } {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const deadline = new Date(task.normativeDeadline);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let text = '';
    let isOverdue = false;
    let isUrgent = false;
    let isGreen = false;

    if (task.createdAt) {
      const created = new Date(task.createdAt);
      created.setHours(0, 0, 0, 0);

      const totalTime = deadline.getTime() - created.getTime();
      const remainingTime = deadline.getTime() - now.getTime();

      if (totalTime > 0) {
        const percentageRemaining = (remainingTime / totalTime) * 100;
        isGreen = percentageRemaining > 80;
      }
    }

    if (diffDays < 0) {
      text = `${Math.abs(diffDays)} ${this.getDaysWord(Math.abs(diffDays))} назад`;
      isOverdue = true;
    } else if (diffDays === 0) {
      text = 'Сегодня';
      isUrgent = true;
    } else if (diffDays === 1) {
      text = 'Завтра';
      isUrgent = true;
    } else if (diffDays <= 3) {
      text = `${diffDays} ${this.getDaysWord(diffDays)}`;
      isUrgent = true;
    } else {
      text = `${diffDays} ${this.getDaysWord(diffDays)}`;
    }

    return { days: diffDays, text, isOverdue, isUrgent, isGreen };
  }

  get overdueTasks(): ProjectTask[] {
    const now = new Date();
    return this.myTasks.filter(task => {
      const deadline = new Date(task.normativeDeadline);
      return deadline < now && task.status !== 'Выполнена' && task.status !== 'Завершена';
    });
  }

  get overdueCount(): number {
    return this.overdueTasks.length;
  }

  get expiringSoonTasks(): ProjectTask[] {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    return this.myTasks.filter(task => {
      if (task.status === 'Выполнена' || task.status === 'Завершена') {
        return false;
      }
      const deadline = new Date(task.normativeDeadline);
      deadline.setHours(0, 0, 0, 0);
      return deadline >= tomorrow && deadline < dayAfterTomorrow;
    });
  }

  get expiringSoonCount(): number {
    return this.expiringSoonTasks.length;
  }

  private getDaysWord(days: number): string {
    const absDays = Math.abs(days);
    if (absDays % 10 === 1 && absDays % 100 !== 11) {
      return 'день';
    } else if ([2, 3, 4].includes(absDays % 10) && ![12, 13, 14].includes(absDays % 100)) {
      return 'дня';
    } else {
      return 'дней';
    }
  }

  // Navigation with filters
  navigateToTasksWithFilter(status: string) {
    this.router.navigate(['/tasks'], { queryParams: { status } });
  }

  navigateToProjects() {
    this.router.navigate(['/projects']);
  }

  navigateToOverdueTasks() {
    this.router.navigate(['/tasks'], { queryParams: { overdue: 'true' } });
  }

  navigateToExpiringSoonTasks() {
    this.router.navigate(['/tasks'], { queryParams: { expiringSoon: 'true' } });
  }
}
