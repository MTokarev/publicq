namespace PublicQ.API.Models.Requests;

/// <summary>
/// Static file upload request model.
/// </summary>
public class FileUploadRequest
{
    /// <summary>
    /// Module identifier to which the static file belongs.
    /// </summary>
    public Guid ModuleId { get; set; }
    
    /// <summary>
    /// File to be uploaded.
    /// </summary>
    public IFormFile? File { get; set; }
    
    /// <summary>
    /// Indicates if the file is being uploaded at module level (true) or question/answer level (false).
    /// </summary>
    public bool IsModuleLevelFile { get; set; }
}