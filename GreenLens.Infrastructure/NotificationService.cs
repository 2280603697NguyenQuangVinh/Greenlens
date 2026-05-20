namespace GreenLens.Infrastructure;

using System;
using System.Text;
using System.Threading.Tasks;
using Amazon.SimpleNotificationService;
using Amazon.SimpleNotificationService.Model;

public class NotificationService
{
	private readonly IAmazonSimpleNotificationService _sns;
	private readonly string _topicArn;

	public NotificationService()
		: this(new AmazonSimpleNotificationServiceClient(), Environment.GetEnvironmentVariable("SNS_TOPIC_ARN"))
	{
	}

	public NotificationService(IAmazonSimpleNotificationService sns, string? topicArn)
	{
		_sns = sns ?? throw new ArgumentNullException(nameof(sns));
		_topicArn = !string.IsNullOrWhiteSpace(topicArn)
			? topicArn
			: throw new ArgumentException("SNS_TOPIC_ARN is required.", nameof(topicArn));
	}

	public async Task PublishStreakNotificationAsync(string userId, int streakCount)
	{
		try
		{
			var message = $"Chuc mung be {userId} da dat chuoi streak moi: {streakCount} ngay lien tiep!";

			await _sns.PublishAsync(new PublishRequest
			{
				TopicArn = _topicArn,
				Subject = "GreenLens Kids - Streak milestone",
				Message = message
			});
		}
		catch (Exception)
		{
			throw;
		}
	}
}
