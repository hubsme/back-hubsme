# Seeds Rules

Este archivo define las reglas para los scripts de populación de datos (seeds).

## 1. Ubicación

- **Scripts Individuales**: `src/seeds/[entidad].seed.ts`.
- **Orquestador**: `src/db/seed.db.ts`.

## 2. Convenciones

- **Archivo**: `[entidad].seed.ts` (kebab-case, singular).
- **Función Exportada**: `seed[EntidadPlural]` (camelCase, ej. `seedUsers`).

## 3. Implementación de un Seed

Cada archivo de seed debe exportar una función asíncrona que realice la inserción de datos.

- Importar `database` de `@db/connection.db`.
- Importar la tabla de `@db/tables/[entidad].table`.

```typescript
import { database } from "@db/connection.db";
import { roles } from "@db/tables/role.table";

export async function seedRoles() {
  const data = [
    { name: "admin", description: "Administrator" },
    { name: "user", description: "Standard User" },
  ];

  await database.insert(roles).values(data).onConflictDoNothing();
  console.log("✅ Roles seeded");
}
```

## 4. Orquestación

Para que un seed se ejecute, debe ser registrado en `src/db/seed.db.ts`.

1.  Importar la función: `import { seedRoles } from "@seeds/role.seed";`
2.  Llamarla dentro de la función `seed()` principal, respetando el orden de dependencias (Foreign Keys).

## 5. Ejecución

El comando para ejecutar todos los seeds es:

```bash
npm run db:seed
```

Este comando ejecuta `ts-node src/db/seed.db.ts`.
