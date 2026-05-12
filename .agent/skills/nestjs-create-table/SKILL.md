---
name: nestjs-create-table
description: |
  ESPAÑOL - Guía para CREAR TABLAS, MODELOS y ENTIDADES de base de datos.
  Usa esta skill cuando el usuario pida: crear tabla, nuevo modelo, nueva entidad,
  agregar campo, crear repositorio, crear seed, definir esquema, foreign key,
  relaciones entre tablas, índices, enums, migraciones, o cualquier tarea
  relacionada con la estructura de la base de datos usando Drizzle ORM.
  Incluye: definición de esquemas, repositorios CRUD, y seeders.
---

# NestJS Table Creation Workflow

This skill details the process of adding a new database entity. The workflow consists of 4 steps:

1. **Define Schema** (Table)
2. **Create Repository** (Data Access)
3. **Create Seeder** (Initial Data)
4. **Register** (Connection & Main Seeder)

---

## 1. Define Schema (`src/db/tables/`)

### Intermediate Table (Indexes & Enums)

Example: `user.table.ts`

```typescript
import { pgTable, serial, text, varchar, timestamp, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Define Enums first
export const userRoleEnum = pgEnum('user_role', ['admin', 'employee', 'viewer']);

export const user = pgTable(
  'user',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'), // Soft Delete column
    email: varchar('email', { length: 255 }).notNull(),
    password: text('password').notNull(),
    fullName: varchar('full_name', { length: 200 }).notNull(),
    role: userRoleEnum('role').default('viewer').notNull(),
    isActive: varchar('is_active', { length: 10 }).default('true').notNull(),
  },
  (t) => [
    // Performance Indexes
    index('user_full_name_idx').using('gin', t.fullName.op('gin_trgm_ops')),
    index('user_email_idx').on(t.email),

    // Conditional Unique Index (for Soft Deletes)
    uniqueIndex('user_email_unique_active_idx')
      .on(t.email)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type User = typeof user.$inferSelect;
export type UserDTO = typeof user.$inferInsert;
```

### Relational Table (Foreign Keys & Arrays)

Example: `pet.table.ts`

```typescript
import { pgTable, serial, varchar, integer, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { breed } from './breed.table';
import { customer } from './customer.table';

export const pet = pgTable(
  'pet',
  {
    id: serial('id').primaryKey(),
    // ... standard timestamp columns ...
    name: varchar('name', { length: 100 }).notNull(),
    photos: text('photos').array(), // Array type

    // Foreign Keys
    breedId: integer('breed_id')
      .notNull()
      .references(() => breed.id),
    customerId: integer('customer_id')
      .notNull()
      .references(() => customer.id, { onDelete: 'cascade' }),
  },
  (t) => [
    // Index Foreign Keys for performance
    index('pet_customer_id_idx').on(t.customerId),
  ],
);
```

---

## 2. Create Repository (`src/repositories/`)

The repository handles CRUD and complex queries like pagination.

Example: `user.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { eq, ilike, or, and, isNull, count, desc, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { user, UserDTO, userRoleEnum } from '@db/tables/user.table';

@Injectable()
export class UserRepository {
  // Parsing Helper for Enums
  async findAllPaginated(page: number = 1, limit: number = 10, filters?: { search?: string; role?: string; isActive?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [isNull(user.deletedAt)]; // Always exclude deleted

    if (filters?.search) {
      const term = filters.search.trim();
      conditions.push(or(ilike(user.fullName, `%${term}%`), ilike(user.email, `%${term}%`)));
    }

    if (filters?.role) {
      // Cast enum to text for comparison if needed
      conditions.push(eq(sql`${user.role}::text`, filters.role));
    }

    const whereClause = and(...conditions);

    const [{ total }] = await database.select({ total: count() }).from(user).where(whereClause);
    const data = await database.select().from(user).where(whereClause).orderBy(desc(user.createdAt)).limit(limit).offset(offset);

    return { data, total: Number(total) };
  }

  async create(data: UserDTO) {
    const result = await database.insert(user).values(data).returning();
    return result[0];
  }

  // Implement update, delete (soft), findOne...
}
```

---

## 3. Create Seeder (`src/seeds/`)

Seeds must return the inserted data if other tables depend on them.

Example: `user.seed.ts`

```typescript
import { database } from '@db/connection.db';
import { user } from '@db/tables/user.table';
import * as bcrypt from 'bcrypt';

export async function seedUsers() {
  console.log('🌱 seeding users...');
  const password = await bcrypt.hash('123456', 10);

  // .returning() is CRITICAL for relations
  const inserted = await database
    .insert(user)
    .values([
      {
        email: 'admin@gmail.com',
        password,
        fullName: 'Admin User',
        role: 'admin',
      },
    ])
    .returning();

  console.log(`✅ ${inserted.length} users inserted.`);
  return inserted; // Return data for dependent seeds
}
```

---

## 4. Register

### A. Add to Connection (`src/db/connection.db.ts`)

Add the table to the schema object so Drizzle knows about it.

```typescript
const schema = {
  user,
  pet,
  // ...
};
```

### B. Add to Main Seeder (`src/db/seed.db.ts`)

Run the seed function in the correct order. Pass data if needed.

```typescript
import { seedUsers } from '@seeds/user.seed';
import { seedPets } from '@seeds/pet.seed';

async function seed() {
  // 1. Run independent seeds
  const users = await seedUsers();
  const customers = await seedCustomers();
  const breeds = await seedBreeds();

  // 2. Run dependent seeds (passing IDs/Objects)
  await seedPets(customers, breeds);
}
```
