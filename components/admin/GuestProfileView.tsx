import React, { useState, useMemo } from 'react';
import { DBState, Guest, Booking, Transaction, RedeemedReward, LoyaltyLevel, Achievement, EventParticipant, ActivityParticipant, GuestPost } from '../../types';
import { ArrowLeft, User, Calendar, Wallet, Activity as ActivityIcon, Trophy, Edit, Save, X, Loader2, BookOpen, CheckCircle, Eye, EyeOff } from 'lucide-react';

interface GuestProfileViewProps {
    guestId: string;
    db: DBState;
    onBack: () => void;
    onNavigateToBooking: () => void;
    onGuestUpdate: (guest: Guest) => Promise<void>;
    onFinalizeAccount: (bookingId: string) => Promise<void>;
}

const GuestProfileView: React.FC<GuestProfileViewProps> = ({ guestId, db, onBack, onNavigateToBooking, onGuestUpdate, onFinalizeAccount }) => {
    
    type Tab = 'overview' | 'bookings' | 'financials' | 'activity' | 'gamification';
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const guest = useMemo(() => db.guests.find(g => g.id === guestId), [guestId, db.guests]);
    const [editableGuest, setEditableGuest] = useState<Guest | null>(guest || null);
    
    // Data Memos
    const guestBookings = useMemo(() => db.bookings.filter(b => b.guestId === guestId).sort((a,b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()), [guestId, db.bookings]);
    const guestActivities = useMemo(() => ({
        events: db.eventParticipants.filter(p => p.guestId === guestId),
        activities: db.activityParticipants.filter(p => p.guestId === guestId),
        posts: db.guestPosts.filter(p => p.guestId === guestId)
    }), [guestId, db.eventParticipants, db.activityParticipants, db.guestPosts]);
    const guestRewards = useMemo(() => db.redeemedRewards.filter(r => r.guestId === guestId), [guestId, db.redeemedRewards]);

    if (!guest || !editableGuest) {
        return <div>Hóspede não encontrado.</div>;
    }
    
    const handleSave = async () => {
        setIsEditing(false);
        await onGuestUpdate(editableGuest);
    };

    const handleFinalize = async (bookingId: string) => {
        if(confirm("Tem certeza que deseja finalizar a conta desta reserva? O saldo será zerado.")) {
            await onFinalizeAccount(bookingId);
        }
    }
    
    const currentLoyaltyLevel = db.loyaltyLevels
        .filter(l => (guest.points || 0) >= l.minPoints)
        .sort((a, b) => b.minPoints - a.minPoints)[0];

    // Render logic for each tab
    const renderOverview = () => (
        <div className="space-y-4">
            {isEditing ? (
                <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                    <input value={editableGuest.fullName} onChange={e => setEditableGuest({...editableGuest, fullName: e.target.value})} className="input-base"/>
                    <input value={editableGuest.email} onChange={e => setEditableGuest({...editableGuest, email: e.target.value})} className="input-base"/>
                    <input value={editableGuest.phone} onChange={e => setEditableGuest({...editableGuest, phone: e.target.value})} className="input-base"/>
                    <input type="password" value={editableGuest.password || ''} onChange={e => setEditableGuest({...editableGuest, password: e.target.value})} className="input-base" placeholder="Nova Senha (deixe em branco para não alterar)"/>
                    <textarea value={editableGuest.bio || ''} onChange={e => setEditableGuest({...editableGuest, bio: e.target.value})} className="input-base" placeholder="Bio do hóspede..."/>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsEditing(false)} className="bg-gray-200 py-1 px-3 rounded-md text-sm">Cancelar</button>
                        <button onClick={handleSave} className="bg-brand-green text-white py-1 px-3 rounded-md text-sm">Salvar</button>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p><strong>Email:</strong> {guest.email}</p>
                            <p><strong>Telefone:</strong> {guest.phone}</p>
                            <div className="flex items-center gap-2">
                                <strong>Senha:</strong>
                                {guest.password ? (
                                    <>
                                        <span className="font-mono text-sm">{showPassword ? guest.password : '********'}</span>
                                        <button onClick={() => setShowPassword(!showPassword)} title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-sm text-gray-500">Nenhuma senha definida</span>
                                )}
                            </div>
                            <p className="mt-2 text-sm italic">{guest.bio || 'Nenhuma bio adicionada.'}</p>
                        </div>
                        <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                    <p className="text-sm font-semibold">Reserva Atual</p>
                    <p className="font-bold text-lg">{guestBookings.find(b=>b.status === 'Checked-in')?.id || 'N/A'}</p>
                </div>
                 <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                    <p className="text-sm font-semibold">Saldo Devedor Total</p>
                    <p className="font-bold text-lg">{guestBookings.reduce((sum, b) => sum + b.balance, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                 <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
                    <p className="text-sm font-semibold">Pontos de Fidelidade</p>
                    <p className="font-bold text-lg">{guest.points || 0}</p>
                </div>
            </div>
        </div>
    );
    
    const renderBookings = () => (
        <div className="space-y-3">
            {guestBookings.map(b => (
                 <div key={b.id} className="bg-gray-50 p-3 rounded-lg border">
                    <p><strong>Reserva:</strong> {b.id} - <strong>Quarto:</strong> {db.rooms.find(r => r.id === b.roomId)?.name}</p>
                    <p className="text-sm"><strong>Período:</strong> {new Date(b.checkIn).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} a {new Date(b.checkOut).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                    <p className="text-sm"><strong>Status:</strong> {b.status}</p>
                </div>
            ))}
        </div>
    );
    
    const renderFinancials = () => {
        const totalBalance = guestBookings.reduce((sum, b) => sum + b.balance, 0);
    
        return (
            <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex justify-between items-center">
                    <span className="font-bold text-lg">Saldo Devedor Total: {totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                {guestBookings.filter(b => b.balance > 0).map(b => {
                    const bookingTransactions = db.transactions.filter(t => t.bookingId === b.id && t.paymentMethod === 'Conta do Quarto');
                    const allItems = bookingTransactions.flatMap(t => t.items);
    
                    return (
                        <div key={b.id} className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold">Reserva {b.id}</h4>
                                    <p className="text-red-600 font-semibold">Saldo devedor: {b.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                </div>
                                <button onClick={() => handleFinalize(b.id)} className="bg-green-500 text-white font-semibold py-1 px-3 rounded-md text-sm">Finalizar Conta</button>
                            </div>
                            
                            {allItems.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                    <h5 className="text-sm font-semibold mb-2">Itens Consumidos:</h5>
                                    <ul className="space-y-1 text-sm">
                                        {allItems.map((item, index) => (
                                            <li key={index} className="flex justify-between items-center">
                                                <span>{item.quantity}x {item.name}</span>
                                                <span className="font-mono">{(item.quantity * item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                })}
                 {guestBookings.filter(b => b.balance > 0).length === 0 && (
                    <div className="text-center p-6 bg-gray-50 rounded-lg border">
                        <CheckCircle className="mx-auto text-green-500" size={32}/>
                        <p className="mt-2 font-semibold">Este hóspede não possui saldos devedores.</p>
                    </div>
                 )}
            </div>
        )
    };
    
    const renderActivity = () => (
         <div className="space-y-2">
            <h4 className="font-bold">Eventos Participados:</h4>
            {guestActivities.events.map(p => <p key={p.eventId} className="text-sm">- {db.propertyEvents.find(e => e.id === p.eventId)?.title}</p>)}
             <h4 className="font-bold mt-4">Atividades da Comunidade:</h4>
            {guestActivities.activities.map(p => <p key={p.activityId} className="text-sm">- {db.guestActivities.find(a => a.id === p.activityId)?.title}</p>)}
         </div>
    );
    
    const renderGamification = () => (
        <div className="space-y-4">
             <div className="bg-gray-50 p-3 rounded-lg border">
                <p><strong>Nível de Fidelidade:</strong> {currentLoyaltyLevel?.name} ({guest.points} pontos)</p>
            </div>
            <div>
                <h4 className="font-bold">Conquistas Desbloqueadas:</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                    {(guest.unlockedAchievements || []).map(achId => {
                        const ach = db.achievements.find(a => a.id === achId);
                        return <span key={achId} className="text-xs bg-yellow-100 text-yellow-800 p-1 px-2 rounded-full">{ach?.name}</span>
                    })}
                </div>
            </div>
             <div>
                <h4 className="font-bold">Recompensas Resgatadas:</h4>
                <ul className="list-disc list-inside pl-2 text-sm">
                    {guestRewards.map(r => <li key={r.id}>{r.rewardName} (custou {r.cost} pontos)</li>)}
                </ul>
            </div>
        </div>
    );

    const tabs = [
        { id: 'overview', label: 'Visão Geral', icon: User },
        { id: 'bookings', label: 'Reservas', icon: Calendar },
        { id: 'financials', label: 'Financeiro', icon: Wallet },
        { id: 'activity', label: 'Atividades', icon: ActivityIcon },
        { id: 'gamification', label: 'Gamificação', icon: Trophy },
    ];
    
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"><ArrowLeft size={16}/> Voltar para a Lista</button>
            <div className="flex items-center gap-4 mb-6">
                <img src={guest.profilePictureUrl || `https://i.pravatar.cc/150?u=${guest.id}`} alt={guest.fullName} className="w-20 h-20 rounded-full object-cover"/>
                <div>
                    <h2 className="text-3xl font-bold text-brand-dark">{guest.fullName}</h2>
                    <p className="text-gray-500">ID do Hóspede: {guest.id}</p>
                </div>
            </div>
            
             <div className="flex border-b mb-6">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold ${activeTab === tab.id ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}>
                        <tab.icon size={16}/> {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'bookings' && renderBookings()}
            {activeTab === 'financials' && renderFinancials()}
            {activeTab === 'activity' && renderActivity()}
            {activeTab === 'gamification' && renderGamification()}

        </div>
    );
};

export default GuestProfileView;