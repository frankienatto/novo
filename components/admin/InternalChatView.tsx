


import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DBState, Staff, ChatConversation, ChatMessage } from '../../types';
import { Section } from './shared';
import { MessageSquare, Send, Loader2, CircleUserRound } from 'lucide-react';

interface InternalChatViewProps {
    db: DBState;
    currentUser: Staff;
    onStartChat: (user1Id: string, user1Name: string, user2Id: string, user2Name: string) => Promise<ChatConversation>;
    onSendMessage: (conversationId: string, text: string, senderId: string, senderName: string) => Promise<ChatMessage>;
}

const InternalChatView: React.FC<InternalChatViewProps> = ({ db, currentUser, onStartChat, onSendMessage }) => {
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
    const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const otherStaff = useMemo(() => {
        return db.staff.filter(s => s.id !== currentUser.id);
    }, [db.staff, currentUser.id]);

    const activeMessages = useMemo(() => {
        if (!activeConversation) return [];
        return db.chatMessages
            .filter(m => m.conversationId === activeConversation.id)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [activeConversation, db.chatMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeMessages]);

    const handleSelectStaff = async (staff: Staff) => {
        setSelectedStaffId(staff.id);
        const conversation = await onStartChat(currentUser.id, currentUser.name, staff.id, staff.name);
        setActiveConversation(conversation);
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !activeConversation || isSending) return;
        
        setIsSending(true);
        await onSendMessage(activeConversation.id, replyText, currentUser.id, currentUser.name);
        setReplyText('');
        setIsSending(false);
    };

    return (
        <Section title="Chat Interno da Equipe" icon={MessageSquare}>
            <div className="flex h-[75vh] border rounded-lg bg-white overflow-hidden">
                <aside className="w-1/3 border-r flex flex-col">
                    <div className="p-4 border-b"><h3 className="text-lg font-bold text-brand-dark">Equipe</h3></div>
                    <div className="flex-grow overflow-y-auto">
                        {otherStaff.map(staff => (
                            <button
                                key={staff.id}
                                onClick={() => handleSelectStaff(staff)}
                                className={`w-full text-left p-4 border-b hover:bg-gray-50 flex items-center gap-3 transition-colors ${selectedStaffId === staff.id ? 'bg-brand-green/10' : ''}`}
                            >
                                <CircleUserRound size={24} className="text-gray-400" />
                                <div>
                                    <p className="font-semibold text-gray-800">{staff.name}</p>
                                    <p className="text-xs text-gray-500">{staff.role}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>
                <main className="w-2/3 flex flex-col">
                    {!activeConversation ? (
                        <div className="flex-grow flex items-center justify-center text-gray-500">
                            <p>Selecione um membro da equipe para iniciar uma conversa.</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b flex items-center gap-3">
                                <h3 className="text-lg font-bold text-brand-dark">{activeConversation.guestName}</h3>
                            </div>
                            <div className="flex-grow p-6 overflow-y-auto bg-gray-50 space-y-4">
                                {activeMessages.map(msg => (
                                    <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-2xl ${msg.senderId === currentUser.id ? `bg-brand-green text-white rounded-br-none` : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                            <p>{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 bg-white border-t">
                                <form onSubmit={handleSendReply} className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        placeholder="Digite sua mensagem..."
                                        className="input-base"
                                        disabled={isSending}
                                    />
                                    <button type="submit" className="bg-brand-green text-white p-3 rounded-lg hover:bg-brand-green-dark disabled:bg-gray-400" disabled={!replyText.trim() || isSending}>
                                        {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </Section>
    );
};

export default InternalChatView;