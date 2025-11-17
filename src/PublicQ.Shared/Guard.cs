namespace PublicQ.Shared;

public static class Guard
{
    public static void AgainstNull<T>(T? value, string name) where T : class
    {
        if (value is null)
            throw new ArgumentNullException(name, $"Parameter '{name}' cannot be null.");
    }

    public static void AgainstNullOrWhiteSpace(string? value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException($"Parameter '{name}' cannot be null or empty.", name);
    }

    public static void AgainstNullOrWhiteSpace<T>(IEnumerable<T>? collection, string name)
    {
        if (collection is null || !collection.Any())
            throw new ArgumentException($"Collection '{name}' cannot be null or empty.", name);
    }

    public static void AgainstOutOfRange<T>(T value, T min, T max, string name) where T : IComparable<T>
    {
        if (value.CompareTo(min) < 0 || value.CompareTo(max) > 0)
            throw new ArgumentOutOfRangeException(name, $"Parameter '{name}' must be between {min} and {max}.");
    }
}