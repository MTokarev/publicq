// PublicQ.Shared.ArrayUtils
namespace PublicQ.Shared;

public static class ArrayUtils
{
    /// <summary>
    /// Returns true when numbers are strictly consecutive (e.g., 3,4,5 or 1,2,3).
    /// Empty/null => false.
    /// </summary>
    public static bool CheckIfNumbersAreInConsecutiveOrder(this IEnumerable<int> numbers)
    {
        if (numbers == null) return false;
        var list = numbers.OrderBy(n => n).ToList();
        if (list.Count == 0) return false;

        for (int i = 1; i < list.Count; i++)
            if (list[i] != list[i - 1] + 1)
                return false;

        return true;
    }

    /// <summary>
    /// Convenience: consecutive AND starting at 1.
    /// </summary>
    public static bool AreConsecutiveStartingAtOne(this IEnumerable<int> numbers)
    {
        if (numbers == null)
        {
            return false;
        }
        var list = numbers.ToList();
        return list.Count > 0
               && list.Min() == 1
               && list.CheckIfNumbersAreInConsecutiveOrder();
    }
}