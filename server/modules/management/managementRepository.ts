import crypto from 'node:crypto';
import { getAdminFirestore } from '../../config/firebaseAdmin.ts';
import { FinancialEntry, PosCatalogItem, PosSale, Project, ProjectTask } from './managementTypes.ts';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const hash = (input: string) => crypto.createHash('sha256').update(input).digest('hex').slice(0, 40);

export class ManagementRepository {
  private get db() { return getAdminFirestore(); }

  async listCatalog(organizationId: string, propertyId: string) {
    const snapshot = await this.db.collection('posCatalogItems').where('organizationId', '==', organizationId).where('propertyId', '==', propertyId).get();
    return snapshot.docs.map(doc => clone(doc.data() as PosCatalogItem)).sort((a, b) => a.name.localeCompare(b.name));
  }
  async getCatalogItem(organizationId: string, propertyId: string, itemId: string) {
    const doc = await this.db.collection('posCatalogItems').doc(itemId).get();
    if (!doc.exists) return null;
    const item = doc.data() as PosCatalogItem;
    return item.organizationId === organizationId && item.propertyId === propertyId ? clone(item) : null;
  }
  async saveCatalog(item: PosCatalogItem) {
    const ref = this.db.collection('posCatalogItems').doc(item.itemId);
    const existing = await ref.get();
    if (existing.exists) {
      const current = existing.data() as PosCatalogItem;
      if (current.organizationId !== item.organizationId || current.propertyId !== item.propertyId) throw new Error('TENANT_MISMATCH');
    }
    await ref.set({ ...item, updatedAt: now(), createdAt: item.createdAt || now() }, { merge: true });
    return this.getCatalogItem(item.organizationId, item.propertyId, item.itemId) as Promise<PosCatalogItem>;
  }

  async getSale(organizationId: string, propertyId: string, saleId: string) {
    const doc = await this.db.collection('posSales').doc(saleId).get();
    if (!doc.exists) return null;
    const sale = doc.data() as PosSale;
    return sale.organizationId === organizationId && sale.propertyId === propertyId ? clone(sale) : null;
  }
  async listSales(organizationId: string, propertyId: string) {
    const snapshot = await this.db.collection('posSales').where('organizationId', '==', organizationId).where('propertyId', '==', propertyId).get();
    return snapshot.docs.map(doc => clone(doc.data() as PosSale));
  }
  async findSaleByKey(organizationId: string, propertyId: string, idempotencyKey: string) {
    const snapshot = await this.db.collection('posSales').where('organizationId', '==', organizationId).where('propertyId', '==', propertyId).where('idempotencyKey', '==', idempotencyKey).limit(1).get();
    return snapshot.empty ? null : clone(snapshot.docs[0].data() as PosSale);
  }
  async saveSale(sale: PosSale) {
    const ref = this.db.collection('posSales').doc(sale.saleId);
    const current = await ref.get();
    if (current.exists) {
      const existing = current.data() as PosSale;
      if (existing.organizationId !== sale.organizationId || existing.propertyId !== sale.propertyId) throw new Error('TENANT_MISMATCH');
    }
    await ref.set({ ...sale, updatedAt: now(), createdAt: sale.createdAt || now() }, { merge: true });
    return this.getSale(sale.organizationId, sale.propertyId, sale.saleId) as Promise<PosSale>;
  }

  async listEntries(organizationId: string, propertyId: string) {
    const snapshot = await this.db.collection('financialEntries').where('organizationId', '==', organizationId).where('propertyId', '==', propertyId).get();
    return snapshot.docs.map(doc => clone(doc.data() as FinancialEntry));
  }
  async getEntry(organizationId: string, propertyId: string, entryId: string) {
    const doc = await this.db.collection('financialEntries').doc(entryId).get();
    if (!doc.exists) return null;
    const entry = doc.data() as FinancialEntry;
    return entry.organizationId === organizationId && entry.propertyId === propertyId ? clone(entry) : null;
  }
  async saveEntryIdempotent(entry: FinancialEntry) {
    const entryId = hash(`${entry.organizationId}:${entry.propertyId}:${entry.idempotencyKey}`);
    const ref = this.db.collection('financialEntries').doc(entryId);
    return this.db.runTransaction(async transaction => {
      const current = await transaction.get(ref);
      if (current.exists) return clone(current.data() as FinancialEntry);
      const record = { ...entry, entryId, createdAt: entry.createdAt || now(), updatedAt: now() };
      transaction.create(ref, record);
      return clone(record);
    });
  }
  async updateEntry(entry: FinancialEntry) {
    const ref = this.db.collection('financialEntries').doc(entry.entryId);
    const current = await ref.get();
    if (!current.exists) throw new Error('FINANCIAL_ENTRY_NOT_FOUND');
    const existing = current.data() as FinancialEntry;
    if (existing.organizationId !== entry.organizationId || existing.propertyId !== entry.propertyId) throw new Error('TENANT_MISMATCH');
    await ref.set({ ...entry, updatedAt: now() }, { merge: true });
    return clone({ ...entry, updatedAt: now() });
  }

  async listProjects(organizationId: string, propertyId: string) {
    const snapshot = await this.db.collection('projects').where('organizationId', '==', organizationId).where('propertyId', '==', propertyId).get();
    return snapshot.docs.map(doc => clone(doc.data() as Project));
  }
  async getProject(organizationId: string, propertyId: string, projectId: string) {
    const doc = await this.db.collection('projects').doc(projectId).get();
    if (!doc.exists) return null;
    const project = doc.data() as Project;
    return project.organizationId === organizationId && project.propertyId === propertyId ? clone(project) : null;
  }
  async saveProject(project: Project) {
    const ref = this.db.collection('projects').doc(project.projectId);
    const existing = await ref.get();
    if (existing.exists) { const current = existing.data() as Project; if (current.organizationId !== project.organizationId || current.propertyId !== project.propertyId) throw new Error('TENANT_MISMATCH'); }
    await ref.set({ ...project, createdAt: project.createdAt || now(), updatedAt: now() }, { merge: true });
    return this.getProject(project.organizationId, project.propertyId, project.projectId) as Promise<Project>;
  }
  async listProjectTasks(organizationId: string, propertyId: string, projectId: string) {
    const snapshot = await this.db.collection('projectTasks').where('organizationId', '==', organizationId).where('propertyId', '==', propertyId).where('projectId', '==', projectId).get();
    return snapshot.docs.map(doc => clone(doc.data() as ProjectTask));
  }
  async saveProjectTask(task: ProjectTask) {
    const project = await this.getProject(task.organizationId, task.propertyId, task.projectId);
    if (!project) throw new Error('PROJECT_NOT_FOUND');
    const ref = this.db.collection('projectTasks').doc(task.taskId);
    await ref.set({ ...task, createdAt: task.createdAt || now(), updatedAt: now() }, { merge: true });
    return clone({ ...task, createdAt: task.createdAt || now(), updatedAt: now() });
  }
}
export const managementRepository = new ManagementRepository();
