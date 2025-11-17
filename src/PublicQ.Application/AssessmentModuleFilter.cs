namespace PublicQ.Application;

/// <summary>
/// Assessment Module Filter
/// </summary>
public class AssessmentModuleFilter
{
    /// <summary>
    /// Module Id
    /// </summary>
    public Guid? Id { get; set; }
    
    /// <summary>
    /// Module Title
    /// </summary>
    public string? Title { get; set; }

    /// <summary>
    /// Override ToString for better logging and debugging
    /// </summary>
    public override string ToString()
    {
        return $"Guid: '{Id}', Title: '{Title}'";
    }
}