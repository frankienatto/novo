import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { createMockFirestore } from '../../../../server/test/mockFirestore';
import * as firebaseAdminModule from '../../../config/firebaseAdmin';

const mockDb = createMockFirestore();
vi.spyOn(firebaseAdminModule, 'getAdminFirestore').mockReturnValue(mockDb as any);

import { authMiddleware } from './authMiddleware';

describe('authMiddleware - Fundação de Autenticação Server-Side', () => {
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
    };
    vi.restoreAllMocks();
    vi.spyOn(firebaseAdminModule, 'getAdminFirestore').mockReturnValue(mockDb as any);
  });

  it('1. Ausência do cabeçalho Authorization deve retornar HTTP 401', async () => {
    mockReq.headers = {};
    await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Não autenticado' })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('2. Authorization sem formato Bearer deve retornar HTTP 401', async () => {
    mockReq.headers = { authorization: 'Basic dXNlcjpwYXNz' };
    await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Não autenticado' })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('3. Bearer token aleatório/inválido deve retornar HTTP 401', async () => {
    mockReq.headers = { authorization: 'Bearer token_aleatorio_invalido' };

    vi.spyOn(firebaseAdminModule, 'getAdminAuth').mockReturnValue({
      verifyIdToken: vi.fn().mockRejectedValue(new Error('Firebase ID Token is invalid')),
    } as any);

    await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Não autenticado', message: expect.stringContaining('inválido ou expirado') })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('4. Bearer = "user_dev_owner" sem assinatura válida deve retornar HTTP 401', async () => {
    mockReq.headers = { authorization: 'Bearer user_dev_owner' };

    vi.spyOn(firebaseAdminModule, 'getAdminAuth').mockReturnValue({
      verifyIdToken: vi.fn().mockRejectedValue(new Error('Decoding Firebase ID Token failed')),
    } as any);

    await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Não autenticado' })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('5. Header X-User-ID sem token de autorização deve retornar HTTP 401', async () => {
    mockReq.headers = { 'x-user-id': 'user_dev_owner' };

    await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Não autenticado' })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('6. Header X-User-ID forjado + token de outro usuário deve usar estritamente a identidade do token', async () => {
    mockReq.headers = {
      authorization: 'Bearer token_real_validado',
      'x-user-id': 'user_dev_owner_forjado'
    };

    vi.spyOn(firebaseAdminModule, 'getAdminAuth').mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({
        uid: 'uid_real_do_token_123',
        email: 'usuario_real@synapse.com',
        role: 'staff',
        organizationId: 'org_token',
        propertyIds: ['prop_token']
      }),
    } as any);

    await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.saasUser).toBeDefined();
    expect(mockReq.saasUser?.userId).toBe('uid_real_do_token_123');
    expect(mockReq.saasUser?.userId).not.toBe('user_dev_owner_forjado');
  });

  it('7. Token Firebase válido deve identificar o usuário e prosseguir para o próximo handler', async () => {
    mockReq.headers = { authorization: 'Bearer valid_firebase_jwt' };

    vi.spyOn(firebaseAdminModule, 'getAdminAuth').mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({
        uid: 'uid_firebase_autenticado',
        email: 'admin@foresthouse.com',
        name: 'Admin Valido',
        organizationId: 'org_token',
        propertyIds: ['prop_token']
      }),
    } as any);

    await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.saasUser).toBeDefined();
    expect(mockReq.saasUser?.email).toBe('admin@foresthouse.com');
  });

  it('8. Token expirado deve ser rejeitado com HTTP 401', async () => {
    mockReq.headers = { authorization: 'Bearer token_expirado' };

    vi.spyOn(firebaseAdminModule, 'getAdminAuth').mockReturnValue({
      verifyIdToken: vi.fn().mockRejectedValue(new Error('Firebase ID token has expired')),
    } as any);

    await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('9. Token malformado deve ser rejeitado com HTTP 401', async () => {
    mockReq.headers = { authorization: 'Bearer header.payload.signature_invalid' };

    vi.spyOn(firebaseAdminModule, 'getAdminAuth').mockReturnValue({
      verifyIdToken: vi.fn().mockRejectedValue(new Error('Invalid signature')),
    } as any);

    await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('10. Papel (role) enviado via header não pode fabricar autorização', async () => {
    mockReq.headers = {
      authorization: 'Bearer token_normal',
      'x-user-role': 'owner'
    };

    vi.spyOn(firebaseAdminModule, 'getAdminAuth').mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({
        uid: 'uid_staff_normal',
        email: 'staff@synapse.com',
        role: 'staff',
        organizationId: 'org_token',
        propertyIds: ['prop_token']
      }),
    } as any);

    await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.saasUser?.role).toBe('staff');
    expect(mockReq.saasUser?.role).not.toBe('owner');
  });

  it('11. Token válido sem vínculo provisionado nunca recebe tenant de desenvolvimento', async () => {
    mockReq.headers = { authorization: 'Bearer token_sem_tenant' };
    vi.spyOn(firebaseAdminModule, 'getAdminAuth').mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: 'uid_without_membership', email: 'new@synapse.com' }),
    } as any);

    await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockReq.saasUser).toBeUndefined();
  });
});
