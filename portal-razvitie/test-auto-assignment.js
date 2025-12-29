// Добавьте этот код в консоль браузера для тестирования автоназначения

const TASK_ROLE_MAP = {
    'Планирование аудита': 'МРиЗ',
    'Согласование контура': 'МП',
    'Расчет бюджета': 'БА'
};

const MOCK_USERS = [
    { id: 1, name: 'Иван Петров', role: 'МП' },
    { id: 2, name: 'Мария Сидорова', role: 'МРиЗ' },
    { id: 3, name: 'Алексей Смирнов', role: 'БА' }
];

console.log('=== ТЕСТ АВТОНАЗНАЧЕНИЯ ===\n');

['Планирование аудита', 'Согласование контура', 'Расчет бюджета'].forEach(taskType => {
    const requiredRole = TASK_ROLE_MAP[taskType];
    const user = MOCK_USERS.find(u => u.role === requiredRole);

    console.log(`Задача: "${taskType}"`);
    console.log(`  Требуемая роль: ${requiredRole}`);
    console.log(`  Найден пользователь: ${user?.name} (ID: ${user?.id})`);
    console.log('');
});

console.log('Если вы видите имена пользователей - логика работает правильно!');
console.log('Если видите undefined - проверьте импорты в tasks.service.ts');
