# Prisma Database Setup

## Initial Setup

1. Make sure PostgreSQL is running (via Docker Compose or locally)
2. Copy `.env.example` to `.env` and configure your database URL
3. Run the initial migration:

```bash
npx prisma migrate dev --name init
```

## Common Commands

### Generate Prisma Client
```bash
npx prisma generate
```

### Create a new migration
```bash
npx prisma migrate dev --name <migration_name>
```

### Apply migrations in production
```bash
npx prisma migrate deploy
```

### Reset database (development only)
```bash
npx prisma migrate reset
```

### Open Prisma Studio (database GUI)
```bash
npx prisma studio
```

## Connection Pooling

The database connection is configured with:
- Maximum 20 connections (`connection_limit=20`)
- 10 second pool timeout (`pool_timeout=10`)

These parameters are set in the DATABASE_URL environment variable.
