import { PrismaClient } from '@prisma/client';

// Configure Prisma with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Connection pool configuration is handled via DATABASE_URL query parameters
// Example: postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10

export default prisma;
