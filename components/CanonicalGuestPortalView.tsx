import React, { useEffect, useState } from 'react';
import { auth } from '../services/firebase.ts';

type Reservation = { reservationId: string; propertyId: string; unitId: string; stayPeriod: { checkInDate: string; checkOutDate: string }; status: string; paymentStatus: string; totalAmount: number; amountPaid: number; balance: number; currency: string; preArrival?: { arrivalTime?: string; notes?: string; documentUploadStatus: string } };
type Portal = { guest: { fullName: string; email: string; phone?: string }; activeReservation: Reservation | null; reservations: Reservation[] };

async function guestRequest(path: string, init: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('GUEST_AUTH_REQUIRED');
  const response = await fetch(path, { ...init, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(init.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'PORTAL_UNAVAILABLE');
  return body.data;
}

/** Production guest boundary. It reads only the Firebase-UID-bound guest
 * projection and never consumes legacy db/bookings/Firestore client state. */
export const CanonicalGuestPortalView: React.FC<{ onReturnHome: () => void }> = ({ onReturnHome }) => {
  const [portal, setPortal] = useState<Portal | null>(null);
  const [arrivalTime, setArrivalTime] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable' | 'saving'>('loading');
  const load = async () => {
    try { setPortal(await guestRequest('/api/guest/me/portal')); setStatus('ready'); }
    catch { setStatus('unavailable'); }
  };
  useEffect(() => { void load(); }, []);
  const submitPreArrival = async () => {
    if (!portal?.activeReservation) return;
    setStatus('saving'); setMessage('');
    try {
      const reservation = await guestRequest(`/api/guest/me/reservations/${encodeURIComponent(portal.activeReservation.reservationId)}/pre-arrival`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ arrivalTime, notes }) });
      setPortal({ ...portal, activeReservation: reservation, reservations: portal.reservations.map((item) => item.reservationId === reservation.reservationId ? reservation : item) });
      setMessage('Informações de pré-chegada enviadas. Documentos e assinatura exigem canal seguro configurado pela propriedade.'); setStatus('ready');
    } catch { setMessage('Não foi possível salvar suas informações de pré-chegada.'); setStatus('ready'); }
  };
  if (status === 'loading') return <section className="min-h-[70vh] grid place-items-center p-6"><p>Carregando portal do hóspede...</p></section>;
  if (status === 'unavailable') return <section className="min-h-[70vh] grid place-items-center p-6 text-center"><div className="max-w-lg rounded-2xl border bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold text-brand-dark">Portal ainda não provisionado</h1><p className="mt-3 text-gray-600">Sua identidade precisa ser associada com segurança ao perfil e à reserva pela equipe da propriedade.</p><button className="btn-primary mt-6" onClick={onReturnHome}>Voltar ao início</button></div></section>;
  const reservation = portal?.activeReservation;
  return <section className="min-h-[70vh] bg-[var(--ps-bg,#f7f8f6)] px-4 py-8 sm:px-6"><div className="mx-auto max-w-3xl space-y-5"><header className="rounded-2xl bg-brand-green p-6 text-white"><p className="text-sm opacity-80">Portal do hóspede</p><h1 className="text-2xl font-bold">Olá, {portal?.guest.fullName}</h1></header>{reservation ? <><article className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Sua estadia</h2><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-gray-500">Check-in</dt><dd>{reservation.stayPeriod.checkInDate}</dd></div><div><dt className="text-gray-500">Check-out</dt><dd>{reservation.stayPeriod.checkOutDate}</dd></div><div><dt className="text-gray-500">UH</dt><dd>{reservation.unitId}</dd></div><div><dt className="text-gray-500">Saldo</dt><dd>{reservation.balance.toLocaleString('pt-BR', { style: 'currency', currency: reservation.currency.toUpperCase() })}</dd></div></dl></article><article className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Pré-chegada</h2><p className="mt-1 text-sm text-gray-600">Informe horário estimado e observações. O status financeiro e a reserva permanecem sob autoridade do servidor.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm">Horário estimado<input className="input-base mt-1" type="datetime-local" value={arrivalTime} onChange={(event) => setArrivalTime(event.target.value)} /></label><label className="text-sm">Observações<textarea className="input-base mt-1 min-h-24" value={notes} maxLength={1000} onChange={(event) => setNotes(event.target.value)} /></label></div><button className="btn-primary mt-4" disabled={status === 'saving'} onClick={() => void submitPreArrival()}>Salvar pré-chegada</button>{message && <p role="status" className="mt-3 text-sm text-gray-700">{message}</p>}</article></> : <article className="rounded-2xl border bg-white p-6 text-center"><h2 className="text-lg font-bold">Nenhuma reserva ativa</h2><p className="mt-2 text-sm text-gray-600">Seu histórico permanece disponível somente pelo fluxo autorizado da propriedade.</p></article>}</div></section>;
};
