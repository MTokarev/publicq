namespace PublicQ.Shared;

/// <summary>
/// Service for generating unique exam taker IDs.
/// </summary>
public static class ExamTakerIdGenerator
{
    private const string Alphanumeric = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static readonly Random Random = new Random();

    /// <summary>
    /// Generates a new unique exam taker ID in the format "XXXX-XXXX", where X is an alphanumeric character (in UpperCase).
    /// </summary>
    public static string Generate()
    {
        var chars = Enumerable.Range(0, 8)
            .Select(_ => Alphanumeric[Random.Next(Alphanumeric.Length)])
            .ToArray();
        
        return $"{new string(chars, 0, 4)}-{new string(chars, 4, 4)}";
    }
}
    