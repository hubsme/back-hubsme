import { Checkout } from '@db/tables/checkout.table';
import { MeetingConsultantPayoutService } from '@modules/admin/meeting/meeting-consultant-payout.service';
import { StorageService } from '@modules/admin/storage/storage.service';
import { MeetingConsultantPayoutRepository } from '@repositories/meeting-consultant-payout.repository';

import { MeetingRescheduleHistoryRepository } from '@repositories/meeting-reschedule-history.repository';

describe('MeetingConsultantPayoutService', () => {
  const createPending = jest.fn();
  const findOne = jest.fn();
  const findDetailedChainByRootMeetingId = jest.fn();
  const payoutRepository = { createPending, findOne } as unknown as MeetingConsultantPayoutRepository;
  const rescheduleHistoryRepository = {
    findDetailedChainByRootMeetingId,
  } as unknown as MeetingRescheduleHistoryRepository;
  const storageService = {} as StorageService;
  const service = new MeetingConsultantPayoutService(
    payoutRepository,
    rescheduleHistoryRepository,
    storageService,
  );

  beforeEach(() => {
    createPending.mockReset();
    findOne.mockReset();
    findDetailedChainByRootMeetingId.mockReset();
  });

  it('crea la obligación pendiente por el neto después de la comisión de Hubsme', async () => {
    const checkout = buildCheckout({ amount: '150.00', marketplaceFee: '6.00' });
    createPending.mockResolvedValue({ id: 10, amount: '144.00', status: 'pending' });

    await service.ensurePendingFromCheckout(checkout);

    expect(createPending).toHaveBeenCalledTimes(1);
    expect(createPending).toHaveBeenCalledWith({
      meetingId: 19,
      checkoutId: 25,
      pymeId: 1,
      consultantId: 2,
      amount: '144.00',
      currency: 'PEN',
      status: 'pending',
    });
  });

  it('obtiene la trazabilidad completa del pago y su cadena de reagendamientos', async () => {
    findOne.mockResolvedValue({
      id: 10,
      meetingId: 19,
      checkoutId: 25,
      pymeId: 1,
      consultantId: 2,
      amount: '144.00',
      currency: 'PEN',
      status: 'pending',
      paymentReference: null,
      evidenceFileUrl: null,
      evidenceOriginalName: null,
      evidenceMimeType: null,
      notes: null,
      paidAt: null,
      processedByAdmin: null,
      grossAmount: '150.00',
      platformCommissionAmount: '6.00',
      mercadoPagoPaymentId: 'MP-PAY-1',
      checkoutExternalReference: 'meeting:19',
      meetingTitle: 'Asesoría Inicial',
      meetingStartTime: new Date('2026-08-20T10:00:00Z'),
      meetingStatus: 'cancelada',
      meetingDurationMinutes: 60,
      meetingUrl: null,
      meetingCompletedAt: null,
      meetingCancellationReason: 'Problemas de agenda del consultor',
      pymeName: 'Empresa Demo SAC',
      consultantName: 'Carlos Consultor',
    });

    findDetailedChainByRootMeetingId.mockResolvedValue([
      {
        id: 1,
        createdAt: new Date('2026-08-20T11:00:00Z'),
        updatedAt: new Date('2026-08-20T11:30:00Z'),
        rootMeetingId: 19,
        sourceMeetingId: 19,
        replacementMeetingId: 20,
        promotionCodeId: 7,
        promotionCodeRedemptionId: 16,
        cancellationReason: 'Problemas de agenda del consultor',
        cancelledBy: 2,
        sourceMeetingTitle: 'Asesoría Inicial',
        sourceMeetingStartTime: new Date('2026-08-20T10:00:00Z'),
        sourceMeetingStatus: 'cancelada',
        sourceMeetingDurationMinutes: 60,
        promotionCode: 'REUNION-FREE-EFA83A638834',
        promotionCodeExpiresAt: null,
        promotionCodeIsActive: true,
        redeemedAt: new Date('2026-08-20T11:30:00Z'),
        cancelledByName: 'Carlos Consultor',
        replacementMeetingTitle: 'Asesoría Inicial (Reagendada)',
        replacementMeetingStartTime: new Date('2026-08-22T15:00:00Z'),
        replacementMeetingStatus: 'por_confirmar',
        replacementMeetingUrl: null,
        replacementMeetingCompletedAt: null,
      },
    ]);

    const result = await service.getTraceability(10);

    expect(result.payout.id).toBe(10);
    expect(result.rootMeeting.id).toBe(19);
    expect(result.latestMeeting.id).toBe(20);
    expect(result.latestMeeting.status).toBe('por_confirmar');
    expect(result.rescheduleCount).toBe(1);
    expect(result.history).toHaveLength(1);
    expect(result.history[0].promotionCode).toBe('REUNION-FREE-EFA83A638834');
    expect(result.history[0].isRedeemed).toBe(true);
  });

  it.each([
    ['checkout histórico cobrado por el consultor', { collectionDestination: 'consultant' as const }],
    ['cuota de servicio', { serviceRequestId: 8 }],
    ['checkout aún no aprobado', { status: 'pending' as const }],
    ['cupón sin pago real de Mercado Pago', { mercadoPagoPaymentId: null }],
  ])('no crea obligación para %s', async (_label, overrides) => {
    await expect(service.ensurePendingFromCheckout(buildCheckout(overrides))).resolves.toBeNull();
    expect(createPending).not.toHaveBeenCalled();
  });
});

function buildCheckout(overrides: Partial<Checkout> = {}): Checkout {
  return {
    id: 25,
    createdAt: new Date('2026-08-19T15:00:00.000Z'),
    updatedAt: new Date('2026-08-19T15:00:00.000Z'),
    meetingId: 19,
    serviceRequestId: null,
    serviceInstallmentIndex: null,
    pymeId: 1,
    consultantId: 2,
    preferenceId: 'preference-1',
    initPoint: null,
    sandboxInitPoint: null,
    externalReference: 'meeting:19',
    status: 'approved',
    collectionDestination: 'hubsme',
    amount: '150.00',
    marketplaceFee: '6.00',
    currency: 'PEN',
    mercadoPagoPaymentId: 'payment-1',
    paymentMethod: 'mercado_pago',
    paymentType: null,
    statusDetail: null,
    payerEmail: null,
    paidAt: new Date('2026-08-19T15:01:00.000Z'),
    meetingDetails: null,
    rawPayment: null,
    ...overrides,
  };
}
