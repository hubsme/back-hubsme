# Repositories Rules

Este archivo define las reglas para la implementación del patrón Repositorio en `src/repositories`.

## 1. Propósito

Los repositorios actúan como una capa de abstracción sobre Drizzle ORM.

- **Responsabilidad**: Único lugar donde se ejecutan consultas SQL/Drizzle (`select`, `insert`, `update`, `delete`, `etc`).
- **Interacción**: Son consumidos por los Servicios (`Services`), nunca directamente por los Controladores.

## 2. Convenciones de Nomenclatura

- **Archivo**: kebab-case, Singular + `.repository.ts` (ej. `user.repository.ts`).
- **Clase**: PascalCase, Singular + `Repository` (ej. `UserRepository`).
- **Decorador**: `@Injectable()` de `@nestjs/common`.

## 3. Implementación Estándar

### Dependencias

- Importar la instancia de base de datos directamente desde `@db/connection.db` (Singleton).
- Importar la tabla y el DTO desde `@db/tables/[entidad].table`.

### Template Base

```typescript
import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { database } from "@db/connection.db";
import { users, UserDTO } from "@db/tables/user.table";

@Injectable()
export class UserRepository {
  // GET ALL
  async findAll() {
    return await database.select().from(users);
  }

  // GET ONE
  async findOne(id: number) {
    const result = await database.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  // CREATE
  async create(data: UserDTO) {
    const result = await database.insert(users).values(data).returning();
    return result[0];
  }

  // UPDATE
  async update(id: number, data: Partial<UserDTO>) {
    const result = await database
      .update(users)
      .set({ ...data, updatedAt: new Date() }) // Actualizar timestamp automáticamente
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // DELETE
  async delete(id: number) {
    const result = await database
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
}
```

## 4. Retornos

- Los métodos que devuelven un solo registro (`findOne`, `create`, `update`, `delete`) deben devolver el objeto directo (`result[0]`), no un array.

## 5. Ubicación

Todos los archivos de repositorio deben residir en la raíz de `src/repositories`.
