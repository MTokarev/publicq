namespace PublicQ.Infrastructure.Options;

/// <summary>
/// File storage options.
/// </summary>
public class FileStorageOptions
{
    /// <summary>
    /// Relative path to the directory where static files are stored.
    /// </summary>
    /// <remarks>
    /// Changing this path will require a restart of the application to take effect.
    /// All files uploaded to the server will be stored in this directory.
    /// In case of a change, you will need to move existing files to the new path manually.
    /// </remarks>
    public string StaticContentPath { get; set; }
    
    /// <summary>
    /// Maximum size of uploaded files in megabytes.
    /// </summary>
    public int MaxUploadFileSizeInKilobytes { get; set; }
}