import { getAdminFirestore } from '../../config/firebaseAdmin.ts';
import type {
  IStagingBootstrapRepository,
  StagingBootstrapPlan,
  StagingBootstrapResult,
} from './stagingBootstrapTypes.ts';

/** Writes the complete staging seed in one Firestore transaction. */
export class FirestoreStagingBootstrapRepository implements IStagingBootstrapRepository {
  private get db() {
    return getAdminFirestore();
  }

  async provision(plan: StagingBootstrapPlan): Promise<StagingBootstrapResult> {
    return this.db.runTransaction(async (transaction) => {
      const references = plan.documents.map((document) => this.db.collection(document.collection).doc(document.id));
      const snapshots = await Promise.all(references.map((reference) => transaction.get(reference)));
      const existing = snapshots.filter((snapshot) => snapshot.exists);

      if (existing.length === references.length) {
        const matchesBootstrap = existing.every((snapshot) => snapshot.data()?.bootstrapKey === plan.key);
        if (!matchesBootstrap) throw new Error('STAGING_BOOTSTRAP_CONFLICT');
        return this.result(plan, 'already_provisioned');
      }

      // A previous interrupted/manual write is unsafe to repair implicitly.
      // Firestore transactions are atomic, so this condition indicates an
      // out-of-band inconsistency and remains fail-closed for an operator.
      if (existing.length > 0) throw new Error('STAGING_BOOTSTRAP_PARTIAL_STATE');

      plan.documents.forEach((document, index) => transaction.create(references[index], document.data));
      return this.result(plan, 'created');
    });
  }

  private result(plan: StagingBootstrapPlan, status: StagingBootstrapResult['status']): StagingBootstrapResult {
    return {
      status,
      organizationId: plan.organizationId,
      propertyId: plan.propertyId,
      publicPropertyId: plan.publicPropertyId,
      publicUnitIds: plan.publicUnitIds,
    };
  }
}

export const stagingBootstrapRepository = new FirestoreStagingBootstrapRepository();
