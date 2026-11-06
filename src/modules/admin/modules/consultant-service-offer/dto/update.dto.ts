import { Trace } from '@erixcel/traceflow';
import { PartialType } from '@nestjs/swagger';
import { ConsultantServiceOfferCreateDto } from '@modules/admin/modules/consultant-service-offer/dto/create.dto';

@Trace({ type: 'validation' })
export class ConsultantServiceOfferUpdateDto extends PartialType(ConsultantServiceOfferCreateDto) {}
