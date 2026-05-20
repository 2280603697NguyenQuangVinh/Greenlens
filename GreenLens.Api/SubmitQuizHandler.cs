using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.Core;
using GreenLens.Application;
using GreenLens.Infrastructure;

namespace GreenLens.Api;

public class SubmitQuizHandler
{
	private readonly IAmazonDynamoDB _dynamoDb;
	private readonly NotificationService _notificationService;
	private readonly string _tableName;

	public SubmitQuizHandler()
		: this(
			new AmazonDynamoDBClient(),
			new NotificationService(),
			Environment.GetEnvironmentVariable("USER_PROGRESS_TABLE") ?? "UserProgress")
	{
	}

	public SubmitQuizHandler(IAmazonDynamoDB dynamoDb, NotificationService notificationService, string tableName)
	{
		_dynamoDb = dynamoDb ?? throw new ArgumentNullException(nameof(dynamoDb));
		_notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
		_tableName = !string.IsNullOrWhiteSpace(tableName)
			? tableName
			: throw new ArgumentException("USER_PROGRESS_TABLE is required.", nameof(tableName));
	}

	public async Task<SubmitQuizResponse> FunctionHandler(SubmitQuizDto dto, ILambdaContext context)
	{
		try
		{
			if (dto is null)
			{
				throw new ArgumentNullException(nameof(dto));
			}

			var isCorrect = true;
			if (!isCorrect)
			{
				return new SubmitQuizResponse
				{
					Success = false,
					Message = "Sai dap an.",
					Xp = 0,
					Streak = 0
				};
			}

			var updateResponse = await _dynamoDb.UpdateItemAsync(new UpdateItemRequest
			{
				TableName = _tableName,
				Key = new Dictionary<string, AttributeValue>
				{
					["userId"] = new AttributeValue { S = dto.UserId }
				},
				UpdateExpression = "ADD Xp :xp, Streak :streak",
				ExpressionAttributeValues = new Dictionary<string, AttributeValue>
				{
					[":xp"] = new AttributeValue { N = "10" },
					[":streak"] = new AttributeValue { N = "1" }
				},
				ReturnValues = ReturnValue.UPDATED_NEW
			});

			var xp = ParseInt(updateResponse.Attributes, "Xp");
			var streak = ParseInt(updateResponse.Attributes, "Streak");

			await _notificationService.PublishStreakNotificationAsync(dto.UserId, streak);

			return new SubmitQuizResponse
			{
				Success = true,
				Message = "Nop cau tra loi thanh cong.",
				Xp = xp,
				Streak = streak
			};
		}
		catch (Exception ex)
		{
			context.Logger.LogLine($"SubmitQuizHandler error: {ex}");

			return new SubmitQuizResponse
			{
				Success = false,
				Message = "Da xay ra loi khi xu ly bai quiz.",
				Xp = 0,
				Streak = 0
			};
		}
	}

	private static int ParseInt(IReadOnlyDictionary<string, AttributeValue> attributes, string key)
	{
		if (attributes.TryGetValue(key, out var value) &&
			value.N is not null &&
			int.TryParse(value.N, NumberStyles.Integer, CultureInfo.InvariantCulture, out var result))
		{
			return result;
		}

		return 0;
	}

	public sealed class SubmitQuizResponse
	{
		public bool Success { get; set; }

		public string Message { get; set; } = string.Empty;

		public int Xp { get; set; }

		public int Streak { get; set; }
	}
}
