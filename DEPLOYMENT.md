# Deployment Runbook

Last verified: 2026-06-18

This document describes the production architecture, deployment automation,
security boundaries, and verification commands for DalaranSiege. It must not
contain passwords, API secret keys, access tokens, or service-account keys.

## Production architecture

```text
Browser
  -> Vercel Angular frontend
  -> Vercel /api/* rewrite
  -> Google Cloud Run Spring Boot API
  -> Supabase PostgreSQL session pooler

Browser
  -> Supabase Auth
  -> JWT sent to the Spring Boot API
```

Production endpoints:

- Frontend: `https://dalaran-siege.vercel.app`
- Cloud Run API: `https://dalaransiege-api-g23u2zuwza-od.a.run.app`
- Health through Vercel: `https://dalaran-siege.vercel.app/api/health`
- Health through Cloud Run: `https://dalaransiege-api-g23u2zuwza-od.a.run.app/api/health`

## Google Cloud resources

- Project ID: `dalaransiege`
- Project number: `537019993311`
- Cloud Run region: `europe-west9`
- Cloud Run service: `dalaransiege-api`
- Artifact Registry repository: `cloud-run-source-deploy`
- Runtime service account: `dalaransiege-api@dalaransiege.iam.gserviceaccount.com`
- Build service account: `dalaransiege-builder@dalaransiege.iam.gserviceaccount.com`
- Secret Manager secret: `supabase-db-password`
- Cloud Build trigger: `deploy-dalaransiege-backend`
- Trigger region: `global`

The runtime account can read `supabase-db-password`. The build account can
build images, push to the repository, deploy Cloud Run revisions, write logs,
read build source, and act as the runtime account. The build account does not
receive the database password.

## Cost controls

The Cloud Run deployment is kept within these initial limits:

```text
Minimum instances: 0
Maximum instances: 1
CPU: 1
Memory: 512 MiB
Concurrency: 20
Request timeout: 30 seconds
Database pool: 5 connections
```

The Google Cloud billing account has a project-scoped EUR 10 monthly budget
with current-spend alerts at 50%, 75%, 90%, and 100%, plus a forecasted-spend
alert at 100%. Budgets alert; they do not stop spending automatically.

## Backend automatic deployment

The trigger watches:

```text
Branch: ^main$
Included files:
  backend/**
  cloudbuild.yaml
```

On a matching push, `cloudbuild.yaml` performs these steps:

1. Build `backend/Dockerfile`; Maven compilation and unit tests run inside it.
2. Push the image to Artifact Registry with the Cloud Build ID as its tag.
3. Deploy the image to `dalaransiege-api` in `europe-west9`.
4. Reapply the cost limits, runtime service account, and Secret Manager mapping.

The public Cloud Run Invoker IAM policy is intentionally managed separately as
a one-time service policy. The deployment account does not have broad IAM
administration permissions.

`backend/.dockerignore`, `backend/.gcloudignore`, and the root `.gcloudignore`
exclude local secrets and generated output. Real `.env` files must never be
committed.

## Frontend automatic deployment

Vercel is connected to `sofmega/DalaranSiege` and deploys pushes from `main`.
`vercel.json` sends `/api/:path*` to the stable Cloud Run service URL before
applying the Angular single-page application fallback.

Required Vercel production variables:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

`SUPABASE_ANON_KEY` is supported only as a legacy fallback. Never expose any of
the following to Vercel or browser code:

```text
SUPABASE_DB_PASSWORD
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SECRET_KEY
```

The production frontend origin is allowed by Cloud Run CORS:

```text
https://dalaran-siege.vercel.app
```

Supabase Auth should also have this production Site URL and redirect pattern:

```text
Site URL: https://dalaran-siege.vercel.app
Redirect URL: https://dalaran-siege.vercel.app/**
```

## Backend runtime configuration

The backend reads these non-secret environment variables from Cloud Run:

```text
SUPABASE_URL
SUPABASE_JWT_ISSUER
SUPABASE_DB_URL
SUPABASE_DB_USER
CORS_ALLOWED_ORIGINS
DB_MAX_POOL_SIZE
DB_MIN_IDLE
DB_CONNECTION_TIMEOUT_MS
DB_VALIDATION_TIMEOUT_MS
DB_CONNECT_TIMEOUT_SECONDS
DB_SOCKET_TIMEOUT_SECONDS
```

Cloud Run maps `supabase-db-password:latest` to `SUPABASE_DB_PASSWORD`.

The PostgreSQL URL uses the IPv4-compatible Supabase session pooler. Do not
replace it with the direct IPv6-only database hostname unless the runtime
network is known to support that route.

## Verification

After a deployment, verify both the direct API and Vercel proxy:

```powershell
Invoke-RestMethod https://dalaransiege-api-g23u2zuwza-od.a.run.app/api/health
Invoke-RestMethod https://dalaran-siege.vercel.app/api/health
Invoke-RestMethod https://dalaran-siege.vercel.app/api/supabase/status
@(Invoke-RestMethod https://dalaran-siege.vercel.app/api/v1/heroes).Count
@(Invoke-RestMethod https://dalaran-siege.vercel.app/api/items).Count
@(Invoke-RestMethod https://dalaran-siege.vercel.app/api/shops).Count
```

Expected catalog counts as of the last verification:

```text
Heroes: 18
Items: 73
Shops: 7
```

Useful inspection commands:

```powershell
gcloud builds triggers describe deploy-dalaransiege-backend --project=dalaransiege --region=global
gcloud builds list --project=dalaransiege --region=global --limit=10
gcloud run services describe dalaransiege-api --project=dalaransiege --region=europe-west9
gcloud run services logs read dalaransiege-api --project=dalaransiege --region=europe-west9 --limit=100
```

## Failure isolation

- Frontend build failure: inspect the Vercel deployment logs.
- `/api/*` returns the Angular page: verify the API rewrite precedes the SPA
  fallback in `vercel.json`.
- Cloud Build does not start: verify the pushed branch and included-file filter.
- Cloud Build cannot push: verify Artifact Registry Writer on the build account.
- Cloud Build cannot deploy: verify Cloud Run Developer and Service Account User.
- API starts but database calls fail: inspect the Secret Manager version,
  session-pooler URL, database username, and Cloud Run logs.
- Authentication fails: verify Vercel public Supabase variables, Supabase Auth
  redirect URLs, the JWT issuer, and the browser Authorization header.
- First request is slow: Cloud Run is intentionally configured to scale to zero.

## Safe change workflow

1. Make and test changes locally.
2. Never stage real `.env` files.
3. Push to `main` only after reviewing the diff.
4. Backend or `cloudbuild.yaml` changes trigger Cloud Build automatically.
5. Vercel deploys the frontend from the same push.
6. Verify health, Supabase connectivity, catalog endpoints, and authentication.
