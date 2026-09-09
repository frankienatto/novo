export type PublicPaymentProvider = 'stripe' | 'mercadopago' | 'picpay';
export type PublicPaymentMethod = 'card' | 'pix';

export interface PaymentCapabilities {
  stripe: { card: boolean };
  mercadopago: { card: boolean; pix: boolean };
  picpay: { pix: boolean };
}

export interface CanonicalPaymentResponse {
  paymentId: string;
  provider: PublicPaymentProvider;
  method: PublicPaymentMethod;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  presentation?: { clientSecret?: string; qrCode?: string; qrCodeBase64?: string; expiresAt?: string };
}

const parseError = async (response: Response) => {
  const body = await response.json().catch(() => ({}));
  return new Error(body.error || 'Não foi possível iniciar o pagamento.');
};

export const getPaymentCapabilities = async (): Promise<PaymentCapabilities> => {
  const response = await fetch('/api/public-booking/payment-capabilities');
  if (!response.ok) throw await parseError(response);
  return response.json();
};

/** Only a reservation-bound checkout capability authorizes this request. */
export const createCanonicalPayment = async (
  reservationId: string,
  checkoutCapability: string,
  provider: PublicPaymentProvider,
  method: PublicPaymentMethod,
  providerData?: Record<string, unknown>,
  idempotencyKey = crypto.randomUUID(),
): Promise<CanonicalPaymentResponse> => {
  const response = await fetch(`/api/public-booking/reservations/${encodeURIComponent(reservationId)}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-checkout-capability': checkoutCapability, 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ provider, method, providerData }),
  });
  if (!response.ok) throw await parseError(response);
  return response.json();
};
