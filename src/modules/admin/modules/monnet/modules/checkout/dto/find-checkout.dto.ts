import { Trace } from '@erixcel/traceflow';
import { MonnetCheckoutResultDto } from './create-checkout.dto';

@Trace({ type: 'validation' })
export class MonnetFindCheckoutResultDto extends MonnetCheckoutResultDto {}
