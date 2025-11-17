using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PublicQ.Infrastructure.Options;

namespace PublicQ.Infrastructure;

/// <summary>
/// Dynamic JWT Bearer Handler that updates token validation parameters based on current AuthOptions
/// </summary>
/// <param name="jwtOptions"><see cref="JwtBearerOptions"/></param>
/// <param name="authOptions"><see cref="AuthOptions"/></param>
/// <param name="logger">Logger</param>
/// <param name="encoder">Url encoder</param>
/// <param name="clock"><see cref="ISystemClock"/></param>
public class DynamicJwtBearerHandler(
    IOptionsMonitor<JwtBearerOptions> jwtOptions,
    IOptionsMonitor<AuthOptions> authOptions,
    ILoggerFactory logger,
    UrlEncoder encoder,
    ISystemClock clock)
    : JwtBearerHandler(jwtOptions, logger, encoder, clock)
{
    
    /// <summary>
    /// Override the authentication handler to dynamically update token validation parameters
    /// </summary>
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Update token validation parameters with current auth options
        var currentAuthOptions = authOptions.CurrentValue;
        var key = Encoding.ASCII.GetBytes(currentAuthOptions.JwtSettings.Secret);
            
        Options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = currentAuthOptions.JwtSettings.Issuer,
            ValidAudience = currentAuthOptions.JwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
        };

        return base.HandleAuthenticateAsync();
    }
}