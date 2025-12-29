export interface ProjectTask {
    id?: number;
    projectId: number;
    name: string;
    taskType: string;
    responsible: string;
    responsibleUserId?: number; // ID пользователя-ответственного
    normativeDeadline: string;
    actualDate?: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
    startedAt?: string; // Дата и время взятия в работу
    completedAt?: string; // Дата и время завершения
    // BPMN fields
    code?: string;
    isActive?: boolean;
    documents?: string[];
    budgetData?: any;
    stage?: string;
    deviation?: { days: number, type: 'early' | 'late' };

    // Custom fields for specific tasks
    plannedAuditDate?: string; // Для 'Подготовка к аудиту'
    projectFolderLink?: string; // Для 'Подготовка к аудиту'
    actualAuditDate?: string; // Для 'Аудит объекта'
    alcoholLicenseEligibility?: string; // Для 'Алкогольная лицензия' ('Да' | 'Нет')

    // Для 'Площадка ТБО'
    tboDocsLink?: string; // Ссылка на документы
    tboAgreementDate?: string; // Дата согласования
    tboRegistryDate?: string; // Дата внесения в Реестр

    // Для 'Контур планировки'
    planningContourAgreementDate?: string; // Дата согласования контура планировки

    // Для 'Визуализация'
    visualizationAgreementDate?: string; // Дата согласования визуализации

    // Для 'Оценка логистики'
    logisticsNbkpEligibility?: string; // Возможность НБКП ('Да' | 'Нет')

    // Для 'Планировка с расстановкой'
    layoutAgreementDate?: string; // Дата согласования планировки

    // Для 'Расчет бюджета оборудования'
    equipmentCostNoVat?: number; // Сумма затрат на оборудование. руб. без НДС

    // Для 'Расчет бюджета СБ'
    securityBudgetNoVat?: number; // Сумма бюджета СБ. руб. без НДС

    // Для 'ТЗ и расчет бюджета РСР'
    rsrBudgetNoVat?: number; // Сумма бюджета РСР. руб. без НДС

    // Для 'Расчет бюджета ПИС'
    pisBudgetNoVat?: number; // Сумма бюджета ПИС. руб. без НДС

    // Для 'Общий бюджет проекта'
    totalBudgetNoVat?: number; // Сума общего бюджета. руб. без НДС
}

export const TASK_TYPES = [
    'Планирование аудита',
    'Согласование контура',
    'Расчет бюджета'
];

export const TASK_STATUSES = [
    'Назначена',
    'В работе',
    'Завершена',
    'Срыв сроков'
];

// Автоматическое назначение ответственных по типу задачи (старое)
export const TASK_RESPONSIBLE_MAP: { [key: string]: string } = {
    'Планирование аудита': 'НОР',
    'Согласование контура': 'МП',
    'Расчет бюджета': 'СтМРиЗ'
};

// Маппинг типов задач на роли пользователей
export const TASK_ROLE_MAP: { [key: string]: string } = {
    'Планирование аудита': 'МРиЗ',  // Менеджер Развития
    'Согласование контура': 'МП',    // Менеджер по поиску
    'Расчет бюджета': 'БА'           // Бизнес-администратор
};

// Нормативные сроки в днях
export const TASK_DEADLINE_DAYS: { [key: string]: number } = {
    'Планирование аудита': 7,
    'Согласование контура': 14,
    'Расчет бюджета': 21
};
