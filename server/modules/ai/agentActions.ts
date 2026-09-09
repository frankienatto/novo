import { z } from 'zod';
import type { Permission } from '../saas/saasTypes.ts';

export const agentActionTypeSchema = z.enum([
  'CREATE_MAINTENANCE_RECOMMENDATION',
  'CREATE_HOUSEKEEPING_RECOMMENDATION',
  'CREATE_RECEPTION_RECOMMENDATION',
  'CREATE_REVENUE_RECOMMENDATION',
  'CREATE_SALES_RECOMMENDATION',
  'CREATE_MARKETING_RECOMMENDATION',
  'CREATE_DECISION_PROPOSAL',
  'CREATE_PLANNING_PROPOSAL'
]);
export type AgentActionType = z.infer<typeof agentActionTypeSchema>;
export type AgentActionMode = 'READ' | 'RECOMMEND' | 'PROPOSE' | 'EXECUTE';

export const agentProposedActionSchema = z.object({
  type: agentActionTypeSchema,
  summary: z.string().min(1).max(500),
  payload: z.record(z.string(), z.unknown()).default({})
});
export type AgentProposedAction = z.infer<typeof agentProposedActionSchema>;

export interface AgentActionDefinition {
  type: AgentActionType;
  mode: AgentActionMode;
  requiredPermission: Permission;
  requiresApproval: boolean;
  handlerMode: 'proposal_only';
}

/** Only proposal/recommendation actions are activated in this phase. No model text can invoke a handler. */
export const AGENT_ACTION_ALLOWLIST: Record<AgentActionType, AgentActionDefinition> = {
  CREATE_MAINTENANCE_RECOMMENDATION: { type: 'CREATE_MAINTENANCE_RECOMMENDATION', mode: 'RECOMMEND', requiredPermission: 'view_dashboard', requiresApproval: false, handlerMode: 'proposal_only' },
  CREATE_HOUSEKEEPING_RECOMMENDATION: { type: 'CREATE_HOUSEKEEPING_RECOMMENDATION', mode: 'RECOMMEND', requiredPermission: 'view_dashboard', requiresApproval: false, handlerMode: 'proposal_only' },
  CREATE_RECEPTION_RECOMMENDATION: { type: 'CREATE_RECEPTION_RECOMMENDATION', mode: 'RECOMMEND', requiredPermission: 'view_dashboard', requiresApproval: false, handlerMode: 'proposal_only' },
  CREATE_REVENUE_RECOMMENDATION: { type: 'CREATE_REVENUE_RECOMMENDATION', mode: 'RECOMMEND', requiredPermission: 'view_dashboard', requiresApproval: false, handlerMode: 'proposal_only' },
  CREATE_SALES_RECOMMENDATION: { type: 'CREATE_SALES_RECOMMENDATION', mode: 'RECOMMEND', requiredPermission: 'view_dashboard', requiresApproval: false, handlerMode: 'proposal_only' },
  CREATE_MARKETING_RECOMMENDATION: { type: 'CREATE_MARKETING_RECOMMENDATION', mode: 'RECOMMEND', requiredPermission: 'view_dashboard', requiresApproval: false, handlerMode: 'proposal_only' },
  CREATE_DECISION_PROPOSAL: { type: 'CREATE_DECISION_PROPOSAL', mode: 'PROPOSE', requiredPermission: 'view_dashboard', requiresApproval: true, handlerMode: 'proposal_only' },
  CREATE_PLANNING_PROPOSAL: { type: 'CREATE_PLANNING_PROPOSAL', mode: 'PROPOSE', requiredPermission: 'manage_planning', requiresApproval: true, handlerMode: 'proposal_only' }
};

const forbiddenActionNames = new Set(['CANCEL_RESERVATION', 'DELETE_RESERVATION', 'MARK_PAYMENT_PAID', 'REFUND', 'DELETE_GUEST', 'CHANGE_ROLE', 'CHANGE_PERMISSION', 'DELETE_PROPERTY', 'CHANGE_TENANT', 'MODIFY_SECRET', 'DELETE_DATA']);

export function validateAgentProposedActions(value: unknown, permissions: Permission[] = []): AgentProposedAction[] {
  const actions = z.array(agentProposedActionSchema).safeParse(value || []);
  if (!actions.success) throw new Error('AI_ACTION_SCHEMA_INVALID');
  return actions.data.map((action) => {
    if (forbiddenActionNames.has(action.type)) throw new Error('AI_ACTION_FORBIDDEN');
    const definition = AGENT_ACTION_ALLOWLIST[action.type];
    if (!definition) throw new Error('AI_ACTION_UNSUPPORTED');
    if (!permissions.includes(definition.requiredPermission)) throw new Error('AI_ACTION_PERMISSION_DENIED');
    return action;
  });
}
