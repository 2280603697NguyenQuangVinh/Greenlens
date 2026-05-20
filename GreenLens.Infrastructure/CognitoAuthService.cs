namespace GreenLens.Infrastructure;

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Amazon.CognitoIdentityProvider;
using Amazon.CognitoIdentityProvider.Model;
using Microsoft.Extensions.Configuration;

public class CognitoAuthService
{
	private readonly IAmazonCognitoIdentityProvider _cognito;
	private readonly string _clientId;
	private readonly string _userPoolId;

	public CognitoAuthService(IAmazonCognitoIdentityProvider cognito, IConfiguration configuration)
	{
		_cognito = cognito ?? throw new ArgumentNullException(nameof(cognito));
		_clientId = configuration["Cognito:ClientId"] ?? throw new ArgumentNullException("Cognito:ClientId");
		_userPoolId = configuration["Cognito:UserPoolId"] ?? throw new ArgumentNullException("Cognito:UserPoolId");
	}

	public async Task<SignUpResponse> SignUpAsync(string username, string password, IDictionary<string, string>? attributes = null)
	{
		var request = new SignUpRequest
		{
			ClientId = _clientId,
			Username = username,
			Password = password
		};

		if (attributes is not null)
		{
			foreach (var kv in attributes)
			{
				request.UserAttributes.Add(new AttributeType { Name = kv.Key, Value = kv.Value });
			}
		}

		return await _cognito.SignUpAsync(request);
	}

	public async Task<InitiateAuthResponse> SignInAsync(string username, string password)
	{
		var authParams = new Dictionary<string, string>
		{
			["USERNAME"] = username,
			["PASSWORD"] = password
		};

		var request = new InitiateAuthRequest
		{
			AuthFlow = AuthFlowType.USER_PASSWORD_AUTH,
			ClientId = _clientId,
			AuthParameters = authParams
		};

		return await _cognito.InitiateAuthAsync(request);
	}
}
