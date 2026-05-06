# Core Module Rules

Este archivo define las reglas para la implementación y mantenimiento del directorio `src/core` en el proyecto **backend-cachorros**.

## 1. Propósito General

El directorio `src/core` está destinado a **configuraciones globales** y **lógica de arranque** (bootstrapping) de la aplicación NestJS. Su objetivo principal es mantener el archivo `main.ts` limpio y modular, delegando configuraciones específicas (como Swagger, Pipes globales, CORS, etc.) en archivos dedicados.

## 2. Convenciones de Archivos

- **Sufijo**: Todos los archivos deben terminar en `.core.ts` para distinguirlos fácilmente como archivos de configuración del núcleo.
- **Formato**: `[funcionalidad].core.ts`.
- **Ubicación**: Directamente en la raíz de `src/core` (salvo que la complejidad justifique subdirectorios).

### Ejemplos existentes:

- `swagger.core.ts`: Configuración de Open API / Swagger.
- `transformer.core.ts`: Configuración global de pipes de validación y transformación.

## 3. Convenciones de Código

### Funciones de Configuración

- Cada archivo debe exportar una **función principal** encargada de la configuración.
- **Nomenclatura**: `setup[Funcionalidad]`.
- **Firma**: Debe aceptar la instancia de la aplicación (`app: INestApplication`) como argumento principal.

```typescript
// Ejemplo: src/core/cors.core.ts
import { INestApplication } from "@nestjs/common";

export function setupCors(app: INestApplication) {
  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  });
}
```

### Implementación

- **Dependencias**: Usa imports de `@nestjs/common` o `@nestjs/core` para tipos como `INestApplication`.
- **Pureza**: Mantén las funciones enfocadas en una sola responsabilidad (ej. solo configurar Swagger, solo configurar Pipes).

## 4. Flujo de Trabajo para Nueva Funcionalidad

Si necesitas agregar una nueva configuración global (ej. Seguridad con Helmet, Compresión, Versionado):

1.  Crea un archivo nuevo en `src/core` con el nombre `[funcionalidad].core.ts`.
2.  Define y exporta la función `setup[Funcionalidad](app: INestApplication)`.
3.  Implementa la lógica necesaria dentro de esa función.
4.  Importa y llama a esta función en `src/main.ts` antes de `app.listen()`.

## 5. Ejemplo Completo (Referencia)

**src/core/transformer.core.ts**

```typescript
import { INestApplication, ValidationPipe } from "@nestjs/common";

export function setupTransformer(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
    })
  );
}
```
