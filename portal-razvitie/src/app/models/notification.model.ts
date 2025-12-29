export interface Notification {
    id: number;
    userId: number;
    message: string;
    isRead: boolean;
    date: string;
    relatedTaskId?: number;
    relatedProjectId?: number;
}
