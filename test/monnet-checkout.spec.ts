import 'reflect-metadata';
import { createHash } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { setupTransformer } from '@core/transformer.core';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '@modules/auth/types/authenticated-user.type';
import { CheckoutService } from '@modules/admin/modules/monnet/modules/checkout/checkout.service';
import { CheckoutController } from '@modules/admin/modules/monnet/modules/checkout/checkout.controller';
import { WebhookController } from '@modules/admin/modules/monnet/modules/webhook/webhook.controller';
import { WebhookService } from '@modules/admin/modules/monnet/modules/webhook/webhook.service';
import { MonnetPrepareCheckoutPaymentDto } from '@modules/admin/modules/monnet/modules/checkout/dto/prepare-checkout-payment.dto';
import { MonnetPayinWebhookDto } from '@modules/admin/modules/monnet/modules/webhook/dto/payin.dto';
import type { CheckoutRow } from '@modules/admin/modules/monnet/modules/checkout/types/checkout.type';
import { PayinService } from '@modules/admin/modules/monnet/modules/payin/payin.service';

// Evitar importar conexiones y clientes externos: las pruebas solo ejercitan la coordinación y HTTP.
jest.mock('@queries/checkout/checkout.query', () => ({ CheckoutQuery: class {} }));
jest.mock('@queries/consultant/consultant-join.query', () => ({ ConsultantJoinQuery: class {} }));
jest.mock('@queries/pyme/pyme-join.query', () => ({ PymeJoinQuery: class {} }));
jest.mock('@modules/admin/modules/consultant-availability/consultant-availability.service', () => ({ ConsultantAvailabilityService: class {} }));
jest.mock('@modules/admin/modules/meeting/meeting.service', () => ({ MeetingService: class {} }));
jest.mock('@modules/admin/modules/meeting/services/meeting-consultant-payout.service', () => ({ MeetingConsultantPayoutService: class {} }));
jest.mock('@modules/admin/modules/consultant/consultant.service', () => ({ ConsultantService: class {} }));
jest.mock('@modules/admin/modules/pyme/pyme.service', () => ({ PymeService: class {} }));
jest.mock('@queries/meeting-consultant-payout/meeting-consultant-payout.query', () => ({ MeetingConsultantPayoutQuery: class {} }));
jest.mock('@queries/meeting-consultant-payout/meeting-consultant-payout-join.query', () => ({ MeetingConsultantPayoutJoinQuery: class {} }));
jest.mock('@queries/meeting-reschedule-history/meeting-reschedule-history-join.query', () => ({ MeetingRescheduleHistoryJoinQuery: class {} }));
jest.mock('@modules/storage/storage.service', () => ({ StorageService: class {} }));

describe('Checkout de reuniones con Monnet QR', () => {
  const owner: AuthenticatedUser = {
    id: 7,
    pymeId: 7,
    role: 'pyme',
    membershipRole: 'owner',
    organization: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    email: 'erick@example.com',
    name: 'Erick Flores',
    firstName: 'Erick',
    lastName: 'Flores',
    authProvider: 'local',
    googleId: null,
    isActive: 'true',
  };
  const bill: MonnetPrepareCheckoutPaymentDto = {
    payinCustomerName: 'Erick',
    payinCustomerLastName: 'Flores Santos',
    payinCustomerEmail: 'erick@example.com',
    payinCustomerPhone: '929073820',
    payinCustomerTypeDocument: 'DNI',
    payinCustomerDocument: '12345678',
    payinCustomerAddress: 'Avenida de pruebas 123',
    payinCustomerCity: 'Lima',
    payinCustomerRegion: 'Lima',
    payinCustomerZipCode: '15073',
  };
  const times = ['2027-01-10T15:00:00Z', '2027-01-11T15:00:00Z', '2027-01-12T15:00:00Z'];
  let row: CheckoutRow;
  let state: string;
  let service: CheckoutService;
  let payin: PayinService;
  let query: { findOne: jest.Mock; findByExternalReference: jest.Mock; lock: jest.Mock; update: jest.Mock; create: jest.Mock; transaction: jest.Mock };
  let meeting: { create: jest.Mock; markPaidPendingConfirmation: jest.Mock };
  let payout: { ensurePendingFromCheckout: jest.Mock };
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    Object.assign(process.env, {
      MONNET_PAYIN_ENVIRONMENT: 'cert',
      MONNET_PAYIN_MERCHANT_ID: '1646',
      MONNET_PAYIN_KEY: 'test-key-only',
      MONNET_PAYIN_CURRENCY: 'PEN',
      MONNET_PAYIN_SUCCESS_URL: 'https://example.com/success',
      MONNET_PAYIN_ERROR_URL: 'https://example.com/error',
      MONNET_PLATFORM_FEE_PERCENT: '4',
    });
    state = '2';
    row = {
      id: 42,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      meetingId: null,
      serviceRequestId: null,
      serviceInstallmentIndex: null,
      pymeId: 7,
      consultantId: 3,
      preferenceId: null,
      initPoint: null,
      sandboxInitPoint: null,
      mercadoPagoPaymentId: null,
      externalReference: 'HUBSME-test',
      status: 'created',
      collectionDestination: 'hubsme',
      amount: '120.00',
      marketplaceFee: '4.80',
      currency: 'PEN',
      meetingDetails: { startTime: times[0], proposedStartTimes: times, durationMinutes: 60, title: 'Consultoría' },
      rawPayment: { provider: 'monnet', monnet: { environment: 'cert', merchantId: '1646', creationStatus: 'not_created' } },
    };
    let tail: Promise<unknown> = Promise.resolve();
    query = {
      findOne: jest.fn(async () => row),
      findByExternalReference: jest.fn(async (reference: string) => (reference === row.externalReference ? row : undefined)),
      lock: jest.fn(async () => row),
      update: jest.fn(async (_id: number, data: Partial<CheckoutRow>) => (row = { ...row, ...data })),
      create: jest.fn(async (data: Partial<CheckoutRow>) => (row = { ...row, ...data })),
      transaction: jest.fn((work: () => Promise<unknown>) => {
        const run = tail.then(async () => {
          const snapshot = structuredClone(row);
          try {
            return await work();
          } catch (error) {
            row = snapshot;
            throw error;
          }
        });
        tail = run.catch(() => undefined);
        return run;
      }),
    };
    meeting = { create: jest.fn(async () => ({ id: 80 })), markPaidPendingConfirmation: jest.fn(async () => undefined) };
    payout = { ensurePendingFromCheckout: jest.fn(async () => undefined) };
    payin = new PayinService();
    service = new CheckoutService(
      ...([
        query,
        { findByUserId: jest.fn(async () => ({ pricePerHour: '120.00' })), findOne: jest.fn(async () => ({ fullName: 'Consultor' })) },
        { findOne: jest.fn(async () => ({ name: 'Empresa' })) },
        { assertAvailableForMeeting: jest.fn(async () => undefined) },
        meeting,
        payout,
        { sendMeetingPendingConfirmationNotification: jest.fn(async () => undefined) },
        { sendMeetingPendingConfirmationNotification: jest.fn(async () => undefined) },
        payin,
      ] as unknown as ConstructorParameters<typeof CheckoutService>),
    );
    fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      const sent = JSON.parse(String(init?.body)) as Record<string, string>;
      if (String(url).endsWith('/operations'))
        return Response.json({ payinMerchantID: '1646', operations: [{ payinStateID: state, payinAmount: '120.0', payinCurrency: 'PEN', payinMerchantOperationNumber: sent.payinMerchantOperationNumber, payinID: '9001' }] });
      return Response.json({ payinErrorCode: '0000', payinTrxOperation: 'MONTRX9001', url: 'https://cert.voucher.monnet.io/test', experienceVoucher: { expiration: '2027-01-01 12:00:00', qrCode: 'data:image/png;base64,AA==' } });
    });
  });

  afterEach(() => jest.restoreAllMocks());

  function notification(change: Partial<MonnetPayinWebhookDto> = {}): MonnetPayinWebhookDto {
    const data = { payinStateID: '5', payinMerchantID: '1646', payinAmount: '120.0', payinCurrency: 'PEN', payinMerchantOperationNumber: row.externalReference, payinMethod: 'QR', payinVerification: '', ...change };
    data.payinVerification = createHash('sha512').update(`${data.payinMerchantID}${data.payinMerchantOperationNumber}${data.payinAmount}${data.payinCurrency}test-key-only`).digest('hex');
    return data;
  }

  it('calcula el importe y la comisión en el servidor y conserva tres propuestas', async () => {
    const result = await service.createCheckout(owner, { consultantId: 3, proposedStartTimes: times, durationMinutes: 90, title: 'Consultoría' });
    expect(result.amount).toBe('180.00');
    expect(result.marketplaceFee).toBe('7.20');
    expect(result.meetingId).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rechaza miembros sin permiso y consultores que coincidan solo con el ID de la PYME', async () => {
    await expect(service.prepareCheckoutPayment({ ...owner, membershipRole: 'member' }, 42, bill)).rejects.toThrow();
    await expect(service.findCheckout({ ...owner, role: 'consultor' }, 42)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('genera una sola operación con dos solicitudes concurrentes y reutiliza el QR', async () => {
    const results = await Promise.allSettled([service.prepareCheckoutPayment(owner, 42, bill), service.prepareCheckoutPayment(owner, 42, bill)]);
    expect(results.some((result) => result.status === 'fulfilled')).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const reused = await service.prepareCheckoutPayment(owner, 42, bill);
    expect(reused.qrCode).toContain('data:image/png;base64,');
    expect(reused.status).toBe('pending');
    expect(meeting.create).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.payinAmount).toBe('120.00');
    expect(sent.payinMethod).toBe('QR');
    expect(sent.payinVerification).toBe(createHash('sha512').update(`1646${row.externalReference}120.00PENtest-key-only`).digest('hex'));
    expect(reused).not.toHaveProperty('rawPayment');
  });

  it('no vuelve a crear una operación tras timeout', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('timeout', 'TimeoutError'));
    await expect(service.prepareCheckoutPayment(owner, 42, bill)).rejects.toThrow();
    await expect(service.prepareCheckoutPayment(owner, 42, bill)).rejects.toThrow(/ya fue solicitada/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((await service.findCheckout(owner, 42)).canCreatePayment).toBe(false);
  });

  it('no confunde HTTP 200 con creación aceptada ni reintenta un error ambiguo', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ payinErrorCode: '999', payinTrxOperation: 'MONTRX9001' }));
    await expect(service.prepareCheckoutPayment(owner, 42, bill)).rejects.toThrow();
    expect((await service.findCheckout(owner, 42)).canCreatePayment).toBe(false);
    expect(meeting.create).not.toHaveBeenCalled();
  });

  it('permite corregir un rechazo de validación que no creó operación', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ payinErrorCode: '0027' }));
    await expect(service.prepareCheckoutPayment(owner, 42, bill)).rejects.toThrow();
    expect((await service.findCheckout(owner, 42)).canCreatePayment).toBe(true);
    await service.prepareCheckoutPayment(owner, 42, bill);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rechaza firma inválida antes de buscar un checkout', async () => {
    await expect(service.handleNotification({ ...notification(), payinVerification: '0'.repeat(128) })).rejects.toThrow(/Firma/);
    expect(query.findByExternalReference).not.toHaveBeenCalled();
  });

  it.each([{ payinAmount: '1.00' }, { payinCurrency: 'USD' }])('rechaza importe o moneda diferentes aunque la firma sea válida: %o', async (change) => {
    await expect(service.handleNotification(notification(change))).rejects.toThrow(/importe o la moneda/);
    expect(meeting.create).not.toHaveBeenCalled();
  });

  it('no acepta un estado 5 falsificado si la consulta autenticada sigue pendiente', async () => {
    await service.prepareCheckoutPayment(owner, 42, bill);
    await expect(service.handleNotification(notification({ payinStateID: '5' }))).rejects.toThrow(/no coincide/);
    expect(row.status).toBe('pending');
    expect(meeting.create).not.toHaveBeenCalled();
  });

  it('confirma una sola reunión y su pendiente, y no degrada por notificaciones tardías', async () => {
    await service.prepareCheckoutPayment(owner, 42, bill);
    state = '5';
    await service.handleNotification(notification());
    state = '9';
    await service.handleNotification(notification());
    state = '2';
    await service.handleNotification(notification());
    expect(row.status).toBe('approved');
    expect(row.meetingId).toBe(80);
    expect(meeting.create).toHaveBeenCalledTimes(1);
    expect(payout.ensurePendingFromCheckout).toHaveBeenCalled();
  });

  it('revierte una confirmación incompleta y permite completar el webhook al reintentar', async () => {
    await service.prepareCheckoutPayment(owner, 42, bill);
    state = '5';
    meeting.create.mockRejectedValueOnce(new Error('temporary meeting failure'));
    await expect(service.handleNotification(notification())).rejects.toThrow('temporary meeting failure');
    expect(row.status).toBe('pending');
    expect(row.meetingId).toBeNull();
    await service.handleNotification(notification());
    expect(row.status).toBe('approved');
    expect(row.meetingId).toBe(80);
  });

  it('consulta un mismo checkout como máximo cada diez segundos salvo webhook', async () => {
    await service.prepareCheckoutPayment(owner, 42, bill);
    await service.syncCheckoutPayment(owner, 42);
    await service.syncCheckoutPayment(owner, 42);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await service.handleNotification(notification({ payinStateID: '2' }));
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('no reutiliza operaciones de Mercado Pago ni otro entorno de Monnet', async () => {
    row.preferenceId = 'legacy-mp-preference';
    await expect(service.prepareCheckoutPayment(owner, 42, bill)).rejects.toThrow(/Mercado Pago/);
    row.preferenceId = null;
    process.env.MONNET_PAYIN_ENVIRONMENT = 'production';
    await expect(service.prepareCheckoutPayment(owner, 42, bill)).rejects.toThrow(/otro entorno/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('conserva los validadores heredados para los datos del pagador', async () => {
    const invalid = plainToInstance(MonnetPrepareCheckoutPaymentDto, { ...bill, payinCustomerPhone: '123', payinCustomerEmail: 'bad', payinCustomerDocument: '123', payinCustomerAddress: '' });
    expect((await validate(invalid)).map((error) => error.property)).toEqual(expect.arrayContaining(['payinCustomerPhone', 'payinCustomerEmail', 'payinCustomerDocument', 'payinCustomerAddress']));
  });

  it('registra el pendiente del consultor sin inventar una comisión de Monnet', async () => {
    const actual = jest.requireActual<typeof import('@modules/admin/modules/meeting/services/meeting-consultant-payout.service')>('@modules/admin/modules/meeting/services/meeting-consultant-payout.service');
    const ledger = { createPending: jest.fn(async () => ({ id: 1 })), updatePendingFinancials: jest.fn(async () => ({ id: 1 })) };
    const joins = { findOne: jest.fn(async () => ({ id: 1, status: 'pending' })) };
    const payoutService = new actual.MeetingConsultantPayoutService(...([{}, joins, {}, ledger] as unknown as ConstructorParameters<typeof actual.MeetingConsultantPayoutService>));
    await payoutService.ensurePendingFromCheckout({ ...row, status: 'approved', meetingId: 80 });
    expect(ledger.createPending).toHaveBeenCalledWith(expect.objectContaining({ amount: '115.20', mercadoPagoFeeAmount: null, mercadoPagoFeePercent: null, checkoutId: 42 }));
  });

  it('autentica la consulta de estado con SHA-256 y el endpoint oficial', async () => {
    await payin.getOperation(row.externalReference);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://cert.monnetpayments.com/ms-experience-payin/merchant/1646/operations',
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: createHash('sha256').update('1646test-key-only').digest('hex') }),
      }),
    );
  });

  it('no confirma si Monnet devuelve otro comercio o un importe distinto', async () => {
    await service.prepareCheckoutPayment(owner, 42, bill);
    fetchMock.mockResolvedValueOnce(Response.json({ payinMerchantID: '999', operations: [] }));
    await expect(service.syncCheckoutPayment(owner, 42)).rejects.toThrow(/consulta de estado inválida/);
    fetchMock.mockResolvedValueOnce(Response.json({ payinMerchantID: '1646', operations: [{ payinStateID: '5', payinAmount: '1.00', payinCurrency: 'PEN', payinMerchantOperationNumber: row.externalReference }] }));
    await expect(service.syncCheckoutPayment(owner, 42)).rejects.toThrow(/importe o la moneda/);
    expect(row.status).toBe('pending');
    expect(meeting.create).not.toHaveBeenCalled();
  });

  it('expone HTTP 200 para creación/notificación y protege el checkout con JWT', async () => {
    const module = await Test.createTestingModule({
      controllers: [CheckoutController, WebhookController],
      providers: [{ provide: CheckoutService, useValue: service }, WebhookService],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: { switchToHttp(): { getRequest(): { headers: Record<string, string>; user?: AuthenticatedUser } } }) => {
          const req = context.switchToHttp().getRequest();
          if (!req.headers.authorization) throw new UnauthorizedException();
          req.user = owner;
          return true;
        },
      })
      .compile();
    const app = module.createNestApplication();
    setupTransformer(app);
    await app.init();
    try {
      await request(app.getHttpServer()).get('/admin/monnet/checkout/42').expect(401);
      await request(app.getHttpServer())
        .post('/admin/monnet/checkout/42/payment')
        .set('Authorization', 'test')
        .send({ ...bill, payinAmount: '0.01' })
        .expect(200);
      const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(sent.payinAmount).toBe('120.00');
      await request(app.getHttpServer())
        .post('/admin/monnet/webhook/payin')
        .send(notification({ payinStateID: '2' }))
        .expect(200, { received: true });
      await request(app.getHttpServer())
        .post('/admin/monnet/checkout/42/payment')
        .set('Authorization', 'test')
        .send({ ...bill, payinCustomerPhone: '123' })
        .expect(400);
    } finally {
      await app.close();
    }
  });
});
