import React, { useEffect, useMemo, useState } from 'react';
import { PaymentModal } from './admin/PaymentModal.tsx';

type Catalog = {
  publicPropertyId: string;
  currency: string;
  ratePlans: Array<{ ratePlanId: string }>;
  units: Array<{ publicUnitId: string; name: string; capacity: number; baseNightlyAmount: number; amenities: string[] }>;
};

type Quote = { totalAmount: number; currency: string; numberOfNights: number };
type CheckoutReservation = { reservationId: string; checkoutCapability: string; totalAmount: number };

const newKey = () => crypto.randomUUID();

/** Production public-booking boundary. It only talks to server-resolved public
 * IDs and never reads browser fixtures or Firestore directly. */
export const CanonicalPublicBookingView: React.FC<{ publicPropertyId?: string; onReturnHome: () => void }> = ({ publicPropertyId, onReturnHome }) => {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [adultsCount, setAdultsCount] = useState(1);
  const [guest, setGuest] = useState({ fullName: '', email: '', phone: '' });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [checkoutReservation, setCheckoutReservation] = useState<CheckoutReservation | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'unavailable' | 'submitting' | 'complete' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!publicPropertyId) { setState('unavailable'); return; }
    let active = true;
    fetch(`/api/public-booking/catalog/${encodeURIComponent(publicPropertyId)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Catálogo público indisponível.');
        return response.json();
      })
      .then((response) => {
        if (!active) return;
        const next = response.data as Catalog;
        setCatalog(next);
        setSelectedUnitId(next.units[0]?.publicUnitId || '');
        setState(next.units.length ? 'ready' : 'unavailable');
      })
      .catch(() => active && setState('unavailable'));
    return () => { active = false; };
  }, [publicPropertyId]);

  const ratePlanId = catalog?.ratePlans[0]?.ratePlanId || '';
  const selectedUnit = useMemo(() => catalog?.units.find((unit) => unit.publicUnitId === selectedUnitId), [catalog, selectedUnitId]);

  const requestQuote = async () => {
    if (!catalog || !selectedUnitId || !checkInDate || !checkOutDate || !ratePlanId) return;
    setState('submitting'); setMessage('');
    const response = await fetch('/api/public-booking/quote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicPropertyId: catalog.publicPropertyId, publicUnitId: selectedUnitId, checkInDate, checkOutDate, adultsCount, ratePlanId }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(body.error || 'Não foi possível calcular a reserva.'); setState('ready'); return; }
    setQuote(body.data); setState('ready');
  };

  const createReservation = async () => {
    if (!catalog || !quote || !selectedUnitId) return;
    setState('submitting'); setMessage('');
    const response = await fetch('/api/public-booking/reservations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicPropertyId: catalog.publicPropertyId, publicUnitId: selectedUnitId, checkInDate, checkOutDate, adultsCount, ratePlanId, guest, idempotencyKey: newKey() }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(body.error || 'Não foi possível criar a reserva.'); setState('ready'); return; }
    setCheckoutReservation({
      reservationId: body.reservationId,
      checkoutCapability: body.checkoutCapability,
      totalAmount: body.totalAmount,
    });
    setMessage(`Reserva ${body.reservationId} criada. Selecione um método para iniciar o pagamento.`);
    setState('ready');
  };

  if (state === 'loading') return <section className="min-h-[70vh] flex items-center justify-center"><p className="text-gray-600">Carregando catálogo...</p></section>;
  if (state === 'unavailable') return <section className="min-h-[70vh] flex items-center justify-center px-6 text-center"><div className="max-w-lg rounded-2xl border bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold text-brand-dark">Reservas ainda indisponíveis</h1><p className="mt-3 text-gray-600">O catálogo público canônico não está configurado para esta propriedade.</p><button className="mt-6 btn-primary" onClick={onReturnHome}>Voltar ao início</button></div></section>;
  return <section className="min-h-[70vh] bg-[var(--ps-bg,#f7f8f6)] px-6 py-12"><div className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 shadow-sm"><h1 className="text-2xl font-bold text-brand-dark">Reservar</h1><p className="mt-2 text-sm text-gray-600">Catálogo e valores são resolvidos com segurança pelo Synapse.</p>
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <label className="text-sm font-medium">Acomodação<select className="input-base mt-1" value={selectedUnitId} onChange={(event) => { setSelectedUnitId(event.target.value); setQuote(null); }}>{catalog?.units.map((unit) => <option key={unit.publicUnitId} value={unit.publicUnitId}>{unit.name} · até {unit.capacity} hóspedes</option>)}</select></label>
      <label className="text-sm font-medium">Hóspedes<input className="input-base mt-1" min="1" max={selectedUnit?.capacity || 1} type="number" value={adultsCount} onChange={(event) => { setAdultsCount(Number(event.target.value)); setQuote(null); }} /></label>
      <label className="text-sm font-medium">Check-in<input className="input-base mt-1" type="date" value={checkInDate} onChange={(event) => { setCheckInDate(event.target.value); setQuote(null); }} /></label>
      <label className="text-sm font-medium">Check-out<input className="input-base mt-1" type="date" value={checkOutDate} onChange={(event) => { setCheckOutDate(event.target.value); setQuote(null); }} /></label>
    </div>
    <button className="btn-secondary mt-5" disabled={state === 'submitting'} onClick={() => void requestQuote()}>Calcular valor</button>
    {quote && !checkoutReservation && <div className="mt-5 rounded-xl bg-gray-50 p-4"><p className="font-semibold">{quote.numberOfNights} diária(s): {quote.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: quote.currency.toUpperCase() })}</p><div className="mt-4 grid gap-3 md:grid-cols-3"><input className="input-base" placeholder="Nome completo" value={guest.fullName} onChange={(event) => setGuest({ ...guest, fullName: event.target.value })}/><input className="input-base" placeholder="E-mail" type="email" value={guest.email} onChange={(event) => setGuest({ ...guest, email: event.target.value })}/><input className="input-base" placeholder="Telefone (opcional)" value={guest.phone} onChange={(event) => setGuest({ ...guest, phone: event.target.value })}/></div><button className="btn-primary mt-4" disabled={state === 'submitting'} onClick={() => void createReservation()}>Continuar para pagamento</button></div>}
    {checkoutReservation && <div className="mt-5 rounded-xl bg-amber-50 p-4"><p className="font-semibold text-amber-950">Reserva pendente de pagamento</p><p className="mt-1 text-sm text-amber-900">A cobrança é iniciada pelo fluxo canônico. A confirmação final depende da validação do provedor pelo servidor.</p><button className="btn-primary mt-4" onClick={() => setState('complete')}>Escolher forma de pagamento</button></div>}
    {message && <p role="alert" className="mt-4 text-sm text-red-700">{message}</p>}
  </div>{checkoutReservation && <PaymentModal isOpen={state === 'complete'} onClose={() => setState('ready')} amount={checkoutReservation.totalAmount} bookingId={checkoutReservation.reservationId} guestName={guest.fullName} checkoutCapability={checkoutReservation.checkoutCapability} onSuccess={() => { setState('ready'); setMessage('Pagamento iniciado. A confirmação definitiva é feita pelo servidor após a validação do provedor.'); }} />}</section>;
};
