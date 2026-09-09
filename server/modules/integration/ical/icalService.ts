import { reservationService } from '../../pms/reservationService.ts';
import { pmsService } from '../../pms/pmsService.ts';
import { ICalGenerator } from './icalGenerator.ts';
import { ICalParser } from './icalParser.ts';
import { ICalParseResult, ICalFeedSummary } from './icalTypes.ts';
import { randomUUID, createHash } from 'node:crypto';
import { icalRepository, ICalFeedRecord } from './icalRepository.ts';
import { lookup } from 'node:dns/promises';

export class ICalService {
  private lastExportedMap: Map<string, string> = new Map();
  private lastImportedMap: Map<string, string> = new Map();

  private isPrivateAddress(address: string) {
    return address === '::1' || address === '0.0.0.0' || /^127\./.test(address) || /^10\./.test(address) || /^192\.168\./.test(address) || /^169\.254\./.test(address) || /^172\.(1[6-9]|2\d|3[01])\./.test(address) || /^fc/i.test(address) || /^fe80:/i.test(address);
  }
  private async validateRemoteUrl(raw: string) {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('URL de feed inválida.');
    if (url.hostname === 'localhost' || this.isPrivateAddress(url.hostname)) throw new Error('Destino de feed não permitido.');
    const addresses = await lookup(url.hostname, { all: true });
    if (!addresses.length || addresses.some(item => this.isPrivateAddress(item.address))) throw new Error('Destino de feed não permitido.');
    return url;
  }
  private async downloadFeed(feed: ICalFeedRecord) {
    const url = await this.validateRemoteUrl(feed.feedUrl);
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(url, { signal: controller.signal, redirect: 'error', headers: { accept: 'text/calendar,text/plain;q=0.9' } });
      if (!response.ok) throw new Error('Feed remoto indisponível.');
      const length = Number(response.headers.get('content-length') || 0); if (length > 1_000_000) throw new Error('Feed remoto excede o limite permitido.');
      const reader = response.body?.getReader(); if (!reader) throw new Error('Feed remoto vazio.');
      const chunks: Uint8Array[] = []; let total = 0;
      while (true) { const { done, value } = await reader.read(); if (done) break; total += value.byteLength; if (total > 1_000_000) throw new Error('Feed remoto excede o limite permitido.'); chunks.push(value); }
      return new TextDecoder().decode(Buffer.concat(chunks));
    } finally { clearTimeout(timer); }
  }

  async syncFeed(organizationId: string, propertyId: string, feedId: string) {
    const feed = await icalRepository.getFeed(organizationId, propertyId, feedId);
    if (!feed || !feed.active) throw new Error('Feed iCal não encontrado ou inativo.');
    const ownerRunId = randomUUID();
    if (!await icalRepository.acquireSyncLock(feedId, organizationId, propertyId, ownerRunId)) throw new Error('Sincronização deste feed já está em andamento.');
    try {
      let lastError: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        try { return await this.importFeedContent(organizationId, propertyId, await this.downloadFeed(feed), feed.unitId, feedId); }
        catch (error) { lastError = error; if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1))); }
      }
      throw lastError;
    } finally { await icalRepository.releaseSyncLock(feedId, ownerRunId); }
  }

  /**
   * Exporta feed .ics para uma propriedade inteira ou UH específica
   */
  async generatePropertyFeed(
    organizationId: string,
    propertyId: string,
    unitId?: string
  ): Promise<{ filename: string; icsContent: string }> {
    const timestamp = new Date().toISOString();
    const [reservations, units] = await Promise.all([
      reservationService.listReservations(organizationId, propertyId),
      pmsService.listUnits(organizationId, propertyId)
    ]);

    const unitsMap = new Map(units.map(u => [u.unitId, u]));

    let targetReservations = reservations;
    let unitNumber: string | undefined;

    if (unitId) {
      targetReservations = reservations.filter(r => r.unitId === unitId);
      const targetUnit = unitsMap.get(unitId);
      unitNumber = targetUnit?.unitNumber;
    }

    const icsContent = ICalGenerator.generateICS(targetReservations, unitsMap, {
      propertyName: `Propriedade ${propertyId}`,
      organizationId,
      propertyId,
      unitId,
      unitNumber
    });

    this.lastExportedMap.set(`${organizationId}_${propertyId}`, timestamp);

    const filename = unitNumber 
      ? `calendar_prop_${propertyId}_uh_${unitNumber}.ics`
      : `calendar_prop_${propertyId}_all.ics`;

    return { filename, icsContent };
  }

  /**
   * Importa e parseia um feed .ics recebido
   */
  async importFeedContent(
    organizationId: string,
    propertyId: string,
    icsContent: string,
    targetUnitId?: string,
    feedId?: string
  ): Promise<{ parseResult: ICalParseResult; createdReservationsCount: number; updatedReservationsCount: number; conflictsCount: number }> {
    const parseResult = ICalParser.parse(icsContent);
    if (!parseResult.success) {
      return { parseResult, createdReservationsCount: 0, updatedReservationsCount: 0, conflictsCount: 0 };
    }
    if (!targetUnitId || !feedId) throw new Error('feedId e targetUnitId são obrigatórios para sincronização iCal persistente.');
    const feed = await icalRepository.getFeed(organizationId, propertyId, feedId);
    if (!feed || !feed.active || feed.unitId !== targetUnitId) throw new Error('Feed iCal não encontrado ou fora do escopo da unidade.');

    let createdCount = 0;
    let updatedCount = 0;
    let conflictsCount = 0;
    const runId = randomUUID(); const startedAt = new Date().toISOString();

    try {
      for (const event of parseResult.events) {
        try {
          const eventKey = icalRepository.eventKey(organizationId, propertyId, targetUnitId, feedId, event.uid);
          const fingerprint = createHash('sha256').update(`${event.dtstart}|${event.dtend}|${event.status || ''}|${event.lastModified || ''}`).digest('hex');
          const existing = await icalRepository.getEvent(eventKey);
          if (existing?.fingerprint === fingerprint) continue;
          if (String(event.status).toUpperCase() === 'CANCELLED' && existing?.reservationId) {
            await reservationService.cancelReservation(organizationId, propertyId, existing.reservationId, 'Cancelamento recebido via iCal');
            await icalRepository.saveEvent({ ...existing, fingerprint, status: 'cancelled', updatedAt: new Date().toISOString() });
            updatedCount++; continue;
          }
          if (existing?.reservationId) {
            await icalRepository.saveEvent({ ...existing, fingerprint, updatedAt: new Date().toISOString() });
            updatedCount++; continue;
          }
          const dto = ICalParser.toCreateReservationDTO(event, targetUnitId);
          const reservation = await reservationService.createReservation(organizationId, propertyId, dto);
          await icalRepository.saveEvent({ eventKey, feedId, organizationId, propertyId, unitId: targetUnitId, externalUid: event.uid, reservationId: reservation.reservationId, fingerprint, status: 'imported', updatedAt: new Date().toISOString() });
          createdCount++;
        } catch (err: any) {
          conflictsCount++;
          await icalRepository.saveConflict({ conflictId: randomUUID(), organizationId, propertyId, unitId: targetUnitId, feedId, externalUid: event.uid, detectedAt: new Date().toISOString(), status: 'open', reason: 'reservation_conflict' });
        }
      }
      await icalRepository.saveFeed({ ...feed, lastSyncAt: new Date().toISOString(), lastSuccessAt: new Date().toISOString(), lastError: undefined, updatedAt: new Date().toISOString() });
      await icalRepository.saveRun({ runId, feedId, organizationId, propertyId, unitId: targetUnitId, startedAt, finishedAt: new Date().toISOString(), status: 'success', imported: createdCount, updated: updatedCount, conflicts: conflictsCount });
    } catch (err: any) {
      await icalRepository.saveFeed({ ...feed, lastSyncAt: new Date().toISOString(), lastError: 'Falha ao sincronizar feed iCal.', updatedAt: new Date().toISOString() });
      await icalRepository.saveRun({ runId, feedId, organizationId, propertyId, unitId: targetUnitId, startedAt, finishedAt: new Date().toISOString(), status: 'failed', imported: createdCount, updated: updatedCount, conflicts: conflictsCount, error: 'Falha ao sincronizar feed iCal.' });
      throw err;
    }

    this.lastImportedMap.set(`${organizationId}_${propertyId}`, new Date().toISOString());

    return {
      parseResult,
      createdReservationsCount: createdCount,
      updatedReservationsCount: updatedCount,
      conflictsCount
    };
  }

  /**
   * Retorna resumo de feeds iCal para o ContextService da IA
   */
  getICalSummary(organizationId: string, propertyId: string): ICalFeedSummary {
    const key = `${organizationId}_${propertyId}`;
    return {
      propertyId,
      activeFeedsCount: 1,
      lastExportedAt: this.lastExportedMap.get(key) || undefined,
      lastImportedAt: this.lastImportedMap.get(key) || undefined
    };
  }
}

export const icalService = new ICalService();
