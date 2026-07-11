import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { Meeting } from '@db/tables/meeting.table';
import { MeetingReminderPayload, ScheduledNotification } from '@db/tables/scheduled-notification.table';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { ScheduledNotificationRepository } from '@repositories/scheduled-notification.repository';
import { WhatsappService } from '../whatsapp/whatsapp.service';

const QUEUE_REFRESH_MS = 60_000;
const PROCESSING_STALE_MS = 5 * 60_000;
const RETRY_BASE_MS = 60_000;

@Injectable()
export class ScheduledNotificationService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(ScheduledNotificationService.name);
  private readonly queue = new Map<number, number>();
  private timer?: ReturnType<typeof setTimeout>;
  private processing = false;

  constructor(
    private readonly notificationRepository: ScheduledNotificationRepository,
    private readonly pymeRepository: PymeRepository,
    private readonly consultantRepository: ConsultantRepository,
    private readonly whatsappService: WhatsappService,
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

  async scheduleMeetingReminders(meeting: Meeting) {
    if (meeting.status !== 'confirmada' || !meeting.meetingUrl || meeting.startTime <= new Date()) {
      await this.cancelMeetingReminders(meeting.id);
      return [];
    }

    const [pyme, consultant] = await Promise.all([
      this.pymeRepository.findOne(meeting.pymeId),
      this.consultantRepository.findOne(meeting.consultantId),
    ]);

    if (!pyme || !consultant) {
      throw new Error(`No se encontraron los participantes de la reunion ${meeting.id}`);
    }

    const scheduledAt = this.getScheduledAt(meeting.startTime);
    const commonPayload = this.buildPayload(meeting, pyme.name, consultant.fullName);
    const maxAttempts = this.getPositiveInteger('MEETING_REMINDER_MAX_ATTEMPTS', 3);
    const notifications = [];

    if (pyme.ownerPhone?.trim()) {
      notifications.push({
        meetingId: meeting.id,
        recipient: 'pyme' as const,
        scheduledAt,
        expiresAt: meeting.startTime,
        maxAttempts,
        payload: {
          ...commonPayload,
          to: pyme.ownerPhone.trim(),
          nombre_pyme: pyme.ownerFirstName?.trim() || pyme.name,
        },
      });
    }

    if (consultant.ownerPhone?.trim()) {
      notifications.push({
        meetingId: meeting.id,
        recipient: 'consultor' as const,
        scheduledAt,
        expiresAt: meeting.startTime,
        maxAttempts,
        payload: { ...commonPayload, to: consultant.ownerPhone.trim() },
      });
    }

    const result = await this.notificationRepository.replacePendingForMeeting(meeting.id, notifications);
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
    const cancelled = await this.notificationRepository.cancelPendingForMeeting(meetingId);
    for (const notification of cancelled) this.queue.delete(notification.id);
    this.armTimer();
    return cancelled;
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
    const notification = await this.notificationRepository.claim(id, new Date());
    if (!notification) return;

    try {
      await this.sendNotification(notification);
      await this.notificationRepository.markCompleted(notification.id);
      this.logger.log(`Notificacion ${notification.id} enviada a ${notification.recipient}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (notification.attempts >= notification.maxAttempts) {
        await this.notificationRepository.markFailed(notification.id, message);
        this.logger.error(`Notificacion ${notification.id} fallo definitivamente: ${message}`);
        return;
      }

      const retryAt = new Date(Date.now() + RETRY_BASE_MS * 2 ** (notification.attempts - 1));
      const retried = await this.notificationRepository.scheduleRetry(notification.id, retryAt, message);
      if (retried) this.queue.set(retried.id, retried.scheduledAt.getTime());
      this.logger.warn(`Notificacion ${notification.id} se reintentara en ${retryAt.toISOString()}`);
    }
  }

  private sendNotification(notification: ScheduledNotification) {
    const payload = notification.payload;
    if (notification.recipient === 'pyme') {
      return this.whatsappService.sendAlertaReunionPyme(payload.to, payload);
    }

    return this.whatsappService.sendAlertaReunionConsultor(payload.to, {
      ...payload,
      link_reunion: payload.enlace,
    });
  }

  private async refreshQueue(armTimer = true) {
    const pending = await this.notificationRepository.findPending();
    this.queue.clear();
    for (const notification of pending) {
      this.queue.set(notification.id, notification.scheduledAt.getTime());
    }
    if (armTimer) this.armTimer();
  }

  private armTimer() {
    if (this.timer) clearTimeout(this.timer);
    if (this.processing) return;

    const nextAt = this.queue.size ? Math.min(...this.queue.values()) : Date.now() + QUEUE_REFRESH_MS;
    const delay = Math.max(0, Math.min(nextAt - Date.now(), QUEUE_REFRESH_MS));
    this.timer = setTimeout(() => void this.wake(), delay);
    this.timer.unref?.();
  }

  private async recoverStaleJobs() {
    const staleBefore = new Date(Date.now() - PROCESSING_STALE_MS);
    const recovered = await this.notificationRepository.recoverStaleProcessing(staleBefore);
    if (recovered.length) {
      this.logger.warn(`Se recuperaron ${recovered.length} notificacion(es) interrumpida(s)`);
    }
  }

  private async expirePastJobs() {
    const expired = await this.notificationRepository.expirePending(new Date());
    for (const notification of expired) this.queue.delete(notification.id);
    if (expired.length) {
      this.logger.warn(`Se cancelaron ${expired.length} notificacion(es) de reuniones ya iniciadas`);
    }
  }

  private async backfillConfirmedMeetings() {
    const meetings = await this.notificationRepository.findConfirmedUpcomingMeetingsWithoutNotifications(new Date());
    for (const meeting of meetings) {
      await this.scheduleMeetingReminders(meeting);
    }
  }

  private buildPayload(meeting: Meeting, pymeName: string, consultantName: string): Omit<MeetingReminderPayload, 'to'> {
    const minutesBefore = this.getPositiveInteger('MEETING_REMINDER_MINUTES_BEFORE', 15);
    return {
      tiempo_header: `${minutesBefore} min`,
      nombre_pyme: pymeName,
      nombre_consultor: consultantName,
      titulo_sesion: meeting.title,
      fecha_hora: meeting.startTime.toLocaleString('es-PE', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Lima',
      }),
      tiempo_body: `${minutesBefore} minutos`,
      enlace: meeting.meetingUrl ?? '',
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
