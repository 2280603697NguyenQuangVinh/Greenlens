# GitHub Pages Note

GreenLens should not use GitHub Pages as the primary hosting target for production.

Reasons:

- the project has two separate web deployments
- the production app needs environment-variable-based API configuration
- admin and child web should be deployed independently
- AWS Amplify provides better CI/CD, branch deploys, env management, and domain handling

GitHub should be used as the source repository, while Amplify should be used for hosting.
