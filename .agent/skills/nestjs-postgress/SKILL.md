---
name: nestjs-postgress
description: |
  ESPAÑOL - Guía para CONFIGURAR PostgreSQL y DRIZZLE ORM.
  Usa esta skill cuando el usuario pida: configurar base de datos, conexión a postgres,
  setup de drizzle, crear migraciones, ejecutar seeds, resetear base de datos,
  crear tablas iniciales, configurar pool de conexiones, habilitar extensiones,
  scripts de base de datos, o cualquier tarea relacionada con la infraestructura
  y configuración inicial de PostgreSQL con Drizzle ORM.
  Incluye: connection, config, create, reset, y seed scripts.
---

# NestJS PostgreSQL & Drizzle Setup

This skill configures the database layer using Drizzle ORM and PostgreSQL.

## 1. Install Dependencies

```bash
npm install drizzle-orm pg dotenv
npm install -D drizzle-kit @types/pg
```

## 2. Database Configuration

Create the following files in `src/db/` to manage connection and scripts.

### Configuration

**File**: `src/db/config.db.ts`

```typescript
import { config } from 'dotenv';

config();

export const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false, // Disable SSL for local development
};
```

### Connection

**File**: `src/db/connection.db.ts`

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { dbConfig } from '@db/config.db';

// Import your tables here
// import { user } from '@db/tables/user.table';

const pool = new Pool(dbConfig);

const schema = {
  // user,
};

export const database = drizzle(pool, { schema });
```

## 3. Management Scripts

### Create Database & Tables

**File**: `src/db/create.db.ts`

```typescript
import { execSync } from 'child_process';
import { Client } from 'pg';
import { dbConfig } from './config.db';

async function createDatabase() {
  const { database, ...postgresConfig } = dbConfig;
  const client = new Client({ ...postgresConfig, database: 'postgres' });

  try {
    await client.connect();
    const result = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [database]);

    if (result.rowCount === 0) {
      console.log(`Creating database '${database}'...`);
      await client.query(`CREATE DATABASE "${database}"`);
      console.log(`✅ Database created.`);
    } else {
      console.log(`Database '${database}' already exists.`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function enableExtensions() {
  const { database, ...postgresConfig } = dbConfig;
  const client = new Client({ ...postgresConfig, database });

  try {
    await client.connect();
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    console.log("✅ Extension 'pg_trgm' enabled.");
  } catch (error) {
    console.error('❌ Error enabling extensions:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function createTables() {
  try {
    await createDatabase();
    await enableExtensions();
    execSync('npx drizzle-kit push --config=drizzle.config.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('✅ Tables pushed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables.');
    process.exit(1);
  }
}

createTables();
```

### Reset Database

**File**: `src/db/reset.db.ts`

```typescript
import { sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { dbConfig } from '@db/config.db';

async function reset() {
  try {
    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(dbConfig.host);

    if (!isLocalhost) {
      console.error('❌ Reset allowed only on localhost.');
      process.exit(1);
    }

    console.log('🗑️  Dropping all tables...');
    await database.execute(sql`DROP SCHEMA public CASCADE`);
    await database.execute(sql`CREATE SCHEMA public`);

    console.log('✅ Database reset complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

reset();
```

### Seeding Entry Point

**File**: `src/db/seed.db.ts`

```typescript
// import { seedUsers } from '@seeds/user.seed';

async function seed() {
  try {
    console.log('🚀 Starting database seeding...');

    // Execute seeds in order of dependency
    // await seedUsers();

    console.log('\n✨ Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
```
