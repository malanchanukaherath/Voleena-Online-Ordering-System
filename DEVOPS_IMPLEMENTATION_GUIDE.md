# Voleena DevOps Guide (Docker Only)

This project is standardized for Docker Compose deployment.

No Kubernetes manifests, Helm charts, or kubectl workflows are required.

## Architecture

- `mysql` container: MySQL 8.0 with schema initialization from `database/production_schema.sql`
- `backend` container: Node.js API server
- `frontend` container: Vite app built and served by Nginx

## Prerequisites

- Docker Engine 24+
- Docker Compose v2+

## Environment Setup

1. Copy the root env template:

```bash
cp .env.example .env
```

2. Update sensitive values in `.env`:

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- Payment keys (`STRIPE_*`, `PAYHERE_*`)
- Email/SMS keys (`SMTP_*`, `RESEND_API_KEY`, `TWILIO_*`)

## Run The Full Stack

```bash
docker-compose up --build
```

Services:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3001`
- Backend health: `http://localhost:3001/health`
- MySQL: `localhost:3306`

## Common Operations

Start in background:

```bash
docker-compose up --build -d
```

View logs:

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

Stop stack:

```bash
docker-compose down
```

Stop and remove DB volume:

```bash
docker-compose down -v
```

## CI/CD Notes

- CI validates backend and frontend quality.
- CI runs a Docker Compose smoke test to verify container startup.
- CI can build and push Docker images to GHCR.

## Database Notes

- Schema is initialized on first DB startup through Docker init scripts.
- Backend includes database connection retries to handle startup race conditions.
- DB pooling and credentials are fully environment-driven via `.env`.

## Production Guidance

- Keep `.env` out of source control.
- Use strong secrets (32+ chars for JWT values).
- Use reverse proxy/TLS in front of frontend and backend when internet-facing.
