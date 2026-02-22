#!/usr/bin/env sh
set -e

ENV_FILE="${1:-.env}"

echo "[deploy] build + up"
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d --build

echo "[deploy] migrate deploy"
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" exec backend npm run prisma:migrate:deploy

echo "[deploy] done"
