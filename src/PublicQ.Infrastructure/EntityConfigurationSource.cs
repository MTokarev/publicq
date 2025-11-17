using Microsoft.Extensions.Configuration;

namespace PublicQ.Infrastructure;

public class EntityConfigurationSource(EntityConfigurationProvider provider) : IConfigurationSource
{
    public IConfigurationProvider Build(IConfigurationBuilder builder) => provider;
}