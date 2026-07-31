import { BadGatewayException, BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { DniVerificationDto } from './dto/dni-verification.dto';
import {
  DniVerificationIdentityDto,
  DniVerificationMatchesDto,
  DniVerificationResultDto,
} from './dto/dni-verification-result.dto';
import { PeruDevsRucResponse } from './dto/perudevs-ruc-response.dto';
import { PeruDevsDniResponse, PeruDevsDniResult } from './dto/perudevs-dni-response.dto';
import { RucVerificationDto } from './dto/ruc-verification.dto';
import { RucVerificationResultDto } from './dto/ruc-verification-result.dto';

const DNI_PROVIDER_URL = 'https://api.perudevs.com/api/v1/dni/complete';
const RUC_PROVIDER_URL = 'https://api.perudevs.com/api/v1/ruc';
const DNI_PROVIDER_TIMEOUT_MS = 10_000;

export type VerifiedDniProviderResult = {
  dni: string;
  birthDate: string;
};

@Injectable()
export class IdentityVerificationService {
  private readonly logger = new Logger(IdentityVerificationService.name);

  async verifyDni(verificationDto: DniVerificationDto): Promise<DniVerificationResultDto> {
    const providerBody = await this.requestProvider<PeruDevsDniResponse>(
      DNI_PROVIDER_URL,
      verificationDto.documentNumber,
      'DNI',
    );
    return this.compareWithProvider(verificationDto, providerBody);
  }

  async verifyDniForRegistration(verificationDto: DniVerificationDto): Promise<VerifiedDniProviderResult> {
    const providerBody = await this.requestProvider<PeruDevsDniResponse>(
      DNI_PROVIDER_URL,
      verificationDto.documentNumber,
      'DNI',
    );
    const verification = this.compareWithProvider(verificationDto, providerBody);
    const result = providerBody?.estado ? providerBody.resultado : null;

    if (!verification.verified || !result) {
      throw new BadRequestException('Los datos de identidad no pudieron ser verificados');
    }

    const dni = this.normalizeDocument(result.id);
    const birthDate = this.normalizeBirthDate(result.fecha_nacimiento);
    if (!birthDate) {
      throw new BadRequestException('La fecha de nacimiento devuelta por el proveedor no es válida');
    }

    return {
      dni,
      birthDate,
    };
  }

  async verifyRuc(verificationDto: RucVerificationDto): Promise<RucVerificationResultDto> {
    const providerBody = await this.requestProvider<PeruDevsRucResponse>(
      RUC_PROVIDER_URL,
      verificationDto.ruc,
      'RUC',
      [400, 404, 422],
    );
    const providerFound = Boolean(providerBody?.estado && providerBody.resultado);

    return {
      verified: providerFound,
      providerFound,
      nombreComercial: providerFound ? providerBody?.resultado?.nombre_comercial ?? null : null,
      message: providerFound
        ? 'El RUC existe en el registro consultado.'
        : 'No se encontró información para el RUC enviado.',
    };
  }

  private async requestProvider<T>(
    url: string,
    document: string,
    documentType: 'DNI' | 'RUC',
    notFoundStatuses = [404, 422],
  ): Promise<T | null> {
    const apiKey = process.env.PERUDEVS_API_KEY?.trim();

    if (!apiKey) {
      this.logger.error('PeruDevs API key is not configured in environment variables');
      throw new InternalServerErrorException(`La validación de ${documentType} no está configurada`);
    }

    const params = new URLSearchParams({ document, key: apiKey });
    let response: Response;

    try {
      response = await fetch(`${url}?${params.toString()}`, {
        headers: { Accept: 'application/json', 'Accept-Language': 'es-PE,es;q=0.9' },
        signal: AbortSignal.timeout(DNI_PROVIDER_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.error(`Error connecting to PeruDevs ${documentType} API`, error instanceof Error ? error.stack : undefined);
      throw new BadGatewayException(`No se pudo consultar el servicio de validación de ${documentType}`);
    }

    const providerBody = await this.parseProviderResponse<T>(response);

    if (notFoundStatuses.includes(response.status)) return null;
    if (response.status === 401 || response.status === 403) {
      this.logger.error(`PeruDevs ${documentType} API rejected the configured credentials: ${response.status}`);
      throw new InternalServerErrorException(`La configuración del servicio de validación de ${documentType} no es válida`);
    }
    if (!response.ok) {
      this.logger.error(`PeruDevs ${documentType} API failed with status ${response.status}`);
      throw new BadGatewayException(`El servicio de validación de ${documentType} no está disponible`);
    }

    return providerBody;
  }

  private async parseProviderResponse<T>(response: Response): Promise<T | null> {
    try {
      return (await response.json()) as T;
    } catch {
      return null;
    }
  }

  private compareWithProvider(
    verificationDto: DniVerificationDto,
    providerBody: PeruDevsDniResponse | null,
  ): DniVerificationResultDto {
    const result = providerBody?.estado ? providerBody.resultado : null;

    if (!result) {
      return this.buildNotFoundResult();
    }

    const matches: DniVerificationMatchesDto = {
      documentNumber: this.normalizeDocument(result.id) === verificationDto.documentNumber,
      firstName: this.normalizeText(result.nombres) === this.normalizeText(verificationDto.firstName),
      paternalLastName:
        this.normalizeText(result.apellido_paterno) === this.normalizeText(verificationDto.paternalLastName),
      maternalLastName:
        this.normalizeText(result.apellido_materno) === this.normalizeText(verificationDto.maternalLastName),
      birthDate: this.normalizeBirthDate(result.fecha_nacimiento) === verificationDto.birthDate,
    };

    const verified = Object.values(matches).every(Boolean);

    return {
      verified,
      providerFound: true,
      matches,
      identity: this.mapIdentity(result),
      message: verified
        ? 'Los datos coinciden con el registro consultado.'
        : 'Los datos no coinciden completamente con el registro consultado.',
    };
  }

  private buildNotFoundResult(): DniVerificationResultDto {
    return {
      verified: false,
      providerFound: false,
      matches: {
        documentNumber: false,
        firstName: false,
        paternalLastName: false,
        maternalLastName: false,
        birthDate: false,
      },
      identity: null,
      message: 'No se encontró información verificable para el DNI enviado.',
    };
  }

  private mapIdentity(result: PeruDevsDniResult): DniVerificationIdentityDto {
    return {
      id: result.id,
      nombres: result.nombres,
      apellido_paterno: result.apellido_paterno,
      apellido_materno: result.apellido_materno,
      nombre_completo: result.nombre_completo,
      genero: result.genero,
      fecha_nacimiento: result.fecha_nacimiento,
      codigo_verificacion: result.codigo_verificacion,
    };
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private normalizeDocument(value: string): string {
    return value.replace(/\D/g, '').padStart(8, '0');
  }

  private normalizeBirthDate(value: string): string | null {
    const dateValue = value.trim().split('T')[0].split(' ')[0];
    const yearFirstMatch = dateValue.match(/^(\d{4})[-/]([01]\d)[-/]([0-3]\d)$/);

    if (yearFirstMatch) {
      return `${yearFirstMatch[1]}-${yearFirstMatch[2]}-${yearFirstMatch[3]}`;
    }

    const dayFirstMatch = dateValue.match(/^([0-3]\d)[-/]([01]\d)[-/](\d{4})$/);

    if (dayFirstMatch) {
      return `${dayFirstMatch[3]}-${dayFirstMatch[2]}-${dayFirstMatch[1]}`;
    }

    return null;
  }
}
