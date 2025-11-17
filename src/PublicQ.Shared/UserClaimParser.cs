using System.Security.Claims;

namespace PublicQ.Shared;

/// <summary>
/// User claim parser helper methods.
/// </summary>
public static class UserClaimParser
{
    /// <summary>
    /// Gets user display name in format "Name (Email)" from claims.
    /// </summary>
    /// <param name="claims">Claims array</param>
    /// <returns>Returns user display name in format "Name (Email)" from claims. If either claim is missing, returns "Unknown".</returns>
    public static string GetUserDisplayName(IEnumerable<Claim> claims)
    {
        var enumerable = claims as Claim[] ?? claims.ToArray();
        
        var nameClaim = enumerable.FirstOrDefault(c => c.Type == ClaimTypes.Name);
        var emailClaim = enumerable.FirstOrDefault(c => c.Type == ClaimTypes.Email);
        
        if (nameClaim?.Value == null || emailClaim?.Value == null)
        {
            return "Unknown";
        }
        
        return $"{nameClaim.Value} ({emailClaim.Value})";
    }
}