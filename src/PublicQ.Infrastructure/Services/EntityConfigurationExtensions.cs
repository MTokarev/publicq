using Microsoft.Extensions.Configuration;
using PublicQ.Infrastructure.Persistence;

namespace PublicQ.Infrastructure.Services;

public static class EntityConfigurationExtensions
{
    public static IConfigurationBuilder AddEntityConfiguration(this IConfigurationBuilder builder, ApplicationDbContext dbContext)
    {
        var provider = new EntityConfigurationProvider(dbContext);
        return builder.Add(new EntityConfigurationSource(provider));
    }
}