using GreenLens.Api.Interfaces;
using GreenLens.Api.Services.Mocks;

var builder = WebApplication.CreateBuilder(args);

var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
    ?? ["http://localhost:5173", "http://127.0.0.1:5173"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddOpenApi();
builder.Services.AddControllers();

// Mock implementations — swap to Services.Cloud.* when AWS is ready
builder.Services.AddSingleton<IUserProfileService, MockUserProfileService>();
builder.Services.AddScoped<IAuthService, MockAuthService>();
builder.Services.AddScoped<IAiScannerService, MockAiScannerService>();
builder.Services.AddScoped<IQuizService, MockQuizService>();
builder.Services.AddScoped<IGameService, MockGameService>();
builder.Services.AddScoped<IStorageService, MockStorageService>();
builder.Services.AddScoped<ITextToSpeechService, MockTtsService>();
builder.Services.AddScoped<INotificationService, MockNotificationService>();

var app = builder.Build();

app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapControllers();

app.Run();
