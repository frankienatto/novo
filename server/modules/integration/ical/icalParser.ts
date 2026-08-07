import { ICalEvent, ICalParseResult } from './icalTypes.ts';
import { CreateReservationDTO } from '../../pms/reservationTypes.ts';

export class ICalParser {
  /**
   * Converte uma data iCal RFC 5545 (ex: "20260910T140000Z" ou "20260910") para "YYYY-MM-DD"
   */
  static parseICalDate(rawDate?: string): string {
    if (!rawDate) return new Date().toISOString().substring(0, 10);

    const clean = rawDate.replace(/^.*:/, '').trim(); // Remove prefixos como VALUE=DATE:
    if (clean.length >= 8) {
      const year = clean.substring(0, 4);
      const month = clean.substring(4, 6);
      const day = clean.substring(6, 8);
      return `${year}-${month}-${day}`;
    }

    // Tentar Parse genérico se for ISO
    try {
      const parsed = new Date(clean);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().substring(0, 10);
      }
    } catch {
      // ignore
    }

    return new Date().toISOString().substring(0, 10);
  }

  /**
   * Trata o "line folding" do RFC 5545 (linhas terminadas em CRLF + espaço/tab continuam na linha anterior)
   */
  static unfoldLines(icalContent: string): string[] {
    const rawLines = icalContent.split(/\r\n|\n|\r/);
    const unfolded: string[] = [];

    for (const line of rawLines) {
      if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
        unfolded[unfolded.length - 1] += line.trim();
      } else if (line.trim().length > 0) {
        unfolded.push(line.trim());
      }
    }

    return unfolded;
  }

  /**
   * Realiza o parse de um conteúdo iCalendar RFC 5545
   */
  static parse(icalContent: string): ICalParseResult {
    try {
      if (!icalContent || !icalContent.includes('BEGIN:VCALENDAR')) {
        return {
          success: false,
          totalEventsFound: 0,
          events: [],
          error: 'Conteúdo iCalendar inválido: tag [BEGIN:VCALENDAR] não encontrada.'
        };
      }

      const lines = ICalParser.unfoldLines(icalContent);
      const events: ICalEvent[] = [];
      let inEvent = false;
      let currentEvent: Partial<ICalEvent> = {};

      for (const line of lines) {
        if (line.toUpperCase() === 'BEGIN:VEVENT') {
          inEvent = true;
          currentEvent = { rawAttributes: {} };
          continue;
        }

        if (line.toUpperCase() === 'END:VEVENT') {
          if (inEvent && currentEvent.dtstart && currentEvent.dtend) {
            events.push({
              uid: currentEvent.uid || `ical_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              dtstart: ICalParser.parseICalDate(currentEvent.dtstart),
              dtend: ICalParser.parseICalDate(currentEvent.dtend),
              summary: currentEvent.summary || 'Reserva iCal Externa',
              description: currentEvent.description,
              location: currentEvent.location,
              status: currentEvent.status || 'CONFIRMED',
              lastModified: currentEvent.lastModified,
              rawAttributes: currentEvent.rawAttributes
            });
          }
          inEvent = false;
          currentEvent = {};
          continue;
        }

        if (inEvent) {
          const colonIndex = line.indexOf(':');
          if (colonIndex !== -1) {
            const keyPart = line.substring(0, colonIndex).trim();
            const valuePart = line.substring(colonIndex + 1).trim();

            const keyUpper = keyPart.toUpperCase();
            if (keyUpper.startsWith('UID')) {
              currentEvent.uid = valuePart;
            } else if (keyUpper.startsWith('DTSTART')) {
              currentEvent.dtstart = valuePart;
            } else if (keyUpper.startsWith('DTEND')) {
              currentEvent.dtend = valuePart;
            } else if (keyUpper.startsWith('SUMMARY')) {
              currentEvent.summary = valuePart;
            } else if (keyUpper.startsWith('DESCRIPTION')) {
              currentEvent.description = valuePart;
            } else if (keyUpper.startsWith('LOCATION')) {
              currentEvent.location = valuePart;
            } else if (keyUpper.startsWith('STATUS')) {
              currentEvent.status = valuePart;
            } else if (keyUpper.startsWith('LAST-MODIFIED')) {
              currentEvent.lastModified = valuePart;
            }

            if (currentEvent.rawAttributes) {
              currentEvent.rawAttributes[keyPart] = valuePart;
            }
          }
        }
      }

      return {
        success: true,
        totalEventsFound: events.length,
        events
      };

    } catch (err: any) {
      return {
        success: false,
        totalEventsFound: 0,
        events: [],
        error: `Erro ao processar iCal: ${err?.message || err}`
      };
    }
  }

  /**
   * Converte um ICalEvent parseado para CreateReservationDTO do Synapse PMS
   */
  static toCreateReservationDTO(event: ICalEvent, unitId: string): CreateReservationDTO {
    return {
      unitId,
      guest: {
        fullName: event.summary || 'Hóspede iCal',
        email: `guest.ical.${event.uid.replace(/[^a-zA-Z0-9]/g, '')}@aloha-ical.com`,
        phone: '',
        documentId: ''
      },
      checkInDate: event.dtstart,
      checkOutDate: event.dtend,
      adultsCount: 1,
      childrenCount: 0,
      notes: `Importado via Feed iCal RFC 5545 [UID: ${event.uid}] - Summary: ${event.summary}`,
      source: 'ota_generic'
    };
  }
}
