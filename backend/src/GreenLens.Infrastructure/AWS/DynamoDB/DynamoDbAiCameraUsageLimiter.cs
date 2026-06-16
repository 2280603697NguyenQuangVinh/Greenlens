using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using GreenLens.Application.Modules.AiCamera.DTOs;
using GreenLens.Application.Modules.AiCamera.Interfaces;

namespace GreenLens.Infrastructure.AWS.DynamoDB;

public sealed class DynamoDbAiCameraUsageLimiter : IAiCameraUsageLimiter
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly AiCameraUsageLimiterOptions _options;

    public DynamoDbAiCameraUsageLimiter(
        IAmazonDynamoDB dynamoDb,
        AiCameraUsageLimiterOptions options)
    {
        _dynamoDb = dynamoDb;
        _options = options;
    }

    public async Task<AiCameraUsageQuotaResult> CheckAndConsumeAsync(
        string cognitoSub,
        string childId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.TableName))
        {
            return new AiCameraUsageQuotaResult(false, "AI Camera usage limiter is not configured.");
        }

        if (string.IsNullOrWhiteSpace(cognitoSub))
        {
            return new AiCameraUsageQuotaResult(false, "Bearer token subject is required for AI Camera usage limits.");
        }

        var now = DateTimeOffset.UtcNow;
        var usageSubject = $"{cognitoSub.Trim()}#{childId.Trim()}";

        var minuteResult = await TryConsumeAsync(
            $"minute#{usageSubject}#{now:yyyyMMddHHmm}",
            _options.PerMinuteLimit,
            now.AddMinutes(2),
            cancellationToken);

        if (!minuteResult)
        {
            return new AiCameraUsageQuotaResult(
                false,
                $"AI Camera minute limit reached. Please wait before trying again.");
        }

        var dayResult = await TryConsumeAsync(
            $"day#{usageSubject}#{now:yyyyMMdd}",
            _options.PerDayLimit,
            now.AddDays(2),
            cancellationToken);

        if (!dayResult)
        {
            return new AiCameraUsageQuotaResult(
                false,
                "AI Camera daily limit reached. Please try again tomorrow.");
        }

        return new AiCameraUsageQuotaResult(true);
    }

    private async Task<bool> TryConsumeAsync(
        string quotaKey,
        int limit,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken)
    {
        try
        {
            await _dynamoDb.UpdateItemAsync(
                new UpdateItemRequest
                {
                    TableName = _options.TableName,
                    Key = new Dictionary<string, AttributeValue>
                    {
                        ["quotaKey"] = new() { S = quotaKey }
                    },
                    UpdateExpression = "SET expiresAt = :expiresAt ADD requestCount :one",
                    ConditionExpression = "attribute_not_exists(requestCount) OR requestCount < :limit",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":one"] = new() { N = "1" },
                        [":limit"] = new() { N = limit.ToString() },
                        [":expiresAt"] = new() { N = expiresAt.ToUnixTimeSeconds().ToString() }
                    }
                },
                cancellationToken);

            return true;
        }
        catch (ConditionalCheckFailedException)
        {
            return false;
        }
    }
}
