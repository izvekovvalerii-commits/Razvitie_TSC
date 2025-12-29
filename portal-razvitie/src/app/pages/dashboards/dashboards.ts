import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface DashboardCard {
    id: string;
    title: string;
    description: string;
    icon: string;
    route: string;
    color: string;
    gradientFrom: string;
    gradientTo: string;
    stats?: {
        label: string;
        value: string | number;
    }[];
}

@Component({
    selector: 'app-dashboards',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboards.html',
    styleUrls: ['./dashboards.css']
})
export class DashboardsComponent implements OnInit {
    dashboards: DashboardCard[] = [
        {
            id: 'projects',
            title: 'Проекты',
            description: 'Управление проектами развития',
            icon: '🏗️',
            route: '/projects',
            color: '#FFD700',
            gradientFrom: '#FFD700',
            gradientTo: '#FFC700',
            stats: [
                { label: 'Активных', value: 12 },
                { label: 'В этом месяце', value: 3 }
            ]
        },
        {
            id: 'tasks',
            title: 'Задачи',
            description: 'Управление задачами по проектам',
            icon: '✓',
            route: '/tasks',
            color: '#4CAF50',
            gradientFrom: '#4CAF50',
            gradientTo: '#45a049',
            stats: [
                { label: 'Открытых', value: 45 },
                { label: 'На этой неделе', value: 8 }
            ]
        },
        {
            id: 'stores',
            title: 'Магазины',
            description: 'Справочник торговых объектов',
            icon: '🏪',
            route: '/stores',
            color: '#2196F3',
            gradientFrom: '#2196F3',
            gradientTo: '#1976D2',
            stats: [
                { label: 'Всего', value: 156 },
                { label: 'Регионов', value: 12 }
            ]
        },
        {
            id: 'analytics',
            title: 'Аналитика',
            description: 'Отчеты и статистика',
            icon: '📊',
            route: '/analytics',
            color: '#9C27B0',
            gradientFrom: '#9C27B0',
            gradientTo: '#7B1FA2',
            stats: [
                { label: 'Отчетов', value: 24 },
                { label: 'Графиков', value: 15 }
            ]
        },
        {
            id: 'documents',
            title: 'Документы',
            description: 'Управление документацией',
            icon: '📄',
            route: '/documents',
            color: '#FF9800',
            gradientFrom: '#FF9800',
            gradientTo: '#F57C00',
            stats: [
                { label: 'Документов', value: 342 },
                { label: 'Шаблонов', value: 18 }
            ]
        },
        {
            id: 'calendar',
            title: 'Календарь',
            description: 'Планирование и сроки',
            icon: '📅',
            route: '/calendar',
            color: '#F44336',
            gradientFrom: '#F44336',
            gradientTo: '#D32F2F',
            stats: [
                { label: 'Событий', value: 28 },
                { label: 'Сегодня', value: 5 }
            ]
        }
    ];

    selectedDashboard: DashboardCard | null = null;
    showModal = false;

    constructor(private router: Router) { }

    ngOnInit(): void {
        // Load stats dynamically if needed
    }

    openDashboard(dashboard: DashboardCard): void {
        this.selectedDashboard = dashboard;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        setTimeout(() => {
            this.selectedDashboard = null;
        }, 300);
    }

    navigateToDashboard(): void {
        if (this.selectedDashboard) {
            this.router.navigate([this.selectedDashboard.route]);
            this.closeModal();
        }
    }

    getDashboardContent(id: string): string {
        // Return specific content based on dashboard type
        const contentMap: { [key: string]: string } = {
            'projects': 'Здесь отобразится полный дашборд проектов с детальной информацией и аналитикой.',
            'tasks': 'Здесь отобразится полный дашборд задач с фильтрами и статистикой выполнения.',
            'stores': 'Здесь отобразится полный дашборд магазинов с картой и подробной информацией.',
            'analytics': 'Здесь отобразится полный дашборд аналитики с графиками и отчетами.',
            'documents': 'Здесь отобразится полный дашборд документов с возможностью управления.',
            'calendar': 'Здесь отобразится полный календарь с событиями и планами.'
        };
        return contentMap[id] || 'Содержимое дашборда';
    }
}
