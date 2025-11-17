using System.ComponentModel.DataAnnotations;
using PublicQ.Application.Models;

namespace PublicQ.Infrastructure.Persistence.Entities;

/// <summary>
/// Exam taker (user) entity.
/// It must have at least 4 characters in its Id.
/// Why 4 characters? I don't know, just a random choice to enforce a minimum length.
/// Convince me otherwise :).
/// </summary>
/// <remarks>
/// ExamTakerEntity represents a user who takes exams within the system.
/// This entity doesn't have password or authentication details,
/// and cannot perform any operation except taking exams.
/// </remarks>
public class ExamTakerEntity
{
    [Key]
    [MinLength(4)]
    public string Id { get; set; }
    
    /// <summary>
    /// Email address of the user.
    /// </summary>
    [MaxLength(254)]
    public string? Email { get; init; }
    
    /// <summary>
    /// Optional: Date of birth of the user.
    /// </summary>
    public DateTime? DateOfBirth { get; set; }

    /// <summary>
    /// Normalized email address of the user.
    /// It is normalized to uppercase invariant culture.
    /// </summary>
    [MaxLength(254)]
    public string? NormalizedEmail { get; init; }
    
    /// <summary>
    /// Optional: Full name of the user.
    /// </summary>
    [MaxLength(100)]
    public string? FullName { get; init; }
    
    /// <summary>
    /// Created at timestamp.
    /// </summary>
    public DateTime CreatedAtUtc { get; set; }
    
    /// <summary>
    /// Helper method to convert ExamTakerEntity to User model.
    /// </summary>
    /// <returns>Returns <see cref="User"/></returns>
    public User ConvertToUser()
    {
        return new User
        {
            Id = Id,
            Email = Email,
            FullName = FullName,
            HasCredential = false
        };
    }
}