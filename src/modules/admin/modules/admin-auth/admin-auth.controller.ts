import { TraceNode } from '@erixcel/traceflow';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { AdminAuthService } from '@modules/admin/modules/admin-auth/admin-auth.service';
import { AdminLoginDto, AdminLoginResponseDto } from '@modules/admin/modules/admin-auth/dto/login.dto';

@ApiTags('adminAuth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login for the internal Hubsme administrative panel' })
  @ApiResponse({ status: 200, type: AdminLoginResponseDto })
  @ApiResponse({ status: 401, type: HttpErrorDto })
  @TraceNode({ name: 'login', type: 'controller' })
  login(@Body() body: AdminLoginDto) {
    return this.adminAuthService.login(body);
  }
}
