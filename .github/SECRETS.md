# GitHub Actions — Required Secrets

Configure these in: **Settings → Secrets and variables → Actions**

## For Vercel deployment (`deploy.yml`)

| Secret | Description | How to get |
|--------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel organization ID | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | Vercel project ID | `.vercel/project.json` after `vercel link` |
| `DATABASE_URL` | Neon PostgreSQL URL | neon.tech → Connection string |

## For Docker self-hosted deployment (optional)

| Secret | Description |
|--------|-------------|
| `REGISTRY_URL` | Container registry URL (e.g. ghcr.io/your-org) |
| `REGISTRY_USER` | Registry username |
| `REGISTRY_PASSWORD` | Registry password or token |
| `DEPLOY_HOST` | SSH host of your server |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_SSH_KEY` | Private SSH key (contents of `~/.ssh/id_rsa`) |

## Vercel environment variables (set via Vercel dashboard or CLI)

These are NOT GitHub secrets — they live in Vercel:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth secret (`openssl rand -base64 32`) |
| `AUTH_URL` | Your app URL (e.g. `https://pe-platform.vercel.app`) |
| `NEXT_PUBLIC_APP_URL` | Same as AUTH_URL |
