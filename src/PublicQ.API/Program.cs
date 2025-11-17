using AspNetCoreRateLimit;
using Microsoft.AspNetCore.SpaServices.ReactDevelopmentServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using PublicQ.API.Middleware;
using PublicQ.Infrastructure;
using PublicQ.Infrastructure.Options;
using PublicQ.Infrastructure.Persistence;
using PublicQ.Infrastructure.Persistence.Seeders;
using PublicQ.Shared;
using ServiceRegistration = PublicQ.API.ServiceRegistration;

var builder = WebApplication.CreateBuilder(args);

#region add database custom provider

// Temp context to read DB settings
var configOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
    .UseSqlite(builder.Configuration.GetConnectionString(Constants.DbDefaultConnectionString))
    .Options;

var configContext = new ApplicationDbContext(configOptions);

// Create the provider instance
var entityProvider = new EntityConfigurationProvider(configContext);

// Register the provider in DI
builder.Services.AddSingleton(entityProvider);

// Add the provider to the configuration system
builder.Host.ConfigureAppConfiguration((hostingContext, config) =>
{
    // Remove any previous instance if needed, then add the same instance
    config.Add(new EntityConfigurationSource(entityProvider));
});

#endregion

// Register other services
ServiceRegistration.AddApiServices(builder.Services, builder.Configuration);

// Now build
var app = builder.Build();

// Let's seed the database with available User Roles
using (var scope = app.Services.CreateScope())
{
    await UserRoleSeeder.SeedRolesAndDataAsync(scope.ServiceProvider);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Configure static files serving for React app
app.UseDefaultFiles(); // This will serve index.html for requests to "/"
app.UseStaticFiles(); // This serves files from wwwroot

app.UseAuthentication();
app.UseRouting();
app.UseAuthorization();

app.UseMiddleware<McpApiKeyMiddleware>();
app.MapMcp(Constants.McpRoutePrefix).AllowAnonymous(); // Middleware handles authentication/authorization

app.MapControllers();

// Configure static file serving for uploads
var fileStorageOptions = app.Services.GetRequiredService<IOptions<FileStorageOptions>>().Value;
var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), fileStorageOptions.StaticContentPath);
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = $"/{fileStorageOptions.StaticContentPath}"
});

// This maps all other than /api and /mcp requests to the React app when it runs in dev
if (app.Environment.IsDevelopment())
{
    app.MapWhen(ctx => !ctx.Request.Path.StartsWithSegments($"/{Constants.ControllerRoutePrefix}") 
                    && !ctx.Request.Path.StartsWithSegments($"/{Constants.McpRoutePrefix}"),
        spaApp =>
        {
            spaApp.UseSpa(spa =>
            {
                spa.Options.SourcePath = "../../client";
                spa.UseReactDevelopmentServer(npmScript: "start");
                spa.Options.StartupTimeout = TimeSpan.FromSeconds(60);
            });
        }
    );
}
else
{
    // In production, serve the React app for any route that doesn't start with /api
    app.MapFallbackToFile("/index.html");
}

// Enable IP Rate Limiting for API routes only
// PWA path is not prefixed with /api, so it won't be rate-limited
app.UseWhen(context => context.Request.Path.StartsWithSegments($"/{Constants.ControllerRoutePrefix}"), apiApp =>
{
    apiApp.UseIpRateLimiting();
});

app.Run();