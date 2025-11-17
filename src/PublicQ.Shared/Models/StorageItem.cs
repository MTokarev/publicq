namespace PublicQ.Shared.Models;

/// <summary>
/// Represents an item stored in the file storage.
/// </summary>
public class StorageItem
{
    /// <summary>
    /// File content as a byte array.
    /// </summary>
    public required byte[] Content { get; set; }
    
    /// <summary>
    /// Relative path to the file (optional).
    /// </summary>
    public string? RelativePath { get; set; }
    
    /// <summary>
    /// File name including extension.
    /// </summary>
    public required string Name { get; set; }
}