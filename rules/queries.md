# Queries

El acceso de negocio a PostgreSQL se organiza en `src/queries/<tabla>/`.

- `<tabla>.query.ts`: una clase `<Tabla>Query` inyectable; operaciones de una sola tabla, sin JOIN ni imports de otras tablas.
- `<tabla>-join.query.ts`: una clase `<Tabla>JoinQuery` inyectable; solo SELECT con relaciones.
- Cada archivo contiene únicamente imports, decoradores y una clase. La configuración compartida pertenece a propiedades privadas de esa clase.
- Los métodos usan `database` directamente desde `@db/connection.db`.
- Las queries atómicas exponen `readonly transaction = transaction`, importada de la misma conexión. El service coordina `query.transaction(async () => ...)`, sin pasar la transacción como argumento a cada método.
- La conexión mantiene la transacción de la operación; los errores deben propagarse para conservar el rollback.
- Usar `typeof tabla.$inferInsert` y `typeof tabla.$inferSelect` donde se necesiten tipos. No crear aliases de filas en una capa adicional ni exportarlos desde las tablas.
- Conservar filtros de permisos, borrado lógico, paginación, bloqueos y escrituras condicionales.
- Usar `@TraceNode({ name: 'tabla.metodo', type: 'method' })` en cada método.
- Los controllers delegan al service; los services coordinan las queries sin ejecutar SQL directo.

Referencia: [Guía de Queries](https://docs.erixcel.com/desarrollo/nestjs/src/queries-guia).
