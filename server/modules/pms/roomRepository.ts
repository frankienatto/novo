import { RoomCategory, RoomUnit, RoomStatus } from './pmsTypes.ts';
import { getAdminFirestore } from '../../config/firebaseAdmin.ts';

export interface IRoomRepository {
  // Categorias
  findCategories(organizationId: string, propertyId: string, includeInactive?: boolean): Promise<RoomCategory[]>;
  findCategoryById(organizationId: string, propertyId: string, categoryId: string): Promise<RoomCategory | null>;
  findCategoryByCode(organizationId: string, propertyId: string, code: string): Promise<RoomCategory | null>;
  saveCategory(category: RoomCategory): Promise<RoomCategory>;
  createCategory?(category: RoomCategory): Promise<RoomCategory>;
  updateCategory(organizationId: string, propertyId: string, categoryId: string, category: Partial<RoomCategory>): Promise<RoomCategory | null>;
  deleteCategory?(organizationId: string, propertyId: string, categoryId: string): Promise<boolean>;

  // Unidades Hoteleiras (UHs)
  findUnits(organizationId: string, propertyId: string, categoryId?: string, includeInactive?: boolean): Promise<RoomUnit[]>;
  findUnitById(organizationId: string, propertyId: string, unitId: string): Promise<RoomUnit | null>;
  findUnitByNumber(organizationId: string, propertyId: string, unitNumber: string): Promise<RoomUnit | null>;
  saveUnit(unit: RoomUnit): Promise<RoomUnit>;
  createUnit?(unit: RoomUnit): Promise<RoomUnit>;
  updateUnit(organizationId: string, propertyId: string, unitId: string, unit: Partial<RoomUnit>): Promise<RoomUnit | null>;
  updateUnitStatus(organizationId: string, propertyId: string, unitId: string, status: RoomStatus): Promise<RoomUnit | null>;
  deleteUnit?(organizationId: string, propertyId: string, unitId: string): Promise<boolean>;
  seedDevData?(): Promise<void>;
}

export class RoomRepository implements IRoomRepository {
  private get db() {
    return getAdminFirestore();
  }

  // --- Implementação dos Métodos de Categoria ---

  async findCategories(organizationId: string, propertyId: string, includeInactive = false): Promise<RoomCategory[]> {
    if (!organizationId || !propertyId) return [];

    const snapshot = await this.db.collection('roomCategories')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId)
      .get();

    const categories: RoomCategory[] = [];
    snapshot.forEach(doc => {
      const data = doc.data() as RoomCategory;
      if (includeInactive || data.active !== false) {
        categories.push(data);
      }
    });

    return categories;
  }

  async findCategoryById(organizationId: string, propertyId: string, categoryId: string): Promise<RoomCategory | null> {
    if (!organizationId || !propertyId || !categoryId) return null;

    const docSnap = await this.db.collection('roomCategories').doc(categoryId).get();
    if (!docSnap.exists) return null;

    const data = docSnap.data() as RoomCategory;
    if (data.organizationId !== organizationId || data.propertyId !== propertyId) {
      return null;
    }

    return data;
  }

  async findCategoryByCode(organizationId: string, propertyId: string, code: string): Promise<RoomCategory | null> {
    if (!organizationId || !propertyId || !code) return null;
    const normalizedCode = code.trim().toUpperCase();

    const snapshot = await this.db.collection('roomCategories')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data() as RoomCategory;
      if (data.code && data.code.trim().toUpperCase() === normalizedCode) {
        return data;
      }
    }

    return null;
  }

  async saveCategory(category: RoomCategory): Promise<RoomCategory> {
    if (!category.categoryId) {
      category.categoryId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    }
    if (!category.createdAt) {
      category.createdAt = new Date().toISOString();
    }
    category.updatedAt = new Date().toISOString();

    await this.db.collection('roomCategories').doc(category.categoryId).set(category, { merge: true });
    return category;
  }

  async createCategory(category: RoomCategory): Promise<RoomCategory> {
    return this.saveCategory(category);
  }

  async updateCategory(
    organizationId: string, 
    propertyId: string, 
    categoryId: string, 
    updates: Partial<RoomCategory>
  ): Promise<RoomCategory | null> {
    const existing = await this.findCategoryById(organizationId, propertyId, categoryId);
    if (!existing) return null;

    // Proteção de imutabilidade multi-tenant
    if (updates.organizationId && updates.organizationId !== organizationId) {
      throw new Error("Não é permitido alterar o organizationId de uma categoria existente.");
    }
    if (updates.propertyId && updates.propertyId !== propertyId) {
      throw new Error("Não é permitido alterar o propertyId de uma categoria existente.");
    }

    const updated: RoomCategory = {
      ...existing,
      ...updates,
      organizationId, // Imutável
      propertyId,     // Imutável
      categoryId,     // Imutável
      updatedAt: new Date().toISOString()
    };

    await this.db.collection('roomCategories').doc(categoryId).set(updated, { merge: true });
    return updated;
  }

  async deleteCategory(organizationId: string, propertyId: string, categoryId: string): Promise<boolean> {
    const existing = await this.findCategoryById(organizationId, propertyId, categoryId);
    if (!existing) return false;

    await this.db.collection('roomCategories').doc(categoryId).delete();
    return true;
  }

  // --- Implementação dos Métodos de Unidades (UHs) ---

  async findUnits(organizationId: string, propertyId: string, categoryId?: string, includeInactive = false): Promise<RoomUnit[]> {
    if (!organizationId || !propertyId) return [];

    let query = this.db.collection('rooms')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId);

    if (categoryId) {
      query = query.where('categoryId', '==', categoryId);
    }

    const snapshot = await query.get();
    const units: RoomUnit[] = [];

    snapshot.forEach(doc => {
      const data = doc.data() as RoomUnit;
      if (includeInactive || data.active !== false) {
        units.push(data);
      }
    });

    return units;
  }

  async findUnitById(organizationId: string, propertyId: string, unitId: string): Promise<RoomUnit | null> {
    if (!organizationId || !propertyId || !unitId) return null;

    const docSnap = await this.db.collection('rooms').doc(unitId).get();
    if (!docSnap.exists) return null;

    const data = docSnap.data() as RoomUnit;
    if (data.organizationId !== organizationId || data.propertyId !== propertyId) {
      return null;
    }

    return data;
  }

  async findUnitByNumber(organizationId: string, propertyId: string, unitNumber: string): Promise<RoomUnit | null> {
    if (!organizationId || !propertyId || !unitNumber) return null;
    const normalizedNumber = unitNumber.trim();

    const snapshot = await this.db.collection('rooms')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data() as RoomUnit;
      if (data.unitNumber && data.unitNumber.trim() === normalizedNumber) {
        return data;
      }
    }

    return null;
  }

  async saveUnit(unit: RoomUnit): Promise<RoomUnit> {
    if (!unit.unitId) {
      unit.unitId = `uh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    }
    if (!unit.createdAt) {
      unit.createdAt = new Date().toISOString();
    }
    unit.updatedAt = new Date().toISOString();

    await this.db.collection('rooms').doc(unit.unitId).set(unit, { merge: true });
    return unit;
  }

  async createUnit(unit: RoomUnit): Promise<RoomUnit> {
    return this.saveUnit(unit);
  }

  async updateUnit(
    organizationId: string, 
    propertyId: string, 
    unitId: string, 
    updates: Partial<RoomUnit>
  ): Promise<RoomUnit | null> {
    const existing = await this.findUnitById(organizationId, propertyId, unitId);
    if (!existing) return null;

    // Proteção de imutabilidade multi-tenant
    if (updates.organizationId && updates.organizationId !== organizationId) {
      throw new Error("Não é permitido alterar o organizationId de uma UH existente.");
    }
    if (updates.propertyId && updates.propertyId !== propertyId) {
      throw new Error("Não é permitido alterar o propertyId de uma UH existente.");
    }

    const updated: RoomUnit = {
      ...existing,
      ...updates,
      organizationId, // Imutável
      propertyId,     // Imutável
      unitId,         // Imutável
      updatedAt: new Date().toISOString()
    };

    await this.db.collection('rooms').doc(unitId).set(updated, { merge: true });
    return updated;
  }

  async updateUnitStatus(organizationId: string, propertyId: string, unitId: string, status: RoomStatus): Promise<RoomUnit | null> {
    return this.updateUnit(organizationId, propertyId, unitId, { status });
  }

  async deleteUnit(organizationId: string, propertyId: string, unitId: string): Promise<boolean> {
    const existing = await this.findUnitById(organizationId, propertyId, unitId);
    if (!existing) return false;

    await this.db.collection('rooms').doc(unitId).delete();
    return true;
  }

  // --- Seed Helper para Ambiente de Desenvolvimento ---
  async seedDevData(): Promise<void> {
    const devOrgId = 'org_dev_default';
    const devPropId = 'prop_dev_default';

    const existingCats = await this.findCategories(devOrgId, devPropId, true);
    if (existingCats.length === 0) {
      const cat1Id = 'cat_suite_luxo';
      await this.saveCategory({
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
      });

      const cat2Id = 'cat_bangalo_jardim';
      await this.saveCategory({
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
      });

      const unitsData: Array<{ id: string; catId: string; num: string; floor: string; status: RoomStatus }> = [
        { id: 'uh_101', catId: cat1Id, num: '101', floor: '1º Andar', status: 'clean' },
        { id: 'uh_102', catId: cat1Id, num: '102', floor: '1º Andar', status: 'inspected' },
        { id: 'uh_103', catId: cat1Id, num: '103', floor: '1º Andar', status: 'dirty' },
        { id: 'uh_201', catId: cat2Id, num: '201', floor: 'Térreo', status: 'clean' },
        { id: 'uh_202', catId: cat2Id, num: '202', floor: 'Térreo', status: 'maintenance' }
      ];

      for (const u of unitsData) {
        await this.saveUnit({
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
  }
}

export const roomRepository = new RoomRepository();
export { RoomRepository as InMemoryRoomRepository };

