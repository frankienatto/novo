import React, { useState, useMemo } from 'react';
import { Product, PropertyUnitId } from '../../types';
import { Section } from './shared';
import Modal from './Modal';
import { Warehouse, AlertTriangle, CheckCircle, Edit, Loader2, Sparkles, Wand2, ArrowRight, Info, Search, PlusCircle, MinusCircle } from 'lucide-react';
import { getAISuggestedPrice, eventBus } from '../../services/apiService';

interface InventoryViewProps {
    db: { products: Product[] };
    selectedUnit?: PropertyUnitId | 'all';
    onProductUpdate: (product: Product) => Promise<void>;
    onProductModalOpen: (type: 'addProduct' | 'editProduct', data?: Product) => void;
    onAdjustStock: (productId: string, newStock: number) => Promise<void>;
}

const InventoryView: React.FC<InventoryViewProps> = ({ db, selectedUnit = 'all', onProductUpdate, onProductModalOpen, onAdjustStock }) => {
    // State for AI Pricing
    const [suggestions, setSuggestions] = useState<Record<string, { price: number; justification: string } | null>>({});
    const [loadingSuggestionId, setLoadingSuggestionId] = useState<string | null>(null);
    const [applyingPriceId, setApplyingPriceId] = useState<string | null>(null);
    const [adjustingStockId, setAdjustingStockId] = useState<string | null>(null);

    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todas');
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [filterProperty, setFilterProperty] = useState<PropertyUnitId | 'all'>(selectedUnit);

    // Sync filterProperty when global selectedUnit changes
    React.useEffect(() => {
        setFilterProperty(selectedUnit);
    }, [selectedUnit]);

    const categories = useMemo(() => ['Todas', ...Array.from(new Set(db.products.map(p => p.category)))], [db.products]);

    const filteredProducts = useMemo(() => {
        return db.products.filter(product => {
            const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            const categoryMatch = filterCategory === 'Todas' || product.category === filterCategory;
            const statusMatch = filterStatus === 'Todos' ||
                (filterStatus === 'Estoque Baixo' && product.stock <= product.lowStockThreshold) ||
                (filterStatus === 'OK' && product.stock > product.lowStockThreshold);
            const propertyMatch = filterProperty === 'all' || !product.propertyId || product.propertyId === 'all' || product.propertyId === filterProperty;
            return searchMatch && categoryMatch && statusMatch && propertyMatch;
        });
    }, [db.products, searchTerm, filterCategory, filterStatus, filterProperty]);
    
    const handleGetSuggestion = async (product: Product) => {
        setLoadingSuggestionId(product.id);
        const result = await getAISuggestedPrice(product);
        setSuggestions(prev => ({ ...prev, [product.id]: result ? { price: result.suggestedPrice, justification: result.justification } : null }));
        setLoadingSuggestionId(null);
    };
    
    const handleApplySuggestion = async (product: Product, suggestedPrice: number) => {
        setApplyingPriceId(product.id);
        await onProductUpdate({ ...product, price: suggestedPrice });
        setSuggestions(prev => {
            const newSuggestions = { ...prev };
            delete newSuggestions[product.id];
            return newSuggestions;
        });
        eventBus.emit('new-toast', {
            type: 'success',
            title: 'Preço Atualizado!',
            message: `O preço de "${product.name}" foi atualizado para ${suggestedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`
        });
        setApplyingPriceId(null);
    };

    const handleAdjustStock = async (product: Product, amount: number) => {
        setAdjustingStockId(product.id);
        const newStock = Math.max(0, product.stock + amount);
        await onAdjustStock(product.id, newStock);
        setAdjustingStockId(null);
        eventBus.emit('new-toast', {
            type: 'info',
            title: 'Estoque Ajustado',
            message: `Estoque de "${product.name}" para ${newStock} unidades.`
        });
    };

    const StockStatusBadge: React.FC<{ product: Product }> = ({ product }) => {
        const isLow = product.stock <= product.lowStockThreshold;
        if (isLow) {
            return (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full">
                    <AlertTriangle size={14} />
                    Estoque Baixo
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-800 bg-green-100 px-2 py-1 rounded-full">
                <CheckCircle size={14} />
                OK
            </span>
        );
    };

    return (
        <Section title="Controle de Estoque" icon={Warehouse}>
            <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-base pl-10"
                    />
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-4">
                    <select value={filterProperty} onChange={(e) => setFilterProperty(e.target.value as PropertyUnitId | 'all')} className="input-base font-medium">
                        <option value="all">🏢 Todas as Unidades</option>
                        <option value="beach">🏖️ Praia (Forest House)</option>
                        <option value="sanctuary">🌿 Santuário</option>
                    </select>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-base">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-base">
                        <option>Todos</option>
                        <option>Estoque Baixo</option>
                        <option>OK</option>
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo / Venda</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Precificação IA</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProducts.map((product) => (
                           <React.Fragment key={product.id}>
                                <tr className={product.stock <= product.lowStockThreshold ? "bg-yellow-50" : ""}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {product.costPrice ? `${product.costPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} /` : 'N/A /'} {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-800">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => handleAdjustStock(product, -1)} 
                                                disabled={adjustingStockId === product.id}
                                                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                            >
                                                <MinusCircle size={18} />
                                            </button>
                                            <span className="w-8">{product.stock}</span>
                                            <button 
                                                onClick={() => handleAdjustStock(product, 1)} 
                                                disabled={adjustingStockId === product.id}
                                                className="text-green-500 hover:text-green-700 disabled:opacity-50"
                                            >
                                                <PlusCircle size={18} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                        <StockStatusBadge product={product} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                         {product.costPrice && product.costPrice > 0 && (
                                            <button 
                                                onClick={() => handleGetSuggestion(product)} 
                                                disabled={loadingSuggestionId === product.id}
                                                className="p-2 text-purple-600 hover:bg-purple-100 rounded-full disabled:opacity-50"
                                                title="Sugerir preço de venda"
                                            >
                                                {loadingSuggestionId === product.id ? <Loader2 className="animate-spin" size={16}/> : <Wand2 size={16} />}
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => onProductModalOpen('editProduct', product)} className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                                            <Edit size={14}/> Editar
                                        </button>
                                    </td>
                                </tr>
                                 {suggestions[product.id] && (
                                    <tr className="bg-blue-50">
                                        <td colSpan={6} className="px-6 py-3">
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm">
                                                    <p><strong>Sugestão IA:</strong> <span className="text-xl font-bold text-blue-800">{suggestions[product.id]!.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                                                    <p className="text-xs italic text-gray-600 mt-1">"{suggestions[product.id]!.justification}"</p>
                                                </div>
                                                <button onClick={() => handleApplySuggestion(product, suggestions[product.id]!.price)} disabled={applyingPriceId === product.id} className="bg-blue-600 text-white font-semibold py-1 px-3 rounded-md text-sm flex items-center gap-1.5">
                                                    {applyingPriceId === product.id ? <Loader2 className="animate-spin" /> : <ArrowRight size={14} />} Aplicar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                           </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </Section>
    );
};

export default InventoryView;
