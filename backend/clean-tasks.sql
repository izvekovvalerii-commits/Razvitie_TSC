-- SQL скрипт для проверки и очистки задач

-- 1. Проверяем последние созданные задачи
SELECT id, name, responsible, "ResponsibleUserId", "CreatedAt" 
FROM "ProjectTasks" 
ORDER BY id DESC 
LIMIT 10;

-- 2. Удаляем все задачи со старой логикой (без ResponsibleUserId)
DELETE FROM "ProjectTasks" 
WHERE "ResponsibleUserId" IS NULL;

-- 3. Проверяем оставшиеся задачи
SELECT id, name, responsible, "ResponsibleUserId" 
FROM "ProjectTasks" 
ORDER BY id;
