using GreenLens.Api.Interfaces;

namespace GreenLens.Api.Services.Cloud;

public class EventBridgeNotificationService : INotificationService
{
    public Task ScheduleDailyReminderAsync()
    {
        // TODO: Schedule daily 8AM reminder via Amazon EventBridge + SNS/Pinpoint.
        throw new NotImplementedException();
    }
}
