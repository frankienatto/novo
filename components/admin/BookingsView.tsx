

import React, { useState, useMemo } from 'react';
import { DBState, Booking, RoomStatus, PropertyUnitId } from '../../types';
import { Section } from './shared';
import { ClipboardList, PlusCircle, Moon, CheckCircle, Loader2, Wallet, Printer, Sparkles } from 'lucide-react';
import Receipt from './Receipt';

interface BookingsViewProps {
    db: DBState;
    selectedUnit?: PropertyUnitId | 'all';
    onAddBooking: () => void;
    onCheckIn: (bookingId: string) => Promise<void>;
    onCheckOut: (bookingId: string) => Promise<void>;
    onFinalizeAccount: (bookingId: string) => Promise<void>;
}

import { ResetCategoryButton } from './ResetCategoryButton';

const BookingsView: React.FC<BookingsViewProps> = ({ db, selectedUnit = 'all', onAddBooking, onCheckIn, onCheckOut, onFinalizeAccount }) => {
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState<string | null>(null);

    const filteredBookings = useMemo(() => {
        return db.bookings.filter(booking => {
            if (selectedUnit === 'all') return true;
            const room = db.rooms.find(r => r.id === booking.roomId);
            const unit = booking.propertyId || room?.propertyId || 'beach';
            return unit === selectedUnit;
        });
    }, [db.bookings, db.rooms, selectedUnit]);

    const statusColors: { [key in Booking['status']]: string } = {
        'Confirmed': 'bg-blue-100 text-blue-800',
        'Checked-in': 'bg-green-100 text-green-800',
        'Pre-Checked-in': 'bg-purple-100 text-purple-800',
        'Checked-out': 'bg-gray-100 text-gray-800',
        'Cancelled': 'bg-red-100 text-red-800',
        'Pending': 'bg-yellow-100 text-yellow-800'
    };
    
    const handleCheckInClick = async (bookingId: string) => {
        setProcessingId(bookingId);
        try {
            await onCheckIn(bookingId);
        } catch (error) {
            console.error("Check-in failed:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleCheckOutClick = async (bookingId: string) => {
        setProcessingId(bookingId);
        try {
            await onCheckOut(bookingId);
        } catch (error) {
            console.error("Check-out failed:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const handlePaymentClick = async (bookingId: string) => {
        if (!window.confirm("Confirmar recebimento do saldo total desta reserva?")) return;
        setProcessingId(bookingId);
        try {
            await onFinalizeAccount(bookingId);
        } catch (error) {
            console.error("Payment failed:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const bookingForReceipt = selectedBookingForReceipt ? db.bookings.find(b => b.id === selectedBookingForReceipt) : null;
    const guestForReceipt = bookingForReceipt ? db.guests.find(g => g.id === bookingForReceipt.guestId) : null;
    const roomForReceipt = bookingForReceipt ? db.rooms.find(r => r.id === bookingForReceipt.roomId) : null;

    return (
        <Section title="Reservas" icon={ClipboardList} actions={
            <div className="flex gap-2">
                <ResetCategoryButton category="bookings" />
                <button onClick={onAddBooking} className="bg-brand-green text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-brand-green-dark flex items-center gap-2">
                    <PlusCircle size={18} /> <span className="hidden sm:inline">Nova Reserva</span>
                </button>
            </div>
        }>
            <div className="space-y-3">
                {filteredBookings.length === 0 ? (
                    <div className="bg-white p-8 text-center rounded-xl border border-dashed border-gray-300">
                        <p className="text-sm font-semibold text-gray-600">
                            Nenhuma reserva encontrada para a unidade selecionada ({selectedUnit === 'beach' ? '🏖️ Beach House' : selectedUnit === 'sanctuary' ? '🌿 Santuário' : 'Todas'}).
                        </p>
                    </div>
                ) : (
                    filteredBookings.map(booking => {
                    const room = db.rooms.find(r => r.id === booking.roomId);
                    const guest = db.guests.find(g => g.id === booking.guestId);
                    const isRoomReadyForCheckin = room?.status === RoomStatus.AVAILABLE || room?.status === RoomStatus.CLEANING || room?.status === RoomStatus.INSPECTION;
                    const isSanctuary = room?.propertyId === 'sanctuary';
                    
                    // Logic for Upgrade Suggestion (Simplified for UI)
                    const availableUpgrades = db.rooms.filter(r => 
                        r.status === RoomStatus.AVAILABLE && 
                        r.basePrice > (room?.basePrice || 0) &&
                        !db.bookings.some(b => b.roomId === r.id && b.status === 'Confirmed' && new Date(b.checkIn) <= new Date())
                    );
                    const hasUpgradeOption = availableUpgrades.length > 0;

                    const hasBalance = booking.balance > 0;
                    return (
                         <div key={booking.id} className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                        isSanctuary ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}>
                                        {isSanctuary ? '🌿 Santuário' : '🏖️ Praia'}
                                    </span>
                                    <p className="font-bold text-gray-800">{guest?.fullName} <span className="font-semibold text-gray-500">({room?.name})</span></p>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Check-in: {new Date(booking.checkIn).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} | Check-out: {new Date(booking.checkOut).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right hidden md:block">
                                    {hasUpgradeOption && (
                                        <span className="block mb-1 text-[10px] font-bold text-brand-green animate-pulse uppercase">
                                            <Sparkles size={10} className="inline mr-1" /> Upgrade Disponível
                                        </span>
                                    )}
                                    <p className={`text-xs font-bold ${hasBalance ? 'text-red-500' : 'text-green-500'}`}>
                                        Saldo: {booking.balance.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                    </p>
                                </div>
                                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusColors[booking.status]}`}>{booking.status}</span>
                                <div className="flex gap-2">
                                     {hasBalance && (
                                         <button 
                                             onClick={() => handlePaymentClick(booking.id)}
                                             className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-colors"
                                             title="Pagar Saldo"
                                         >
                                             <Wallet size={16} />
                                         </button>
                                     )}
                                     <button 
                                         onClick={() => setSelectedBookingForReceipt(booking.id)}
                                         className="bg-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-300 transition-colors"
                                         title="Ver Recibo"
                                     >
                                         <Printer size={16} />
                                     </button>
                                     {(booking.status === 'Confirmed' || booking.status === 'Pre-Checked-in') && (
                                        <button 
                                            onClick={() => handleCheckInClick(booking.id)} 
                                            className="bg-green-500 text-white font-semibold py-1 px-3 rounded-lg flex items-center gap-1.5 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            title={!isRoomReadyForCheckin ? `Quarto não está pronto (Status: ${room?.status})` : 'Fazer Check-in'}
                                            disabled={!isRoomReadyForCheckin || processingId === booking.id}
                                        >
                                            {processingId === booking.id ? <Loader2 className="animate-spin" size={14}/> : <CheckCircle size={14}/>} Check-in
                                        </button>
                                     )}
                                     {booking.status === 'Checked-in' && (
                                        <button 
                                            onClick={() => handleCheckOutClick(booking.id)} 
                                            className="bg-blue-500 text-white font-semibold py-1 px-3 rounded-lg flex items-center gap-1.5 text-sm disabled:bg-gray-400"
                                            title={hasBalance ? `Atenção: Hóspede tem saldo devedor de ${booking.balance.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}` : 'Fazer Check-out'}
                                            disabled={processingId === booking.id}
                                        >
                                            {processingId === booking.id ? <Loader2 className="animate-spin" size={14}/> : <Moon size={14}/>} Check-out
                                        </button>
                                     )}
                                </div>
                            </div>
                        </div>
                    )
                }))}
            </div>

            {selectedBookingForReceipt && bookingForReceipt && (
                <Receipt 
                    propertyInfo={db.propertyInfo}
                    booking={bookingForReceipt}
                    guest={guestForReceipt || undefined}
                    room={roomForReceipt || undefined}
                    onClose={() => setSelectedBookingForReceipt(null)}
                />
            )}
        </Section>
    )
};

export default BookingsView;
