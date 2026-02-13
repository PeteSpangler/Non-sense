# Architecture Overview

## Technology Stack

- **Frontend**: Next.js 16 (App Router) with React
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Vitest with jsdom for unit tests, React Testing Library for component tests
- **Containerization**: Docker with docker-compose

## Key Technical Decisions

### 1. Database Schema

**Decision**: Separate `Site` and `EmissionsData` tables with a one-to-many relationship.

```prisma
model Site {
  id               Int             @id @default(autoincrement())
  name             String
  emission_limit   Float           @default(0)
  metadata         Json            @default("{}")
  total_emissions_to_date Float    @default(0)
  emissions        EmissionsData[]
}

model EmissionsData {
  id             Int      @id @default(autoincrement())
  site           Site     @relation(...)
  siteId         Int
  emissionsdata  Float
  reading_date   DateTime
  idempotencyKey String?
}
```

**Trade-offs**:
- **Pros**: Normalized data, easy aggregation queries, supports multiple readings per site
- **Cons**: Requires joins for reporting queries

### 2. Prisma Client Generation

**Decision**: Generate Prisma client at container runtime rather than build time.

**Reason**: The volume mount in docker-compose overwrites the generated files during development. Running `prisma generate` in the startup command ensures the client matches the schema.

**Trade-offs**:
- **Pros**: Works with volume mounts, always uses latest schema
- **Cons**: Slightly slower startup time (~5-10s)

### 3. Testing Strategy

**Decision**: Use Vitest with jsdom for unit tests and React Testing Library for component tests.

**Structure**:
- `test/utils.test.ts` - Utility functions (CSV parsing, calculations)
- `test/validators.test.ts` - Form validation logic
- `test/api.test.ts` - API functions with mocked fetch
- `test/types.test.ts` - TypeScript type validation
- `test/components.test.tsx` - React component rendering

**Trade-offs**:
- **Pros**: Fast execution, good coverage of pure functions, component tests catch rendering issues
- **Cons**: Mocking fetch in jsdom is tricky, some async tests flaky

### 4. CSV Parsing

**Decision**: Use PapaParse library for CSV parsing.

**Trade-offs**:
- **Pros**: Robust, handles edge cases, widely used
- **Cons**: Extra dependency

### 5. Docker Setup

**Decision**: Single docker-compose file with two services (postgres + app).

**Key challenge solved**: The database must be seeded on startup. We use `prisma migrate reset --force` in the Dockerfile CMD to ensure clean state on each startup.

**Trade-offs**:
- **Pros**: Simple, reproducible, automatic seeding
- **Cons**: Data lost on every restart (acceptable for development)

### 6. Code Organization

**Decision**: Shared library in `src/lib/` separated by concern:

- `types.ts` - TypeScript interfaces
- `api.ts` - Server API calls
- `utils.ts` - Pure utility functions (parsing, calculations)
- `validators.ts` - Form validation logic

**Trade-offs**:
- **Pros**: Clear separation of concerns, easy to test pure functions
- **Cons**: More files to navigate

## API Design

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/sites` | List all sites with latest emission |
| POST | `/api/sites` | Create new site |
| GET | `/api/sites/:id/metrics` | Get site metrics (totals, compliance) |
| GET | `/api/ingest` | List sites for ingestion dropdown |
| POST | `/api/ingest` | Ingest emissions data |

### Idempotency

The `/api/ingest` endpoint supports idempotency via `X-Idempotency-Key` header to prevent duplicate insertions on retry.

## Future Considerations

1. **Production**: Switch from `migrate reset` to `migrate deploy` for production
2. **Authentication**: Add auth layer for multi-tenant support
3. **Real-time**: Consider WebSockets for live emission updates
4. **Analytics**: Add historical trending and charts
