# Desenvolvimento local (Docker)

## 1) Subir stack local

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

## 2) Rodar migrations

```bash
docker compose -f docker-compose.dev.yml exec backend npm run prisma:migrate:deploy
```

## 3) Seed opcional

```bash
docker compose -f docker-compose.dev.yml exec backend npm run seed
```

## 4) URLs

- API: `http://localhost:4000`
- Health: `http://localhost:4000/health`
- Versionada: `http://localhost:4000/api/v1/health`

## 5) Variáveis principais

- `DATABASE_URL=postgresql://appuser:Lenon323@postgres:5432/appdb?schema=public`
- `REDIS_URL=redis://redis:6379`
