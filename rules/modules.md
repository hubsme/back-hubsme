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

- **Nomenclatura Archivos**: `[entidad]-[acción].dto.ts` (ej. `bath-create.dto.ts`).
- **Nomenclatura Clases**: `[Entity][Action]Dto` (ej. `BathCreateDto`).
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

Cuando tienes entidades estrechamente relacionadas (ej. `bath` y `bath-type`), puedes agruparlas en un mismo módulo para mantener la cohesión del dominio.

### 5.1 Estructura de Directorios

```
src/modules/admin/bath/
├── dto/
│   ├── bath/                      # DTOs de la entidad principal
│   │   ├── bath-create.dto.ts
│   │   ├── bath-update.dto.ts
│   │   ├── bath-list.dto.ts
│   │   └── bath-result.dto.ts
│   └── bath-type/                 # DTOs de la entidad relacionada
│       ├── bath-type-create.dto.ts
│       ├── bath-type-update.dto.ts
│       ├── bath-type-list.dto.ts
│       └── bath-type-result.dto.ts
├── bath.controller.ts             # Controlador único con endpoints de ambas entidades
├── bath.service.ts                # Servicio único que maneja ambas entidades
└── bath.module.ts                 # Módulo que registra ambos repositorios
```

### 5.2 Implementación del Service

El servicio debe inyectar ambos repositorios y proporcionar métodos para cada entidad:

```typescript
import { Injectable } from '@nestjs/common';
import { BathRepository } from '@repositories/bath.repository';
import { BathTypeRepository } from '@repositories/bath-type.repository';
import { BathCreateDto } from './dto/bath/bath-create.dto';
import { BathUpdateDto } from './dto/bath/bath-update.dto';
import { BathListFiltersDto } from './dto/bath/bath-list.dto';
import { BathTypeCreateDto } from './dto/bath-type/bath-type-create.dto';
import { BathTypeUpdateDto } from './dto/bath-type/bath-type-update.dto';
import { BathTypeListFiltersDto } from './dto/bath-type/bath-type-list.dto';

@Injectable()
export class BathService {
  constructor(
    private readonly bathRepository: BathRepository,
    private readonly bathTypeRepository: BathTypeRepository,
  ) {}

  // Bath methods
  async findAllPaginated(filters: BathListFiltersDto) {
    const { page, limit, ...rest } = filters;
    const { data, total } = await this.bathRepository.findAllPaginated(page, limit, rest);

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

  findOne(id: number) {
    return this.bathRepository.findOne(id);
  }

  create(data: BathCreateDto) {
    return this.bathRepository.create(data);
  }

  update(id: number, data: BathUpdateDto) {
    return this.bathRepository.update(id, data);
  }

  delete(id: number) {
    return this.bathRepository.delete(id);
  }

  // Bath Type methods
  async findAllBathTypesPaginated(filters: BathTypeListFiltersDto) {
    const { page, limit, ...rest } = filters;
    const { data, total } = await this.bathTypeRepository.findAllPaginated(page, limit, rest);

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

  findOneBathType(id: number) {
    return this.bathTypeRepository.findOne(id);
  }

  createBathType(data: BathTypeCreateDto) {
    return this.bathTypeRepository.create(data);
  }

  updateBathType(id: number, data: BathTypeUpdateDto) {
    return this.bathTypeRepository.update(id, data);
  }

  deleteBathType(id: number) {
    return this.bathTypeRepository.delete(id);
  }
}
```

### 5.3 Implementación del Controller

El controlador agrupa los endpoints de ambas entidades usando prefijos de ruta:

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BathService } from './bath.service';
import { BathCreateDto } from './dto/bath/bath-create.dto';
import { BathUpdateDto } from './dto/bath/bath-update.dto';
import { BathListDto, BathListFiltersDto } from './dto/bath/bath-list.dto';
import { BathResultDto } from './dto/bath/bath-result.dto';
import { BathTypeCreateDto } from './dto/bath-type/bath-type-create.dto';
import { BathTypeUpdateDto } from './dto/bath-type/bath-type-update.dto';
import { BathTypeListDto, BathTypeListFiltersDto } from './dto/bath-type/bath-type-list.dto';
import { BathTypeResultDto } from './dto/bath-type/bath-type-result.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';

@ApiTags('bath')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/bath')
export class BathController {
  constructor(private readonly bathService: BathService) {}

  // Bath endpoints
  @Get('find-all')
  @ApiOperation({ summary: 'Get all baths paginated' })
  @ApiOkResponse({ type: BathListDto })
  findAll(@Query() filters: BathListFiltersDto) {
    return this.bathService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a bath by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Bath ID' })
  @ApiOkResponse({ type: BathResultDto })
  async findOne(@Param('id') id: string) {
    return await this.bathService.findOne(+id);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new bath' })
  @ApiOkResponse({ type: BathResultDto })
  create(@Body() createBathDto: BathCreateDto) {
    return this.bathService.create(createBathDto);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a bath' })
  @ApiParam({ name: 'id', type: 'number', description: 'Bath ID' })
  @ApiOkResponse({ type: BathResultDto })
  update(@Param('id') id: string, @Body() updateBathDto: BathUpdateDto) {
    return this.bathService.update(+id, updateBathDto);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Delete a bath' })
  @ApiParam({ name: 'id', type: 'number', description: 'Bath ID' })
  @ApiOkResponse({ type: BathResultDto })
  remove(@Param('id') id: string) {
    return this.bathService.delete(+id);
  }

  // Bath Type endpoints - Usar prefijo 'type/' para diferenciar
  @Get('type/find-all')
  @ApiOperation({ summary: 'Get all bath types paginated' })
  @ApiOkResponse({ type: BathTypeListDto })
  findAllBathTypes(@Query() filters: BathTypeListFiltersDto) {
    return this.bathService.findAllBathTypesPaginated(filters);
  }

  @Get('type/find-one/:id')
  @ApiOperation({ summary: 'Get a bath type by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Bath Type ID' })
  @ApiOkResponse({ type: BathTypeResultDto })
  async findOneBathType(@Param('id') id: string) {
    return await this.bathService.findOneBathType(+id);
  }

  @Post('type/create')
  @ApiOperation({ summary: 'Create a new bath type' })
  @ApiOkResponse({ type: BathTypeResultDto })
  createBathType(@Body() createBathTypeDto: BathTypeCreateDto) {
    return this.bathService.createBathType(createBathTypeDto);
  }

  @Patch('type/update/:id')
  @ApiOperation({ summary: 'Update a bath type' })
  @ApiParam({ name: 'id', type: 'number', description: 'Bath Type ID' })
  @ApiOkResponse({ type: BathTypeResultDto })
  updateBathType(@Param('id') id: string, @Body() updateBathTypeDto: BathTypeUpdateDto) {
    return this.bathService.updateBathType(+id, updateBathTypeDto);
  }

  @Delete('type/delete/:id')
  @ApiOperation({ summary: 'Delete a bath type' })
  @ApiParam({ name: 'id', type: 'number', description: 'Bath Type ID' })
  @ApiOkResponse({ type: BathTypeResultDto })
  removeBathType(@Param('id') id: string) {
    return this.bathService.deleteBathType(+id);
  }
}
```

### 5.4 Implementación del Module

El módulo debe registrar ambos repositorios en los providers:

```typescript
import { Module } from '@nestjs/common';
import { BathService } from './bath.service';
import { BathController } from './bath.controller';
import { BathRepository } from '@repositories/bath.repository';
import { BathTypeRepository } from '@repositories/bath-type.repository';

@Module({
  controllers: [BathController],
  providers: [BathService, BathRepository, BathTypeRepository],
})
export class BathModule {}
```

### 5.5 Endpoints Resultantes

Con esta estructura, los endpoints quedan organizados así:

**Entidad Principal (Bath):**

- `GET /admin/bath/find-all` - Listar baños
- `GET /admin/bath/find-one/:id` - Obtener un baño
- `POST /admin/bath/create` - Crear baño
- `PATCH /admin/bath/update/:id` - Actualizar baño
- `DELETE /admin/bath/delete/:id` - Eliminar baño

**Entidad Relacionada (Bath Type):**

- `GET /admin/bath/type/find-all` - Listar tipos de baño
- `GET /admin/bath/type/find-one/:id` - Obtener un tipo de baño
- `POST /admin/bath/type/create` - Crear tipo de baño
- `PATCH /admin/bath/type/update/:id` - Actualizar tipo de baño
- `DELETE /admin/bath/type/delete/:id` - Eliminar tipo de baño

### 5.6 Ventajas de este Enfoque

✅ **Cohesión del dominio**: Entidades relacionadas permanecen juntas
✅ **Menos módulos**: Evita proliferación innecesaria de módulos
✅ **Rutas organizadas**: El prefijo `type/` mantiene claridad en los endpoints
✅ **Mantenibilidad**: Cambios en el dominio se hacen en un solo lugar
✅ **Swagger organizado**: Todos los endpoints aparecen bajo el mismo tag

### 5.7 Cuándo Usar este Patrón

Usa múltiples entidades en un módulo cuando:

- Las entidades están **estrechamente relacionadas** (ej. `bath` y `bath-type`)
- Una entidad es **dependiente** de la otra (ej. `treatment` y `treatment-type`)
- Comparten **lógica de negocio** común
- Forman parte del **mismo contexto de dominio**

**No uses este patrón** cuando las entidades son independientes o pertenecen a diferentes contextos de negocio.
