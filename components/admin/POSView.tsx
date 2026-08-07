import React, { useState, useMemo, useEffect } from 'react';
import { Section } from './shared';
import { DBState, Product, SaleItem, Transaction, PaymentDetails, PaymentMethod, DrinkPairingSuggestion, DigitalMenuCategory, PropertyUnitId } from '../../types';
import { eventBus } from '../../services/apiService';
import { Loader2, PlusCircle, Search, Settings, ShoppingCart, Trash2, Minus, User, Home as HomeIcon, Wallet, CreditCard, QrCode as QrCodeIcon, X, Sparkles, Utensils, Menu as MenuIcon, Printer, Building2, Waves, Trees } from 'lucide-react';
import Receipt from './Receipt';

const ProductManagementView: React.FC<{
    products: Product[];
    onAdd: () => void;
    onEdit: (product: Product) => void;
    onDelete: (productId: string) => void;
}> = ({ products, onAdd, onEdit, onDelete }) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={onAdd} className="bg-brand-green text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-brand-green-dark flex items-center gap-2">
                    <PlusCircle size={18} /> Adicionar Produto
                </button>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <button onClick={() => onEdit(product)} className="text-blue-600 hover:text-blue-900">Editar</button>
                                <button onClick={() => { if(confirm(`Tem certeza que deseja excluir "${product.name}"?`)) onDelete(product.id) }} className="text-red-600 hover:text-red-900">Excluir</button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DigitalMenuView: React.FC<{
    menu: DigitalMenuCategory[] | null;
    onGenerate: () => void;
    isGenerating: boolean;
}> = ({ menu, onGenerate, isGenerating }) => {
    
    const menuUrl = `${window.location.origin}${window.location.pathname}?page=digitalMenu`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(menuUrl)}`;

    if (isGenerating) {
        return (
            <div className="text-center p-20">
                <Loader2 className="animate-spin text-brand-green mx-auto" size={48} />
                <p className="mt-4 text-gray-600 font-semibold">A IA está criando um cardápio incrível para você...</p>
                <p className="text-sm text-gray-500">Isso pode levar alguns segundos.</p>
            </div>
        );
    }

    if (!menu) {
        return (
            <div className="text-center p-20 bg-gray-50 rounded-lg">
                <MenuIcon size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800">Seu cardápio digital ainda não foi criado.</h3>
                <p className="text-gray-500 mt-2 mb-6">Use o poder da IA para analisar seus produtos e gerar um cardápio com descrições criativas e atrativas.</p>
                <button onClick={onGenerate} className="btn-primary flex items-center gap-2 mx-auto text-lg px-6 py-3">
                    <Sparkles size={20} /> Gerar Cardápio com IA
                </button>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                {menu.map(category => (
                    <div key={category.categoryName}>
                        <h3 className="text-2xl font-bold text-brand-dark mb-3 flex items-center gap-2">
                            <Utensils className="text-brand-green" />
                            {category.categoryName}
                        </h3>
                        <div className="space-y-4">
                            {category.items.map(item => (
                                <div key={item.productId} className="bg-white p-4 rounded-lg shadow-sm border">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-lg">{item.name}</h4>
                                        <p className="font-extrabold text-lg text-brand-green">{item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                    </div>
                                    <p className="text-sm text-gray-600 italic mt-1">"{item.description}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
             <div className="lg:col-span-1 space-y-6">
                 <div className="bg-white p-6 rounded-lg shadow-sm border text-center sticky top-0">
                     <h3 className="text-xl font-bold text-brand-dark mb-4 flex items-center gap-2 justify-center"><QrCodeIcon /> QR Code para seu Cardápio</h3>
                     <img src={qrCodeUrl} alt="QR Code para o cardápio digital" className="mx-auto rounded-lg border p-2"/>
                     <p className="text-xs text-gray-500 mt-4">Imprima este QR Code e coloque nas mesas para que seus hóspedes possam acessar o cardápio facilmente.</p>
                 </div>
                 <button onClick={onGenerate} className="w-full btn-secondary flex items-center gap-2 justify-center">
                    <Sparkles size={16} /> Gerar Novamente / Atualizar
                </button>
            </div>
        </div>
    );
};

interface POSViewProps {
    db: DBState;
    onSale: (transactionData: Omit<Transaction, 'id' | 'timestamp'>, paymentDetails?: PaymentDetails | { method: 'PIX' }) => Promise<void>;
    onProductModalOpen: (type: 'addProduct' | 'editProduct', data?: Product) => void;
    onProductDelete: (productId: string) => Promise<void>;
    onGetDrinkPairingSuggestion: (cartItems: SaleItem[]) => Promise<DrinkPairingSuggestion | null>;
    onGenerateAndSaveDigitalMenu: () => Promise<void>;
    onGetPOSSuggestions?: (cartItems: SaleItem[]) => Promise<DrinkPairingSuggestion | null>;
    onUpdateTableItems: (tableId: string | null, items: SaleItem[]) => Promise<void>;
    onAddTable: (tableData: { number: number; capacity: number; name?: string; propertyId?: PropertyUnitId }) => Promise<void>;
    onDeleteTable: (tableId: string) => Promise<void>;
}

import { ResetCategoryButton } from './ResetCategoryButton';

export const POSView: React.FC<POSViewProps> = (props) => {
    const { db, onSale, onProductModalOpen, onProductDelete, onGetDrinkPairingSuggestion, onGenerateAndSaveDigitalMenu, onUpdateTableItems, onAddTable, onDeleteTable, onGetPOSSuggestions } = props;
    const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<PropertyUnitId | 'all'>('all');
    const [viewMode, setViewMode] = useState<'sale' | 'products' | 'digitalMenu' | 'tables'>('tables');
    const [activeTableId, setActiveTableId] = useState<string | null>(null);
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [guestSearchTerm, setGuestSearchTerm] = useState('');
    
    const [saleDestination, setSaleDestination] = useState<'walk-in' | 'room-bill' | 'guest-account'>('walk-in');
    const [selectedEntityId, setSelectedEntityId] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cartão de Crédito');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [cardDetails, setCardDetails] = useState({ number: '', holderName: '', expiry: '', cvc: '' });
    
    const [suggestion, setSuggestion] = useState<DrinkPairingSuggestion | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isGeneratingMenu, setIsGeneratingMenu] = useState(false);
    const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
    const [newTableNumber, setNewTableNumber] = useState('');
    const [newTableName, setNewTableName] = useState('');
    const [newTableCapacity, setNewTableCapacity] = useState('2');
    const [newTableUnit, setNewTableUnit] = useState<PropertyUnitId>('beach');
    const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

    useEffect(() => {
        if (activeTableId) {
            const table = db.tables.find(t => t.id === activeTableId);
            if (table) {
                setCart(table.currentItems || []);
            }
        } else {
            setCart([]);
        }
    }, [activeTableId, db.tables]);

    // Sync cart back to table when it changes
    useEffect(() => {
        if (activeTableId) {
            onUpdateTableItems(activeTableId, cart);
        }
    }, [cart, activeTableId]);

    useEffect(() => {
        const getSuggestion = async () => {
            const foodItems = cart.filter(item => {
                const product = db.products.find(p => p.id === item.productId);
                return product && product.category === 'Comida & Bebida' && !['Refrigerante', 'Cerveja Artesanal'].includes(product.name);
            });

            if (foodItems.length > 0) {
                setIsSuggesting(true);
                const result = await onGetDrinkPairingSuggestion(foodItems);
                setSuggestion(result);
                setIsSuggesting(false);
            } else {
                setSuggestion(null);
            }
        };

        if (cart.length > 0) {
            const debounce = setTimeout(getSuggestion, 1000);
            return () => clearTimeout(debounce);
        } else {
            setSuggestion(null);
        }
    }, [cart, db.products, onGetDrinkPairingSuggestion]);


    const activeBookings = useMemo(() => db.bookings.filter(b => b.status === 'Checked-in'), [db.bookings]);

    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { productId: product.id, name: product.name, quantity: 1, unitPrice: product.price }];
        });
    };

    const handleQuantityChange = (productId: string, delta: number) => {
      setCart(currentCart => {
        const itemInCart = currentCart.find(item => item.productId === productId);
        if (!itemInCart) return currentCart;

        const newQuantity = itemInCart.quantity + delta;
        if (newQuantity <= 0) {
          return currentCart.filter(item => item.productId !== productId);
        } else {
          return currentCart.map(item =>
            item.productId === productId ? { ...item, quantity: newQuantity } : item
          );
        }
      });
    };

    const clearCart = () => {
        if(confirm('Tem certeza que deseja limpar todos os itens do carrinho?')) {
            setCart([]);
        }
    };

    const total = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);

    const handleFinalizeSale = async () => {
        if (cart.length === 0) return;
        const finalPaymentMethod = saleDestination === 'room-bill' ? 'Conta do Quarto' : paymentMethod;
        
        if (['Cartão de Crédito', 'PIX'].includes(finalPaymentMethod)) {
            setIsPaymentModalOpen(true);
        } else {
            await processSale();
        }
    };
    
    const processSale = async (details?: PaymentDetails | { method: 'PIX' }) => {
        setIsProcessing(true);
        setIsPaymentModalOpen(false);

        let transactionData: Omit<Transaction, 'id' | 'timestamp'> | null = null;

        // Determine target property unit ID for this transaction
        let targetUnit: PropertyUnitId = 'beach';
        if (activeTableId) {
            const table = db.tables.find(t => t.id === activeTableId);
            if (table?.propertyId) targetUnit = table.propertyId;
            else if (selectedPropertyFilter === 'sanctuary') targetUnit = 'sanctuary';
        } else if (selectedEntityId) {
            const booking = db.bookings.find(b => b.id === selectedEntityId);
            if (booking?.propertyId) targetUnit = booking.propertyId;
            else if (selectedPropertyFilter === 'sanctuary') targetUnit = 'sanctuary';
        } else if (selectedPropertyFilter === 'sanctuary') {
            targetUnit = 'sanctuary';
        }

        const cartWithUnits: SaleItem[] = cart.map(item => ({
            ...item,
            propertyUnitId: item.propertyUnitId || item.propertyId || targetUnit,
            propertyId: item.propertyId || item.propertyUnitId || targetUnit
        }));

        try {
             switch(saleDestination) {
                case 'room-bill':
                    if (!selectedEntityId) throw new Error('Por favor, selecione a reserva do hóspede.');
                    const booking = db.bookings.find(b => b.id === selectedEntityId);
                    const guestForBooking = booking ? db.guests.find(g => g.id === booking.guestId) : null;
                    if (!booking || !guestForBooking) throw new Error('Reserva ou hóspede não encontrado.');
                    
                    transactionData = { 
                        items: cartWithUnits, 
                        total, 
                        paymentMethod: 'Conta do Quarto', 
                        bookingId: selectedEntityId, 
                        guestName: guestForBooking.fullName,
                        propertyUnitId: targetUnit,
                        propertyId: targetUnit
                    };
                    break;
                case 'guest-account':
                     if (!selectedEntityId) throw new Error('Por favor, associe a venda a um hóspede.');
                    const associatedGuest = db.guests.find(g => g.id === selectedEntityId);
                    if (!associatedGuest) throw new Error('Hóspede não encontrado.');
                    transactionData = { 
                        items: cartWithUnits, 
                        total, 
                        paymentMethod, 
                        guestName: associatedGuest.fullName,
                        propertyUnitId: targetUnit,
                        propertyId: targetUnit
                    };
                    break;
                case 'walk-in':
                default:
                     transactionData = { 
                        items: cartWithUnits, 
                        total, 
                        paymentMethod, 
                        guestName: activeTableId ? (db.tables.find(t => t.id === activeTableId)?.name || `Mesa ${db.tables.find(t => t.id === activeTableId)?.number}`) : 'Venda Avulsa',
                        tableId: activeTableId || undefined,
                        propertyUnitId: targetUnit,
                        propertyId: targetUnit
                    };
                    break;
            }

            await onSale(transactionData, details);
            
            // Get the last transaction to show the receipt
            // Actually, onSale doesn't return it, but we can find it in the state
            // Let's assume the last one in db.transactions is ours if we just added it.
            // A better way would be to have onSale return it, but for now we'll find it.
            const latestTransaction = db.transactions[db.transactions.length - 1];
            setLastTransaction(latestTransaction);

            eventBus.emit('new-notification', { type: 'success', title: 'Venda Realizada', message: `Venda de R$${total.toFixed(2)} finalizada.` });
            
            setCart([]);
            setSaleDestination('walk-in');
            setSelectedEntityId('');
            setGuestSearchTerm('');
            setProductSearchTerm('');

        } catch (error: any) {
            eventBus.emit('new-notification', { type: 'error', title: 'Erro na Venda', message: error.message });
        } finally {
            setIsProcessing(false);
        }
    }

    const filteredProducts = useMemo(() => {
        return db.products.filter(p => {
            const matchesSearch = !productSearchTerm || p.name.toLowerCase().includes(productSearchTerm.toLowerCase());
            const matchesUnit = selectedPropertyFilter === 'all' || !p.propertyId || p.propertyId === 'all' || p.propertyId === selectedPropertyFilter;
            return matchesSearch && matchesUnit;
        });
    }, [db.products, productSearchTerm, selectedPropertyFilter]);
    
    const productCategories = useMemo(() => filteredProducts.reduce((acc, product) => {
        (acc[product.category] = acc[product.category] || []).push(product);
        return acc;
    }, {} as Record<Product['category'], Product[]>), [filteredProducts]);
    
    const filteredEntities = useMemo(() => {
        if (saleDestination === 'room-bill') {
            return activeBookings.filter(b => {
                const guest = db.guests.find(g => g.id === b.guestId);
                const room = db.rooms.find(r => r.id === b.roomId);
                const guestNameMatch = guest ? guest.fullName.toLowerCase().includes(guestSearchTerm.toLowerCase()) : false;
                const roomNameMatch = room ? room.name.toLowerCase().includes(guestSearchTerm.toLowerCase()) : false;
                return guestNameMatch || roomNameMatch;
            });
        }
        if (saleDestination === 'guest-account') {
            return db.guests.filter(g => g.fullName.toLowerCase().includes(guestSearchTerm.toLowerCase()));
        }
        return [];
    }, [guestSearchTerm, saleDestination, activeBookings, db.guests, db.rooms]);

    const handleGenerateMenu = async () => {
        setIsGeneratingMenu(true);
        try {
            await onGenerateAndSaveDigitalMenu();
        } catch (error: any) {
            eventBus.emit('new-toast', { type: 'error', title: 'Erro ao Gerar Cardápio', message: error.message });
        } finally {
            setIsGeneratingMenu(false);
        }
    };

    const actions = (
        <div className="flex gap-2">
            <ResetCategoryButton category="products" label="Resetar Produtos" />
            <div className="flex flex-wrap bg-gray-200 p-1 rounded-lg gap-1 w-full sm:w-auto justify-center">
                <button onClick={() => setViewMode('tables')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'tables' ? 'bg-white text-brand-dark shadow' : 'bg-transparent text-gray-600'}`}>Mesas</button>
                <button onClick={() => { setViewMode('sale'); setActiveTableId(null); }} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'sale' && !activeTableId ? 'bg-white text-brand-dark shadow' : 'bg-transparent text-gray-600'}`}>Venda Direta</button>
                <button onClick={() => setViewMode('products')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors flex items-center gap-1 ${viewMode === 'products' ? 'bg-white text-brand-dark shadow' : 'bg-transparent text-gray-600'}`}><Settings size={14}/> Produtos</button>
                <button onClick={() => setViewMode('digitalMenu')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors flex items-center gap-1 ${viewMode === 'digitalMenu' ? 'bg-white text-brand-dark shadow' : 'bg-transparent text-gray-600'}`}><MenuIcon size={14}/> Cardápio</button>
            </div>
        </div>
    );

    const handleSetSaleDestination = (destination: 'walk-in' | 'room-bill' | 'guest-account') => {
        setSaleDestination(destination);
        setSelectedEntityId('');
        setGuestSearchTerm('');
    };

    return (
        <Section title="Ponto de Venda (PDV Multi-Unidades)" icon={ShoppingCart} actions={actions}>
            {/* Unit Switcher Bar for POS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-emerald-900/95 text-white p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-800 rounded-xl">
                        <Utensils size={20} className="text-emerald-300" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Unidade Operacional Ativa</span>
                        <h3 className="font-bold text-sm text-white">
                            {selectedPropertyFilter === 'beach' ? 'Cafeteria Forest House Beach 🏖️' : selectedPropertyFilter === 'sanctuary' ? 'Cafeteria Forest House Santuário 🌿' : 'Cafeteria Geral (Todas as Unidades) 🏢'}
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-emerald-950/60 p-1 rounded-xl border border-emerald-700/50">
                    <button
                        onClick={() => setSelectedPropertyFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            selectedPropertyFilter === 'all'
                                ? 'bg-white text-emerald-950 shadow-sm font-extrabold'
                                : 'text-emerald-200 hover:bg-emerald-800/60'
                        }`}
                    >
                        <Building2 size={13} /> Todas
                    </button>

                    <button
                        onClick={() => setSelectedPropertyFilter('beach')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            selectedPropertyFilter === 'beach'
                                ? 'bg-emerald-500 text-white shadow-sm font-extrabold'
                                : 'text-emerald-200 hover:bg-emerald-800/60'
                        }`}
                    >
                        <Waves size={13} /> 🏖️ Praia
                    </button>

                    <button
                        onClick={() => setSelectedPropertyFilter('sanctuary')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            selectedPropertyFilter === 'sanctuary'
                                ? 'bg-teal-500 text-white shadow-sm font-extrabold'
                                : 'text-emerald-200 hover:bg-emerald-800/60'
                        }`}
                    >
                        <Trees size={13} /> 🌿 Santuário
                    </button>
                </div>
            </div>
            {viewMode === 'tables' ? (
                <div className="space-y-6">
                    {/* Header com Ações e Filtros de Mesas por Hostel */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm gap-4">
                        <div>
                            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                                <Utensils className="text-brand-green" size={22} /> Gestão de Mesas por Hostel
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                Selecione o hostel para filtrar as mesas ativas ou abra uma nova mesa informando a unidade.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => {
                                    setNewTableUnit(selectedPropertyFilter === 'sanctuary' ? 'sanctuary' : 'beach');
                                    setIsAddTableModalOpen(true);
                                }}
                                className="bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-2 text-sm"
                            >
                                <PlusCircle size={18} /> + Abrir Nova Mesa
                            </button>
                        </div>
                    </div>

                    {/* Filtro rápido por Hostel / Unidade */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200/60">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-2">Filtrar Exibição:</span>
                            <button
                                onClick={() => setSelectedPropertyFilter('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    selectedPropertyFilter === 'all'
                                        ? 'bg-brand-dark text-white shadow-sm'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border'
                                }`}
                            >
                                🏢 Todos os Hostels ({db.tables.length})
                            </button>
                            <button
                                onClick={() => setSelectedPropertyFilter('beach')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    selectedPropertyFilter === 'beach'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
                                }`}
                            >
                                🏖️ Hostel Beach ({db.tables.filter(t => (t.propertyId || 'beach') === 'beach').length})
                            </button>
                            <button
                                onClick={() => setSelectedPropertyFilter('sanctuary')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    selectedPropertyFilter === 'sanctuary'
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'bg-white text-teal-800 hover:bg-teal-50 border border-teal-200'
                                }`}
                            >
                                🌿 Hostel Santuário ({db.tables.filter(t => (t.propertyId || 'beach') === 'sanctuary').length})
                            </button>
                        </div>

                        <div className="text-xs font-semibold text-gray-500 pr-2">
                            Exibindo: <span className="font-bold text-gray-800">
                                {selectedPropertyFilter === 'beach' ? 'Hostel Beach 🏖️' : selectedPropertyFilter === 'sanctuary' ? 'Hostel Santuário 🌿' : 'Todos os Hostels 🏢'}
                            </span>
                        </div>
                    </div>

                    {/* Grade de Mesas */}
                    {(() => {
                        const filteredTables = db.tables
                            .filter(t => {
                                if (selectedPropertyFilter === 'all') return true;
                                const prop = t.propertyId || 'beach';
                                return prop === selectedPropertyFilter;
                            })
                            .sort((a, b) => (a.number || 0) - (b.number || 0));

                        if (filteredTables.length === 0) {
                            return (
                                <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8">
                                    <Utensils className="mx-auto text-gray-300 mb-3" size={48} />
                                    <h3 className="text-lg font-bold text-gray-700">Nenhuma mesa encontrada para esta unidade</h3>
                                    <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                                        Não há mesas abertas para o {selectedPropertyFilter === 'sanctuary' ? 'Hostel Santuário' : selectedPropertyFilter === 'beach' ? 'Hostel Beach' : 'filtro selecionado'}.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setNewTableUnit(selectedPropertyFilter === 'sanctuary' ? 'sanctuary' : 'beach');
                                            setIsAddTableModalOpen(true);
                                        }}
                                        className="mt-4 bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-700 inline-flex items-center gap-2 text-sm shadow-sm"
                                    >
                                        <PlusCircle size={18} /> Abrir Mesa neste Hostel
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {filteredTables.map(table => {
                                    const tableItems = table.currentItems || [];
                                    const tableTotal = tableItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
                                    const isOccupied = tableItems.length > 0;
                                    const propUnit = table.propertyId || 'beach';
                                    return (
                                        <div 
                                            key={table.id} 
                                            onClick={() => { setActiveTableId(table.id); setViewMode('sale'); }}
                                            className={`p-4 rounded-xl border-2 transition-all text-center flex flex-col items-center gap-2 cursor-pointer relative hover:scale-[1.02] ${
                                                isOccupied 
                                                    ? 'border-brand-green bg-brand-green/5 shadow-md' 
                                                    : 'border-gray-200 bg-white hover:border-emerald-300'
                                            }`}
                                        >
                                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                                propUnit === 'sanctuary' ? 'bg-teal-100 text-teal-800 border border-teal-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                            }`}>
                                                {propUnit === 'sanctuary' ? '🌿 Santuário' : '🏖️ Beach'}
                                            </span>

                                            <div className={`p-3 rounded-full ${isOccupied ? 'bg-brand-green text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                                                <Utensils size={24} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{table.name || `Mesa ${table.number}`}</p>
                                                {isOccupied ? (
                                                    <p className="text-brand-green font-bold text-sm">{tableTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                                ) : (
                                                    <p className="text-gray-400 text-xs">Livre • {table.capacity} cap.</p>
                                                )}
                                            </div>
                                            {!isOccupied && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); if(confirm(`Excluir ${table.name || `Mesa ${table.number}`}?`)) onDeleteTable(table.id); }}
                                                    className="mt-1 text-gray-300 hover:text-red-500 transition-colors p-1"
                                                    title="Excluir mesa"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            ) : viewMode === 'sale' ? (
                <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-8">
                    {/* Product Selection */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/><input type="text" placeholder="Buscar produto..." value={productSearchTerm} onChange={e => setProductSearchTerm(e.target.value)} className="input-base pl-10"/></div>
                        <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2 space-y-4">
                            {Object.entries(productCategories).map(([category, products]) => (
                                <div key={category}>
                                    <h3 className="font-bold text-gray-700 mb-2">{category}</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {(products as any[]).map(product => (
                                            <button key={product.id} onClick={() => addToCart(product)} className="bg-white border rounded-lg p-2 text-center hover:shadow-md hover:border-brand-green transition-all">
                                                <p className="font-semibold text-sm text-gray-800">{product.name}</p>
                                                <p className="text-xs text-gray-500">{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Cart and Payment */}
                    <div className="bg-gray-50 p-4 rounded-lg flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-brand-dark">{activeTableId ? (db.tables.find(t => t.id === activeTableId)?.name || `Mesa ${db.tables.find(t => t.id === activeTableId)?.number}`) : 'Carrinho'}</h3>
                            {activeTableId && (
                                <button 
                                    onClick={() => { setViewMode('tables'); setActiveTableId(null); }}
                                    className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                                >
                                    Mudar Mesa
                                </button>
                            )}
                        </div>
                        <div className="flex-grow space-y-2 overflow-y-auto max-h-64 pr-2 -mr-2">
                            {cart.map(item => (
                                <div key={item.productId} className="flex justify-between items-center text-sm gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate">{item.name}</p>
                                        <p className="text-xs text-gray-500">R$ {item.unitPrice.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button onClick={() => handleQuantityChange(item.productId, -1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 flex-shrink-0"><Minus size={12}/></button>
                                        <span className="w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => handleQuantityChange(item.productId, 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 flex-shrink-0"><PlusCircle size={12}/></button>
                                    </div>
                                    <p className="font-bold w-16 text-right flex-shrink-0">R$ {(item.unitPrice * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                            {cart.length === 0 && <p className="text-center text-gray-500 py-10">O carrinho está vazio.</p>}
                        </div>
                         {cart.length > 0 && (
                            <div className="flex gap-2 mt-2">
                                <button onClick={clearCart} className="text-xs text-red-500 hover:underline flex items-center gap-1"><Trash2 size={12}/> Limpar</button>
                                <button 
                                    onClick={async () => {
                                        setIsSuggesting(true);
                                        setSuggestion(null);
                                        try {
                                            // Prefer onGetPOSSuggestions if available
                                            const getSuggestionFn = onGetPOSSuggestions || onGetDrinkPairingSuggestion;
                                            const result: any = await getSuggestionFn?.(cart);
                                            if (result && result.suggestions && result.suggestions.length > 0) {
                                                const first = result.suggestions[0];
                                                setSuggestion({
                                                    productId: first.productId,
                                                    drinkName: first.productName || first.drinkName,
                                                    justification: first.justification
                                                });
                                            } else if (result && result.productId) {
                                                setSuggestion(result);
                                            }
                                        } catch (e) {
                                            console.error("Erro na sugestão IA:", e);
                                        }
                                        setIsSuggesting(false);
                                    }}
                                    className="text-xs text-brand-green hover:underline flex items-center gap-1 ml-auto"
                                >
                                    <Sparkles size={12}/> Otimizar Venda (IA)
                                </button>
                            </div>
                         )}
                        <div className="mt-auto pt-4 space-y-4">
                            <div className="flex justify-between text-2xl font-bold text-brand-dark border-t pt-2">
                                <span>Total</span>
                                <span>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>

                            {isSuggesting && <div className="text-center"><Loader2 className="animate-spin text-gray-400"/></div>}
                            {suggestion && (
                                <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
                                    <p className="text-sm font-semibold text-blue-800 flex items-center justify-center gap-2"><Sparkles size={16}/> Sugestão da IA!</p>
                                    <p className="text-sm text-blue-700 mt-1">{suggestion.justification}</p>
                                    <button
                                        onClick={() => addToCart(db.products.find(p => p.id === suggestion.productId)!)}
                                        className="mt-2 text-xs bg-blue-500 text-white font-bold py-1 px-3 rounded-full hover:bg-blue-600"
                                    >
                                        Adicionar {suggestion.drinkName}
                                    </button>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Destino da Venda:</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                                    <button onClick={() => handleSetSaleDestination('walk-in')} className={`p-2 text-xs sm:rounded-l-md sm:rounded-tr-none rounded-t-md sm:border-r-0 border ${saleDestination === 'walk-in' ? 'bg-brand-green text-white border-brand-green' : ''}`}>Avulso</button>
                                    <button onClick={() => handleSetSaleDestination('room-bill')} className={`p-2 text-xs sm:border-y border-x sm:border-x-0 ${saleDestination === 'room-bill' ? 'bg-brand-green text-white border-brand-green' : ''}`}>Conta do Quarto</button>
                                    <button onClick={() => handleSetSaleDestination('guest-account')} className={`p-2 text-xs sm:rounded-r-md sm:rounded-bl-none rounded-b-md sm:border-l-0 border ${saleDestination === 'guest-account' ? 'bg-brand-green text-white border-brand-green' : ''}`}>Hóspede</button>
                                </div>
                                {saleDestination !== 'walk-in' && (
                                     <div className="relative">
                                         <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
                                         <input type="text" value={guestSearchTerm} onChange={e => setGuestSearchTerm(e.target.value)} placeholder={`Buscar ${saleDestination === 'room-bill' ? 'quarto/hóspede' : 'hóspede'}...`} className="input-base text-sm pl-8"/>
                                         {guestSearchTerm && (
                                            <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                                {filteredEntities.map(entity => {
                                                    const isBooking = 'roomId' in entity;
                                                    const guest = isBooking ? db.guests.find(g => g.id === entity.guestId) : entity;
                                                    const room = isBooking ? db.rooms.find(r => r.id === entity.roomId) : null;
                                                    return (
                                                        <button key={entity.id} onClick={() => { setSelectedEntityId(entity.id); setGuestSearchTerm(guest?.fullName || ''); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                                                            {isBooking ? `${guest?.fullName} (${room?.name})` : guest?.fullName}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                         )}
                                     </div>
                                )}
                            </div>
                             {saleDestination !== 'room-bill' && (
                                <div>
                                    <label className="text-sm font-semibold">Forma de Pagamento:</label>
                                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="input-base text-sm">
                                        <option>Cartão de Crédito</option>
                                        <option>Dinheiro</option>
                                        <option>PIX</option>
                                        <option>PayPal</option>
                                    </select>
                                </div>
                             )}

                            <button onClick={handleFinalizeSale} disabled={cart.length === 0 || isProcessing} className="w-full bg-brand-green text-white font-bold py-3 rounded-lg text-lg hover:bg-brand-green-dark disabled:bg-gray-400">
                                {isProcessing ? <Loader2 className="animate-spin" /> : 'Finalizar Venda'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : viewMode === 'products' ? (
                <ProductManagementView 
                    products={db.products} 
                    onAdd={() => onProductModalOpen('addProduct')} 
                    onEdit={(p) => onProductModalOpen('editProduct', p)}
                    onDelete={onProductDelete}
                />
            ) : (
                 <DigitalMenuView
                    menu={db.digitalMenu}
                    onGenerate={handleGenerateMenu}
                    isGenerating={isGeneratingMenu}
                />
            )}

            {isPaymentModalOpen && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full relative">
                        <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X/></button>
                        <h2 className="text-2xl font-bold text-brand-dark mb-4">Pagamento - {paymentMethod}</h2>
                        <h3 className="text-3xl font-bold text-brand-green text-center mb-6">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                        {paymentMethod === 'Cartão de Crédito' && (
                             <form onSubmit={(e) => { e.preventDefault(); processSale({ method: 'Cartão de Crédito', ...cardDetails, cardNumber: cardDetails.number, expiryDate: cardDetails.expiry }); }} className="space-y-4">
                                <div><label>Número do Cartão</label><input type="text" value={cardDetails.number} onChange={e => setCardDetails({...cardDetails, number: e.target.value})} className="input-base" required/></div>
                                <div><label>Nome no Cartão</label><input type="text" value={cardDetails.holderName} onChange={e => setCardDetails({...cardDetails, holderName: e.target.value})} className="input-base" required/></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label>Validade (MM/AA)</label><input type="text" value={cardDetails.expiry} onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})} className="input-base" required/></div>
                                    <div><label>CVC</label><input type="text" value={cardDetails.cvc} onChange={e => setCardDetails({...cardDetails, cvc: e.target.value})} className="input-base" required/></div>
                                </div>
                                <button type="submit" className="w-full btn-primary mt-4">Pagar</button>
                             </form>
                        )}
                         {paymentMethod === 'PIX' && (
                             <div className="text-center space-y-4">
                                <QrCodeIcon size={128} className="mx-auto border p-2 rounded-lg"/>
                                <p className="text-sm">Escaneie o QR Code para pagar.</p>
                                <button onClick={() => processSale({ method: 'PIX'})} className="w-full btn-primary">Pagamento Recebido</button>
                             </div>
                        )}
                    </div>
                </div>
            )}

            {lastTransaction && (
                <Receipt 
                    propertyInfo={db.propertyInfo}
                    transaction={lastTransaction}
                    onClose={() => setLastTransaction(null)}
                />
            )}

            {/* Modal de Abrir Nova Mesa com Seleção Explícita de Hostel */}
            {isAddTableModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full relative shadow-2xl animate-fade-in">
                        <button 
                            onClick={() => setIsAddTableModalOpen(false)} 
                            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
                                <Utensils size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Abrir Nova Mesa no PDV</h2>
                                <p className="text-xs text-gray-500">Cadastre a mesa vinculada ao hostel correspondente.</p>
                            </div>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const num = parseInt(newTableNumber);
                            const cap = parseInt(newTableCapacity);
                            if (!isNaN(num) && !isNaN(cap) && num > 0) {
                                try {
                                    await onAddTable({
                                        number: num,
                                        capacity: cap,
                                        name: newTableName.trim() !== '' ? newTableName.trim() : undefined,
                                        propertyId: newTableUnit
                                    });
                                    setNewTableNumber('');
                                    setNewTableName('');
                                    setNewTableCapacity('2');
                                    setIsAddTableModalOpen(false);
                                    eventBus.emit('new-notification', {
                                        type: 'success',
                                        title: 'Mesa Criada com Sucesso',
                                        message: `Mesa ${num} cadastrada no Hostel ${newTableUnit === 'sanctuary' ? 'Santuário 🌿' : 'Beach 🏖️'}.`
                                    });
                                } catch (err: any) {
                                    alert(err.message || "Erro ao criar mesa.");
                                }
                            } else {
                                alert("Por favor, informe um número e capacidade válidos.");
                            }
                        }} className="space-y-5">
                            
                            {/* Seleção Solicitada do Hostel */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
                                    Em qual Hostel esta mesa será aberta? *
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewTableUnit('beach')}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center ${
                                            newTableUnit === 'beach'
                                                ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-extrabold ring-2 ring-emerald-400/30'
                                                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                                        }`}
                                    >
                                        <span className="text-2xl">🏖️</span>
                                        <div>
                                            <p className="text-sm font-bold">Hostel Beach</p>
                                            <p className="text-[10px] text-gray-500 font-normal">Forest House Beach</p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setNewTableUnit('sanctuary')}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center ${
                                            newTableUnit === 'sanctuary'
                                                ? 'border-teal-500 bg-teal-50/80 text-teal-950 font-extrabold ring-2 ring-teal-400/30'
                                                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                                        }`}
                                    >
                                        <span className="text-2xl">🌿</span>
                                        <div>
                                            <p className="text-sm font-bold">Hostel Santuário</p>
                                            <p className="text-[10px] text-gray-500 font-normal">Forest House Santuário</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Informações da Mesa */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Número da Mesa *</label>
                                    <input 
                                        type="number" 
                                        placeholder="Ex: 4" 
                                        value={newTableNumber} 
                                        onChange={e => setNewTableNumber(e.target.value)}
                                        className="input-base text-base font-bold"
                                        required
                                        min="1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Capacidade (Lugares)</label>
                                    <input 
                                        type="number" 
                                        placeholder="Ex: 4" 
                                        value={newTableCapacity} 
                                        onChange={e => setNewTableCapacity(e.target.value)}
                                        className="input-base text-base font-bold"
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Nome/Identificador (Opcional)</label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: Varanda Vista Mar, Deck Principal" 
                                    value={newTableName} 
                                    onChange={e => setNewTableName(e.target.value)}
                                    className="input-base text-sm"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddTableModalOpen(false)} 
                                    className="btn-secondary flex-1 py-3"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-primary flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                >
                                    Confirmar e Criar Mesa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Section>
    );
};