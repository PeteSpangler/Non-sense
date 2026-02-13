# Highwood Emissions Monitoring

A Next.js application for monitoring methane emissions with PostgreSQL and Prisma.

## Prerequisites

- Docker
- Docker Compose

## Quick Start (Docker)

```bash
docker compose up --build

# Or run in detached mode
docker compose up -d --build
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Development Commands

```bash
# Reset and reseed the database
docker compose exec app npm run db:reset

# Run migrations only
docker compose exec app npx prisma migrate deploy
```

## Local Development (without Docker)

```bash
npm install

npx prisma migrate deploy
npx prisma db seed

npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Testing

```bash
npm test

npm test -- --watch
```

## Project Structure

- `src/app/` - Next.js pages
- `src/lib/` - Shared utilities, API calls, types, validators
- `prisma/` - Database schema and seed script
- `test/` - Test files
