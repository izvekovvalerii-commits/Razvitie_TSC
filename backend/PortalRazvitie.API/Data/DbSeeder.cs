using Bogus;
using PortalRazvitie.API.Models;

namespace PortalRazvitie.API.Data;

public static class DbSeeder
{
    public static void SeedStores(ApplicationDbContext context)
    {
        if (context.Stores.Any())
            return;

        var cities = new[] { "Москва", "Санкт-Петербург", "Казань", "Нижний Новгород", "Екатеринбург", "Новосибирск", "Омск", "Челябинск", "Самара", "Воронеж" };
        var regions = new[] { "Московская область", "Ленинградская область", "Татарстан", "Нижегородская область", "Свердловская область", "Новосибирская область", "Омская область", "Челябинская область", "Самарская область", "Воронежская область" };

        var faker = new Faker<Store>("ru")
            .RuleFor(s => s.Code, f => $"СТ-{f.Random.Number(1000, 9999)}")
            .RuleFor(s => s.Name, f => $"Чижик {f.Address.StreetName()}")
            .RuleFor(s => s.Address, f => f.Address.FullAddress())
            .RuleFor(s => s.City, f => f.PickRandom(cities))
            .RuleFor(s => s.Region, f => f.PickRandom(regions))
            .RuleFor(s => s.TotalArea, f => Math.Round(f.Random.Double(250, 1500), 2))
            .RuleFor(s => s.TradeArea, (f, s) => Math.Round(s.TotalArea * f.Random.Double(0.6, 0.85), 2))
            .RuleFor(s => s.Status, f => f.PickRandom("Active", "Planning", "Renovation"))
            .RuleFor(s => s.OpeningDate, f => DateTime.SpecifyKind(f.Date.Between(DateTime.Now.AddYears(-5), DateTime.Now), DateTimeKind.Utc))
            .RuleFor(s => s.CreatedAt, f => DateTime.UtcNow);

        var stores = faker.Generate(50);
        context.Stores.AddRange(stores);
        context.SaveChanges();
    }

    public static void SeedProjects(ApplicationDbContext context)
    {
        if (context.Projects.Any())
            return;

        var stores = context.Stores.ToList();
        if (!stores.Any())
            return;

        var projectTypes = new[] { "Новое строительство", "Реконструкция", "Ребрендинг", "Модернизация" };
        var statuses = new[] { "Active", "Planning", "Completed", "OnHold" };
        var responsibles = new[] { "Иван Петров", "Мария Сидорова", "Алексей Иванов", "Елена Смирнова", "Дмитрий Козлов" };

        var faker = new Faker<Project>("ru")
            .RuleFor(p => p.StoreId, f => f.PickRandom(stores).Id)
            .RuleFor(p => p.ProjectType, f => f.PickRandom(projectTypes))
            .RuleFor(p => p.Status, f => f.PickRandom(statuses))
            .RuleFor(p => p.Region, f => f.PickRandom(stores).Region)
            .RuleFor(p => p.Address, f => f.PickRandom(stores).Address)
            .RuleFor(p => p.TotalArea, f => f.Random.Double(250, 1500))
            .RuleFor(p => p.TradeArea, (f, p) => p.TotalArea.HasValue ? p.TotalArea.Value * f.Random.Double(0.6, 0.85) : null)
            .RuleFor(p => p.GisCode, f => $"ГИС-{f.Random.Number(10000, 99999)}")
            .RuleFor(p => p.CFO, f => f.PickRandom("ЦФО", "СЗФО", "ПФО", "УФО", "СФО"))
            .RuleFor(p => p.MP, f => f.PickRandom(responsibles))
            .RuleFor(p => p.NOR, f => f.PickRandom(responsibles))
            .RuleFor(p => p.RNR, f => f.PickRandom(responsibles))
            .RuleFor(p => p.StMRiZ, f => f.PickRandom(responsibles))
            .RuleFor(p => p.CreatedAt, f => DateTime.UtcNow)
            .RuleFor(p => p.UpdatedAt, f => DateTime.UtcNow);

        var projects = faker.Generate(15);
        context.Projects.AddRange(projects);
        context.SaveChanges();
    }

    public static void SeedTasks(ApplicationDbContext context)
    {
        if (context.ProjectTasks.Any())
            return;

        var projects = context.Projects.ToList();
        if (!projects.Any())
            return;

        var taskTypes = new[] { "Audit", "Documentation", "Construction", "Inspection", "Approval" };
        var stages = new[] { "Проектирование", "Согласование", "Строительство", "Приемка", "Завершение" };
        var statuses = new[] { "New", "InProgress", "Completed", "Overdue" };
        var responsibles = new[] { "Иван Петров", "Мария Сидорова", "Алексей Иванов", "Елена Смирнова", "Дмитрий Козлов" };

        var faker = new Faker<ProjectTask>("ru")
            .RuleFor(t => t.ProjectId, f => f.PickRandom(projects).Id)
            .RuleFor(t => t.Code, f => $"ЗД-{f.Random.Number(1000, 9999)}")
            .RuleFor(t => t.Name, f => f.Lorem.Sentence(3, 5))
            .RuleFor(t => t.TaskType, f => f.PickRandom(taskTypes))
            .RuleFor(t => t.Stage, f => f.PickRandom(stages))
            .RuleFor(t => t.Status, f => f.PickRandom(statuses))
            .RuleFor(t => t.Responsible, f => f.PickRandom(responsibles))
            .RuleFor(t => t.NormativeDeadline, f => DateTime.SpecifyKind(f.Date.Future(3), DateTimeKind.Utc))
            .RuleFor(t => t.PlannedAuditDate, f => DateTime.SpecifyKind(f.Date.Future(2), DateTimeKind.Utc))
            .RuleFor(t => t.IsActive, f => f.Random.Bool(0.8f))
            .RuleFor(t => t.CreatedAt, f => DateTime.UtcNow)
            .RuleFor(t => t.UpdatedAt, f => DateTime.UtcNow);

        var tasks = faker.Generate(25);
        
        // Установим даты начала и завершения для некоторых задач
        foreach (var task in tasks)
        {
            if (task.Status == "InProgress")
            {
                task.StartedAt = DateTime.UtcNow.AddDays(-new Random().Next(1, 30));
            }
            else if (task.Status == "Completed")
            {
                task.StartedAt = DateTime.UtcNow.AddDays(-new Random().Next(30, 90));
                task.CompletedAt = DateTime.UtcNow.AddDays(-new Random().Next(1, 30));
                task.ActualDate = task.CompletedAt;
                task.ActualAuditDate = task.CompletedAt;
            }
        }

        context.ProjectTasks.AddRange(tasks);
        context.SaveChanges();
    }
}
