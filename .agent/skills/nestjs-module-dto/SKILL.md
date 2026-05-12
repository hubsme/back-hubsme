---
name: nestjs-module-dto
description: |
  ESPAÑOL - Guía para CREAR DTOs con VALIDACIÓN y DOCUMENTACIÓN Swagger.
  Usa esta skill cuando el usuario pida: crear DTO, validar datos, documentar API,
  agregar validación, class-validator, class-transformer, swagger decorators,
  crear filtros de búsqueda, paginación, respuestas tipadas, CreateDto, UpdateDto,
  ListDto, ResultDto, o cualquier tarea relacionada con la transferencia
  de datos, validación de entrada y documentación OpenAPI/Swagger.
  Patrones: Create, Update, List/Filter, Result DTOs con type safety.
---

# NestJS DTO architecture

This skill defines the standard for Data Transfer Objects. DTOs are critical for:

1.  **Validation**: Ensuring incoming data is correct (`class-validator`).
2.  **Documentation**: Auto-generating Swagger/OpenAPI schemas (`@nestjs/swagger`).
3.  **Type Safety**: Ensuring alignment with Database schemas (`drizzle-orm`).

## General Rules

1.  **Explicit Interfaces**: Every object in a response must be a defined class. Do **NOT** use inline types (e.g., `data: { x: 1 }`), as Swagger cannot document them.
2.  **Strict Typing**: Use `implements` or `PartialType` to enforce synchronization with the DB schema.
3.  **Defaults**: Always provide examples and defaults in `@ApiProperty`.

---

## 1. Create DTO (`.dto.ts`)

**Purpose**: Validate payload for creation.
**Pattern**: Implement `Omit<TableDTO, 'auto_fields'>` to ensure all DB fields are handled.

**Example**: `src/modules/user/dto/user-create.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { userRoleEnum, UserDTO } from '@db/tables/user.table';

// "implements Omit" forces you to define all required fields from the DB schema
export class UserCreateDto implements Omit<UserDTO, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'fullName' | 'isActive'> {
  @ApiProperty({
    example: 'erick@gmail.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'User password (min 6 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Erick', description: 'User first name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Stip', description: 'User last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    enum: userRoleEnum.enumValues,
    default: userRoleEnum.enumValues[0],
    description: 'User role',
  })
  @IsNotEmpty()
  @IsEnum(userRoleEnum.enumValues)
  role: (typeof userRoleEnum.enumValues)[number];
}
```

---

## 2. Update DTO (`.dto.ts`)

**Purpose**: partial updates.
**Pattern**: Extend `PartialType` from `@nestjs/swagger` (NOT mapped-types) to inherit Swagger metadata.

**Example**: `src/modules/user/dto/user-update.dto.ts`

```typescript
import { PartialType } from '@nestjs/swagger';
import { UserCreateDto } from './user-create.dto';

export class UserUpdateDto extends PartialType(UserCreateDto) {}
```

---

## 3. List & Filter DTO (`.dto.ts`)

**Purpose**: define query parameters (`?page=1&search=...`) and the paginated response structure.

**Example**: `src/modules/user/dto/user-list.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { userRoleEnum } from '@db/tables/user.table';

// 1. Filter DTO (Query Params)
export class UserListFiltersDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number) // Convert string query param to number
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

  @ApiPropertyOptional({ enum: userRoleEnum.enumValues })
  @IsEnum(userRoleEnum.enumValues)
  @IsOptional()
  role?: (typeof userRoleEnum.enumValues)[number];
}

// 2. Item DTO (Single row in the list)
export class UserListItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'erick@gmail.com' })
  email: string;

  @ApiProperty({ example: 'Erick Santos' })
  fullName: string;

  @ApiProperty({ example: 'admin', enum: userRoleEnum.enumValues })
  role: (typeof userRoleEnum.enumValues)[number];

  @ApiProperty({ example: 'true' })
  isActive: string;

  @ApiProperty()
  createdAt: Date;
}

// 3. Metadata DTO
export class PaginationMetaDto {
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
  @ApiProperty() hasNextPage: boolean;
  @ApiProperty() hasPreviousPage: boolean;
}

// 4. Main Response DTO (The object returned by the Controller)
export class UserListDto {
  @ApiProperty({ type: [UserListItemDto] }) // Explicit type is mandatory for Arrays
  data: UserListItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
```

---

## 4. Result DTO (`.dto.ts`)

**Purpose**: Return a single entity detail (e.g., `findOne`).
**Pattern**: Can implement `Omit<TableInterface>` to ensure fields match logic (e.g. no password).

**Example**: `src/modules/user/dto/user-result.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { User, userRoleEnum } from '@db/tables/user.table';

export class UserResultDto implements Omit<User, 'password'> {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ enum: userRoleEnum.enumValues })
  role: (typeof userRoleEnum.enumValues)[number];

  @ApiProperty()
  isActive: string;
}
```
