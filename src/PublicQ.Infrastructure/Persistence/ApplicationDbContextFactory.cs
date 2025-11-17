using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace PublicQ.Infrastructure.Persistence;

/// <summary>
/// This class is required ONLY to run 'dotnet ef ...' without running the entire app
/// </summary>
public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "../PublicQ.API"))
            .AddJsonFile("appsettings.json")
            .Build();

        var services = new ServiceCollection();

        // Reuse your own extension method to register everything
        services.AddInfrastructure(configuration);

        var provider = services.BuildServiceProvider();

        return provider.GetRequiredService<ApplicationDbContext>();
    }
}