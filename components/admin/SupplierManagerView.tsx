import React, { useState, useMemo } from 'react';
import { DBState, Supplier, PurchaseOrder, PurchaseOrderStatus, SupplierCategory, Product } from '../../types';
import { Section } from './shared';
import Modal from './Modal';
import { Package, PlusCircle, Edit, Trash2, Loader2, Save, CheckCircle, Truck, ShoppingCart, Star as StarIcon } from 'lucide-react';

interface SupplierManagerViewProps {
    db: DBState;
    onSaveSupplier: (supplier: Omit<Supplier, 'id'> | Supplier) => Promise<void>;
    onDeleteSupplier: (supplierId: string) => Promise<void>;
    onSavePurchaseOrder: (purchaseOrder: Omit<PurchaseOrder, 'id'> | PurchaseOrder) => Promise<void>;
    onDeletePurchaseOrder: (purchaseOrderId: string) => Promise<void>;
    onReceivePurchaseOrderItems: (purchaseOrderId: string) => Promise<void>;
}

const SupplierManagerView: React.FC<SupplierManagerViewProps> = ({ db, onSaveSupplier, onDeleteSupplier, onSavePurchaseOrder, onDeletePurchaseOrder, onReceivePurchaseOrderItems }) => {
    const [activeTab, setActiveTab] = useState<'suppliers' | 'purchaseOrders'>('suppliers');
    const [isSaving, setIsSaving] = useState(false);
    
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Omit<Supplier, 'id'> | Supplier | null>(null);
    
    const [isPOModalOpen, setIsPOModalOpen] = useState(false);
    const [editingPO, setEditingPO] = useState<Omit<PurchaseOrder, 'id'> | PurchaseOrder | null>(null);

    const handleOpenModal = (type: 'supplier' | 'purchaseOrder', data: any | null) => {
        if (type === 'supplier') {
            setEditingSupplier(data || { name: '', category: SupplierCategory.OTHER, rating: 3 });
            setIsSupplierModalOpen(true);
        } else {
            const defaultPO: Omit<PurchaseOrder, 'id'> = {
                supplierId: db.suppliers[0]?.id || '',
                items: [{ productId: '', name: '', quantity: 1, unitPrice: 0 }],
                totalCost: 0,
                status: PurchaseOrderStatus.PENDING,
                orderedAt: new Date().toISOString()
            };
            setEditingPO(data || defaultPO);
            setIsPOModalOpen(true);
        }
    };
    
    const handleSave = async (type: 'supplier' | 'purchaseOrder') => {
        setIsSaving(true);
        if (type === 'supplier' && editingSupplier) await onSaveSupplier(editingSupplier);
        if (type === 'purchaseOrder' && editingPO) {
             await onSavePurchaseOrder(editingPO);
        }
        setIsSaving(false);
        setIsSupplierModalOpen(false);
        setIsPOModalOpen(false);
    };
    
    const totalSuppliers = db.suppliers.length;
    const pendingPOs = db.purchaseOrders.filter(po => po.status === 'Pendente' || po.status === 'Enviada').length;
    const month = new Date().getMonth();
    const totalSpentThisMonth = db.purchaseOrders
        .filter(po => new Date(po.orderedAt).getMonth() === month && po.status === 'Recebida')
        .reduce((sum, po) => sum + po.totalCost, 0);

    const SuppliersTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {db.suppliers.map(s => (
                <div key={s.id} className="bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold">{s.name}</h4>
                            <p className="text-sm text-gray-500">{s.category}</p>
                            <div className="flex items-center mt-1">{Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} size={14} className={i < s.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} />)}</div>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => handleOpenModal('supplier', s)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit size={16}/></button>
                            <button onClick={() => onDeleteSupplier(s.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button>
                        </div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2 pt-2 border-t">
                        {s.contactName && <p>Contato: {s.contactName}</p>}
                        {s.phone && <p>Tel: {s.phone}</p>}
                        {s.email && <p>Email: {s.email}</p>}
                    </div>
                </div>
            ))}
        </div>
    );

    const PurchaseOrdersTab = () => (
         <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID / Fornecedor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Itens</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {db.purchaseOrders.map(po => {
                        const supplier = db.suppliers.find(s => s.id === po.supplierId);
                        const isReceivable = po.status === PurchaseOrderStatus.SENT || (po.status === PurchaseOrderStatus.PENDING && po.items.every(i => i.unitPrice));
                        return (
                            <tr key={po.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm"><p className="font-medium text-gray-900">{po.id}</p><p className="text-gray-500">{supplier?.name}</p></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.items.map(i => i.name).join(', ')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{po.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">{po.status}</span></td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    {isReceivable && <button onClick={() => onReceivePurchaseOrderItems(po.id)} className="text-green-600 hover:text-green-900">Receber</button>}
                                    <button onClick={() => handleOpenModal('purchaseOrder', po)} className="text-blue-600 hover:text-blue-900">Editar</button>
                                    <button onClick={() => onDeletePurchaseOrder(po.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    return (
        <Section title="Gestão de Fornecedores e Compras" icon={Package}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border text-center"><p className="text-sm text-gray-500">Fornecedores Cadastrados</p><p className="text-3xl font-bold">{totalSuppliers}</p></div>
                <div className="bg-white p-4 rounded-lg shadow-sm border text-center"><p className="text-sm text-gray-500">Ordens de Compra Pendentes</p><p className="text-3xl font-bold">{pendingPOs}</p></div>
                <div className="bg-white p-4 rounded-lg shadow-sm border text-center"><p className="text-sm text-gray-500">Gasto em Compras (Mês)</p><p className="text-3xl font-bold">{totalSpentThisMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
            </div>

            <div className="flex border-b mb-4">
                <button onClick={() => setActiveTab('suppliers')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'suppliers' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}>Fornecedores</button>
                <button onClick={() => setActiveTab('purchaseOrders')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'purchaseOrders' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}>Ordens de Compra</button>
            </div>
            
            <div className="mb-4 text-right">
                <button onClick={() => handleOpenModal(activeTab === 'suppliers' ? 'supplier' : 'purchaseOrder', null)} className="btn-primary flex items-center gap-2">
                    <PlusCircle size={18}/> {activeTab === 'suppliers' ? 'Novo Fornecedor' : 'Nova Ordem de Compra'}
                </button>
            </div>

            {activeTab === 'suppliers' ? <SuppliersTab /> : <PurchaseOrdersTab />}
            
            <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title={editingSupplier && 'id' in editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}>
                {editingSupplier && (
                    <form onSubmit={(e) => { e.preventDefault(); handleSave('supplier'); }} className="space-y-4">
                        <input name="name" value={editingSupplier.name} onChange={e => setEditingSupplier({...editingSupplier, name: e.target.value})} className="input-base" placeholder="Nome do Fornecedor"/>
                        <select name="category" value={editingSupplier.category} onChange={e => setEditingSupplier({...editingSupplier, category: e.target.value as SupplierCategory})} className="input-base">
                            {Object.values(SupplierCategory).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div><label>Avaliação</label><input type="range" name="rating" min="1" max="5" value={editingSupplier.rating} onChange={e => setEditingSupplier({...editingSupplier, rating: Number(e.target.value) as any})} className="w-full"/></div>
                        <input name="contactName" value={editingSupplier.contactName || ''} onChange={e => setEditingSupplier({...editingSupplier, contactName: e.target.value})} className="input-base" placeholder="Nome do Contato"/>
                        <input name="phone" value={editingSupplier.phone || ''} onChange={e => setEditingSupplier({...editingSupplier, phone: e.target.value})} className="input-base" placeholder="Telefone"/>
                        <input type="email" name="email" value={editingSupplier.email || ''} onChange={e => setEditingSupplier({...editingSupplier, email: e.target.value})} className="input-base" placeholder="Email"/>
                        <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsSupplierModalOpen(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">{isSaving ? <Loader2 className="animate-spin"/> : 'Salvar'}</button></div>
                    </form>
                )}
            </Modal>

             <Modal isOpen={isPOModalOpen} onClose={() => setIsPOModalOpen(false)} title={editingPO && 'id' in editingPO ? 'Editar Ordem de Compra' : 'Nova Ordem de Compra'}>
                {editingPO && (
                    <form onSubmit={(e) => { e.preventDefault(); handleSave('purchaseOrder'); }} className="space-y-4">
                        <div>
                            <label>Fornecedor</label>
                            <select value={editingPO.supplierId} onChange={e => setEditingPO({...editingPO, supplierId: e.target.value})} className="input-base">
                                {db.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Itens</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {editingPO.items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-5 gap-2 items-center">
                                        <select
                                            value={item.productId}
                                            onChange={e => {
                                                const product = db.products.find(p => p.id === e.target.value);
                                                const newItems = [...editingPO.items];
                                                newItems[index] = { ...newItems[index], productId: product?.id || '', name: product?.name || '', unitPrice: product?.costPrice || 0 };
                                                const newTotalCost = newItems.reduce((sum, i) => sum + (i.unitPrice || 0) * i.quantity, 0);
                                                setEditingPO({...editingPO, items: newItems, totalCost: newTotalCost});
                                            }}
                                            className="input-base col-span-2"
                                        >
                                            <option value="">Selecione um produto</option>
                                            {db.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <input type="number" min="1" value={item.quantity} onChange={e => { 
                                            const newItems = [...editingPO.items]; 
                                            newItems[index].quantity = Number(e.target.value); 
                                            const newTotalCost = newItems.reduce((sum, i) => sum + (i.unitPrice || 0) * i.quantity, 0);
                                            setEditingPO({...editingPO, items: newItems, totalCost: newTotalCost});
                                        }} placeholder="Qtd" className="input-base" />
                                        <input type="number" step="0.01" value={item.unitPrice || ''} onChange={e => { 
                                            const newItems = [...editingPO.items]; 
                                            newItems[index].unitPrice = Number(e.target.value); 
                                            const newTotalCost = newItems.reduce((sum, i) => sum + (i.unitPrice || 0) * i.quantity, 0);
                                            setEditingPO({...editingPO, items: newItems, totalCost: newTotalCost});
                                        }} placeholder="Custo Unit." className="input-base" />
                                        <button type="button" onClick={() => {
                                            const newItems = editingPO.items.filter((_, i) => i !== index);
                                            const newTotalCost = newItems.reduce((sum, i) => sum + (i.unitPrice || 0) * i.quantity, 0);
                                            setEditingPO({...editingPO, items: newItems, totalCost: newTotalCost})
                                        }} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => setEditingPO({...editingPO, items: [...editingPO.items, {productId: '', name: '', quantity: 1, unitPrice: 0}]})} className="text-sm btn-secondary mt-2">Adicionar Item</button>
                        </div>
                        <div className="pt-4 border-t text-right">
                            <span className="text-lg font-bold">Custo Total: {editingPO.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setIsPOModalOpen(false)} className="btn-secondary">Cancelar</button>
                            <button type="submit" className="btn-primary">{isSaving ? <Loader2 className="animate-spin"/> : 'Salvar'}</button>
                        </div>
                    </form>
                )}
             </Modal>
        </Section>
    );
};

export default SupplierManagerView;