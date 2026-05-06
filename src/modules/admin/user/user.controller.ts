import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { UserService } from './user.service';
import { UserCreateDto } from './dto/user-create.dto';
import { UserUpdateDto } from './dto/user-update.dto';
import { UserListDto, UserListFiltersDto } from './dto/user-list.dto';
import { UserResultDto } from './dto/user-result.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';

@ApiTags('user')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: UserResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 200, type: UserResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  create(@Body() createUserDto: UserCreateDto) {
    return this.userService.create(createUserDto);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: UserResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  update(@Param('id') id: string, @Body() updateUserDto: UserUpdateDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a user' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: UserResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  remove(@Param('id') id: string) {
    return this.userService.delete(+id);
  }
}
