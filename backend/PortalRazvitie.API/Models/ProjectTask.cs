namespace PortalRazvitie.API.Models;

public class ProjectTask
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string TaskType { get; set; } = string.Empty; // "Планирование аудита", "Согласование контура", "Расчет бюджета"
    public string Responsible { get; set; } = string.Empty;
    public int? ResponsibleUserId { get; set; } // ID пользователя-ответственного
    public DateTime NormativeDeadline { get; set; }
    public DateTime? ActualDate { get; set; }
    public string Status { get; set; } = "Назначена"; // "Назначена", "В работе", "Завершена", "Срыва сроков"
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    
    // BPMN fields
    public string? Code { get; set; } // OP-1, OP-2...
    public bool IsActive { get; set; } = false;
    public string? Stage { get; set; }
    
    // Navigation
    // Navigation
    public Project? Project { get; set; }

    // Custom fields for specific tasks
    public DateTime? PlannedAuditDate { get; set; }
    public string? ProjectFolderLink { get; set; }
    public DateTime? ActualAuditDate { get; set; }
}
