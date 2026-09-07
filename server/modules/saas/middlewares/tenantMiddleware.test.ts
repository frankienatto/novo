import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { tenantMiddleware } from './tenantMiddleware';
import { organizationRepository } from '../organizationRepository';

describe('tenantMiddleware - Autorização Estrita de Tenant e Propriedade', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
    mockRes = {
      status: statusSpy as unknown as (code: number) => Response,
    };
    mockNext = vi.fn();
    mockReq = {
      headers: {},
      query: {},
      body: {},
    };
    vi.restoreAllMocks();
  });

  it('1. Deve retornar HTTP 401 se req.saasUser não estiver presente', async () => {
    mockReq.saasUser = undefined;

    await tenantMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Não autenticado' })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('2. Usuário autenticado + Organização própria deve passar com sucesso', async () => {
    mockReq.saasUser = {
      userId: 'user_123',
      organizationId: 'org_dev_default',
      propertyIds: ['prop_dev_default'],
      name: 'Test User',
      email: 'test@example.com',
      role: 'owner',
      permissions: [],
      status: 'active',
      createdAt: '',
      updatedAt: ''
    };

    vi.spyOn(organizationRepository, 'getOrganizationById').mockResolvedValue({
      organizationId: 'org_dev_default',
      name: 'Default Org',
      plan: 'pro',
      status: 'active',
      createdAt: '',
      updatedAt: ''
    });

    await tenantMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.organizationId).toBe('org_dev_default');
    expect(mockReq.propertyId).toBe('prop_dev_default');
  });

  it('3. Tentativa de acessar organização de outro tenant via X-Organization-ID deve retornar HTTP 403', async () => {
    mockReq.saasUser = {
      userId: 'user_123',
      organizationId: 'org_A',
      propertyIds: ['prop_A'],
      name: 'User A',
      email: 'a@example.com',
      role: 'manager',
      permissions: [],
      status: 'active',
      createdAt: '',
      updatedAt: ''
    };

    mockReq.headers = { 'x-organization-id': 'org_B' };

    await tenantMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(403);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Acesso Negado' })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('4. Tentativa de acessar organização de outro tenant via Query String deve retornar HTTP 403', async () => {
    mockReq.saasUser = {
      userId: 'user_123',
      organizationId: 'org_A',
      propertyIds: ['prop_A'],
      name: 'User A',
      email: 'a@example.com',
      role: 'manager',
      permissions: [],
      status: 'active',
      createdAt: '',
      updatedAt: ''
    };

    mockReq.query = { organizationId: 'org_B' };

    await tenantMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(403);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Acesso Negado' })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('5. Tentativa de acessar organização de outro tenant via Body deve retornar HTTP 403', async () => {
    mockReq.saasUser = {
      userId: 'user_123',
      organizationId: 'org_A',
      propertyIds: ['prop_A'],
      name: 'User A',
      email: 'a@example.com',
      role: 'manager',
      permissions: [],
      status: 'active',
      createdAt: '',
      updatedAt: ''
    };

    mockReq.body = { organizationId: 'org_B' };

    await tenantMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(403);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Acesso Negado' })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('6. Solicitando propriedade autorizada do mesmo tenant deve passar', async () => {
    mockReq.saasUser = {
      userId: 'user_123',
      organizationId: 'org_A',
      propertyIds: ['prop_1', 'prop_2'],
      name: 'User A',
      email: 'a@example.com',
      role: 'manager',
      permissions: [],
      status: 'active',
      createdAt: '',
      updatedAt: ''
    };

    mockReq.headers = { 'x-property-id': 'prop_2' };

    vi.spyOn(organizationRepository, 'getOrganizationById').mockResolvedValue({
      organizationId: 'org_A',
      name: 'Org A',
      plan: 'pro',
      status: 'active',
      createdAt: '',
      updatedAt: ''
    });

    await tenantMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.organizationId).toBe('org_A');
    expect(mockReq.propertyId).toBe('prop_2');
  });

  it('7. Solicitando propriedade de outro tenant/não autorizada deve retornar HTTP 403', async () => {
    mockReq.saasUser = {
      userId: 'user_123',
      organizationId: 'org_A',
      propertyIds: ['prop_1'],
      name: 'User A',
      email: 'a@example.com',
      role: 'manager',
      permissions: [],
      status: 'active',
      createdAt: '',
      updatedAt: ''
    };

    mockReq.headers = { 'x-property-id': 'prop_nao_autorizada' };

    await tenantMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(403);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Acesso Negado', message: expect.stringContaining('não autorizada') })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('8. Se o usuário não tiver propriedades autorizadas atribuídas, deve retornar HTTP 403', async () => {
    mockReq.saasUser = {
      userId: 'user_123',
      organizationId: 'org_A',
      propertyIds: [],
      name: 'User A',
      email: 'a@example.com',
      role: 'manager',
      permissions: [],
      status: 'active',
      createdAt: '',
      updatedAt: ''
    };

    await tenantMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(403);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Acesso Negado' })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('9. Se a organização estiver inativa, deve retornar HTTP 403', async () => {
    mockReq.saasUser = {
      userId: 'user_123',
      organizationId: 'org_inativa',
      propertyIds: ['prop_1'],
      name: 'User A',
      email: 'a@example.com',
      role: 'manager',
      permissions: [],
      status: 'active',
      createdAt: '',
      updatedAt: ''
    };

    vi.spyOn(organizationRepository, 'getOrganizationById').mockResolvedValue({
      organizationId: 'org_inativa',
      name: 'Org Inativa',
      plan: 'pro',
      status: 'suspended',
      createdAt: '',
      updatedAt: ''
    });

    await tenantMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(403);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Organização Inativa' })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });
});
