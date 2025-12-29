import { Injectable } from '@angular/core';
import { UserActivity } from '../models/user-activity.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserActivityService {
    private activitiesSubject = new BehaviorSubject<UserActivity[]>([]);
    public activities$ = this.activitiesSubject.asObservable();
    private readonly STORAGE_KEY = 'portal_user_activities';

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                const activities = JSON.parse(stored);
                this.activitiesSubject.next(activities);
            } catch (e) {
                console.error('Failed to parse activities', e);
            }
        }
    }

    addActivity(activity: UserActivity) {
        const current = this.activitiesSubject.value;
        const updated = [activity, ...current].slice(0, 50); // Keep last 50
        this.activitiesSubject.next(updated);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    }

    getActivities(): UserActivity[] {
        return this.activitiesSubject.value;
    }

    clearActivities() {
        this.activitiesSubject.next([]);
        localStorage.removeItem(this.STORAGE_KEY);
    }
}
