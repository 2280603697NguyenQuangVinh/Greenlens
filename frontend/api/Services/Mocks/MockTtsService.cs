using GreenLens.Api.Interfaces;

namespace GreenLens.Api.Services.Mocks;

public class MockTtsService : ITextToSpeechService
{
    private const string StaticAudioUrl = "https://mock-tts.greenlens.local/audio/sample.mp3";

    public Task<string> GenerateAudioAsync(string text)
    {
        _ = text;
        return Task.FromResult(StaticAudioUrl);
    }
}
