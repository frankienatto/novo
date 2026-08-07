import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChatConversation, ChatMessage, MessageSource, Staff } from '../../types';
import { Section } from './shared';
import { MessageSquare, Instagram, Facebook, Globe, Send, Sparkles, Loader2, Bot, Flame, ArrowLeft } from 'lucide-react';
import { generateReplySuggestion } from '../../services/geminiService';

const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 5) return "Agora";
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "a";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min";
    return Math.floor(seconds) + "s";
};

const SourceIcon: React.FC<{ source: MessageSource, size?: number, className?: string }> = ({ source, size = 18, className }) => {
    switch (source) {
        case 'Instagram': return <Instagram size={size} className={`text-pink-500 ${className}`} />;
        case 'Facebook': return <Facebook size={size} className={`text-blue-600 ${className}`} />;
        case 'Website': return <Globe size={size} className={`text-green-600 ${className}`} />;
        default: return null;
    }
};

const IntentIndicator: React.FC<{ intent?: 'High' | 'Medium' | 'Low' }> = ({ intent }) => {
    if (!intent) return null;
    const styles = {
        High: { color: 'text-red-500', count: 3, title: 'Intenção Alta' },
        Medium: { color: 'text-orange-500', count: 2, title: 'Intenção Média' },
        Low: { color: 'text-yellow-500', count: 1, title: 'Intenção Baixa' },
    };
    const { color, count, title } = styles[intent];
    return (
        <div className="flex items-center" title={title}>
            {Array.from({ length: count }).map((_, i) => <Flame key={i} size={14} className={color} />)}
        </div>
    );
};

interface OmniChannelViewProps {
    chatData: {
        conversations: ChatConversation[];
        messages: ChatMessage[];
    };
    currentUser: Staff;
    onSendMessage: (conversationId: string, text: string, senderId: string, senderName: string) => Promise<ChatMessage>;
    onMarkAsRead: (conversationId: string) => Promise<void>;
}

const OmniChannelView: React.FC<OmniChannelViewProps> = ({ chatData, currentUser, onSendMessage, onMarkAsRead }) => {
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastProcessedMessageId = useRef<string | null>(null);


    const sortedConversations = useMemo(() => {
        return [...(chatData?.conversations || [])]
            .filter(c => !c.isInternal)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [chatData?.conversations]);
    
    useEffect(() => {
        if (!selectedConversationId && sortedConversations.length > 0) {
            setSelectedConversationId(sortedConversations[0].id);
        }
        if (selectedConversationId && chatData?.conversations?.find(c => c.id === selectedConversationId)?.unread) {
             onMarkAsRead(selectedConversationId);
        }
    }, [selectedConversationId, chatData?.conversations, sortedConversations, onMarkAsRead]);
    
     useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatData?.messages, selectedConversationId]);

    const activeConversation = useMemo(() => {
        return chatData?.conversations?.find(c => c.id === selectedConversationId);
    }, [selectedConversationId, chatData?.conversations]);

    const activeMessages = useMemo(() => {
        return (chatData?.messages || []).filter(m => m.conversationId === selectedConversationId)
                                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [selectedConversationId, chatData?.messages]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!activeConversation || activeMessages.length === 0) {
                setSuggestions([]);
                return;
            };
            
            const lastMessage = activeMessages[activeMessages.length - 1];

            // Prevents re-fetching for the same message on re-renders
            if (lastMessage.id === lastProcessedMessageId.current) {
                return;
            }

            if (lastMessage.senderId !== currentUser.id) {
                lastProcessedMessageId.current = lastMessage.id; // Mark as processed
                setIsSuggesting(true);
                setSuggestions([]);
                const result = await generateReplySuggestion(lastMessage.text);
                setSuggestions(result?.suggestions || []);
                setIsSuggesting(false);
            } else {
                setSuggestions([]);
                lastProcessedMessageId.current = lastMessage.id; // Mark our own message as processed too
            }
        };

        fetchSuggestions();

    }, [activeMessages, activeConversation, currentUser.id]);


    const handleSelectConversation = (id: string) => {
        setSelectedConversationId(id);
        setMobileView('chat'); // Switch to chat view on mobile
        const conversation = chatData.conversations.find(c => c.id === id);
        if (conversation?.unread) {
            onMarkAsRead(id);
        }
    };
    
    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedConversationId || isSending) return;
        
        setIsSending(true);
        await onSendMessage(selectedConversationId, replyText, currentUser.id, currentUser.name);
        setReplyText('');
        setIsSending(false);
    };

    const categoryColors: Record<string, string> = {
        'Vendas': 'bg-blue-100 text-blue-800',
        'Suporte': 'bg-yellow-100 text-yellow-800',
        'Reservas': 'bg-green-100 text-green-800',
        'Informações': 'bg-purple-100 text-purple-800',
        'Preços': 'bg-indigo-100 text-indigo-800',
        'Feedback': 'bg-pink-100 text-pink-800',
        'default': 'bg-gray-100 text-gray-800',
    };

    const ConversationList = () => (
        <div className="flex-grow overflow-y-auto">
            {sortedConversations.map(conv => (
                <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left p-4 border-b hover:bg-gray-50 flex items-start gap-3 transition-colors ${selectedConversationId === conv.id && mobileView === 'list' ? 'bg-brand-green/10' : ''}`}
                    title={conv.summary || ''}
                >
                    <div className="mt-1 flex-shrink-0"><SourceIcon source={conv.source} /></div>
                    <div className="flex-grow overflow-hidden">
                        <div className="flex justify-between items-center">
                            <p className="font-bold text-gray-800 truncate">{conv.guestName}</p>
                            <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(conv.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                            <IntentIndicator intent={conv.intent} />
                            {conv.category && (
                                <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${categoryColors[conv.category] || categoryColors.default}`}>
                                    {conv.category}
                                </span>
                            )}
                        </div>
                    </div>
                    {conv.unread && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" title="Não lida"></div>}
                </button>
            ))}
        </div>
    );

    const ChatWindow = () => (
        activeConversation ? (
            <>
                <div className="p-4 border-b flex items-center gap-3">
                    <button onClick={() => setMobileView('list')} className="lg:hidden mr-2 text-gray-600 hover:text-gray-800">
                        <ArrowLeft size={20} />
                    </button>
                    <SourceIcon source={activeConversation.source} size={22} />
                    <h3 className="text-lg font-bold text-brand-dark">{activeConversation.guestName}</h3>
                </div>
                <div className="flex-grow p-6 overflow-y-auto bg-gray-50 space-y-4">
                    {activeMessages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                            {msg.senderId !== currentUser.id && msg.isAutoReply && <Bot size={16} className="text-gray-400 mb-1"/>}
                            <div className={`max-w-[80%] p-3 rounded-2xl ${msg.senderId === currentUser.id ? 'bg-brand-green text-white rounded-br-none' : 'bg-white border rounded-bl-none'}`}>
                                <p>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-white border-t">
                    {(isSuggesting || suggestions.length > 0) && (
                        <div className="mb-3">
                            {isSuggesting ? (
                                 <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
                                    <Sparkles size={16} className="text-purple-400" />
                                    Gerando sugestões...
                                 </div>
                            ) : (
                                <>
                                <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5"><Sparkles size={14} className="text-purple-500" /> Sugestões da IA:</p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestions.map((s, i) => (
                                         <button key={i} onClick={() => setReplyText(s)} className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors">
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                </>
                            )}
                        </div>
                    )}
                    <form onSubmit={handleSendReply} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Digite sua resposta..."
                            className="input-base"
                            disabled={isSending}
                        />
                        <button type="submit" className="bg-brand-green text-white p-3 rounded-lg hover:bg-brand-green-dark disabled:bg-gray-400" disabled={!replyText.trim() || isSending}>
                            {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </form>
                </div>
            </>
        ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500">
                <p>Selecione uma conversa para começar.</p>
            </div>
        )
    );


    return (
        <Section title="Central de Atendimento" icon={MessageSquare}>
            <div className="flex h-[75vh] border rounded-lg bg-white overflow-hidden">
                {/* Desktop Conversation List */}
                <aside className="w-1/3 border-r flex-col hidden lg:flex">
                    <div className="p-4 border-b"><h3 className="text-lg font-bold text-brand-dark">Conversas</h3></div>
                    <ConversationList/>
                </aside>

                {/* Mobile View */}
                <div className="w-full flex flex-col lg:hidden">
                    {mobileView === 'list' ? (
                        <>
                            <div className="p-4 border-b"><h3 className="text-lg font-bold text-brand-dark">Conversas</h3></div>
                            <ConversationList />
                        </>
                    ) : (
                        <ChatWindow />
                    )}
                </div>

                {/* Desktop Chat Window */}
                <main className="w-2/3 flex-col hidden lg:flex">
                    <ChatWindow />
                </main>
            </div>
        </Section>
    );
};

export default OmniChannelView;