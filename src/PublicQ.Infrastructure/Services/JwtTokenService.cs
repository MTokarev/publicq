using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Infrastructure.Options;
using PublicQ.Shared;

namespace PublicQ.Infrastructure.Services;

/// <summary>
/// <see cref="ITokenService"/>
/// </summary>
public class JwtTokenService(IOptionsMonitor<AuthOptions> options, ILogger<JwtTokenService> logger) : ITokenService
{
    private const string DefaultSecurityAlgorithm = SecurityAlgorithms.HmacSha256;
    private const int DefaultTokenExpiryMinutes = 60;

    /// <summary>
    /// <see cref="ITokenService"/>
    /// </summary>
    public Response<string, GenericOperationStatuses> IssueToken(
        string identifier, 
        string uniqueName, 
        string fullName,
        IList<string>? roles = null)
    {
        Guard.AgainstNull(identifier, nameof(identifier));
        Guard.AgainstNull(uniqueName, nameof(uniqueName));
        
        var currentAuthOptions = options.CurrentValue;
        
        logger.LogDebug("Issuing token for user with identifier: {Identifier}", identifier);
        var claims = new List<Claim>
        {
            new (JwtRegisteredClaimNames.Sub, identifier),
            new (ClaimTypes.Email, uniqueName),
            new (ClaimTypes.Name, fullName),
        };

        if (roles is { Count: > 0 })
        {
            logger.LogDebug("Adding roles to claims for user with identifier: '{Identifier}'. Roles: '{Roles}'", 
                identifier,
                roles);
            claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
        }
        
        logger.LogDebug("Adding claims to token: {Claims}", claims);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(currentAuthOptions.JwtSettings.Secret));
        var credentials = new SigningCredentials(key, DefaultSecurityAlgorithm);
        var expiration = DateTime.UtcNow.AddMinutes(currentAuthOptions.JwtSettings.TokenExpiryMinutes ?? DefaultTokenExpiryMinutes);
        
        var token = new JwtSecurityToken(
            currentAuthOptions.JwtSettings.Issuer,
            currentAuthOptions.JwtSettings.Audience,
            claims,
            expires: expiration,
            signingCredentials: credentials);

        var tokenResult = new JwtSecurityTokenHandler().WriteToken(token);
        logger.LogDebug("Token issued successfully with issuer: {Issuer}, audience: {Audience}, expiration: {Expiration}", 
            currentAuthOptions.JwtSettings.Issuer, 
            currentAuthOptions.JwtSettings.Audience, 
            token.ValidTo);
        
        return Response<string, GenericOperationStatuses>.Success(tokenResult,
            GenericOperationStatuses.Completed,
            "Token issued successfully");
    }
}