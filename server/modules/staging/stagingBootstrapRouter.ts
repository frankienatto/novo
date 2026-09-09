import { Router, type Request, type Response } from 'express';
import { getAdminAuth } from '../../config/firebaseAdmin.ts';
import { env } from '../../config/environment.ts';
import { stagingBootstrapService } from './stagingBootstrapService.ts';
import type { BootstrapActor, StagingBootstrapConfig } from './stagingBootstrapTypes.ts';

interface RouterDependencies {
  config?: StagingBootstrapConfig;
  verifyIdToken?: (token: string) => Promise<BootstrapActor>;
  bootstrap?: (config: StagingBootstrapConfig, actor: BootstrapActor) => Promise<unknown>;
}

function runtimeConfig(): StagingBootstrapConfig {
  return { enabled: env.STAGING_BOOTSTRAP_ENABLED, allowedUid: env.STAGING_BOOTSTRAP_UID };
}

async function verifyFirebaseToken(token: string): Promise<BootstrapActor> {
  const decoded = await getAdminAuth().verifyIdToken(token);
  return { uid: decoded.uid, email: decoded.email };
}

/** Server-only, one-time bootstrap. The request body is intentionally ignored. */
export function createStagingBootstrapRouter(dependencies: RouterDependencies = {}) {
  const router = Router();
  const config = dependencies.config || runtimeConfig();
  const verifyIdToken = dependencies.verifyIdToken || verifyFirebaseToken;
  const bootstrap = dependencies.bootstrap || ((currentConfig, actor) => stagingBootstrapService.bootstrap(currentConfig, actor));

  router.post('/bootstrap', async (req: Request, res: Response) => {
    if (!config.enabled) return res.status(404).json({ error: 'STAGING_BOOTSTRAP_DISABLED' });

    const header = req.headers.authorization;
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'STAGING_BOOTSTRAP_AUTH_REQUIRED' });
    }

    try {
      const actor = await verifyIdToken(header.slice(7).trim());
      const result = await bootstrap(config, actor);
      return res.status(200).json(result);
    } catch (error: any) {
      const code = error?.message || 'STAGING_BOOTSTRAP_FAILED';
      const status = code === 'STAGING_BOOTSTRAP_DISABLED' ? 404
        : code === 'STAGING_BOOTSTRAP_FORBIDDEN' || code === 'STAGING_BOOTSTRAP_EMAIL_REQUIRED' ? 403
          : code === 'STAGING_BOOTSTRAP_CONFLICT' || code === 'STAGING_BOOTSTRAP_PARTIAL_STATE' ? 409 : 400;
      return res.status(status).json({ error: code });
    }
  });

  return router;
}

export const stagingBootstrapRouter = createStagingBootstrapRouter();
