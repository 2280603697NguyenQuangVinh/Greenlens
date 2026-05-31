using GreenLens.Api.Interfaces;

namespace GreenLens.Api.Services.Mocks;

public class MockStorageService : IStorageService
{
    private const string StaticUrl = "https://mock-storage.greenlens.local/uploads/sample.png";

    public Task<string> UploadFileAsync(string base64File, string folder)
    {
        _ = base64File;
        _ = folder;
        return Task.FromResult(StaticUrl);
    }
}
