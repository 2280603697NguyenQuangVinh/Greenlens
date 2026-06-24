namespace GreenLens.Application.Modules.ChildProfiles.Services;

public static class ChildStreakCalculator
{
    public const int MaxFreezeDays = 2;

    public static ChildStreakState Preview(
        int currentStreak,
        string? lastStreakDate,
        DateOnly today,
        int storedFreezeDaysUsed = 0)
    {
        var normalizedStreak = Math.Max(currentStreak, 0);
        var parsedLastDate = ParseDate(lastStreakDate);

        if (parsedLastDate is null || normalizedStreak == 0)
        {
            return new ChildStreakState(
                normalizedStreak,
                null,
                0,
                MaxFreezeDays,
                0,
                normalizedStreak == 0 ? "NotStarted" : "NeedsCheckIn");
        }

        var daysSinceLastActivity = today.DayNumber - parsedLastDate.Value.DayNumber;
        if (daysSinceLastActivity <= 0)
        {
            var freezeDaysUsed = Math.Clamp(storedFreezeDaysUsed, 0, MaxFreezeDays);

            return new ChildStreakState(
                normalizedStreak,
                parsedLastDate.Value.ToString("yyyy-MM-dd"),
                freezeDaysUsed,
                Math.Max(MaxFreezeDays - freezeDaysUsed, 0),
                freezeDaysUsed,
                "ActiveToday");
        }

        if (daysSinceLastActivity == 1)
        {
            return new ChildStreakState(
                normalizedStreak,
                parsedLastDate.Value.ToString("yyyy-MM-dd"),
                0,
                MaxFreezeDays,
                0,
                "Active");
        }

        var missedDays = daysSinceLastActivity - 1;
        if (missedDays <= MaxFreezeDays)
        {
            return new ChildStreakState(
                normalizedStreak,
                parsedLastDate.Value.ToString("yyyy-MM-dd"),
                missedDays,
                Math.Max(MaxFreezeDays - missedDays, 0),
                missedDays,
                "Frozen");
        }

        return new ChildStreakState(
            normalizedStreak,
            parsedLastDate.Value.ToString("yyyy-MM-dd"),
            0,
            0,
            0,
            "Expired");
    }

    public static ChildStreakState CheckIn(
        int currentStreak,
        string? lastStreakDate,
        DateOnly today)
    {
        var normalizedStreak = Math.Max(currentStreak, 0);
        var parsedLastDate = ParseDate(lastStreakDate);

        if (parsedLastDate is null || normalizedStreak == 0)
        {
            return new ChildStreakState(
                1,
                today.ToString("yyyy-MM-dd"),
                0,
                MaxFreezeDays,
                0,
                "Started");
        }

        var daysSinceLastActivity = today.DayNumber - parsedLastDate.Value.DayNumber;
        if (daysSinceLastActivity <= 0)
        {
            return new ChildStreakState(
                normalizedStreak,
                parsedLastDate.Value.ToString("yyyy-MM-dd"),
                0,
                MaxFreezeDays,
                0,
                "AlreadyCheckedIn");
        }

        if (daysSinceLastActivity == 1)
        {
            return new ChildStreakState(
                normalizedStreak + 1,
                today.ToString("yyyy-MM-dd"),
                0,
                MaxFreezeDays,
                0,
                "Continued");
        }

        var missedDays = daysSinceLastActivity - 1;
        if (missedDays <= MaxFreezeDays)
        {
            return new ChildStreakState(
                normalizedStreak + 1,
                today.ToString("yyyy-MM-dd"),
                missedDays,
                Math.Max(MaxFreezeDays - missedDays, 0),
                missedDays,
                "FreezeUsed");
        }

        return new ChildStreakState(
            1,
            today.ToString("yyyy-MM-dd"),
            0,
            MaxFreezeDays,
            0,
            "Reset");
    }

    public static DateOnly GetVietnamToday()
    {
        var utcNow = DateTimeOffset.UtcNow;

        try
        {
            var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
            return DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(utcNow, vietnamTimeZone).DateTime);
        }
        catch (TimeZoneNotFoundException)
        {
            return DateOnly.FromDateTime(utcNow.AddHours(7).DateTime);
        }
        catch (InvalidTimeZoneException)
        {
            return DateOnly.FromDateTime(utcNow.AddHours(7).DateTime);
        }
    }

    private static DateOnly? ParseDate(string? value)
    {
        return DateOnly.TryParse(value, out var parsed)
            ? parsed
            : null;
    }
}

public sealed record ChildStreakState(
    int CurrentStreak,
    string? LastStreakDate,
    int FreezeDaysUsed,
    int FreezeDaysRemaining,
    int MissedDaysCoveredByFreeze,
    string Status);
