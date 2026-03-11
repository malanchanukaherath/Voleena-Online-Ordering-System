# Docker Deployment Checklist

## Pre-Deployment

- [ ] Docker and Docker Compose are installed on target host
- [ ] `.env` is created from `.env.example`
- [ ] Production secrets are updated in `.env`
- [ ] Required ports are available: 8080, 3001, 3306 (or your overridden values)

## Build And Start

```bash
docker-compose up --build -d
```

- [ ] `mysql` container is healthy
- [ ] `backend` container is healthy
- [ ] `frontend` container is running

## Health Verification

```bash
curl http://localhost:3001/health
```

- [ ] Backend health endpoint returns 200
- [ ] Frontend opens at `http://localhost:8080`
- [ ] API requests from frontend reach backend successfully

## Database Verification

```bash
docker-compose exec mysql mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "SHOW DATABASES;"
```

- [ ] Database exists
- [ ] Schema tables are present

## Operational Checks

- [ ] Container logs have no repeated startup failures
- [ ] Payment and messaging keys are configured for environment
- [ ] CORS `FRONTEND_URL` matches exposed frontend URL

## Rollback

- [ ] Rollback image tags are available (if using image registry)
- [ ] Previous `.env` snapshot is available
- [ ] Rollback command is documented

## Shutdown Commands

```bash
docker-compose down
docker-compose down -v
```
