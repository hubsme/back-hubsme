---
trigger: always_on
---

# REGLAS DEL PROYECTO - Backend Hubsme

## 🌐 IDIOMA

- Todo el código, comentarios, nombres de variables, columnas de base de datos,
  y mensajes deben estar en **ESPAÑOL**.
- Excepción: Imports, decoradores de NestJS, y nombres técnicos de librerías.

## 🏛️ ARQUITECTURA DE CAPAS

El proyecto sigue una arquitectura de 4 capas estrictas:

1. **Tabla/Modelo** (`src/db/tables/*.table.ts`)

   - Define esquema con Drizzle ORM (pgTable, pgEnum)
   - Exporta variables: `tabla` (pgTable), `tablaDTO` (inferInsert), `tablaType` (inferSelect) si aplica.
   - Incluye soft delete: `eliminadoEn: timestamp('eliminado_en')`
   - Timestamps: `creadoEn`, `actualizadoEn`

2. **Repositorio** (`src/repositories/*.repository.ts`)

   - Único lugar para acceso a base de datos
   - Implementa CRUD + paginación con filtros
   - Siempre filtra por `isNull(tabla.eliminadoEn)`
   - Inyectable con `@Injectable()`

3. **Servicio** (`src/modules/**/*.service.ts`)

   - Lógica de negocio y transformación de datos
   - Inyecta el Repository, NUNCA accede a DB directo
   - Lanza excepciones HTTP (`NotFoundException`, etc.)

4. **Controlador** (`src/modules/**/*.controller.ts`)
   - Solo rutas y documentación Swagger
   - Delega TODO al Service (máximo 1 línea por método)
   - NUNCA usa `any` - siempre DTOs tipados
   - Decoradores: `@ApiTags`, `@ApiOperation`, `@ApiResponse`

## 📦 DTOs (Data Transfer Objects)

- `*-create.dto.ts` - implements `Omit<EntityDTO, 'id' | 'creadoEn' | 'actualizadoEn' | 'eliminadoEn'>`
- `*-update.dto.ts` - extends `PartialType(CreateDto)` (de @nestjs/swagger)
- `*-list.dto.ts` - Contiene: FiltersDto, ItemDto, PaginationMetaDto, ListDto
- `*-result.dto.ts` - Para respuestas de findOne (sin campos sensibles)
- SIEMPRE usar `@ApiProperty()` para documentación Swagger

## 🗄️ BASE DE DATOS (Drizzle ORM)

- Nombres de tablas y columnas en **snake_case español**
- Usar `pgEnum` para valores fijos (estados, tipos, roles)
- Índices GIN con `gin_trgm_ops` para búsqueda fuzzy
- Unique indexes con `.where(sql\`${t.eliminadoEn} IS NULL\`)`
- Foreign keys con `onDelete: 'cascade'` o `'restrict'` según el caso

## 📍 PATH ALIASES

Usar siempre los aliases definidos en tsconfig.json:

- `@core/*` → src/core/
- `@db/*` → src/db/
- `@repository/*` → src/repositories/
- `@module/*` → src/modules/
- `@seed/*` → src/seeds/
- `@common/*` → src/common/
- `@function/*` → src/functions/

## 🌱 SEEDS

- Ubicación: `src/seeds/*.seed.ts`
- Exportar función `async seedEntidad()`
- Retornar datos insertados con `.returning()` si hay dependencias
- Registrar en `src/db/seed.db.ts` en orden de dependencia

## 🛠️ COMANDOS SQL Y MIGRACIONES

- **Migraciones**: `src/db/migrations/[version]/vXXX_script.sql` (Ejecutar: `npm run db:migrate`)
- **Comandos**: `src/db/commands/[version]/script.sql` (Ejecutar: `npm run db:command`)
- Usar variable de entorno `DB_MIGRATE_VERSION` para apuntar a subcarpetas específicas.
- Scripts deben ser idempotentes o verificar existencia.

## ✅ CONVENCIONES DE CÓDIGO

- Inyección de dependencias: `private readonly nombreRepository: NombreRepository`
- Métodos de repositorio: `findAll`, `findAllPaginated`, `findOne`, `create`, `update`, `delete`.
- Paginación: recibe `page`, `limit`, `filters` → retorna `{ data, total }`
- Soft delete: actualizar `eliminadoEn` con timestamp, no borrar físicamente

## 🚫 PROHIBICIONES

- NO usar `any` en DTOs, controladores o servicios
- NO acceder a la base de datos desde servicios/controladores
- NO hacer lógica de negocio en controladores
- NO mezclar idiomas (todo español excepto términos técnicos)
- NO crear inline types en respuestas (siempre clases con @ApiProperty)
- NO ejecutar `npm run db:reset`
- NO ejecutar `npm run db:create`
- NO ejecutar `npm run db:seed`
- NO ejecutar `npx drizzle-kit generate`
- NO ejecutar `npm run db:restore`, `npm run db:backup` ni `npm run db:migrate`; estos comandos son solo para humanos

## ✅ COMANDO OBLIGATORIO PERMITIDO

- Ejecutar `npm run generate:types` al final de cada cambio backend que afecte modelos, DTOs, interfaces o endpoints de la API.
- Este comando actualiza el archivo autogenerado del frontend `frontend-hubsme/src/api/backend.api.ts`.

## 🧭 CAMBIOS DE BASE DE DATOS

- Si se modifica la base de datos, incluir siempre el archivo de migración manual.
- Revisar los archivos `.env` para identificar la versión exacta.
- Usar una nomenclatura similar a las migraciones existentes.
- La IA deja la migración lista para revisión, pero no la aplica.

## 📚 DOCUMENTACIÓN SWAGGER

- Cada controlador debe tener `@ApiTags('nombre-modulo')`
- Cada endpoint debe tener `@ApiOperation({ summary: '...' })`
- Responses documentados: `@ApiResponse({ status: 200, type: DtoClass })`
- Usar `@ApiBearerAuth()` en controladores protegidos
