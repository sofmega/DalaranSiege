# Deployment Runbook

Last verified: 2026-06-19

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
Minimum instances: 1
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
Redirect URLs:
  https://dalaran-siege.vercel.app
  https://dalaran-siege.vercel.app/**
  http://localhost:4201
  http://localhost:4201/**
```

Vercel Web Analytics is enabled. The frontend package is
`@vercel/analytics`, initialized with `inject()` in `frontend/src/main.ts`.

## Google OAuth through Supabase

- Google Cloud project: `dalaransiege`
- OAuth client type: Web application
- OAuth client name: `DalaranSiege Web`
- Supabase project ref: `vnekvzddgjcsowinazwk`
- Supabase Google provider: enabled

Google OAuth client configuration:

```text
Authorized JavaScript origins:
  http://localhost:4201
  https://dalaran-siege.vercel.app

Authorized redirect URI:
  https://vnekvzddgjcsowinazwk.supabase.co/auth/v1/callback
```

The Supabase callback URL belongs only in Google's authorized redirect URIs.
Do not add it to Supabase Redirect URLs; those URLs control where Supabase may
return the browser after authentication. Keep `Skip nonce checks` and `Allow
users without an email` disabled. If the Google app remains in testing mode,
the account used for verification must be listed as a Google Auth test user.

The Google client secret lives only in the Supabase provider settings. Never
put it in this repository, Vercel public variables, logs, screenshots, or issue
text.

## Search indexing

The Angular frontend manages page title, description, canonical URL, Open
Graph, Twitter, and robots metadata with `frontend/src/app/seo.service.ts`.
Entity routes receive entity-specific metadata; auth and missing entity pages
are marked `noindex`.

`frontend/public/robots.txt` advertises
`https://dalaran-siege.vercel.app/sitemap.xml`. The production frontend build
runs `frontend/scripts/generate-sitemap.mjs`, which generates sitemap entries
for the homepage plus all current item and hero detail routes from the backend
catalog JSON. After deploying SEO changes, submit the sitemap URL in Google
Search Console and request indexing; metadata makes pages indexable but cannot
guarantee rankings or immediate appearance in search results.

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

The current schema ends at Flyway migration V8. Never edit a migration already
applied in production. Add a new versioned migration instead, or Flyway will
reject startup because its stored checksum no longer matches the file.

## Verification

After a deployment, verify both the direct API and Vercel proxy:

```powershell
Invoke-RestMethod https://dalaransiege-api-g23u2zuwza-od.a.run.app/api/health
Invoke-RestMethod https://dalaran-siege.vercel.app/api/health
Invoke-RestMethod https://dalaran-siege.vercel.app/api/supabase/status
Invoke-WebRequest https://dalaran-siege.vercel.app/robots.txt
Invoke-WebRequest https://dalaran-siege.vercel.app/sitemap.xml
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
  redirect URLs, the exact Google callback URI, Google test-user access, the
  JWT issuer, and the browser Authorization header.
- Pages are not indexed: verify production metadata, `robots.txt`, and
  `sitemap.xml`, then inspect Google Search Console coverage and URL inspection.
- First request is slow: verify the Cloud Run minimum instance setting remains at
  `1` and inspect the latest revision startup logs.

## Safe change workflow

1. Make and test changes locally.
2. Never stage real `.env` files.
3. Push to `main` only after reviewing the diff.
4. Backend or `cloudbuild.yaml` changes trigger Cloud Build automatically.
5. Vercel deploys the frontend from the same push.
6. Verify health, Supabase connectivity, catalog endpoints, and authentication.
