import { Trace } from '@erixcel/traceflow';
import { forwardRef, Inject, Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { MeetingJoinQuery } from '@queries/meeting/meeting-join.query';
import type { MeetingQuery } from '@queries/meeting/meeting.query';
import { PymeJoinQuery } from '@queries/pyme/pyme-join.query';
import { ScheduledNotificationQuery } from '@queries/scheduled-notification/scheduled-notification.query';

import { DateFunction } from '@functions/date.function';
import { MeetingAccessUrlFunction } from '@functions/meeting-access-url.function';
import { EmailService } from '@modules/admin/modules/email/email.service';
import { MeetingReminderPayload } from '@modules/admin/modules/scheduled-notification/types/scheduled-notification.types';
import { WhatsappService } from '@modules/admin/modules/whatsapp/whatsapp.service';

// Coordina las notificaciones programadas.
@Trace({ name: 'scheduled-notification', type: 'service' })
@Injectable()
export class ScheduledNotificationService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly queueRefreshMs = 60_000;

  private readonly processingStaleMs = 5 * 60_000;

  private readonly retryBaseMs = 60_000;

  private readonly logger = new Logger(ScheduledNotificationService.name);
  private readonly queue = new Map<number, number>();
  private timer?: ReturnType<typeof setTimeout>;
  private processing = false;

  constructor(
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
    private readonly emailService: EmailService,
    private readonly pymeJoinQuery: PymeJoinQuery,
    private readonly consultantJoinQuery: ConsultantJoinQuery,
    private readonly scheduledNotificationQuery: ScheduledNotificationQuery,
    private readonly meetingJoinQuery: MeetingJoinQuery,
  ) {}

  async onApplicationBootstrap() {
    await this.recoverStaleJobs();
    await this.expirePastJobs();
    await this.backfillConfirmedMeetings();
    await this.refreshQueue();
    this.logger.log(`Cola de notificaciones iniciada con ${this.queue.size} tarea(s) pendiente(s)`);
  }

  onModuleDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }

  async scheduleMeetingReminders(meeting: Awaited<ReturnType<MeetingQuery['create']>>) {
    if (meeting.status !== 'confirmada' || !meeting.meetingUrl || meeting.startTime <= new Date()) {
      await this.cancelMeetingReminders(meeting.id);
      return [];
    }

    const [pyme, consultant] = await Promise.all([
      this.pymeJoinQuery.findOne(meeting.pymeId),
      this.consultantJoinQuery.findOne(meeting.consultantId),
    ]);

    if (!pyme || !consultant) {
      throw new Error(`No se encontraron los participantes de la reunion ${meeting.id}`);
    }

    const scheduledAt = this.getScheduledAt(meeting.startTime);
    const commonPayload = this.buildPayload(meeting, pyme.name, consultant.fullName);
    const maxAttempts = this.getPositiveInteger('MEETING_REMINDER_MAX_ATTEMPTS', 3);
    const notifications = [];
    const pymePhone = pyme.ownerPhone?.trim() || '';
    const pymeEmail = pyme.ownerEmail?.trim() || pyme.userEmail?.trim();
    const pymeName = pyme.ownerFirstName?.trim() || pyme.name;
    const consultantPhone = consultant.ownerPhone?.trim() || '';
    const consultantEmail = consultant.userEmail?.trim();

    if (pymePhone || pymeEmail) {
      notifications.push({
        meetingId: meeting.id,
        recipient: 'pyme' as const,
        scheduledAt,
        expiresAt: meeting.startTime,
        maxAttempts,
        payload: {
          ...commonPayload,
          to: pymePhone,
          correo: pymeEmail,
          nombre_destinatario: pymeName,
          nombre_pyme: pymeName,
        },
      });
    }

    if (consultantPhone || consultantEmail) {
      notifications.push({
        meetingId: meeting.id,
        recipient: 'consultor' as const,
        scheduledAt,
        expiresAt: meeting.startTime,
        maxAttempts,
        payload: {
          ...commonPayload,
          to: consultantPhone,
          correo: consultantEmail,
          nombre_destinatario: consultant.fullName,
        },
      });
    }

    const result = await this.scheduledNotificationQuery.replacePendingForMeeting(meeting.id, notifications);
    for (const id of result.cancelledIds) this.queue.delete(id);
    for (const notification of result.created) {
      this.queue.set(notification.id, notification.scheduledAt.getTime());
    }
    this.armTimer();

    this.logger.log(
      `Reunion ${meeting.id}: ${result.created.length} recordatorio(s) programado(s) para ${scheduledAt.toISOString()}`,
    );
    return result.created;
  }

  async cancelMeetingReminders(meetingId: number) {
    const cancelled = await this.scheduledNotificationQuery.cancelPendingForMeeting(meetingId);
    for (const notification of cancelled) this.queue.delete(notification.id);
    this.armTimer();
    return cancelled;
  }

  async sendMeetingConfirmedNotifications(meeting: Awaited<ReturnType<MeetingQuery['create']>>) {
    if (meeting.status !== 'confirmada' || !meeting.startTime) return;

    try {
      const [pyme, consultant] = await Promise.all([
        this.pymeJoinQuery.findOne(meeting.pymeId),
        this.consultantJoinQuery.findOne(meeting.consultantId),
      ]);
      if (!pyme || !consultant) {
        this.logger.warn(`No se encontraron los participantes para notificar la reunion ${meeting.id}`);
        return;
      }

      const dateTime = DateFunction.formatInPeru(meeting.startTime, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const duration = `${meeting.durationMinutes} minutos`;
      const reminderTime = `${this.getPositiveInteger('MEETING_REMINDER_MINUTES_BEFORE', 15)} minutos`;
      const sessionNotes = meeting.description?.trim() || undefined;
      const meetingAccessUrl = MeetingAccessUrlFunction.buildMeetingAccessUrl(meeting.id);
      const notifications: Promise<unknown>[] = [];
      const pymeName = pyme.ownerFirstName?.trim() || pyme.name;

      if (consultant.ownerPhone?.trim()) {
        notifications.push(
          this.whatsappService.sendNotificacionConsultor(consultant.ownerPhone, {
            to: consultant.ownerPhone,
            nombre_consultor: consultant.fullName,
            nombre_pyme: pyme.name,
            titulo_sesion: meeting.title,
            fecha_hora: dateTime,
            duracion: duration,
          }),
        );
      }

      if (consultant.userEmail?.trim()) {
        notifications.push(
          this.emailService.sendMeetingConfirmedEmail({
            to: consultant.userEmail,
            recipientName: consultant.fullName,
            counterpartName: pyme.name,
            meetingTitle: meeting.title,
            dateTime,
            duration,
            meetingUrl: meetingAccessUrl,
            reminderTime,
            sessionNotes,
            recipientType: 'consultor',
          }),
        );
      }

      if (pyme.ownerPhone?.trim()) {
        notifications.push(
          this.whatsappService.sendNotificacionPyme(pyme.ownerPhone, {
            to: pyme.ownerPhone,
            nombre_pyme: pymeName,
            nombre_consultor: consultant.fullName,
            titulo_sesion: meeting.title,
            fecha_hora: dateTime,
            duracion: duration,
          }),
        );
      }

      if (pyme.ownerEmail?.trim()) {
        notifications.push(
          this.emailService.sendMeetingConfirmedEmail({
            to: pyme.ownerEmail,
            recipientName: pymeName,
            counterpartName: consultant.fullName,
            meetingTitle: meeting.title,
            dateTime,
            duration,
            meetingUrl: meetingAccessUrl,
            reminderTime,
            sessionNotes,
            recipientType: 'pyme',
          }),
        );
      }

      const results = await Promise.allSettled(notifications);
      results.forEach((result) => {
        if (result.status === 'rejected') {
          const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
          this.logger.error(
            `No se pudo enviar una notificacion de confirmacion de la reunion ${meeting.id}: ${message}`,
          );
        }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `No se pudieron preparar las notificaciones de confirmacion de la reunion ${meeting.id}: ${message}`,
      );
    }
  }

  async sendMeetingCancelledByConsultantNotifications(
    meeting: Awaited<ReturnType<MeetingQuery['create']>>,
    cancellationReason: string,
    promotionCode: string,
  ) {
    if (meeting.status !== 'cancelada') return;

    try {
      const [pyme, consultant] = await Promise.all([
        this.pymeJoinQuery.findOne(meeting.pymeId),
        this.consultantJoinQuery.findOne(meeting.consultantId),
      ]);
      if (!pyme || !consultant) {
        this.logger.warn(`No se encontraron los participantes para notificar la cancelacion ${meeting.id}`);
        return;
      }

      const startTimeValue = meeting.startTime ?? meeting.proposedStartTimes?.[0];
      const startTime = startTimeValue ? new Date(startTimeValue) : null;
      const dateTime =
        startTime && !Number.isNaN(startTime.getTime())
          ? DateFunction.formatInPeru(startTime, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Horario pendiente de confirmacion';
      const duration = `${meeting.durationMinutes} minutos`;
      const pymeName = pyme.ownerFirstName?.trim() || pyme.name;
      const pymeEmail = pyme.ownerEmail?.trim() || pyme.userEmail?.trim();
      const notifications: Promise<unknown>[] = [];

      if (consultant.userEmail?.trim()) {
        notifications.push(
          this.emailService.sendMeetingCancellationEmail({
            to: consultant.userEmail,
            recipientName: consultant.fullName,
            counterpartName: pyme.name,
            meetingTitle: meeting.title,
            dateTime,
            duration,
            cancellationReason,
            recipientType: 'consultor',
          }),
        );
      }

      if (pyme.ownerPhone?.trim()) {
        notifications.push(
          this.whatsappService.sendNotificacionCancelacionPyme(pyme.ownerPhone, {
            to: pyme.ownerPhone,
            nombre_pyme: pymeName,
            tema_reunion: meeting.title,
            nombre_consultor: consultant.fullName,
            fecha_hora: dateTime,
            duracion_reunion: duration,
            motivo_cancelacion: cancellationReason,
            codigo_cupon: promotionCode,
          }),
        );
      }

      if (pymeEmail) {
        notifications.push(
          this.emailService.sendMeetingCancellationEmail({
            to: pymeEmail,
            recipientName: pymeName,
            counterpartName: consultant.fullName,
            meetingTitle: meeting.title,
            dateTime,
            duration,
            cancellationReason,
            couponCode: promotionCode,
            recipientType: 'pyme',
          }),
        );
      }

      const results = await Promise.allSettled(notifications);
      results.forEach((result) => {
        if (result.status === 'rejected') {
          const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
          this.logger.error(
            `No se pudo enviar una notificacion de cancelacion de la reunion ${meeting.id}: ${message}`,
          );
        }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `No se pudieron preparar las notificaciones de cancelacion de la reunion ${meeting.id}: ${message}`,
      );
    }
  }

  private async wake() {
    if (this.processing) return;

    this.processing = true;
    this.timer = undefined;
    try {
      await this.recoverStaleJobs();
      await this.expirePastJobs();
      await this.refreshQueue(false);
      const now = Date.now();
      const dueIds = [...this.queue.entries()]
        .filter(([, scheduledAt]) => scheduledAt <= now)
        .sort((left, right) => left[1] - right[1])
        .map(([id]) => id);

      for (const id of dueIds) {
        this.queue.delete(id);
        await this.processNotification(id);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error procesando la cola de notificaciones: ${message}`);
    } finally {
      this.processing = false;
      this.armTimer();
    }
  }

  private async processNotification(id: number) {
    const notification = await this.scheduledNotificationQuery.claim(id, new Date());
    if (!notification) return;

    try {
      await this.sendNotification(notification);
      await this.scheduledNotificationQuery.markCompleted(notification.id);
      this.logger.log(`Notificacion ${notification.id} enviada a ${notification.recipient}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (notification.attempts >= notification.maxAttempts) {
        await this.scheduledNotificationQuery.markFailed(notification.id, message);
        this.logger.error(`Notificacion ${notification.id} fallo definitivamente: ${message}`);
        return;
      }

      const retryAt = new Date(Date.now() + this.retryBaseMs * 2 ** (notification.attempts - 1));
      const retried = await this.scheduledNotificationQuery.scheduleRetry(notification.id, retryAt, message);
      if (retried) this.queue.set(retried.id, retried.scheduledAt.getTime());
      this.logger.warn(`Notificacion ${notification.id} se reintentara en ${retryAt.toISOString()}`);
    }
  }

  private async sendNotification(notification: Awaited<ReturnType<ScheduledNotificationQuery['findPending']>>[number]) {
    const payload = {
      ...notification.payload,
      enlace: MeetingAccessUrlFunction.buildMeetingAccessUrl(notification.meetingId),
    };
    const recipient = await this.resolveReminderRecipient(notification);
    const processes: Promise<unknown>[] = [];

    if (payload.to?.trim()) {
      if (notification.recipient === 'pyme') {
        processes.push(this.whatsappService.sendAlertaReunionPyme(payload.to, payload));
      } else {
        processes.push(
          this.whatsappService.sendAlertaReunionConsultor(payload.to, {
            ...payload,
          }),
        );
      }
    }

    if (recipient.email) {
      processes.push(
        this.emailService.sendMeetingReminderEmail({
          to: recipient.email,
          recipientName: recipient.name,
          counterpartName: notification.recipient === 'pyme' ? payload.nombre_consultor : payload.nombre_pyme,
          meetingTitle: payload.titulo_sesion,
          dateTime: payload.fecha_hora,
          duration: payload.tiempo,
          meetingUrl: payload.enlace,
          reminderTime: payload.tiempo_restante,
          sessionNotes: recipient.sessionNotes,
          recipientType: notification.recipient,
        }),
      );
    }

    if (!processes.length) {
      throw new Error(`La notificacion ${notification.id} no tiene WhatsApp ni correo de destino`);
    }

    const results = await Promise.allSettled(processes);
    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) => (result.reason instanceof Error ? result.reason.message : String(result.reason)));

    if (errors.length) {
      throw new Error(errors.join(' | '));
    }
  }

  private async refreshQueue(armTimer = true) {
    const pending = await this.scheduledNotificationQuery.findPending();
    this.queue.clear();
    for (const notification of pending) {
      this.queue.set(notification.id, notification.scheduledAt.getTime());
    }
    if (armTimer) this.armTimer();
  }

  private armTimer() {
    if (this.timer) clearTimeout(this.timer);
    if (this.processing) return;

    const nextAt = this.queue.size ? Math.min(...this.queue.values()) : Date.now() + this.queueRefreshMs;
    const delay = Math.max(0, Math.min(nextAt - Date.now(), this.queueRefreshMs));
    this.timer = setTimeout(() => void this.wake(), delay);
    this.timer.unref?.();
  }

  private async recoverStaleJobs() {
    const staleBefore = new Date(Date.now() - this.processingStaleMs);
    const recovered = await this.scheduledNotificationQuery.recoverStaleProcessing(staleBefore);
    if (recovered.length) {
      this.logger.warn(`Se recuperaron ${recovered.length} notificacion(es) interrumpida(s)`);
    }
  }

  private async expirePastJobs() {
    const expired = await this.scheduledNotificationQuery.expirePending(new Date());
    for (const notification of expired) this.queue.delete(notification.id);
    if (expired.length) {
      this.logger.warn(`Se cancelaron ${expired.length} notificacion(es) de reuniones ya iniciadas`);
    }
  }

  private async backfillConfirmedMeetings() {
    const meetings = await this.meetingJoinQuery.findConfirmedUpcomingMeetingsWithoutNotifications(new Date());
    for (const meeting of meetings) {
      await this.scheduleMeetingReminders(meeting);
    }
  }

  private buildPayload(
    meeting: Awaited<ReturnType<MeetingQuery['create']>>,
    pymeName: string,
    consultantName: string,
  ): Omit<MeetingReminderPayload, 'to'> {
    const minutesBefore = this.getPositiveInteger('MEETING_REMINDER_MINUTES_BEFORE', 15);
    return {
      tiempo_restante: `${minutesBefore} minutos`,
      nombre_pyme: pymeName,
      nombre_consultor: consultantName,
      titulo_sesion: meeting.title,
      fecha_hora: DateFunction.formatInPeru(meeting.startTime, {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
      tiempo: `${meeting.durationMinutes} minutos`,
      enlace: MeetingAccessUrlFunction.buildMeetingAccessUrl(meeting.id),
      notas_sesion: meeting.description?.trim() || undefined,
    };
  }

  private async resolveReminderRecipient(
    notification: Awaited<ReturnType<ScheduledNotificationQuery['findPending']>>[number],
  ) {
    const payload = notification.payload;
    const storedEmail = payload.correo?.trim();
    const storedName = payload.nombre_destinatario?.trim();
    const storedNotes = payload.notas_sesion?.trim();

    if (storedEmail && storedName && storedNotes) {
      return { email: storedEmail, name: storedName, sessionNotes: storedNotes };
    }

    const meeting = await this.meetingJoinQuery.findOne(notification.meetingId);
    const sessionNotes = storedNotes || meeting?.description?.trim() || undefined;

    if (notification.recipient === 'pyme' && meeting) {
      const pyme = await this.pymeJoinQuery.findOne(meeting.pymeId);
      return {
        email: storedEmail || pyme?.ownerEmail?.trim() || pyme?.userEmail?.trim(),
        name: storedName || pyme?.ownerFirstName?.trim() || pyme?.name || payload.nombre_pyme,
        sessionNotes,
      };
    }

    if (notification.recipient === 'consultor' && meeting) {
      const consultant = await this.consultantJoinQuery.findOne(meeting.consultantId);
      return {
        email: storedEmail || consultant?.userEmail?.trim(),
        name: storedName || consultant?.fullName || payload.nombre_consultor,
        sessionNotes,
      };
    }

    return {
      email: storedEmail,
      name: storedName || (notification.recipient === 'pyme' ? payload.nombre_pyme : payload.nombre_consultor),
      sessionNotes,
    };
  }

  private getScheduledAt(startTime: Date) {
    const minutesBefore = this.getPositiveInteger('MEETING_REMINDER_MINUTES_BEFORE', 15);
    return new Date(Math.max(Date.now(), startTime.getTime() - minutesBefore * 60_000));
  }

  private getPositiveInteger(name: string, fallback: number) {
    const value = Number(process.env[name]);
    return Number.isInteger(value) && value > 0 ? value : fallback;
  }
}
