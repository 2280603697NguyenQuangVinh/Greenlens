namespace GreenLens.Api.Interfaces;

public interface ITextToSpeechService
{
    Task<string> GenerateAudioAsync(string text);
}
