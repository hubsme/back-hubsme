# Modules Rules

Este archivo define la estructura y reglas para los módulos de negocio en `src/modules`.

## 1. Estructura de Directorios

Cada entidad o funcionalidad principal tiene su propio directorio bajo `src/modules`.

```
src/modules/admin/user/
├── dto/
│   ├── user-create.dto.ts  # DTO para crear
│   ├── user-update.dto.ts  # DTO para actualizar (PartialType)
│   ├── user-list.dto.ts    # DTOs para filtros y respuesta listada (Pagination)
│   └── user-result.dto.ts  # DTO de respuesta completa de la entidad
├── user.controller.ts
├── user.module.ts
└── user.service.ts
```

## 2. Convenciones de Nomenclatura

- **Directorio**: kebab-case (ej. `user-profile`).
- **Archivos**: `[nombre].type.ts` (ej. `user-profile.controller.ts`).
- **Clases**: PascalCase (ej. `UserProfileController`, `UserProfileService`).

## 3. Componentes del Módulo

### Controller (`.controller.ts`)

- **Decorador**: `@Controller('admin/nombre-ruta')` (usar prefijo `admin/` para rutas protegidas).
- **Inyección**: Inyecta el Servicio correspondiente.
- **Autenticación**: Todos los controladores en `src/modules/admin` deben estar protegidos con JWT.
- **DTOs**:
  - Usa `[Entity]CreateDto` para `@Body()` en POST.
  - Usa `[Entity]UpdateDto` para `@Body()` en PATCH/PUT.
  - Usa `[Entity]ListFiltersDto` para `@Query()` en GET (findAll).
- **Swagger**: Debe incluir decoradores `@ApiTags`, `@ApiOperation`, `@ApiOkResponse`, `@ApiBearerAuth`.
- **Endpoints**:
  - `GET /find-all`: Usa `findAllPaginated` del servicio.
  - `GET /find-one/:id`: Retorna `[Entity]ResultDto`.
  - `POST /create`: Retorna `[Entity]ResultDto`.
  - `PATCH /update/:id`: Retorna `[Entity]ResultDto`.
  - `DELETE /delete/:id`: Retorna `[Entity]ResultDto` (logical delete).

#### Autenticación JWT en Controladores

Todos los controladores bajo `src/modules/admin` deben implementar autenticación JWT:

```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';

@ApiTags('entity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/entity')
export class EntityController {
  // ... métodos
}
```

**Decoradores requeridos:**

- `@ApiBearerAuth()`: Documenta en Swagger que el endpoint requiere autenticación Bearer.
- `@UseGuards(JwtAuthGuard)`: Protege todas las rutas del controlador con JWT.
- `@Controller('admin/entity')`: Prefijo `admin/` para organizar rutas protegidas.

### Service (`.service.ts`)

- **Decorador**: `@Injectable()`.
- **Inyección**: Inyecta el **Repositorio** correspondiente (`@repositories/[name].repository`).
- **Lógica**:
  - Implementa `findAllPaginated(filters: [Entity]ListFiltersDto)`.
  - Delega el acceso a datos al repositorio.
  - No debe contener lógica de acceso a base de datos directa (query builders, etc.).

### Module (`.module.ts`)

- **Decorador**: `@Module()`.
- **Controllers**: Registra el controlador.
- **Providers**: Registra el servicio y el repositorio necesario.

### DTOs (`dto/`)

- **Nomenclatura Archivos**: `[entidad]-[acción].dto.ts` (ej. `meeting-create.dto.ts`).
- **Nomenclatura Clases**: `[Entity][Action]Dto` (ej. `MeetingCreateDto`).
- **Estándar de DTOs**:
  1.  **`[entidad]-create.dto.ts`**: Campos necesarios para creación.
  2.  **`[entidad]-update.dto.ts`**: Extiende de `Create` usando `PartialType`.
  3.  **`[entidad]-list.dto.ts`**: Contiene `[Entity]ListFiltersDto` (filtros + paginación) y `[Entity]ListDto` (estructura de respuesta `data` + `total`).
  4.  **`[entidad]-result.dto.ts`**: Representación completa de la entidad para respuestas (findOne, create, update response).
- **Validación**: Usa decoradores de `class-validator` (`@IsString`, `@IsNumber`, etc.).
- **Swagger**: `@ApiProperty()` o `@ApiPropertyOptional()` en cada campo.

#### Manejo de Enums en DTOs

Los enums deben importarse desde la tabla correspondiente y seguir este patrón:

**Imports necesarios:**

```typescript
import { entityEnumName } from '@db/tables/entity.table';
```

**En `[entidad]-create.dto.ts`:**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { entityEnumName, EntityDTO } from '@db/tables/entity.table';

export class EntityCreateDto implements Omit<EntityDTO, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
  @ApiProperty({
    enum: entityEnumName.enumValues,
    default: entityEnumName.enumValues[0],
    description: 'Field description',
  })
  @IsNotEmpty()
  @IsEnum(entityEnumName.enumValues)
  fieldName: (typeof entityEnumName.enumValues)[number];
}
```

**En `[entidad]-list.dto.ts` (filtros):**

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { entityEnumName } from '@db/tables/entity.table';

export class EntityListFiltersDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: entityEnumName.enumValues,
    description: 'Filter by field',
  })
  @IsEnum(entityEnumName.enumValues)
  @IsOptional()
  fieldName?: (typeof entityEnumName.enumValues)[number];
}
```

**En `[entidad]-result.dto.ts`:**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Entity, entityEnumName } from '@db/tables/entity.table';

export class EntityResultDto implements Entity {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: entityEnumName.enumValues })
  fieldName: (typeof entityEnumName.enumValues)[number];
}
```

**Reglas importantes:**

- Siempre importar el enum desde `@db/tables/[entity].table`.
- Usar `enumName.enumValues` para acceder a los valores del enum.
- Tipo: `(typeof enumName.enumValues)[number]` para type safety.
- En filtros opcionales: usar `@ApiPropertyOptional()` y `@IsOptional()` al final.
- En campos requeridos: usar `@ApiProperty()` y `@IsNotEmpty()`.
- Orden de decoradores en filtros: `@Type()`, validadores, `@IsOptional()` al final.

#### Estructura Completa de List DTOs

El archivo `[entidad]-list.dto.ts` debe contener **3 clases**:

1. **`[Entity]ListFiltersDto`**: Filtros de búsqueda y paginación
2. **`[Entity]ListItemDto`**: Estructura de cada item en la lista (versión resumida)
3. **`PaginationMetaDto`**: Metadata de paginación (reutilizable)
4. **`[Entity]ListDto`**: Respuesta completa con data y meta

**Ejemplo completo:**

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

// 1. Filtros de búsqueda y paginación
export class EntityListFiltersDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsString()
  @IsOptional()
  search?: string;
}

// 2. Estructura de cada item (versión resumida para listas)
export class EntityListItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Entity Name' })
  name: string;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  createdAt: Date;
}

// 3. Metadata de paginación (reutilizable en todos los módulos)
export class PaginationMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;
}

// 4. Respuesta completa
export class EntityListDto {
  @ApiProperty({ type: [EntityListItemDto] })
  data: EntityListItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
```

**Implementación en el Service:**

```typescript
async findAllPaginated(filters: EntityListFiltersDto) {
  const { page, limit, ...rest } = filters;
  const { data, total } = await this.entityRepository.findAllPaginated(page, limit, rest);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
  };
}
```

**Respuesta esperada:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Entity Name",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## 4. Ejemplo de Creación

Para crear un nuevo módulo "Order":

1.  Crear carpeta `src/modules/order`.
2.  Crear `src/modules/order/dto` con sus 4 archivos DTO estándar.
3.  Crear `src/modules/order/order.controller.ts`.
4.  Crear `src/modules/order/order.service.ts`.
5.  Crear `src/modules/order/order.module.ts`.
6.  Registrar `OrderModule` en `src/app.module.ts`.

## 5. Múltiples Entidades Relacionadas en un Módulo

Cuando tienes entidades estrechamente relacionadas (ej. `pyme-consultant-match` y `pyme-consultant-message`), puedes agruparlas en un mismo módulo para mantener la cohesión del dominio.

Ejemplo en Hubsme: el módulo `pyme` expone endpoints de la PYME y también los flujos de contacto con consultores:

- `POST /admin/pyme/contact-consultant` - Contactar consultor.
- `GET /admin/pyme/consultant-contacts` - Listar contactos.
- `PATCH /admin/pyme/accept-consultant-contact` - Aceptar contacto.
- `PATCH /admin/pyme/reject-consultant-contact` - Rechazar contacto.
- `GET /admin/pyme/consultant-messages` - Listar mensajes.
- `POST /admin/pyme/send-consultant-message` - Enviar mensaje.

El servicio debe inyectar los repositorios relacionados y mantener la regla de capas: la lógica queda en service, el acceso a datos queda en repository y el controller solo enruta/documenta.

### 5.6 Ventajas de este Enfoque

✅ **Cohesión del dominio**: Entidades relacionadas permanecen juntas
✅ **Menos módulos**: Evita proliferación innecesaria de módulos
✅ **Rutas organizadas**: El prefijo `type/` mantiene claridad en los endpoints
✅ **Mantenibilidad**: Cambios en el dominio se hacen en un solo lugar
✅ **Swagger organizado**: Todos los endpoints aparecen bajo el mismo tag

### 5.7 Cuándo Usar este Patrón

Usa múltiples entidades en un módulo cuando:

- Las entidades están **estrechamente relacionadas** (ej. `pyme-consultant-match` y `pyme-consultant-message`)
- Una entidad es **dependiente** de la otra (ej. `diagnostic` y `diagnostic-document`)
- Comparten **lógica de negocio** común
- Forman parte del **mismo contexto de dominio**

**No uses este patrón** cuando las entidades son independientes o pertenecen a diferentes contextos de negocio.
