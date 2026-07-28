import { BadGatewayException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { DniVerificationDto } from './dto/dni-verification.dto';
import { DniVerificationMatchesDto, DniVerificationResultDto } from './dto/dni-verification-result.dto';

type JsonRecord = Record<string, unknown>;

const DNI_PROVIDER_URL = 'https://api.perudevs.com/api/v1/dni/complete';
const DNI_PROVIDER_TIMEOUT_MS = 10_000;

const isRecord = (value: unknown): value is JsonRecord => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

@Injectable()
export class IdentityVerificationService {
  private readonly logger = new Logger(IdentityVerificationService.name);

  async verifyDni(verificationDto: DniVerificationDto): Promise<DniVerificationResultDto> {
    const apiKey = process.env.PERUDEVS_API_KEY?.trim();

    if (!apiKey) {
      this.logger.error('PeruDevs API key is not configured in environment variables');
      throw new InternalServerErrorException('La validación de DNI no está configurada');
    }

    const params = new URLSearchParams({
      document: verificationDto.documentNumber,
      key: apiKey,
    });

    let response: Response;

    try {
      response = await fetch(`${DNI_PROVIDER_URL}?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'es-PE,es;q=0.9',
        },
        signal: AbortSignal.timeout(DNI_PROVIDER_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.error('Error connecting to PeruDevs DNI API', error instanceof Error ? error.stack : undefined);
      throw new BadGatewayException('No se pudo consultar el servicio de validación de DNI');
    }

    const providerBody = await this.parseProviderResponse(response);

    if (response.status === 404 || response.status === 422) {
      return this.buildNotFoundResult();
    }

    if (response.status === 401 || response.status === 403) {
      this.logger.error(`PeruDevs DNI API rejected the configured credentials: ${response.status}`);
      throw new InternalServerErrorException('La configuración del servicio de validación de DNI no es válida');
    }

    if (!response.ok) {
      this.logger.error(`PeruDevs DNI API failed with status ${response.status}`);
      throw new BadGatewayException('El servicio de validación de DNI no está disponible');
    }

    return this.compareWithProvider(verificationDto, providerBody);
  }

  private async parseProviderResponse(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private compareWithProvider(verificationDto: DniVerificationDto, providerBody: unknown): DniVerificationResultDto {
    const providerFound = this.hasIdentityData(providerBody);

    if (!providerFound) {
      return this.buildNotFoundResult();
    }

    const providerDocument = this.findProviderValue(providerBody, [
      'document',
      'documento',
      'dni',
      'numero',
      'numero_documento',
      'document_number',
    ]);
    const providerFirstName = this.findProviderValue(providerBody, ['nombres', 'nombre', 'first_name', 'firstname']);
    const providerPaternalLastName = this.findProviderValue(providerBody, [
      'apellido_paterno',
      'paterno',
      'paternal_last_name',
      'paternal_surname',
    ]);
    const providerMaternalLastName = this.findProviderValue(providerBody, [
      'apellido_materno',
      'materno',
      'maternal_last_name',
      'maternal_surname',
    ]);
    const providerBirthDate = this.findProviderValue(providerBody, [
      'fecha_nacimiento',
      'birth_date',
      'birthdate',
      'date_of_birth',
    ]);
    const providerFullName = this.findProviderValue(providerBody, ['nombre_completo', 'full_name', 'fullname']);

    const fullNameMatches = providerFullName
      ? this.normalizeText(providerFullName) ===
        this.normalizeText(
          `${verificationDto.firstName} ${verificationDto.paternalLastName} ${verificationDto.maternalLastName}`,
        )
      : null;

    const matches: DniVerificationMatchesDto = {
      documentNumber: providerDocument
        ? this.normalizeDocument(providerDocument) === verificationDto.documentNumber
        : true,
      firstName: providerFirstName
        ? this.normalizeText(providerFirstName) === this.normalizeText(verificationDto.firstName)
        : (fullNameMatches ?? false),
      paternalLastName: providerPaternalLastName
        ? this.normalizeText(providerPaternalLastName) === this.normalizeText(verificationDto.paternalLastName)
        : (fullNameMatches ?? false),
      maternalLastName: providerMaternalLastName
        ? this.normalizeText(providerMaternalLastName) === this.normalizeText(verificationDto.maternalLastName)
        : (fullNameMatches ?? false),
      birthDate: providerBirthDate ? this.normalizeBirthDate(providerBirthDate) === verificationDto.birthDate : false,
    };

    const verified = Object.values(matches).every(Boolean);

    return {
      verified,
      providerFound,
      matches,
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
      message: 'No se encontró información verificable para el DNI enviado.',
    };
  }

  private hasIdentityData(payload: unknown): boolean {
    return Boolean(
      this.findProviderValue(payload, [
        'document',
        'documento',
        'dni',
        'numero',
        'numero_documento',
        'nombres',
        'nombre',
        'nombre_completo',
        'full_name',
        'fecha_nacimiento',
        'birth_date',
      ]),
    );
  }

  private findProviderValue(payload: unknown, aliases: string[], depth = 0): string | null {
    if (!isRecord(payload) || depth > 3) {
      return null;
    }

    const normalizedAliases = aliases.map((alias) => alias.toLowerCase());
    const directEntry = Object.entries(payload).find(([key, value]) => {
      return normalizedAliases.includes(key.toLowerCase()) && this.toStringValue(value) !== null;
    });

    if (directEntry) {
      return this.toStringValue(directEntry[1]);
    }

    for (const value of Object.values(payload)) {
      const nestedValue = this.findProviderValue(value, aliases, depth + 1);

      if (nestedValue !== null) {
        return nestedValue;
      }
    }

    return null;
  }

  private toStringValue(value: unknown): string | null {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number') {
      return String(value);
    }

    return null;
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
