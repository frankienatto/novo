import React, { useState } from 'react';
import { Room, RoomStatus, PropertyUnitId } from '../../types';
import { Section } from './shared';
import { Bed as BedIcon, Edit, PlusCircle, Users, Loader2, SprayCan, Building2, Trees, Waves } from 'lucide-react';
import Modal from './Modal';
import { ResetCategoryButton } from './ResetCategoryButton';

interface RoomsViewProps {
    rooms: Room[];
    onStatusChange: (roomId: number, newStatus: RoomStatus) => Promise<void>;
    onAddRoom: () => void;
    onEditRoom: (room: Room) => void;
    onManageBeds: (roomId: number, newBedCount: number) => Promise<void>;
}

export const RoomsView: React.FC<RoomsViewProps> = ({ rooms, onStatusChange, onAddRoom, onEditRoom, onManageBeds }) => {
    const [isBedsModalOpen, setIsBedsModalOpen] = useState(false);
    const [selectedRoomForBeds, setSelectedRoomForBeds] = useState<Room | null>(null);
    const [newBedCount, setNewBedCount] = useState<number | string>('');
    const [isSavingBeds, setIsSavingBeds] = useState(false);
    const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<PropertyUnitId | 'all'>('all');

    const statusColors = {
        [RoomStatus.AVAILABLE]: "bg-green-100 text-green-800",
        [RoomStatus.OCCUPIED]: "bg-blue-100 text-blue-800",
        [RoomStatus.CLEANING]: "bg-yellow-100 text-yellow-800",
        [RoomStatus.INSPECTION]: "bg-purple-100 text-purple-800",
        [RoomStatus.MAINTENANCE]: "bg-red-100 text-red-800",
    };

    const handleOpenBedsModal = (room: Room) => {
        setSelectedRoomForBeds(room);
        setNewBedCount(room.capacity);
        setIsBedsModalOpen(true);
    };

    const handleCloseBedsModal = () => {
        setIsBedsModalOpen(false);
        setSelectedRoomForBeds(null);
        setNewBedCount('');
    };
    
    const handleSaveBeds = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRoomForBeds && newBedCount !== '') {
            setIsSavingBeds(true);
            await onManageBeds(selectedRoomForBeds.id, Number(newBedCount));
            setIsSavingBeds(false);
            handleCloseBedsModal();
        }
    };

    const filteredRooms = rooms.filter(room => {
        if (selectedPropertyFilter === 'all') return true;
        const roomProperty = room.propertyId || 'beach';
        return roomProperty === selectedPropertyFilter;
    });

    const beachRooms = rooms.filter(r => (r.propertyId || 'beach') === 'beach');
    const sanctuaryRooms = rooms.filter(r => r.propertyId === 'sanctuary');

    const totalBeachBeds = beachRooms.reduce((acc, r) => acc + r.capacity, 0);
    const totalSanctuaryBeds = sanctuaryRooms.reduce((acc, r) => acc + r.capacity, 0);

    return (
        <Section title="Gestão de Quartos e Unidades" icon={BedIcon} actions={
            <div className="flex gap-2">
                <ResetCategoryButton category="rooms" />
                <button onClick={onAddRoom} className="bg-brand-green text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-brand-green-dark flex items-center gap-2">
                    <PlusCircle size={18} /> <span className="hidden sm:inline">Adicionar Quarto</span>
                </button>
            </div>
        }>
            {/* Multi-Property Overview Banner */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-2xl p-5 text-white mb-6 shadow-md border border-emerald-700/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-300 flex items-center gap-1.5 mb-1">
                            <Building2 size={14} /> Operação Multi-Unidades Unificada
                        </span>
                        <h2 className="text-xl font-black text-white">Forest House Hostels & Resorts</h2>
                        <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
                            Gerencie as acomodações dos dois hostels: a vibe praiana do <strong>Forest House Beach</strong> e o refúgio privativo no <strong>Forest House Santuário</strong> (a 3km da praia, com 27 novas camas).
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-200 font-bold">
                                <Waves size={14} /> Unidade Praia
                            </div>
                            <div className="text-xl font-extrabold text-white mt-1">{beachRooms.length} <span className="text-xs font-normal text-emerald-200">quartos</span></div>
                            <div className="text-[11px] text-emerald-300 font-medium">{totalBeachBeds} camas totais</div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                            <div className="flex items-center gap-1.5 text-xs text-teal-200 font-bold">
                                <Trees size={14} /> Unidade Santuário
                            </div>
                            <div className="text-xl font-extrabold text-white mt-1">{sanctuaryRooms.length} <span className="text-xs font-normal text-teal-200">quartos</span></div>
                            <div className="text-[11px] text-teal-300 font-medium">{totalSanctuaryBeds} camas totais</div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-emerald-700/50">
                    <button
                        onClick={() => setSelectedPropertyFilter('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            selectedPropertyFilter === 'all'
                                ? 'bg-white text-emerald-950 shadow-md font-extrabold scale-105'
                                : 'bg-emerald-950/40 text-emerald-100 hover:bg-emerald-800/50 border border-emerald-700/40'
                        }`}
                    >
                        <Building2 size={14} />
                        Todas as Unidades ({rooms.length})
                    </button>

                    <button
                        onClick={() => setSelectedPropertyFilter('beach')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            selectedPropertyFilter === 'beach'
                                ? 'bg-emerald-500 text-white shadow-md font-extrabold scale-105'
                                : 'bg-emerald-950/40 text-emerald-100 hover:bg-emerald-800/50 border border-emerald-700/40'
                        }`}
                    >
                        <Waves size={14} />
                        🏖️ Forest House Beach ({beachRooms.length})
                    </button>

                    <button
                        onClick={() => setSelectedPropertyFilter('sanctuary')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            selectedPropertyFilter === 'sanctuary'
                                ? 'bg-teal-500 text-white shadow-md font-extrabold scale-105'
                                : 'bg-emerald-950/40 text-emerald-100 hover:bg-emerald-800/50 border border-emerald-700/40'
                        }`}
                    >
                        <Trees size={14} />
                        🌿 Santuário & Reserva ({sanctuaryRooms.length})
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRooms.map(room => {
                    const isSanctuary = room.propertyId === 'sanctuary';
                    return (
                        <div key={room.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-150 flex flex-col justify-between relative hover:shadow-md transition-shadow">
                             {room.status === RoomStatus.CLEANING && <span title="Limpeza Pendente" className="absolute top-2 right-2 z-10"><SprayCan size={16} className="text-yellow-600"/></span>}
                            <div>
                                <div className="flex justify-between items-start gap-2 mb-1.5">
                                    <div className="flex flex-col">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mb-1 w-fit ${
                                            isSanctuary 
                                                ? 'bg-teal-50 text-teal-700 border-teal-200' 
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}>
                                            {isSanctuary ? '🌿 Santuário & Reserva' : '🏖️ Forest Beach'}
                                        </span>
                                        <h3 className="font-bold text-lg text-gray-800 leading-snug">{room.name}</h3>
                                    </div>
                                   <button onClick={() => onEditRoom(room)} className="text-gray-400 hover:text-brand-green p-1"><Edit size={16}/></button>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">{room.type}</p>
                                <div className="text-right my-2">
                                    <p className="text-2xl font-extrabold text-brand-green">{room.basePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                    <span className="text-xs text-gray-500">/ noite (base)</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[room.status]}`}>{room.status}</span>
                                    <div className="flex items-center space-x-2 text-gray-600 text-xs font-semibold">
                                        <Users size={16} /><span>{room.capacity} camas</span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor={`status-${room.id}`} className="block text-xs font-medium text-gray-500 mb-1">Alterar Status</label>
                                    <select 
                                        id={`status-${room.id}`}
                                        value={room.status} 
                                        onChange={(e) => onStatusChange(room.id, e.target.value as RoomStatus)}
                                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-brand-green"
                                    >
                                        {Object.values(RoomStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                {room.type.includes('Compartilhado') && (
                                    <button
                                        onClick={() => handleOpenBedsModal(room)}
                                        className="w-full mt-2 text-sm bg-brand-dark text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-700 flex items-center justify-center gap-2"
                                    >
                                        <BedIcon size={16}/> Gerenciar Camas
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <Modal isOpen={isBedsModalOpen} onClose={handleCloseBedsModal} title={`Gerenciar Camas: ${selectedRoomForBeds?.name}`}>
                {selectedRoomForBeds && (
                    <form onSubmit={handleSaveBeds}>
                        <p className="text-sm text-gray-600 mb-4">Ajuste o número de camas para este dormitório ({selectedRoomForBeds.propertyId === 'sanctuary' ? '🌿 Santuário' : '🏖️ Praia'}).</p>
                        <div className="flex items-center gap-4">
                            <label className="block text-sm font-medium text-gray-700">Número de Camas:</label>
                             <input 
                                type="number" 
                                value={newBedCount} 
                                onChange={(e) => setNewBedCount(e.target.value)}
                                className="input-base w-full"
                                required 
                                min="1"
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" onClick={handleCloseBedsModal} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg">Cancelar</button>
                            <button type="submit" disabled={isSavingBeds} className="bg-brand-green text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                                {isSavingBeds ? <Loader2 className="animate-spin"/> : 'Salvar'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </Section>
    );
};

export default RoomsView;