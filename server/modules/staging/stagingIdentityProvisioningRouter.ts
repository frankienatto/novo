import { Router, type Request, type Response } from 'express';
import { getAdminAuth, getAdminFirestore } from '../../config/firebaseAdmin.ts';
import { env } from '../../config/environment.ts';
import { crmService } from '../crm/crmService.ts';
import { StagingIdentityProvisioningService, type StagingIdentityProvisioningConfig } from './stagingIdentityProvisioningService.ts';

const configuration = (): StagingIdentityProvisioningConfig => ({ enabled: env.STAGING_IDENTITY_PROVISIONING_ENABLED, organizationId: env.STAGING_IDENTITY_PROVISIONING_ORGANIZATION_ID });

export function createStagingIdentityProvisioningRouter(service = new StagingIdentityProvisioningService(
  configuration(), getAdminFirestore() as any, getAdminAuth() as any, (guestId) => crmService.getGuestById(guestId),
)) {
  const router = Router();
  const actor = (req: Request) => req.saasUser!;
  router.post('/staff', async (req: Request, res: Response) => {
    try { return res.status(201).json({ success: true, data: await service.provisionStaff(actor(req), req.body || {}) }); }
    catch (error: any) { const code = error?.message || 'STAGING_IDENTITY_PROVISIONING_FAILED'; const status = /DISABLED/.test(code) ? 404 : /DENIED|MISMATCH|INVALID|CONFLICT|NOT_ALLOWED|REQUIRED/.test(code) ? 403 : 400; return res.status(status).json({ success: false, error: code }); }
  });
  router.post('/guest', async (req: Request, res: Response) => {
    try { return res.status(201).json({ success: true, data: await service.provisionGuest(actor(req), req.body || {}) }); }
    catch (error: any) { const code = error?.message || 'STAGING_IDENTITY_PROVISIONING_FAILED'; const status = /DISABLED/.test(code) ? 404 : /DENIED|MISMATCH|INVALID|CONFLICT|REQUIRED/.test(code) ? 403 : 400; return res.status(status).json({ success: false, error: code }); }
  });
  return router;
}

export const stagingIdentityProvisioningRouter = createStagingIdentityProvisioningRouter();
