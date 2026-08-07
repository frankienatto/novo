import { GoalStatus } from './goalTypes.ts';

export const ALLOWED_TRANSITIONS: Record<GoalStatus, GoalStatus[]> = {
  CREATED: ['PLANNED', 'PAUSED', 'FAILED', 'ROLLED_BACK'],
  PLANNED: ['WAITING_APPROVAL', 'IN_PROGRESS', 'PAUSED', 'FAILED', 'ROLLED_BACK'],
  WAITING_APPROVAL: ['IN_PROGRESS', 'PAUSED', 'FAILED', 'ROLLED_BACK'],
  IN_PROGRESS: ['PAUSED', 'VALIDATING', 'FAILED', 'WAITING_APPROVAL', 'ROLLED_BACK'],
  PAUSED: ['IN_PROGRESS', 'FAILED', 'ROLLED_BACK'],
  VALIDATING: ['COMPLETED', 'FAILED', 'ROLLED_BACK'],
  COMPLETED: [],
  FAILED: ['ROLLED_BACK'],
  ROLLED_BACK: []
};

export class GoalStateMachine {
  /**
   * Verifica se uma transição de estado é válida.
   */
  public canTransition(currentStatus: GoalStatus, targetStatus: GoalStatus): boolean {
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Valida e executa a transição de estado. Lança erro em caso de transição inválida.
   */
  public validateTransition(currentStatus: GoalStatus, targetStatus: GoalStatus): void {
    if (!this.canTransition(currentStatus, targetStatus)) {
      throw new Error(
        `Transição de estado inválida no Goal Engine: de '${currentStatus}' para '${targetStatus}'. Transições permitidas: [${(ALLOWED_TRANSITIONS[currentStatus] || []).join(', ')}]`
      );
    }
  }
}

export const goalStateMachine = new GoalStateMachine();
