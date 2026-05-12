# AI Rules & General Guidelines

Este archivo define las reglas generales que la IA debe seguir al generar código o responder consultas en este proyecto.

## 1. Principios Generales

- **Framework**: El proyecto utiliza **NestJS** (v11) como framework principal. Sigue estrictamente el estilo y las convenciones de NestJS (Inyección de Dependencias, Decoradores, Módulos).
- **ORM**: Utilizamos **Drizzle ORM** con PostgreSQL. **No** uses TypeORM ni Prisma a menos que se indique explícitamente una migración.
- **Lenguaje**: Todo el código debe ser **TypeScript**.
- **Path Aliases**: Úsalos siempre que sea posible según `tsconfig.json` y `package.json` (ej. `@modules/*`, `@core/*`, `@db/*`, `@models/*`).

## 2. Pautas de Implementación

- **Rutas Absolutas**: Al usar herramientas de sistema de archivos, usa siempre rutas absolutas.
- **Validación**: Usa `class-validator` y `class-transformer` en los DTOs.
- **Documentación**: Todos los controladores deben tener decoradores de `@nestjs/swagger` (`@ApiTags`, `@ApiOperation`, `@ApiResponse`).

## 3. Comandos Principales

Estos son los comandos clave definidos en `package.json`:

| Comando                  | Descripción                                                             |
| :----------------------- | :---------------------------------------------------------------------- |
| `npm run start:dev`      | Inicia el servidor de desarrollo en modo watch.                         |
| `npm run build`          | Compila el proyecto para producción.                                    |
| `npm run lint`           | Ejecuta el linter (ESLint) y corrige errores automáticos.               |
| `npm run format`         | Formatea el código con Prettier.                                        |
| `npm run generate:types` | Genera tipos de API para el frontend (usando `swagger-typescript-api`). |

## 4. Reglas Imprescindibles para Cambios Backend

El backend está en etapa de producción. Cualquier cambio debe preservar datos y estructura existente.

### Comandos totalmente prohibidos para IA

No ejecutar bajo ninguna circunstancia:

- `npm run db:reset`: elimina todas las tablas de la base de datos.
- `npm run db:create`: crea/sincroniza toda la base de datos en base a las tablas declaradas.
- `npm run db:seed`: ejecuta inserts/seeds para las tablas.
- `npx drizzle-kit generate`: comando nativo de Drizzle; también queda prohibido.

### Comandos reservados solo para humanos

No ejecutar desde la IA:

- `npm run db:restore`: restaura la data desde un archivo `.sql`.
- `npm run db:backup`: genera un respaldo `.sql`.
- `npm run db:migrate`: aplica migraciones a la base de datos.

### Comando obligatorio permitido

- `npm run generate:types`: se debe ejecutar al final de cada cambio backend que afecte modelos, DTOs, interfaces o endpoints de API, para mantener actualizado `frontend-hubsme/src/api/backend.api.ts`.

### Capas backend

- `repository`: unica capa con conexion directa a base de datos, queries, inserts, updates y deletes.
- `service`: contiene logica de negocio y solo se conecta con repositories; nunca accede directo a la DB.
- `controller`: enruta endpoints y documenta modelos/DTOs. Cada DTO debe importarse; no declarar DTOs inline. Cada response debe delegar directo al service, sin logica de negocio.
