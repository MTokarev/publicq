using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using PublicQ.Domain.Models;
using PublicQ.Shared;

namespace PublicQ.Infrastructure.Persistence.Seeders;

/// <summary>
/// Seeds roles seeder
/// </summary>
public static class UserRoleSeeder
{
    /// <summary>
    /// Default email and password for the admin user.
    /// </summary>
    private const string 
        DefaultEmail = Constants.DefaultAdminEmail,
        DefaultPassword = "admin";

    /// <summary>
    /// Seeds roles and creates default user if not exist.
    /// </summary>
    /// <param name="serviceProvider"></param>
    public static async Task SeedRolesAndDataAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        foreach (var role in UserRolesNames.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }
        
        var adminUser = await userManager.FindByEmailAsync(DefaultEmail);

        if (adminUser == null)
        {
            var user = new ApplicationUser
            {
                FullName = "Default Admin",
                UserName = DefaultEmail,
                Email = DefaultEmail,
                EmailConfirmed = true,
                CreatedAtUtc = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(user, DefaultPassword);
            if (!result.Succeeded)
                throw new Exception("Failed to create admin: " + string.Join(", ", result.Errors.Select(e => e.Description)));

            await userManager.AddToRoleAsync(user, UserRolesNames.Administrator);
        }
    }
}