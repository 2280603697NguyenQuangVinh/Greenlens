using System.Text.Json;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using GreenLens.Application.Modules.Quiz.DTOs;
using GreenLens.Application.Modules.Quiz.Interfaces;

namespace GreenLens.Infrastructure.AWS.Bedrock;

public sealed class BedrockQuizGenerator : IQuizGenerator
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly string[] BlacklistTerms =
    [
        "bạo lực",
        "chết",
        "máu",
        "ma túy",
        "rượu",
        "thuốc lá",
        "tự tử",
        "sex",
        "dao",
        "súng"
    ];

    private readonly IAmazonBedrockRuntime _bedrockRuntime;
    private readonly BedrockQuizOptions _options;

    public BedrockQuizGenerator(
        IAmazonBedrockRuntime bedrockRuntime,
        BedrockQuizOptions options)
    {
        _bedrockRuntime = bedrockRuntime;
        _options = options;
    }

    public async Task<IReadOnlyList<QuizQuestionDto>> GenerateAsync(
        string wasteType,
        int age,
        CancellationToken cancellationToken = default)
    {
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(_options.TimeoutSeconds));
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeout.Token);

        var response = await _bedrockRuntime.ConverseAsync(
            new ConverseRequest
            {
                ModelId = _options.ModelId,
                Messages =
                [
                    new Message
                    {
                        Role = ConversationRole.User,
                        Content = [new ContentBlock { Text = BuildPrompt(wasteType, age) }]
                    }
                ],
                InferenceConfig = new InferenceConfiguration
                {
                    MaxTokens = _options.MaxTokens,
                    Temperature = 0.8F,
                    TopP = 0.9F
                }
            },
            linked.Token);

        var text = NormalizeJsonText(ExtractResponseText(response));
        var questions = JsonSerializer.Deserialize<List<QuizQuestionDto>>(text, JsonOptions)
            ?? throw new InvalidOperationException("Bedrock returned empty quiz JSON.");

        if (questions.Count < 3 || ContainsUnsafeContent(questions))
        {
            throw new InvalidOperationException("Bedrock returned unsafe or incomplete quiz content.");
        }

        return questions.Take(3).ToList();
    }

    private static string BuildPrompt(string wasteType, int age)
    {
        return $$"""
Create exactly 3 different multiple-choice quiz questions in Vietnamese for a {{age}} year old child.
Topic: waste sorting and reuse for "{{wasteType}}".
Use friendly language for kids 6-12. Keep each question short.
Each question must have exactly 3 options, one correct answer copied exactly from options, and one short explanation.
Make the questions varied each time.
Avoid scary, adult, violent, medical, sexual, or unsafe content.
Return only valid compact JSON array:
[{"question":"...","options":["A","B","C"],"correct":"A","explanation":"..."}]
""";
    }

    private static bool ContainsUnsafeContent(IEnumerable<QuizQuestionDto> questions)
    {
        var content = string.Join(
            ' ',
            questions.SelectMany(question =>
                new[] { question.Question, question.Correct, question.Explanation }
                    .Concat(question.Options)));

        return BlacklistTerms.Any(term =>
            content.Contains(term, StringComparison.OrdinalIgnoreCase));
    }

    private static string ExtractResponseText(ConverseResponse response)
    {
        var text = response.Output?.Message?.Content?
            .FirstOrDefault(content => !string.IsNullOrWhiteSpace(content.Text))
            ?.Text;

        if (!string.IsNullOrWhiteSpace(text))
        {
            return text;
        }

        throw new InvalidOperationException("Bedrock response did not contain text content.");
    }

    private static string NormalizeJsonText(string text)
    {
        var trimmed = text.Trim();
        if (trimmed.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = trimmed[7..].Trim();
        }
        else if (trimmed.StartsWith("```", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = trimmed[3..].Trim();
        }

        if (trimmed.EndsWith("```", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = trimmed[..^3].Trim();
        }

        return trimmed;
    }
}
