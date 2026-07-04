using System.Text.Json;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using GreenLens.Application.Modules.ChildProfiles.Services;
using GreenLens.Application.Modules.Quiz.DTOs;
using GreenLens.Application.Modules.Quiz.Interfaces;
using GreenLens.Infrastructure.AWS.DynamoDB;

namespace GreenLens.Api.Admin;

public sealed class AdminService(
    IAmazonDynamoDB dynamoDb,
    QuizDynamoDbOptions quizOptions,
    MiniGameDynamoDbOptions miniGameOptions,
    IQuizPoolRefillQueue quizPoolRefillQueue,
    IConfiguration configuration) : IAdminService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly string _childProfilesTableName = configuration["CHILD_PROFILES_TABLE_NAME"] ??
        configuration["DYNAMODB_CHILD_PROFILES_TABLE"] ??
        "GreenLens-ChildProfiles";

    public async Task<AdminOverviewResponse> GetOverviewAsync(CancellationToken cancellationToken = default)
    {
        var children = await ScanTableAsync(_childProfilesTableName, cancellationToken);
        var quizSessions = await ScanOptionalTableAsync(quizOptions.QuizSessionsTableName, cancellationToken);
        var quizPool = await ScanOptionalTableAsync(quizOptions.QuizPoolTableName, cancellationToken);
        var miniGameResults = await ScanOptionalTableAsync(miniGameOptions.ResultsTableName, cancellationToken);

        var activeChildren = children
            .Where(item => string.Equals(GetStatus(item), "Active", StringComparison.OrdinalIgnoreCase))
            .ToList();
        var recentDates = Enumerable.Range(0, 7)
            .Select(offset => DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(-offset)))
            .OrderBy(date => date)
            .ToList();

        var daily = recentDates
            .Select(date => new AdminDailyMetricDto(
                date.ToString("yyyy-MM-dd"),
                children.Count(item => DateMatches(GetDate(item, "createdAt"), date)),
                children.Sum(item => DateMatches(GetDate(item, "updatedAt"), date)
                    ? Math.Max(GetInt(item, "aiCameraScanCount"), 0)
                    : 0),
                quizSessions.Count(item => string.Equals(GetString(item, "status"), "Completed", StringComparison.OrdinalIgnoreCase) &&
                    DateMatches(GetDate(item, "updatedAt"), date)),
                miniGameResults.Count(item => DateMatches(GetDate(item, "createdAt"), date))))
            .ToList();

        var quizPoolItems = quizPool.Select(ToQuizPoolItem).ToList();
        var fallbackItems = await GetQuizFallbacksAsync(cancellationToken);

        return new AdminOverviewResponse(
            new AdminTotalsDto(
                children.Count,
                children.Sum(item => Math.Max(GetInt(item, "aiCameraScanCount"), 0)),
                quizSessions.Count,
                miniGameResults.Count,
                activeChildren.Count(item => string.Equals(GetString(item, "lastStreakDate"), DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"), StringComparison.Ordinal)),
                activeChildren.Count(item => GetInt(item, "streak") > 0)),
            daily,
            new AdminQuizPoolHealthDto(
                quizPoolItems.Count(item => string.Equals(item.Status, "Ready", StringComparison.OrdinalIgnoreCase)),
                quizPoolItems.Count(item => string.Equals(item.Status, "Claimed", StringComparison.OrdinalIgnoreCase)),
                quizPoolItems.Count(item => string.Equals(item.Status, "Failed", StringComparison.OrdinalIgnoreCase)),
                quizPoolItems.Count(item => string.Equals(item.Status, "Superseded", StringComparison.OrdinalIgnoreCase)),
                fallbackItems.Count(item => string.Equals(item.Status, "Active", StringComparison.OrdinalIgnoreCase)),
                quizPoolItems.OrderByDescending(item => item.CreatedAt).Select(item => (DateTime?)item.CreatedAt).FirstOrDefault()),
            new AdminStreakSummaryDto(
                activeChildren.Count(item => string.Equals(GetString(item, "lastStreakDate"), DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"), StringComparison.Ordinal)),
                activeChildren.Count(item => GetInt(item, "streak") >= 7),
                activeChildren.Count(item => GetInt(item, "streak") >= 30),
                children.Count(item => string.Equals(GetStatus(item), "Disabled", StringComparison.OrdinalIgnoreCase)),
                children.Count(item => string.Equals(GetStatus(item), "Archived", StringComparison.OrdinalIgnoreCase))),
            BuildBadgeCatalog(),
            ["AI camera classification history table is not implemented yet; admin list is currently empty."]);
    }

    public async Task<AdminChildListResponse> GetChildrenAsync(string? search, string? status, CancellationToken cancellationToken = default)
    {
        var items = await ScanTableAsync(_childProfilesTableName, cancellationToken);
        var query = items.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            query = query.Where(item =>
                Contains(GetString(item, "characterName"), keyword) ||
                Contains(GetString(item, "childId"), keyword));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(item => string.Equals(GetStatus(item), status.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        var mapped = query
            .Select(item => new AdminChildListItemDto(
                GetString(item, "childId") ?? string.Empty,
                GetString(item, "characterName") ?? "Unknown",
                GetInt(item, "level", 1),
                GetInt(item, "xp"),
                GetInt(item, "streak"),
                GetInt(item, "miniGameHighScore"),
                GetInt(item, "aiCameraScanCount"),
                GetStatus(item),
                GetDate(item, "createdAt"),
                GetDate(item, "updatedAt")))
            .OrderByDescending(item => item.UpdatedAt)
            .ToList();

        return new AdminChildListResponse(mapped, mapped.Count);
    }

    public async Task<AdminChildDetailDto> GetChildAsync(string childId, CancellationToken cancellationToken = default)
    {
        var item = await GetRequiredItemAsync(_childProfilesTableName, "childId", childId, cancellationToken);
        var quizSessions = await ScanOptionalTableAsync(quizOptions.QuizSessionsTableName, cancellationToken);
        var gameResults = await ScanOptionalTableAsync(miniGameOptions.ResultsTableName, cancellationToken);

        var childQuizSessions = quizSessions
            .Where(session => string.Equals(GetString(session, "childId"), childId, StringComparison.Ordinal))
            .OrderByDescending(session => GetDate(session, "updatedAt"))
            .Take(10)
            .Select(session => new AdminQuizSessionListItemDto(
                GetString(session, "sessionId") ?? string.Empty,
                GetString(session, "childId") ?? string.Empty,
                GetString(session, "wasteType") ?? "trash",
                GetInt(session, "targetAge", 8),
                GetString(session, "status") ?? "InProgress",
                GetInt(session, "correctAnswers"),
                GetInt(session, "xpAwarded"),
                GetDate(session, "createdAt"),
                GetDate(session, "updatedAt")))
            .ToList();

        var childGameResults = gameResults
            .Where(result => string.Equals(GetString(result, "childId"), childId, StringComparison.Ordinal))
            .OrderByDescending(result => GetDate(result, "createdAt"))
            .Take(10)
            .Select(result => new AdminMiniGameResultDto(
                GetString(result, "resultId") ?? string.Empty,
                GetString(result, "gameType") ?? "trash-sort",
                GetInt(result, "score"),
                GetInt(result, "correctCount"),
                GetInt(result, "wrongCount"),
                GetInt(result, "durationSeconds"),
                GetInt(result, "xpAwarded"),
                GetDate(result, "createdAt")))
            .ToList();

        return new AdminChildDetailDto(
            GetString(item, "childId") ?? string.Empty,
            GetString(item, "cognitoSub") ?? string.Empty,
            GetString(item, "characterName") ?? string.Empty,
            GetString(item, "gender") ?? string.Empty,
            GetString(item, "hair") ?? string.Empty,
            GetString(item, "eyes") ?? string.Empty,
            GetString(item, "outfit") ?? string.Empty,
            GetString(item, "avatarPreview") ?? string.Empty,
            GetInt(item, "xp"),
            GetInt(item, "level", 1),
            GetInt(item, "streak"),
            GetString(item, "lastStreakDate"),
            GetInt(item, "streakFreezeDaysUsed"),
            GetInt(item, "aiCameraScanCount"),
            GetInt(item, "miniGameHighScore"),
            GetStringList(item, "badges"),
            GetStringList(item, "rewards"),
            GetStatus(item),
            GetString(item, "updatedBy"),
            GetDate(item, "createdAt"),
            GetDate(item, "updatedAt"),
            childQuizSessions,
            childGameResults);
    }

    public Task ArchiveChildAsync(string childId, string adminSub, CancellationToken cancellationToken = default)
        => UpdateChildStatusAsync(childId, adminSub, "Archived", cancellationToken);

    public Task LockChildAsync(string childId, string adminSub, CancellationToken cancellationToken = default)
        => UpdateChildStatusAsync(childId, adminSub, "Disabled", cancellationToken);

    public Task UnlockChildAsync(string childId, string adminSub, CancellationToken cancellationToken = default)
        => UpdateChildStatusAsync(childId, adminSub, "Active", cancellationToken);

    public Task ResetChildStreakAsync(string childId, string adminSub, CancellationToken cancellationToken = default)
    {
        return dynamoDb.UpdateItemAsync(
            new UpdateItemRequest
            {
                TableName = _childProfilesTableName,
                Key = new Dictionary<string, AttributeValue> { ["childId"] = new() { S = childId } },
                UpdateExpression = "SET streak = :zero, streakFreezeDaysUsed = :zero, updatedBy = :updatedBy, updatedAt = :updatedAt REMOVE lastStreakDate",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":zero"] = new() { N = "0" },
                    [":updatedBy"] = new() { S = adminSub },
                    [":updatedAt"] = new() { S = DateTime.UtcNow.ToString("O") }
                }
            },
            cancellationToken);
    }

    public Task AdjustChildXpAsync(string childId, string adminSub, int xp, CancellationToken cancellationToken = default)
    {
        var safeXp = Math.Max(xp, 0);
        return dynamoDb.UpdateItemAsync(
            new UpdateItemRequest
            {
                TableName = _childProfilesTableName,
                Key = new Dictionary<string, AttributeValue> { ["childId"] = new() { S = childId } },
                UpdateExpression = "SET xp = :xp, #level = :level, updatedBy = :updatedBy, updatedAt = :updatedAt",
                ExpressionAttributeNames = new Dictionary<string, string> { ["#level"] = "level" },
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":xp"] = new() { N = safeXp.ToString() },
                    [":level"] = new() { N = ChildLeveling.GetLevel(safeXp).ToString() },
                    [":updatedBy"] = new() { S = adminSub },
                    [":updatedAt"] = new() { S = DateTime.UtcNow.ToString("O") }
                }
            },
            cancellationToken);
    }

    public async Task<IReadOnlyList<AdminQuizFallbackDto>> GetQuizFallbacksAsync(CancellationToken cancellationToken = default)
    {
        var items = await ScanOptionalTableAsync(quizOptions.QuizFallbackTableName, cancellationToken);
        return items
            .Select(item => new AdminQuizFallbackDto(
                GetString(item, "fallbackKey") ?? string.Empty,
                GetInt(item, "targetAge", 8),
                GetStatus(item),
                GetDate(item, "createdAt"),
                GetDate(item, "updatedAt"),
                GetString(item, "updatedBy"),
                DeserializeQuestions(GetString(item, "questionsJson"))))
            .OrderBy(item => item.FallbackKey)
            .ToList();
    }

    public async Task<AdminQuizFallbackDto> SaveQuizFallbackAsync(AdminSaveQuizFallbackRequest request, string adminSub, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.FallbackKey))
        {
            throw new ArgumentException("fallbackKey is required.");
        }

        if (request.Questions is null || request.Questions.Count < 3 || request.Questions.Any(question => question.Options.Count != 4))
        {
            throw new ArgumentException("Quiz fallback must contain at least 3 questions with exactly 4 options.");
        }

        var now = DateTime.UtcNow;
        var existing = await GetOptionalItemAsync(quizOptions.QuizFallbackTableName, "fallbackKey", request.FallbackKey.Trim(), cancellationToken);
        await dynamoDb.PutItemAsync(
            new PutItemRequest
            {
                TableName = quizOptions.QuizFallbackTableName,
                Item = new Dictionary<string, AttributeValue>
                {
                    ["fallbackKey"] = new() { S = request.FallbackKey.Trim() },
                    ["targetAge"] = new() { N = Math.Max(request.TargetAge, 1).ToString() },
                    ["questionsJson"] = new() { S = JsonSerializer.Serialize(request.Questions, JsonOptions) },
                    ["status"] = new() { S = "Active" },
                    ["updatedBy"] = new() { S = adminSub },
                    ["updatedAt"] = new() { S = now.ToString("O") },
                    ["createdAt"] = new() { S = (existing is null ? now : GetDate(existing, "createdAt")).ToString("O") }
                }
            },
            cancellationToken);

        return new AdminQuizFallbackDto(
            request.FallbackKey.Trim(),
            Math.Max(request.TargetAge, 1),
            "Active",
            existing is null ? now : GetDate(existing, "createdAt"),
            now,
            adminSub,
            request.Questions);
    }

    public Task ArchiveQuizFallbackAsync(string fallbackKey, string adminSub, CancellationToken cancellationToken = default)
        => UpdateStatusAsync(quizOptions.QuizFallbackTableName, "fallbackKey", fallbackKey, "Archived", adminSub, cancellationToken);

    public async Task<AdminQuizPoolListResponse> GetQuizPoolAsync(CancellationToken cancellationToken = default)
    {
        var items = await ScanOptionalTableAsync(quizOptions.QuizPoolTableName, cancellationToken);
        var poolItems = items
            .Where(item => string.Equals(GetString(item, "childId"), "global", StringComparison.Ordinal))
            .Select(ToQuizPoolItem)
            .OrderByDescending(item => item.CreatedAt)
            .ToList();

        return new AdminQuizPoolListResponse(
            poolItems,
            new AdminQuizPoolHealthDto(
                poolItems.Count(item => string.Equals(item.Status, "Ready", StringComparison.OrdinalIgnoreCase)),
                poolItems.Count(item => string.Equals(item.Status, "Claimed", StringComparison.OrdinalIgnoreCase)),
                poolItems.Count(item => string.Equals(item.Status, "Failed", StringComparison.OrdinalIgnoreCase)),
                poolItems.Count(item => string.Equals(item.Status, "Superseded", StringComparison.OrdinalIgnoreCase)),
                0,
                poolItems.Select(item => (DateTime?)item.CreatedAt).FirstOrDefault()));
    }

    public Task TriggerQuizPoolRefillAsync(string adminSub, CancellationToken cancellationToken = default)
    {
        return quizPoolRefillQueue.EnqueueAsync(
            new QuizPoolRefillRequest("global", adminSub),
            cancellationToken);
    }

    public Task<IReadOnlyList<AdminAiCameraRecordDto>> GetAiCameraClassificationsAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IReadOnlyList<AdminAiCameraRecordDto>>([]);
    }

    public async Task<AdminMiniGameItemsResponse> GetMiniGameItemsAsync(CancellationToken cancellationToken = default)
    {
        var items = await ScanOptionalTableAsync(miniGameOptions.ItemsTableName, cancellationToken);
        var childProfiles = await ScanTableAsync(_childProfilesTableName, cancellationToken);

        var mappedItems = items
            .Select(item => new AdminMiniGameItemDto(
                GetString(item, "itemId") ?? string.Empty,
                GetString(item, "name") ?? string.Empty,
                GetString(item, "category") ?? string.Empty,
                GetString(item, "binColor") ?? string.Empty,
                GetString(item, "iconKey") ?? string.Empty,
                GetString(item, "difficulty") ?? "easy",
                GetBool(item, "isActive", true),
                GetStatus(item),
                GetDate(item, "createdAt"),
                GetDate(item, "updatedAt"),
                GetString(item, "updatedBy")))
            .OrderBy(item => item.Name)
            .ToList();

        var leaderboard = childProfiles
            .Where(item => string.Equals(GetStatus(item), "Active", StringComparison.OrdinalIgnoreCase))
            .Select(item => new
            {
                ChildId = GetString(item, "childId") ?? string.Empty,
                Name = GetString(item, "characterName") ?? "Unknown",
                Score = GetInt(item, "miniGameHighScore")
            })
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Name)
            .Take(10)
            .Select((item, index) => new AdminLeaderboardEntryDto(index + 1, item.ChildId, item.Name, item.Score))
            .ToList();

        return new AdminMiniGameItemsResponse(mappedItems, leaderboard);
    }

    public async Task<AdminMiniGameItemDto> SaveMiniGameItemAsync(AdminSaveMiniGameItemRequest request, string adminSub, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.ItemId) ||
            string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Category) ||
            string.IsNullOrWhiteSpace(request.BinColor) ||
            string.IsNullOrWhiteSpace(request.IconKey))
        {
            throw new ArgumentException("itemId, name, category, binColor, and iconKey are required.");
        }

        var now = DateTime.UtcNow;
        var existing = await GetOptionalItemAsync(miniGameOptions.ItemsTableName, "itemId", request.ItemId.Trim(), cancellationToken);
        var status = request.IsActive ? "Active" : "Disabled";
        await dynamoDb.PutItemAsync(
            new PutItemRequest
            {
                TableName = miniGameOptions.ItemsTableName,
                Item = new Dictionary<string, AttributeValue>
                {
                    ["itemId"] = new() { S = request.ItemId.Trim() },
                    ["gameType"] = new() { S = "trash-sort" },
                    ["name"] = new() { S = request.Name.Trim() },
                    ["category"] = new() { S = request.Category.Trim() },
                    ["binColor"] = new() { S = request.BinColor.Trim() },
                    ["iconKey"] = new() { S = request.IconKey.Trim() },
                    ["difficulty"] = new() { S = string.IsNullOrWhiteSpace(request.Difficulty) ? "easy" : request.Difficulty.Trim() },
                    ["isActive"] = new() { BOOL = request.IsActive },
                    ["status"] = new() { S = status },
                    ["updatedBy"] = new() { S = adminSub },
                    ["updatedAt"] = new() { S = now.ToString("O") },
                    ["createdAt"] = new() { S = (existing is null ? now : GetDate(existing, "createdAt")).ToString("O") }
                }
            },
            cancellationToken);

        return new AdminMiniGameItemDto(
            request.ItemId.Trim(),
            request.Name.Trim(),
            request.Category.Trim(),
            request.BinColor.Trim(),
            request.IconKey.Trim(),
            string.IsNullOrWhiteSpace(request.Difficulty) ? "easy" : request.Difficulty.Trim(),
            request.IsActive,
            status,
            existing is null ? now : GetDate(existing, "createdAt"),
            now,
            adminSub);
    }

    public Task ArchiveMiniGameItemAsync(string itemId, string adminSub, CancellationToken cancellationToken = default)
    {
        return dynamoDb.UpdateItemAsync(
            new UpdateItemRequest
            {
                TableName = miniGameOptions.ItemsTableName,
                Key = new Dictionary<string, AttributeValue> { ["itemId"] = new() { S = itemId } },
                UpdateExpression = "SET #status = :status, isActive = :inactive, updatedBy = :updatedBy, updatedAt = :updatedAt",
                ExpressionAttributeNames = new Dictionary<string, string> { ["#status"] = "status" },
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":status"] = new() { S = "Archived" },
                    [":inactive"] = new() { BOOL = false },
                    [":updatedBy"] = new() { S = adminSub },
                    [":updatedAt"] = new() { S = DateTime.UtcNow.ToString("O") }
                }
            },
            cancellationToken);
    }

    private Task UpdateChildStatusAsync(string childId, string adminSub, string status, CancellationToken cancellationToken)
        => UpdateStatusAsync(_childProfilesTableName, "childId", childId, status, adminSub, cancellationToken);

    private Task UpdateStatusAsync(string tableName, string keyName, string keyValue, string status, string adminSub, CancellationToken cancellationToken)
    {
        return dynamoDb.UpdateItemAsync(
            new UpdateItemRequest
            {
                TableName = tableName,
                Key = new Dictionary<string, AttributeValue> { [keyName] = new() { S = keyValue } },
                UpdateExpression = "SET #status = :status, updatedBy = :updatedBy, updatedAt = :updatedAt",
                ExpressionAttributeNames = new Dictionary<string, string> { ["#status"] = "status" },
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":status"] = new() { S = status },
                    [":updatedBy"] = new() { S = adminSub },
                    [":updatedAt"] = new() { S = DateTime.UtcNow.ToString("O") }
                }
            },
            cancellationToken);
    }

    private async Task<List<Dictionary<string, AttributeValue>>> ScanTableAsync(string tableName, CancellationToken cancellationToken)
    {
        var items = new List<Dictionary<string, AttributeValue>>();
        Dictionary<string, AttributeValue>? lastEvaluatedKey = null;

        do
        {
            var response = await dynamoDb.ScanAsync(
                new ScanRequest
                {
                    TableName = tableName,
                    ExclusiveStartKey = lastEvaluatedKey
                },
                cancellationToken);

            items.AddRange(response.Items);
            lastEvaluatedKey = response.LastEvaluatedKey.Count > 0 ? response.LastEvaluatedKey : null;
        }
        while (lastEvaluatedKey is not null);

        return items;
    }

    private async Task<List<Dictionary<string, AttributeValue>>> ScanOptionalTableAsync(string tableName, CancellationToken cancellationToken)
    {
        try
        {
            return await ScanTableAsync(tableName, cancellationToken);
        }
        catch (ResourceNotFoundException)
        {
            return [];
        }
    }

    private async Task<Dictionary<string, AttributeValue>> GetRequiredItemAsync(string tableName, string keyName, string keyValue, CancellationToken cancellationToken)
    {
        var item = await GetOptionalItemAsync(tableName, keyName, keyValue, cancellationToken);
        if (item is null)
        {
            throw new InvalidOperationException("Record was not found.");
        }

        return item;
    }

    private async Task<Dictionary<string, AttributeValue>?> GetOptionalItemAsync(string tableName, string keyName, string keyValue, CancellationToken cancellationToken)
    {
        try
        {
            var response = await dynamoDb.GetItemAsync(
                new GetItemRequest
                {
                    TableName = tableName,
                    Key = new Dictionary<string, AttributeValue>
                    {
                        [keyName] = new() { S = keyValue }
                    }
                },
                cancellationToken);
            return response.Item.Count == 0 ? null : response.Item;
        }
        catch (ResourceNotFoundException)
        {
            return null;
        }
    }

    private static AdminQuizPoolItemDto ToQuizPoolItem(Dictionary<string, AttributeValue> item)
    {
        var questions = DeserializeQuestions(GetString(item, "questionsJson"));
        return new AdminQuizPoolItemDto(
            GetString(item, "quizSetId") ?? string.Empty,
            GetString(item, "topic") ?? "trash",
            GetInt(item, "targetAge", 8),
            GetString(item, "status") ?? "Ready",
            questions.Count,
            GetDate(item, "createdAt"),
            GetOptionalDate(item, "claimedAt"),
            GetOptionalDate(item, "failedAt"),
            GetUnixDate(item, "expiresAt"));
    }

    private static IReadOnlyList<QuizQuestionDto> DeserializeQuestions(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        return JsonSerializer.Deserialize<List<QuizQuestionDto>>(json, JsonOptions) ?? [];
    }

    private static IReadOnlyList<AdminBadgeCatalogDto> BuildBadgeCatalog()
    {
        return
        [
            new("first_scan", "First Scan", "Chup va phan loai rac thanh cong lan dau tien.", true),
            new("streak_7_days", "Streak 7 ngày", "Hoan thanh hoat dong moi ngay trong 7 ngay lien tiep.", true),
            new("streak_30_days", "Streak 30 ngày", "Hoan thanh hoat dong moi ngay trong 30 ngay lien tiep.", true),
            new("quiz_genius", "Thiên tài quiz", "Tra loi dung tat ca cau hoi trong mot lan quiz.", true),
            new("trash_sort_master", "Rác Kỳ Thủ", "Dat diem cao trong mini game keo tha rac.", true),
            new("mini_game_champion", "Vô địch mini game", "Dung dau bang xep hang tong hop giua quiz va mini game.", true),
            new("environment_hero", "Anh hùng môi trường", "Kien tri phan loai that nhieu vat dung.", true)
        ];
    }

    private static bool Contains(string? value, string keyword)
        => !string.IsNullOrWhiteSpace(value) && value.Contains(keyword, StringComparison.OrdinalIgnoreCase);

    private static string GetStatus(Dictionary<string, AttributeValue> item)
        => GetString(item, "status") ?? "Active";

    private static string? GetString(Dictionary<string, AttributeValue> item, string name)
        => item.TryGetValue(name, out var value) && !string.IsNullOrWhiteSpace(value.S) ? value.S : null;

    private static int GetInt(Dictionary<string, AttributeValue> item, string name, int fallback = 0)
        => item.TryGetValue(name, out var value) && int.TryParse(value.N ?? value.S, out var parsed) ? parsed : fallback;

    private static bool GetBool(Dictionary<string, AttributeValue> item, string name, bool fallback = false)
        => item.TryGetValue(name, out var value) ? value.BOOL : fallback;

    private static DateTime GetDate(Dictionary<string, AttributeValue> item, string name)
        => item.TryGetValue(name, out var value) && DateTime.TryParse(value.S, out var parsed) ? parsed : DateTime.UtcNow;

    private static DateTime? GetOptionalDate(Dictionary<string, AttributeValue> item, string name)
        => item.TryGetValue(name, out var value) && DateTime.TryParse(value.S, out var parsed) ? parsed : null;

    private static DateTime GetUnixDate(Dictionary<string, AttributeValue> item, string name)
        => item.TryGetValue(name, out var value) && long.TryParse(value.N ?? value.S, out var seconds)
            ? DateTimeOffset.FromUnixTimeSeconds(seconds).UtcDateTime
            : DateTime.UtcNow;

    private static IReadOnlyList<string> GetStringList(Dictionary<string, AttributeValue> item, string name)
    {
        if (!item.TryGetValue(name, out var value))
        {
            return [];
        }

        if (value.SS is { Count: > 0 })
        {
            return value.SS;
        }

        return value.L?.Select(entry => entry.S).Where(entry => !string.IsNullOrWhiteSpace(entry)).Select(entry => entry!).ToList() ?? [];
    }

    private static bool DateMatches(DateTime dateTime, DateOnly date)
        => DateOnly.FromDateTime(dateTime.ToUniversalTime()) == date;
}
