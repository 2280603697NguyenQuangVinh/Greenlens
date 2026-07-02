using System.Text.Json;
using Amazon.Lambda;
using Amazon.Lambda.Model;
using GreenLens.Application.Modules.Quiz.DTOs;
using GreenLens.Application.Modules.Quiz.Interfaces;

namespace GreenLens.Api.Services;

public sealed class LambdaQuizPoolRefillQueue : IQuizPoolRefillQueue
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAmazonLambda _lambda;
    private readonly string _functionName;

    public LambdaQuizPoolRefillQueue(
        IAmazonLambda lambda,
        string functionName)
    {
        _lambda = lambda;
        _functionName = functionName;
    }

    public async Task EnqueueAsync(
        QuizPoolRefillRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_functionName))
        {
            return;
        }

        await _lambda.InvokeAsync(
            new InvokeRequest
            {
                FunctionName = _functionName,
                InvocationType = InvocationType.Event,
                Payload = JsonSerializer.Serialize(request, JsonOptions)
            },
            cancellationToken);
    }
}
