using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalRazvitie.API.Data;
using PortalRazvitie.API.Models;

namespace PortalRazvitie.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _env;

    public DocumentsController(ApplicationDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    // POST: api/documents/upload
    [HttpPost("upload")]
    //[DisableRequestSizeLimit] // Useful for large files
    public async Task<ActionResult<ProjectDocument>> Upload([FromForm] int projectId, [FromForm] IFormFile file, [FromForm] string type, [FromForm] int? taskId = null) 
    {
        if (file == null || file.Length == 0)
            return BadRequest("Файл не выбран");

        // Use WebRootPath usually for wwwroot, or ContentRootPath if wwwroot is not used.
        // Let's use ContentRoot/uploads to keep it safe from direct serving unless intended.
        var uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads");
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        // Generate unique filename
        var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Logic to determine version: count existing docs of same type/name for this project?
        // Simple versioning: 1 for now.
        // Or if user uploads "Same Name", increment? 
        // Let's stick to v1 or simple auto-increment based on total docs for simplicty for now.
        
        var existingDocsCount = await _context.ProjectDocuments
            .CountAsync(d => d.ProjectId == projectId && d.Type == type);
        
        var version = existingDocsCount + 1;

        var doc = new ProjectDocument
        {
            ProjectId = projectId,
            TaskId = taskId,
            Name = file.FileName,
            Type = type,
            UploadDate = DateTime.UtcNow,
            Version = version,
            Author = "Системный Администратор", 
            Status = "Доступен",
            FileName = uniqueFileName,
            FilePath = filePath,
            ContentType = file.ContentType,
            Size = file.Length
        };

        _context.ProjectDocuments.Add(doc);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = doc.Id }, doc);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectDocument>> GetById(int id)
    {
        var doc = await _context.ProjectDocuments.FindAsync(id);
        if (doc == null) return NotFound();
        return doc;
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<IEnumerable<ProjectDocument>>> GetByProject(int projectId)
    {
        return await _context.ProjectDocuments
            .Where(d => d.ProjectId == projectId)
            .OrderByDescending(d => d.UploadDate)
            .ToListAsync();
    }
    
    [HttpGet("task/{taskId}")]
    public async Task<ActionResult<IEnumerable<ProjectDocument>>> GetByTask(int taskId)
    {
        return await _context.ProjectDocuments
            .Where(d => d.TaskId == taskId)
            .OrderByDescending(d => d.UploadDate)
            .ToListAsync();
    }

    [HttpGet("download/{id}")]
    public async Task<IActionResult> Download(int id)
    {
        var doc = await _context.ProjectDocuments.FindAsync(id);
        if (doc == null) return NotFound();

        if (!System.IO.File.Exists(doc.FilePath))
            return NotFound("Файл не найден на сервере");

        var memory = new MemoryStream();
        using (var stream = new FileStream(doc.FilePath, FileMode.Open))
        {
            await stream.CopyToAsync(memory);
        }
        memory.Position = 0;

        return File(memory, doc.ContentType, doc.Name); // doc.Name used as download name
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var doc = await _context.ProjectDocuments.FindAsync(id);
        if (doc == null) return NotFound();

        // Delete file from disk
        if (System.IO.File.Exists(doc.FilePath))
        {
            System.IO.File.Delete(doc.FilePath);
        }

        _context.ProjectDocuments.Remove(doc);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
