import React, { useMemo, useState } from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Section } from './shared';
import { DBState, Expense, AIMenuPriceAnalysis, Product, PropertyUnitId } from '../../types';
import { calculateBreakevenPoint, runFinancialScenario, getAIMenuPriceAnalysis } from '../../services/apiService';
import { eventBus } from '../../services/apiService';
import { Loader2, Sparkles, AreaChart as AreaChartIcon, BarChart, Wallet, BrainCircuit, TrendingUp, TrendingDown, DollarSign, Bed as BedIcon, Percent, Download, Trash2, ArrowRight, PlusCircle, ClipboardList, Info, Building2, Waves, Trees } from 'lucide-react';

const KPICard: React.FC<{ title: string, value: string, icon: React.ElementType, subtitle?: string }> = ({ title, value, icon: Icon, subtitle }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100/60"><Icon className="text-emerald-700" size={22} /></div>
            <div>
                <p className="text-xs text-gray-500 font-medium">{title}</p>
                <p className="text-xl font-extrabold text-gray-800">{value}</p>
                {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    </div>
);

const ChartContainer: React.FC<{ title: string, children: React.ReactElement }> = ({ title, children }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm h-full">
        <h3 className="text-sm font-bold text-gray-800 mb-4">{title}</h3>
        <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
                {children}
            </ResponsiveContainer>
        </div>
    </div>
);

interface FinancialManagerViewProps { 
    db: DBState;
    onAddExpense: (data: Omit<Expense, 'id'>) => Promise<void>;
    onDeleteExpense: (id: string) => Promise<void>;
    onProductAdd: (productData: Omit<Product, 'id'>) => Promise<void>;
    onProductUpdate: (product: Product) => Promise<void>;
}

const FinancialManagerView: React.FC<FinancialManagerViewProps> = ({ db, onAddExpense, onDeleteExpense, onProductAdd, onProductUpdate }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<PropertyUnitId | 'all'>('all');
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const [startDate, setStartDate] = useState(lastMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    // --- Dashboard State & Memos ---
    const financialSummary = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the whole end day

        const filteredBookings = db.bookings.filter(b => {
            const checkInDate = new Date(b.checkIn);
            const matchesDate = checkInDate >= start && checkInDate <= end && b.paymentStatus === 'Paid';
            if (!matchesDate) return false;

            const room = db.rooms.find(r => r.id === b.roomId);
            const roomProperty = room?.propertyId || 'beach';
            if (selectedPropertyFilter !== 'all' && roomProperty !== selectedPropertyFilter) {
                return false;
            }
            return true;
        });

        const filteredTransactions = db.transactions.filter(t => {
            const transactionDate = new Date(t.timestamp);
            const matchesDate = transactionDate >= start && transactionDate <= end;
            if (!matchesDate) return false;

            if (selectedPropertyFilter !== 'all') {
                const propUnit = t.propertyUnitId || t.propertyId;
                if (propUnit && propUnit !== 'all' && propUnit !== selectedPropertyFilter) {
                    return false;
                }
            }
            return true;
        });
        
        const filteredExpenses = db.expenses.filter(e => {
            const expenseDate = new Date(e.date);
            const matchesDate = expenseDate >= start && expenseDate <= end;
            if (!matchesDate) return false;

            if (selectedPropertyFilter !== 'all' && e.propertyId && e.propertyId !== 'all' && e.propertyId !== selectedPropertyFilter) {
                return false;
            }
            return true;
        });

        const totalBookingRevenue = filteredBookings.reduce((acc, b) => acc + b.totalPrice, 0);
        
        const posRevenueByCategory = filteredTransactions.reduce((acc, t) => {
            t.items.forEach(item => {
                const product = db.products.find(p => p.id === item.productId);
                if (product) {
                    let categoryKey: string;
                    if (product.category === 'Comida & Bebida') categoryKey = 'Cafeteria & Bar';
                    else if (product.category === 'Aluguel' || product.category === 'Passeio') categoryKey = 'Passeios & Experiências';
                    else if (product.category === 'Coworking') categoryKey = 'Coworking';
                    else categoryKey = 'Outros';
                    acc[categoryKey] = (acc[categoryKey] || 0) + item.unitPrice * item.quantity;
                }
            });
            return acc;
        }, {} as Record<string, number>);

        const totalPOSRevenue = Object.values(posRevenueByCategory).reduce((sum: number, val: number) => sum + val, 0);
        const totalRevenue = totalBookingRevenue + totalPOSRevenue;
        const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
        const netProfit = totalRevenue - totalExpenses;

        const revenueByCategoryChartData = [
            { name: 'Hospedagem', value: totalBookingRevenue },
            ...Object.entries(posRevenueByCategory).map(([name, value]) => ({ name, value }))
        ];
        
        const topProducts = filteredTransactions
            .flatMap(t => t.items)
            .reduce((acc, item) => {
                acc[item.name] = (acc[item.name] || 0) + item.unitPrice * item.quantity;
                return acc;
            }, {} as Record<string, number>);

        const topProductsChartData = Object.entries(topProducts)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));

        return { totalRevenue, totalExpenses, netProfit, totalBookingRevenue, totalPOSRevenue, revenueByCategoryChartData, topProductsChartData };
    }, [db, startDate, endDate, selectedPropertyFilter]);

    // --- Cash Flow State ---
    const [newExpense, setNewExpense] = useState<{
        description: string;
        amount: string;
        category: Expense['category'];
        date: string;
        projectId?: string;
        propertyUnitId: PropertyUnitId;
        propertyId?: PropertyUnitId | 'shared';
    }>({ 
        description: '', 
        amount: '', 
        category: 'Outros', 
        date: new Date().toISOString().split('T')[0], 
        projectId: '', 
        propertyUnitId: selectedPropertyFilter !== 'all' ? selectedPropertyFilter : 'beach',
        propertyId: selectedPropertyFilter !== 'all' ? selectedPropertyFilter : 'beach' 
    });
    
    const cashFlowItems = useMemo(() => {
        const revenues = [
            ...db.bookings.filter(b => b.paymentStatus === 'Paid').map(b => {
                const room = db.rooms.find(r => r.id === b.roomId);
                const propId = b.propertyUnitId || room?.propertyId || 'beach';
                return { 
                    type: 'Receita' as const, 
                    date: b.checkIn, 
                    description: `Hospedagem - ${room?.name || 'Reserva'}`, 
                    amount: b.totalPrice, 
                    id: `booking-${b.id}`,
                    propertyId: propId,
                    propertyUnitId: propId
                };
            }),
            ...db.transactions.map(t => ({ 
                type: 'Receita' as const, 
                date: t.timestamp, 
                description: `Venda Café/PDV - ${t.items[0]?.name || 'Item'}`, 
                amount: t.total, 
                id: `trans-${t.id}`,
                propertyId: t.propertyUnitId || t.propertyId || 'beach',
                propertyUnitId: t.propertyUnitId || t.propertyId || 'beach'
            }))
        ];
        const expenses = db.expenses.map(e => ({ 
            type: 'Despesa' as const, 
            date: e.date, 
            description: e.description, 
            amount: e.amount, 
            id: e.id, 
            category: e.category, 
            projectId: e.projectId,
            propertyId: e.propertyUnitId || e.propertyId || 'beach',
            propertyUnitId: e.propertyUnitId || e.propertyId || 'beach'
        }));

        return [...revenues, ...expenses]
            .filter(item => {
                if (selectedPropertyFilter === 'all') return true;
                if (!item.propertyUnitId) return true;
                return item.propertyUnitId === selectedPropertyFilter;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [db, selectedPropertyFilter]);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExpense.description || !newExpense.amount || !newExpense.date || !newExpense.propertyUnitId) {
            alert("Preencha todos os campos obrigatórios da despesa, incluindo a unidade do hostel.");
            return;
        }
        const unit = newExpense.propertyUnitId;
        await onAddExpense({ 
            ...newExpense, 
            amount: parseFloat(newExpense.amount), 
            projectId: newExpense.projectId || undefined,
            propertyUnitId: unit,
            propertyId: unit
        });
        setNewExpense({ 
            description: '', 
            amount: '', 
            category: 'Outros', 
            date: new Date().toISOString().split('T')[0], 
            projectId: '', 
            propertyUnitId: selectedPropertyFilter !== 'all' ? selectedPropertyFilter : 'beach',
            propertyId: selectedPropertyFilter !== 'all' ? selectedPropertyFilter : 'beach' 
        });
    };

    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Data,Tipo,Descrição,Categoria,Valor\n";
        cashFlowItems.forEach(item => {
            const amount = item.type === 'Receita' ? item.amount : -item.amount;
            const category = item.type === 'Despesa' ? (item as any).category : 'Receita';
            csvContent += `${new Date(item.date).toLocaleDateString()},${item.type},"${item.description}",${category},${amount.toFixed(2)}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "fluxo_de_caixa.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    // --- AI Analysis State ---
    const [scenario, setScenario] = useState('');
    const [breakevenResult, setBreakevenResult] = useState<any | null>(null);
    const [scenarioResult, setScenarioResult] = useState<any | null>(null);
    const [isAILoading, setIsAILoading] = useState<string | null>(null);
    
    // AI Pricing State
    const [menuItemName, setMenuItemName] = useState('Café da Manhã Completo');
    const [ingredientsText, setIngredientsText] = useState('Pão: 0.50\nOvo: 0.80\nBacon: 1.20\nCafé: 1.00\nFruta: 1.50');
    const [analysisResult, setAnalysisResult] = useState<AIMenuPriceAnalysis | null>(null);
    const [isAnalyzingMenu, setIsAnalyzingMenu] = useState(false);
    const [isSavingToPos, setIsSavingToPos] = useState(false);


    const handleCalculateBreakeven = async () => {
        setIsAILoading('breakeven');
        setBreakevenResult(null);
        const totalFixedCosts = db.expenses.filter(e => e.category === 'Salários' || e.category === 'Contas').reduce((sum, e) => sum + e.amount, 0);
        const adr = db.bookings.length > 0 ? db.bookings.reduce((sum, b) => sum + b.totalPrice, 0) / db.bookings.length : 150;
        const result = await calculateBreakevenPoint(totalFixedCosts, adr, 25); // Using 25 as avg variable cost
        setBreakevenResult(result);
        setIsAILoading(null);
    };

    const handleRunScenario = async () => {
        if (!scenario.trim()) return;
        setIsAILoading('scenario');
        setScenarioResult(null);
        const totalFixedCosts = db.expenses.filter(e => e.category === 'Salários' || e.category === 'Contas').reduce((sum, e) => sum + e.amount, 0);
        const adr = db.bookings.length > 0 ? db.bookings.reduce((sum, b) => sum + b.totalPrice, 0) / db.bookings.length : 150;
        const result = await runFinancialScenario(scenario, totalFixedCosts, adr, 25);
        setScenarioResult(result);
        setIsAILoading(null);
    };
    
    const handleAnalyzeMenuPrice = async () => {
        if (!menuItemName.trim() || !ingredientsText.trim()) return;
        setIsAnalyzingMenu(true);
        setAnalysisResult(null);
        try {
            const ingredients = ingredientsText.split('\n').map(line => {
                const parts = line.split(':');
                return { name: parts[0].trim(), cost: parseFloat(parts[1].trim()) };
            }).filter(item => item.name && !isNaN(item.cost));
            
            const result = await getAIMenuPriceAnalysis(ingredients, menuItemName);
            setAnalysisResult(result);
        } catch (error) {
            console.error(error);
            alert("Erro ao analisar. Verifique o formato dos ingredientes (ex: 'Pão: 0.50').");
        }
        setIsAnalyzingMenu(false);
    };
    
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart },
        { id: 'receivables', label: 'Contas a Receber', icon: ClipboardList },
        { id: 'cashflow', label: 'Fluxo de Caixa', icon: Wallet },
        { id: 'pricing', label: 'Precificação IA', icon: Sparkles },
        { id: 'analysis', label: 'Análise & Cenários IA', icon: BrainCircuit }
    ];

    const expenseCategories: Expense['category'][] = ['Luz', 'Água', 'Internet', 'Marketing Digital', 'Lavanderia', 'Material de Limpeza', 'Marketing', 'Manutenção', 'Salários', 'Suprimentos', 'Contas', 'Outros'];

    const pendingBookings = useMemo(() => {
        return db.bookings.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
    }, [db.bookings]);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-6">
                         {/* Multi-Property Filter Bar */}
                         <div className="bg-emerald-900 text-white p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-800 rounded-xl">
                                    <Building2 size={22} className="text-emerald-300" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">DRE Multi-Unidades Unificado</span>
                                    <h3 className="font-bold text-sm text-white">
                                        {selectedPropertyFilter === 'beach' ? 'Forest House Beach 🏖️' : selectedPropertyFilter === 'sanctuary' ? 'Forest House Santuário 🌿' : 'Visão Consolidada (Ambos os Hostels) 🏢'}
                                    </h3>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 bg-emerald-950/70 p-1 rounded-xl border border-emerald-700/50">
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

                                <div className="flex items-center gap-2 bg-emerald-950/40 p-2 rounded-xl border border-emerald-700/40 text-xs text-emerald-100">
                                    <label htmlFor="startDate" className="font-bold">De:</label>
                                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-emerald-900 border border-emerald-700 rounded p-1 text-xs text-white"/>
                                    <label htmlFor="endDate" className="font-bold">Até:</label>
                                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-emerald-900 border border-emerald-700 rounded p-1 text-xs text-white"/>
                                </div>
                            </div>
                         </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <KPICard title="Receita Total" value={financialSummary.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={TrendingUp} subtitle="Hospedagem + Cafeteria / PDV" />
                            <KPICard title="Receita Hospedagem" value={financialSummary.totalBookingRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={BedIcon} subtitle="Diárias acumuladas" />
                            <KPICard title="Despesas Totais" value={financialSummary.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={TrendingDown} subtitle="Custos operacionais" />
                            <KPICard title="Lucro Líquido" value={financialSummary.netProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} subtitle="Resultado do período" />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartContainer title="Receita por Categoria">
                                <RechartsBarChart data={financialSummary.revenueByCategoryChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tickFormatter={(value) => `R$${value/1000}k`} />
                                    <YAxis type="category" dataKey="name" width={120} />
                                    <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                                    <Bar dataKey="value" fill="#4CAF50" name="Receita" />
                                </RechartsBarChart>
                            </ChartContainer>
                            <ChartContainer title="Top 5 Produtos/Serviços (PDV)">
                                 <RechartsBarChart data={financialSummary.topProductsChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tickFormatter={(value) => `R$${value}`} />
                                    <YAxis type="category" dataKey="name" width={120} />
                                    <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                                    <Bar dataKey="value" fill="#81C784" name="Receita" />
                                </RechartsBarChart>
                            </ChartContainer>
                        </div>
                    </div>
                );
            case 'receivables':
                return (
                    <div className="space-y-4">
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4">
                            <div className="flex items-center">
                                <Info className="text-orange-500 mr-3" />
                                <p className="text-sm text-orange-700 font-medium">
                                    Total a receber de hóspedes: <span className="text-xl font-bold">{pendingBookings.reduce((sum, b) => sum + b.balance, 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                                </p>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hóspede / Quarto</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo Pendente</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {pendingBookings.map(booking => {
                                        const guest = db.guests.find(g => g.id === booking.guestId);
                                        const room = db.rooms.find(r => r.id === booking.roomId);
                                        return (
                                            <tr key={booking.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{guest?.fullName}</div>
                                                    <div className="text-sm text-gray-500">{room?.name}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-red-600">
                                                    {(booking.balance || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => {
                                                            if(window.confirm(`Confirmar recebimento de ${(booking.balance || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}?`)) {
                                                                // In a real app we'd pass this as a prop, but here we'll use eventBus for simplicity if needed
                                                                // or assume it's handled in BookingsView. 
                                                                // For now we'll just alert that this should be done in BookingsView or implement the prop.
                                                                alert("Por favor, gerencie o pagamento na tela de 'Reservas' para emitir o recibo completo.");
                                                            }
                                                        }}
                                                        className="text-brand-green hover:text-brand-green-dark text-sm font-bold"
                                                    >
                                                        Registrar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {pendingBookings.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">Não há pagamentos pendentes.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'cashflow':
                 return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                                <h3 className="text-xl font-bold text-brand-dark">Histórico de Transações</h3>
                                <button onClick={handleExportCSV} className="bg-brand-dark text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-700 flex items-center gap-2 text-sm self-end sm:self-center">
                                    <Download size={16} /> Exportar CSV
                                </button>
                            </div>
                             <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <div className="max-h-[60vh] overflow-y-auto">
                                    {/* Mobile View */}
                                    <div className="lg:hidden space-y-3 p-3">
                                        {cashFlowItems.map(item => (
                                             <div key={item.id} className="bg-gray-50 p-3 rounded-lg border">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-semibold text-gray-800 flex-1 pr-2">{item.description}</p>
                                                    <span className={`text-lg font-bold ${item.type === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>{item.type === 'Receita' ? '+' : '-'} {(item.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                                                    <span>{new Date(item.date).toLocaleDateString()}</span>
                                                    <span>{item.type === 'Despesa' ? (item as any).category : item.type}</span>
                                                    {item.type === 'Despesa' && <button onClick={() => onDeleteExpense(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button>}
                                                </div>
                                             </div>
                                        ))}
                                    </div>
                                    {/* Desktop View */}
                                    <table className="min-w-full hidden lg:table">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria/Projeto</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {cashFlowItems.map(item => (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-800">{item.description}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.type === 'Despesa' ? (item as any).category : item.type}
                                                        {(item as any).projectId && <span className="block text-blue-600 text-xs font-semibold">{db.projects.find(p=>p.id === (item as any).projectId)?.name}</span>}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${item.type === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {item.type === 'Receita' ? '+' : '-'} {(item.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </td>
                                                     <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {item.type === 'Despesa' && <button onClick={() => onDeleteExpense(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                             </div>
                        </div>
                        <div>
                             <h3 className="text-xl font-bold text-brand-dark mb-4">Adicionar Nova Despesa</h3>
                             <form onSubmit={handleAddExpense} className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                                <input type="text" placeholder="Descrição" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="input-base" required />
                                <input type="number" placeholder="Valor (R$)" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="input-base" required />
                                <input type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="input-base text-gray-500" required />
                                <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as Expense['category']})} className="input-base">
                                    {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">Unidade do Hostel (Obrigatório) *</label>
                                    <select 
                                        value={newExpense.propertyUnitId} 
                                        onChange={e => setNewExpense({...newExpense, propertyUnitId: e.target.value as PropertyUnitId, propertyId: e.target.value as PropertyUnitId})} 
                                        className="input-base font-semibold"
                                        required
                                    >
                                        <option value="beach">🏖️ Forest House Beach</option>
                                        <option value="sanctuary">🌿 Forest House Santuário</option>
                                    </select>
                                </div>
                                <select value={newExpense.projectId} onChange={e => setNewExpense({...newExpense, projectId: e.target.value})} className="input-base">
                                     <option value="">Vincular a um projeto (opcional)</option>
                                     {db.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <button type="submit" className="w-full bg-brand-green text-white font-bold py-2 rounded-lg hover:bg-brand-green-dark">Adicionar Despesa</button>
                             </form>
                        </div>
                    </div>
                );
             case 'pricing':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-bold text-brand-dark mb-2">Precificação de Cardápio com IA</h3>
                            <p className="text-sm text-gray-600 mb-4">Precifique itens complexos, como o café da manhã. Liste os ingredientes e custos (um por linha) e deixe a IA analisar o preço de venda ideal.</p>
                            <div className="space-y-4 bg-white p-4 rounded-lg border">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item do Cardápio</label>
                                    <input value={menuItemName} onChange={e => setMenuItemName(e.target.value)} className="input-base" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingredientes e Custos (Ex: Pão: 0.50)</label>
                                    <textarea value={ingredientsText} onChange={e => setIngredientsText(e.target.value)} className="input-base font-mono" rows={6}/>
                                </div>
                                <button onClick={handleAnalyzeMenuPrice} disabled={isAnalyzingMenu} className="w-full btn-primary flex items-center justify-center gap-2">
                                    {isAnalyzingMenu ? <Loader2 className="animate-spin"/> : <><Sparkles size={16}/> Analisar Preço</>}
                                </button>
                            </div>
                        </div>
                         <div className="bg-gray-50 p-4 rounded-lg border">
                            <h3 className="text-xl font-bold text-brand-dark mb-2">Análise da IA</h3>
                            {isAnalyzingMenu && <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-brand-green" size={32}/></div>}
                            {analysisResult && (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Preço de Venda Sugerido</p>
                                        <p className="text-5xl font-extrabold text-brand-green my-2">{(analysisResult.suggestedPrice || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-md border">
                                        <h4 className="font-semibold text-sm mb-1">Justificativa da IA:</h4>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{analysisResult.analysis}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t">
                                        {(() => {
                                            const existingProduct = db.products.find(p => p.name.toLowerCase() === menuItemName.toLowerCase());
                                            const isUpdate = !!existingProduct;

                                            const handleClick = async () => {
                                                setIsSavingToPos(true);
                                                const costPrice = ingredientsText.split('\n')
                                                    .map(line => parseFloat(line.split(':')[1]))
                                                    .filter(c => !isNaN(c))
                                                    .reduce((a, b) => a + b, 0);

                                                const productData = {
                                                    name: menuItemName,
                                                    price: analysisResult.suggestedPrice,
                                                    category: 'Comida & Bebida' as const,
                                                    stock: 1000, // Default for non-physical items
                                                    lowStockThreshold: 10,
                                                    costPrice: costPrice
                                                };
                                                if (isUpdate) {
                                                    await onProductUpdate({ ...existingProduct, ...productData });
                                                } else {
                                                    await onProductAdd(productData);
                                                }
                                                eventBus.emit('new-toast', {
                                                    type: 'success',
                                                    title: `Produto ${isUpdate ? 'Atualizado' : 'Criado'}!`,
                                                    message: `"${menuItemName}" foi ${isUpdate ? 'atualizado' : 'criado'} no PDV com o preço de ${(analysisResult.suggestedPrice || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`
                                                });
                                                setIsSavingToPos(false);
                                            };

                                            return (
                                                <button onClick={handleClick} disabled={isSavingToPos} className="w-full btn-primary flex items-center justify-center gap-2">
                                                    {isSavingToPos ? <Loader2 className="animate-spin"/> : (isUpdate ? <><ArrowRight size={16}/> Atualizar Preço no PDV</> : <><PlusCircle size={16}/> Criar Produto no PDV</>)}
                                                </button>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'analysis':
                return (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-xl shadow-lg">
                                <h3 className="text-xl font-bold text-brand-dark mb-2">Calculadora de Ponto de Equilíbrio</h3>
                                <p className="text-sm text-gray-600 mb-4">Descubra a taxa de ocupação mínima para cobrir seus custos e começar a lucrar.</p>
                                <button onClick={handleCalculateBreakeven} disabled={!!isAILoading} className="w-full bg-brand-dark text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                                    {isAILoading === 'breakeven' ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Calcular Ponto de Equilíbrio</>}
                                </button>
                                {breakevenResult && (
                                    <div className="mt-4 text-center bg-gray-50 p-4 rounded-lg">
                                        <p className="text-gray-600">Ocupação Mínima para Lucrar:</p>
                                        <p className="text-4xl font-extrabold text-brand-green my-2">{breakevenResult.breakevenOccupancyRate.toFixed(1)}%</p>
                                        <p className="text-gray-600">Meta de Receita Mensal: <strong className="text-gray-800">{(breakevenResult.monthlyRevenueTarget || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
                                        <p className="text-xs text-gray-500 mt-3 italic">Análise IA: {breakevenResult.analysis}</p>
                                    </div>
                                )}
                            </div>
                             <div className="bg-white p-6 rounded-xl shadow-lg">
                                <h3 className="text-xl font-bold text-brand-dark mb-2">Planejador de Cenários "E Se?"</h3>
                                <p className="text-sm text-gray-600 mb-4">Simule decisões de negócio e veja o impacto financeiro antes de agir.</p>
                                <textarea value={scenario} onChange={e => setScenario(e.target.value)} placeholder="Ex: 'E se eu aumentar os preços em 15% em agosto?' ou 'Qual o impacto de contratar mais um funcionário?'" className="w-full p-2 border border-gray-300 rounded-md mb-2" rows={3}></textarea>
                                <button onClick={handleRunScenario} disabled={!scenario.trim() || !!isAILoading} className="w-full bg-brand-dark text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                                    {isAILoading === 'scenario' ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Simular Cenário</>}
                                </button>
                                {scenarioResult && (
                                     <div className="mt-4 space-y-3 text-sm">
                                        <h4 className="font-bold">Análise para: <span className="font-normal italic">"{scenarioResult.scenario}"</span></h4>
                                        <div><strong className="text-blue-700">Impacto:</strong> <span className="text-gray-600">{scenarioResult.impactAnalysis.profitChange} no lucro. {scenarioResult.impactAnalysis.revenueChange} na receita.</span></div>
                                        <div><strong className="text-green-700">Recomendações:</strong><ul className="list-disc list-inside pl-2 text-gray-600">{scenarioResult.recommendations.map((r: string, i:number) => <li key={i}>{r}</li>)}</ul></div>
                                        <div><strong className="text-red-700">Riscos:</strong><ul className="list-disc list-inside pl-2 text-gray-600">{scenarioResult.potentialRisks.map((r: string, i:number) => <li key={i}>{r}</li>)}</ul></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <Section title="Gerente Financeiro" icon={AreaChartIcon}>
             <div className="flex border-b mb-6 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors flex-shrink-0 ${activeTab === tab.id ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500 hover:text-brand-dark'}`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>
            {renderContent()}
        </Section>
    );
}

export default FinancialManagerView;