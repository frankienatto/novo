

import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Booking, Room, Transaction, DBState, PropertyUnitId } from '../../types';
import { Section } from './shared';
import { DollarSign, Percent, Bed, FileText, Download, Building2 } from 'lucide-react';

const KPICard: React.FC<{ title: string, value: string, icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-gray-50 p-4 rounded-lg shadow-sm flex items-center">
        <div className="bg-brand-green/10 p-3 rounded-full mr-4"><Icon className="text-brand-green" size={24} /></div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

interface ReportsViewProps {
    db: DBState;
}

const ReportsView: React.FC<ReportsViewProps> = ({ db }) => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const [startDate, setStartDate] = useState(lastMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<PropertyUnitId | 'all'>('all');

    const analyticsData = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the whole end day

        const filteredBookings = db.bookings.filter(b => {
            const checkInDate = new Date(b.checkIn);
            const matchesDate = checkInDate >= start && checkInDate <= end;
            if (!matchesDate) return false;
            if (selectedPropertyFilter !== 'all') {
                const propUnit = b.propertyId || 'beach';
                if (propUnit !== selectedPropertyFilter) return false;
            }
            return true;
        });

        const filteredTransactions = db.transactions.filter(t => {
            const transactionDate = new Date(t.timestamp);
            const matchesDate = transactionDate >= start && transactionDate <= end;
            if (!matchesDate) return false;
            if (selectedPropertyFilter !== 'all') {
                const propUnit = t.propertyUnitId || t.propertyId || 'beach';
                if (propUnit !== selectedPropertyFilter) return false;
            }
            return true;
        });

        const filteredRooms = db.rooms.filter(r => {
            if (selectedPropertyFilter !== 'all') {
                const propUnit = r.propertyId || 'beach';
                if (propUnit !== selectedPropertyFilter) return false;
            }
            return true;
        });

        const periodDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        const paidBookings = filteredBookings.filter(b => b.paymentStatus === 'Paid' && (b.status === 'Checked-in' || b.status === 'Checked-out' || b.status === 'Confirmed'));

        const totalBookingRevenue = paidBookings.reduce((acc, b) => acc + b.totalPrice, 0);
        const totalPOSRevenue = filteredTransactions.reduce((acc, t) => acc + t.total, 0);
        
        const totalNightsSold = paidBookings.reduce((acc, b) => {
            const bookingStart = new Date(b.checkIn);
            const bookingEnd = new Date(b.checkOut);
            return acc + Math.max(1, Math.ceil((bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 3600 * 24)));
        }, 0);
        
        const totalAvailableRoomNights = Math.max(1, filteredRooms.length * periodDays);
        
        const adr = totalNightsSold > 0 ? (totalBookingRevenue / totalNightsSold) : 0;
        const occupancyRate = totalAvailableRoomNights > 0 ? (totalNightsSold / totalAvailableRoomNights) * 100 : 0;
        const revPAR = totalAvailableRoomNights > 0 ? (totalBookingRevenue / totalAvailableRoomNights) : 0;

        const revenueChartData = [
            { name: selectedPropertyFilter === 'beach' ? 'Hostel Beach' : selectedPropertyFilter === 'sanctuary' ? 'Hostel Santuário' : 'Consolidado Geral', Hospedagens: totalBookingRevenue, 'Ponto de Venda (PDV)': totalPOSRevenue },
        ];

        const roomPerformance = filteredRooms.map(room => {
            const roomBookings = paidBookings.filter(b => b.roomId === room.id);
            const revenue = roomBookings.reduce((acc, b) => acc + b.totalPrice, 0);
            const nights = roomBookings.reduce((acc, b) => {
                 const bookingStart = new Date(b.checkIn);
                 const bookingEnd = new Date(b.checkOut);
                 return acc + Math.max(1, Math.ceil((bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 3600 * 24)));
            }, 0);
            return {
                id: room.id,
                name: room.name,
                revenue,
                bookingsCount: roomBookings.length,
                nightsSold: nights,
            };
        }).sort((a,b) => b.revenue - a.revenue);
        
        const bookingSourceData = paidBookings.reduce((acc, booking) => {
            const source = booking.source || 'Website';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const bookingSourceChartData = Object.entries(bookingSourceData).map(([name, value]) => ({ name, value }));

        return { adr, revPAR, occupancyRate, revenueChartData, roomPerformance, bookingSourceChartData };
    }, [db, startDate, endDate, selectedPropertyFilter]);
    
    const COLORS = ['#4CAF50', '#81C784', '#A5D6A7'];
    
    const handleExportCSV = () => {
        const items = analyticsData.roomPerformance;
        if (!items || items.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        
        const headers = "Acomodação,Receita Gerada,Nº de Reservas,Diárias Vendidas\n";
        
        const csvRows = items.map(row => 
            `"${row.name.replace(/"/g, '""')}",${row.revenue},${row.bookingsCount},${row.nightsSold}`
        );

        const csvContent = headers + csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", "desempenho_quartos.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Section title="Relatórios e Análises" icon={FileText}>
            <div className="space-y-8">
                {/* Filters */}
                <div className="bg-gray-50 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-gray-200/80">
                    <div className="flex flex-wrap items-center gap-4">
                        <h3 className="font-semibold text-gray-700 text-sm">Período da Análise:</h3>
                        <div className="flex items-center gap-2">
                            <label htmlFor="startDate" className="text-xs text-gray-500 font-bold">De:</label>
                            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 text-xs border rounded-lg bg-white"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="endDate" className="text-xs text-gray-500 font-bold">Até:</label>
                            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 text-xs border rounded-lg bg-white"/>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Hostel:</span>
                        <button
                            onClick={() => setSelectedPropertyFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedPropertyFilter === 'all'
                                    ? 'bg-brand-dark text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border'
                            }`}
                        >
                            🏢 Todos
                        </button>
                        <button
                            onClick={() => setSelectedPropertyFilter('beach')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedPropertyFilter === 'beach'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
                            }`}
                        >
                            🏖️ Praia
                        </button>
                        <button
                            onClick={() => setSelectedPropertyFilter('sanctuary')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedPropertyFilter === 'sanctuary'
                                    ? 'bg-teal-600 text-white shadow-sm'
                                    : 'bg-white text-teal-800 hover:bg-teal-50 border border-teal-200'
                            }`}
                        >
                            🌿 Santuário
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KPICard title="Diária Média (ADR)" value={analyticsData.adr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} />
                    <KPICard title="Receita por Quarto (RevPAR)" value={analyticsData.revPAR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={Bed} />
                    <KPICard title="Taxa de Ocupação Média" value={`${analyticsData.occupancyRate.toFixed(1)}%`} icon={Percent} />
                </div>

                {/* Revenue Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                         <h3 className="text-xl font-bold text-brand-dark mb-4">Fontes de Receita</h3>
                         <div className="bg-white p-4 rounded-lg shadow-md">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analyticsData.revenueChartData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tickFormatter={(value) => `R$${value/1000}k`} />
                                    <YAxis type="category" dataKey="name" width={100} />
                                    <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                                    <Legend />
                                    <Bar dataKey="Hospedagens" stackId="a" fill="#4CAF50" />
                                    <Bar dataKey="Ponto de Venda" stackId="a" fill="#81C784" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                     <div>
                         <h3 className="text-xl font-bold text-brand-dark mb-4">Origem das Reservas</h3>
                         <div className="bg-white p-4 rounded-lg shadow-md">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={analyticsData.bookingSourceChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                         {analyticsData.bookingSourceChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${value} reservas`, name]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Room Performance Table */}
                <div>
                    <h3 className="text-xl font-bold text-brand-dark mb-4">Desempenho por Acomodação</h3>
                     <div className="overflow-x-auto bg-white rounded-lg shadow">
                         <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acomodação</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita Gerada</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº de Reservas</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diárias Vendidas</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {analyticsData.roomPerformance.map((room) => (
                                <tr key={room.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{room.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">{room.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.bookingsCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.nightsSold}</td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* Export section */}
                 <div className="text-right mt-4">
                    <button onClick={handleExportCSV} className="bg-brand-dark text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-700 flex items-center gap-2 inline-flex">
                        <Download size={18} />
                        Exportar Relatórios (CSV)
                    </button>
                </div>

            </div>
        </Section>
    );
};

export default ReportsView;