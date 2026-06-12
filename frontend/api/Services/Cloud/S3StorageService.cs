using GreenLens.Api.Interfaces;

namespace GreenLens.Api.Services.Cloud;

public class S3StorageService : IStorageService
{
    public Task<string> UploadFileAsync(string base64File, string folder)
    {
        // TODO: Upload decoded file to Amazon S3 and return public/pre-signed URL.
        throw new NotImplementedException();
    }
}
