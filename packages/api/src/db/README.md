# ErrorHub Database Layer

This document describes the architecture of the database layer in the ErrorHub API.

## Overview

The database layer follows a clean architecture approach with clear separation of concerns:

1. **Entities**: TypeORM entities representing database tables
2. **DTOs**: Data Transfer Objects for API requests and responses
3. **Repositories**: Classes for database operations
4. **Validation**: Zod schemas for data validation

## Directory Structure

```
src/
├── db/
│   ├── entities/             # TypeORM entity definitions
│   ├── repositories/         # Repository classes
│   ├── migrations/           # Database migrations
│   ├── data-source.ts        # TypeORM configuration
│   └── index.ts              # Main exports
├── dto/                      # Data Transfer Objects
│   ├── error-code.dto.ts     # DTOs for error codes
│   ├── error-translation.dto.ts # DTOs for translations
│   └── error-category.dto.ts # DTOs for categories
└── routes/                   # API routes
```

## Entity Relationships

```
ErrorCategory 1 ──< ErrorCode 1 ──< ErrorTranslation
```

- An ErrorCategory can have multiple ErrorCodes
- An ErrorCode belongs to one ErrorCategory
- An ErrorCode can have multiple ErrorTranslations (one per language)
- An ErrorTranslation belongs to one ErrorCode

## Database Operations

All database operations are handled through repository classes:

- **ErrorCodeRepository**: CRUD operations for error codes
- **ErrorTranslationRepository**: CRUD operations for translations
- **ErrorCategoryRepository**: CRUD operations for categories

## Data Validation

Input validation is performed using Zod schemas defined in the DTO files. Each route handler validates incoming data before processing it.

## Migration

The database schema is managed through TypeORM migrations. To generate a new migration:

```
npx typeorm migration:generate -d ./src/db/data-source.ts -n MigrationName
```

To run migrations:

```
npx typeorm migration:run -d ./src/db/data-source.ts
```

## Best Practices

1. Always use repositories for database operations
2. Validate all input data using DTOs
3. Handle all potential null values
4. Use migrations for schema changes in production
5. Keep business logic out of repositories
6. Use relations sparingly in queries to avoid performance issues 