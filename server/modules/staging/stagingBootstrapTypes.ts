export const STAGING_BOOTSTRAP_KEY = 'synapse-staging-bootstrap-v1';

export interface StagingBootstrapConfig {
  enabled: boolean;
  allowedUid?: string;
}

export interface BootstrapActor {
  uid: string;
  email?: string;
}

export interface BootstrapDocument {
  collection: string;
  id: string;
  data: Record<string, unknown>;
}

export interface StagingBootstrapPlan {
  key: string;
  actor: BootstrapActor;
  organizationId: string;
  propertyId: string;
  publicPropertyId: string;
  publicUnitIds: string[];
  documents: BootstrapDocument[];
}

export interface StagingBootstrapResult {
  status: 'created' | 'already_provisioned';
  organizationId: string;
  propertyId: string;
  publicPropertyId: string;
  publicUnitIds: string[];
}

export interface IStagingBootstrapRepository {
  provision(plan: StagingBootstrapPlan): Promise<StagingBootstrapResult>;
}
