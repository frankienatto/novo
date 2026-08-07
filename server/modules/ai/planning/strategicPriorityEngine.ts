import { OperationalKPIsSnapshot, StrategicRiskItem } from './planningTypes.ts';

export class StrategicPriorityEngine {
  /**
   * Determina áreas de foco prioritárias da propriedade para os próximos ciclos de planejamento.
   */
  public determinePriorityFocusAreas(snapshot: OperationalKPIsSnapshot, risks: StrategicRiskItem[]): string[] {
    const focusAreas: string[] = [];

    const criticalRisks = risks.filter(r => r.severity === 'CRITICAL');
    if (criticalRisks.length > 0) {
      focusAreas.push(`Mitigação Imediata de Riscos Críticos: ${criticalRisks.map(r => r.category).join(', ')}`);
    }

    if (snapshot.occupancyRatePercent < 60) {
      focusAreas.push('Alavancagem Intensiva de Ocupação e Captura de Demanda Direta');
    } else if (snapshot.occupancyRatePercent >= 75) {
      focusAreas.push('Yield Management e Expansão da Margem Diária Média (ADR)');
    }

    if (snapshot.cancelledProposalsCount > 5) {
      focusAreas.push('Recuperação Ativa do Funil de Conversão Comercial no CRM');
    }

    if (snapshot.housekeepingSlaPercent < 85) {
      focusAreas.push('Excelência Operacional na Governança e Otimização de SLA de Limpeza');
    }

    if (focusAreas.length === 0) {
      focusAreas.push('Manutenção da Performance e Monitoramento Preditivo de Indicadores');
    }

    return focusAreas;
  }
}

export const strategicPriorityEngine = new StrategicPriorityEngine();
