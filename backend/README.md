# Backend Marima

## Requisitos
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

## Setup
1. Copie `.env.example` para `.env`.
2. Instale dependências:
   - `npm install`
3. Rode seed inicial:
   - `npm run seed`
4. Gere client e migrações Prisma:
   - `npm run prisma:generate`
   - `npm run prisma:migrate:dev`
5. Suba em desenvolvimento:
   - `npm run dev`

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run seed`
- `npm run prisma:generate`
- `npm run prisma:migrate:dev`
- `npm run prisma:migrate:deploy`

## API
Base URL: `http://localhost:4000/api/v1`
