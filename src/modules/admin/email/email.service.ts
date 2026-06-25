import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { EmailSendDto } from './dto/email-send.dto';
import { EmailSendResultDto } from './dto/email-send-result.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendEmail(sendEmailDto: EmailSendDto): Promise<EmailSendResultDto> {
    const gmailUser = process.env.GMAIL_USER || process.env.GMAIL_EMAIL;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD;
    const emailFromName = 'HUBSME';

    if (!gmailUser || !gmailAppPassword) {
      throw new InternalServerErrorException('Configuración de correo incompleta en el servidor');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    try {
      const info = await transporter.sendMail({
        from: `"${emailFromName}" <${gmailUser}>`,
        to: sendEmailDto.to,
        subject: sendEmailDto.subject,
        text: sendEmailDto.text,
        html: sendEmailDto.html,
      });

      this.logger.log(`Email sent to ${sendEmailDto.to}: ${info.messageId}`);

      return {
        message: 'Correo enviado exitosamente',
        messageId: info.messageId,
      };
    } catch (error) {
      this.logger.error('Error enviando correo', error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException(
        `No se pudo enviar el correo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }
}
