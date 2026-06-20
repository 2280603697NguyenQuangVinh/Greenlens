using GreenLens.Infrastructure.Persistence;

namespace GreenLens.Infrastructure.Configurations;

public sealed class DynamoDbOptions
{
    public string ChildProfilesTableName { get; set; } = TableNames.ChildProfiles;

    public string ActivityHistoryTableName { get; set; } = TableNames.ActivityHistory;

    public string DailyActivitiesTableName { get; set; } = TableNames.DailyActivities;
}
