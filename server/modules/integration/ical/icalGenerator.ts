import { Reservation } from '../../pms/reservationTypes.ts';
import { RoomUnit } from '../../pms/pmsTypes.ts';
import { ICalGenerateOptions } from './icalTypes.ts';

export class ICalGenerator {
  /**
   * Formata uma data "YYYY-MM-DD" para o padrão iCal "YYYYMMDD"
   */
  private static formatDateToICal(dateStr: string): string {
    return dateStr.replace(/-/g, '');
  }

  /**
   * Escapa caracteres especiais conforme o padrão RFC 5545
   */
  private static escapeText(text?: string): string {
    if (!text) return '';
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  /**
   * Gera o conteúdo da especificação RFC 5545 iCalendar (.ics)
   */
  static generateICS(
    reservations: Reservation[],
    unitsMap: Map<string, RoomUnit>,
    options: ICalGenerateOptions
  ): string {
    const lines: string[] = [];

    // Header VCALENDAR
    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//Synapse Hospitality//AHOS iCal Engine 2.0//PT_BR');
    lines.push('CALSCALE:GREGORIAN');
    lines.push('METHOD:PUBLISH');
    lines.push(`X-WR-CALNAME:${ICalGenerator.escapeText(options.propertyName)}${options.unitNumber ? ` - UH ${options.unitNumber}` : ''}`);
    lines.push(`X-WR-TIMEZONE:America/Sao_Paulo`);

    const nowFormatted = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    // Eventos VEVENT
    for (const res of reservations) {
      // Ignorar reservas canceladas na exportação do calendário
      if (res.status === 'cancelled') continue;

      const unit = unitsMap.get(res.unitId);
      const unitLabel = unit ? `UH ${unit.unitNumber}` : 'UH Reservada';

      const dtStart = ICalGenerator.formatDateToICal(res.stayPeriod.checkInDate);
      const dtEnd = ICalGenerator.formatDateToICal(res.stayPeriod.checkOutDate);

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:synapse_res_${res.reservationId}@synapsehospitality.com`);
      lines.push(`DTSTAMP:${nowFormatted}`);
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
      lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
      lines.push(`SUMMARY:${ICalGenerator.escapeText(`${res.guest.fullName} (${unitLabel})`)}`);
      lines.push(`DESCRIPTION:${ICalGenerator.escapeText(`Reserva PMS: ${res.reservationId} | Canal: ${res.source} | Pessoas: ${res.adultsCount || 1}A / ${res.childrenCount || 0}C`)}`);
      lines.push(`LOCATION:${ICalGenerator.escapeText(`${options.propertyName} - ${unitLabel}`)}`);
      lines.push(`STATUS:${res.status === 'confirmed' || res.status === 'checked_in' ? 'CONFIRMED' : 'TENTATIVE'}`);
      lines.push(`LAST-MODIFIED:${nowFormatted}`);
      lines.push('END:VEVENT');
    }

    // Footer VCALENDAR
    lines.push('END:VCALENDAR');

    return lines.join('\r\n');
  }
}
