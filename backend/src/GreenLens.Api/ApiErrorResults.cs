using Amazon.DynamoDBv2.Model;
using Amazon.Runtime;

namespace GreenLens.Api;

public static class ApiErrorResults
{
    public static IResult FromException(
        Exception exception,
        IWebHostEnvironment environment,
        ILogger logger,
        string operation)
    {
        switch (exception)
        {
            case ArgumentException argumentException:
                return Results.BadRequest(new { message = argumentException.Message });
            case KeyNotFoundException keyNotFoundException:
                return Results.NotFound(new { message = keyNotFoundException.Message });
            case ConditionalCheckFailedException:
                return Results.Conflict(new { message = "The requested resource already exists or was modified." });
            case ResourceNotFoundException:
                logger.LogError(exception, "{Operation} failed because a DynamoDB table was not found.", operation);
                return Results.Problem(
                    "DynamoDB table not found. Verify AWS_REGION and table names.",
                    statusCode: StatusCodes.Status502BadGateway);
            case AmazonServiceException amazonException:
                logger.LogError(amazonException, "{Operation} failed with an AWS service error.", operation);
                var awsMessage = environment.IsDevelopment()
                    ? amazonException.Message
                    : "An AWS service error occurred.";
                return Results.Problem(awsMessage, statusCode: StatusCodes.Status502BadGateway);
            default:
                logger.LogError(exception, "{Operation} failed with an unexpected error.", operation);
                var message = environment.IsDevelopment()
                    ? exception.Message
                    : "An unexpected error occurred.";
                return Results.Problem(message, statusCode: StatusCodes.Status500InternalServerError);
        }
    }
}
