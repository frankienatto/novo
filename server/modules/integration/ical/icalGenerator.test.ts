import { describe, expect, it } from 'vitest';
import { ICalGenerator } from './icalGenerator.ts';

describe('ICalGenerator - privacidade do feed de disponibilidade', () => {
  it('exporta somente disponibilidade e nunca PII ou dados financeiros', () => {
    const reservation: any = {
      reservationId: 'res_private', organizationId: 'org_a', propertyId: 'prop_a', unitId: 'unit_a', categoryId: 'cat',
      guest: { fullName: 'Nome Privado', email: 'private@example.com', phone: '+5511999999999', documentId: '123.456.789-00' },
      stayPeriod: { checkInDate: '2026-12-10', checkOutDate: '2026-12-12', numberOfNights: 2 }, adultsCount: 2, childrenCount: 0,
      status: 'confirmed', source: 'direct_website', paymentStatus: 'paid', totalAmount: 1234.56, amountPaid: 1234.56, notes: 'Nota interna confidencial', createdAt: '', updatedAt: ''
    };
    const output = ICalGenerator.generateICS([reservation], new Map([['unit_a', { unitId: 'unit_a', unitNumber: '101' }]] as any), { propertyName: 'Propriedade', organizationId: 'org_a', propertyId: 'prop_a' });
    expect(output).toContain('UID:synapse_res_res_private@');
    expect(output).toContain('SUMMARY:Unavailable');
    expect(output).toContain('DESCRIPTION:Unavailable');
    for (const forbidden of ['Nome Privado', 'private@example.com', '999999999', '123.456', '1234.56', 'Nota interna', 'paid']) expect(output).not.toContain(forbidden);
  });
});
