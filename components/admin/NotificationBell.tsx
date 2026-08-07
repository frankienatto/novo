import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppNotification, AdminSection } from '../../types';
import { Bell, ClipboardList, CheckCircle, ShoppingCart, ClipboardCheck, Star, MessageSquare, AlertTriangle, CheckCheck } from 'lucide-react';

export const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " anos";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " dias";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " horas";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutos";
    return "Agora mesmo";
};

const NotificationBell: React.FC<{
    notifications: AppNotification[];
    onNotificationClick: (notification: AppNotification) => void;
    onMarkAllRead: () => void;
}> = ({ notifications, onNotificationClick, onMarkAllRead }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [ref]);

    const getIconForType = (type: AppNotification['type']) => {
        switch (type) {
            case 'booking': return <ClipboardList className="text-blue-500" size={20} />;
            case 'checkin': return <CheckCircle className="text-green-500" size={20} />;
            case 'pos': return <ShoppingCart className="text-purple-500" size={20} />;
            case 'task': return <ClipboardCheck className="text-yellow-600" size={20} />;
            case 'review': return <Star className="text-yellow-400" size={20} />;
            case 'chat': return <MessageSquare className="text-indigo-500" size={20}/>
            case 'success': return <CheckCircle className="text-green-500" size={20} />;
            case 'error': return <AlertTriangle className="text-red-500" size={20} />;
            default: return <Bell className="text-gray-500" size={20} />;
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setIsOpen(prev => !prev)} className="relative text-brand-secondary hover:text-brand-dark p-2 rounded-full hover:bg-gray-200 transition-colors">
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-5 w-5 text-xs rounded-full bg-red-500 text-white flex items-center justify-center font-bold animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border z-20">
                    <div className="p-3 flex justify-between items-center border-b">
                        <h4 className="font-semibold text-brand-dark">Notificações</h4>
                        {unreadCount > 0 && (
                             <button onClick={() => { onMarkAllRead(); setIsOpen(false); }} className="text-xs text-brand-green hover:underline flex items-center gap-1">
                                <CheckCheck size={14}/> Marcar todas como lidas
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="text-center text-gray-500 py-10">Nenhuma notificação ainda.</p>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} onClick={() => { onNotificationClick(n); setIsOpen(false); }} className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-start gap-3 transition-colors ${!n.read ? 'bg-blue-50' : ''}`}>
                                    <div className="flex-shrink-0 mt-1">{getIconForType(n.type)}</div>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm text-gray-800">{n.title}</p>
                                        <p className="text-sm text-gray-600">{n.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">{timeAgo(n.timestamp)}</p>
                                    </div>
                                    {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" title="Não lida"></div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
