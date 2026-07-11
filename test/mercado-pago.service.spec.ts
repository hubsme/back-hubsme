import { JwtService } from '@nestjs/jwt';
import { MercadoPagoPaymentDTO } from '@db/tables/mercado-pago-payment.table';
import { ConsultantMercadoPagoAccountRepository } from '@repositories/consultant-mercado-pago-account.repository';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { MercadoPagoPaymentRepository } from '@repositories/mercado-pago-payment.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { ConsultantAvailabilityService } from '@modules/admin/consultant-availability/consultant-availability.service';
import { ConsultantService } from '@modules/admin/consultant/consultant.service';
import { MeetingService } from '@modules/admin/meeting/meeting.service';
import { MercadoPagoService } from '@modules/admin/mercado-pago/mercado-pago.service';
import { PymeService } from '@modules/admin/pyme/pyme.service';
import { SubscriptionService } from '@modules/admin/subscription/subscription.service';

describe('MercadoPagoService checkout flow', () => {
  const checkout = {
    id: 20,
    pymeId: 2,
    consultantId: 3,
    meetingId: null,
    preferenceId: null,
    initPoint: null,
    sandboxInitPoint: null,
    externalReference: 'pending:2:3:123',
    status: 'created',
    amount: '30.00',
    marketplaceFee: '0.00',
    currency: 'PEN',
    meetingDetails: {
      startTime: '2026-07-13T15:00:00.000Z',
      durationMinutes: 60,
      title: 'Sesion de consultoria',
    },
  };
  let accountRepository: { findByConsultantId: jest.Mock };
  let consultantRepository: { findByUserId: jest.Mock };
  let paymentRepository: { create: jest.Mock; findOne: jest.Mock; update: jest.Mock };
  let service: MercadoPagoService;

  beforeEach(() => {
    accountRepository = { findByConsultantId: jest.fn() };
    consultantRepository = {
      findByUserId: jest.fn().mockResolvedValue({ id: 3, pricePerHour: '30.00' }),
    };
    paymentRepository = {
      create: jest.fn().mockImplementation(async (data: MercadoPagoPaymentDTO) => ({ ...checkout, ...data })),
      findOne: jest.fn().mockResolvedValue(checkout),
      update: jest.fn(),
    };

    service = new MercadoPagoService(
      accountRepository as unknown as ConsultantMercadoPagoAccountRepository,
      consultantRepository as unknown as ConsultantRepository,
      {} as PymeRepository,
      paymentRepository as unknown as MercadoPagoPaymentRepository,
      {} as MeetingService,
      {} as JwtService,
      { assertAvailableForMeeting: jest.fn().mockResolvedValue(undefined) } as unknown as ConsultantAvailabilityService,
      {} as ConsultantService,
      {} as PymeService,
      {} as SubscriptionService,
    );
  });

  it('crea el checkout local aunque el consultor no tenga Mercado Pago', async () => {
    const result = await service.createCheckout(2, {
      consultantId: 3,
      startTime: checkout.meetingDetails.startTime,
      durationMinutes: 60,
      title: checkout.meetingDetails.title,
    });

    expect(accountRepository.findByConsultantId).not.toHaveBeenCalled();
    expect(paymentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ preferenceId: null, initPoint: null, sandboxInitPoint: null }),
    );
    expect(result).toEqual(expect.objectContaining({ id: 20, initPoint: null }));
  });

  it('valida la cuenta de Mercado Pago recien al iniciar el pago', async () => {
    accountRepository.findByConsultantId.mockResolvedValue(undefined);

    await expect(service.prepareCheckoutPayment(2, checkout.id)).rejects.toMatchObject({
      response: { message: ['El consultor aun no conecto su cuenta de Mercado Pago'] },
    });

    expect(accountRepository.findByConsultantId).toHaveBeenCalledWith(checkout.consultantId);
  });
});
