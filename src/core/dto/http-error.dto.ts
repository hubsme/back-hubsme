import { ApiProperty } from '@nestjs/swagger';

export class HttpErrorDto {
  @ApiProperty({
    description: 'Error message(s)',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['password must be longer than or equal to 6 characters'],
  })
  message: string | string[];

  @ApiProperty({
    description: 'Error type',
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    description: 'Status code',
    example: 400,
  })
  statusCode: number;
}
