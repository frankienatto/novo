import { GuestTimelineEvent } from './timelineTypes.ts';

export class TimelineRepository {
  private timelineMap: Map<string, GuestTimelineEvent[]> = new Map(); // key: guestId
  private MAX_EVENTS_PER_GUEST = 200;

  /**
   * Adiciona um evento à timeline do hóspede com política FIFO (máximo 200 eventos)
   */
  async append(event: GuestTimelineEvent): Promise<GuestTimelineEvent> {
    const list = this.timelineMap.get(event.guestId) || [];
    
    // Inserir no início (ordem cronológica decrescente: mais recentes primeiro)
    list.unshift({ ...event });

    if (list.length > this.MAX_EVENTS_PER_GUEST) {
      list.pop(); // Remove o evento mais antigo
    }

    this.timelineMap.set(event.guestId, list);
    return { ...event };
  }

  /**
   * Consulta os eventos da timeline de um hóspede com limite opcional
   */
  async findByGuestId(guestId: string, limit?: number): Promise<GuestTimelineEvent[]> {
    const list = this.timelineMap.get(guestId) || [];
    const copy = list.map(e => ({ ...e }));
    return limit && limit > 0 ? copy.slice(0, limit) : copy;
  }

  /**
   * Retorna o total de eventos registrados na timeline de um hóspede
   */
  async countByGuestId(guestId: string): Promise<number> {
    const list = this.timelineMap.get(guestId) || [];
    return list.length;
  }
}

export const timelineRepository = new TimelineRepository();
