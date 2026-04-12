#!/usr/bin/env bash

set -Eeuo pipefail

REPO_DIR="${REPO_DIR:-$HOME/Voleena-Online-Ordering-System}"
TARGET_BRANCH="${TARGET_BRANCH:-main}"
COMPOSE_FILE_CHECK="${COMPOSE_FILE_CHECK:-/tmp/voleena-compose-check.yml}"

echo "==> Deploy started at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "==> Repo: ${REPO_DIR}"
echo "==> Branch: ${TARGET_BRANCH}"

cd "${REPO_DIR}"

echo "1) Backing up database..."
mkdir -p backups
BACKUP="backups/voleena_foods_db_$(date +%Y%m%d_%H%M%S).sql"
docker exec mysql_db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers --databases "$MYSQL_DATABASE"' > "${BACKUP}"
test -s "${BACKUP}"
ls -lh "${BACKUP}"

echo "2) Checking EC2 repo state..."
git status --short

if [ -n "$(git status --porcelain)" ]; then
  echo "STOP: Repository has uncommitted changes on EC2. Commit/stash/remove them, then retry."
  exit 1
fi

echo "3) Pulling latest code..."
git fetch origin
git pull --ff-only origin "${TARGET_BRANCH}"

echo "4) Checking docker compose config..."
docker compose config > "${COMPOSE_FILE_CHECK}"
if grep -n "docker_schema_patch" "${COMPOSE_FILE_CHECK}"; then
  echo "STOP: docker_schema_patch is still referenced. Do not continue."
  exit 1
fi
echo "OK: docker_schema_patch is not referenced."

echo "5) Starting DB and waiting for health..."
docker compose up -d db
until [ "$(docker inspect -f '{{.State.Health.Status}}' mysql_db 2>/dev/null)" = "healthy" ]; do
  echo "Waiting for mysql_db to be healthy..."
  sleep 2
done

echo "6) Applying safe schema sync..."
docker compose --profile init run --rm db_sync

echo "7) Rebuilding and restarting app containers..."
docker compose up -d --build backend frontend

echo "8) Checking containers..."
docker compose ps

echo "9) Checking backend logs..."
docker logs --tail=80 backend_app

echo "10) Checking key database tables..."
docker exec mysql_db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "SHOW TABLES LIKE '\''activity_log'\''; SHOW TABLES LIKE '\''otp_verification'\''; SHOW TABLES LIKE '\''app_notification'\''; SELECT COUNT(*) AS customers FROM customer;"'

echo "DONE: deploy completed safely."