using System.Net;
using FluentValidation;
using PublicQ.API.Models.Requests;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validator for general rules.
/// </summary>
public class IpRateLimitUpdateRequestValidator : AbstractValidator<IpRateLimitUpdateRequest>
{
    /// <summary>
    /// Default constructor.
    /// </summary>
    public IpRateLimitUpdateRequestValidator()
    {
        RuleFor(x => x.PeriodInSeconds)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Period must be greater or equal to 1 second.");
        
        RuleFor(x => x.Limit)
            .GreaterThanOrEqualTo(10)
            .WithMessage("Limit must be greater or equal to 10 requests.");
        
        RuleFor(x => x.RealIpHeader)
            .NotNull()
            .NotEmpty()
            .WithMessage("Real IP header is required.");
        
        RuleForEach(x => x.IpWhitelist)
            .NotNull()
            .WithMessage("IP whitelist entries cannot be null.")
            .Must(IsValidIp)
            .WithMessage("Please provide a valid IPv4 or IPv6 address.");
    }
    
    /// <summary>
    /// Checks if the provided string is a valid IPv4 or IPv6 address.
    /// </summary>
    /// <param name="ip">IP Address</param>
    /// <returns>True if address is valid, otherwise, false.</returns>
    bool IsValidIp(string ip)
    {
        return IPAddress.TryParse(ip, out _);
    }
}