import React, { useState, useMemo } from 'react';
import { DBState, Staff, AdminSection, PropertyUnitId } from '../../../types';
import { KPICard } from './widgets';
import { DollarSign, TrendingUp, TrendingDown, ArrowRight, Building2, Waves, Trees } from 'lucide-react';

interface FinanceDashboardProps {
    db: DBState;
    currentUser: Staff;
    onNavigate: (section: AdminSection) => void;
    selectedUnit?: PropertyUnitId | 'all';
}

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ db, currentUser, onNavigate, selectedUnit = 'all' }) => {
    const [activeUnit, setActiveUnit] = useState<PropertyUnitId | 'all'>(selectedUnit);
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

    // Update activeUnit if selectedUnit prop changes from parent
    React.useEffect(() => {
        if (selectedUnit) {
            setActiveUnit(selectedUnit);
        }
    }, [selectedUnit]);

    const todayStats = useMemo(() => {
        const bookingsToday = db.bookings.filter(b => {
            if (b.checkIn !== today) return false;
            if (activeUnit === 'all') return true;
            const room = db.rooms.find(r => r.id === b.roomId);
            const unit = b.propertyUnitId || room?.propertyId || 'beach';
            return unit === activeUnit;
        });

        const transactionsToday = db.transactions.filter(t => {
            if (!t.timestamp.startsWith(today)) return false;
            if (activeUnit === 'all') return true;
            const unit = t.propertyUnitId || t.propertyId || 'beach';
            return unit === activeUnit;
        });

        const revenueToday = bookingsToday.reduce((sum, b) => sum + b.totalPrice, 0)
            + transactionsToday.reduce((sum, t) => sum + t.total, 0);
        
        const expensesTodayList = db.expenses.filter(e => {
            if (e.date !== today) return false;
            if (activeUnit === 'all') return true;
            const unit = e.propertyUnitId || e.propertyId || 'beach';
            return unit === activeUnit;
        });

        const expensesToday = expensesTodayList.reduce((sum, e) => sum + e.amount, 0);

        return { revenueToday, expensesToday };
    }, [db, today, activeUnit]);

    const totalMonthExpenses = useMemo(() => {
        return db.expenses.filter(e => {
            const matchesMonth = e.date && e.date.startsWith(currentMonth);
            if (!matchesMonth) return false;
            if (activeUnit === 'all') return true;
            const unit = e.propertyUnitId || e.propertyId || 'beach';
            return unit === activeUnit;
        }).reduce((sum, e) => sum + e.amount, 0);
    }, [db.expenses, currentMonth, activeUnit]);
    
    const last5Expenses = useMemo(() => {
        return db.expenses
            .filter(e => {
                if (activeUnit === 'all') return true;
                const unit = e.propertyUnitId || e.propertyId || 'beach';
                return unit === activeUnit;
            })
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [db.expenses, activeUnit]);

    return (
        <div className="space-y-6">
            {/* Header & Global Unit Selector for Finance Dashboard */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">Painel Financeiro</h1>
                    <p className="text-gray-600 mt-1 text-sm">
                        Bem-vindo(a), <span className="font-semibold text-gray-800">{(currentUser.name || 'Staff').split(' ')[0]}</span>! Acompanhe receitas e despesas por unidade.
                    </p>
                </div>

                {/* Global Unit Selector */}
                <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-xl border border-gray-200/80">
                    <button
                        type="button"
                        onClick={() => setActiveUnit('all')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeUnit === 'all'
                                ? 'bg-brand-dark text-white shadow-sm font-extrabold'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                        }`}
                    >
                        <Building2 size={14} /> Todas Unidades
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveUnit('beach')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeUnit === 'beach'
                                ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                        }`}
                    >
                        <Waves size={14} /> 🏖️ Praia
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveUnit('sanctuary')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeUnit === 'sanctuary'
                                ? 'bg-teal-600 text-white shadow-sm font-extrabold'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                        }`}
                    >
                        <Trees size={14} /> 🌿 Santuário
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard 
                    title={`Receita de Hoje (${activeUnit === 'beach' ? 'Praia' : activeUnit === 'sanctuary' ? 'Santuário' : 'Consolidado'})`} 
                    value={todayStats.revenueToday.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} 
                    icon={TrendingUp} 
                />
                <KPICard 
                    title={`Despesas de Hoje (${activeUnit === 'beach' ? 'Praia' : activeUnit === 'sanctuary' ? 'Santuário' : 'Consolidado'})`} 
                    value={todayStats.expensesToday.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} 
                    icon={TrendingDown} 
                />
                <KPICard 
                    title={`Total Despesas do Mês (${activeUnit === 'beach' ? 'Praia' : activeUnit === 'sanctuary' ? 'Santuário' : 'Consolidado'})`} 
                    value={totalMonthExpenses.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} 
                    icon={DollarSign} 
                />
            </div>

            {/* Recent Expenses List */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-brand-dark flex items-center gap-2">
                        <span>Últimas 5 Despesas Registradas</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                            {activeUnit === 'beach' ? 'Praia' : activeUnit === 'sanctuary' ? 'Santuário' : 'Todas as Unidades'}
                        </span>
                    </h3>
                </div>
                
                <div className="space-y-2.5">
                    {last5Expenses.length > 0 ? (
                        last5Expenses.map(expense => {
                            const unit = expense.propertyUnitId || expense.propertyId || 'beach';
                            return (
                                <div key={expense.id} className="flex justify-between items-center bg-gray-50/80 p-3 rounded-xl border border-gray-150">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm text-gray-800">{expense.description}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                unit === 'sanctuary' ? 'bg-teal-100 text-teal-800' : 'bg-emerald-100 text-emerald-800'
                                            }`}>
                                                {unit === 'sanctuary' ? '🌿 Santuário' : '🏖️ Praia'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">{expense.category} • {new Date(expense.date).toLocaleDateString()}</p>
                                    </div>
                                    <p className="font-bold text-red-600">{expense.amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-gray-500 italic py-4 text-center">Nenhuma despesa registrada para a unidade selecionada.</p>
                    )}
                </div>
            </div>

            {/* Quick Action */}
            <div className="text-center pt-2">
                <button 
                    onClick={() => onNavigate('financial_manager')}
                    className="bg-brand-dark text-white font-bold py-3.5 px-6 rounded-xl hover:bg-gray-800 transition-all inline-flex items-center gap-2 shadow-sm"
                >
                    Acessar Gerenciador Financeiro Completo <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default FinanceDashboard;
