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
