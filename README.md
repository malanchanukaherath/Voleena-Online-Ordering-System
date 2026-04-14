# Voleena Foods Online Ordering System

[![Live Website](https://img.shields.io/badge/Live%20Website-voleenafoods.app-0A7A3B?style=for-the-badge)](https://www.voleenafoods.app)

## Live Demo

## [https://www.voleenafoods.app](https://www.voleenafoods.app)

Production site is available at the link above.

## Overview

Voleena Foods is a full-stack online ordering platform with separate frontend and backend applications, plus a MySQL database layer. The system supports customer ordering workflows and operational flows for staff roles.

## Repository Structure

```text
.
|- client/      # React + Vite frontend
|- server/      # Node.js + Express backend
|- database/    # SQL schema and seed/sync scripts
|- scripts/     # Deployment and utility scripts
|- reports/     # Testing and submission reports
|- docker-compose.yml
```

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express, Sequelize
- Database: MySQL 8
- Tooling: Jest, ESLint, Docker Compose

## Prerequisites

- Node.js 18+
- npm 9+
- MySQL 8 (for local non-Docker setup)
- Docker Desktop (optional, for containerized setup)

## Local Setup

### Option 1: One-command dependency install

Windows:

```bat
install.bat
```

Linux/macOS:

```bash
chmod +x install.sh
./install.sh
```

Then update environment variables as needed:

- `server/.env` (database, API keys, mail settings)
- `client/.env` (frontend API base URL)

### Option 2: Manual setup

Install dependencies:

```bash
npm install
npm --prefix client install
npm --prefix server install
```

Create and configure environment files:

```bash
cp server/.env.example server/.env
```

For frontend, create `client/.env` if missing:

```env
VITE_API_BASE_URL=http://localhost:3001
```

Set up the database:

1. Create a MySQL database named `voleena_foods_db`.
2. Import the schema from `database/safe_schema_full_completion_v2_4.sql`.
3. (Optional) Run sync updates from `database/safe_schema_sync_v2_4.sql`.

Seed baseline roles/staff:

```bash
cd server
node seed_roles_and_staff.js
```

Start the apps in separate terminals:

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Docker Setup

Build and run all services:

```bash
docker compose up --build
```

Optional initialization profile:

```bash
docker compose --profile init up db_sync backend_seed
```

## Scripts

From repository root:

```bash
npm test
npm run api:smoke
```

From `server/`:

```bash
npm run start
npm run dev
npm run test
npm run lint
npm run db:migrate
npm run db:seed
npm run db:reset
```

From `client/`:

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test:a11y
```

## Deployment Notes

- EC2 helper script: `scripts/deploy-ec2.sh`
- Container definitions: `client/Dockerfile`, `server/Dockerfile`
- GitHub Actions deploy builds and pushes `voleena-backend` and `voleena-frontend` first, then EC2 pulls the exact `sha-<commit>` images to avoid slow production builds.
- Manual EC2 deploy with local builds: `TARGET_BRANCH=main ./deploy-ec2.sh`
- Manual EC2 deploy with prebuilt Docker Hub images: `DEPLOY_STRATEGY=pull DOCKERHUB_USERNAME=<dockerhub-user> IMAGE_TAG=latest TARGET_BRANCH=main ./deploy-ec2.sh` (`DOCKERHUB_TOKEN` is optional for private images)
- Full EC2 rebuild guide: `docs/ec2-rebuild.md`
- Self-hosted runner guide: `docs/ec2-self-hosted-runner.md`

## Testing

- Backend tests use Jest and coverage output under `server/coverage/`.
- API smoke tests are in `postman/voleena-api-smoke.postman_collection.json` and can be run via `npm run api:smoke`.
- Frontend accessibility checks run through Lighthouse CI config at `client/lighthouserc.json` and can be run via `npm --prefix client run test:a11y`.
- CI automation:
  - `.github/workflows/api-smoke-newman.yml` runs Postman/Newman smoke checks.
  - `.github/workflows/frontend-a11y-lighthouse.yml` runs frontend Lighthouse accessibility checks.
- Additional testing summary is available in `reports/testing-submission-report.md`.

## Maintainer

Malan Chanuka Herath
