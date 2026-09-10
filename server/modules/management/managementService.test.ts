import { beforeEach, describe, expect, it, vi } from 'vitest';
import { managementRepository } from './managementRepository.ts';
import { managementService } from './managementService.ts';

describe('ManagementService canonical financial authority', () => {
  beforeEach(() => vi.restoreAllMocks());
  it('derives POS totals from catalog, never a browser total', async () => {
    vi.spyOn(managementRepository, 'findSaleByKey').mockResolvedValue(null);
    vi.spyOn(managementRepository, 'saveSale').mockImplementation(async value => value);
    const created = await managementService.createSale('org-a', 'property-a', 'actor', { idempotencyKey: 'request-1' });
    vi.spyOn(managementRepository, 'getSale').mockResolvedValue(created);
    vi.spyOn(managementRepository, 'getCatalogItem').mockResolvedValue({ itemId: 'coffee', organizationId: 'org-a', propertyId: 'property-a', name: 'Café', category: 'bar', price: 12.5, currency: 'BRL', active: true, createdAt: '', updatedAt: '' });
    const sale = await managementService.addSaleItem('org-a', 'property-a', created.saleId, { itemId: 'coffee', quantity: 2, discount: 2 });
    expect(sale.subtotal).toBe(25); expect(sale.total).toBe(23); expect(sale.items[0].unitPrice).toBe(12.5);
  });
  it('does not close a Pix/card-like payment reference without a canonical reference', async () => {
    vi.spyOn(managementRepository, 'getSale').mockResolvedValue({ saleId: 's', organizationId: 'org-a', propertyId: 'property-a', actorUserId: 'actor', status: 'open', currency: 'BRL', items: [{ itemId: 'x', name: 'x', quantity: 1, unitPrice: 10, discount: 0, lineTotal: 10 }], subtotal: 10, discountTotal: 0, total: 10, createdAt: '', updatedAt: '' });
    await expect(managementService.closeSale('org-a', 'property-a', 'actor', 's', { paymentMethod: 'payment_core' })).rejects.toThrow('PAYMENT_REFERENCE_REQUIRED');
  });
  it('uses a deterministic financial idempotency key for repeated source events', async () => {
    const save = vi.spyOn(managementRepository, 'saveEntryIdempotent').mockImplementation(async entry => ({ ...entry, entryId: 'entry' }));
    await managementService.recordFinancialEntry('org-a', 'property-a', 'actor', { type: 'income', category: 'pos', amount: 10, currency: 'BRL', sourceType: 'pos_sale', sourceId: 'sale-1', idempotencyKey: 'pos-close:sale-1' });
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org-a', propertyId: 'property-a', actorUserId: 'actor', idempotencyKey: 'pos-close:sale-1' }));
  });
});
