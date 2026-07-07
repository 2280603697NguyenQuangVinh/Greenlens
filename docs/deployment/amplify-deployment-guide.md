# GreenLens Amplify Deployment Guide

This guide prepares the GreenLens web apps for AWS Amplify Hosting.

GreenLens has two separate frontend deployments:

- child web
- admin web

Both are built from the same `frontend/` source folder, but each one uses a different build configuration.

## 1. Deployment strategy

Create two Amplify apps from the same GitHub repository:

1. `greenlens-child-web`
2. `greenlens-admin-web`

Recommended mapping:

- child web domain: `https://app.your-domain.com`
- admin web domain: `https://admin.your-domain.com`

The backend API should already be deployed separately and exposed through a stable HTTPS URL, for example:

```text
https://api.your-domain.com
```

## 2. Build configs already prepared in this repo

Child web build config:

- [deploy/amplify/child-web.amplify.yml](/Users/nguyenquangvinh/Documents/Greenlens/deploy/amplify/child-web.amplify.yml)

Admin web build config:

- [deploy/amplify/admin-web.amplify.yml](/Users/nguyenquangvinh/Documents/Greenlens/deploy/amplify/admin-web.amplify.yml)

Frontend build scripts:

- [frontend/package.json](/Users/nguyenquangvinh/Documents/Greenlens/frontend/package.json)

Available commands:

```bash
npm run build:child
npm run build:admin
```

## 3. Environment variables

Child web example:

- [frontend/.env.amplify.child.example](/Users/nguyenquangvinh/Documents/Greenlens/frontend/.env.amplify.child.example)

Admin web example:

- [frontend/.env.amplify.admin.example](/Users/nguyenquangvinh/Documents/Greenlens/frontend/.env.amplify.admin.example)

Minimum required variables for both Amplify apps:

```text
VITE_API_URL=https://your-api-domain.example.com
VITE_USE_MOCK=false
```

Additional admin variable:

```text
VITE_FORCE_ADMIN_APP=true
```

## 4. Create the child web app in Amplify

In AWS Amplify Hosting:

1. Choose `New app`
2. Choose `Host web app`
3. Connect your GitHub repository
4. Select the repository and branch
5. Set the app root to:

```text
frontend
```

6. Replace the default build spec with the contents of:

```text
deploy/amplify/child-web.amplify.yml
```

7. Add environment variables:

```text
VITE_API_URL=https://your-api-domain.example.com
VITE_USE_MOCK=false
VITE_USE_SUPERTONIC_TTS=false
VITE_SUPERTONIC_VOICE=F2
```

8. Save and deploy

## 5. Create the admin web app in Amplify

Repeat the same process for a second Amplify app:

1. Choose the same GitHub repository and branch
2. Set the app root to:

```text
frontend
```

3. Replace the build spec with the contents of:

```text
deploy/amplify/admin-web.amplify.yml
```

4. Add environment variables:

```text
VITE_API_URL=https://your-api-domain.example.com
VITE_FORCE_ADMIN_APP=true
VITE_USE_MOCK=false
```

5. Save and deploy

## 6. SPA rewrite rules

Because both apps are Vite single-page applications, configure Amplify rewrites so refreshes do not return 404.

For the child web app, add a rewrite:

```text
Source address: </^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|webp|woff2?)$)([^.]+$)/>
Target address: /index.html
Type: 200 (Rewrite)
```

For the admin web app, use the same SPA rewrite rule.

## 7. Backend and CORS

Before deploying the web apps, confirm the backend API:

- is reachable over HTTPS
- allows requests from the Amplify domains
- accepts the exact hostnames you will use in production

If the backend is behind API Gateway, CloudFront, or a custom domain, make sure CORS includes:

- child web domain
- admin web domain

## 8. GitHub integration

Amplify will rebuild automatically whenever you push changes to the connected branch.

Recommended flow:

1. Push code to GitHub
2. Amplify detects the new commit
3. Amplify rebuilds the target app
4. Verify the deploy in the Amplify Console

## 9. Recommended deployment order

1. Deploy backend API
2. Confirm production API URL
3. Deploy child web
4. Deploy admin web
5. Add custom domains
6. Verify auth, API calls, and admin routing

## 10. Validation checklist

### Child web

- Home page loads
- Avatar creation works
- Dashboard loads
- API calls go to production backend
- No mock data is accidentally enabled

### Admin web

- Login page loads
- Admin login succeeds with a real admin account
- `/admin/*` API calls return authorized responses
- Child management and quiz management screens load

## 11. What is already done vs what must be done in AWS

Already prepared in this repo:

- separate build commands for child/admin
- Amplify build specs for both apps
- sample Amplify env files
- deployment guide

Still requires AWS/GitHub console access:

- connecting the GitHub repository to Amplify
- adding environment variables in Amplify
- setting rewrite rules
- attaching custom domains
- clicking the first deploy
