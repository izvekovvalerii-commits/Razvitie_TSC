import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { User } from '../../models/user.model';
import { Notification } from '../../models/notification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  menuItems = [
    { label: 'Магазины', link: '/stores' },
    { label: 'Проекты', link: '/projects' },
    { label: 'Задачи', link: '/tasks' }
  ];

  currentUser: User | null = null;
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showNotifications: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.authService.currentUser.subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadNotifications();
        }
      })
    );

    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(() => {
        if (this.currentUser) {
          this.loadNotifications();
          this.cdr.detectChanges(); // Принудительно запускаем change detection
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.showNotifications) {
      this.showNotifications = false;
    }
  }

  loadNotifications() {
    if (this.currentUser) {
      this.notifications = this.notificationService.getUserNotifications(this.currentUser.id);
      this.unreadCount = this.notificationService.getUnreadCount(this.currentUser.id);
    }
  }

  toggleNotifications(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showNotifications = !this.showNotifications;
  }

  markAsRead(notification: Notification) {
    this.notificationService.markAsRead(notification.id);
    if (notification.relatedProjectId) {
      this.router.navigate(['/projects', notification.relatedProjectId]);
      this.showNotifications = false;
    }
  }

  markAllAsRead() {
    if (this.currentUser) {
      this.notificationService.markAllAsRead(this.currentUser.id);
    }
  }

  deleteNotification(notificationId: number, event: Event) {
    event.stopPropagation();
    this.notificationService.deleteNotification(notificationId);
  }

  clearAll() {
    if (this.currentUser) {
      this.notificationService.clearAll(this.currentUser.id);
    }
  }

  getTimeAgo(date: string | Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    return `${days} дн назад`;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getRoleColor(role: string): string {
    const colors: { [key: string]: string } = {
      'МП': '#42A5F5',
      'МРиЗ': '#66BB6A',
      'БА': '#FFA726'
    };
    return colors[role] || '#999';
  }
}
