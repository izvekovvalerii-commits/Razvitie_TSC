using Microsoft.EntityFrameworkCore;
using PortalRazvitie.API.Data;
using PortalRazvitie.API.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    Console.WriteLine("=== Проверка задач ===\n");
    
    // Показываем последние 10 задач
    var recentTasks = await context.ProjectTasks
        .OrderByDescending(t => t.Id)
        .Take(10)
        .ToListAsync();
    
    Console.WriteLine("Последние 10 задач:");
    foreach (var task in recentTasks)
    {
        Console.WriteLine($"ID: {task.Id}, Название: {task.Name}, Ответственный: {task.Responsible}, UserID: {task.ResponsibleUserId}");
    }
    
    // Считаем задачи без ResponsibleUserId
    var oldTasksCount = await context.ProjectTasks
        .Where(t => t.ResponsibleUserId == null)
        .CountAsync();
    
    Console.WriteLine($"\n\nЗадач без ResponsibleUserId: {oldTasksCount}");
    
    if (oldTasksCount > 0)
    {
        Console.WriteLine("\nУдалить старые задачи? (y/n)");
        var answer = Console.ReadLine();
        
        if (answer?.ToLower() == "y")
        {
            var oldTasks = await context.ProjectTasks
                .Where(t => t.ResponsibleUserId == null)
                .ToListAsync();
            
            context.ProjectTasks.RemoveRange(oldTasks);
            await context.SaveChangesAsync();
            
            Console.WriteLine($"Удалено {oldTasks.Count} старых задач");
        }
    }
    
    // Показываем задачи с ResponsibleUserId
    var newTasks = await context.ProjectTasks
        .Where(t => t.ResponsibleUserId != null)
        .ToListAsync();
    
    Console.WriteLine($"\n\nЗадачи с ResponsibleUserId ({newTasks.Count}):");
    foreach (var task in newTasks)
    {
        Console.WriteLine($"ID: {task.Id}, Название: {task.Name}, Ответственный: {task.Responsible}, UserID: {task.ResponsibleUserId}");
    }
}

Console.WriteLine("\nГотово!");
