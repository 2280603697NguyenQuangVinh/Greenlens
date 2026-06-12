using GreenLens.Api.Interfaces;

namespace GreenLens.Api.Services.Cloud;

public class GoogleCloudTtsService : ITextToSpeechService
{
    public Task<string> GenerateAudioAsync(string text)
    {
        // TODO: Synthesize speech via Google Cloud Text-to-Speech API.
        throw new NotImplementedException();
    }
}
