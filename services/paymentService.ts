/**
 * Payment Service for Stripe and PIX
 */
export const createPaymentIntent = async (amount: number, bookingId: string) => {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, bookingId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar intenção de pagamento');
  }
  
  return response.json();
};

export const createPixPayment = async (amount: number, bookingId: string, guestName: string) => {
  const response = await fetch('/api/create-pix-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, bookingId, guestName }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao gerar PIX');
  }
  
  return response.json();
};
