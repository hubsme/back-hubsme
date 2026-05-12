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

- `repository`: unica capa con conexion directa a base de datos, queries, inserts, updates y deletes.
- `service`: solo se conecta con repositories y contiene logica de negocio; nunca accede directo a la DB.
- `controller`: solo enruta endpoints y documenta modelos/DTOs.
- En controllers, cada DTO debe importarse. No declarar DTOs o tipos inline.
- Cada response del controller debe delegar directo al service, sin logica de negocio.
