namespace PublicQ.Application.Models.Exam;

/// <summary>
/// Static file data transfer object.
/// </summary>
public class StaticFileDto : StaticFileCreateDto
{
    /// <summary>
    /// Identifier for the static file.
    /// </summary>
    public Guid Id { get; set; }
}