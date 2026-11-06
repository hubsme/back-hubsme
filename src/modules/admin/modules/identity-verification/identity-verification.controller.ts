import { TraceNode } from '@erixcel/traceflow';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { DniVerificationDto } from '@modules/admin/modules/identity-verification/dto/verify-dni.dto';
import { DniVerificationResultDto } from '@modules/admin/modules/identity-verification/dto/verify-dni.dto';
import { RucVerificationDto } from '@modules/admin/modules/identity-verification/dto/verify-ruc.dto';
import { RucVerificationResultDto } from '@modules/admin/modules/identity-verification/dto/verify-ruc.dto';
import { IdentityVerificationService } from '@modules/admin/modules/identity-verification/identity-verification.service';

@ApiTags('identityVerification')
@Controller('admin/identity-verification')
export class IdentityVerificationController {
  constructor(private readonly identityVerificationService: IdentityVerificationService) {}

  @Post('dni')
  @ApiOperation({ summary: 'Validar datos personales contra el registro de DNI de PeruDevs' })
  @ApiResponse({ status: 200, type: DniVerificationResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 502, type: HttpErrorDto })
  @TraceNode({ name: 'verifyDni', type: 'controller' })
  verifyDni(@Body() verificationDto: DniVerificationDto): Promise<DniVerificationResultDto> {
    return this.identityVerificationService.verifyDni(verificationDto);
  }

  @Post('ruc')
  @ApiOperation({ summary: 'Validar si un RUC existe en el registro de PeruDevs' })
  @ApiResponse({ status: 200, type: RucVerificationResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 502, type: HttpErrorDto })
  @TraceNode({ name: 'verifyRuc', type: 'controller' })
  verifyRuc(@Body() verificationDto: RucVerificationDto): Promise<RucVerificationResultDto> {
    return this.identityVerificationService.verifyRuc(verificationDto);
  }
}
