import { ROLE_PERMISSIONS } from '../saas/saasTypes.ts';
import { stagingBootstrapRepository } from './stagingBootstrapRepository.ts';
import {
  STAGING_BOOTSTRAP_KEY,
  type BootstrapActor,
  type IStagingBootstrapRepository,
  type StagingBootstrapConfig,
  type StagingBootstrapPlan,
  type StagingBootstrapResult,
} from './stagingBootstrapTypes.ts';

const IDS = {
  organization: 'stg_org_synapse_core',
  property: 'stg_prop_synapse_core',
  category: 'stg_category_standard',
  unitOne: 'stg_unit_01',
  unitTwo: 'stg_unit_02',
  publicProperty: 'stg-public-synapse-core',
  publicUnitOne: 'stg-public-unit-01',
  publicUnitTwo: 'stg-public-unit-02',
  ratePlan: 'stg-standard-rate',
  audit: 'stg-bootstrap-v1',
} as const;

export class StagingBootstrapService {
  constructor(private readonly repository: IStagingBootstrapRepository = stagingBootstrapRepository) {}

  async bootstrap(config: StagingBootstrapConfig, actor: BootstrapActor): Promise<StagingBootstrapResult> {
    if (!config.enabled) throw new Error('STAGING_BOOTSTRAP_DISABLED');
    if (!config.allowedUid || actor.uid !== config.allowedUid) throw new Error('STAGING_BOOTSTRAP_FORBIDDEN');
    if (!actor.email) throw new Error('STAGING_BOOTSTRAP_EMAIL_REQUIRED');

    return this.repository.provision(this.createPlan(actor));
  }

  private createPlan(actor: BootstrapActor): StagingBootstrapPlan {
    const now = new Date().toISOString();
    const common = { bootstrapKey: STAGING_BOOTSTRAP_KEY, createdAt: now, updatedAt: now };
    const organizationId = IDS.organization;
    const propertyId = IDS.property;
    const publicPropertyId = IDS.publicProperty;

    const documents = [
      {
        collection: 'organizations', id: organizationId, data: {
          ...common, organizationId, name: 'Synapse Staging Organization', plan: 'trial', status: 'active',
        },
      },
      {
        collection: 'properties', id: propertyId, data: {
          ...common, propertyId, organizationId, name: 'Synapse Staging Property', type: 'hotel', roomsCount: 2,
        },
      },
      {
        collection: 'users', id: actor.uid, data: {
          ...common, userId: actor.uid, organizationId, propertyIds: [propertyId], name: 'Staging Administrator',
          email: actor.email.toLowerCase(), role: 'owner', permissions: ROLE_PERMISSIONS.owner, status: 'active',
        },
      },
      {
        collection: 'staff', id: actor.uid, data: {
          ...common, id: actor.uid, organizationId, propertyId, name: 'Staging Administrator',
          email: actor.email.toLowerCase(), role: 'Super Administrador', permissions: ROLE_PERMISSIONS.owner,
          onboardingCompleted: true,
        },
      },
      {
        collection: 'roomCategories', id: IDS.category, data: {
          ...common, categoryId: IDS.category, organizationId, propertyId, name: 'Staging Standard Room', code: 'STG-STD',
          description: 'Synthetic staging inventory only.', capacity: { standardAdults: 1, maxAdults: 2, maxChildren: 1, totalCapacity: 3 },
          basePrice: 250, beds: [{ type: 'queen', count: 1 }], amenities: [], active: true,
        },
      },
      ...[
        [IDS.unitOne, 'STG-01'],
        [IDS.unitTwo, 'STG-02'],
      ].map(([unitId, unitNumber]) => ({
        collection: 'roomUnits', id: unitId, data: {
          ...common, unitId, organizationId, propertyId, categoryId: IDS.category, unitNumber,
          floor: '1', status: 'clean', active: true,
        },
      })),
      {
        collection: 'publicBookingProperties', id: publicPropertyId, data: {
          ...common, publicPropertyId, organizationId, propertyId, active: true, currency: 'brl',
          ratePlans: [{ ratePlanId: IDS.ratePlan, modifierType: 'fixed', priceModifier: 0, active: true }],
          packages: [], addOns: [], promoCodes: [],
        },
      },
      ...[
        [IDS.publicUnitOne, IDS.unitOne],
        [IDS.publicUnitTwo, IDS.unitTwo],
      ].map(([publicUnitId, unitId]) => ({
        collection: 'publicBookingUnits', id: `${publicPropertyId}__${publicUnitId}`, data: {
          ...common, publicPropertyId, publicUnitId, organizationId, propertyId, unitId, active: true,
        },
      })),
      {
        collection: 'siteContent', id: 'main', data: {
          ...common,
          hero: {
            title: 'Synapse Staging Property',
            subtitle: 'Hospitalidade inteligente com tecnologia Synapse.',
          },
          facilities: [],
        },
      },
      {
        collection: 'themeSettings', id: 'main', data: {
          ...common,
          publicSite: {
            primaryColor: '#1a4731',
          },
        },
      },
      {
        collection: 'stagingBootstrapAudits', id: IDS.audit, data: {
          ...common, actorUserId: actor.uid, action: 'STAGING_TENANT_BOOTSTRAP', status: 'completed',
          organizationId, propertyId, publicPropertyId,
        },
      },
    ];

    return {
      key: STAGING_BOOTSTRAP_KEY,
      actor,
      organizationId,
      propertyId,
      publicPropertyId,
      publicUnitIds: [IDS.publicUnitOne, IDS.publicUnitTwo],
      documents,
    };
  }
}

export const stagingBootstrapService = new StagingBootstrapService();
