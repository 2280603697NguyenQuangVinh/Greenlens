using GreenLens.Application.Modules.ChildProfiles.Interfaces;
using GreenLens.Application.Modules.MiniGames.DTOs;
using GreenLens.Application.Modules.MiniGames.Interfaces;

namespace GreenLens.Application.Modules.MiniGames.Services;

public sealed class MiniGameService : IMiniGameService
{
    private const string TrashSortGameType = "trash_sort";
    private const int CorrectScore = 10;
    private const int WrongPenalty = 5;
    private const int HighScoreThreshold = 80;
    private const int HighScoreXp = 20;
    private const int CompletionXp = 10;
    private const int MaxDurationSeconds = 60;

    private readonly IMiniGameRepository _miniGameRepository;
    private readonly IChildProgressService _childProgressService;
    private readonly string _assetBaseUrl;

    public MiniGameService(
        IMiniGameRepository miniGameRepository,
        IChildProgressService childProgressService,
        string assetBaseUrl = "")
    {
        _miniGameRepository = miniGameRepository;
        _childProgressService = childProgressService;
        _assetBaseUrl = assetBaseUrl.TrimEnd('/');
    }

    public async Task<TrashSortItemsResponse> GetTrashSortItemsAsync(
        string cognitoSub,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(cognitoSub))
        {
            throw new UnauthorizedAccessException("Bearer token is required.");
        }

        var items = await _miniGameRepository.GetActiveItemsAsync(
            TrashSortGameType,
            cancellationToken);

        return new TrashSortItemsResponse(
            items
                .Select(item => new TrashSortItemDto(
                    item.ItemId,
                    item.Name,
                    item.Category,
                    item.BinColor,
                    BuildIconUrl(item.IconKey),
                    item.Difficulty))
                .ToList(),
            GetTrashSortBins());
    }

    public async Task<SubmitTrashSortResultResponse> SubmitTrashSortResultAsync(
        SubmitTrashSortResultRequest request,
        string cognitoSub,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(cognitoSub))
        {
            throw new UnauthorizedAccessException("Bearer token is required.");
        }

        if (string.IsNullOrWhiteSpace(request.ChildId))
        {
            throw new ArgumentException("childId is required.", nameof(request));
        }

        if (request.CorrectCount < 0)
        {
            throw new ArgumentException("correctCount cannot be negative.", nameof(request));
        }

        if (request.WrongCount < 0)
        {
            throw new ArgumentException("wrongCount cannot be negative.", nameof(request));
        }

        if (request.DurationSeconds is <= 0 or > MaxDurationSeconds)
        {
            throw new ArgumentException("durationSeconds must be between 1 and 60.", nameof(request));
        }

        var childId = request.ChildId.Trim();
        var score = Math.Max(
            request.CorrectCount * CorrectScore - request.WrongCount * WrongPenalty,
            0);
        var xpAwarded = score > HighScoreThreshold ? HighScoreXp : CompletionXp;
        var previousBest = await _miniGameRepository.GetBestScoreAsync(
            childId,
            TrashSortGameType,
            cancellationToken);
        var isPersonalBest = score > previousBest;
        var now = DateTime.UtcNow;
        var result = new MiniGameResultDto(
            $"minigame_{Guid.NewGuid():N}",
            childId,
            cognitoSub.Trim(),
            TrashSortGameType,
            score,
            request.CorrectCount,
            request.WrongCount,
            request.DurationSeconds,
            xpAwarded,
            request.CompletedFromDailyActivity,
            now);

        await _miniGameRepository.SaveResultAsync(result, cancellationToken);
        await _childProgressService.AwardMiniGameAsync(
            childId,
            cognitoSub.Trim(),
            score,
            xpAwarded,
            cancellationToken);

        var unlockedBadges = score > HighScoreThreshold
            ? new[] { "Rác Kỳ Thủ" }
            : [];

        return new SubmitTrashSortResultResponse(
            result.ResultId,
            childId,
            TrashSortGameType,
            score,
            request.CorrectCount,
            request.WrongCount,
            request.DurationSeconds,
            xpAwarded,
            isPersonalBest,
            unlockedBadges,
            false,
            now);
    }

    private string BuildIconUrl(string iconKey)
    {
        if (string.IsNullOrWhiteSpace(_assetBaseUrl))
        {
            return iconKey;
        }

        return $"{_assetBaseUrl}/{iconKey.TrimStart('/')}";
    }

    private static IReadOnlyList<TrashSortBinDto> GetTrashSortBins()
    {
        return
        [
            new("Recyclable", "Green", "Tái chế"),
            new("Organic", "Brown", "Hữu cơ"),
            new("Hazardous", "Red", "Nguy hại")
        ];
    }
}
