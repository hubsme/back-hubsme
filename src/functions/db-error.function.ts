import { BadRequestException } from '@nestjs/common';
import { TraceNode } from '@erixcel/traceflow';

export class DbErrorFunction {
  @TraceNode({ name: 'db-error.handleDbError', type: 'method' })
  static handleDbError(error: unknown): never {
    // Check if it's a wrapper error with 'cause' (common in some setups) or the direct error
    const cause = typeof error === 'object' && error !== null && 'cause' in error ? error.cause : undefined;
    const dbError = cause || error;

    if (typeof dbError === 'object' && dbError !== null && 'code' in dbError && dbError.code === '23505') {
      const constraint = 'constraint' in dbError && typeof dbError.constraint === 'string' ? dbError.constraint : '';
      const detail = 'detail' in dbError && typeof dbError.detail === 'string' ? dbError.detail : '';

      if (constraint.includes('email') || detail.includes('email')) {
        throw new BadRequestException(['El correo electrónico ya está registrado']);
      }

      if (constraint.includes('dni') || detail.includes('dni')) {
        throw new BadRequestException(['El DNI ya está registrado']);
      }

      if (constraint.includes('phone') || detail.includes('phone')) {
        throw new BadRequestException(['El teléfono ya está registrado']);
      }

      throw new BadRequestException(['Ya existe un registro con estos datos']);
    }

    throw error;
  }
}
