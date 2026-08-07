import React, { useState, useMemo } from 'react';
import { Room, RoomStatus, Staff, StaffTask, TaskStatus, DBState, PropertyUnitId } from '../../types';
import { Section } from './shared';
import { SprayCan, Bed, User, Check, AlertTriangle, Eye, CheckCircle, ClipboardList, ClipboardCheck, Loader2, X, Building2, Waves, Trees } from 'lucide-react';

interface HousekeepingViewProps {
    db: DBState;
    rooms: Room[];
    staff: Staff[];
    staffTasks: StaffTask[];
    currentUser: Staff;
    onRoomStatusChange: (roomId: number, newStatus: RoomStatus) => Promise<void>;
    onApproveTask: (taskId: string) => Promise<void>;
    onRejectTask: (taskId: string, comment: string) => Promise<void>;
}

const HousekeepingView: React.FC<HousekeepingViewProps> = ({ db, rooms, staff, staffTasks, currentUser, onRoomStatusChange, onApproveTask, onRejectTask }) => {

    const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
    const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<PropertyUnitId | 'all'>('all');

    const canInspect = useMemo(() => 
        ['Super Administrador', 'Administrador Geral', 'Gerente', 'Limpeza'].includes(currentUser.role), 
    [currentUser.role]);

    const handleApprove = async (taskId: string) => {
        setProcessingTaskId(taskId);
        await onApproveTask(taskId);
        setProcessingTaskId(null);
    };

    const handleReject = async (taskId: string) => {
        const comment = prompt("Por favor, insira o motivo da rejeição (será enviado ao funcionário):");
        if (comment) {
            setProcessingTaskId(taskId);
            await onRejectTask(taskId, comment);
            setProcessingTaskId(null);
        }
    };

    // Filter rooms by property
    const filteredRooms = useMemo(() => {
        return rooms.filter(r => {
            if (selectedPropertyFilter === 'all') return true;
            return (r.propertyId || 'beach') === selectedPropertyFilter;
        });
    }, [rooms, selectedPropertyFilter]);

    const roomsToClean = useMemo(() => {
        return filteredRooms
            .filter(r => r.status === RoomStatus.CLEANING)
            .map(room => {
                const isDeparture = db.bookings.some(b => 
                    b.roomId === room.id && 
                    b.status === 'Checked-out' && 
                    new Date(b.checkOut).toDateString() === new Date().toDateString()
                );
                return { ...room, isPriority: isDeparture };
            })
            .sort((a, b) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0));
    }, [filteredRooms, db.bookings]);

    const roomsToInspect = filteredRooms.filter(r => r.status === RoomStatus.INSPECTION);

    const tasksAwaitingCheck = useMemo(() => {
        return staffTasks.filter(t => {
            if (t.status !== TaskStatus.AWAITING_CHECK) return false;
            if (selectedPropertyFilter === 'all') return true;
            if (!t.propertyId || t.propertyId === 'all') return true;
            return t.propertyId === selectedPropertyFilter;
        });
    }, [staffTasks, selectedPropertyFilter]);

    const otherHousekeepingTasks = useMemo(() => {
        return staffTasks.filter(t => {
            if (selectedPropertyFilter !== 'all' && t.propertyId && t.propertyId !== 'all' && t.propertyId !== selectedPropertyFilter) {
                return false;
            }
            const cleanerRole = staff.find(s => s.id === t.assigneeId)?.role === 'Limpeza';
            const isLaundry = t.description.toLowerCase().includes('lavanderia');
            const isIncomplete = t.status === TaskStatus.TODO || t.status === TaskStatus.IN_PROGRESS;
            const roomIsInCleaningCycle = t.roomId && rooms.some(r => r.id === t.roomId && (r.status === RoomStatus.CLEANING || r.status === RoomStatus.INSPECTION));
            
            return isIncomplete && !roomIsInCleaningCycle && (cleanerRole || isLaundry);
        });
    }, [staffTasks, selectedPropertyFilter, staff, rooms]);

    const getAssignedCleaner = (roomId: number) => {
        const task = staffTasks.find(t => t.roomId === roomId && t.status !== TaskStatus.DONE);
        if (task && task.assigneeId) {
            return staff.find(s => s.id === task.assigneeId)?.name || 'Não atribuído';
        }
        return 'N/A';
    };
    
    const RoomCard: React.FC<{ room: Room & { isPriority?: boolean }, action: 'clean' | 'inspect' }> = ({ room, action }) => {
        const isSanctuary = room.propertyId === 'sanctuary';
        return (
            <div className={`bg-white p-3 rounded-xl border shadow-sm ${room.isPriority ? 'border-l-4 border-l-red-500' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start gap-2 mb-1">
                    <div>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border mb-1 ${
                            isSanctuary ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                            {isSanctuary ? '🌿 Santuário' : '🏖️ Praia'}
                        </span>
                        <h4 className="font-bold text-gray-800 text-sm">{room.name}</h4>
                    </div>
                    {room.isPriority && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Alta Prioridade</span>}
                </div>
                <p className="text-xs text-gray-500">{room.type}</p>
                <p className="text-xs mt-2 font-medium flex items-center gap-1 text-gray-600"><User size={12} /> Limpeza: {getAssignedCleaner(room.id)}</p>
                
                {action === 'clean' && (
                    <button 
                        onClick={() => onRoomStatusChange(room.id, RoomStatus.INSPECTION)}
                        className="w-full mt-3 text-xs bg-blue-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        <Check size={14}/> Marcar como Limpo
                    </button>
                )}

                {action === 'inspect' && (
                     <button 
                        onClick={() => onRoomStatusChange(room.id, RoomStatus.AVAILABLE)}
                        className="w-full mt-3 text-xs bg-emerald-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        <CheckCircle size={14}/> Aprovar e Liberar
                    </button>
                )}
            </div>
        );
    };

    const InspectionTaskCard: React.FC<{ task: StaffTask }> = ({ task }) => {
        const assignee = staff.find(s => s.id === task.assigneeId);
        const isProcessing = processingTaskId === task.id;
        const taskProp = task.propertyId;
        return (
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                {taskProp && (
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border mb-1.5 ${
                        taskProp === 'sanctuary' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                        {taskProp === 'sanctuary' ? '🌿 Santuário' : taskProp === 'beach' ? '🏖️ Praia' : '🏢 Geral'}
                    </span>
                )}
                <p className="font-semibold text-xs text-gray-800">{task.description}</p>
                {assignee && <p className="text-[11px] text-gray-500 mt-1">Funcionário: {assignee.name}</p>}
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={() => handleApprove(task.id)}
                        disabled={isProcessing}
                        className="w-full text-xs bg-emerald-600 text-white font-bold py-1.5 px-2 rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1 disabled:bg-gray-400"
                    >
                        {isProcessing ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle size={12} />} Aprovar
                    </button>
                    <button
                        onClick={() => handleReject(task.id)}
                        disabled={isProcessing}
                        className="w-full text-xs bg-rose-600 text-white font-bold py-1.5 px-2 rounded-lg hover:bg-rose-700 flex items-center justify-center gap-1 disabled:bg-gray-400"
                    >
                        {isProcessing ? <Loader2 size={12} className="animate-spin"/> : <X size={12} />} Rejeitar
                    </button>
                </div>
            </div>
        );
    };

    return (
        <Section title="Painel de Governança Multi-Unidades" icon={SprayCan}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-emerald-50 p-4 rounded-2xl border border-emerald-200/60">
                <div>
                    <h2 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
                        <Building2 size={16} className="text-emerald-700" />
                        Filtro de Localização / Unidade do Staff
                    </h2>
                    <p className="text-xs text-gray-600 mt-0.5">Selecione o hostel para visualizar os quartos e tarefas de governança específicos.</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-emerald-200 shadow-sm">
                    <button
                        onClick={() => setSelectedPropertyFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            selectedPropertyFilter === 'all'
                                ? 'bg-emerald-700 text-white shadow-sm font-extrabold'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Building2 size={14} /> Todas
                    </button>

                    <button
                        onClick={() => setSelectedPropertyFilter('beach')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            selectedPropertyFilter === 'beach'
                                ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Waves size={14} /> 🏖️ Praia
                    </button>

                    <button
                        onClick={() => setSelectedPropertyFilter('sanctuary')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            selectedPropertyFilter === 'sanctuary'
                                ? 'bg-teal-600 text-white shadow-sm font-extrabold'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Trees size={14} /> 🌿 Santuário
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Rooms to Clean */}
                <div className="bg-yellow-50/70 rounded-2xl p-4 w-full md:w-1/4 border border-yellow-200/80">
                    <h3 className="font-bold text-sm text-yellow-900 mb-3 flex items-center gap-2"><SprayCan size={18}/> Vago Sujo / Limpeza ({roomsToClean.length})</h3>
                    <div className="space-y-3 h-[60vh] overflow-y-auto pr-2">
                        {roomsToClean.length === 0 ? (
                            <p className="text-xs text-yellow-700 italic text-center py-6">Nenhum quarto pendente nesta unidade.</p>
                        ) : (
                            roomsToClean.map(room => <RoomCard key={room.id} room={room} action="clean" />)
                        )}
                    </div>
                </div>

                {/* Rooms to Inspect */}
                <div className="bg-purple-50/70 rounded-2xl p-4 w-full md:w-1/4 border border-purple-200/80">
                    <h3 className="font-bold text-sm text-purple-900 mb-3 flex items-center gap-2"><Eye size={18}/> Em Inspeção ({roomsToInspect.length})</h3>
                    <div className="space-y-3 h-[60vh] overflow-y-auto pr-2">
                        {roomsToInspect.length === 0 ? (
                            <p className="text-xs text-purple-700 italic text-center py-6">Nenhum quarto em inspeção.</p>
                        ) : (
                            roomsToInspect.map(room => <RoomCard key={room.id} room={room} action="inspect" />)
                        )}
                    </div>
                </div>

                {/* Tasks Awaiting Check */}
                {canInspect && (
                    <div className="bg-indigo-50/70 rounded-2xl p-4 w-full md:w-1/4 border border-indigo-200/80">
                        <h3 className="font-bold text-sm text-indigo-900 mb-3 flex items-center gap-2"><ClipboardCheck size={18}/> Aguardando Verificação ({tasksAwaitingCheck.length})</h3>
                        <div className="space-y-3 h-[60vh] overflow-y-auto pr-2">
                            {tasksAwaitingCheck.length === 0 ? (
                                <p className="text-xs text-indigo-700 italic text-center py-6">Nenhuma tarefa aguardando verificação.</p>
                            ) : (
                                tasksAwaitingCheck.map(task => <InspectionTaskCard key={task.id} task={task} />)
                            )}
                        </div>
                    </div>
                )}

                {/* Other Tasks */}
                <div className="bg-blue-50/70 rounded-2xl p-4 w-full md:w-1/4 border border-blue-200/80">
                    <h3 className="font-bold text-sm text-blue-900 mb-3 flex items-center gap-2"><ClipboardList size={18}/> Outras Tarefas ({otherHousekeepingTasks.length})</h3>
                    <div className="space-y-3 h-[60vh] overflow-y-auto pr-2">
                        {otherHousekeepingTasks.length === 0 ? (
                            <p className="text-xs text-blue-700 italic text-center py-6">Nenhuma tarefa pendente nesta unidade.</p>
                        ) : (
                            otherHousekeepingTasks.map(task => {
                                const assignee = staff.find(s => s.id === task.assigneeId);
                                const room = task.roomId ? rooms.find(r => r.id === task.roomId) : null;
                                const taskProp = task.propertyId;
                                return (
                                    <div key={task.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                        {taskProp && (
                                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border mb-1.5 ${
                                                taskProp === 'sanctuary' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                                {taskProp === 'sanctuary' ? '🌿 Santuário' : taskProp === 'beach' ? '🏖️ Praia' : '🏢 Geral'}
                                            </span>
                                        )}
                                        <p className="font-semibold text-xs text-gray-800">{task.description}</p>
                                        <p className="text-[11px] text-gray-500 mt-1">Status: {task.status}</p>
                                        {assignee && <p className="text-[11px] text-gray-500">Atribuído a: {assignee.name}</p>}
                                        {room && <p className="text-[11px] text-gray-500">Local: {room.name}</p>}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </Section>
    );
};

export default HousekeepingView;