import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification } from '../models/notification.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notifications: Notification[] = [];
    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();
    private nextId = 1;

    constructor() {
        this.loadNotifications();
    }

    private loadNotifications() {
        const stored = localStorage.getItem('notifications');
        if (stored) {
            this.notifications = JSON.parse(stored);
            this.nextId = Math.max(...this.notifications.map(n => n.id), 0) + 1;
        }
        this.notificationsSubject.next(this.notifications);
    }

    private saveNotifications() {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
        this.notificationsSubject.next(this.notifications);
    }

    createNotification(
        userId: number,
        message: string,
        relatedTaskId?: number,
        relatedProjectId?: number
    ): Notification {
        const notification: Notification = {
            id: this.nextId++,
            userId,
            message,
            relatedTaskId,
            relatedProjectId,
            isRead: false,
            date: new Date().toISOString()
        };

        this.notifications.unshift(notification);
        this.saveNotifications();
        return notification;
    }

    getUserNotifications(userId: number): Notification[] {
        return this.notifications.filter(n => n.userId === userId);
    }

    getUnreadCount(userId: number): number {
        return this.notifications.filter(n => n.userId === userId && !n.isRead).length;
    }

    markAsRead(notificationId: number) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.isRead = true;
            this.saveNotifications();
        }
    }

    markAllAsRead(userId: number) {
        this.notifications
            .filter(n => n.userId === userId && !n.isRead)
            .forEach(n => n.isRead = true);
        this.saveNotifications();
    }

    deleteNotification(notificationId: number) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.saveNotifications();
    }

    clearAll(userId: number) {
        this.notifications = this.notifications.filter(n => n.userId !== userId);
        this.saveNotifications();
    }
}
