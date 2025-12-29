export interface ProjectDocument {
    id: number;
    projectId: number;
    taskId?: number;
    name: string;
    type: string;
    uploadDate: string;
    version: number;
    author: string;
    status: string;
    fileName: string;
    contentType: string;
    size: number;
}

export const DOCUMENT_TYPES = [
    'Технический план',
    'Схема подъездных путей',
    'Визуализация',
    'Расчет бюджета',
    'Договор аренды',
    'Акт приема-передачи'
];

export const DOCUMENT_STATUSES = [
    'Доступен',
    'На согласовании',
    'Утвержден',
    'Отклонен'
];
