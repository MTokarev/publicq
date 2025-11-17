using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using PublicQ.Application.Models;

namespace PublicQ.Infrastructure;

/// <summary>
/// Application user entity extending IdentityUser.
/// </summary>
public class ApplicationUser : IdentityUser
{
    /// <summary>
    /// User full name.
    /// </summary>
    [MaxLength(100)]
    public string FullName { get; set; }
    
    /// <summary>
    /// Created at timestamp.
    /// </summary>
    public DateTime CreatedAtUtc { get; set; }
    
    /// <summary>
    /// Optional: Date of birth of the user.
    /// </summary>
    public DateTime? DateOfBirth { get; set; }
    
    /// <summary>
    /// Converts ApplicationUser to User model.
    /// </summary>
    /// <returns>Returns <see cref="User"/></returns>
    public User ConvertToUser()
    {
        return new User
        {
            Id = Id,
            Email = Email,
            FullName = FullName,
            HasCredential = true
        };
    }
}