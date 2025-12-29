using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalRazvitie.API.Data;
using PortalRazvitie.API.Models;

namespace PortalRazvitie.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TasksController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectTask>>> GetAllTasks()
    {
        return await _context.ProjectTasks
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<IEnumerable<ProjectTask>>> GetProjectTasks(int projectId)
    {
        return await _context.ProjectTasks
            .Where(t => t.ProjectId == projectId)
            .OrderBy(t => t.NormativeDeadline)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<ProjectTask>> CreateTask(ProjectTask task)
    {
        task.CreatedAt = DateTime.UtcNow;
        _context.ProjectTasks.Add(task);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetProjectTasks), new { projectId = task.ProjectId }, task);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTask(int id, ProjectTask task)
    {
        if (id != task.Id)
            return BadRequest();

        task.UpdatedAt = DateTime.UtcNow;
        _context.Entry(task).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateTaskStatus(int id, [FromBody] string status)
    {
        var task = await _context.ProjectTasks.FindAsync(id);
        if (task == null)
            return NotFound();

        task.Status = status;
        task.UpdatedAt = DateTime.UtcNow;
        
        if (status == "Завершена")
            task.ActualDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("cleanup-old")]
    public async Task<IActionResult> CleanupOldTasks()
    {
        var oldTasks = await _context.ProjectTasks
            .Where(t => t.ResponsibleUserId == null)
            .ToListAsync();
        
        _context.ProjectTasks.RemoveRange(oldTasks);
        await _context.SaveChangesAsync();
        
        return Ok(new { 
            message = $"Удалено {oldTasks.Count} старых задач без ResponsibleUserId",
            deletedCount = oldTasks.Count 
        });
    }

    [HttpGet("debug-assignments")]
    public async Task<IActionResult> DebugAssignments()
    {
        var tasks = await _context.ProjectTasks
            .OrderByDescending(t => t.Id)
            .Take(10)
            .Select(t => new {
                t.Id,
                t.Name,
                t.Responsible,
                t.ResponsibleUserId,
                t.CreatedAt
            })
            .ToListAsync();
        
        return Ok(tasks);
    }
}
