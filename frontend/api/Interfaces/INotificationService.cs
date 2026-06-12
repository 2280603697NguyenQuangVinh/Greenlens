namespace GreenLens.Api.Interfaces;

public interface INotificationService
{
    Task ScheduleDailyReminderAsync();
}
