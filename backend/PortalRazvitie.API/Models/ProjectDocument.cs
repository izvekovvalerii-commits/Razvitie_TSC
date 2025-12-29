namespace PortalRazvitie.API.Models;

public class ProjectDocument
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public int? TaskId { get; set; }
    
    // Required metadata
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime UploadDate { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
    public string Author { get; set; } = "Системный Администратор"; // Default for now
    public string Status { get; set; } = "Доступен";

    // File info
    public string FilePath { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
}
