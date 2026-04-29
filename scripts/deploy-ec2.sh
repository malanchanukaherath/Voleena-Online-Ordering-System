#!/usr/bin/env bash

set -Eeuo pipefail

REPO_DIR="${REPO_DIR:-$HOME/OrderFlow-Online-Ordering-System}"
TARGET_BRANCH="${TARGET_BRANCH:-main}"
COMPOSE_FILE_CHECK="${COMPOSE_FILE_CHECK:-/tmp/orderflow-compose-check.yml}"
DEPLOY_STRATEGY="${DEPLOY_STRATEGY:-auto}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DB_VOLUME_NAME="${DB_VOLUME_NAME:-orderflow_mysql_data}"
MIN_FREE_SPACE_MB="${MIN_FREE_SPACE_MB:-2048}"
RUN_DB_MIGRATION_V26="${RUN_DB_MIGRATION_V26:-false}"
MIGRATION_V26_FILE="${MIGRATION_V26_FILE:-database/migration_v2.6_preorder_addons_resume_safe.sql}"
RUN_DB_MIGRATION_V27="${RUN_DB_MIGRATION_V27:-false}"
MIGRATION_V27_FILE="${MIGRATION_V27_FILE:-database/migration_v2.7_addon_admin_safety_baseline.sql}"
RUN_DB_MIGRATION_V28="${RUN_DB_MIGRATION_V28:-false}"
MIGRATION_V28_FILE="${MIGRATION_V28_FILE:-database/migration_v2.8_preorder_request_split.sql}"

export DOCKER_CLIENT_TIMEOUT="${DOCKER_CLIENT_TIMEOUT:-900}"
export COMPOSE_HTTP_TIMEOUT="${COMPOSE_HTTP_TIMEOUT:-900}"
export DB_VOLUME_NAME

dump_app_start_diagnostics() {
  echo "---- docker compose ps ----"
  docker compose ps || true
  echo "---- backend_app logs (tail 200) ----"
  docker logs --tail=200 backend_app || true
  echo "---- frontend_app logs (tail 120) ----"
  docker logs --tail=120 frontend_app || true
}

dump_docker_host_diagnostics() {
  echo "---- disk usage ----"
  df -h || true
  echo "---- docker system df ----"
  docker system df || true
  echo "---- docker images (orderflow) ----"
  docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}' | grep 'orderflow-' || true
}

docker_storage_path() {
  if [ -d /var/lib/containerd ]; then
    printf '%s\n' /var/lib/containerd
    return 0
  fi

  docker info --format '{{.DockerRootDir}}' 2>/dev/null || printf '%s\n' /var/lib/docker
}

available_kb_for_path() {
  local target_path="$1"
  df -Pk "${target_path}" | awk 'NR==2 {print $4}'
}

reclaim_docker_pull_space() {
  echo "Reclaiming safe Docker cache space before retry..."
  echo "Keeping running containers and named volumes intact."
  docker system df || true
  docker builder prune -af || true
  docker image prune -f || true
  echo "Docker disk usage after cleanup:"
  docker system df || true
}

ensure_docker_pull_headroom() {
  local required_kb=$((MIN_FREE_SPACE_MB * 1024))
  local storage_path
  local available_kb

  storage_path="$(docker_storage_path)"
  available_kb="$(available_kb_for_path "${storage_path}")"

  echo "Docker storage path: ${storage_path}"
  echo "Free space before pull: $((available_kb / 1024)) MB"

  if [ "${available_kb}" -ge "${required_kb}" ]; then
    return 0
  fi

  echo "WARN: Less than ${MIN_FREE_SPACE_MB} MB is free for Docker image extraction."
  reclaim_docker_pull_space
  available_kb="$(available_kb_for_path "${storage_path}")"
  echo "Free space after cleanup: $((available_kb / 1024)) MB"

  if [ "${available_kb}" -lt "${required_kb}" ]; then
    echo "STOP: Docker host still has less than ${MIN_FREE_SPACE_MB} MB free at ${storage_path}."
    echo "Expand the EC2 disk or manually clean unused data before retrying deploy."
    dump_docker_host_diagnostics
    return 1
  fi
}

pull_image_with_retries() {
  local image="$1"
  local attempts="${2:-3}"
  local attempt=1
  local reclaimed_for_space="false"

  ensure_docker_pull_headroom

  while [ "${attempt}" -le "${attempts}" ]; do
    echo "Pull attempt ${attempt}/${attempts}: ${image}"
    local pull_log
    pull_log="$(mktemp)"

    if docker pull "${image}" >"${pull_log}" 2>&1; then
      cat "${pull_log}"
      rm -f "${pull_log}"
      echo "OK: Pulled ${image}"
      return 0
    fi

    cat "${pull_log}"
    echo "WARN: Failed to pull ${image} on attempt ${attempt}/${attempts}."
    if grep -q "no space left on device" "${pull_log}"; then
      if [ "${reclaimed_for_space}" = "false" ]; then
        reclaim_docker_pull_space
        reclaimed_for_space="true"
      else
        echo "WARN: Pull still failed for lack of space after safe Docker cleanup."
      fi
    fi
    rm -f "${pull_log}"

    if [ "${attempt}" -lt "${attempts}" ]; then
      sleep $((attempt * 5))
    fi
    attempt=$((attempt + 1))
  done

  echo "ERROR: Unable to pull ${image} after ${attempts} attempts."
  dump_docker_host_diagnostics
  return 1
}

rollback_app_services() {
  if [ -z "${PREVIOUS_BACKEND_IMAGE:-}" ] || [ -z "${PREVIOUS_FRONTEND_IMAGE:-}" ]; then
    echo "No previous backend/frontend image pair recorded. Skipping rollback attempt."
    return 1
  fi

  echo "Attempting rollback to last known images..."
  echo "BACKEND_IMAGE=${PREVIOUS_BACKEND_IMAGE}"
  echo "FRONTEND_IMAGE=${PREVIOUS_FRONTEND_IMAGE}"

  BACKEND_IMAGE="${PREVIOUS_BACKEND_IMAGE}" \
  FRONTEND_IMAGE="${PREVIOUS_FRONTEND_IMAGE}" \
  docker compose up -d --no-build backend frontend
}

start_app_services() {
  if ! docker compose up -d --no-build backend frontend; then
    echo "ERROR: Failed to start backend/frontend containers. Collecting diagnostics..."
    dump_app_start_diagnostics
    if rollback_app_services; then
      echo "Rollback started. Verifying service state..."
      docker compose ps || true
    else
      echo "Rollback was not possible or did not succeed."
      dump_docker_host_diagnostics
      exit 1
    fi
    exit 1
  fi
}

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
      */orderflow-backend:*)
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
echo "==> DB volume: ${DB_VOLUME_NAME}"

echo "1) Backing up database..."
mkdir -p backups
BACKUP="backups/orderflow_db_$(date +%Y%m%d_%H%M%S).sql"
if docker ps --format '{{.Names}}' | grep -qx 'mysql_db'; then
  docker exec mysql_db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers --databases "$MYSQL_DATABASE"' > "${BACKUP}"
  test -s "${BACKUP}"
  ls -lh "${BACKUP}"
else
  echo "No running mysql_db container found (likely first deploy). Skipping backup."
fi

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
if ! docker volume inspect "${DB_VOLUME_NAME}" >/dev/null 2>&1; then
  echo "Creating persistent DB volume '${DB_VOLUME_NAME}'..."
  docker volume create "${DB_VOLUME_NAME}" >/dev/null
fi

docker compose up -d db
until [ "$(docker inspect -f '{{.State.Health.Status}}' mysql_db 2>/dev/null)" = "healthy" ]; do
  echo "Waiting for mysql_db to be healthy..."
  sleep 2
done

MYSQL_DATA_MOUNT="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/var/lib/mysql"}}{{.Name}}{{end}}{{end}}' mysql_db)"
if [ "${MYSQL_DATA_MOUNT}" != "${DB_VOLUME_NAME}" ]; then
  echo "STOP: mysql_db is not using expected persistent volume '${DB_VOLUME_NAME}' (found '${MYSQL_DATA_MOUNT}')."
  exit 1
fi

echo "OK: mysql_db is using persistent volume '${DB_VOLUME_NAME}'."

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

if [ "${RUN_DB_MIGRATION_V28}" = "true" ]; then
  echo "9) Applying v2.8 preorder-request split migration because RUN_DB_MIGRATION_V28=true..."

  if [ ! -f "${MIGRATION_V28_FILE}" ]; then
    echo "STOP: Migration file not found at '${MIGRATION_V28_FILE}'."
    exit 1
  fi

  docker exec -i mysql_db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < "${MIGRATION_V28_FILE}"
  echo "OK: v2.8 preorder-request split migration applied (idempotent; safe to re-run)."
else
  echo "9) Skipping v2.8 preorder-request split migration. Set RUN_DB_MIGRATION_V28=true to apply it during this deploy."
fi

echo "10) Updating and restarting app containers..."
case "${DEPLOY_STRATEGY}" in
  pull)
    if [ -z "${DOCKERHUB_USERNAME:-}" ]; then
      echo "STOP: DEPLOY_STRATEGY=pull requires DOCKERHUB_USERNAME."
      exit 1
    fi

    export BACKEND_IMAGE="${BACKEND_IMAGE:-${DOCKERHUB_USERNAME}/orderflow-backend:${IMAGE_TAG}}"
    export FRONTEND_IMAGE="${FRONTEND_IMAGE:-${DOCKERHUB_USERNAME}/orderflow-frontend:${IMAGE_TAG}}"
    PREVIOUS_BACKEND_IMAGE="$(docker inspect -f '{{.Config.Image}}' backend_app 2>/dev/null || true)"
    PREVIOUS_FRONTEND_IMAGE="$(docker inspect -f '{{.Config.Image}}' frontend_app 2>/dev/null || true)"

    if [ -n "${DOCKERHUB_TOKEN:-}" ]; then
      echo "Logging in to Docker Hub..."
      printf '%s' "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
    fi

    echo "Pulling ${BACKEND_IMAGE} and ${FRONTEND_IMAGE}..."
    pull_image_with_retries "${BACKEND_IMAGE}"
    pull_image_with_retries "${FRONTEND_IMAGE}"
    start_app_services
    ;;
  build)
    echo "NOTE: Local Docker builds can be slow on t3.micro. For faster deploys, use DEPLOY_STRATEGY=pull DOCKERHUB_USERNAME=<dockerhub-user>."
    echo "Building backend image on EC2..."
    docker compose --progress=plain build backend
    echo "Building frontend image on EC2..."
    docker compose --progress=plain build frontend
    start_app_services
    ;;
  *)
    echo "STOP: Unknown DEPLOY_STRATEGY='${DEPLOY_STRATEGY}'. Use 'build' or 'pull'."
    exit 1
    ;;
esac

if [ "${RUN_ACCOUNT_SEED:-false}" = "true" ]; then
  echo "11) Seeding login accounts because RUN_ACCOUNT_SEED=true..."
  docker compose --profile init run --rm --no-deps backend_seed
else
  echo "11) Skipping login account seed. Set RUN_ACCOUNT_SEED=true for first-time EC2 setup."
fi

echo "12) Checking containers..."
docker compose ps

echo "13) Checking backend logs..."
docker logs --tail=80 backend_app

echo "14) Checking key database tables..."
docker exec mysql_db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "SHOW TABLES LIKE '\''activity_log'\''; SHOW TABLES LIKE '\''otp_verification'\''; SHOW TABLES LIKE '\''app_notification'\''; SELECT COUNT(*) AS customers FROM customer;"'

echo "DONE: deploy completed safely."
