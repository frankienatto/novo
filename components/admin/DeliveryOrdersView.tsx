import React, { useState } from 'react';
import { DBState, DeliveryOrder, PropertyUnitId, SaleItem } from '../../types';
import { Package, Bike, FileText, Plus, X, Building2, Store, DollarSign, CheckCircle2, Clock, AlertCircle, ShoppingBag, Phone, MapPin, ExternalLink, RefreshCw } from 'lucide-react';
import { Section } from './shared';
import { eventBus } from '../../services/apiService';
import Modal from './Modal';

interface DeliveryOrdersViewProps {
    db: DBState;
    onSale?: (transactionData: Omit<import('../../types').Transaction, 'id' | 'timestamp'>, paymentDetails?: any) => Promise<void>;
    onAddDeliveryOrder?: (order: any) => Promise<void>;
    onUpdateDeliveryOrder?: (orderId: string, updates: any) => Promise<void>;
}

export const DeliveryOrdersView: React.FC<DeliveryOrdersViewProps> = ({ db, onSale, onAddDeliveryOrder, onUpdateDeliveryOrder }) => {
    const [selectedUnitFilter, setSelectedUnitFilter] = useState<PropertyUnitId | 'all'>('all');
    const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<DeliveryOrder | null>(null);

    // iFood Integration State
    const [isStoreOpen, setIsStoreOpen] = useState(true);
    const [autoAcceptIFood, setAutoAcceptIFood] = useState(true);
    const [defaultIFoodUnit, setDefaultIFoodUnit] = useState<PropertyUnitId>('beach');

    // Add Order Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [newCustomerAddress, setNewCustomerAddress] = useState('');
    const [newTotal, setNewTotal] = useState('');
    const [newSource, setNewSource] = useState<'iFood' | 'Direct' | 'WhatsApp' | 'App Próprio'>('iFood');
    const [newCourierType, setNewCourierType] = useState<'Motoboy Próprio' | 'iFood' | 'Retirada'>('iFood');
    const [newUnit, setNewUnit] = useState<PropertyUnitId>('beach');
    const [newItemsText, setNewItemsText] = useState('');

    const allOrders = db.deliveryOrders || [];

    // Filtered orders
    const filteredOrders = allOrders.filter(o => {
        const unitMatch = selectedUnitFilter === 'all' || (o.propertyUnitId || o.propertyId || 'beach') === selectedUnitFilter;
        const sourceMatch = selectedSourceFilter === 'all' || o.source === selectedSourceFilter;
        return unitMatch && sourceMatch;
    });

    const activeOrders = filteredOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
    const completedOrders = filteredOrders.filter(o => o.status === 'Delivered');
    const totalDeliveryRevenue = filteredOrders
        .filter(o => o.status === 'Delivered')
        .reduce((sum, o) => sum + (o.total || 0), 0);

    const handleAddOrder = async () => {
        if (!newCustomerName || !newCustomerAddress || !newTotal) {
            eventBus.emit('new-toast', { type: 'error', title: 'Erro', message: 'Preencha os campos obrigatórios (Nome, Endereço e Valor).' });
            return;
        }

        const itemsParsed: SaleItem[] = newItemsText.trim() ? newItemsText.split(',').map((item, idx) => ({
            productId: `item-${idx}`,
            name: item.trim(),
            quantity: 1,
            unitPrice: parseFloat(newTotal) / (newItemsText.split(',').length || 1),
            propertyUnitId: newUnit,
            propertyId: newUnit
        })) : [
            {
                productId: 'custom-combo',
                name: `Combo Delivery ${newSource}`,
                quantity: 1,
                unitPrice: parseFloat(newTotal),
                propertyUnitId: newUnit,
                propertyId: newUnit
            }
        ];

        const mockOrder = {
            customerName: newCustomerName,
            customerPhone: newCustomerPhone || '(48) 99123-4567',
            customerAddress: newCustomerAddress,
            items: itemsParsed,
            total: parseFloat(newTotal),
            status: 'Pending',
            source: newSource,
            courierType: newCourierType,
            propertyUnitId: newUnit,
            propertyId: newUnit,
            createdAt: new Date().toISOString()
        };

        if (onAddDeliveryOrder) {
            await onAddDeliveryOrder(mockOrder);
        }
        eventBus.emit('new-toast', { 
            type: 'success', 
            title: 'Pedido Delivery Registrado', 
            message: `Pedido de ${newSource} (${newUnit === 'beach' ? 'Beach' : 'Santuário'}) lançado financeiramente com sucesso.` 
        });
        setIsAddModalOpen(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
        setNewCustomerAddress('');
        setNewTotal('');
        setNewItemsText('');
    };

    const handleSimulateIFoodOrder = async () => {
        const iFoodNames = ['Lucas Silva', 'Beatriz Oliveira', 'Carla Mendes', 'Rafael Costa', 'Mariana Duarte'];
        const randomName = iFoodNames[Math.floor(Math.random() * iFoodNames.length)];
        const randomId = Math.floor(1000 + Math.random() * 9000);
        const targetUnit: PropertyUnitId = defaultIFoodUnit;

        const simulatedOrder = {
            externalOrderId: `IFOOD-${randomId}`,
            customerName: `${randomName} (iFood #${randomId})`,
            customerPhone: '(48) 99887-6655',
            customerAddress: 'Rua das Palmeiras, 142 - Apt 302 - Praia do Rosa',
            items: [
                { productId: 'p1', name: 'Combo Caipirinha + Açaí Tropical', quantity: 1, unitPrice: 38.0, propertyUnitId: targetUnit, propertyId: targetUnit },
                { productId: 'p2', name: 'Taxa de Entrega iFood Express', quantity: 1, unitPrice: 7.0, propertyUnitId: targetUnit, propertyId: targetUnit }
            ],
            subtotal: 38.0,
            deliveryFee: 7.0,
            total: 45.0,
            status: 'Pending',
            source: 'iFood',
            courierType: 'iFood',
            propertyUnitId: targetUnit,
            propertyId: targetUnit,
            paymentMethod: 'Cartão de Crédito',
            createdAt: new Date().toISOString()
        };

        if (onAddDeliveryOrder) {
            await onAddDeliveryOrder(simulatedOrder);
        }
        eventBus.emit('new-toast', { 
            type: 'success', 
            title: '🔴 Pedido iFood Webhook Recebido!', 
            message: `Pedido #${randomId} para ${targetUnit === 'beach' ? 'Hostel Beach' : 'Hostel Santuário'} vinculado financeiramente.` 
        });
    };

    const handleUpdateStatus = async (orderId: string, status: any) => {
        if (onUpdateDeliveryOrder) {
            await onUpdateDeliveryOrder(orderId, { status });
            eventBus.emit('new-toast', { type: 'success', title: 'Status Atualizado', message: `Status do pedido alterado para ${status}.` });
        }
    };

    const handleUpdateUnit = async (orderId: string, unit: PropertyUnitId) => {
        if (onUpdateDeliveryOrder) {
            await onUpdateDeliveryOrder(orderId, { propertyUnitId: unit, propertyId: unit });
            eventBus.emit('new-toast', { type: 'success', title: 'Unidade Atualizada', message: `Pedido vinculado à unidade ${unit === 'beach' ? 'Beach' : 'Santuário'}.` });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header com Filtros de Unidade */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-red-100 text-red-600 rounded-xl">
                            <Bike size={22} />
                        </span>
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tele Entrega & Integration Engine</h1>
                            <p className="text-xs text-gray-500 font-medium">
                                Gestão unificada iFood, WhatsApp e App Próprio com vínculo financeiro automático às unidades.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Unidade Selector */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 flex items-center gap-1">
                            <Building2 size={12} /> Unidade:
                        </span>
                        <button
                            onClick={() => setSelectedUnitFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedUnitFilter === 'all'
                                    ? 'bg-brand-dark text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            🏢 Todas
                        </button>
                        <button
                            onClick={() => setSelectedUnitFilter('beach')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedUnitFilter === 'beach'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-emerald-800 hover:bg-emerald-50'
                            }`}
                        >
                            🏖️ Beach
                        </button>
                        <button
                            onClick={() => setSelectedUnitFilter('sanctuary')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedUnitFilter === 'sanctuary'
                                    ? 'bg-teal-600 text-white shadow-sm'
                                    : 'text-teal-800 hover:bg-teal-50'
                            }`}
                        >
                            🌿 Santuário
                        </button>
                    </div>

                    <button 
                        onClick={handleSimulateIFoodOrder} 
                        className="flex items-center gap-2 bg-red-600 text-white px-3.5 py-2 rounded-xl hover:bg-red-700 text-xs font-bold shadow-sm transition-all"
                    >
                        <Bike size={16} />
                        <span>Simular Webhook iFood</span>
                    </button>
                    <button 
                        onClick={() => setIsAddModalOpen(true)} 
                        className="flex items-center gap-2 bg-brand-primary text-white px-3.5 py-2 rounded-xl hover:bg-brand-primary/90 text-xs font-bold shadow-sm transition-all"
                    >
                        <Plus size={16} />
                        <span>Novo Pedido</span>
                    </button>
                </div>
            </div>

            {/* Painel iFood Merchant API & Estatísticas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* iFood Status Card */}
                <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white p-5 rounded-2xl shadow-sm space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                        <Store size={120} />
                    </div>
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                                Merchant API v2.0
                            </span>
                            <h3 className="text-xl font-bold mt-2 flex items-center gap-2">
                                🔴 Integration iFood
                            </h3>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isStoreOpen ? 'bg-emerald-500/90 text-white' : 'bg-gray-800 text-gray-200'}`}>
                            {isStoreOpen ? 'Loja ABERTA' : 'Loja FECHADA'}
                        </span>
                    </div>

                    <div className="space-y-2 text-xs text-white/90 border-t border-white/20 pt-3">
                        <div className="flex justify-between items-center">
                            <span>Status da Conexão:</span>
                            <span className="font-bold flex items-center gap-1 text-emerald-200">
                                <CheckCircle2 size={12} /> Ativa / Sync
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Auto-Aceitar Pedidos:</span>
                            <button 
                                onClick={() => setAutoAcceptIFood(!autoAcceptIFood)}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${autoAcceptIFood ? 'bg-white text-red-700' : 'bg-white/20 text-white'}`}
                            >
                                {autoAcceptIFood ? 'SIM (Automático)' : 'NÃO (Manual)'}
                            </button>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Unidade Padrão iFood:</span>
                            <select 
                                value={defaultIFoodUnit} 
                                onChange={(e) => setDefaultIFoodUnit(e.target.value as PropertyUnitId)}
                                className="bg-white/20 text-white text-xs font-bold rounded px-1.5 py-0.5 border-none focus:ring-0"
                            >
                                <option value="beach" className="text-gray-900">🏖️ Hostel Beach</option>
                                <option value="sanctuary" className="text-gray-900">🌿 Hostel Santuário</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                        <button 
                            onClick={() => setIsStoreOpen(!isStoreOpen)}
                            className="w-full bg-white text-red-700 font-bold py-2 rounded-xl text-xs hover:bg-red-50 transition-colors shadow-sm"
                        >
                            {isStoreOpen ? 'Fechar Loja Temporariamente' : 'Abrir Loja no iFood'}
                        </button>
                    </div>
                </div>

                {/* Metric 1: Pedidos Ativos */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/80 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fila em Andamento</span>
                            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{activeOrders.length}</h3>
                        </div>
                        <span className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <Clock size={24} />
                        </span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                        <span>Pendente: {filteredOrders.filter(o => o.status === 'Pending').length}</span>
                        <span>Preparando: {filteredOrders.filter(o => o.status === 'Preparing').length}</span>
                        <span>Despachado: {filteredOrders.filter(o => o.status === 'Dispatched').length}</span>
                    </div>
                </div>

                {/* Metric 2: Faturamento Tele Entrega */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/80 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Faturamento Concluído</span>
                            <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">
                                R$ {totalDeliveryRevenue.toFixed(2)}
                            </h3>
                        </div>
                        <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <DollarSign size={24} />
                        </span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                        <span>Pedidos Entregues: {completedOrders.length}</span>
                        <span className="text-emerald-600 font-bold">Vínculo Financeiro OK</span>
                    </div>
                </div>
            </div>

            {/* Listagem de Pedidos */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <ShoppingBag size={20} className="text-brand-dark" />
                        <h2 className="text-lg font-bold text-gray-900">
                            Fila de Pedidos Tele Entrega {selectedUnitFilter !== 'all' ? `(${selectedUnitFilter === 'beach' ? 'Beach' : 'Santuário'})` : ''}
                        </h2>
                    </div>

                    {/* Filtro por Canal / Origem */}
                    <div className="flex items-center gap-1 text-xs">
                        <span className="font-bold text-gray-400 mr-1">Canal:</span>
                        {['all', 'iFood', 'App Próprio', 'WhatsApp', 'Direct'].map(src => (
                            <button
                                key={src}
                                onClick={() => setSelectedSourceFilter(src)}
                                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                                    selectedSourceFilter === src
                                        ? 'bg-gray-800 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {src === 'all' ? 'Todos' : src}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="p-12 text-center">
                        <Bike size={48} className="mx-auto text-gray-300 mb-3" />
                        <h3 className="text-base font-bold text-gray-700">Nenhum pedido de tele entrega encontrado</h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                            Os pedidos do iFood API, WhatsApp ou App Próprio aparecerão aqui vinculados automaticamente à unidade selecionada.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredOrders.map(order => {
                            const unit = order.propertyUnitId || order.propertyId || 'beach';
                            const isBeach = unit === 'beach';

                            return (
                                <div 
                                    key={order.id} 
                                    className="p-4 bg-gray-50/70 border border-gray-200 rounded-2xl hover:border-brand-primary/50 transition-all flex flex-col justify-between gap-3 relative group"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    order.source === 'iFood' ? 'bg-red-100 text-red-700' :
                                                    order.source === 'WhatsApp' ? 'bg-emerald-100 text-emerald-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {order.source === 'iFood' ? '🔴 iFood' : order.source === 'WhatsApp' ? '💬 WhatsApp' : '📱 ' + order.source}
                                                </span>
                                                <span className="text-xs font-mono text-gray-500 font-bold">#{order.id.slice(-6)}</span>
                                            </div>

                                            {/* Badge da Unidade */}
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                                isBeach ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-teal-50 text-teal-800 border-teal-300'
                                            }`}>
                                                {isBeach ? '🏖️ Beach' : '🌿 Santuário'}
                                            </span>
                                        </div>

                                        <h3 className="font-extrabold text-gray-900 text-base">{order.customerName}</h3>
                                        <div className="text-xs text-gray-600 space-y-0.5 mt-1">
                                            <p className="flex items-center gap-1">
                                                <MapPin size={12} className="text-gray-400 shrink-0" />
                                                <span className="truncate">{order.customerAddress}</span>
                                            </p>
                                            {order.customerPhone && (
                                                <p className="flex items-center gap-1 text-gray-500">
                                                    <Phone size={12} className="text-gray-400 shrink-0" />
                                                    <span>{order.customerPhone}</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* Items Preview */}
                                        {order.items && order.items.length > 0 && (
                                            <div className="mt-3 bg-white p-2.5 rounded-xl border border-gray-200/80 text-xs space-y-1">
                                                <p className="text-[10px] uppercase font-bold text-gray-400">Itens do Pedido:</p>
                                                {order.items.slice(0, 2).map((it, idx) => (
                                                    <div key={idx} className="flex justify-between font-medium text-gray-700">
                                                        <span>{it.quantity}x {it.name}</span>
                                                        <span>R$ {((it.unitPrice || 0) * (it.quantity || 1)).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                                {order.items.length > 2 && (
                                                    <p className="text-[10px] text-gray-400 font-bold">+ {order.items.length - 2} outros itens...</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Total do Pedido</span>
                                            <span className="text-lg font-black text-brand-dark">R$ {(order.total || 0).toFixed(2)}</span>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            {/* Status Dropdown */}
                                            <select 
                                                value={order.status} 
                                                onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                                className="input-base text-xs font-bold py-1 px-2 border-gray-300 rounded-lg"
                                            >
                                                <option value="Pending">🕒 Pendente</option>
                                                <option value="Preparing">👨‍🍳 Preparando</option>
                                                <option value="Dispatched">🛵 Despachado</option>
                                                <option value="Delivered">✅ Entregue</option>
                                                <option value="Cancelled">❌ Cancelado</option>
                                            </select>

                                            {/* Unidade Selector */}
                                            <select 
                                                value={unit} 
                                                onChange={(e) => handleUpdateUnit(order.id, e.target.value as PropertyUnitId)}
                                                className="input-base text-xs font-bold py-1 px-2 border-gray-300 rounded-lg bg-amber-50"
                                            >
                                                <option value="beach">🏖️ Beach</option>
                                                <option value="sanctuary">🌿 Santuário</option>
                                            </select>

                                            <button 
                                                onClick={() => setSelectedOrderDetails(order)}
                                                className="p-1.5 text-gray-500 hover:text-brand-dark bg-white border rounded-lg hover:bg-gray-100"
                                                title="Ver Detalhes do Pedido"
                                            >
                                                <ExternalLink size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal de Detalhes do Pedido */}
            {selectedOrderDetails && (
                <Modal 
                    isOpen={!!selectedOrderDetails} 
                    onClose={() => setSelectedOrderDetails(null)} 
                    title={`Detalhes do Pedido #${selectedOrderDetails.id.slice(-6)} (${selectedOrderDetails.source})`}
                >
                    <div className="space-y-4 text-xs">
                        <div className="p-3 bg-brand-primary/10 rounded-xl border border-brand-primary/20 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-brand-dark">Vínculo Financeiro Automático</p>
                                <p className="text-gray-600 text-[11px]">
                                    Unidade: <strong className="uppercase">{selectedOrderDetails.propertyUnitId || 'beach'}</strong> | Transação #: {selectedOrderDetails.financialTransactionId || 'Gerada'}
                                </p>
                            </div>
                            <span className="font-extrabold text-lg text-brand-dark">R$ {(selectedOrderDetails.total || 0).toFixed(2)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl">
                            <div>
                                <p className="font-bold text-gray-500 text-[10px] uppercase">Cliente</p>
                                <p className="font-bold text-gray-900 text-sm">{selectedOrderDetails.customerName}</p>
                                <p className="text-gray-600">{selectedOrderDetails.customerPhone || 'Sem telefone registrado'}</p>
                            </div>
                            <div>
                                <p className="font-bold text-gray-500 text-[10px] uppercase">Entrega</p>
                                <p className="text-gray-800 font-medium">{selectedOrderDetails.customerAddress}</p>
                                <p className="text-gray-500">Entregador: {selectedOrderDetails.courierType}</p>
                            </div>
                        </div>

                        <div>
                            <p className="font-bold text-gray-700 mb-1">Itens do Pedido</p>
                            <div className="border rounded-xl divide-y bg-white">
                                {(selectedOrderDetails.items && selectedOrderDetails.items.length > 0) ? (
                                    selectedOrderDetails.items.map((item, idx) => (
                                        <div key={idx} className="p-2.5 flex justify-between items-center">
                                            <span className="font-medium text-gray-800">{item.quantity}x {item.name}</span>
                                            <span className="font-bold text-gray-900">R$ {((item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-gray-500 text-center">Nenhum item discriminado.</div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                            <button onClick={() => setSelectedOrderDetails(null)} className="btn-secondary text-xs">
                                Fechar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal de Criação Manual de Pedido */}
            {isAddModalOpen && (
                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Lançar Pedido de Tele Entrega">
                    <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Unidade de Destino *</label>
                                <select 
                                    value={newUnit} 
                                    onChange={e => setNewUnit(e.target.value as PropertyUnitId)} 
                                    className="input-base font-bold bg-amber-50 border-amber-300"
                                >
                                    <option value="beach">🏖️ Hostel Beach</option>
                                    <option value="sanctuary">🌿 Hostel Santuário</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Origem do Pedido *</label>
                                <select 
                                    value={newSource} 
                                    onChange={e => setNewSource(e.target.value as any)} 
                                    className="input-base font-bold"
                                >
                                    <option value="iFood">🔴 iFood (Merchant API)</option>
                                    <option value="App Próprio">📱 App Próprio / Site</option>
                                    <option value="WhatsApp">💬 WhatsApp</option>
                                    <option value="Direct">🏪 Balcão / Presencial</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Cliente *</label>
                                <input 
                                    type="text" 
                                    value={newCustomerName} 
                                    onChange={e => setNewCustomerName(e.target.value)} 
                                    className="input-base" 
                                    placeholder="Ex: João Souza" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Telefone WhatsApp</label>
                                <input 
                                    type="text" 
                                    value={newCustomerPhone} 
                                    onChange={e => setNewCustomerPhone(e.target.value)} 
                                    className="input-base" 
                                    placeholder="(48) 99999-8888" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Endereço de Entrega *</label>
                            <input 
                                type="text" 
                                value={newCustomerAddress} 
                                onChange={e => setNewCustomerAddress(e.target.value)} 
                                className="input-base" 
                                placeholder="Rua, Número, Bairro, Complemento" 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Itens do Pedido (separados por vírgula)</label>
                            <input 
                                type="text" 
                                value={newItemsText} 
                                onChange={e => setNewItemsText(e.target.value)} 
                                className="input-base" 
                                placeholder="Ex: X-Burger Gourmet, Suco de Laranja, Batata Frita" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Valor Total (R$) *</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    value={newTotal} 
                                    onChange={e => setNewTotal(e.target.value)} 
                                    className="input-base font-bold text-brand-dark" 
                                    placeholder="0.00" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Entregador</label>
                                <select 
                                    value={newCourierType} 
                                    onChange={e => setNewCourierType(e.target.value as any)} 
                                    className="input-base"
                                >
                                    <option value="iFood">🛵 Entregador iFood</option>
                                    <option value="Motoboy Próprio">🏍️ Nosso Motoboy</option>
                                    <option value="Retirada">🎒 Retirada no Balcão</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t">
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">
                                Cancelar
                            </button>
                            <button onClick={handleAddOrder} className="btn-primary">
                                Registrar Pedido & Lançar Financeiro
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
