using GreenLens.Api.Interfaces;

namespace GreenLens.Api.Services.Mocks;

public class MockNotificationService : INotificationService
{
    public Task ScheduleDailyReminderAsync()
    {
        Console.WriteLine("[MockNotificationService] Daily reminder scheduled at 8:00 AM.");
        return Task.CompletedTask;
    }
}
