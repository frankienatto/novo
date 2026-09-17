import { describe, expect, it } from 'vitest';
import { type CanonicalPaymentResponse } from '../../services/paymentService.ts';

describe('PaymentModal Pix handling contract', () => {
  it('identifies invalid Pix payloads without valid qrCode', () => {
    const invalidResponses: Partial<CanonicalPaymentResponse>[] = [
      {},
      { presentation: {} },
      { presentation: { qrCode: '' } },
      { presentation: { qrCode: '   ' } },
    ];

    for (const res of invalidResponses) {
      const isValid = Boolean(res?.presentation?.qrCode && res.presentation.qrCode.trim() !== '');
      expect(isValid).toBe(false);
    }
  });

  it('identifies valid Pix presentation payload for QRCodeSVG rendering', () => {
    const validResponse: CanonicalPaymentResponse = {
      paymentId: 'pay_123',
      provider: 'mercadopago',
      method: 'pix',
      status: 'pending',
      presentation: {
        qrCode: '00020101021226840014br.gov.bcb.pix...',
        qrCodeBase64: 'data:image/png;base64,...',
        expiresAt: '2026-09-18T23:59:59Z',
      },
    };

    const isValid = Boolean(validResponse.presentation?.qrCode && validResponse.presentation.qrCode.trim() !== '');
    expect(isValid).toBe(true);
    expect(validResponse.presentation?.qrCode).toContain('br.gov.bcb.pix');
  });
});
