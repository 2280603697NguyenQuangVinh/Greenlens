using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.Core;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace GreenLens.Api;

public class PostConfirmationHandler
{
	private readonly IAmazonDynamoDB _dynamo;
	private readonly string _tableName;

	public PostConfirmationHandler()
	{
		_dynamo = new AmazonDynamoDBClient();
		_tableName = Environment.GetEnvironmentVariable("USER_PROGRESS_TABLE") ?? "UserProgress";
	}

	public async Task<JsonElement> FunctionHandler(JsonElement evt, ILambdaContext context)
	{
		string? userId = null;

		try
		{
			if (evt.TryGetProperty("request", out var request) &&
				request.TryGetProperty("userAttributes", out var attrs) &&
				attrs.TryGetProperty("sub", out var sub))
			{
				userId = sub.GetString();
			}

			if (string.IsNullOrEmpty(userId) && evt.TryGetProperty("userName", out var userName))
			{
				userId = userName.GetString();
			}

			if (string.IsNullOrEmpty(userId))
			{
				context.Logger.LogLine("PostConfirmation: userId not found in event.");
				return evt;
			}

			var put = new PutItemRequest
			{
				TableName = _tableName,
				Item = new Dictionary<string, AttributeValue>
				{
					["userId"] = new AttributeValue { S = userId },
					["Xp"] = new AttributeValue { N = "0" },
					["Streak"] = new AttributeValue { N = "0" }
				},
				ConditionExpression = "attribute_not_exists(userId)"
			};

			await _dynamo.PutItemAsync(put);
			context.Logger.LogLine($"Inserted user progress for {userId} into {_tableName}");
		}
		catch (Exception ex)
		{
			context.Logger.LogLine($"PostConfirmation handler error: {ex}");
		}

		return evt;
	}
}
