import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { EmailSendDto } from './dto/email-send.dto';
import { EmailSendResultDto } from './dto/email-send-result.dto';
import { EmailService } from './email.service';

@ApiTags('email')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @ApiOperation({ summary: 'Enviar un correo electrónico' })
  @ApiResponse({ status: 201, type: EmailSendResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 500, type: HttpErrorDto })
  async sendEmail(@Body() sendEmailDto: EmailSendDto): Promise<EmailSendResultDto> {
    return this.emailService.sendEmail(sendEmailDto);
  }
}
