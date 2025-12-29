export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
}

export enum UserRole {
    MP = 'МП',           // Менеджер по поиску
    MRIZ = 'МРиЗ',       // Менеджер Развития и Закупок
    BA = 'БА'            // Бизнес-администратор
}

export const MOCK_USERS: User[] = [
    {
        id: 1,
        name: 'Иван Петров',
        email: 'petrov@chizhik.ru',
        role: UserRole.MP
    },
    {
        id: 2,
        name: 'Мария Сидорова',
        email: 'sidorova@chizhik.ru',
        role: UserRole.MRIZ
    },
    {
        id: 3,
        name: 'Алексей Смирнов',
        email: 'smirnov@chizhik.ru',
        role: UserRole.BA
    }
];
