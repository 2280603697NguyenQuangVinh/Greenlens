using System.Threading.Channels;
using GreenLens.Application.Modules.Quiz.DTOs;
using GreenLens.Application.Modules.Quiz.Interfaces;

namespace GreenLens.Api.Services;

public sealed class LocalQuizPoolRefillQueue : IQuizPoolRefillQueue
{
    private readonly Channel<QuizPoolRefillRequest> _channel =
        Channel.CreateUnbounded<QuizPoolRefillRequest>();

    public Task EnqueueAsync(
        QuizPoolRefillRequest request,
        CancellationToken cancellationToken = default)
    {
        return _channel.Writer.WriteAsync(request, cancellationToken).AsTask();
    }

    public IAsyncEnumerable<QuizPoolRefillRequest> ReadAllAsync(
        CancellationToken cancellationToken = default)
    {
        return _channel.Reader.ReadAllAsync(cancellationToken);
    }
}
