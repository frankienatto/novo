import { Router, type Request, type Response } from 'express';
import { getAdminAuth, getAdminFirestore } from '../../config/firebaseAdmin.ts';
import { env } from '../../config/environment.ts';
import { crmService } from '../crm/crmService.ts';
import { StagingIdentityProvisioningService, type StagingIdentityProvisioningConfig } from './stagingIdentityProvisioningService.ts';

const configuration = (): StagingIdentityProvisioningConfig => ({
  enabled: env.STAGING_IDENTITY_PROVISIONING_ENABLED,
  organizationId: env.STAGING_IDENTITY_PROVISIONING_ORGANIZATION_ID,
  testStaffUid: env.STAGING_TEST_STAFF_UID,
  testStaffEmail: env.STAGING_TEST_STAFF_EMAIL,
  testStaffName: env.STAGING_TEST_STAFF_NAME,
  testGuestUid: env.STAGING_TEST_GUEST_UID,
  testGuestEmail: env.STAGING_TEST_GUEST_EMAIL,
  testGuestName: env.STAGING_TEST_GUEST_NAME,
  testGuestPhone: env.STAGING_TEST_GUEST_PHONE,
});

export function createStagingIdentityProvisioningRouter(service = new StagingIdentityProvisioningService(
  configuration(), getAdminFirestore() as any, getAdminAuth() as any,
  (guestId) => crmService.getGuestById(guestId),
  async (organizationId, input) => {
    const existing = await crmService.getGuestByEmail(organizationId, input.email);
    if (existing) return { guestId: existing.guestId, organizationId: existing.organizationId, email: existing.email };
    const guest = await crmService.createGuest(organizationId, input);
    return { guestId: guest.guestId, organizationId: guest.organizationId, email: guest.email };
  },
)) {
  const router = Router();
  const actor = (req: Request) => req.saasUser!;
  const respond = (res: Response, error: unknown) => {
    const code = error instanceof Error ? error.message : 'STAGING_IDENTITY_PROVISIONING_FAILED';
    const status = /DISABLED/.test(code) ? 404 : /DENIED|MISMATCH|INVALID|CONFLICT|NOT_ALLOWED|REQUIRED/.test(code) ? 403 : 400;
    return res.status(status).json({ success: false, error: code });
  };
  router.get('/status', (_req: Request, res: Response) => {
    const status = service.getStatus();
    return res.status(status.enabled ? 200 : 404).json({ success: status.enabled, data: status });
  });
  router.post('/staff', async (req: Request, res: Response) => {
    try { return res.status(201).json({ success: true, data: await service.provisionStaff(actor(req), req.body || {}) }); }
    catch (error: unknown) { return respond(res, error); }
  });
  router.post('/guest', async (req: Request, res: Response) => {
    try { return res.status(201).json({ success: true, data: await service.provisionGuest(actor(req), req.body || {}) }); }
    catch (error: unknown) { return respond(res, error); }
  });
  router.post('/test-accounts', async (req: Request, res: Response) => {
    try { return res.status(201).json({ success: true, data: await service.provisionConfiguredTestIdentities(actor(req)) }); }
    catch (error: unknown) { return respond(res, error); }
  });
  return router;
}

export const stagingIdentityProvisioningRouter = createStagingIdentityProvisioningRouter();
