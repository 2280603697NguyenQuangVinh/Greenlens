using GreenLens.Application.Modules.Quiz.Interfaces;

namespace GreenLens.Api.Services;

public sealed class QuizPoolRefillBackgroundService : BackgroundService
{
    private readonly LocalQuizPoolRefillQueue _queue;
    private readonly IQuizPoolRefillService _refillService;
    private readonly ILogger<QuizPoolRefillBackgroundService> _logger;

    public QuizPoolRefillBackgroundService(
        LocalQuizPoolRefillQueue queue,
        IQuizPoolRefillService refillService,
        ILogger<QuizPoolRefillBackgroundService> logger)
    {
        _queue = queue;
        _refillService = refillService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var request in _queue.ReadAllAsync(stoppingToken))
        {
            try
            {
                await _refillService.RefillAsync(request, stoppingToken);
            }
            catch (Exception exception) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogWarning(
                    exception,
                    "Quiz pool refill failed for child {ChildId}.",
                    request.ChildId);
            }
        }
    }
}
