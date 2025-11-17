namespace PublicQ.Application.Models.Exam;

/// <summary>
/// File upload data transfer object.
/// </summary>
public class FileUploadDto
{
    /// <summary>
    /// File content as a byte array.
    /// </summary>
    public required byte[] Content { get; set; }
    
    /// <summary>
    /// File name including extension.
    /// </summary>
    public required string Name { get; set; }
}