import { config } from 'dotenv';

// Load environment variables for testing
config();

// Set test database URL if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://user:password@localhost:5432/supply_chain_test?schema=public&connection_limit=20&pool_timeout=10';
}

// Set other required environment variables
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key';
}

if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = '24h';
}
