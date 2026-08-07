import React, { useState, useMemo } from 'react';
import { DBState, ShoppingList, ShoppingListItem } from '../../types';
import { Section } from './shared';
import Modal from './Modal';
import { ShoppingCart, PlusCircle, Loader2, Save, Package, Check, Trash2, Sparkles, Wand2, ArrowRight, Info, Edit } from 'lucide-react';
import { generateShoppingList } from '../../services/apiService';

interface ShoppingListViewProps {
    db: DBState;
    onAddItem: (itemData: Omit<ShoppingListItem, 'id' | 'status'>) => Promise<void>;
    onAddShoppingListItems: (items: Omit<ShoppingListItem, 'id' | 'status'>[]) => Promise<void>;
    onUpdateItemStatus: (listId: string, itemId: string, status: 'Pendente' | 'Comprado', unitCost?: number) => Promise<void>;
    onReceiveStock: (listId: string, items: { productId: string; quantity: number; itemId: string; }[]) => Promise<void>;
    onCompleteShoppingList: (listId: string) => Promise<void>;
}

type SuggestedItem = {
    name: string;
    category: string;
    suggestedQuantity: string;
    justification: string;
    checked: boolean;
};

// --- Sub-components extracted to prevent re-rendering issues ---

const GenerationView: React.FC<{
    onGenerateList: () => void;
    onCreateManualList: () => void;
    isGenerating: boolean;
    isSaving: boolean;
}> = ({ onGenerateList, onCreateManualList, isGenerating, isSaving }) => (
    <div className="text-center py-20 bg-gray-50 rounded-lg border flex flex-col items-center justify-center h-full">
        <Wand2 size={48} className="text-gray-300 mb-4"/>
        <h3 className="text-xl font-bold text-gray-800">Sua lista de compras está vazia</h3>
        <p className="text-gray-500 max-w-md mx-auto mt-2 mb-6">Use o poder da IA para analisar seu estoque, eventos futuros e projetos para criar uma lista de compras inteligente em segundos.</p>
        <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={onGenerateList} disabled={isGenerating} className="bg-brand-dark text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 flex items-center justify-center gap-2 text-lg">
                {isGenerating ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Gerar Lista com IA</>}
            </button>
            <button onClick={onCreateManualList} disabled={isSaving} className="bg-white text-brand-dark border border-gray-300 font-bold py-3 px-6 rounded-lg hover:bg-gray-100 disabled:bg-gray-300 flex items-center justify-center gap-2 text-lg">
                {isSaving ? <Loader2 className="animate-spin" /> : <><Edit size={18} /> Criar Lista Manual</>}
            </button>
        </div>
    </div>
);

const SuggestionsReviewView: React.FC<{
    suggestedList: { items: SuggestedItem[] };
    onToggleSuggestion: (index: number) => void;
    onSuggestionNameChange: (index: number, newName: string) => void;
    onCreateListFromSuggestions: () => void;
    isSaving: boolean;
}> = ({ suggestedList, onToggleSuggestion, onSuggestionNameChange, onCreateListFromSuggestions, isSaving }) => {
    if (!suggestedList) return null;
    return (
        <div className="space-y-6 bg-white p-6 rounded-lg border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Revise as Sugestões da IA</h3>
                    <p className="text-sm text-gray-500">Desmarque os itens que não precisa ou edite os nomes.</p>
                </div>
                <button onClick={onCreateListFromSuggestions} disabled={isSaving || suggestedList.items.filter(i => i.checked).length === 0} className="btn-primary flex items-center gap-2 w-full sm:w-auto">
                    {isSaving ? <Loader2 className="animate-spin"/> : `Criar Lista com ${suggestedList.items.filter(i => i.checked).length} Itens`}
                </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {suggestedList.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md border">
                        <input type="checkbox" checked={item.checked} onChange={() => onToggleSuggestion(index)} className="h-5 w-5 rounded flex-shrink-0"/>
                        <input type="text" value={item.name} onChange={(e) => onSuggestionNameChange(index, e.target.value)} className="flex-grow text-sm border-0 p-1 bg-transparent focus:bg-white focus:ring-1 focus:ring-brand-green rounded"/>
                        <div className="relative group"><Info size={16} className="text-gray-400"/><div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 z-10">{item.justification}</div></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ListView: React.FC<{
    activeList: ShoppingList;
    db: DBState;
    newItemName: string;
    onNewItemNameChange: (value: string) => void;
    onManualItemAdd: (e: React.FormEvent) => Promise<void>;
    onStatusChange: (listId: string, item: ShoppingListItem) => void;
    onCompleteShoppingList: (listId: string) => void;
    onOpenStockModal: () => void;
}> = ({ activeList, db, newItemName, onNewItemNameChange, onManualItemAdd, onStatusChange, onCompleteShoppingList, onOpenStockModal }) => {
    const itemsByCategory = activeList.items.reduce((acc, item) => {
        const category = item.category || 'Outros';
        (acc[category] = acc[category] || []).push(item);
        return acc;
    }, {} as Record<string, ShoppingListItem[]>);

    return (
        <div className="bg-white p-6 rounded-lg border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="text-2xl font-bold text-brand-dark">{activeList.name}</h3>
                <div className="flex gap-2">
                    <button onClick={onOpenStockModal} className="btn-secondary flex items-center gap-2"><Package size={16}/> Receber Itens</button>
                    <button onClick={() => { if(confirm("Finalizar e arquivar esta lista?")) onCompleteShoppingList(activeList.id); }} className="btn-primary flex items-center gap-2"><Check size={16}/> Finalizar Lista</button>
                </div>
            </div>
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
                {Object.entries(itemsByCategory).map(([category, items]) => (
                    <div key={category}>
                        <h4 className="font-semibold mb-2">{category}</h4>
                        <div className="space-y-2">
                            {(items as any[]).map(item => (
                                <div key={item.id} className={`p-3 rounded-lg flex items-center gap-4 transition-colors ${item.status === 'Comprado' ? 'bg-green-50' : 'bg-gray-50'}`}>
                                    <input
                                        type="checkbox"
                                        checked={item.status === 'Comprado'}
                                        onChange={() => onStatusChange(activeList.id, item)}
                                        className="h-5 w-5 rounded text-brand-green focus:ring-brand-green border-gray-300 flex-shrink-0"
                                    />
                                    <div className={`flex-grow ${item.status === 'Comprado' ? 'line-through text-gray-500' : ''}`}>
                                        <p className="font-semibold">{item.name}</p>
                                        {item.justification && <p className="text-xs text-gray-500 italic">Motivo: {item.justification}</p>}
                                        {item.projectId && <span className="text-xs text-blue-600 font-semibold">{db.projects.find(p => p.id === item.projectId)?.name}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={onManualItemAdd} className="mt-4 pt-4 border-t flex gap-2">
                <input value={newItemName} onChange={e => onNewItemNameChange(e.target.value)} placeholder="Adicionar item manualmente..." className="input-base flex-grow"/>
                <button type="submit" className="btn-primary flex-shrink-0">Adicionar</button>
            </form>
        </div>
    );
};

const ReceiveStockModal: React.FC<{
    list: ShoppingList;
    isOpen: boolean;
    onClose: () => void;
    onReceive: (listId: string, items: { productId: string; quantity: number; itemId: string; }[]) => Promise<void>;
}> = ({ list, isOpen, onClose, onReceive }) => {
    const itemsToReceive = list.items.filter(i => i.status === 'Comprado' && i.productId);
    const parseQuantity = (name: string): number => {
        const match = name.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 1;
    };
    const [quantities, setQuantities] = useState<Record<string, string>>(() => 
        itemsToReceive.reduce((acc, item) => {
            acc[item.id] = String(parseQuantity(item.name));
            return acc;
        }, {} as Record<string, string>)
    );
    
    const handleReceive = async () => {
        const payload = itemsToReceive
            .map(item => ({
                productId: item.productId!,
                quantity: parseInt(quantities[item.id] || '0'),
                itemId: item.id
            }))
            .filter(item => item.quantity > 0);

        if (payload.length > 0) {
            await onReceive(list.id, payload);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Receber Estoque dos Itens Comprados">
            <div className="space-y-4">
                {itemsToReceive.length > 0 ? itemsToReceive.map(item => (
                    <div key={item.id} className="grid grid-cols-3 gap-4 items-center">
                        <label className="font-semibold text-sm col-span-2">{item.name}</label>
                        <input
                            type="number"
                            placeholder="Qtd."
                            value={quantities[item.id] || ''}
                            onChange={e => setQuantities({ ...quantities, [item.id]: e.target.value })}
                            className="input-base text-sm"
                        />
                    </div>
                )) : <p className="text-gray-500 text-center">Nenhum item comprado está vinculado a um produto do inventário.</p>}
                <div className="flex justify-end gap-2 pt-4">
                    <button onClick={onClose} className="btn-secondary">Cancelar</button>
                    <button onClick={handleReceive} className="btn-primary">Confirmar e Atualizar Estoque</button>
                </div>
            </div>
        </Modal>
    );
};

const ShoppingListView: React.FC<ShoppingListViewProps> = ({ db, onAddItem, onAddShoppingListItems, onUpdateItemStatus, onReceiveStock, onCompleteShoppingList }) => {
    const activeList: ShoppingList | undefined = useMemo(() => 
        db.shoppingLists.find(l => l.status === 'Pendente'),
    [db.shoppingLists]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestedList, setSuggestedList] = useState<{ estimatedTotalCost: number; items: SuggestedItem[] } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    
    // State for cost input modal
    const [costModalState, setCostModalState] = useState<{ isOpen: boolean; listId: string; itemId: string; itemName: string }>({ isOpen: false, listId: '', itemId: '', itemName: '' });
    const [unitCost, setUnitCost] = useState<number | string>('');

    const handleGenerateList = async () => {
        setIsGenerating(true);
        const result = await generateShoppingList();
        if (result && result.items) {
            setSuggestedList({
                ...result,
                items: result.items.map(item => ({ ...item, checked: true }))
            });
        }
        setIsGenerating(false);
    };
    
    const handleCreateManualList = async () => {
        setIsSaving(true);
        // Creates an empty list
        await onAddShoppingListItems([]);
        setIsSaving(false);
    };

    const handleToggleSuggestion = (index: number) => {
        if (!suggestedList) return;
        const newItems = [...suggestedList.items];
        newItems[index].checked = !newItems[index].checked;
        setSuggestedList({ ...suggestedList, items: newItems });
    };

    const handleSuggestionNameChange = (index: number, newName: string) => {
        if (!suggestedList) return;
        const newItems = [...suggestedList.items];
        newItems[index].name = newName;
        setSuggestedList({ ...suggestedList, items: newItems });
    };
    
    const handleCreateListFromSuggestions = async () => {
        if (!suggestedList) return;
        const itemsToAdd = suggestedList.items
            .filter(item => item.checked)
            .map(item => {
                const productMatch = db.products.find(p => item.name.toLowerCase().includes(p.name.toLowerCase()));
                return { 
                    name: item.name, 
                    category: item.category, 
                    productId: productMatch?.id, 
                    suggestedQuantity: item.suggestedQuantity,
                    justification: item.justification 
                };
            });

        if (itemsToAdd.length === 0) {
            alert("Selecione pelo menos um item.");
            return;
        }

        setIsSaving(true);
        await onAddShoppingListItems(itemsToAdd);
        setIsSaving(false);
        setSuggestedList(null);
    };

    const handleManualItemAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim() || !activeList) return;
        const productMatch = db.products.find(p => p.name.toLowerCase() === newItemName.trim().toLowerCase());
        await onAddItem({
            name: newItemName.trim(),
            category: productMatch?.category || 'Outros',
            productId: productMatch?.id,
        });
        setNewItemName('');
    };
    
    const handleStatusChange = (listId: string, item: ShoppingListItem) => {
        const newStatus = item.status === 'Pendente' ? 'Comprado' : 'Pendente';
        if (newStatus === 'Comprado') {
            setUnitCost(item.unitCost || '');
            setCostModalState({ isOpen: true, listId, itemId: item.id, itemName: item.name });
        } else {
            onUpdateItemStatus(listId, item.id, newStatus);
        }
    };

    const handleCostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { listId, itemId } = costModalState;
        await onUpdateItemStatus(listId, itemId, 'Comprado', Number(unitCost));
        setCostModalState({ isOpen: false, listId: '', itemId: '', itemName: '' });
    };
    
    return (
        <Section title="Assistente de Compras Inteligente" icon={ShoppingCart}>
            {activeList ? (
                <ListView
                    activeList={activeList}
                    db={db}
                    newItemName={newItemName}
                    onNewItemNameChange={setNewItemName}
                    onManualItemAdd={handleManualItemAdd}
                    onStatusChange={handleStatusChange}
                    onCompleteShoppingList={onCompleteShoppingList}
                    onOpenStockModal={() => setIsStockModalOpen(true)}
                />
            ) : suggestedList ? (
                <SuggestionsReviewView
                    suggestedList={suggestedList}
                    onToggleSuggestion={handleToggleSuggestion}
                    onSuggestionNameChange={handleSuggestionNameChange}
                    onCreateListFromSuggestions={handleCreateListFromSuggestions}
                    isSaving={isSaving}
                />
            ) : (
                <GenerationView
                    onGenerateList={handleGenerateList}
                    onCreateManualList={handleCreateManualList}
                    isGenerating={isGenerating}
                    isSaving={isSaving}
                />
            )}
            {activeList && (
                <ReceiveStockModal 
                    list={activeList}
                    isOpen={isStockModalOpen}
                    onClose={() => setIsStockModalOpen(false)}
                    onReceive={onReceiveStock}
                />
            )}
            <Modal isOpen={costModalState.isOpen} onClose={() => setCostModalState({ ...costModalState, isOpen: false })} title="Informar Custo do Item">
                <form onSubmit={handleCostSubmit} className="space-y-4">
                    <p>Qual foi o custo unitário pago por <strong>{costModalState.itemName}</strong>?</p>
                    <div className="text-xs text-gray-500">Isso ajudará a IA a sugerir o preço de venda ideal no seu inventário.</div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Custo por Unidade (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={unitCost}
                            onChange={e => setUnitCost(e.target.value)}
                            className="input-base"
                            required
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setCostModalState({ ...costModalState, isOpen: false })} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Salvar Custo</button>
                    </div>
                </form>
            </Modal>
        </Section>
    );
};

export default ShoppingListView;