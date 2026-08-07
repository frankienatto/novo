import { RoomCategory, RoomUnit, RoomStatus } from './pmsTypes.ts';

export interface IRoomRepository {
  // Categorias
  findCategories(organizationId: string, propertyId: string, includeInactive?: boolean): Promise<RoomCategory[]>;
  findCategoryById(organizationId: string, propertyId: string, categoryId: string): Promise<RoomCategory | null>;
  findCategoryByCode(organizationId: string, propertyId: string, code: string): Promise<RoomCategory | null>;
  saveCategory(category: RoomCategory): Promise<RoomCategory>;
  updateCategory(organizationId: string, propertyId: string, categoryId: string, category: Partial<RoomCategory>): Promise<RoomCategory | null>;

  // Unidades Hoteleiras (UHs)
  findUnits(organizationId: string, propertyId: string, categoryId?: string, includeInactive?: boolean): Promise<RoomUnit[]>;
  findUnitById(organizationId: string, propertyId: string, unitId: string): Promise<RoomUnit | null>;
  findUnitByNumber(organizationId: string, propertyId: string, unitNumber: string): Promise<RoomUnit | null>;
  saveUnit(unit: RoomUnit): Promise<RoomUnit>;
  updateUnit(organizationId: string, propertyId: string, unitId: string, unit: Partial<RoomUnit>): Promise<RoomUnit | null>;
  updateUnitStatus(organizationId: string, propertyId: string, unitId: string, status: RoomStatus): Promise<RoomUnit | null>;
}

export class InMemoryRoomRepository implements IRoomRepository {
  private categories: Map<string, RoomCategory> = new Map();
  private units: Map<string, RoomUnit> = new Map();

  constructor() {
    this.seedDevData();
  }

  private seedDevData(): void {
    const devOrgId = 'org_dev_default';
    const devPropId = 'prop_dev_default';

    // Seed 1: Suíte Luxo Mar
    const cat1Id = 'cat_suite_luxo';
    const cat1: RoomCategory = {
      categoryId: cat1Id,
      organizationId: devOrgId,
      propertyId: devPropId,
      name: 'Suíte Luxo Frente Mar',
      code: 'SLM',
      description: 'Suíte espaçosa com varanda privativa e vista panorâmica para o oceano.',
      capacity: {
        standardAdults: 2,
        maxAdults: 2,
        maxChildren: 1,
        totalCapacity: 3
      },
      basePrice: 450.00,
      beds: [
        { type: 'king', count: 1 },
        { type: 'sofa_bed', count: 1 }
      ],
      amenities: ['Ar-Condicionado', 'Wi-Fi 5G', 'Frigobar', 'Smart TV 55"', 'Hidromassagem'],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.categories.set(cat1Id, cat1);

    // Seed 2: Bangalô Jardim
    const cat2Id = 'cat_bangalo_jardim';
    const cat2: RoomCategory = {
      categoryId: cat2Id,
      organizationId: devOrgId,
      propertyId: devPropId,
      name: 'Bangalô Tropical Jardim',
      code: 'BTJ',
      description: 'Bangalô independente cercado por jardins tropicais e rede na varanda.',
      capacity: {
        standardAdults: 2,
        maxAdults: 4,
        maxChildren: 2,
        totalCapacity: 6
      },
      basePrice: 620.00,
      beds: [
        { type: 'queen', count: 1 },
        { type: 'single', count: 2 }
      ],
      amenities: ['Ar-Condicionado', 'Wi-Fi 5G', 'Frigobar', 'Cafeteira Nespresso', 'Rede de Descanso'],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.categories.set(cat2Id, cat2);

    // Seed Units for Suíte Luxo Mar
    const unitsData: Array<{ id: string; catId: string; num: string; floor: string; status: RoomStatus }> = [
      { id: 'uh_101', catId: cat1Id, num: '101', floor: '1º Andar', status: 'clean' },
      { id: 'uh_102', catId: cat1Id, num: '102', floor: '1º Andar', status: 'inspected' },
      { id: 'uh_103', catId: cat1Id, num: '103', floor: '1º Andar', status: 'dirty' },
      { id: 'uh_201', catId: cat2Id, num: '201', floor: 'Térreo', status: 'clean' },
      { id: 'uh_202', catId: cat2Id, num: '202', floor: 'Térreo', status: 'maintenance' }
    ];

    for (const u of unitsData) {
      this.units.set(u.id, {
        unitId: u.id,
        organizationId: devOrgId,
        propertyId: devPropId,
        categoryId: u.catId,
        unitNumber: u.num,
        floor: u.floor,
        block: 'Bloco Principal',
        status: u.status,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  // --- Implementação dos Métodos de Categoria ---

  async findCategories(organizationId: string, propertyId: string, includeInactive = false): Promise<RoomCategory[]> {
    return Array.from(this.categories.values()).filter(c => 
      c.organizationId === organizationId &&
      c.propertyId === propertyId &&
      (includeInactive || c.active)
    );
  }

  async findCategoryById(organizationId: string, propertyId: string, categoryId: string): Promise<RoomCategory | null> {
    const cat = this.categories.get(categoryId);
    if (!cat || cat.organizationId !== organizationId || cat.propertyId !== propertyId) {
      return null;
    }
    return cat;
  }

  async findCategoryByCode(organizationId: string, propertyId: string, code: string): Promise<RoomCategory | null> {
    const normalizedCode = code.trim().toUpperCase();
    return Array.from(this.categories.values()).find(c => 
      c.organizationId === organizationId &&
      c.propertyId === propertyId &&
      c.code.toUpperCase() === normalizedCode
    ) || null;
  }

  async saveCategory(category: RoomCategory): Promise<RoomCategory> {
    this.categories.set(category.categoryId, category);
    return category;
  }

  async updateCategory(organizationId: string, propertyId: string, categoryId: string, updates: Partial<RoomCategory>): Promise<RoomCategory | null> {
    const existing = await this.findCategoryById(organizationId, propertyId, categoryId);
    if (!existing) return null;

    const updated: RoomCategory = {
      ...existing,
      ...updates,
      organizationId, // Imutável
      propertyId,     // Imutável
      categoryId,     // Imutável
      updatedAt: new Date().toISOString()
    };

    this.categories.set(categoryId, updated);
    return updated;
  }

  // --- Implementação dos Métodos de Unidades (UHs) ---

  async findUnits(organizationId: string, propertyId: string, categoryId?: string, includeInactive = false): Promise<RoomUnit[]> {
    return Array.from(this.units.values()).filter(u => 
      u.organizationId === organizationId &&
      u.propertyId === propertyId &&
      (!categoryId || u.categoryId === categoryId) &&
      (includeInactive || u.active)
    );
  }

  async findUnitById(organizationId: string, propertyId: string, unitId: string): Promise<RoomUnit | null> {
    const unit = this.units.get(unitId);
    if (!unit || unit.organizationId !== organizationId || unit.propertyId !== propertyId) {
      return null;
    }
    return unit;
  }

  async findUnitByNumber(organizationId: string, propertyId: string, unitNumber: string): Promise<RoomUnit | null> {
    const normalizedNumber = unitNumber.trim();
    return Array.from(this.units.values()).find(u => 
      u.organizationId === organizationId &&
      u.propertyId === propertyId &&
      u.unitNumber === normalizedNumber
    ) || null;
  }

  async saveUnit(unit: RoomUnit): Promise<RoomUnit> {
    this.units.set(unit.unitId, unit);
    return unit;
  }

  async updateUnit(organizationId: string, propertyId: string, unitId: string, updates: Partial<RoomUnit>): Promise<RoomUnit | null> {
    const existing = await this.findUnitById(organizationId, propertyId, unitId);
    if (!existing) return null;

    const updated: RoomUnit = {
      ...existing,
      ...updates,
      organizationId, // Imutável
      propertyId,     // Imutável
      unitId,         // Imutável
      updatedAt: new Date().toISOString()
    };

    this.units.set(unitId, updated);
    return updated;
  }

  async updateUnitStatus(organizationId: string, propertyId: string, unitId: string, status: RoomStatus): Promise<RoomUnit | null> {
    return this.updateUnit(organizationId, propertyId, unitId, { status });
  }
}

export const roomRepository = new InMemoryRoomRepository();
