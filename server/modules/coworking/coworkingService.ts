import { ICoworkingRepository, CoworkingRepository } from './coworkingRepository.ts';
import { CoworkingPlanEntity, CoworkingDeskEntity, CoworkingCheckInEntity } from './coworkingTypes.ts';

export class CoworkingService {
  constructor(private repo: ICoworkingRepository = new CoworkingRepository()) {}

  async listPlans(organizationId: string, propertyId: string): Promise<CoworkingPlanEntity[]> {
    return this.repo.findPlans(organizationId, propertyId);
  }

  async upsertPlan(organizationId: string, propertyId: string, data: Omit<CoworkingPlanEntity, 'organizationId' | 'propertyId' | 'id'> & { id?: string }): Promise<CoworkingPlanEntity> {
    const id = data.id || `PLAN_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.repo.savePlan({
      id,
      organizationId,
      propertyId,
      name: data.name,
      type: data.type,
      price: Number(data.price),
    });
  }

  async listDesks(organizationId: string, propertyId: string): Promise<CoworkingDeskEntity[]> {
    return this.repo.findDesks(organizationId, propertyId);
  }

  async upsertDesk(organizationId: string, propertyId: string, data: { id?: string; name: string; status?: 'Livre' | 'Ocupada' | 'Em Manutenção' }): Promise<CoworkingDeskEntity> {
    const id = data.id || `DESK_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.repo.saveDesk({
      id,
      organizationId,
      propertyId,
      name: data.name,
      status: data.status || 'Livre',
    });
  }

  async listCheckIns(organizationId: string, propertyId: string, status?: 'Active' | 'Finished'): Promise<CoworkingCheckInEntity[]> {
    return this.repo.findCheckIns(organizationId, propertyId, status);
  }

  async startCheckIn(
    organizationId: string,
    propertyId: string,
    data: { deskId: string; guestName: string; guestPhone?: string; planId: string }
  ): Promise<CoworkingCheckInEntity> {
    const desk = await this.repo.findDeskById(organizationId, propertyId, data.deskId);
    if (!desk) throw new Error('DESK_NOT_FOUND');
    if (desk.status === 'Ocupada') throw new Error('DESK_ALREADY_OCCUPIED');

    const checkInId = `CHK_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const checkIn: CoworkingCheckInEntity = {
      id: checkInId,
      organizationId,
      propertyId,
      deskId: data.deskId,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      startTime: new Date().toISOString(),
      planId: data.planId,
      status: 'Active',
      currentItems: [],
    };

    await this.repo.saveCheckIn(checkIn);
    await this.repo.saveDesk({ ...desk, status: 'Ocupada', currentCheckInId: checkInId });

    return checkIn;
  }

  async addConsumptionItem(
    organizationId: string,
    propertyId: string,
    checkInId: string,
    item: { productId: string; name: string; quantity: number; unitPrice: number }
  ): Promise<CoworkingCheckInEntity> {
    const checkIn = await this.repo.findCheckInById(organizationId, propertyId, checkInId);
    if (!checkIn) throw new Error('CHECK_IN_NOT_FOUND');
    if (checkIn.status !== 'Active') throw new Error('CHECK_IN_NOT_ACTIVE');

    const updatedItems = [...checkIn.currentItems, item];
    return this.repo.saveCheckIn({ ...checkIn, currentItems: updatedItems });
  }

  async finishCheckIn(organizationId: string, propertyId: string, checkInId: string): Promise<CoworkingCheckInEntity> {
    const checkIn = await this.repo.findCheckInById(organizationId, propertyId, checkInId);
    if (!checkIn) throw new Error('CHECK_IN_NOT_FOUND');

    const finished = await this.repo.saveCheckIn({
      ...checkIn,
      status: 'Finished',
      endTime: new Date().toISOString(),
    });

    const desk = await this.repo.findDeskById(organizationId, propertyId, checkIn.deskId);
    if (desk) {
      await this.repo.saveDesk({ ...desk, status: 'Livre', currentCheckInId: undefined });
    }

    return finished;
  }
}

export const coworkingService = new CoworkingService();
