

import React, { useState, useMemo, useEffect } from 'react';
import { DBState, Staff, StaffTask, TaskStatus, AdminSection, Project, PropertyUnitId } from '../../types';
import { Section } from './shared';
import Modal from './Modal';
import { UserCog, PlusCircle, Edit, Trash2, Loader2, Save, UserPlus, Eye, EyeOff, Sun, ClipboardList, FolderKanban } from 'lucide-react';

const allStaffRoles: Staff['role'][] = ['Super Administrador', 'Administrador Geral', 'Gerente', 'Diretor de Marketing', 'Recepção', 'Limpeza', 'Manutenção', 'Financeiro', 'Jardim'];

const permissionCategories: Record<string, { label: string, permissions: { id: AdminSection, label: string }[] }> = {
    Geral: { label: "Acesso Geral", permissions: [{ id: 'dashboard', label: 'Dashboard Principal' }, { id: 'management_center', label: 'Comando Central' }, { id: 'synapse_agent', label: 'SYNAPSE Agent' }] },
    Operacoes: { label: "Operações", permissions: [{ id: 'calendar', label: 'Calendário' }, { id: 'bookings', label: 'Reservas' }, { id: 'rooms', label: 'Quartos' }, { id: 'housekeeping', label: 'Governança' }, { id: 'rate_manager', label: 'Tarifas e Restrições' }, { id: 'guests', label: 'Hóspedes' }, { id: 'pos', label: 'PDV (Caixa)' }, { id: 'partner_services', label: 'Serviços de Parceiros' }] },
    Gestao: { label: "Gestão", permissions: [{ id: 'staff', label: 'Central de Equipe' }, { id: 'projects', label: 'Projetos' }, { id: 'financial_manager', label: 'Financeiro' }, { id: 'inventory', label: 'Estoque' }, { id: 'shopping_list', label: 'Lista de Compras' }, { id: 'reports', label: 'Relatórios' }, { id: 'team_manager_ai', label: 'Gestor de Equipe IA' }] },
    Comunicacao: { label: "Comunicação", permissions: [{ id: 'omni_channel', label: 'Atendimento (Omni-channel)' }, { id: 'internal_chat', label: 'Chat Interno' }] },
    Marketing: { label: "Marketing", permissions: [{ id: 'marketing_dashboard', label: 'Painel de Marketing' }, { id: 'ai_strategy_consultant', label: 'Estratégia e Insights' }, { id: 'ai_marketing_lab', label: 'Laboratório de Marketing' }, { id: 'creative_studio', label: 'Conteúdo e Criativo' }, { id: 'social_media', label: 'Redes Sociais' }, { id: 'ad_campaign_manager', label: 'Campanhas de Anúncios' }, { id: 'marketing_orchestrator', label: 'Orquestrador IA' }, { id: 'ai_engagement_agent', label: 'Agente de Engajamento' }, { id: 'guest_journey_ai', label: 'Jornada do Cliente IA' }] },
    Configuracoes: { label: "Configurações", permissions: [{ id: 'property_settings', label: 'Configurações da Propriedade' }, { id: 'my_subscription', label: 'Minha Assinatura' }] },
};

const StaffModal: React.FC<{
    isOpen: boolean; onClose: () => void; onSave: (staff: Omit<Staff, 'id'> | Staff) => Promise<void>; staff: Omit<Staff, 'id'> | Staff | null;
}> = ({ isOpen, onClose, onSave, staff }) => {
    const [formData, setFormData] = useState(staff);
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => { setFormData(staff); }, [staff]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(prev => prev ? { ...prev, [e.target.name]: e.target.value } : null);
    const handlePermissionChange = (permissionId: AdminSection, checked: boolean) => setFormData(prev => {
        if (!prev) return null;
        const currentPermissions = new Set(Array.isArray(prev.permissions) ? prev.permissions : []);
        if (checked) currentPermissions.add(permissionId); else currentPermissions.delete(permissionId);
        return { ...prev, permissions: Array.from(currentPermissions) };
    });
    const handleCategorySelectAll = (categoryPermissions: { id: AdminSection }[], checked: boolean) => setFormData(prev => {
        if (!prev) return null;
        const currentPermissions = new Set(Array.isArray(prev.permissions) ? prev.permissions : []);
        categoryPermissions.forEach(p => { if (checked) currentPermissions.add(p.id); else currentPermissions.delete(p.id); });
        return { ...prev, permissions: Array.from(currentPermissions) };
    });
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!formData) return; setIsSaving(true); await onSave(formData); setIsSaving(false); onClose(); };
    if (!isOpen || !formData) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={'id' in formData ? 'Editar Membro da Equipe' : 'Adicionar Membro da Equipe'} size="3xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-xs font-semibold text-gray-700">Nome Completo:</label><input name="name" value={formData.name} onChange={handleChange} className="input-base" required /></div>
                    <div><label className="text-xs font-semibold text-gray-700">Email:</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="input-base" required /></div>
                    <div><label className="text-xs font-semibold text-gray-700">Cargo:</label><select name="role" value={formData.role} onChange={handleChange} className="input-base">{allStaffRoles.map(role => <option key={role} value={role}>{role}</option>)}</select></div>
                    <div>
                        <label className="text-xs font-semibold text-gray-700">Unidade Alocada (Hostel):</label>
                        <select name="propertyId" value={formData.propertyId || 'beach'} onChange={handleChange} className="input-base font-medium">
                            <option value="beach">🏖️ Hostel Beach</option>
                            <option value="sanctuary">🌿 Hostel Santuário</option>
                            <option value="all">🏢 Ambas / Global</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-gray-700">Senha:</label>
                        <div className="relative"><input type={showPassword ? 'text' : 'password'} name="password" value={formData.password || ''} onChange={handleChange} className="input-base pr-10" placeholder={'id' in formData ? 'Deixe em branco para não alterar' : 'Senha de acesso'} required={!('id' in formData)} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
                    </div>
                </div>
                <div>
                    <label className="font-semibold text-gray-800 text-sm">Permissões de Acesso</label>
                    <div className="mt-2 p-3 border rounded-lg max-h-64 overflow-y-auto space-y-4">
                        {Object.entries(permissionCategories).map(([key, category]) => {
                             const categoryPermissions = category.permissions.map(p => p.id);
                             const userPermissions = Array.isArray(formData.permissions) ? formData.permissions : [];
                             const isAllChecked = categoryPermissions.every(p => userPermissions.includes(p));
                             const isSomeChecked = categoryPermissions.some(p => userPermissions.includes(p));
                            return (
                                <div key={key}>
                                    <div className="flex items-center gap-3 border-b pb-2 mb-2">
                                        <input type="checkbox" className="h-4 w-4" checked={isAllChecked} ref={input => { if (input) input.indeterminate = !isAllChecked && isSomeChecked; }} onChange={(e) => handleCategorySelectAll(category.permissions, e.target.checked)} />
                                        <h4 className="font-semibold text-sm">{category.label}</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-4">
                                        {category.permissions.map(perm => (<label key={perm.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={userPermissions.includes(perm.id)} onChange={(e) => handlePermissionChange(perm.id, e.target.checked)} />{perm.label}</label>))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary flex items-center gap-2">{isSaving ? <Loader2 className="animate-spin"/> : <Save size={16}/>} Salvar</button></div>
            </form>
        </Modal>
    );
};

interface StaffViewProps {
    db: DBState;
    currentUser: Staff;
    selectedUnit?: PropertyUnitId | 'all';
    onStaffAdd: (staffData: Omit<Staff, 'id'>) => Promise<void>;
    onStaffUpdate: (updatedStaff: Staff) => Promise<void>;
    onStaffDelete: (staffId: string) => Promise<void>;
    onTaskAdd?: (taskData: Omit<StaffTask, 'id'>) => Promise<void>;
    onTaskStatusChange?: (taskId: string, newStatus: TaskStatus) => Promise<void>;
}

import { ResetCategoryButton } from './ResetCategoryButton';

const NewTaskModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<StaffTask, 'id'>) => Promise<void>;
    db: DBState;
    currentUser: Staff;
    defaultUnit?: PropertyUnitId | 'all';
}> = ({ isOpen, onClose, onSave, db, currentUser, defaultUnit = 'beach' }) => {
    const initialUnit: PropertyUnitId = (defaultUnit && defaultUnit !== 'all') 
        ? defaultUnit 
        : (currentUser.propertyId && currentUser.propertyId !== 'all') 
            ? currentUser.propertyId 
            : 'beach';

    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState(currentUser.id);
    const [propertyUnitId, setPropertyUnitId] = useState<PropertyUnitId>(initialUnit);
    const [roomId, setRoomId] = useState<number | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            setDescription('');
            setAssigneeId(currentUser.id);
            const unit = (defaultUnit && defaultUnit !== 'all') 
                ? defaultUnit 
                : (currentUser.propertyId && currentUser.propertyId !== 'all') 
                    ? currentUser.propertyId 
                    : 'beach';
            setPropertyUnitId(unit);
            setRoomId(undefined);
            setErrorMsg('');
        }
    }, [isOpen, defaultUnit, currentUser]);

    if (!isOpen) return null;

    const filteredRooms = db.rooms.filter(r => (r.propertyId || 'beach') === propertyUnitId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) {
            setErrorMsg('Por favor, informe a descrição da tarefa.');
            return;
        }
        if (!propertyUnitId) {
            setErrorMsg('É obrigatório selecionar a unidade do hostel.');
            return;
        }

        setIsSaving(true);
        try {
            await onSave({
                description: description.trim(),
                status: TaskStatus.TODO,
                assigneeId: assigneeId || undefined,
                roomId: roomId ? Number(roomId) : undefined,
                propertyUnitId: propertyUnitId,
                propertyId: propertyUnitId
            });
            onClose();
        } catch (err: any) {
            setErrorMsg(err.message || 'Erro ao criar tarefa.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Criar Nova Tarefa de Staff">
            <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                        {errorMsg}
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                        Descrição da Tarefa *
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Checagem do frigobar, manutenção do ar condicionado, limpeza profunda..."
                        className="input-base"
                        rows={3}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1">
                            Unidade do Hostel * (Obrigatório)
                        </label>
                        <select
                            value={propertyUnitId}
                            onChange={(e) => {
                                const newUnit = e.target.value as PropertyUnitId;
                                setPropertyUnitId(newUnit);
                                setRoomId(undefined);
                            }}
                            className="input-base font-bold bg-amber-50 border-amber-300 text-gray-800"
                            required
                        >
                            <option value="beach">🏖️ Forest House Beach (Praia)</option>
                            <option value="sanctuary">🌿 Forest House Santuário (Santuário)</option>
                        </select>
                        <p className="text-[11px] text-amber-700 mt-1 font-medium">
                            A seleção da unidade é obrigatória para alocar a tarefa ao staff correto.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Responsável
                        </label>
                        <select
                            value={assigneeId}
                            onChange={(e) => setAssigneeId(e.target.value)}
                            className="input-base"
                        >
                            <option value="">Nenhum (Disponível para equipe)</option>
                            {db.staff.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.role})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                        Quarto / Local Relacionado (Opcional)
                    </label>
                    <select
                        value={roomId || ''}
                        onChange={(e) => setRoomId(e.target.value ? Number(e.target.value) : undefined)}
                        className="input-base"
                    >
                        <option value="">Nenhum quarto específico</option>
                        {filteredRooms.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name} ({r.type})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="btn-primary flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Salvar Tarefa
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const StaffView: React.FC<StaffViewProps> = (props) => {
    const { db, currentUser, selectedUnit = 'all', onTaskAdd, onTaskStatusChange } = props;
    const [activeTab, setActiveTab] = useState<'myDay' | 'allTasks' | 'members' | 'projects'>('myDay');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<PropertyUnitId | 'all'>(
        selectedUnit !== 'all' ? selectedUnit : (currentUser.propertyId && currentUser.propertyId !== 'all') ? currentUser.propertyId : 'all'
    );

    useEffect(() => {
        if (selectedUnit) {
            setSelectedPropertyFilter(selectedUnit);
        }
    }, [selectedUnit]);

    const handleCreateTask = async (taskData: Omit<StaffTask, 'id'>) => {
        if (onTaskAdd) {
            await onTaskAdd(taskData);
        } else {
            alert("Ação de criação de tarefas não está disponível nesta visualização.");
        }
    };

    const MyDayTab = () => {
        const myTasks = db.staffTasks.filter(t => {
            if (t.assigneeId !== currentUser.id) return false;
            if (t.status !== TaskStatus.TODO && t.status !== TaskStatus.IN_PROGRESS) return false;
            if (selectedPropertyFilter !== 'all') {
                const unit = t.propertyUnitId || t.propertyId || 'beach';
                if (unit !== 'all' && unit !== selectedPropertyFilter) return false;
            }
            return true;
        });

        const todoTasks = myTasks.filter(t => t.status === TaskStatus.TODO);
        const inProgressTasks = myTasks.filter(t => t.status === TaskStatus.IN_PROGRESS);

        return (
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Filtrar por Unidade:</span>
                        <div className="flex gap-1.5">
                            <button onClick={() => setSelectedPropertyFilter('all')} className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedPropertyFilter === 'all' ? 'bg-brand-dark text-white' : 'bg-white text-gray-600 border'}`}>🏢 Todos</button>
                            <button onClick={() => setSelectedPropertyFilter('beach')} className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedPropertyFilter === 'beach' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-800 border border-emerald-200'}`}>🏖️ Beach</button>
                            <button onClick={() => setSelectedPropertyFilter('sanctuary')} className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedPropertyFilter === 'sanctuary' ? 'bg-teal-600 text-white' : 'bg-white text-teal-800 border border-teal-200'}`}>🌿 Santuário</button>
                        </div>
                    </div>
                    {onTaskAdd && (
                        <button onClick={() => setIsTaskModalOpen(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0">
                            <PlusCircle size={14} /> Nova Tarefa
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <h3 className="font-bold text-base text-blue-800 mb-3 flex items-center justify-between">
                            <span>A Fazer ({todoTasks.length})</span>
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {todoTasks.map(task => {
                                const unit = task.propertyUnitId || task.propertyId || 'beach';
                                return (
                                    <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-1.5">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className="text-sm font-medium text-gray-800">{task.description}</p>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                                unit === 'beach' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : unit === 'sanctuary' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                                {unit === 'beach' ? '🏖️ Beach' : unit === 'sanctuary' ? '🌿 Santuário' : '🏢 Todas'}
                                            </span>
                                        </div>
                                        {task.roomId && <p className="text-xs text-gray-500">📍 Quarto: {db.rooms.find(r => r.id === task.roomId)?.name}</p>}
                                        {onTaskStatusChange && (
                                            <button
                                                onClick={() => onTaskStatusChange(task.id, TaskStatus.IN_PROGRESS)}
                                                className="mt-1 text-xs bg-brand-green text-white font-semibold py-1 px-2.5 rounded hover:bg-brand-green-dark self-start"
                                            >
                                                Iniciar Tarefa
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            {todoTasks.length === 0 && <p className="text-xs text-gray-500 text-center py-4">Nenhuma tarefa a fazer nesta unidade.</p>}
                        </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                        <h3 className="font-bold text-base text-yellow-800 mb-3 flex items-center justify-between">
                            <span>Em Andamento ({inProgressTasks.length})</span>
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {inProgressTasks.map(task => {
                                const unit = task.propertyUnitId || task.propertyId || 'beach';
                                return (
                                    <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-1.5">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className="text-sm font-medium text-gray-800">{task.description}</p>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                                unit === 'beach' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : unit === 'sanctuary' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                                {unit === 'beach' ? '🏖️ Beach' : unit === 'sanctuary' ? '🌿 Santuário' : '🏢 Todas'}
                                            </span>
                                        </div>
                                        {task.roomId && <p className="text-xs text-gray-500">📍 Quarto: {db.rooms.find(r => r.id === task.roomId)?.name}</p>}
                                        {onTaskStatusChange && (
                                            <button
                                                onClick={() => onTaskStatusChange(task.id, TaskStatus.AWAITING_CHECK)}
                                                className="mt-1 text-xs bg-amber-600 text-white font-semibold py-1 px-2.5 rounded hover:bg-amber-700 self-start"
                                            >
                                                Concluir e Enviar para Verificação
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            {inProgressTasks.length === 0 && <p className="text-xs text-gray-500 text-center py-4">Nenhuma tarefa em andamento nesta unidade.</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const AllTasksTab = () => {
        const filteredTasks = db.staffTasks.filter(t => {
            if (selectedPropertyFilter !== 'all') {
                const unit = t.propertyUnitId || t.propertyId || 'beach';
                if (unit !== 'all' && unit !== selectedPropertyFilter) return false;
            }
            return true;
        });

        return (
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Filtrar por Unidade:</span>
                        <div className="flex gap-1.5">
                            <button onClick={() => setSelectedPropertyFilter('all')} className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedPropertyFilter === 'all' ? 'bg-brand-dark text-white' : 'bg-white text-gray-600 border'}`}>🏢 Todos</button>
                            <button onClick={() => setSelectedPropertyFilter('beach')} className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedPropertyFilter === 'beach' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-800 border border-emerald-200'}`}>🏖️ Beach</button>
                            <button onClick={() => setSelectedPropertyFilter('sanctuary')} className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedPropertyFilter === 'sanctuary' ? 'bg-teal-600 text-white' : 'bg-white text-teal-800 border border-teal-200'}`}>🌿 Santuário</button>
                        </div>
                    </div>
                    {onTaskAdd && (
                        <button onClick={() => setIsTaskModalOpen(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0">
                            <PlusCircle size={14} /> Nova Tarefa
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">Unidade</th>
                                <th className="px-4 py-3 text-left">Descrição</th>
                                <th className="px-4 py-3 text-left">Responsável</th>
                                <th className="px-4 py-3 text-left">Quarto/Local</th>
                                <th className="px-4 py-3 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredTasks.map(task => {
                                const unit = task.propertyUnitId || task.propertyId || 'beach';
                                const assignee = db.staff.find(s => s.id === task.assigneeId);
                                const room = task.roomId ? db.rooms.find(r => r.id === task.roomId) : null;
                                return (
                                    <tr key={task.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap font-bold">
                                            <span className={`px-2 py-0.5 rounded-full border ${
                                                unit === 'beach' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : unit === 'sanctuary' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                                {unit === 'beach' ? '🏖️ Beach' : unit === 'sanctuary' ? '🌿 Santuário' : '🏢 Global'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{task.description}</td>
                                        <td className="px-4 py-3 text-gray-600">{assignee ? assignee.name : 'Nenhum'}</td>
                                        <td className="px-4 py-3 text-gray-500">{room ? room.name : '—'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap font-bold">
                                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                                {task.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredTasks.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500 italic">
                                        Nenhuma tarefa cadastrada nesta unidade.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const MembersTab = () => {
        const { onStaffAdd, onStaffUpdate, onStaffDelete } = props;
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [editingStaff, setEditingStaff] = useState<Omit<Staff, 'id'> | Staff | null>(null);
        const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);

        const handleOpenModal = (staff: Staff | null) => { setEditingStaff(staff || { name: '', role: 'Recepção', email: '', permissions: ['dashboard'], password: '', propertyId: 'beach' }); setIsModalOpen(true); };
        const handleSave = async (staffData: Omit<Staff, 'id'> | Staff) => { if ('id' in staffData) { await onStaffUpdate(staffData); } else { await onStaffAdd(staffData); }};
        const handleDelete = async (staffId: string) => { 
            if (window.confirm('Tem certeza que deseja excluir este membro da equipe? Esta ação não pode ser desfeita.')) { 
                setDeletingStaffId(staffId);
                await onStaffDelete(staffId); 
                setDeletingStaffId(null);
            }
        };
        return (
            <div>
                 <div className="text-right mb-4">
                    <button onClick={() => handleOpenModal(null)} className="btn-primary flex items-center gap-2">
                        <UserPlus size={18} /> Adicionar Membro
                    </button>
                </div>
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidade Alocada</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {db.staff.map((staff) => {
                                const unit = staff.propertyId || 'beach';
                                return (
                                    <tr key={staff.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                                            <span className={`px-2 py-1 rounded-full font-bold ${
                                                unit === 'beach' ? 'bg-emerald-100 text-emerald-800' : unit === 'sanctuary' ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {unit === 'beach' ? '🏖️ Hostel Beach' : unit === 'sanctuary' ? '🌿 Hostel Santuário' : '🏢 Ambas'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                            <button onClick={() => handleOpenModal(staff)} className="text-blue-600 hover:text-blue-900">Editar</button>
                                            {currentUser.id !== staff.id && currentUser.role === 'Super Administrador' && (
                                                <button onClick={() => handleDelete(staff.id)} disabled={deletingStaffId === staff.id} className="text-red-600 hover:text-red-900 disabled:opacity-50">
                                                    {deletingStaffId === staff.id ? <Loader2 size={14} className="animate-spin" /> : 'Excluir'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <StaffModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} staff={editingStaff} />
            </div>
        );
    };

    const ProjectsKanbanTab = () => {
        const projectColumns: { title: string; status: Project['status'] }[] = [
            { title: 'Ativos', status: 'Ativo' },
            { title: 'Concluídos', status: 'Concluído' },
            { title: 'Arquivados', status: 'Arquivado' },
        ];
        return (
            <div className="flex gap-6 overflow-x-auto pb-4">
                {projectColumns.map(col => (
                    <div key={col.status} className="w-80 flex-shrink-0 bg-gray-100 p-3 rounded-lg">
                        <h3 className="font-bold text-gray-700 mb-3">{col.title}</h3>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {db.projects.filter(p => p.status === col.status).map(project => {
                                const projectTasks = db.staffTasks.filter(t => t.projectId === project.id);
                                const doneTasks = projectTasks.filter(t => t.status === TaskStatus.DONE).length;
                                const progress = projectTasks.length > 0 ? (doneTasks / projectTasks.length) * 100 : 0;
                                return (
                                    <div key={project.id} className="bg-white p-3 rounded-md shadow-sm">
                                        <h4 className="font-semibold text-sm">{project.name}</h4>
                                        <p className="text-xs text-gray-600 my-1">{project.description}</p>
                                        <p className="text-xs text-gray-500">Responsável: {db.staff.find(s => s.id === project.ownerId)?.name || 'N/A'}</p>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                            <div className="bg-brand-green h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    
    return (
        <Section title="Central de Equipe" icon={UserCog} actions={<ResetCategoryButton category="staff" />}>
            <div className="flex border-b mb-6 overflow-x-auto">
                <button onClick={() => setActiveTab('myDay')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold whitespace-nowrap ${activeTab === 'myDay' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}><Sun size={16}/> Meu Dia</button>
                <button onClick={() => setActiveTab('allTasks')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold whitespace-nowrap ${activeTab === 'allTasks' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}><ClipboardList size={16}/> Gestão de Tarefas</button>
                <button onClick={() => setActiveTab('members')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold whitespace-nowrap ${activeTab === 'members' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}><UserCog size={16}/> Membros da Equipe</button>
                <button onClick={() => setActiveTab('projects')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold whitespace-nowrap ${activeTab === 'projects' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}><FolderKanban size={16}/> Kanban de Projetos</button>
            </div>
            {activeTab === 'myDay' && <MyDayTab />}
            {activeTab === 'allTasks' && <AllTasksTab />}
            {activeTab === 'members' && <MembersTab />}
            {activeTab === 'projects' && <ProjectsKanbanTab />}

            <NewTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={handleCreateTask}
                db={db}
                currentUser={currentUser}
                defaultUnit={selectedPropertyFilter}
            />
        </Section>
    );
};

export default StaffView;
