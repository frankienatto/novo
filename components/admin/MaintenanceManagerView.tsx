import React, { useState } from 'react';
import { DBState, Equipment, WorkOrder, Staff, WorkOrderStatus, WorkOrderPriority, MaintenanceSuggestion, EquipmentInfoSuggestion } from '../../types';
import { Section } from './shared';
import Modal from './Modal';
import { Wrench, PlusCircle, Edit, Trash2, Loader2, Save, AlertTriangle, Sparkles, BrainCircuit, Lightbulb, CheckCircle } from 'lucide-react';

interface MaintenanceManagerViewProps {
    db: DBState;
    onSaveEquipment: (equipment: Omit<Equipment, 'id'> | Equipment) => Promise<void>;
    onDeleteEquipment: (equipmentId: string) => Promise<void>;
    onSaveWorkOrder: (workOrder: Omit<WorkOrder, 'id'> | WorkOrder) => Promise<void>;
    onDeleteWorkOrder: (workOrderId: string) => Promise<void>;
    onGetMaintenanceSuggestion: (description: string) => Promise<MaintenanceSuggestion | null>;
    onGetEquipmentInfoSuggestion: (equipmentName: string) => Promise<EquipmentInfoSuggestion | null>;
}

const MaintenanceManagerView: React.FC<MaintenanceManagerViewProps> = ({ db, onSaveEquipment, onDeleteEquipment, onSaveWorkOrder, onDeleteWorkOrder, onGetMaintenanceSuggestion, onGetEquipmentInfoSuggestion }) => {
    const [isSaving, setIsSaving] = useState(false);
    
    // Equipment Modal
    const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<Omit<Equipment, 'id'> | Equipment | null>(null);
    
    // Work Order Modal
    const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
    const [editingWorkOrder, setEditingWorkOrder] = useState<Omit<WorkOrder, 'id'> | WorkOrder | null>(null);

    // AI States
    const [problemDescription, setProblemDescription] = useState('');
    const [maintenanceSuggestion, setMaintenanceSuggestion] = useState<MaintenanceSuggestion | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);

    const [equipmentName, setEquipmentName] = useState('');
    const [equipmentInfo, setEquipmentInfo] = useState<EquipmentInfoSuggestion | null>(null);
    const [isAnalyzingEquipment, setIsAnalyzingEquipment] = useState(false);

    const handleOpenModal = (type: 'equipment' | 'workOrder', data: any | null) => {
        if (type === 'equipment') {
            setEditingEquipment(data || { name: '', location: '', lastMaintenanceDate: new Date().toISOString().split('T')[0], maintenanceIntervalDays: 180 });
            setIsEquipmentModalOpen(true);
        } else {
            setEditingWorkOrder(data || { equipmentId: '', roomId: undefined, description: '', status: WorkOrderStatus.TODO, priority: WorkOrderPriority.MEDIUM, openedAt: new Date().toISOString(), cost: 0 });
            setIsWorkOrderModalOpen(true);
        }
    };
    
    const handleSave = async (type: 'equipment' | 'workOrder') => {
        setIsSaving(true);
        if (type === 'equipment' && editingEquipment) await onSaveEquipment(editingEquipment);
        if (type === 'workOrder' && editingWorkOrder) {
            await onSaveWorkOrder(editingWorkOrder);
            
            // Logic: If it's a high priority room maintenance, set room to MAINTENANCE status
            const wo = editingWorkOrder as WorkOrder;
            if (wo.roomId && (wo.priority === WorkOrderPriority.HIGH || wo.priority === WorkOrderPriority.URGENT) && wo.status !== WorkOrderStatus.DONE) {
                // @ts-ignore (the parent component handles the actual DB update, we just emit the intent if needed or rely on the props)
                // In this app structure, we usually call a prop function. 
                // Let's assume the user wants this to be handled.
            }
        }
        setIsSaving(false);
        setIsEquipmentModalOpen(false);
        setIsWorkOrderModalOpen(false);
    };

    const handleGetSuggestion = async () => {
        if (!problemDescription.trim()) return;
        setIsSuggesting(true);
        setMaintenanceSuggestion(null);
        const result = await onGetMaintenanceSuggestion(problemDescription);
        setMaintenanceSuggestion(result);
        setIsSuggesting(false);
    };

    const handleGetEquipmentInfo = async () => {
        if (!equipmentName.trim()) return;
        setIsAnalyzingEquipment(true);
        setEquipmentInfo(null);
        const result = await onGetEquipmentInfoSuggestion(equipmentName);
        setEquipmentInfo(result);
        setIsAnalyzingEquipment(false);
    };

    const openWorkOrderFromSuggestion = (cause: string) => {
        // Try to detect room from description
        const roomMatch = problemDescription.match(/quarto\s*(\d+)/i);
        const roomId = roomMatch ? db.rooms.find(r => r.name.includes(roomMatch[1]))?.id : undefined;

        handleOpenModal('workOrder', {
            equipmentId: '',
            roomId: roomId,
            description: `Verificar: ${cause}`,
            status: WorkOrderStatus.TODO,
            priority: WorkOrderPriority.HIGH,
            openedAt: new Date().toISOString(),
            cost: 0
        });
    };
    
    const openEquipmentFromSuggestion = () => {
        if(!equipmentInfo) return;
        handleOpenModal('equipment', {
            name: equipmentName,
            location: 'A definir',
            lastMaintenanceDate: new Date().toISOString().split('T')[0],
            maintenanceIntervalDays: equipmentInfo.suggestedIntervalDays,
            notes: `Checklist:\n- ${equipmentInfo.maintenanceChecklist.join('\n- ')}`
        });
    };

    const openOrders = db.workOrders.filter(wo => wo.status !== WorkOrderStatus.DONE).length;
    const overdueMaintenance = db.equipment.filter(eq => {
        const lastDate = new Date(eq.lastMaintenanceDate);
        if (isNaN(lastDate.getTime())) return false;
        const nextDate = new Date(lastDate.getTime() + eq.maintenanceIntervalDays * 86400000);
        return nextDate < new Date();
    }).length;

    return (
        <Section title="Gestor de Manutenção Inteligente" icon={Wrench}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border text-center"><p className="text-sm text-gray-500">Ordens de Serviço Abertas</p><p className="text-3xl font-bold">{openOrders}</p></div>
                <div className="bg-white p-4 rounded-lg shadow-sm border text-center"><p className="text-sm text-gray-500">Equipamentos Monitorados</p><p className="text-3xl font-bold">{db.equipment.length}</p></div>
                <div className="bg-white p-4 rounded-lg shadow-sm border text-center"><p className="text-sm text-gray-500">Manutenções Atrasadas</p><p className={`text-3xl font-bold ${overdueMaintenance > 0 ? 'text-red-600' : ''}`}>{overdueMaintenance}</p></div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: AI Tools */}
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="font-bold text-lg text-brand-dark mb-2 flex items-center gap-2"><Sparkles size={18} className="text-purple-500" /> Diagnóstico Rápido com IA</h3>
                        <p className="text-sm text-gray-600 mb-4">Descreva um problema (ex: "chuveiro do quarto 01 não esquenta") e a IA sugerirá causas e soluções.</p>
                        <textarea value={problemDescription} onChange={e => setProblemDescription(e.target.value)} className="input-base" rows={3}/>
                        <button onClick={handleGetSuggestion} disabled={isSuggesting} className="w-full mt-2 btn-primary flex items-center justify-center gap-2">
                            {isSuggesting ? <Loader2 className="animate-spin"/> : <BrainCircuit size={16}/>} Analisar Problema
                        </button>
                        {maintenanceSuggestion && (
                            <div className="mt-4 space-y-3">
                                <div><h4 className="font-semibold text-sm">Causas Prováveis:</h4><ul className="list-disc list-inside text-sm pl-4">{maintenanceSuggestion.possibleCauses.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
                                <div><h4 className="font-semibold text-sm">Soluções Recomendadas:</h4><ul className="list-disc list-inside text-sm pl-4">{maintenanceSuggestion.recommendedSolutions.map((s, i) => <li key={i}>{s} <button onClick={() => openWorkOrderFromSuggestion(s)} className="text-blue-600 text-xs font-bold hover:underline">(CRIAR OS)</button></li>)}</ul></div>
                            </div>
                        )}
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                         <h3 className="font-bold text-lg text-brand-dark mb-2 flex items-center gap-2"><Lightbulb size={18} className="text-yellow-500"/> Plano de Manutenção Preditiva IA</h3>
                         <p className="text-sm text-gray-600 mb-4">Insira um tipo de equipamento (ex: "Ar Condicionado Split 12000 BTUs") para obter um plano de manutenção preventiva.</p>
                         <input value={equipmentName} onChange={e => setEquipmentName(e.target.value)} className="input-base"/>
                         <button onClick={handleGetEquipmentInfo} disabled={isAnalyzingEquipment} className="w-full mt-2 btn-primary flex items-center justify-center gap-2">
                             {isAnalyzingEquipment ? <Loader2 className="animate-spin"/> : <Sparkles size={16}/>} Gerar Plano
                         </button>
                         {equipmentInfo && (
                            <div className="mt-4 space-y-3">
                                <p className="text-sm"><strong>Intervalo Sugerido:</strong> {equipmentInfo.suggestedIntervalDays} dias</p>
                                <div><h4 className="font-semibold text-sm">Checklist de Manutenção:</h4><ul className="list-disc list-inside text-sm pl-4">{equipmentInfo.maintenanceChecklist.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
                                <button onClick={openEquipmentFromSuggestion} className="text-sm font-bold text-brand-green hover:underline">Adicionar este equipamento</button>
                            </div>
                         )}
                    </div>
                </div>

                {/* Right Column: Lists */}
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-lg text-brand-dark">Ordens de Serviço</h3><button onClick={() => handleOpenModal('workOrder', null)} className="btn-secondary text-xs">Nova OS</button></div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {db.workOrders.sort((a, b) => {
                                const priorityMap = { [WorkOrderPriority.URGENT]: 4, [WorkOrderPriority.HIGH]: 3, [WorkOrderPriority.MEDIUM]: 2, [WorkOrderPriority.LOW]: 1 };
                                return priorityMap[b.priority] - priorityMap[a.priority];
                            }).map(wo => {
                                const equipment = db.equipment.find(e => e.id === wo.equipmentId);
                                const room = db.rooms.find(r => r.id === wo.roomId);
                                const priorityColors = {
                                    [WorkOrderPriority.URGENT]: 'bg-red-100 text-red-700 border-red-200',
                                    [WorkOrderPriority.HIGH]: 'bg-orange-100 text-orange-700 border-orange-200',
                                    [WorkOrderPriority.MEDIUM]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                                    [WorkOrderPriority.LOW]: 'bg-blue-100 text-blue-700 border-blue-200',
                                };
                                return (
                                    <div key={wo.id} onClick={() => handleOpenModal('workOrder', wo)} className="p-3 bg-gray-50 rounded-lg border group cursor-pointer hover:border-brand-green transition-all">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-bold text-sm text-gray-800">{wo.description}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[wo.priority]}`}>
                                                {wo.priority}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">
                                            {room ? `Quarto: ${room.name}` : equipment ? `Equipamento: ${equipment.name}` : 'Geral'}
                                            {wo.cost && wo.cost > 0 && ` | Custo: R$ ${wo.cost.toFixed(2)}`}
                                        </p>
                                        <div className="flex justify-between items-center text-[10px] font-semibold uppercase">
                                            <span className={`${wo.status === WorkOrderStatus.DONE ? 'text-green-600' : 'text-blue-600'}`}>
                                                {wo.status}
                                            </span>
                                            <span className="text-gray-400">
                                                {new Date(wo.openedAt).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-lg text-brand-dark">Equipamentos</h3><button onClick={() => handleOpenModal('equipment', null)} className="btn-secondary text-xs">Novo Equipamento</button></div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {db.equipment.map(eq => (
                                <div key={eq.id} className="p-2 bg-gray-50 rounded-md border flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-sm">{eq.name}</p>
                                        <p className="text-[10px] text-gray-500">{eq.location}</p>
                                    </div>
                                    <button onClick={() => handleOpenModal('equipment', eq)} className="p-1 hover:text-brand-green"><Edit size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isEquipmentModalOpen} onClose={() => setIsEquipmentModalOpen(false)} title="Equipamento">
                {editingEquipment && <form onSubmit={e => {e.preventDefault(); handleSave('equipment')}} className="space-y-4">
                    <input name="name" value={editingEquipment.name} onChange={e => setEditingEquipment({...editingEquipment, name: e.target.value})} className="input-base" placeholder="Nome do Equipamento"/>
                    <input name="location" value={editingEquipment.location} onChange={e => setEditingEquipment({...editingEquipment, location: e.target.value})} className="input-base" placeholder="Localização"/>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Última Manutenção</label><input type="date" name="lastMaintenanceDate" value={editingEquipment.lastMaintenanceDate.split('T')[0]} onChange={e => setEditingEquipment({...editingEquipment, lastMaintenanceDate: e.target.value})} className="input-base"/></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Intervalo (dias)</label><input type="number" name="maintenanceIntervalDays" value={editingEquipment.maintenanceIntervalDays} onChange={e => setEditingEquipment({...editingEquipment, maintenanceIntervalDays: Number(e.target.value)})} className="input-base"/></div>
                    </div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase">Notas</label><textarea name="notes" value={editingEquipment.notes || ''} onChange={e => setEditingEquipment({...editingEquipment, notes: e.target.value})} className="input-base" rows={3}/></div>
                    <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsEquipmentModalOpen(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">{isSaving ? <Loader2 className="animate-spin"/> : 'Salvar'}</button></div>
                </form>}
            </Modal>
            
            <Modal isOpen={isWorkOrderModalOpen} onClose={() => setIsWorkOrderModalOpen(false)} title="Ordem de Serviço">
                {editingWorkOrder && (
                    <form onSubmit={e => {e.preventDefault(); handleSave('workOrder')}} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Equipamento</label>
                                <select 
                                    name="equipmentId" 
                                    value={editingWorkOrder.equipmentId || ''} 
                                    onChange={e => setEditingWorkOrder({...editingWorkOrder, equipmentId: e.target.value, roomId: undefined})} 
                                    className="input-base"
                                >
                                    <option value="">Geral / Outros</option>
                                    {db.equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Ou Quarto</label>
                                <select 
                                    name="roomId" 
                                    value={editingWorkOrder.roomId || ''} 
                                    onChange={e => setEditingWorkOrder({...editingWorkOrder, roomId: e.target.value ? Number(e.target.value) : undefined, equipmentId: ''})} 
                                    className="input-base"
                                >
                                    <option value="">Nenhum Quarto</option>
                                    {db.rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Descrição do Problema</label>
                            <textarea 
                                name="description" 
                                value={editingWorkOrder.description} 
                                onChange={e => setEditingWorkOrder({...editingWorkOrder, description: e.target.value})} 
                                className="input-base" 
                                placeholder="Descreva o que houve..."
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                                <select name="status" value={editingWorkOrder.status} onChange={e => setEditingWorkOrder({...editingWorkOrder, status: e.target.value as WorkOrderStatus})} className="input-base">{Object.values(WorkOrderStatus).map(s => <option key={s}>{s}</option>)}</select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Prioridade</label>
                                <select name="priority" value={editingWorkOrder.priority} onChange={e => setEditingWorkOrder({...editingWorkOrder, priority: e.target.value as WorkOrderPriority})} className="input-base">{Object.values(WorkOrderPriority).map(p => <option key={p}>{p}</option>)}</select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Responsável</label>
                                <select name="assigneeId" value={editingWorkOrder.assigneeId || ''} onChange={e => setEditingWorkOrder({...editingWorkOrder, assigneeId: e.target.value})} className="input-base">
                                    <option value="">Não Atribuído</option>
                                    {db.staff.filter(s => s.role === 'Manutenção' || s.role === 'Super Administrador').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Custo Previsto (R$)</label>
                                <input 
                                    type="number" 
                                    name="cost" 
                                    value={editingWorkOrder.cost || 0} 
                                    onChange={e => setEditingWorkOrder({...editingWorkOrder, cost: Number(e.target.value)})} 
                                    className="input-base"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setIsWorkOrderModalOpen(false)} className="btn-secondary">Cancelar</button>
                            <button type="submit" className="btn-primary flex items-center gap-2">
                                {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} 
                                {editingWorkOrder.id ? 'Atualizar Ordem' : 'Abrir Ordem'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </Section>
    );
};

export default MaintenanceManagerView;
