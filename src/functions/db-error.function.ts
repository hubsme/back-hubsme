import { BadRequestException } from '@nestjs/common';

export function handleDbError(error: any) {
  // Check if it's a wrapper error with 'cause' (common in some setups) or the direct error
  const dbError = error.cause || error;

  if (dbError?.code === '23505') {
    const constraint = dbError?.constraint || '';
    const detail = dbError?.detail || '';

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
