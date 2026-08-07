import React, { useState, useMemo } from 'react';
import { DBState, Staff, Booking, RoomStatus, StaffTask, TaskStatus, Room } from '../../../types';
import { Sun, Moon, AlertTriangle, Loader2, Bed, Users, Wallet, CheckCircle, X, Wrench, SprayCan, UserPlus, ClipboardList, BedDouble } from 'lucide-react';
import Modal from '../Modal';

interface OperationalDashboardProps {
    db: DBState;
    currentUser: Staff;
    onCheckIn: (bookingId: string) => Promise<void>;
    onCheckOut: (bookingId: string) => Promise<void>;
    onRoomStatusChange: (roomId: number, newStatus: RoomStatus) => Promise<void>;
    onAddBooking: () => void;
    onAddGuest: () => void;
}

export const OperationalDashboard: React.FC<OperationalDashboardProps> = (props) => {
    const { db, currentUser, onCheckIn, onCheckOut, onRoomStatusChange, onAddBooking, onAddGuest } = props;
    const today = new Date().toISOString().split('T')[0];

    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const checkInsToday = useMemo(() => db.bookings.filter(b => b.checkIn === today && (b.status === 'Confirmed' || b.status === 'Pre-Checked-in')), [db.bookings, today]);
    const checkOutsToday = useMemo(() => db.bookings.filter(b => b.checkOut === today && b.status === 'Checked-in'), [db.bookings, today]);

    const handleOpenCheckin = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsCheckinModalOpen(true);
    };

    const handleOpenCheckout = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsCheckoutModalOpen(true);
    };

    const handleConfirmCheckin = async () => {
        if (!selectedBooking) return;
        setIsProcessing(true);
        try {
            await onCheckIn(selectedBooking.id);
        } catch (error: any) {
            alert(`Erro no Check-in: ${error.message}`);
        }
        setIsProcessing(false);
        setIsCheckinModalOpen(false);
        setSelectedBooking(null);
    };
    
    const handleConfirmCheckout = async () => {
        if (!selectedBooking) return;
        setIsProcessing(true);
        try {
            await onCheckOut(selectedBooking.id);
        } catch (error: any) {
             alert(`Erro no Check-out: ${error.message}`);
        }
        setIsProcessing(false);
        setIsCheckoutModalOpen(false);
        setSelectedBooking(null);
    };


    const DailyFlowColumn: React.FC = () => (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="font-bold text-lg text-green-800 mb-3 flex items-center gap-2"><Sun size={20}/> Check-ins de Hoje ({checkInsToday.length})</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {checkInsToday.length > 0 ? checkInsToday.map(b => (
                        <div key={b.id} className="bg-green-50 p-3 rounded-md border border-green-200">
                            <p className="font-semibold">{db.guests.find(g => g.id === b.guestId)?.fullName}</p>
                            <p className="text-sm text-gray-600">{db.rooms.find(r => r.id === b.roomId)?.name}</p>
                            <button onClick={() => handleOpenCheckin(b)} className="mt-2 w-full bg-green-500 text-white text-xs font-bold py-1 px-2 rounded-md">Realizar Check-in</button>
                        </div>
                    )) : <p className="text-sm text-gray-500 text-center py-4">Nenhum check-in para hoje.</p>}
                </div>
            </div>
             <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="font-bold text-lg text-red-800 mb-3 flex items-center gap-2"><Moon size={20}/> Check-outs de Hoje ({checkOutsToday.length})</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {checkOutsToday.length > 0 ? checkOutsToday.map(b => (
                        <div key={b.id} className="bg-red-50 p-3 rounded-md border border-red-200">
                            <p className="font-semibold">{db.guests.find(g => g.id === b.guestId)?.fullName}</p>
                            <p className="text-sm text-gray-600">{db.rooms.find(r => r.id === b.roomId)?.name}</p>
                            <button onClick={() => handleOpenCheckout(b)} className="mt-2 w-full bg-red-500 text-white text-xs font-bold py-1 px-2 rounded-md">Realizar Check-out</button>
                        </div>
                    )) : <p className="text-sm text-gray-500 text-center py-4">Nenhum check-out para hoje.</p>}
                </div>
            </div>
        </div>
    );

    const QuickActionsColumn: React.FC = () => {
        const cleaningTasks = db.rooms.filter(r => r.status === RoomStatus.CLEANING);
        const maintenanceTasks = db.staffTasks.filter(t => (t.status === TaskStatus.TODO || t.status === TaskStatus.IN_PROGRESS) && t.assigneeId === currentUser.id && !t.description.toLowerCase().includes('limpeza'));
        
        return (
            <div className="bg-white p-4 rounded-lg shadow-sm border h-full">
                <h3 className="font-bold text-lg text-brand-dark mb-3">Centro de Ação Rápida</h3>
                 <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm text-yellow-700 flex items-center gap-2 mb-2"><SprayCan size={16}/> Quartos para Limpeza</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {cleaningTasks.length > 0 ? cleaningTasks.map(room => (
                                <div key={room.id} className="bg-yellow-50 p-2 rounded-md text-sm">{room.name}</div>
                            )) : <p className="text-xs text-gray-500">Nenhum quarto para limpar.</p>}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-blue-700 flex items-center gap-2 mb-2"><Wrench size={16}/> Minhas Tarefas</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {maintenanceTasks.length > 0 ? maintenanceTasks.map(task => (
                                <div key={task.id} className="bg-blue-50 p-2 rounded-md text-sm">{task.description}</div>
                            )) : <p className="text-xs text-gray-500">Nenhuma tarefa pendente.</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    const GeneralStatusColumn: React.FC = () => {
        const statusColors: Record<RoomStatus, string> = {
            [RoomStatus.AVAILABLE]: "bg-green-500",
            [RoomStatus.OCCUPIED]: "bg-blue-500",
            [RoomStatus.CLEANING]: "bg-yellow-500",
            [RoomStatus.INSPECTION]: "bg-purple-500",
            [RoomStatus.MAINTENANCE]: "bg-red-500",
        };
        const availableRooms = db.rooms.filter(r => r.status === RoomStatus.AVAILABLE).length;
        const occupiedRooms = db.rooms.filter(r => r.status === RoomStatus.OCCUPIED).length;

        return (
             <div className="bg-white p-4 rounded-lg shadow-sm border h-full">
                <h3 className="font-bold text-lg text-brand-dark mb-3">Status Geral</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Mapa de Ocupação</h4>
                        <div className="grid grid-cols-4 gap-2">
                            {db.rooms.map(room => (
                                <div key={room.id} title={`${room.name} - ${room.status}`} className={`h-8 rounded ${statusColors[room.status]}`} />
                            ))}
                        </div>
                         <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">
                            {Object.entries(statusColors).map(([status, color]) => <div key={status} className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${color}`}></div>{status}</div>)}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                         <div className="text-center"><p className="text-2xl font-bold">{availableRooms}</p><p className="text-sm text-gray-600">Quartos Livres</p></div>
                         <div className="text-center"><p className="text-2xl font-bold">{occupiedRooms}</p><p className="text-sm text-gray-600">Quartos Ocupados</p></div>
                    </div>
                    <div className="space-y-2 pt-4 border-t">
                        <button onClick={onAddBooking} className="w-full btn-primary flex items-center justify-center gap-2"><BedDouble size={16}/> Nova Reserva</button>
                        <button onClick={onAddGuest} className="w-full btn-secondary flex items-center justify-center gap-2"><UserPlus size={16}/> Novo Hóspede</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <div className="lg:col-span-1"><DailyFlowColumn/></div>
                <div className="lg:col-span-1"><QuickActionsColumn/></div>
                <div className="lg:col-span-1"><GeneralStatusColumn/></div>
            </div>
            
             <Modal isOpen={isCheckinModalOpen} onClose={() => setIsCheckinModalOpen(false)} title={`Realizar Check-in: ${db.guests.find(g=>g.id === selectedBooking?.guestId)?.fullName}`}>
                {selectedBooking && (() => {
                    const room = db.rooms.find(r => r.id === selectedBooking.roomId);
                    const isRoomReady = room?.status === RoomStatus.AVAILABLE || room?.status === RoomStatus.INSPECTION || room?.status === RoomStatus.CLEANING;
                    return (
                        <div className="space-y-4">
                            <ul className="space-y-2">
                                <li className={`flex items-center gap-2 p-2 rounded-md ${isRoomReady ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {isRoomReady ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}
                                    Status do Quarto: <strong>{room?.status}</strong>
                                </li>
                                 <li className={`flex items-center gap-2 p-2 rounded-md ${selectedBooking.balance <= 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {selectedBooking.balance <= 0 ? <CheckCircle size={18}/> : <Wallet size={18}/>}
                                    Saldo: <strong>{selectedBooking.balance.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</strong>
                                </li>
                            </ul>
                            {!isRoomReady && <p className="text-sm text-red-600">Atenção: O quarto não está como "Disponível". Verifique a situação antes de prosseguir.</p>}
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <button onClick={() => setIsCheckinModalOpen(false)} className="btn-secondary">Cancelar</button>
                                <button onClick={handleConfirmCheckin} disabled={isProcessing || !isRoomReady} className="btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed">{isProcessing ? <Loader2 className="animate-spin"/> : 'Confirmar Check-in'}</button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
             <Modal isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)} title={`Realizar Check-out: ${db.guests.find(g=>g.id === selectedBooking?.guestId)?.fullName}`}>
                {selectedBooking && (
                    <div className="space-y-4">
                        {selectedBooking.balance > 0 && (
                             <div className="p-3 bg-red-100 text-red-800 rounded-lg flex items-center gap-2">
                                <AlertTriangle size={18}/>
                                <strong>Atenção:</strong> Hóspede com saldo devedor de {selectedBooking.balance.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}.
                            </div>
                        )}
                        <p>Confirmar o check-out deste hóspede? O quarto será automaticamente movido para o status de "Limpeza".</p>
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <button onClick={() => setIsCheckoutModalOpen(false)} className="btn-secondary">Cancelar</button>
                            <button onClick={handleConfirmCheckout} disabled={isProcessing} className="btn-primary">{isProcessing ? <Loader2 className="animate-spin"/> : 'Confirmar Check-out'}</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};