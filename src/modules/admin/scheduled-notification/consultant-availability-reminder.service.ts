import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConsultantAvailability } from '@db/tables/consultant-availability.table';
import { ConsultantAvailabilityRepository } from '@repositories/consultant-availability.repository';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { EmailService } from '../email/email.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

const LIMA_UTC_OFFSET_MS = 5 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MONDAY = 1;
const REMINDER_HOUR_LIMA = 6;
const CONSULTANT_CALENDAR_PATH = '/admin/consultor/meetings';

type WeekDate = {
  date: Date;
  monthKey: string;
  dayKey: string;
};

type ConsultantNotificationRecipient = Awaited<
  ReturnType<ConsultantRepository['findActiveNotificationRecipients']>
>[number];

@Injectable()
export class ConsultantAvailabilityReminderService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(ConsultantAvailabilityReminderService.name);
  private timer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly consultantRepository: ConsultantRepository,
    private readonly availabilityRepository: ConsultantAvailabilityRepository,
    private readonly whatsappService: WhatsappService,
    private readonly emailService: EmailService,
  ) {}

  onApplicationBootstrap() {
    this.scheduleNextRun();
  }

  onModuleDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }

  private scheduleNextRun(reference = new Date()) {
    if (this.timer) clearTimeout(this.timer);

    const nextRun = this.getNextMondayAtSix(reference);
    const delay = Math.max(0, nextRun.getTime() - Date.now());
    this.timer = setTimeout(() => void this.runAndReschedule(), delay);
    this.timer.unref?.();

    this.logger.log(
      `Proximo recordatorio de disponibilidad: ${nextRun.toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        dateStyle: 'full',
        timeStyle: 'short',
      })}`,
    );
  }

  private async runAndReschedule() {
    this.timer = undefined;
    try {
      await this.sendWeeklyAvailabilityReminders(new Date());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`No se pudo procesar el recordatorio semanal de disponibilidad: ${message}`);
    } finally {
      this.scheduleNextRun(new Date(Date.now() + 60_000));
    }
  }

  private async sendWeeklyAvailabilityReminders(reference: Date) {
    const recipients = await this.consultantRepository.findActiveNotificationRecipients();
    if (!recipients.length) {
      this.logger.log('No hay consultores activos para revisar disponibilidad');
      return;
    }

    const weekDates = this.getLimaWeekDates(reference);
    const months = this.getDistinctMonthStarts(weekDates);
    const availability = await this.availabilityRepository.findByConsultantsAndMonths(
      recipients.map((recipient) => recipient.id),
      months,
    );
    const availabilityByConsultantAndMonth = this.indexAvailability(availability);
    const pendingRecipients = recipients.filter(
      (recipient) => !this.hasAvailabilityInWeek(recipient.id, weekDates, availabilityByConsultantAndMonth),
    );
    const period = this.formatWeekPeriod(weekDates);
    const calendarUrl = this.buildCalendarUrl();

    const results = await Promise.allSettled(
      pendingRecipients.map((recipient) => this.notifyConsultant(recipient, period, calendarUrl)),
    );
    const failures = results.filter((result) => result.status === 'rejected');
    failures.forEach((result) => {
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      this.logger.error(`Fallo un recordatorio semanal de disponibilidad: ${message}`);
    });

    this.logger.log(
      `Recordatorio semanal completado: ${pendingRecipients.length - failures.length} enviado(s), ${failures.length} con error, ${recipients.length - pendingRecipients.length} con disponibilidad`,
    );
  }

  private async notifyConsultant(recipient: ConsultantNotificationRecipient, period: string, calendarUrl: string) {
    const notifications: Promise<unknown>[] = [];
    const phone = recipient.ownerPhone?.trim();
    const email = recipient.userEmail?.trim();

    if (phone) {
      notifications.push(
        this.whatsappService.sendAvailabilityPendingReminder(phone, {
          consultantName: recipient.fullName,
          period,
          calendarPath: CONSULTANT_CALENDAR_PATH,
        }),
      );
    }

    if (email) {
      notifications.push(
        this.emailService.sendAvailabilityPendingReminderEmail({
          to: email,
          consultantName: recipient.fullName,
          period,
          calendarUrl,
        }),
      );
    }

    if (!notifications.length) {
      this.logger.warn(`Consultor ${recipient.id} sin telefono ni correo para el recordatorio semanal`);
      return;
    }

    const results = await Promise.allSettled(notifications);
    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) => (result.reason instanceof Error ? result.reason.message : String(result.reason)));

    if (errors.length) {
      throw new Error(`Consultor ${recipient.id}: ${errors.join(' | ')}`);
    }
  }

  private getNextMondayAtSix(reference: Date) {
    const limaDate = new Date(reference.getTime() - LIMA_UTC_OFFSET_MS);
    const weekday = limaDate.getUTCDay();
    const daysUntilMonday = (MONDAY - weekday + 7) % 7;
    let nextRun = new Date(
      Date.UTC(
        limaDate.getUTCFullYear(),
        limaDate.getUTCMonth(),
        limaDate.getUTCDate() + daysUntilMonday,
        REMINDER_HOUR_LIMA + 5,
      ),
    );

    if (nextRun.getTime() <= reference.getTime()) {
      nextRun = new Date(nextRun.getTime() + 7 * ONE_DAY_MS);
    }

    return nextRun;
  }

  private getLimaWeekDates(reference: Date): WeekDate[] {
    const limaDate = new Date(reference.getTime() - LIMA_UTC_OFFSET_MS);
    const daysSinceMonday = (limaDate.getUTCDay() + 6) % 7;
    const monday = new Date(
      Date.UTC(limaDate.getUTCFullYear(), limaDate.getUTCMonth(), limaDate.getUTCDate() - daysSinceMonday),
    );

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday.getTime() + index * ONE_DAY_MS);
      return {
        date,
        monthKey: this.toMonthKey(date),
        dayKey: String(date.getUTCDate()),
      };
    });
  }

  private getDistinctMonthStarts(weekDates: WeekDate[]) {
    const months = new Map<string, Date>();
    for (const { date, monthKey } of weekDates) {
      months.set(monthKey, new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));
    }
    return [...months.values()];
  }

  private indexAvailability(rows: ConsultantAvailability[]) {
    return new Map(rows.map((row) => [`${row.consultantId}:${this.toMonthKey(row.month)}`, row]));
  }

  private hasAvailabilityInWeek(
    consultantId: number,
    weekDates: WeekDate[],
    availabilityByConsultantAndMonth: Map<string, ConsultantAvailability>,
  ) {
    return weekDates.some(({ monthKey, dayKey }) => {
      const availability = availabilityByConsultantAndMonth.get(`${consultantId}:${monthKey}`);
      const times = availability?.availableSchedule?.[dayKey];
      return Array.isArray(times) && times.length > 0;
    });
  }

  private formatWeekPeriod(weekDates: WeekDate[]) {
    const formatter = new Intl.DateTimeFormat('es-PE', {
      timeZone: 'UTC',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    return `Del ${formatter.format(weekDates[0].date)} al ${formatter.format(weekDates[6].date)}`;
  }

  private buildCalendarUrl() {
    const frontendUrl = (process.env.FRONTEND_URL?.trim() || 'https://www.hubsme.net').replace(/\/+$/, '');
    return `${frontendUrl}${CONSULTANT_CALENDAR_PATH}`;
  }

  private toMonthKey(date: Date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }
}
