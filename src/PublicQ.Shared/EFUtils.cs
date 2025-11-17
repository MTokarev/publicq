namespace PublicQ.Shared;

/// <summary>
/// Extensions for Entity Framework operations.
/// </summary>
public static class EFUtils
{
    /// <summary>
    /// Escapes special characters for SQL LIKE queries.
    /// </summary>
    /// <param name="str">String to escape</param>
    /// <returns>Escaped string</returns>
    public static string EscapeLike(this string str)
    {
        return str.Replace("[", "[[]").Replace("%", "[%]").Replace("_", "[_]");
    }
}