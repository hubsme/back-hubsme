import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { DniVerificationDto } from './dto/dni-verification.dto';
import { DniVerificationResultDto } from './dto/dni-verification-result.dto';
import { RucVerificationDto } from './dto/ruc-verification.dto';
import { RucVerificationResultDto } from './dto/ruc-verification-result.dto';
import { IdentityVerificationService } from './identity-verification.service';

@ApiTags('identityVerification')
@Controller('admin/identity-verification')
export class IdentityVerificationController {
  constructor(private readonly identityVerificationService: IdentityVerificationService) {}

  @Post('dni')
  @ApiOperation({ summary: 'Validar datos personales contra el registro de DNI de PeruDevs' })
  @ApiResponse({ status: 200, type: DniVerificationResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 502, type: HttpErrorDto })
  verifyDni(@Body() verificationDto: DniVerificationDto): Promise<DniVerificationResultDto> {
    return this.identityVerificationService.verifyDni(verificationDto);
  }

  @Post('ruc')
  @ApiOperation({ summary: 'Validar si un RUC existe en el registro de PeruDevs' })
  @ApiResponse({ status: 200, type: RucVerificationResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 502, type: HttpErrorDto })
  verifyRuc(@Body() verificationDto: RucVerificationDto): Promise<RucVerificationResultDto> {
    return this.identityVerificationService.verifyRuc(verificationDto);
  }
}
