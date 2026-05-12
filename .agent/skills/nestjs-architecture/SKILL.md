# NestJS Architecture

This skill defines the directory and file naming conventions for NestJS modules. Use these structures as the strict template for creating new modules.

## File Naming Terminology

All files must strictly follow the suffix pattern `[name].[type].ts` to identify their purpose instantly.

- **Core**: `*.core.ts` (Global configuration/setup, e.g., `swagger.core.ts`)
- **Functions**: `*.function.ts` (Pure utility functions, e.g., `date.function.ts`)
- **Models**: `*.dto.ts` or similar (Shared data models, e.g., `http-error.dto.ts` in `src/models`)
- **Tables**: `*.table.ts` (Drizzle schema definitions within `db/tables`, e.g., `user.table.ts`)
- **Repositories**: `*.repository.ts` (Data access layer, e.g., `user.repository.ts`)
- **Seeds**: `*.seed.ts` (Initial data scripts, e.g., `user.seed.ts`)

## 1. Basic Structure (No Database)

Use this structure for modules that do **not** require database persistence.

```text
src/
├── core/           # Global setup and configuration
├── functions/      # Shared standalone helper functions
├── models/         # Shared data models (e.g. error DTOs)
└── modules/        # Feature-specific logic
    └── [feature]/
        ├── dto/
        │   ├── create-[feature].dto.ts
        │   └── update-[feature].dto.ts
        ├── [feature].controller.ts
        ├── [feature].module.ts
        └── [feature].service.ts
```

## 2. Full Structure (With Database)

Use this structure for modules that require database interaction using Drizzle ORM.

### Root Files

```text
drizzle.config.ts
```

### Module Files

```text
src/
├── core/           # Global setup (e.g., swagger.core.ts)
├── functions/      # Shared helpers (e.g., date.function.ts)
├── models/         # Shared models (e.g., http-error.dto.ts)
└── modules/        # Domain features
    └── [feature]/
        ├── dto/
        │   ├── create-[feature].dto.ts
        │   ├── update-[feature].dto.ts
        │   └── filter-[feature].dto.ts
        ├── [feature].controller.ts
        ├── [feature].module.ts
        └── [feature].service.ts
```

### Database Files (Required)

```text
src/
├── db/
│   ├── tables/
│   │   └── [table-name].table.ts   # Schema definitions
│   ├── config.db.ts             # Database configuration
│   ├── connection.db.ts         # Connection logic
│   ├── create.db.ts             # Migration creation script
│   ├── reset.db.ts              # Database reset script
│   └── seed.db.ts               # Main seeder entry point
├── repositories/
│   └── [table-name].repository.ts  # Encapsulated DB queries
└── seeds/
    └── [table-name].seed.ts        # Module-specific seed data
```

## Path Aliases (tsconfig.json)

Ensure `tsconfig.json` is configured with these strict path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/core/*"],
      "@models/*": ["src/models/*"],
      "@db/*": ["src/db/*"],
      "@seeds/*": ["src/seeds/*"],
      "@modules/*": ["src/modules/*"],
      "@repositories/*": ["src/repositories/*"],
      "@functions/*": ["src/functions/*"]
    }
  }
}
```
