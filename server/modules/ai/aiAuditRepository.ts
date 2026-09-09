import { randomUUID } from 'node:crypto';
import { getAdminFirestore } from '../../config/firebaseAdmin.ts';

export interface AiRunAuditRecord {
  id: string;
  organizationId: string;
  propertyId: string;
  agentId: string;
  actorUserId: string;
  createdAt: string;
  status: 'completed' | 'failed';
  sanitizedTaskSummary: string;
  proposedActionTypes: string[];
  requiresApproval: boolean;
  resultStatus: string;
  provider: string;
  errorCode?: string;
}

export interface AiAuditRepository {
  record(record: AiRunAuditRecord): Promise<void>;
  listForTests(): AiRunAuditRecord[];
  clearForTests(): void;
}

function sanitizeTaskSummary(task: string): string {
  return task.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email removido]')
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[documento removido]')
    .replace(/(?:token|secret|password)\s*[:=]\s*\S+/gi, '$1=[removido]')
    .replace(/\s+/g, ' ').trim().slice(0, 240);
}

class ServerAiAuditRepository implements AiAuditRepository {
  private readonly testRecords: AiRunAuditRecord[] = [];
  async record(record: AiRunAuditRecord): Promise<void> {
    if (process.env.NODE_ENV === 'test') { this.testRecords.push(record); return; }
    await getAdminFirestore().collection('aiRuns').doc(record.id).set(record);
  }
  listForTests() { return [...this.testRecords]; }
  clearForTests() { this.testRecords.length = 0; }
}

export function createAiRunAudit(input: Omit<AiRunAuditRecord, 'id' | 'createdAt' | 'sanitizedTaskSummary'> & { task: string }): AiRunAuditRecord {
  const { task, ...rest } = input;
  return { ...rest, id: randomUUID(), createdAt: new Date().toISOString(), sanitizedTaskSummary: sanitizeTaskSummary(task) };
}

export const aiAuditRepository: AiAuditRepository = new ServerAiAuditRepository();
