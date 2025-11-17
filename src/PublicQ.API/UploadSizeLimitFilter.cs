using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using PublicQ.Infrastructure.Options;

namespace PublicQ.API;

/// <summary>
/// This filter sets the maximum size of uploaded files.
/// </summary>
/// <remarks>
/// This filter runs early in the request pipeline to ensure that the request body size limit is set
/// That is why it implements IAuthorizationFilter instead of IActionFilter.
/// </remarks>
/// <param name="options"><see cref="FileStorageOptions"/></param>
public class UploadSizeLimitFilter(IOptionsMonitor<FileStorageOptions> options) : IAuthorizationFilter
{
    /// <summary>
    /// Executes the filter to set upload size limits for the request.
    /// This runs early in the pipeline before the request body is processed.
    /// </summary>
    /// <param name="context">The authorization filter context</param>
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var maxSize = options.CurrentValue.MaxUploadFileSizeInKilobytes * 1024L;

        var features = context.HttpContext.Features.Get<IHttpMaxRequestBodySizeFeature>();
        if (features is { IsReadOnly: false })
        {
            features.MaxRequestBodySize = maxSize;
        }
    }
}