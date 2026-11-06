import * as bcrypt from 'bcrypt';
import { UserQuery } from '@queries/user/user.query';
import { Trace } from '@erixcel/traceflow';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserCreateDto } from '@modules/admin/modules/user/dto/create.dto';
import { UserUpdateDto } from '@modules/admin/modules/user/dto/update.dto';
import { UserListFiltersDto } from '@modules/admin/modules/user/dto/find-all.dto';
import { DbErrorFunction } from '@functions/db-error.function';

// Gestiona las cuentas de los usuarios.
@Trace({ name: 'user', type: 'service' })
@Injectable()
export class UserService {
  constructor(private readonly userQuery: UserQuery) {}

  async findAllPaginated(filters: UserListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.userQuery.findAllPaginated(page, limit, filters);

    const sanitizedData = data.map(({ password, deletedAt, updatedAt, ...user }) => user);
    const totalPages = Math.ceil(total / limit);

    return {
      data: sanitizedData,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: number) {
    const user = await this.userQuery.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async create(createUserDto: UserCreateDto) {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const user = await this.userQuery.create({
        ...createUserDto,
        email: createUserDto.email.trim().toLowerCase(),
        name: createUserDto.name.trim(),
        firstName: createUserDto.firstName?.trim(),
        lastName: createUserDto.lastName?.trim(),
        password: hashedPassword,
        role: createUserDto.role ?? 'pyme',
        authProvider: 'local',
        isActive: 'true',
      });

      const { password, ...sanitizedUser } = user;
      return sanitizedUser;
    } catch (error) {
      DbErrorFunction.handleDbError(error);
    }
  }

  async update(id: number, updateUserDto: UserUpdateDto) {
    const existingUser = await this.userQuery.findOne(id);
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    try {
      const updateData: any = { ...updateUserDto };

      if (updateUserDto.email) {
        updateData.email = updateUserDto.email.trim().toLowerCase();
      }

      if (updateUserDto.name) {
        updateData.name = updateUserDto.name.trim();
      }

      if (updateUserDto.firstName) {
        updateData.firstName = updateUserDto.firstName.trim();
      }

      if (updateUserDto.lastName) {
        updateData.lastName = updateUserDto.lastName.trim();
      }

      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const user = await this.userQuery.update(id, updateData);
      const { password, ...sanitizedUser } = user;
      return sanitizedUser;
    } catch (error) {
      DbErrorFunction.handleDbError(error);
    }
  }

  async delete(id: number) {
    const existingUser = await this.userQuery.findOne(id);
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const user = await this.userQuery.delete(id);
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
