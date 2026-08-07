import React, { useState, useMemo } from 'react';
import { Section } from './shared';
import { DBState, GuestJourney, AIAction, AIActionType, Booking, Transaction, GuestPost } from '../../types';
import { 
    Footprints, MessageSquare, Briefcase, Star, Bot, DollarSign, CheckSquare, 
    User, Calendar, Clock, Mail, Phone, ShoppingBag, Edit, ClipboardList, Crown, MessageCircle
} from 'lucide-react';

interface GuestJourneyAIViewProps {
    db: DBState;
    onRunNextAction: (journeyId: string) => Promise<void>;
}

const KPICard: React.FC<{ title: string, value: string | number, icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-gray-50 p-3 rounded-lg flex items-center border">
        <Icon className="text-brand-green mr-3" size={20} />
        <div>
            <p className="text-xs text-gray-500">{title}</p>
            <p className="font-bold text-gray-800">{value}</p>
        </div>
    </div>
);


const GuestJourneyAIView: React.FC<GuestJourneyAIViewProps> = ({ db, onRunNextAction }) => {
    const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(db.guestJourneys?.[0]?.id || null);
    const [activeTab, setActiveTab] = useState<'timeline' | 'bookings' | 'financials' | 'community'>('timeline');

    const selectedJourney = useMemo(() => {
        if (!selectedJourneyId) return null;
        return db.guestJourneys.find(j => j.id === selectedJourneyId);
    }, [selectedJourneyId, db.guestJourneys]);

    const guestForJourney = useMemo(() => {
        if (!selectedJourney) return null;
        return db.guests.find(g => g.id === selectedJourney.guestId);
    }, [selectedJourney, db.guests]);

    // Calculate 360 data for the selected guest
    const guest360Data = useMemo(() => {
        if (!guestForJourney) return null;
        const guestId = guestForJourney.id;

        const bookings = db.bookings.filter(b => b.guestId === guestId);
        const bookingIds = bookings.map(b => b.id);
        const transactions = db.transactions.filter(t => t.bookingId && bookingIds.includes(t.bookingId));
        const posts = db.guestPosts.filter(p => p.guestId === guestId);

        const totalBookingSpend = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
        const totalPOSSpend = transactions.reduce((sum, t) => sum + t.total, 0);
        const totalSpent = totalBookingSpend + totalPOSSpend;

        return {
            bookings,
            transactions,
            posts,
            totalSpent,
            totalBookings: bookings.length
        };
    }, [guestForJourney, db.bookings, db.transactions, db.guestPosts]);

    const ActionIcon: React.FC<{ type: AIActionType }> = ({ type }) => {
        const iconMap: Record<AIActionType, React.ElementType> = {
            'SEND_MESSAGE': MessageSquare,
            'SUGGEST_ACTIVITY': Briefcase,
            'OFFER_UPSELL': DollarSign,
            'CREATE_TASK': CheckSquare,
            'REQUEST_REVIEW': Star,
        };
        const Icon = iconMap[type] || Bot;
        return <Icon className="text-white" size={16} />;
    };

    const statusColors: { [key in AIAction['status']]: string } = {
        planned: 'bg-gray-400',
        executed: 'bg-brand-green',
        cancelled: 'bg-red-500',
    };

    const renderTabs = () => (
        <div className="flex border-b mb-4">
            <button onClick={() => setActiveTab('timeline')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'timeline' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}>Timeline IA</button>
            <button onClick={() => setActiveTab('bookings')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'bookings' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}>Reservas</button>
            <button onClick={() => setActiveTab('financials')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'financials' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}>Financeiro</button>
            <button onClick={() => setActiveTab('community')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'community' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}>Comunidade</button>
        </div>
    );

    const renderTabContent = () => {
        if (!selectedJourney || !guestForJourney || !guest360Data) return null;

        switch (activeTab) {
            case 'timeline':
                return (
                    <div className="relative border-l-2 border-gray-200 pl-6 space-y-8">
                        {selectedJourney.actionLog.map(action => (
                            <div key={action.id} className="relative">
                                <div className={`absolute -left-[33px] top-1 w-4 h-4 rounded-full flex items-center justify-center ${statusColors[action.status]}`}>
                                    <ActionIcon type={action.type} />
                                </div>
                                <p className="text-xs text-gray-500">{new Date(action.timestamp).toLocaleString()}</p>
                                <p className="font-semibold text-gray-800">{action.type.replace(/_/g, ' ')}</p>
                                <p className="text-sm text-gray-600 italic">"{action.justification}"</p>
                            </div>
                        ))}
                    </div>
                );
            case 'bookings':
                return (
                    <div className="space-y-2">
                        {guest360Data.bookings.map(booking => (
                            <div key={booking.id} className="bg-gray-50 p-3 rounded-lg border">
                                <p><strong>{db.rooms.find(r => r.id === booking.roomId)?.name}</strong> ({booking.status})</p>
                                <p className="text-sm text-gray-600">{new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                );
            case 'financials':
                return (
                     <div className="space-y-2">
                        {guest360Data.transactions.map(transaction => (
                            <div key={transaction.id} className="bg-gray-50 p-3 rounded-lg border">
                                <p><strong>Compra PDV:</strong> {transaction.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                <p className="text-sm text-gray-600">{transaction.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                            </div>
                        ))}
                    </div>
                );
            case 'community':
                return (
                     <div className="space-y-2">
                        {guest360Data.posts.map(post => (
                            <div key={post.id} className="bg-gray-50 p-3 rounded-lg border">
                                <p className="text-sm text-gray-600 italic">"{post.text}"</p>
                                <p className="text-xs text-right text-gray-400">{new Date(post.timestamp).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                );
        }
    }

    return (
        <Section title="Hub do Hóspede 360°" icon={Footprints}>
            <p className="text-sm text-gray-600 mb-6">Monitore e gerencie a experiência completa de cada hóspede em um único lugar.</p>
            <div className="flex flex-col md:flex-row h-[75vh] bg-white rounded-lg border overflow-hidden">
                <aside className="w-full md:w-1/3 border-b md:border-b-0 md:border-r flex-shrink-0">
                     <div className="p-4 border-b"><h3 className="font-bold text-gray-800">Jornadas Ativas ({db.guestJourneys?.length || 0})</h3></div>
                    <div className="overflow-y-auto h-48 md:h-full">
                        {(db.guestJourneys || []).map(journey => {
                            const guest = db.guests.find(g => g.id === journey.guestId);
                            return (
                                <button key={journey.id} onClick={() => setSelectedJourneyId(journey.id)} className={`w-full text-left p-3 border-b hover:bg-gray-50 transition-colors ${selectedJourneyId === journey.id ? 'bg-brand-green/10' : ''}`}>
                                    <p className="font-semibold text-gray-800">{guest?.fullName}</p>
                                    <p className="text-xs text-gray-500">Status: {journey.status}</p>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className="bg-brand-green h-1.5 rounded-full" style={{ width: `${journey.satisfactionScore}%` }} title={`Satisfação: ${journey.satisfactionScore}%`}></div></div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <main className="w-full md:w-2/3 flex-grow p-6 overflow-y-auto">
                    {selectedJourney && guestForJourney && guest360Data ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <img src={guestForJourney.profilePictureUrl || `https://i.pravatar.cc/150?u=${guestForJourney.id}`} alt={guestForJourney.fullName} className="w-16 h-16 rounded-full" />
                                <div>
                                    <h2 className="text-2xl font-bold text-brand-dark">{guestForJourney.fullName}</h2>
                                    <p className="text-sm text-gray-500 flex items-center gap-4">
                                        <span className="flex items-center gap-1.5"><Mail size={14}/> {guestForJourney.email}</span>
                                        <span className="flex items-center gap-1.5"><Phone size={14}/> {guestForJourney.phone}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <KPICard title="Gasto Total" value={guest360Data.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} />
                                <KPICard title="Reservas" value={guest360Data.totalBookings} icon={ClipboardList} />
                                <KPICard title="Pontos" value={guestForJourney.points || 0} icon={Crown} />
                                <KPICard title="Engajamento IA" value={selectedJourney.engagementLevel} icon={Bot} />
                            </div>

                            <div className="pt-4">
                                {renderTabs()}
                                {renderTabContent()}
                            </div>

                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            <p>Selecione uma jornada para ver o Hub 360° do hóspede.</p>
                        </div>
                    )}
                </main>
            </div>
        </Section>
    );
};

export default GuestJourneyAIView;