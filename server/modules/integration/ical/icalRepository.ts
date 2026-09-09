import { createHash } from 'node:crypto';
import { getAdminFirestore } from '../../../config/firebaseAdmin.ts';

export interface ICalFeedRecord {
  feedId: string; organizationId: string; propertyId: string; unitId: string;
  provider: string; feedUrl: string; active: boolean; createdAt: string; updatedAt: string;
  lastSyncAt?: string; lastSuccessAt?: string; lastError?: string;
}
export interface ICalExternalEventRecord {
  eventKey: string; feedId: string; organizationId: string; propertyId: string; unitId: string;
  externalUid: string; reservationId?: string; fingerprint: string; status: 'imported' | 'cancelled' | 'conflict'; updatedAt: string;
}

export class ICalRepository {
  private get db() { return getAdminFirestore(); }
  eventKey(org: string, property: string, unit: string, feed: string, uid: string) {
    return createHash('sha256').update(`${org}\u0000${property}\u0000${unit}\u0000${feed}\u0000${uid}`).digest('hex');
  }
  async getFeed(org: string, property: string, feedId: string) {
    const doc = await this.db.collection('icalFeeds').doc(feedId).get();
    const feed = doc.exists ? doc.data() as ICalFeedRecord : null;
    return feed && feed.organizationId === org && feed.propertyId === property ? feed : null;
  }
  async saveFeed(feed: ICalFeedRecord) { await this.db.collection('icalFeeds').doc(feed.feedId).set(feed, { merge: true }); return feed; }
  async getEvent(key: string) { const doc = await this.db.collection('icalExternalEvents').doc(key).get(); return doc.exists ? doc.data() as ICalExternalEventRecord : null; }
  async saveEvent(record: ICalExternalEventRecord) { await this.db.collection('icalExternalEvents').doc(record.eventKey).set(record, { merge: true }); }
  async saveRun(run: Record<string, unknown>) { await this.db.collection('icalSyncRuns').doc(String(run.runId)).set(run); }
  async saveConflict(conflict: Record<string, unknown>) { await this.db.collection('calendarSyncConflicts').doc(String(conflict.conflictId)).set(conflict); }
  async acquireSyncLock(feedId: string, organizationId: string, propertyId: string, ownerRunId: string) {
    const ref = this.db.collection('icalSyncLocks').doc(feedId);
    const now = Date.now(); const expiresAt = new Date(now + 5 * 60_000).toISOString();
    try {
      await this.db.runTransaction(async transaction => {
        const existing = await transaction.get(ref);
        const data = existing.exists ? existing.data() as { expiresAt?: string } : undefined;
        if (data?.expiresAt && new Date(data.expiresAt).getTime() > now) throw new Error('lock-active');
        transaction.set(ref, { feedId, organizationId, propertyId, ownerRunId, acquiredAt: new Date(now).toISOString(), expiresAt });
      });
      return true;
    } catch { return false; }
  }
  async releaseSyncLock(feedId: string, ownerRunId: string) {
    const ref = this.db.collection('icalSyncLocks').doc(feedId);
    await this.db.runTransaction(async transaction => { const lock = await transaction.get(ref); if (lock.exists && lock.data()?.ownerRunId === ownerRunId) transaction.delete(ref); });
  }
}
export const icalRepository = new ICalRepository();
