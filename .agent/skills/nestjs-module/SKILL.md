---
name: nestjs-module
description: |
  ESPAÑOL - Guía para CREAR MÓDULOS, SERVICIOS y CONTROLADORES en NestJS.
  Usa esta skill cuando el usuario pida: crear módulo, nuevo servicio, nuevo controlador,
  crear endpoint, nueva ruta API, implementar lógica de negocio, agregar método al servicio,
  crear CRUD, exponer API REST, inyección de dependencias, o cualquier tarea
  relacionada con la capa de aplicación (service, controller, module).
  Define responsabilidades y patrones de arquitectura limpia.
---

# NestJS Module Architecture

This skill defines the responsibilities of the core module files. A module consists of:

1.  **Service** (`.service.ts`): Business logic, calculations, and DTO transformation.
2.  **Controller** (`.controller.ts`): HTTP routing, documentation (Swagger), and request delegation.
3.  **Module** (`.module.ts`): Dependency Injection wiring.

---

## 1. Service Pattern (`.service.ts`)

**Responsibilities**:

- Injects the **Repository** to access data.
- Implements business rules (e.g., hashing passwords, sanitizing inputs).
- Transforms raw database results into clean objects (e.g., removing sensitive fields).
- Throws HTTP exceptions (`NotFoundException`, `ConflictException`).
- **NEVER** accesses the database directly (always use the Repository).

**Example**: `user.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '@repositories/user.repository';
import { UserCreateDto } from './dto/user-create.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(dto: UserCreateDto) {
    try {
      // Business Logic: Hash password
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const fullName = `${dto.firstName} ${dto.lastName}`;

      // Call Repository
      const user = await this.userRepository.create({
        ...dto,
        password: hashedPassword,
        fullName,
      });

      // Sanitization
      const { password, ...cleanUser } = user;
      return cleanUser;
    } catch (error) {
      // Handle known errors
      throw error;
    }
  }
}
```

---

## 2. Controller Pattern (`.controller.ts`)

**Responsibilities**:

- Defines routes and HTTP verbs (`@Get`, `@Post`, etc.).
- Documents the API using **Swagger** (`@ApiTags`, `@ApiOperation`, `@ApiResponse`).
- Validates inputs using DTOs (`@Body`, `@Query`).
- **Strictly** delegates logic to the Service.
- Returns the Service's result directly.
- **NEVER** use `any` in DTOs or parameters; proper typing is required for Swagger to generate documentation and validation correctly.

**Example**: `user.controller.ts`

```typescript
import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserListDto, UserListFiltersDto } from './dto/user-list.dto';
import { UserCreateDto } from './dto/user-create.dto';
import { HttpErrorDto } from '@models/http-error.dto';

@ApiTags('user')
@ApiBearerAuth()
@Controller('admin/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get all users paginated' })
  @ApiResponse({ status: 200, type: UserListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Query() filters: UserListFiltersDto) {
    return this.userService.findAllPaginated(filters);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 200, type: UserListDto }) // Returns generic object, refine type as needed
  @ApiResponse({ status: 400, type: HttpErrorDto })
  create(@Body() dto: UserCreateDto) {
    return this.userService.create(dto);
  }
}
```

---

## 3. Module Wiring (`.module.ts`)

**Responsibilities**:

- Registers Controllers and Providers (Services, Repositories).
- Exports Services/Repositories if they need to be used by other modules.

**Example**: `user.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from '@repositories/user.repository';

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
```

---

## Global Models

Common DTOs like error responses should be placed in `src/models/`.

**File**: `src/models/http-error.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class HttpErrorDto {
  @ApiProperty({
    description: 'Error message(s)',
    example: ['Validation failed'],
  })
  message: string | string[];

  @ApiProperty({ description: 'Error type', example: 'Bad Request' })
  error: string;

  @ApiProperty({ description: 'Status code', example: 400 })
  statusCode: number;
}
```
