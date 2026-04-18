#!/usr/bin/env bash

set -Eeuo pipefail

REPO_DIR="${REPO_DIR:-$HOME/Voleena-Online-Ordering-System}"
TARGET_BRANCH="${TARGET_BRANCH:-main}"
COMPOSE_FILE_CHECK="${COMPOSE_FILE_CHECK:-/tmp/voleena-compose-check.yml}"
DEPLOY_STRATEGY="${DEPLOY_STRATEGY:-auto}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
RUN_DB_MIGRATION_V26="${RUN_DB_MIGRATION_V26:-false}"
MIGRATION_V26_FILE="${MIGRATION_V26_FILE:-database/migration_v2.6_preorder_addons_resume_safe.sql}"
RUN_DB_MIGRATION_V27="${RUN_DB_MIGRATION_V27:-false}"
MIGRATION_V27_FILE="${MIGRATION_V27_FILE:-database/migration_v2.7_addon_admin_safety_baseline.sql}"

export DOCKER_CLIENT_TIMEOUT="${DOCKER_CLIENT_TIMEOUT:-900}"
export COMPOSE_HTTP_TIMEOUT="${COMPOSE_HTTP_TIMEOUT:-900}"

echo "==> Deploy started at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "==> Repo: ${REPO_DIR}"
echo "==> Branch: ${TARGET_BRANCH}"

cd "${REPO_DIR}"

if [ "${DEPLOY_STRATEGY}" = "auto" ]; then
  if [ -n "${DOCKERHUB_USERNAME:-}" ]; then
    DEPLOY_STRATEGY="pull"
  else
    RUNNING_BACKEND_IMAGE="$(docker inspect -f '{{.Config.Image}}' backend_app 2>/dev/null || true)"
    case "${RUNNING_BACKEND_IMAGE}" in
      */voleena-backend:*)
        DOCKERHUB_USERNAME="${RUNNING_BACKEND_IMAGE%%/*}"
        DEPLOY_STRATEGY="pull"
        echo "==> Inferred Docker Hub user from backend_app image: ${DOCKERHUB_USERNAME}"
        ;;
      *)
        DEPLOY_STRATEGY="build"
        ;;
    esac
  fi
fi

echo "==> Deploy strategy: ${DEPLOY_STRATEGY}"

echo "1) Backing up database..."
mkdir -p backups
BACKUP="backups/voleena_foods_db_$(date +%Y%m%d_%H%M%S).sql"
docker exec mysql_db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers --databases "$MYSQL_DATABASE"' > "${BACKUP}"
test -s "${BACKUP}"
ls -lh "${BACKUP}"

echo "2) Checking EC2 repo state..."
git status --short --untracked-files=no

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
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

if [ "${RUN_DB_SYNC:-false}" = "true" ]; then
  echo "6) Applying safe schema sync because RUN_DB_SYNC=true..."
  docker compose --profile init run --rm db_sync
else
  echo "6) Skipping schema sync. Set RUN_DB_SYNC=true only after reviewing the SQL for this deploy."
fi

if [ "${RUN_DB_MIGRATION_V26}" = "true" ]; then
  echo "7) Applying v2.6 preorder/add-on migration because RUN_DB_MIGRATION_V26=true..."

  if [ ! -f "${MIGRATION_V26_FILE}" ]; then
    echo "STOP: Migration file not found at '${MIGRATION_V26_FILE}'."
    exit 1
  fi

  docker exec -i mysql_db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < "${MIGRATION_V26_FILE}"
  echo "OK: v2.6 migration applied (idempotent; safe to re-run)."
else
  echo "7) Skipping v2.6 preorder/add-on migration. Set RUN_DB_MIGRATION_V26=true to apply it during this deploy."
fi

if [ "${RUN_DB_MIGRATION_V27}" = "true" ]; then
  echo "8) Applying v2.7 add-on safety migration because RUN_DB_MIGRATION_V27=true..."

  if [ ! -f "${MIGRATION_V27_FILE}" ]; then
    echo "STOP: Migration file not found at '${MIGRATION_V27_FILE}'."
    exit 1
  fi

  docker exec -i mysql_db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < "${MIGRATION_V27_FILE}"
  echo "OK: v2.7 migration applied (idempotent; safe to re-run)."
else
  echo "8) Skipping v2.7 add-on migration. Set RUN_DB_MIGRATION_V27=true to apply it during this deploy."
fi

echo "9) Updating and restarting app containers..."
case "${DEPLOY_STRATEGY}" in
  pull)
    if [ -z "${DOCKERHUB_USERNAME:-}" ]; then
      echo "STOP: DEPLOY_STRATEGY=pull requires DOCKERHUB_USERNAME."
      exit 1
    fi

    export BACKEND_IMAGE="${BACKEND_IMAGE:-${DOCKERHUB_USERNAME}/voleena-backend:${IMAGE_TAG}}"
    export FRONTEND_IMAGE="${FRONTEND_IMAGE:-${DOCKERHUB_USERNAME}/voleena-frontend:${IMAGE_TAG}}"

    if [ -n "${DOCKERHUB_TOKEN:-}" ]; then
      echo "Logging in to Docker Hub..."
      printf '%s' "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
    fi

    echo "Pulling ${BACKEND_IMAGE} and ${FRONTEND_IMAGE}..."
    docker compose pull backend frontend
    docker compose up -d --no-build backend frontend
    ;;
  build)
    echo "NOTE: Local Docker builds can be slow on t3.micro. For faster deploys, use DEPLOY_STRATEGY=pull DOCKERHUB_USERNAME=<dockerhub-user>."
    echo "Building backend image on EC2..."
    docker compose --progress=plain build backend
    echo "Building frontend image on EC2..."
    docker compose --progress=plain build frontend
    docker compose up -d --no-build backend frontend
    ;;
  *)
    echo "STOP: Unknown DEPLOY_STRATEGY='${DEPLOY_STRATEGY}'. Use 'build' or 'pull'."
    exit 1
    ;;
esac

if [ "${RUN_ACCOUNT_SEED:-false}" = "true" ]; then
  echo "10) Seeding login accounts because RUN_ACCOUNT_SEED=true..."
  docker compose --profile init run --rm --no-deps backend_seed
else
  echo "10) Skipping login account seed. Set RUN_ACCOUNT_SEED=true for first-time EC2 setup."
fi

echo "11) Checking containers..."
docker compose ps

echo "12) Checking backend logs..."
docker logs --tail=80 backend_app

echo "13) Checking key database tables..."
docker exec mysql_db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "SHOW TABLES LIKE '\''activity_log'\''; SHOW TABLES LIKE '\''otp_verification'\''; SHOW TABLES LIKE '\''app_notification'\''; SELECT COUNT(*) AS customers FROM customer;"'

echo "DONE: deploy completed safely."
