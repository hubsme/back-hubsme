# Backend Agent Rules

Reglas clave e imprescindibles para cambios en `backend-hubsme`.

## Produccion y Base de Datos

- El backend esta en produccion: tratar cambios de base de datos y endpoints como sensibles.
- No ejecutar bajo ninguna circunstancia:
  - `npm run db:reset`
  - `npm run db:create`
  - `npm run db:seed`
  - `npx drizzle-kit generate`
- No ejecutar porque son solo para humanos:
  - `npm run db:restore`
  - `npm run db:backup`
  - `npm run db:migrate`
- Si cambian modelos, DTOs, interfaces o endpoints de API, ejecutar al final:
  - `npm run generate:types`
- Si hay cambios de base de datos, incluir migracion SQL manual, revisar `.env` para identificar la version exacta y seguir la nomenclatura existente. La IA deja la migracion lista, pero no la aplica.

## Arquitectura Backend

- `src/queries/<tabla>/<tabla>.query.ts`: operaciones atomicas de una sola tabla; sin JOIN ni imports de otras tablas.
- `src/queries/<tabla>/<tabla>-join.query.ts`: consultas de lectura con relaciones; nunca INSERT, UPDATE ni DELETE.
- Cada query contiene solo imports, decoradores y una clase `<Tabla>Query` o `<Tabla>JoinQuery`.
- Las queries usan `database` directamente y `readonly transaction = transaction` desde `@db/connection.db`; no reciben un executor como parámetro ni requieren una capa de modelos.
- Para tipos de filas e inserciones, usar `typeof tabla.$inferSelect` / `typeof tabla.$inferInsert` dentro de las queries; los services reutilizan las firmas de las queries o los DTO.
- `service`: contiene logica de negocio y coordina queries y transacciones; nunca ejecuta SQL directo ni accede a la conexion DB.
- `controller`: solo enruta endpoints y documenta DTOs.
- En controllers, cada DTO debe importarse. No declarar DTOs o tipos inline.
- Cada response del controller debe delegar directo al service, sin logica de negocio.
