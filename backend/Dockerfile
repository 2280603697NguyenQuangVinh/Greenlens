# ==========================================================
# Multi-stage Dockerfile for GreenLens Backend (.NET 8)
# Supports deployment as a standard Containerized API (ECS/K8s/App Runner)
# or AWS Lambda Container Image.
# ==========================================================

# --- Stage 1: Build the application ---
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution file and project files first to leverage Docker caching
COPY GreenLens.sln ./
COPY src/GreenLens.Api/GreenLens.Api.csproj src/GreenLens.Api/
COPY src/GreenLens.Application/GreenLens.Application.csproj src/GreenLens.Application/
COPY src/GreenLens.Domain/GreenLens.Domain.csproj src/GreenLens.Domain/
COPY src/GreenLens.Infrastructure/GreenLens.Infrastructure.csproj src/GreenLens.Infrastructure/
COPY src/GreenLens.Shared/GreenLens.Shared.csproj src/GreenLens.Shared/

# Restore dependencies
RUN dotnet restore

# Copy all source files
COPY src/ src/

# Build and publish the release
RUN dotnet publish src/GreenLens.Api/GreenLens.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# --- Stage 2: Production runtime environment ---
# Option A: Standard ASP.NET Core Runtime (Recommended for ECS, App Runner, Kubernetes, VPS)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose HTTP ports
EXPOSE 80
EXPOSE 443

ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "GreenLens.Api.dll"]


# Option B: AWS Lambda Container Runtime (If you are deploying as a Lambda container)
# To use this option, comment out Stage 2 Option A above and uncomment below:
# FROM public.ecr.aws/lambda/dotnet:8 AS final-lambda
# WORKDIR /var/task
# COPY --from=build /app/publish .
# # Point to the Lambda function handler, e.g.:
# CMD ["GreenLens.Api::GreenLens.Api.Functions.CreateChildProfileFunction::Handler"]
