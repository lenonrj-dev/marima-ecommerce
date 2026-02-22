# Deploy VPS (CloudPanel) - Backend + Prisma + PostgreSQL do host

Este fluxo usa:
- Backend em container Docker
- Redis em container Docker
- PostgreSQL já instalado no host VPS

## 1) Preparar variáveis de ambiente

Crie/ajuste o `.env` (ou `.env.prod`) no servidor com:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://appuser:SENHA@host.docker.internal:5432/appdb?schema=public
REDIS_URL=redis://redis:6379
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
CORS_ORIGINS=https://seu-frontend.com
STORE_URL=https://seu-frontend.com
API_PUBLIC_URL=https://sua-api.com
```

Observação: em container, `127.0.0.1` aponta para o próprio container. Por isso usamos `host.docker.internal` com `extra_hosts: host-gateway`.

## 2) Subir stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## 3) Aplicar migrations Prisma

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec backend npm run prisma:migrate:deploy
```

## 4) Ver logs

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

## 5) Reiniciar backend

```bash
docker compose -f docker-compose.prod.yml restart backend
```

## 6) CloudPanel / Reverse Proxy

Aponte o domínio da API para a porta publicada do backend (ex.: `4000`) no servidor.

## 7) Healthcheck

- `GET /health`
- `GET /api/v1/health`
