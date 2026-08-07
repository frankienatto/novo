import { reservationService } from '../../pms/reservationService.ts';
import { pmsService } from '../../pms/pmsService.ts';
import { ICalGenerator } from './icalGenerator.ts';
import { ICalParser } from './icalParser.ts';
import { ICalParseResult, ICalFeedSummary } from './icalTypes.ts';

export class ICalService {
  private lastExportedMap: Map<string, string> = new Map();
  private lastImportedMap: Map<string, string> = new Map();

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
    targetUnitId?: string
  ): Promise<{ parseResult: ICalParseResult; createdReservationsCount: number }> {
    const parseResult = ICalParser.parse(icsContent);
    if (!parseResult.success) {
      return { parseResult, createdReservationsCount: 0 };
    }

    let createdCount = 0;

    if (targetUnitId) {
      for (const event of parseResult.events) {
        try {
          const dto = ICalParser.toCreateReservationDTO(event, targetUnitId);
          await reservationService.createReservation(organizationId, propertyId, dto);
          createdCount++;
        } catch (err: any) {
          console.warn(`⚠️ [ICalService] Pulo de importação de evento iCal [UID: ${event.uid}]:`, err?.message || err);
        }
      }
    }

    this.lastImportedMap.set(`${organizationId}_${propertyId}`, new Date().toISOString());

    return {
      parseResult,
      createdReservationsCount: createdCount
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
