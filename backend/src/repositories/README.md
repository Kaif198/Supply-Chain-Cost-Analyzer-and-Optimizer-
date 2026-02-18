# Repository Layer

This directory contains the data access layer for the Supply Chain Intelligence Platform. Each repository provides CRUD operations and business logic for interacting with the database.

## Repositories

### PremiseRepository
Manages premise (delivery location) data with the following features:
- CRUD operations for premises
- Austrian boundary validation (46.4°-49.0°N, 9.5°-17.2°E)
- Filtering by category and search by name
- Conditional deletion (prevents deletion if deliveries exist)
- Weekly demand validation (positive integers only)

### VehicleRepository
Manages vehicle fleet data with the following features:
- Read operations for all vehicles
- Update operations for cost parameters
- Validation for positive cost parameters
- Support for three vehicle types: Small Van, Medium Truck, Large Truck

### DeliveryRepository
Manages delivery records with the following features:
- Create and read operations
- Date range filtering
- Pagination support
- Vehicle and premise filtering

### RouteRepository
Manages optimized route data with the following features:
- Create and read operations with route stops
- Date range filtering
- Vehicle and mode filtering
- Cascade deletion of route stops

## Running Tests

The repository tests use property-based testing with fast-check to verify correctness properties across randomized inputs.

### Prerequisites

1. PostgreSQL 15+ running locally or accessible via network
2. Database created (e.g., `supply_chain_test`)
3. Environment variables configured

### Setup

1. Create a `.env` file in the backend directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/supply_chain_test?schema=public&connection_limit=20&pool_timeout=10"
JWT_SECRET="test-secret-key"
JWT_EXPIRES_IN="24h"
```

2. Run Prisma migrations to create the database schema:

```bash
npm run prisma:migrate
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

### Running Tests

Run all repository tests:

```bash
npm test -- repositories
```

Run specific repository tests:

```bash
npm test -- PremiseRepository.test.ts
npm test -- VehicleRepository.test.ts
```

### Property-Based Tests

The tests include the following correctness properties:

**PremiseRepository:**
- Property 32: Premise creation completeness
- Property 24: Austrian boundary validation
- Property 33: Premise filtering by category
- Property 34: Premise update persistence
- Property 35: Conditional premise deletion
- Property 36: Demand validation

**VehicleRepository:**
- Property 37: Vehicle parameter validation
- Property 38: Vehicle update persistence

Each property test runs with 20 iterations (reduced from 100 for database operations to improve test performance).

## Database Connection

The repositories use Prisma Client for database access. The connection is configured in `src/utils/prisma.ts` with:
- Connection pooling (max 20 connections)
- Automatic query logging in development mode
- Error logging in production mode

## Error Handling

All repositories throw descriptive errors for:
- Validation failures (invalid coordinates, negative values, etc.)
- Constraint violations (deleting premises with deliveries)
- Database connection issues
- Not found errors

## Usage Example

```typescript
import premiseRepository from './repositories/PremiseRepository';

// Create a new premise
const premise = await premiseRepository.create({
  name: 'Vienna Nightclub',
  category: 'nightclub',
  address: 'Stephansplatz 1, 1010 Vienna',
  latitude: 48.2082,
  longitude: 16.3738,
  elevation: 171,
  weeklyDemand: 500,
});

// Find all nightclubs
const nightclubs = await premiseRepository.findAll({
  category: 'nightclub',
});

// Update premise
const updated = await premiseRepository.update(premise.id, {
  weeklyDemand: 600,
});

// Delete premise (only if no deliveries)
await premiseRepository.delete(premise.id);
```
