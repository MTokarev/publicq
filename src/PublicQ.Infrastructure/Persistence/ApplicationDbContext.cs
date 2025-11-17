using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using PublicQ.Infrastructure.Entities;
using PublicQ.Infrastructure.Persistence.Entities;
using PublicQ.Infrastructure.Persistence.Entities.Assignment;
using PublicQ.Infrastructure.Persistence.Entities.Group;
using PublicQ.Infrastructure.Persistence.Entities.Module;
using PublicQ.Infrastructure.Persistence.Seeders;

namespace PublicQ.Infrastructure.Persistence;

/// <summary>
/// Application Database context.
/// </summary>
public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    /// <summary>
    /// Default constructor.
    /// </summary>
    /// <param name="options"><see cref="ApplicationDbContext"/></param>
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
        // If in design-time mode, skip migration
        if (IsDesignTime())
        {
            return;
        }
        
        Console.WriteLine("Starting database migration process...");
        var dataSource = Database.GetDbConnection().DataSource;
        if (!string.IsNullOrEmpty(dataSource))
        {
            var directory = Path.GetDirectoryName(dataSource);
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory); // make sure ./db exists
            }
        }

        // When app crashes during migration, the lock might not be released
        // This is a workaround to clear the lock before applying migrations
        // Otherwise, the app might get stuck in a state where it cannot start
        // due to the existing lock.
        ClearStaleMigrationLocksAsync(Database);
        Database.Migrate();
    }
    
    private static bool IsDesignTime()
    {
        // Check if we're in design-time mode (EF tooling)
        return Environment.GetCommandLineArgs().Any(arg => arg.Contains("ef"));
    }

    // Parameterless constructor ONLY for EF CLI fallback (optional, not recommended in production)
    public ApplicationDbContext() { }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // Suppress pending model changes warning during design-time operations (EF CLI)
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.ConfigureWarnings(warnings => 
                warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        }
    }
    
    /// <summary>
    /// This table stores configuration settings for the options. Treat it as a key-value store for appsettings.
    /// </summary>
    public DbSet<SystemSettings> SystemSettings { get; set; }
    
    /// <summary>
    /// Log entries stored in the database.
    /// </summary>
    public DbSet<LogEntryEntity> LogEntries { get; set; }
    
    /// <summary>
    /// Application configurations that can be used to store complex configuration objects.
    /// It is not related to the service options, but rather to the user-defined settings.
    /// All service related configurations should be stored in this <see cref="SystemSettings"/> table.
    /// </summary>
    public DbSet<ConfigurationEntity> UserConfigurations { get; set; }
    
    /// <summary>
    /// Message templates used for sending messages.
    /// <seealso cref="MessageTemplates"/>
    /// </summary>
    public DbSet<MessageTemplateEntity> MessageTemplates { get; set; }
    
    /// <summary>
    /// Question entities that are used in the exam system.
    /// <seealso cref="QuestionEntity"/>
    /// </summary>
    public DbSet<QuestionEntity> AssessmentQuestions { get; set; }
    
    /// <summary>
    /// Possible answers for the questions in the exam system.
    /// <seealso cref="PossibleAnswerEntity"/>
    /// </summary>
    public DbSet<PossibleAnswerEntity> AssessmentPossibleAnswers { get; set; }
    
    /// <summary>
    /// Test modules versions that comprise a set of questions for testing purposes.
    /// <seealso cref="AssessmentModuleVersionEntity"/>
    /// </summary>
    public DbSet<AssessmentModuleVersionEntity> AssessmentModuleVersions { get; set; }
    
    /// <summary>
    /// Test modules that represent a collection of versions of a test module.
    /// <seealso cref="AssessmentModuleEntity"/>
    /// </summary>
    public DbSet<AssessmentModuleEntity> AssessmentModules { get; set; }
    
    /// <summary>
    /// Test module static files that are associated with the test modules.
    /// </summary>
    /// <remarks>
    /// It is necessary to store static files associated with the test modules to control
    /// the lifecycle of the files.
    /// </remarks>
    public DbSet<StaticFileEntity> StaticFiles { get; set; }

    /// <summary>
    /// Group entities that represent a collection of <see cref="GroupMemberEntity"/>
    /// </summary>
    public DbSet<GroupEntity> Groups { get; set; }
    
    /// <summary>
    /// Group members that represent specific <see cref="AssessmentModules"/>
    /// </summary>
    public DbSet<GroupMemberEntity> GroupMembers { get; set; }
    
    /// <summary>
    /// Assignment entities that represent an assignment of a group to a user.
    /// </summary>
    public DbSet<AssignmentEntity> Assignments { get; set; }
    
    /// <summary>
    /// Exam taker assignment entities that represent the assignment of an exam taker to a specific assignment.
    /// </summary>
    public DbSet<ExamTakerAssignmentEntity> ExamTakerAssignments { get; set; }
    
    /// <summary>
    /// Exam taker entities that represent users who take exams.
    /// </summary>
    public DbSet<ExamTakerEntity> ExamTakers { get; set; }
    
    /// <summary>
    /// Module progress entities that represent the progress of an exam taker on a specific module within an assignment.
    /// </summary>
    public DbSet<ModuleProgressEntity> ModuleProgress { get; set; }
    
    /// <summary>
    /// Represents the responses given by exam takers to questions in the exam system.
    /// </summary>
    public DbSet<QuestionResponseEntity> QuestionResponses { get; set; }
    
    /// <summary>
    /// Banner entities used for displaying announcements or notifications to users.
    /// </summary>
    public DbSet<BannerEntity> Banners { get; set; }
    
    /// <summary>
    /// The pages entities used for storing static or dynamic page content.
    /// </summary>
    public DbSet<PageEntity> Pages { get; set; }
    
    /// <summary>
    /// This method is called when the model for a derived context is being created.
    /// </summary>
    /// <param name="modelBuilder"></param>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<LogEntryEntity>()
            .HasIndex(l => l.Timestamp);
        modelBuilder.Entity<LogEntryEntity>()
            .HasIndex(l => l.Level);
        
        # region configur exam entities relationships
        modelBuilder.Entity<PossibleAnswerEntity>()
            .HasMany(q => q.AssociatedStaticFiles)
            .WithMany(f => f.PossibleAnswers);
        
        modelBuilder.Entity<QuestionEntity>()
            .HasMany(q => q.PossibleAnswers)
            .WithOne(q => q.Question)
            .HasForeignKey(q => q.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<QuestionEntity>()
            .HasMany(q => q.AssociatedStaticFiles)
            .WithMany(f => f.Questions);
        modelBuilder.Entity<QuestionEntity>()
            .HasIndex(q => q.AssessmentModuleVersionId);
        
        modelBuilder.Entity<AssessmentModuleVersionEntity>()
            .HasMany(m => m.Questions)
            .WithOne(m => m.AssessmentModuleVersion)
            .HasForeignKey(m => m.AssessmentModuleVersionId)
            .OnDelete(DeleteBehavior.Cascade);
        
        modelBuilder.Entity<AssessmentModuleVersionEntity>()
            .HasOne(m => m.AssessmentModule)
            .WithMany(m => m.Versions)
            .HasForeignKey(m => m.AssessmentModuleId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<AssessmentModuleVersionEntity>()
            .HasIndex(m => m.Title);
        modelBuilder.Entity<AssessmentModuleVersionEntity>()
            .HasIndex(m => m.NormalizedTitle);
        
        modelBuilder.Entity<AssessmentModuleEntity>()
            .HasMany(m => m.AssociatedStaticFiles)
            .WithOne(f => f.AssessmentModule)
            .HasForeignKey(f => f.AssessmentModuleId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // For better performance
        modelBuilder.Entity<StaticFileEntity>()
            .HasIndex(f => f.AssessmentModuleId);
        
        modelBuilder.Entity<GroupEntity>()
            .HasMany(g => g.GroupMemberEntities)
            .WithOne(m => m.Group)
            .HasForeignKey(m => m.GroupId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<GroupEntity>()
            .HasIndex(g => g.NormalizedTitle)
            .IsUnique();
        
        modelBuilder.Entity<GroupMemberEntity>()
            .HasOne(m => m.AssessmentModule)
            .WithMany(m => m.GroupMembers)
            .OnDelete(DeleteBehavior.Cascade);
        
        // This index ensures that each group member has a unique order number within the group
        modelBuilder.Entity<GroupMemberEntity>()
            .HasIndex(x => new { x.GroupId, x.OrderNumber })
            .IsUnique();
        
        modelBuilder.Entity<AssignmentEntity>()
            .HasOne(a => a.Group)
            .WithMany(g => g.Assignments)
            .HasForeignKey(a => a.GroupId)
            .OnDelete(DeleteBehavior.Cascade);
        
        modelBuilder.Entity<AssignmentEntity>()
            .HasIndex(a => a.Title)
            .IsUnique();
        
        modelBuilder.Entity<ExamTakerAssignmentEntity>()
            .HasOne(a=> a.Assignment)
            .WithMany(a => a.ExamTakerAssignments)
            .HasForeignKey(a => a.AssignmentId)
            .OnDelete(DeleteBehavior.Cascade);
        
        modelBuilder.Entity<ModuleProgressEntity>()
            .HasOne(m => m.ExamTakerAssignment)
            .WithMany(m => m.ModuleProgress)
            .HasForeignKey(m => m.ExamTakerAssignmentId)
            .OnDelete(DeleteBehavior.Cascade);
        
        modelBuilder.Entity<QuestionResponseEntity>()
            .HasOne(q => q.ModuleProgress)
            .WithMany(m => m.QuestionResponses)
            .HasForeignKey(q => q.ModuleProgressId)
            .OnDelete(DeleteBehavior.Cascade);
        
        modelBuilder.Entity<ExamTakerEntity>()
            .HasIndex(e => e.NormalizedEmail)
            .IsUnique();

        modelBuilder.Entity<BannerEntity>()
            .HasIndex(b => b.ShowToAuthenticatedUsersOnly);
        
        # endregion
        
        // Seed initial configuration
        SeedConfiguration.Seed(modelBuilder);
    }

    /// <summary>
    /// Safely clears stale migration locks without requiring DI container.
    /// Use this for early initialization scenarios like configuration providers.
    /// </summary>
    private void ClearStaleMigrationLocksAsync(DatabaseFacade database)
    {
        try
        {
            // Check if any migrations have been applied (which means the lock table might exist)
            var appliedMigrations = database.GetAppliedMigrations();
            if (!appliedMigrations.Any())
            {
                return; // No migrations applied yet, skip lock cleanup
            }
            
            // Use database-agnostic raw SQL that works across providers
            var provider = database.ProviderName?.ToLowerInvariant();
            string deleteQuery = provider switch
            {
                // SQL Server, Azure SQL
                var p when p?.Contains("sqlserver") == true => "DELETE FROM [__EFMigrationsLock]",
                // PostgreSQL
                var p when p?.Contains("postgresql") == true => "DELETE FROM \"__EFMigrationsLock\"", 
                // MySQL
                var p when p?.Contains("mysql") == true => "DELETE FROM `__EFMigrationsLock`",
                // SQLite (default)
                _ => "DELETE FROM __EFMigrationsLock"
            };
            
            database.ExecuteSqlRaw(deleteQuery);
        }
        catch
        {
            // Silently ignore errors during early initialization
            // The main migration process will handle any remaining issues
        }
    }
}