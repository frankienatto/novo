import { 
  ChatMessage, 
  SessionMemory, 
  SessionMemoryRepository, 
  DEFAULT_SESSION_HISTORY_LIMIT 
} from './aiTypes.ts';

function generateMessageId(): string {
  return `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

export class InMemorySessionMemory implements SessionMemoryRepository {
  private sessions: Map<string, SessionMemory> = new Map();

  async getSession(sessionId: string): Promise<SessionMemory | null> {
    return this.sessions.get(sessionId) || null;
  }

  async saveSession(session: SessionMemory): Promise<SessionMemory> {
    this.sessions.set(session.sessionId, session);
    return session;
  }

  async addMessage(
    sessionId: string, 
    messageData: Omit<ChatMessage, 'id' | 'timestamp'>, 
    meta?: { organizationId: string; propertyId?: string; agentId?: string }
  ): Promise<ChatMessage> {
    const now = new Date().toISOString();
    const existing = this.sessions.get(sessionId);

    const newMessage: ChatMessage = {
      id: generateMessageId(),
      role: messageData.role,
      content: messageData.content,
      timestamp: now
    };

    const organizationId = meta?.organizationId || existing?.organizationId || 'org_dev_default';
    const propertyId = meta?.propertyId || existing?.propertyId;
    const agentId = meta?.agentId || existing?.agentId;

    const currentMessages = existing ? existing.messages : [];
    const updatedMessages = [...currentMessages, newMessage];

    // Truncar mantendo as N últimas mensagens (DEFAULT_SESSION_HISTORY_LIMIT)
    const trimmedMessages = updatedMessages.slice(-DEFAULT_SESSION_HISTORY_LIMIT);

    const updatedSession: SessionMemory = {
      sessionId,
      organizationId,
      propertyId,
      agentId,
      messages: trimmedMessages,
      updatedAt: now
    };

    this.sessions.set(sessionId, updatedSession);
    return newMessage;
  }

  async getRecentMessages(sessionId: string, limit: number = DEFAULT_SESSION_HISTORY_LIMIT): Promise<ChatMessage[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }
    return session.messages.slice(-limit);
  }

  async clearSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}

export const sessionMemory: SessionMemoryRepository = new InMemorySessionMemory();
