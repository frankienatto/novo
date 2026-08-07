import React, { useState, useMemo, useEffect } from 'react';
import { Staff, DBState, StaffTask, TaskStatus, PropertyUnitId } from '../../../types';
import { Play, Check, Building2, PlusCircle, Loader2, Save } from 'lucide-react';
import Modal from '../Modal';

interface MyTasksDashboardProps {
    currentUser: Staff;
    db: DBState;
    selectedUnit?: PropertyUnitId | 'all';
    onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
    onTaskAdd?: (taskData: Omit<StaffTask, 'id'>) => Promise<void>;
}

interface TaskCardProps {
    task: StaffTask;
    db: DBState;
    onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, db, onTaskStatusChange }) => {
    const room = task.roomId ? db.rooms.find(r => r.id === task.roomId) : null;
    const nextStatus = task.status === TaskStatus.TODO ? TaskStatus.IN_PROGRESS : TaskStatus.AWAITING_CHECK;
    const buttonText = task.status === TaskStatus.TODO ? "Iniciar" : "Concluir";
    const ButtonIcon = task.status === TaskStatus.TODO ? Play : Check;
    const taskUnit = task.propertyUnitId || task.propertyId || 'beach';

    return (
        <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-sm space-y-2">
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-800 leading-snug">{task.description}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    taskUnit === 'beach' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : taskUnit === 'sanctuary'
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                    {taskUnit === 'beach' ? '🏖️ Beach' : taskUnit === 'sanctuary' ? '🌿 Santuário' : '🏢 Todas'}
                </span>
            </div>
            {room && <p className="text-xs text-gray-500">📍 Local: <span className="font-medium text-gray-700">{room.name}</span></p>}
            <button 
                onClick={() => onTaskStatusChange(task.id, nextStatus)}
                className="w-full mt-2 text-xs bg-brand-green text-white font-semibold py-2 px-3 rounded-lg hover:bg-brand-green-dark transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
            >
                <ButtonIcon size={14}/> {buttonText}
            </button>
        </div>
    );
};

const MyTasksDashboard: React.FC<MyTasksDashboardProps> = ({ currentUser, db, selectedUnit = 'all', onTaskStatusChange, onTaskAdd }) => {
    const initialFilter: PropertyUnitId | 'all' = selectedUnit !== 'all' 
        ? selectedUnit 
        : (currentUser.propertyId && currentUser.propertyId !== 'all') 
            ? currentUser.propertyId 
            : 'all';

    const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<PropertyUnitId | 'all'>(initialFilter);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [taskDesc, setTaskDesc] = useState('');
    const [taskUnit, setTaskUnit] = useState<PropertyUnitId>(
        selectedPropertyFilter !== 'all' ? selectedPropertyFilter : (currentUser.propertyId && currentUser.propertyId !== 'all') ? currentUser.propertyId : 'beach'
    );
    const [isSaving, setIsSaving] = useState(false);

    React.useEffect(() => {
        if (selectedUnit) {
            setSelectedPropertyFilter(selectedUnit);
        }
    }, [selectedUnit]);

    const filteredMyTasks = useMemo(() => {
        return db.staffTasks.filter(t => {
            const isAssignedToMe = t.assigneeId === currentUser.id;
            if (!isAssignedToMe) return false;

            if (selectedPropertyFilter !== 'all') {
                const unit = t.propertyUnitId || t.propertyId || 'beach';
                if (unit !== 'all' && unit !== selectedPropertyFilter) {
                    return false;
                }
            }
            return true;
        });
    }, [db.staffTasks, currentUser.id, selectedPropertyFilter]);

    const todoTasks = filteredMyTasks.filter(t => t.status === TaskStatus.TODO);
    const inProgressTasks = filteredMyTasks.filter(t => t.status === TaskStatus.IN_PROGRESS);

    const handleCreateTaskSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskDesc.trim() || !taskUnit) return;
        if (!onTaskAdd) return;

        setIsSaving(true);
        try {
            await onTaskAdd({
                description: taskDesc.trim(),
                status: TaskStatus.TODO,
                assigneeId: currentUser.id,
                propertyUnitId: taskUnit,
                propertyId: taskUnit
            });
            setTaskDesc('');
            setIsCreateModalOpen(false);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
                        <span>Painel de {currentUser.role}</span>
                        {currentUser.propertyId && currentUser.propertyId !== 'all' && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {currentUser.propertyId === 'beach' ? '🏖️ Hostel Beach' : '🌿 Hostel Santuário'}
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">Bem-vindo(a), {(currentUser.name || '').split(' ')[0]}! Aqui estão suas tarefas para hoje.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* Filtro por Unidade */}
                    <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 flex items-center gap-1">
                            <Building2 size={12} /> Unidade:
                        </span>
                        <button
                            onClick={() => setSelectedPropertyFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedPropertyFilter === 'all'
                                    ? 'bg-brand-dark text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            🏢 Todos
                        </button>
                        <button
                            onClick={() => setSelectedPropertyFilter('beach')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedPropertyFilter === 'beach'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-emerald-800 hover:bg-emerald-50'
                            }`}
                        >
                            🏖️ Beach
                        </button>
                        <button
                            onClick={() => setSelectedPropertyFilter('sanctuary')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedPropertyFilter === 'sanctuary'
                                    ? 'bg-teal-600 text-white shadow-sm'
                                    : 'text-teal-800 hover:bg-teal-50'
                            }`}
                        >
                            🌿 Santuário
                        </button>
                    </div>

                    {onTaskAdd && (
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm shrink-0"
                        >
                            <PlusCircle size={15} /> Nova Tarefa
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/80">
                    <h3 className="font-bold text-base text-blue-900 mb-3 flex items-center justify-between">
                        <span>A Fazer</span>
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-bold">{todoTasks.length}</span>
                    </h3>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                        {todoTasks.map(task => <TaskCard key={task.id} task={task} db={db} onTaskStatusChange={onTaskStatusChange} />)}
                        {todoTasks.length === 0 && (
                            <div className="text-center py-8 bg-white/50 rounded-xl border border-dashed border-blue-200">
                                <p className="text-xs font-medium text-blue-600">Nenhuma tarefa pendente nesta unidade.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80">
                    <h3 className="font-bold text-base text-amber-900 mb-3 flex items-center justify-between">
                        <span>Em Andamento</span>
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">{inProgressTasks.length}</span>
                    </h3>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                         {inProgressTasks.map(task => <TaskCard key={task.id} task={task} db={db} onTaskStatusChange={onTaskStatusChange} />)}
                         {inProgressTasks.length === 0 && (
                            <div className="text-center py-8 bg-white/50 rounded-xl border border-dashed border-amber-200">
                                <p className="text-xs font-medium text-amber-600">Nenhuma tarefa em andamento nesta unidade.</p>
                            </div>
                         )}
                    </div>
                </div>
            </div>

            {onTaskAdd && (
                <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Criar Tarefa">
                    <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Descrição *</label>
                            <input 
                                type="text" 
                                value={taskDesc} 
                                onChange={(e) => setTaskDesc(e.target.value)} 
                                className="input-base" 
                                placeholder="Descrição da tarefa..." 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-800 mb-1">Unidade * (Obrigatório)</label>
                            <select 
                                value={taskUnit} 
                                onChange={(e) => setTaskUnit(e.target.value as PropertyUnitId)} 
                                className="input-base font-bold bg-amber-50 border-amber-300" 
                                required
                            >
                                <option value="beach">🏖️ Hostel Beach</option>
                                <option value="sanctuary">🌿 Hostel Santuário</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-3 border-t">
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">Cancelar</button>
                            <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-1.5">
                                {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Salvar Tarefa
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default MyTasksDashboard;
