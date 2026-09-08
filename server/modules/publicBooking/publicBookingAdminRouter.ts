import { Router, Request, Response } from 'express';
import { requirePermission } from '../saas/middlewares/rbacMiddleware.ts';
import { organizationRepository } from '../saas/organizationRepository.ts';
import { roomRepository } from '../pms/roomRepository.ts';
import { publicBookingRepository } from './publicBookingRepository.ts';
import type { PublicBookingProperty, PublicBookingUnit } from './publicBookingTypes.ts';

/**
 * Server-side provisioning surface for the canonical public catalog. It has no
 * public read/write access and is deliberately separate from legacy UI data.
 */
export const publicBookingAdminRouter = Router();

function tenantContext(req: Request) {
  if (!req.organizationId || !req.propertyId) throw new Error('Validated tenant context is required.');
  return { organizationId: req.organizationId, propertyId: req.propertyId };
}

function rejectConflictingTenant(body: any, organizationId: string, propertyId: string) {
  return (body.organizationId && body.organizationId !== organizationId)
    || (body.propertyId && body.propertyId !== propertyId);
}

publicBookingAdminRouter.post('/properties', requirePermission('manage_properties'), async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = tenantContext(req);
    if (rejectConflictingTenant(req.body, organizationId, propertyId)) {
      return res.status(403).json({ error: 'Tenant context cannot be overridden.' });
    }
    const { publicPropertyId, active = true, currency, ratePlans = [], packages = [], addOns = [], promoCodes = [] } = req.body || {};
    if (typeof publicPropertyId !== 'string' || !publicPropertyId.trim() || currency !== 'brl') {
      return res.status(400).json({ error: 'A publicPropertyId and BRL currency are required.' });
    }
    const property = await organizationRepository.getPropertyById(propertyId);
    if (!property || property.organizationId !== organizationId) {
      return res.status(404).json({ error: 'Canonical property is unavailable.' });
    }
    const now = new Date().toISOString();
    const mapping: PublicBookingProperty = {
      publicPropertyId: publicPropertyId.trim(), organizationId, propertyId, active: Boolean(active), currency,
      ratePlans, packages, addOns, promoCodes, createdAt: now, updatedAt: now,
    };
    return res.status(201).json({ data: await publicBookingRepository.createProperty(mapping) });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Unable to provision public property.' });
  }
});

publicBookingAdminRouter.post('/units', requirePermission('manage_properties'), async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = tenantContext(req);
    if (rejectConflictingTenant(req.body, organizationId, propertyId)) {
      return res.status(403).json({ error: 'Tenant context cannot be overridden.' });
    }
    const { publicPropertyId, publicUnitId, unitId, active = true } = req.body || {};
    if (![publicPropertyId, publicUnitId, unitId].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ error: 'publicPropertyId, publicUnitId and unitId are required.' });
    }
    const propertyMapping = await publicBookingRepository.getProperty(publicPropertyId);
    if (!propertyMapping || propertyMapping.organizationId !== organizationId || propertyMapping.propertyId !== propertyId) {
      return res.status(404).json({ error: 'Public property mapping is unavailable for this tenant.' });
    }
    const unit = await roomRepository.findUnitById(organizationId, propertyId, unitId);
    if (!unit || !unit.active) return res.status(404).json({ error: 'Canonical unit is unavailable.' });

    const now = new Date().toISOString();
    const mapping: PublicBookingUnit = {
      publicPropertyId: publicPropertyId.trim(), publicUnitId: publicUnitId.trim(), unitId: unitId.trim(),
      organizationId, propertyId, active: Boolean(active), createdAt: now, updatedAt: now,
    };
    return res.status(201).json({ data: await publicBookingRepository.createUnit(mapping) });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Unable to provision public unit.' });
  }
});
