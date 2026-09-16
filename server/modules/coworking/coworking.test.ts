import { describe, it, expect, beforeEach } from 'vitest';
import { CoworkingService } from './coworkingService.ts';
import { ICoworkingRepository } from './coworkingRepository.ts';
import { CoworkingPlanEntity, CoworkingDeskEntity, CoworkingCheckInEntity } from './coworkingTypes.ts';

class MockCoworkingRepo implements ICoworkingRepository {
  private plans = new Map<string, CoworkingPlanEntity>();
  private desks = new Map<string, CoworkingDeskEntity>();
  private checkIns = new Map<string, CoworkingCheckInEntity>();

  async findPlans(orgId: string, propId: string): Promise<CoworkingPlanEntity[]> {
    return Array.from(this.plans.values()).filter(p => p.organizationId === orgId && p.propertyId === propId);
  }
  async savePlan(plan: CoworkingPlanEntity): Promise<CoworkingPlanEntity> {
    this.plans.set(plan.id, plan);
    return plan;
  }
  async deletePlan(orgId: string, propId: string, id: string): Promise<boolean> {
    const p = this.plans.get(id);
    if (!p || p.organizationId !== orgId || p.propertyId !== propId) return false;
    this.plans.delete(id);
    return true;
  }

  async findDesks(orgId: string, propId: string): Promise<CoworkingDeskEntity[]> {
    return Array.from(this.desks.values()).filter(d => d.organizationId === orgId && d.propertyId === propId);
  }
  async findDeskById(orgId: string, propId: string, id: string): Promise<CoworkingDeskEntity | null> {
    const d = this.desks.get(id);
    if (!d || d.organizationId !== orgId || d.propertyId !== propId) return null;
    return d;
  }
  async saveDesk(desk: CoworkingDeskEntity): Promise<CoworkingDeskEntity> {
    this.desks.set(desk.id, desk);
    return desk;
  }
  async deleteDesk(orgId: string, propId: string, id: string): Promise<boolean> {
    const d = await this.findDeskById(orgId, propId, id);
    if (!d) return false;
    this.desks.delete(id);
    return true;
  }

  async findCheckIns(orgId: string, propId: string, status?: 'Active' | 'Finished'): Promise<CoworkingCheckInEntity[]> {
    return Array.from(this.checkIns.values()).filter(c =>
      c.organizationId === orgId && c.propertyId === propId && (!status || c.status === status)
    );
  }
  async findCheckInById(orgId: string, propId: string, id: string): Promise<CoworkingCheckInEntity | null> {
    const c = this.checkIns.get(id);
    if (!c || c.organizationId !== orgId || c.propertyId !== propId) return null;
    return c;
  }
  async saveCheckIn(checkIn: CoworkingCheckInEntity): Promise<CoworkingCheckInEntity> {
    this.checkIns.set(checkIn.id, checkIn);
    return checkIn;
  }
}

describe('CoworkingService', () => {
  let repo: MockCoworkingRepo;
  let service: CoworkingService;

  beforeEach(() => {
    repo = new MockCoworkingRepo();
    service = new CoworkingService(repo);
  });

  it('manages desks, check-in flow and tab consumption', async () => {
    const desk = await service.upsertDesk('org-1', 'prop-beach', { name: 'Mesa 01' });
    const plan = await service.upsertPlan('org-1', 'prop-beach', { name: 'Diária', type: 'day', price: 60 });

    const checkIn = await service.startCheckIn('org-1', 'prop-beach', {
      deskId: desk.id,
      guestName: 'Carlos Dev',
      planId: plan.id
    });

    expect(checkIn.status).toBe('Active');
    const updatedDesk = await repo.findDeskById('org-1', 'prop-beach', desk.id);
    expect(updatedDesk?.status).toBe('Ocupada');

    // Add item to tab
    const withTab = await service.addConsumptionItem('org-1', 'prop-beach', checkIn.id, {
      productId: 'prod-cafe',
      name: 'Café Expresso',
      quantity: 2,
      unitPrice: 7
    });
    expect(withTab.currentItems).toHaveLength(1);
    expect(withTab.currentItems[0].name).toBe('Café Expresso');

    // Finish check-in
    const finished = await service.finishCheckIn('org-1', 'prop-beach', checkIn.id);
    expect(finished.status).toBe('Finished');
    const freeDesk = await repo.findDeskById('org-1', 'prop-beach', desk.id);
    expect(freeDesk?.status).toBe('Livre');
  });
});
