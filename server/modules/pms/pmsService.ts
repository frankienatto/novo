import { IRoomRepository, roomRepository } from './roomRepository.ts';
import { 
  RoomCategory, 
  RoomUnit, 
  RoomStatus, 
  CreateCategoryDTO, 
  UpdateCategoryDTO, 
  CreateUnitDTO, 
  UpdateUnitDTO, 
  PmsInventorySummary,
  CapacityConfig
} from './pmsTypes.ts';
import { contextService } from '../ai/contextService.ts';

export class PmsService {
  private repo: IRoomRepository;

  constructor(repo: IRoomRepository = roomRepository) {
    this.repo = repo;
  }

  // --- CATEGORIAS ---

  async listCategories(organizationId: string, propertyId: string, includeInactive = false): Promise<RoomCategory[]> {
    return this.repo.findCategories(organizationId, propertyId, includeInactive);
  }

  async getCategoryById(organizationId: string, propertyId: string, categoryId: string): Promise<RoomCategory> {
    const category = await this.repo.findCategoryById(organizationId, propertyId, categoryId);
    if (!category) {
      throw new Error(`Categoria de acomodação '${categoryId}' não foi encontrada.`);
    }
    return category;
  }

  async createCategory(organizationId: string, propertyId: string, dto: CreateCategoryDTO): Promise<RoomCategory> {
    if (!dto.name || dto.name.trim() === '') {
      throw new Error("O nome da categoria é obrigatório.");
    }

    if (!dto.code || dto.code.trim() === '') {
      throw new Error("O código identificador da categoria é obrigatório.");
    }

    const existingCode = await this.repo.findCategoryByCode(organizationId, propertyId, dto.code);
    if (existingCode) {
      throw new Error(`Já existe uma categoria cadastrada com o código '${dto.code}'.`);
    }

    if (dto.basePrice < 0) {
      throw new Error("O valor da diária base não pode ser negativo.");
    }

    this.validateCapacity(dto.capacity);

    const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const category: RoomCategory = {
      categoryId,
      organizationId,
      propertyId,
      name: dto.name.trim(),
      code: dto.code.trim().toUpperCase(),
      description: dto.description?.trim(),
      capacity: dto.capacity,
      basePrice: dto.basePrice,
      beds: dto.beds || [],
      amenities: dto.amenities || [],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await this.repo.saveCategory(category);
    contextService.invalidateCache(organizationId, propertyId);
    return saved;
  }

  async updateCategory(organizationId: string, propertyId: string, categoryId: string, dto: UpdateCategoryDTO): Promise<RoomCategory> {
    const existing = await this.getCategoryById(organizationId, propertyId, categoryId);

    if (dto.code && dto.code.trim().toUpperCase() !== existing.code.toUpperCase()) {
      const codeCheck = await this.repo.findCategoryByCode(organizationId, propertyId, dto.code);
      if (codeCheck) {
        throw new Error(`Já existe uma categoria cadastrada com o código '${dto.code}'.`);
      }
    }

    if (dto.basePrice !== undefined && dto.basePrice < 0) {
      throw new Error("O valor da diária base não pode ser negativo.");
    }

    if (dto.capacity) {
      this.validateCapacity(dto.capacity);
    }

    const updated = await this.repo.updateCategory(organizationId, propertyId, categoryId, {
      ...dto,
      ...(dto.name ? { name: dto.name.trim() } : {}),
      ...(dto.code ? { code: dto.code.trim().toUpperCase() } : {}),
    });

    if (!updated) {
      throw new Error(`Falha ao atualizar a categoria '${categoryId}'.`);
    }

    contextService.invalidateCache(organizationId, propertyId);
    return updated;
  }

  async deleteCategory(organizationId: string, propertyId: string, categoryId: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.getCategoryById(organizationId, propertyId, categoryId);
    
    // Soft Delete da categoria
    await this.repo.updateCategory(organizationId, propertyId, categoryId, { active: false });

    // Desativar também todas as UHs vinculadas a esta categoria (Soft Delete em cascata)
    const categoryUnits = await this.repo.findUnits(organizationId, propertyId, categoryId, true);
    for (const unit of categoryUnits) {
      await this.repo.updateUnit(organizationId, propertyId, unit.unitId, { active: false });
    }

    contextService.invalidateCache(organizationId, propertyId);
    return {
      success: true,
      message: `Categoria '${existing.name}' e suas UHs vinculadas foram desativadas com sucesso (soft delete).`
    };
  }

  // --- UNIDADES HOTELEIRAS (UHs) ---

  async listUnits(organizationId: string, propertyId: string, categoryId?: string, includeInactive = false): Promise<RoomUnit[]> {
    return this.repo.findUnits(organizationId, propertyId, categoryId, includeInactive);
  }

  async getUnitById(organizationId: string, propertyId: string, unitId: string): Promise<RoomUnit> {
    const unit = await this.repo.findUnitById(organizationId, propertyId, unitId);
    if (!unit) {
      throw new Error(`Unidade hoteleira (UH) '${unitId}' não foi encontrada.`);
    }
    return unit;
  }

  async createUnit(organizationId: string, propertyId: string, dto: CreateUnitDTO): Promise<RoomUnit> {
    if (!dto.unitNumber || dto.unitNumber.trim() === '') {
      throw new Error("O número da UH é obrigatório.");
    }

    const category = await this.repo.findCategoryById(organizationId, propertyId, dto.categoryId);
    if (!category || !category.active) {
      throw new Error(`Categoria '${dto.categoryId}' não encontrada ou inativa.`);
    }

    const existingNumber = await this.repo.findUnitByNumber(organizationId, propertyId, dto.unitNumber);
    if (existingNumber) {
      throw new Error(`Já existe uma unidade hoteleira cadastrada com o número '${dto.unitNumber}'.`);
    }

    const validStatus: RoomStatus[] = ['clean', 'dirty', 'inspected', 'out_of_service', 'maintenance'];
    const status: RoomStatus = dto.status && validStatus.includes(dto.status) ? dto.status : 'clean';

    const unitId = `uh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const unit: RoomUnit = {
      unitId,
      organizationId,
      propertyId,
      categoryId: dto.categoryId,
      unitNumber: dto.unitNumber.trim(),
      floor: dto.floor?.trim(),
      block: dto.block?.trim(),
      status,
      notes: dto.notes?.trim(),
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await this.repo.saveUnit(unit);
    contextService.invalidateCache(organizationId, propertyId);
    return saved;
  }

  async updateUnit(organizationId: string, propertyId: string, unitId: string, dto: UpdateUnitDTO): Promise<RoomUnit> {
    const existing = await this.getUnitById(organizationId, propertyId, unitId);

    if (dto.unitNumber && dto.unitNumber.trim() !== existing.unitNumber) {
      const numCheck = await this.repo.findUnitByNumber(organizationId, propertyId, dto.unitNumber);
      if (numCheck) {
        throw new Error(`Já existe uma unidade hoteleira cadastrada com o número '${dto.unitNumber}'.`);
      }
    }

    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const category = await this.repo.findCategoryById(organizationId, propertyId, dto.categoryId);
      if (!category || !category.active) {
        throw new Error(`Categoria '${dto.categoryId}' não encontrada ou inativa.`);
      }
    }

    const updated = await this.repo.updateUnit(organizationId, propertyId, unitId, {
      ...dto,
      ...(dto.unitNumber ? { unitNumber: dto.unitNumber.trim() } : {})
    });

    if (!updated) {
      throw new Error(`Falha ao atualizar a unidade hoteleira '${unitId}'.`);
    }

    contextService.invalidateCache(organizationId, propertyId);
    return updated;
  }

  async updateUnitStatus(organizationId: string, propertyId: string, unitId: string, status: RoomStatus): Promise<RoomUnit> {
    await this.getUnitById(organizationId, propertyId, unitId);

    const validStatuses: RoomStatus[] = ['clean', 'dirty', 'inspected', 'out_of_service', 'maintenance'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Status de acomodação inválido: '${status}'.`);
    }

    const updated = await this.repo.updateUnitStatus(organizationId, propertyId, unitId, status);
    if (!updated) {
      throw new Error(`Falha ao atualizar status da UH '${unitId}'.`);
    }

    contextService.invalidateCache(organizationId, propertyId);
    return updated;
  }

  async deleteUnit(organizationId: string, propertyId: string, unitId: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.getUnitById(organizationId, propertyId, unitId);

    // Soft Delete da UH
    await this.repo.updateUnit(organizationId, propertyId, unitId, { active: false });

    contextService.invalidateCache(organizationId, propertyId);
    return {
      success: true,
      message: `Unidade hoteleira (UH ${existing.unitNumber}) foi desativada com sucesso (soft delete).`
    };
  }

  // --- RESUMO DE INVENTÁRIO ---

  async getInventorySummary(organizationId: string, propertyId: string): Promise<PmsInventorySummary> {
    const categories = await this.repo.findCategories(organizationId, propertyId, false);
    const units = await this.repo.findUnits(organizationId, propertyId, undefined, false);

    const unitsByStatus: Record<RoomStatus, number> = {
      clean: 0,
      dirty: 0,
      inspected: 0,
      out_of_service: 0,
      maintenance: 0
    };

    let totalCapacity = 0;

    for (const unit of units) {
      if (unitsByStatus[unit.status] !== undefined) {
        unitsByStatus[unit.status]++;
      }
      
      const category = categories.find(c => c.categoryId === unit.categoryId);
      if (category) {
        totalCapacity += category.capacity.totalCapacity || category.capacity.standardAdults;
      }
    }

    return {
      totalCategories: categories.length,
      totalUnits: units.length,
      unitsByStatus,
      totalCapacity,
      activeUnitsCount: units.length
    };
  }

  // --- AUXILIAR DE VALIDAÇÃO ---

  private validateCapacity(capacity: CapacityConfig): void {
    if (!capacity) {
      throw new Error("As configurações de capacidade são obrigatórias.");
    }
    if (capacity.standardAdults < 1) {
      throw new Error("A capacidade de adultos padrão deve ser no mínimo 1.");
    }
    if (capacity.maxAdults < capacity.standardAdults) {
      throw new Error("O limite máximo de adultos não pode ser menor que a capacidade padrão.");
    }
    if (capacity.maxChildren < 0) {
      throw new Error("A capacidade máxima de crianças não pode ser negativa.");
    }
    if (capacity.totalCapacity < capacity.maxAdults) {
      throw new Error("A capacidade total não pode ser menor que a capacidade máxima de adultos.");
    }
  }
}

export const pmsService = new PmsService();
