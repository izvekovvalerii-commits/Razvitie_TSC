export interface UserActivity {
    id: number;
    userId: number;
    userName: string;
    userRole: string;
    action: string; // 'создал', 'взял в работу', 'завершил', 'изменил статус'
    taskId: number;
    taskName: string;
    projectId: number;
    timestamp: string;
    details?: string;
    projectName?: string;
}
