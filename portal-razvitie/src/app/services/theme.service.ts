import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private darkModeSubject = new BehaviorSubject<boolean>(false);
    public darkMode$ = this.darkModeSubject.asObservable();

    constructor() {
        // Load theme preference from localStorage
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme === 'dark';
        this.setDarkMode(isDark);
    }

    toggleTheme() {
        const newMode = !this.darkModeSubject.value;
        this.setDarkMode(newMode);
    }

    setDarkMode(isDark: boolean) {
        this.darkModeSubject.next(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        if (isDark) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    get isDarkMode(): boolean {
        return this.darkModeSubject.value;
    }
}
