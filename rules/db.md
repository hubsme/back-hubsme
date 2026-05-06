# Database Rules

Este archivo define la estructura y reglas de implementación para la capa de datos en `src/db`.

## 1. Estructura del Directorio

El directorio `src/db` centraliza toda la lógica relacionada con la base de datos:

- **`config.db.ts`**: Configuración de conexión (lee variables `DB_*` del `.env`).
- **`connection.db.ts`**: Inicializa el pool de PostgreSQL y la instancia de Drizzle.
- **`tables/`**: Contiene la **definición de esquemas** (modelos) de Drizzle.
- **Scripts**: `create.db.ts`, `reset.db.ts`, `seed.db.ts` para tareas administrativas.

## 2. Configuración y Conexión

La conexión se realiza utilizando `drizzle-orm/node-postgres` y `pg`.

- La instancia exportada `database` en `connection.db.ts` debe ser usada para cualquier consulta en Repositorios o Seeds.
- **Schema**: La conexión carga todos los esquemas definidos en `tables/` para habilitar el tipado y las consultas `query`.

## 3. Definición de Modelos (Tablas)

Los modelos se ubican en `src/db/tables`.
**Convención de Nomenclatura Estricta**:

Todas las tablas, columnas, archivos y códigos deben estar escritos estrictamente en **INGLÉS**.

### 1. Tablas

- **Variable Exportada**: camelCase, **Singular** (ej. `user`, `bath`).
- **Nombre en DB (`pgTable`)**: snake_case, **Singular** (ej. `user`, `bath`).
- **Archivo**: kebab-case, Singular + `.table.ts` (ej. `user.table.ts`).

### 2. Enums

- **Variable Exportada**: camelCase, NombreTablaSingular + Propiedad + `Enum` (ej. `userStatusEnum`, `customerTypeEnum`).
- **Nombre en DB (`pgEnum`)**: snake*case, nombre_tabla_singular + `*`+ propiedad_snake (ej.`user_status`, `customer_type`).

### 3. Columnas

- **Keys del Objeto**: camelCase (ej. `firstName`).
- **Nombre en DB**: snake_case (ej. `first_name`).
- **Foreign Keys**: camelCase (ej. `userId`) mapeado a snake_case (`user_id`).
- **Control de Borrado**: Todas las tablas deben incluir `deletedAt` para eliminar lógicamente (soft delete).

### Estructura de un Modelo

```typescript
import { pgTable, serial, text, timestamp, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 1. Definición de Enum (si aplica)
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive']);

// 2. Definición de Tabla (Singular y en Inglés)
export const user = pgTable(
  'user',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    status: userStatusEnum('status').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'), // Soft Delete
  },
  (t) => [
    index('user_name_idx').using('gin', t.name.op('gin_trgm_ops')), // Búsqueda rápida
    uniqueIndex('user_name_unique_active_idx')
      .on(t.name)
      .where(sql`${t.deletedAt} IS NULL`), // Unique con soft delete
    index('user_created_at_idx').on(t.createdAt), // Para ordenamiento
  ],
);

// 3. Inferencia de Tipos
export type User = typeof user.$inferSelect; // Tipo de selección
export type UserDTO = typeof user.$inferInsert; // Tipo de inserción
```

### 4. Directrices de Indexación (Indexing)

El rendimiento es clave. Se deben definir índices explícitos en el callback de `pgTable` (segundo argumento).

1.  **Claves Foráneas (FK)**:

    - Postgres **NO** indexa FKs automáticamente.
    - **Regla**: Indexar SIEMPRE columnas `_id` que se usen en JOINs o filtros (ej. `customerId`, `breedId`).
    - `index('table_column_idx').on(t.columnId)`

2.  **Búsqueda y Ordenamiento**:

    - **Fechas**: Indexar `createdAt` para ordenamientos cronológicos (`ORDER BY created_at`).
    - **Texto/Búsqueda**: Usar índices **GIN** con `gin_trgm_ops` para búsquedas parciales (`ILIKE`, `%term%`) en nombres o descripciones.
    - **Arrays**: Usar índices **GIN** para columnas tipo array.

3.  **Restricciones Únicas (Unique) con Soft Delete**:
    - Los índices únicos simples chocarán con el "Soft Delete" (ej. no podrías crear un usuario con el mismo email si el anterior fue borrado lógicamente pero sigue en la DB).
    - **Solución**: Usar `uniqueIndex` parcial con `where`.
    - `uniqueIndex('idx_name').on(t.col).where(sql\`${t.deletedAt} IS NULL\`)`

#### Ejemplo Completo con Índices:

```typescript
import { pgTable, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const user = pgTable(
  'user',
  {
    // ... columnas
    email: text('email').notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (t) => [
    // FKs y Orden
    index('user_created_at_idx').on(t.createdAt),

    // Búsqueda Texto (Requiere extensión pg_trgm instalada)
    index('user_name_idx').using('gin', t.name.op('gin_trgm_ops')),

    // Unique compatible con Soft Delete
    uniqueIndex('user_email_unique_active_idx')
      .on(t.email)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);
```

## 4. Scripts y Comandos

Los scripts se ejecutan vía `npm run` (definidos en package.json) y usan `ts-node` para ejecutar los archivos en `src/db`.

| Comando             | Archivo        | Acción                                                            |
| :------------------ | :------------- | :---------------------------------------------------------------- |
| `npm run db:create` | `create.db.ts` | Ejecuta `drizzle-kit push` para sincronizar el esquema con la DB. |
| `npm run db:reset`  | `reset.db.ts`  | **Destructivo**: Elimina el esquema `public` y lo recrea.         |
| `npm run db:seed`   | `seed.db.ts`   | Ejecuta la secuencia de seeds definida.                           |

## 5. Flujo de Trabajo

1.  **Crear nueva tabla**:
    - Crear `src/db/tables/[nombre].table.ts`.
    - Definir `pgTable` y tipos.
    - Exportar en `src/db/connection.db.ts` dentro del objeto `schema`.
2.  **Aplicar cambios**:
    - Ejecutar `npm run db:create` (push).
3.  **Resetear (Dev)**:
    - `npm run db:reset` seguido de `npm run db:create` y `npm run db:seed`.
