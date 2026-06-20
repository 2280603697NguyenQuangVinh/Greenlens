using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace GreenLens.Api.Swagger;

public sealed class AiCameraAnalyzeOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        if (!string.Equals(
                context.ApiDescription.RelativePath,
                "ai-camera/analyze",
                StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        operation.RequestBody = new OpenApiRequestBody
        {
            Required = true,
            Content =
            {
                ["multipart/form-data"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema
                    {
                        Type = "object",
                        Required = new HashSet<string> { "childId", "image" },
                        Properties =
                        {
                            ["childId"] = new OpenApiSchema
                            {
                                Type = "string",
                                Description = "Child profile id."
                            },
                            ["image"] = new OpenApiSchema
                            {
                                Type = "string",
                                Format = "binary",
                                Description = "JPEG or PNG waste image."
                            }
                        }
                    }
                }
            }
        };
    }
}
