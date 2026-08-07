import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';
import { Booking, Room, DBState, Block, RoomType } from '../../types';
import { Calendar, Users, Wallet, X, CheckCircle, Moon, Ban, Bed, Mail, Phone, Hash, Receipt, AlertTriangle, Info, SprayCan, Loader2, Footprints, AlertCircle, RefreshCw } from 'lucide-react';
import { Section } from './shared';
import { RoomStatus } from '../../types';
import { syncICalForRoom } from '../../services/apiService';


import { PropertyUnitId } from '../../types';

interface CalendarViewProps {
    db: DBState;
    selectedUnit?: PropertyUnitId | 'all';
    onBookingUpdate: (bookingId: string, updates: Partial<Pick<Booking, 'checkIn' | 'checkOut' | 'roomId'>>) => Promise<void>;
    onNewBooking: (data: { roomId: number, checkIn: string, checkOut: string }) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ db, selectedUnit = 'all', onBookingUpdate, onNewBooking }) => {
    const [filter, setFilter] = useState('all');
    const [propertyFilter, setPropertyFilter] = useState<PropertyUnitId | 'all'>(selectedUnit);

    React.useEffect(() => {
        setPropertyFilter(selectedUnit);
    }, [selectedUnit]);
    const [selectedEvent, setSelectedEvent] = useState<Booking | null>(null);
    const [confirmationModal, setConfirmationModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const filteredRooms = useMemo(() => {
        return db.rooms.filter(room => {
            const matchesType = filter === 'all'
                ? true
                : filter === 'private' ? !room.type.includes('Compartilhado') : room.type.includes('Compartilhado');
            const matchesProperty = propertyFilter === 'all'
                ? true
                : (room.propertyId || 'beach') === propertyFilter;
            return matchesType && matchesProperty;
        });
    }, [db.rooms, filter, propertyFilter]);

    const resources = useMemo(() => filteredRooms.map(room => {
        const isSanctuary = room.propertyId === 'sanctuary';
        return {
            id: room.id.toString(),
            title: `${isSanctuary ? '🌿' : '🏖️'} ${room.name}`,
            type: room.type,
            extendedProps: { status: room.status, propertyId: room.propertyId || 'beach' }
        };
    }), [filteredRooms]);

    const getBookingColor = (status: Booking['status']) => {
        switch (status) {
            case 'Confirmed': return '#3B82F6'; // blue-500
            case 'Checked-in': return '#22C55E'; // green-500
            case 'Pre-Checked-in': return '#8B5CF6'; // purple-500
            case 'Checked-out': return '#6B7280'; // gray-500
            case 'Cancelled': return '#EF4444'; // red-500
            default: return '#A1A1AA';
        }
    };
    
    const events = useMemo(() => {
        const bookingEvents = db.bookings.map(booking => {
            const guest = db.guests.find(g => g.id === booking.guestId);
            return {
                id: booking.id,
                resourceId: booking.roomId.toString(),
                title: guest?.fullName || 'Hóspede Desconhecido',
                start: booking.checkIn,
                end: booking.checkOut,
                backgroundColor: getBookingColor(booking.status),
                borderColor: getBookingColor(booking.status),
                extendedProps: { ...booking }
            };
        });

        const blockEvents = (db.blocks || []).map((block: Block) => ({
             id: block.id,
             resourceId: block.roomId.toString(),
             start: block.startDate,
             end: block.endDate,
             display: 'background',
             backgroundColor: '#fecaca', // red-200
             title: block.reason,
             extendedProps: { type: 'block', reason: block.reason }
        }));
        
        return [...bookingEvents, ...blockEvents];

    }, [db.bookings, db.guests, db.blocks]);


    const handleEventDrop = (info: any) => {
        const { event, newResource, revert } = info;
        if (!event.start || !newResource?.id) {
            revert();
            return;
        }

        const newRoomName = newResource.title;
        const confirmUpdate = async () => {
             await onBookingUpdate(event.id, {
                checkIn: event.start!.toISOString().split('T')[0],
                checkOut: event.end ? event.end.toISOString().split('T')[0] : event.start!.toISOString().split('T')[0],
                roomId: parseInt(newResource.id, 10)
            });
            setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        };

        setConfirmationModal({
            isOpen: true,
            title: "Confirmar Mudança de Reserva",
            message: `Você tem certeza que deseja mover a reserva de "${event.title}" para o quarto "${newRoomName}"?`,
            onConfirm: confirmUpdate
        });
    };

    const handleEventResize = (info: any) => {
         const { event } = info;
        if (!event.start || !event.end) {
            console.error("Invalid event resize", info);
            return;
        }

        const newStartDate = new Date(event.startStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const newEndDate = new Date(event.endStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        
        const confirmResize = async () => {
            await onBookingUpdate(event.id, {
                checkIn: event.start!.toISOString().split('T')[0],
                checkOut: event.end!.toISOString().split('T')[0],
            });
            setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        };
        
        setConfirmationModal({
            isOpen: true,
            title: "Confirmar Alteração de Datas",
            message: `Deseja alterar a reserva de "${event.title}" para o período de ${newStartDate} a ${newEndDate}?`,
            onConfirm: confirmResize,
        });
    };

    const handleDateSelect = (info: any) => {
        const roomId = parseInt(info.resource?.id || '0', 10);
        if(!roomId) return;
        onNewBooking({
            roomId,
            checkIn: info.startStr,
            checkOut: info.endStr
        });
    };

    const handleEventClick = (info: EventClickArg) => {
         if (info.event.extendedProps.type === 'block') {
            alert(`Quarto bloqueado: ${info.event.extendedProps.reason}`);
            return;
        }
        const bookingData = db.bookings.find(b => b.id === info.event.id);
        if (bookingData) {
            setSelectedEvent(bookingData);
        }
    };
    
    const guestForSelectedEvent = useMemo(() => {
        if(!selectedEvent) return null;
        return db.guests.find(g => g.id === selectedEvent.guestId);
    }, [selectedEvent, db.guests]);
    
    const roomForSelectedEvent = useMemo(() => {
        if(!selectedEvent) return null;
        return db.rooms.find(r => r.id === selectedEvent.roomId);
    }, [selectedEvent, db.rooms]);


    return (
        <Section title="Calendário de Reservas" icon={Calendar}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase border border-blue-200">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div> Confirmada
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-bold uppercase border border-green-200">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div> Check-in
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 text-purple-700 rounded text-[10px] font-bold uppercase border border-purple-200">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div> Pre-Check
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 text-gray-700 rounded text-[10px] font-bold uppercase border border-gray-200">
                        <div className="w-2 h-2 rounded-full bg-gray-500"></div> Check-out
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-700 rounded text-[10px] font-bold uppercase border border-red-200">
                        <AlertCircle size={10} /> Pendência
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Unit filter */}
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 gap-1">
                        <button onClick={() => setPropertyFilter('all')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${propertyFilter === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🏢 Todas</button>
                        <button onClick={() => setPropertyFilter('beach')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${propertyFilter === 'beach' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🏖️ Praia</button>
                        <button onClick={() => setPropertyFilter('sanctuary')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${propertyFilter === 'sanctuary' ? 'bg-teal-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🌿 Santuário</button>
                    </div>

                    <div className="h-4 w-px bg-gray-300 mx-1 hidden sm:block"></div>

                    {/* Room type filter */}
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 gap-1">
                        <button onClick={() => setFilter('all')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${filter === 'all' ? 'bg-brand-green text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>Todos Tipos</button>
                        <button onClick={() => setFilter('private')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${filter === 'private' ? 'bg-brand-green text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>Privativos</button>
                        <button onClick={() => setFilter('shared')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${filter === 'shared' ? 'bg-brand-green text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>Dormitórios</button>
                    </div>
                </div>
            </div>
            <div className="w-full text-xs sm:text-sm bg-white rounded-xl shadow-sm border overflow-hidden">
                <FullCalendar
                    height="auto"
                    plugins={[resourceTimelinePlugin, interactionPlugin]}
                    initialView="resourceTimelineMonth"
                    resources={resources}
                    events={events}
                    editable={true}
                    selectable={true}
                    eventDrop={handleEventDrop}
                    eventResize={handleEventResize}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    resourceAreaHeaderContent="Quartos"
                    resourceAreaWidth="180px"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth'
                    }}
                    locale="pt-br"
                    buttonText={{
                        today: 'Hoje',
                        month: 'Mês',
                        week: 'Semana',
                        day: 'Dia'
                    }}
                    slotMinWidth={40}
                    resourceLabelContent={(info) => {
                        const status = info.resource.extendedProps.status;
                        const getStatusColor = (s: RoomStatus) => {
                            switch(s) {
                                case RoomStatus.AVAILABLE: return 'text-green-500';
                                case RoomStatus.CLEANING: return 'text-red-500';
                                case RoomStatus.INSPECTION: return 'text-blue-500';
                                case RoomStatus.MAINTENANCE: return 'text-gray-500';
                                default: return 'text-gray-400';
                            }
                        };
                        const getStatusIcon = (s: RoomStatus) => {
                            switch(s) {
                                case RoomStatus.AVAILABLE: return <CheckCircle size={10} />;
                                case RoomStatus.CLEANING: return <AlertTriangle size={10} />;
                                case RoomStatus.INSPECTION: return <Info size={10} />;
                                case RoomStatus.MAINTENANCE: return <Ban size={10} />;
                                default: return <Ban size={10} />;
                            }
                        };
                        return (
                            <div className="flex flex-col py-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-800">{info.resource.title}</span>
                                    {db.rooms.find(r => r.id.toString() === info.resource.id)?.icalConfig && (
                                        <button 
                                            title="Sincronizar iCal"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                const res = await syncICalForRoom(parseInt(info.resource.id, 10));
                                                alert(res.message);
                                            }}
                                            className="text-brand-green hover:text-green-700"
                                        >
                                            <RefreshCw size={12} />
                                        </button>
                                    )}
                                </div>
                                <div className={`flex items-center gap-1 text-[9px] font-bold uppercase ${getStatusColor(status as RoomStatus)}`}>
                                    {getStatusIcon(status as RoomStatus)}
                                    {status}
                                </div>
                            </div>
                        );
                    }}
                     eventContent={(arg) => {
                        const booking = arg.event.extendedProps as Booking;
                        const hasBalance = booking.balance > 0;
                        const isArrivalToday = new Date(booking.checkIn).toDateString() === new Date().toDateString();
                        const isDepartureToday = new Date(booking.checkOut).toDateString() === new Date().toDateString();

                        return (
                            <div className={`p-1 text-[10px] sm:text-xs font-semibold h-full w-full relative flex items-center gap-1 ${hasBalance && booking.status !== 'Checked-out' ? 'border-2 border-red-400/50 rounded' : ''}`} title={`${arg.event.title} - Saldo: ${booking.balance}`}>
                                {isArrivalToday && <Footprints size={12} className="text-white shrink-0" />}
                                <span className="truncate flex-1">{arg.event.title}</span>
                                {hasBalance && booking.status !== 'Checked-out' && <AlertCircle size={12} className="text-white shrink-0" />}
                            </div>
                        );
                    }}
                />
            </div>
             {selectedEvent && guestForSelectedEvent && roomForSelectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={() => setSelectedEvent(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-6 flex justify-between items-start border-b">
                            <h2 className="text-2xl font-bold text-brand-dark">Detalhes da Reserva</h2>
                            <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Guest Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-bold text-gray-800 mb-2">Hóspede</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2"><Users size={16}/>{guestForSelectedEvent.fullName}</div>
                                    <div className="flex items-center gap-2"><Mail size={16}/>{guestForSelectedEvent.email}</div>
                                    <div className="flex items-center gap-2"><Phone size={16}/>{guestForSelectedEvent.phone}</div>
                                    <div className="flex items-center gap-2"><Hash size={16}/>CPF: {guestForSelectedEvent.cpf}</div>
                                </div>
                            </div>

                             {/* Booking Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-bold text-gray-800 mb-2">Reserva</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                    <p><strong>Quarto:</strong> {roomForSelectedEvent.name}</p>
                                    <p><strong>Status:</strong> <span className="font-semibold" style={{ color: getBookingColor(selectedEvent.status) }}>{selectedEvent.status}</span></p>
                                    <p><strong>Check-in:</strong> {new Date(selectedEvent.checkIn).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                                    <p><strong>Check-out:</strong> {new Date(selectedEvent.checkOut).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                                </div>
                                {selectedEvent.addOns && selectedEvent.addOns.length > 0 && (
                                     <div className="mt-2 pt-2 border-t">
                                        <p className="text-sm"><strong>Extras:</strong> {selectedEvent.addOns.map(a => a.name).join(', ')}</p>
                                    </div>
                                )}
                            </div>
                            
                             {/* Payment Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-bold text-gray-800 mb-2">Financeiro</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                    <p><strong>Valor Total:</strong> {selectedEvent.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                    <p><strong>Status Pagamento:</strong> <span className={`font-semibold ${selectedEvent.paymentStatus === 'Paid' ? 'text-green-600' : 'text-yellow-600'}`}>{selectedEvent.paymentStatus}</span></p>
                                    <p className="sm:col-span-2"><strong>Saldo Devedor:</strong> <span className="font-bold text-red-600">{selectedEvent.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 flex justify-end gap-2 border-t bg-gray-50 rounded-b-2xl">
                           {selectedEvent.status === 'Confirmed' && <button className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"><CheckCircle size={16}/> Check-in</button>}
                           {selectedEvent.status === 'Checked-in' && <button className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"><Moon size={16}/> Check-out</button>}
                           {selectedEvent.status !== 'Cancelled' && <button className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"><Ban size={16}/> Cancelar</button>}
                        </div>
                    </div>
                </div>
             )}
            {confirmationModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-lg text-center">
                        <AlertTriangle size={40} className="mx-auto text-yellow-500 mb-4" />
                        <h3 className="text-lg font-bold text-gray-800">{confirmationModal.title}</h3>
                        <p className="text-sm text-gray-600 my-4">{confirmationModal.message}</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setConfirmationModal({ ...confirmationModal, isOpen: false })} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold">Cancelar</button>
                            <button onClick={confirmationModal.onConfirm} className="px-6 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green-dark font-semibold">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </Section>
    );
};

export default CalendarView;