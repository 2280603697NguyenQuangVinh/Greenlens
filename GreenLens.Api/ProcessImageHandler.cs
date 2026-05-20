using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.Core;
using Amazon.Lambda.S3Events;
using Amazon.Rekognition;
using Amazon.Rekognition.Model;

namespace GreenLens.Api;

public class ProcessImageHandler
{
	private static readonly JsonSerializerOptions JsonOptions = new()
	{
		PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
		DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
	};

	private static readonly HashSet<string> AllowedKeywords = new(StringComparer.OrdinalIgnoreCase)
	{
		"plant",
		"tree",
		"recycling",
		"bottle",
		"paper"
	};

	private readonly IAmazonRekognition _rekognition;
	private readonly IAmazonBedrockRuntime _bedrock;
	private readonly IAmazonDynamoDB _dynamoDb;
	private readonly string _questionTableName;
	private readonly string _bedrockModelId;

	public ProcessImageHandler()
		: this(
			new AmazonRekognitionClient(),
			new AmazonBedrockRuntimeClient(),
			new AmazonDynamoDBClient(),
			Environment.GetEnvironmentVariable("QUESTION_TABLE") ?? "QuizQuestions",
			Environment.GetEnvironmentVariable("BEDROCK_MODEL_ID") ?? "anthropic.claude-3-sonnet-20240229-v1:0")
	{
	}

	public ProcessImageHandler(
		IAmazonRekognition rekognition,
		IAmazonBedrockRuntime bedrock,
		IAmazonDynamoDB dynamoDb,
		string questionTableName,
		string bedrockModelId)
	{
		_rekognition = rekognition ?? throw new ArgumentNullException(nameof(rekognition));
		_bedrock = bedrock ?? throw new ArgumentNullException(nameof(bedrock));
		_dynamoDb = dynamoDb ?? throw new ArgumentNullException(nameof(dynamoDb));
		_questionTableName = !string.IsNullOrWhiteSpace(questionTableName)
			? questionTableName
			: throw new ArgumentException("Question table name is required.", nameof(questionTableName));
		_bedrockModelId = !string.IsNullOrWhiteSpace(bedrockModelId)
			? bedrockModelId
			: throw new ArgumentException("Bedrock model id is required.", nameof(bedrockModelId));
	}

	public async Task FunctionHandler(S3Event evt, ILambdaContext context)
	{
		if (evt?.Records is null || evt.Records.Count == 0)
		{
			context.Logger.LogLine("ProcessImage: received empty S3 event.");
			return;
		}

		foreach (var record in evt.Records)
		{
			try
			{
				var bucketName = record.S3.Bucket.Name;
				var objectKey = Uri.UnescapeDataString(record.S3.Object.Key.Replace('+', ' '));

				context.Logger.LogLine($"ProcessImage: bucket={bucketName}, key={objectKey}");

				var detectedLabels = await DetectLabelsAsync(bucketName, objectKey);
				var matchedKeywords = detectedLabels
					.Select(label => label.Name)
					.Where(name => !string.IsNullOrWhiteSpace(name))
					.Where(name => AllowedKeywords.Contains(name!))
					.Distinct(StringComparer.OrdinalIgnoreCase)
					.ToArray();

				if (matchedKeywords.Length == 0)
				{
					context.Logger.LogLine("ProcessImage: no allowed keywords detected; skipping generation.");
					continue;
				}

				var question = await GenerateQuestionAsync(matchedKeywords, context);
				await SaveQuestionAsync(bucketName, objectKey, detectedLabels, matchedKeywords, question);

				context.Logger.LogLine($"ProcessImage: saved question for {objectKey}");
			}
			catch (Exception ex)
			{
				context.Logger.LogLine($"ProcessImage error: {ex}");
			}
		}
	}

	private async Task<List<Label>> DetectLabelsAsync(string bucketName, string objectKey)
	{
		var response = await _rekognition.DetectLabelsAsync(new DetectLabelsRequest
		{
			Image = new Image
			{
				S3Object = new S3Object
				{
					Bucket = bucketName,
					Name = objectKey
				}
			},
			MaxLabels = 10,
			MinConfidence = 70
		});

		return response.Labels ?? new List<Label>();
	}

	private async Task<QuizQuestion> GenerateQuestionAsync(IEnumerable<string> labels, ILambdaContext context)
	{
		var labelText = string.Join(", ", labels);
		var prompt = $$"""
You are creating a short, playful environmental multiple-choice quiz for children in Vietnamese.
Base the quiz on these detected labels: {{labelText}}.

Return ONLY valid JSON with this shape:
{
  "question": "string",
  "answers": ["string", "string", "string"],
  "correctAnswer": "string"
}

Rules:
- The question must be fun and educational about protecting nature.
- Exactly 3 answers.
- correctAnswer must exactly match one of the answers.
- No markdown, no explanation, no extra text.
""";

		var requestBody = new
		{
			anthropic_version = "bedrock-2023-05-31",
			max_tokens = 400,
			temperature = 0.7,
			messages = new[]
			{
				new
				{
					role = "user",
					content = new[]
					{
						new { type = "text", text = prompt }
					}
				}
			}
		};

		var request = new InvokeModelRequest
		{
			ModelId = _bedrockModelId,
			ContentType = "application/json",
			Accept = "application/json",
			Body = new MemoryStream(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(requestBody, JsonOptions)))
		};

		var response = await _bedrock.InvokeModelAsync(request);
		using var reader = new StreamReader(response.Body);
		var responseText = await reader.ReadToEndAsync();

		using var document = JsonDocument.Parse(responseText);
		var contentArray = document.RootElement.GetProperty("content");
		var generatedText = contentArray
			.EnumerateArray()
			.Select(item => item.GetProperty("text").GetString())
			.FirstOrDefault(text => !string.IsNullOrWhiteSpace(text));

		if (string.IsNullOrWhiteSpace(generatedText))
		{
			throw new InvalidOperationException("Bedrock returned an empty message.");
		}

		var quizQuestion = JsonSerializer.Deserialize<QuizQuestion>(generatedText, JsonOptions);
		if (quizQuestion is null)
		{
			throw new InvalidOperationException("Unable to parse generated quiz question.");
		}

		if (quizQuestion.Answers.Count != 3)
		{
			throw new InvalidOperationException("Generated question must contain exactly 3 answers.");
		}

		if (!quizQuestion.Answers.Any(answer => string.Equals(answer, quizQuestion.CorrectAnswer, StringComparison.OrdinalIgnoreCase)))
		{
			throw new InvalidOperationException("Generated correctAnswer must match one of the answers.");
		}

		context.Logger.LogLine($"ProcessImage: generated question '{quizQuestion.Question}'");
		return quizQuestion;
	}

	private async Task SaveQuestionAsync(
		string bucketName,
		string objectKey,
		IReadOnlyCollection<Label> detectedLabels,
		IReadOnlyCollection<string> matchedKeywords,
		QuizQuestion question)
	{
		var item = new Dictionary<string, AttributeValue>
		{
			["questionId"] = new AttributeValue { S = Guid.NewGuid().ToString("N") },
			["bucketName"] = new AttributeValue { S = bucketName },
			["objectKey"] = new AttributeValue { S = objectKey },
			["question"] = new AttributeValue { S = question.Question },
			["correctAnswer"] = new AttributeValue { S = question.CorrectAnswer },
			["answers"] = new AttributeValue
			{
				L = question.Answers.Select(answer => new AttributeValue { S = answer }).ToList()
			},
			["matchedKeywords"] = new AttributeValue
			{
				SS = matchedKeywords.ToList()
			},
			["labels"] = new AttributeValue
			{
				L = detectedLabels
					.Select(label => new AttributeValue
					{
						M = new Dictionary<string, AttributeValue>
						{
							["name"] = new AttributeValue { S = label.Name },
							["confidence"] = new AttributeValue { N = label.Confidence?.ToString("0.##") ?? "0" }
						}
					})
					.ToList()
			},
			["createdAt"] = new AttributeValue { S = DateTime.UtcNow.ToString("O") }
		};

		await _dynamoDb.PutItemAsync(new PutItemRequest
		{
			TableName = _questionTableName,
			Item = item
		});
	}

	private sealed class QuizQuestion
	{
		[JsonPropertyName("question")]
		public string Question { get; set; } = string.Empty;

		[JsonPropertyName("answers")]
		public List<string> Answers { get; set; } = new();

		[JsonPropertyName("correctAnswer")]
		public string CorrectAnswer { get; set; } = string.Empty;
	}
}
