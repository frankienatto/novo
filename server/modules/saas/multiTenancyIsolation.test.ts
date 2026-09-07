import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tenantMiddleware } from './middlewares/tenantMiddleware.ts';
import { organizationRepository } from './organizationRepository.ts';
import { roomRepository } from '../pms/roomRepository.ts';
import { reservationRepository } from '../pms/reservationRepository.ts';
import { Request, Response } from 'express';

describe('FASE 4.4 — Validação Estrita de Multi-Tenancy & Isolamento Cross-Tenant', () => {
  const orgA = 'org_alpha';
  const orgB = 'org_beta';

  const propA = 'prop_alpha_beach';
  const propB = 'prop_alpha_mountain';
  const propC = 'prop_beta_resort';

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock das organizações ativas no repositório
    vi.spyOn(organizationRepository, 'getOrganizationById').mockImplementation(async (id: string) => {
      if (id === orgA) {
        return {
          organizationId: orgA,
          name: 'Organização Alpha Hotéis',
          documentNumber: '11.111.111/0001-11',
          plan: 'enterprise',
          status: 'active',
          contactEmail: 'admin@alpha.com',
          contactPhone: '11999999999',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z'
        };
      }
      if (id === orgB) {
        return {
          organizationId: orgB,
          name: 'Organização Beta Resorts',
          documentNumber: '22.222.222/0001-22',
          plan: 'pro',
          status: 'active',
          contactEmail: 'admin@beta.com',
          contactPhone: '21999999999',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z'
        };
      }
      return null;
    });
  });

  function createMockResponse() {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
  }

  describe('1. Isolamento Intra-Organização e Inter-Propriedade (Org A -> Prop A vs Prop B)', () => {
    it('Usuário da Org A com acesso restrito apenas à Prop A DEVE acessar Prop A com sucesso', async () => {
      const req: any = {
        saasUser: {
          id: 'user_a1',
          organizationId: orgA,
          propertyIds: [propA],
          role: 'manager'
        },
        headers: { 'x-property-id': propA },
        query: {},
        body: {}
      };
      const res = createMockResponse();
      const next = vi.fn();

      await tenantMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.organizationId).toBe(orgA);
      expect(req.propertyId).toBe(propA);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('Usuário da Org A com acesso apenas à Prop A NÃO consegue acessar Prop B da mesma Org (Retorna HTTP 403)', async () => {
      const req: any = {
        saasUser: {
          id: 'user_a1',
          organizationId: orgA,
          propertyIds: [propA], // Não inclui propB!
          role: 'receptionist'
        },
        headers: { 'x-property-id': propB }, // Tentativa de acessar outra filial
        query: {},
        body: {}
      };
      const res = createMockResponse();
      const next = vi.fn();

      await tenantMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Acesso Negado',
          message: expect.stringContaining(propB)
        })
      );
    });

    it('Usuário da Org A com permissão multi-propriedade [Prop A, Prop B] pode alternar explicitamente entre elas', async () => {
      const req: any = {
        saasUser: {
          id: 'user_a_director',
          organizationId: orgA,
          propertyIds: [propA, propB],
          role: 'admin'
        },
        headers: { 'x-property-id': propB },
        query: {},
        body: {}
      };
      const res = createMockResponse();
      const next = vi.fn();

      await tenantMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.organizationId).toBe(orgA);
      expect(req.propertyId).toBe(propB);
    });
  });

  describe('2. Isolamento Cross-Organização Estrito (Org A vs Org B -> Prop C)', () => {
    it('Usuário da Org A NUNCA consegue acessar a Prop C da Org B (Retorna HTTP 403)', async () => {
      const req: any = {
        saasUser: {
          id: 'user_a1',
          organizationId: orgA,
          propertyIds: [propA],
          role: 'admin'
        },
        headers: {
          'x-organization-id': orgB, // Tentativa de trocar organização no header
          'x-property-id': propC
        },
        query: {},
        body: {}
      };
      const res = createMockResponse();
      const next = vi.fn();

      await tenantMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Acesso Negado',
          message: expect.stringContaining(orgB)
        })
      );
    });

    it('Tentativa de forjar organizationId via Query Params DEVE ser rejeitada com HTTP 403', async () => {
      const req: any = {
        saasUser: {
          id: 'user_a1',
          organizationId: orgA,
          propertyIds: [propA],
          role: 'manager'
        },
        headers: {},
        query: { organizationId: orgB }, // Forjado na query string
        body: {}
      };
      const res = createMockResponse();
      const next = vi.fn();

      await tenantMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Acesso Negado'
        })
      );
    });

    it('Tentativa de forjar propertyId via Body Payload DEVE ser rejeitada com HTTP 403', async () => {
      const req: any = {
        saasUser: {
          id: 'user_a1',
          organizationId: orgA,
          propertyIds: [propA],
          role: 'receptionist'
        },
        headers: {},
        query: {},
        body: { propertyId: propC } // Forjado no payload JSON
      };
      const res = createMockResponse();
      const next = vi.fn();

      await tenantMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Acesso Negado',
          message: expect.stringContaining(propC)
        })
      );
    });
  });

  describe('3. Isolamento na Camada de Dados e Repositórios', () => {
    it('Repositório rejeita atualização que tente mutar o organizationId de uma categoria de quarto', async () => {
      // Mock de categoria pertencente à Org A
      vi.spyOn(roomRepository, 'findCategoryById').mockResolvedValueOnce({
        categoryId: 'cat_101',
        organizationId: orgA,
        propertyId: propA,
        name: 'Suíte Master',
        code: 'MST',
        description: 'Suíte master luxo',
        basePrice: 500,
        capacity: {
          standardAdults: 2,
          maxAdults: 3,
          maxChildren: 1,
          totalCapacity: 3
        },
        beds: [],
        amenities: [],
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      });

      // Tentativa de update alterando organizationId
      await expect(
        roomRepository.updateCategory(orgA, propA, 'cat_101', { organizationId: orgB as any })
      ).rejects.toThrow(/Não é permitido alterar o organizationId/i);
    });

    it('Repositório de reservas rejeita update que tente transferir reserva para outro tenant', async () => {
      vi.spyOn(reservationRepository, 'findReservationById').mockResolvedValueOnce({
        reservationId: 'res_101',
        organizationId: orgA,
        propertyId: propA,
        unitId: 'unit_101',
        categoryId: 'cat_101',
        guest: {
          guestId: 'guest_1',
          fullName: 'João Silva',
          email: 'joao@email.com'
        },
        stayPeriod: {
          checkInDate: '2026-06-01',
          checkOutDate: '2026-06-05',
          numberOfNights: 4
        },
        adultsCount: 2,
        childrenCount: 0,
        totalAmount: 2000,
        status: 'confirmed',
        source: 'direct_website',
        paymentStatus: 'paid',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      });

      await expect(
        reservationRepository.updateReservation(orgA, propA, 'res_101', { organizationId: orgB as any })
      ).rejects.toThrow(/Não é permitido alterar o organizationId/i);
    });
  });
});
