import { TraceNode } from '@erixcel/traceflow';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { EmailSendDto } from '@modules/admin/modules/email/dto/send-email.dto';
import { EmailSendResultDto } from '@modules/admin/modules/email/dto/send-email.dto';
import { EmailService } from '@modules/admin/modules/email/email.service';

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
  @TraceNode({ name: 'sendEmail', type: 'controller' })
  async sendEmail(@Body() sendEmailDto: EmailSendDto): Promise<EmailSendResultDto> {
    return this.emailService.sendEmail(sendEmailDto);
  }
}
