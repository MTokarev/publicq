using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PublicQ.Infrastructure.Entities;

namespace PublicQ.Infrastructure.Persistence;

/// <summary>
/// Configuration for the table that stores app config that can be changed in the runtime.
/// </summary>
public class ConfigurationTableConfig : IEntityTypeConfiguration<ConfigurationEntity>
{
    public void Configure(EntityTypeBuilder<ConfigurationEntity> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Type)
            .IsRequired();

        builder.Property(c => c.DataJson)
            .IsRequired();
    }
}