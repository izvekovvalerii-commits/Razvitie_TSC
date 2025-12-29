export interface BpmnTaskDefinition {
    code: string;
    name: string;
    role: string;
    dependsOn: string[];
    type: 'UserTask' | 'ServiceTask' | 'ManualTask' | 'SendTask';
    stage?: string;
    duration: number; // Duration in days
}

export const STORE_OPENING_TASKS: BpmnTaskDefinition[] = [
    // 1. Старт
    {
        code: 'TASK-PREP-AUDIT',
        name: 'Подготовка к аудиту',
        role: 'МП',
        dependsOn: [],
        type: 'UserTask',
        stage: 'Инициализация',
        duration: 2
    },

    // 2. Аудит (после Подготовки)
    {
        code: 'TASK-AUDIT',
        name: 'Аудит объекта',
        role: 'МП',
        dependsOn: ['TASK-PREP-AUDIT'],
        type: 'UserTask',
        stage: 'Аудит',
        duration: 1
    },

    // --- Параллельные ветки после Аудита ---

    // 3. Алко (после Аудита)
    {
        code: 'TASK-ALCO-LIC',
        name: 'Алкогольная лицензия',
        role: 'МП',
        dependsOn: ['TASK-AUDIT'],
        type: 'UserTask',
        stage: 'Лицензирование',
        duration: 2
    },

    // 4. ТБО (после Аудита)
    {
        code: 'TASK-WASTE',
        name: 'Площадка ТБО',
        role: 'МП',
        dependsOn: ['TASK-AUDIT'],
        type: 'UserTask',
        stage: 'ТБО',
        duration: 2
    },

    // 5. Контур (после Аудита)
    {
        code: 'TASK-CONTOUR',
        name: 'Контур планировки',
        role: 'МРиЗ',
        dependsOn: ['TASK-AUDIT'],
        type: 'UserTask',
        stage: 'Проектирование',
        duration: 1
    },

    // --- Ветки после Контура планировки ---

    // 6. Визуализация (после Контура)
    {
        code: 'TASK-VISUALIZATION',
        name: 'Визуализация',
        role: 'МП',
        dependsOn: ['TASK-CONTOUR'],
        type: 'UserTask',
        stage: 'Проектирование',
        duration: 1
    },

    // 7. Логистика (после Контура)
    {
        code: 'TASK-LOGISTICS',
        name: 'Оценка логистики',
        role: 'МРиЗ',
        dependsOn: ['TASK-CONTOUR'],
        type: 'UserTask',
        stage: 'Логистика',
        duration: 2
    },

    // 8. Планировка с расстановкой (после Контура)
    {
        code: 'TASK-LAYOUT',
        name: 'Планировка с расстановкой',
        role: 'МРиЗ',
        dependsOn: ['TASK-CONTOUR'],
        type: 'UserTask',
        stage: 'Проектирование',
        duration: 2
    },

    // --- Бюджетирование ---

    // 9. Бюджет оборудования (Зависит от Визуализации и Планировки)
    {
        code: 'TASK-BUDGET-EQUIP',
        name: 'Расчет бюджета оборудования',
        role: 'МРиЗ',
        dependsOn: ['TASK-VISUALIZATION', 'TASK-LAYOUT'],
        type: 'UserTask',
        stage: 'Бюджет',
        duration: 2
    },

    // 10. Бюджет СБ (Зависит от Планировки)
    {
        code: 'TASK-BUDGET-SECURITY',
        name: 'Расчет бюджета СБ',
        role: 'МРиЗ',
        dependsOn: ['TASK-LAYOUT'],
        type: 'UserTask',
        stage: 'Бюджет',
        duration: 2
    },

    // 11. Бюджет РСР (Зависит от Бюджета СБ)
    {
        code: 'TASK-BUDGET-RSR',
        name: 'ТЗ и расчет бюджета РСР',
        role: 'МРиЗ',
        dependsOn: ['TASK-BUDGET-SECURITY'],
        type: 'UserTask',
        stage: 'Бюджет',
        duration: 1
    },

    // 12. Бюджет ПиС (Зависит от РСР и Оборудования)
    {
        code: 'TASK-BUDGET-PIS',
        name: 'Расчет бюджета ПиС',
        role: 'МРиЗ', // В диаграмме было сложно, ставим МРиЗ
        dependsOn: ['TASK-BUDGET-RSR', 'TASK-BUDGET-EQUIP'],
        type: 'UserTask',
        stage: 'Бюджет',
        duration: 1
    },

    // 13. Общий бюджет (Финал, зависит от ПиС)
    {
        code: 'TASK-TOTAL-BUDGET',
        name: 'Общий бюджет проекта',
        role: 'МП',
        dependsOn: ['TASK-BUDGET-PIS'],
        type: 'UserTask',
        stage: 'Бюджет',
        duration: 1
    }
];
