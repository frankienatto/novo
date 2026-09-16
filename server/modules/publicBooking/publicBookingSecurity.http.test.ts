import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPublicCatalog: vi.fn(),
  createProperty: vi.fn(),
  createUnit: vi.fn(),
  getPropertyById: vi.fn(),
}));

vi.mock('./publicBookingService.ts', () => ({
  publicBookingService: {
    getPublicCatalog: mocks.getPublicCatalog,
  },
}));

vi.mock('../saas/organizationRepository.ts', () => ({
  organizationRepository: {
    getPropertyById: mocks.getPropertyById,
  },
}));

vi.mock('./publicBookingRepository.ts', () => ({
  publicBookingRepository: {
    createProperty: mocks.createProperty,
    createUnit: mocks.createUnit,
  },
}));

import { publicCheckoutRouter } from './publicCheckoutRouter.ts';
import { publicBookingAdminRouter } from './publicBookingAdminRouter.ts';
import { requirePermission } from '../saas/middlewares/rbacMiddleware.ts';

function createTestApp() {
  const app = express();
  app.use(express.json());

  // Simulação fiel de saasProtected [authMiddleware, tenantMiddleware]
  const saasProtected = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'Cabeçalho Authorization no formato "Bearer <token>" é obrigatório.',
      });
    }

    const token = authHeader.substring(7).trim();
    if (token === 'valid-admin-token') {
      req.organizationId = 'org-canonical-1';
      req.propertyId = 'prop-canonical-1';
      req.saasUser = {
        userId: 'admin-user-1',
        role: 'admin',
        permissions: ['manage_properties', 'manage_bookings'],
      } as any;
      return next();
    }

    if (token === 'valid-unprivileged-token') {
      req.organizationId = 'org-canonical-1';
      req.propertyId = 'prop-canonical-1';
      req.saasUser = {
        userId: 'staff-user-2',
        role: 'receptionist',
        permissions: ['view_bookings'], // Sem manage_properties
      } as any;
      return next();
    }

    return res.status(401).json({
      error: 'Não autenticado',
      message: 'Token de autenticação inválido.',
    });
  };

  // Exata ordem e montagem de server.ts
  app.use('/api/public-booking/admin', saasProtected, publicBookingAdminRouter);
  app.use('/api/public-booking', publicCheckoutRouter);
  app.use('/api/public-booking/catalog', saasProtected, publicBookingAdminRouter);

  return app;
}

const runRequest = async (
  path: string,
  method: string = 'GET',
  headers: Record<string, string> = {},
  body?: unknown
) => {
  const app = createTestApp();
  return new Promise<Response>((resolve) => {
    const server = app.listen(0, async () => {
      const port = (server.address() as any).port;
      try {
        const response = await fetch(`http://127.0.0.1:${port}${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        resolve(response);
      } finally {
        server.close();
      }
    });
  });
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Public Booking Security & Routing Regression', () => {
  it('1. GET /api/public-booking/catalog/:publicPropertyId sem Authorization deve retornar 200 OK', async () => {
    mocks.getPublicCatalog.mockResolvedValueOnce({
      publicPropertyId: 'stg-public-synapse-core',
      propertyName: 'Synapse Staging Core Hotel',
      currency: 'BRL',
      units: [
        {
          publicUnitId: 'unit-stg-deluxe',
          name: 'Suíte Deluxe Staging',
          capacity: { maxAdults: 2, totalCapacity: 3 },
          basePrice: 450,
          ratePlans: [],
        },
      ],
      packages: [],
      addOns: [],
    });

    const res = await runRequest('/api/public-booking/catalog/stg-public-synapse-core');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.publicPropertyId).toBe('stg-public-synapse-core');
    expect(body.data.units).toHaveLength(1);
    expect(mocks.getPublicCatalog).toHaveBeenCalledWith('stg-public-synapse-core');
  });

  it('2. Acesso ao catálogo público ignora e não depende de tenant headers do cliente', async () => {
    mocks.getPublicCatalog.mockResolvedValueOnce({
      publicPropertyId: 'stg-public-synapse-core',
      propertyName: 'Synapse Staging Core Hotel',
      currency: 'BRL',
      units: [],
      packages: [],
      addOns: [],
    });

    // Mesmo com headers de tenant falsos/manipulados enviados pelo cliente, a resolução é estritamente server-side
    const res = await runRequest(
      '/api/public-booking/catalog/stg-public-synapse-core',
      'GET',
      {
        'x-organization-id': 'hacker-org',
        'x-property-id': 'hacker-prop',
      }
    );
    expect(res.status).toBe(200);
    expect(mocks.getPublicCatalog).toHaveBeenCalledWith('stg-public-synapse-core');
  });

  it('3. Catálogo público inexistente ou inativo deve falhar fechado (HTTP 404)', async () => {
    mocks.getPublicCatalog.mockRejectedValueOnce(new Error('Public property is unavailable.'));

    const res = await runRequest('/api/public-booking/catalog/unknown-property-id');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Public property is unavailable.');
  });

  it('4. Admin provisioning sem Authorization deve retornar HTTP 401', async () => {
    // Rota canônica /api/public-booking/admin/properties
    const resAdmin = await runRequest('/api/public-booking/admin/properties', 'POST', {}, {
      publicPropertyId: 'new-prop',
      organizationId: 'org-canonical-1',
      propertyId: 'prop-canonical-1',
      propertyName: 'Nova Propriedade',
      active: true,
      currency: 'BRL',
    });
    expect(resAdmin.status).toBe(401);
    expect(mocks.createProperty).not.toHaveBeenCalled();

    // Rota de compatibilidade /api/public-booking/catalog/properties
    const resCatalog = await runRequest('/api/public-booking/catalog/properties', 'POST', {}, {
      publicPropertyId: 'new-prop',
      organizationId: 'org-canonical-1',
      propertyId: 'prop-canonical-1',
      propertyName: 'Nova Propriedade',
      active: true,
      currency: 'BRL',
    });
    expect(resCatalog.status).toBe(401);
    expect(mocks.createProperty).not.toHaveBeenCalled();
  });

  it('5. Admin provisioning com usuário sem permissão (RBAC) deve retornar HTTP 403', async () => {
    const res = await runRequest(
      '/api/public-booking/admin/properties',
      'POST',
      { Authorization: 'Bearer valid-unprivileged-token' },
      {
        publicPropertyId: 'new-prop',
        organizationId: 'org-canonical-1',
        propertyId: 'prop-canonical-1',
        propertyName: 'Nova Propriedade',
        active: true,
        currency: 'BRL',
      }
    );
    expect(res.status).toBe(403);
    expect(mocks.createProperty).not.toHaveBeenCalled();
  });

  it('6. Admin provisioning com permissão autorizada deve executar com sucesso (HTTP 201)', async () => {
    mocks.getPropertyById.mockResolvedValueOnce({
      id: 'prop-canonical-1',
      organizationId: 'org-canonical-1',
      name: 'Propriedade Canônica',
      active: true,
    });

    mocks.createProperty.mockResolvedValueOnce({
      publicPropertyId: 'new-prop',
      organizationId: 'org-canonical-1',
      propertyId: 'prop-canonical-1',
      propertyName: 'Nova Propriedade',
      active: true,
      currency: 'brl',
      ratePlans: [],
      packages: [],
      addOns: [],
      promoCodes: [],
    });

    const res = await runRequest(
      '/api/public-booking/admin/properties',
      'POST',
      { Authorization: 'Bearer valid-admin-token' },
      {
        publicPropertyId: 'new-prop',
        organizationId: 'org-canonical-1',
        propertyId: 'prop-canonical-1',
        propertyName: 'Nova Propriedade',
        active: true,
        currency: 'brl',
        ratePlans: [],
        packages: [],
        addOns: [],
        promoCodes: [],
      }
    );
    expect(res.status).toBe(201);
    expect(mocks.createProperty).toHaveBeenCalled();
  });

  it('7. Nenhuma rota administrativa pode ser acessada publicamente', async () => {
    const resAdminGet = await runRequest('/api/public-booking/admin/properties', 'GET');
    expect(resAdminGet.status).toBe(401);

    const resAdminUnits = await runRequest('/api/public-booking/admin/units', 'POST');
    expect(resAdminUnits.status).toBe(401);

    const resCatalogUnits = await runRequest('/api/public-booking/catalog/units', 'POST');
    expect(resCatalogUnits.status).toBe(401);
  });
});
