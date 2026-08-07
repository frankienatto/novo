


import React, { useState, useEffect, useRef } from 'react';
import { ChatConversation, ChatMessage } from '../types';
import { MessageSquare, X, Send, User, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface LiveChatWidgetProps {
    chatData: {
        conversations: ChatConversation[];
        messages: ChatMessage[];
    };
    onStartChat: (name: string, firstMessage: string) => Promise<{ conversation: ChatConversation; message: ChatMessage }>;
    onSendMessage: (conversationId: string, text: string, senderId: string, senderName: string) => Promise<ChatMessage>;
}

const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({ chatData, onStartChat, onSendMessage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [stage, setStage] = useState<'initial' | 'chatting'>('initial');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const guestIdRef = useRef<string | null>(null);

    const activeMessages = (activeConversation && chatData?.messages)
        ? chatData.messages.filter(m => m.conversationId === activeConversation.id)
          .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        : [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeMessages]);

    const handleStartChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !message.trim() || isSending) return;

        setIsSending(true);
        try {
            const { conversation } = await onStartChat(name, message);
            setActiveConversation(conversation);
            // We create a temporary, but consistent ID for this session
            guestIdRef.current = `GUEST_WEBSITE_${name.replace(/\s/g, '_')}_${Date.now()}`;
            setStage('chatting');
            setMessage('');
        } catch (error) {
            console.error("Failed to start chat", error);
        } finally {
            setIsSending(false);
        }
    };
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !activeConversation || isSending || !guestIdRef.current) return;

        setIsSending(true);
        try {
            await onSendMessage(activeConversation.id, message, guestIdRef.current, name);
            setMessage('');
        } catch (error) {
             console.error("Failed to send message", error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-80 h-[28rem] bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out">
                    <header className="bg-brand-green text-white p-4 rounded-t-2xl flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">Fale Conosco!</h3>
                            <p className="text-xs">Estamos online para ajudar</p>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
                    </header>
                    
                    <div className="flex-grow overflow-y-auto bg-gray-50 p-4 space-y-3">
                        {stage === 'initial' && (
                            <div className="text-center p-4">
                                <p className="text-gray-700">Para começar, por favor, nos informe seu nome e sua pergunta.</p>
                            </div>
                        )}
                        {stage === 'chatting' && (
                            activeMessages.map(msg => (
                                <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === guestIdRef.current ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-2 rounded-xl ${msg.senderId === guestIdRef.current ? 'bg-brand-green text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                        <p className="text-sm">{msg.text}</p>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    <footer className="p-4 bg-white border-t rounded-b-2xl">
                         {stage === 'initial' ? (
                            <form onSubmit={handleStartChat} className="space-y-2">
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" className="input-chat" required />
                                <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Sua mensagem..." className="input-chat" required />
                                <button type="submit" disabled={isSending} className="btn-chat-send w-full flex items-center justify-center">
                                    {isSending ? <Loader2 className="animate-spin" /> : 'Iniciar Chat'}
                                </button>
                            </form>
                         ) : (
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Digite sua mensagem..." className="input-chat flex-grow" required />
                                <button type="submit" disabled={isSending || !message.trim()} className="btn-chat-send p-3 flex items-center justify-center">
                                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18}/>}
                                </button>
                            </form>
                         )}
                    </footer>
                </div>
            )}
            
            {/* Chat Bubble */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="bg-brand-green text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:bg-brand-green-dark transition-transform hover:scale-110"
                aria-label="Abrir chat"
            >
                {isOpen ? <ChevronDown size={32} /> : <MessageSquare size={32} />}
            </button>
            <style>{`
                .input-chat { width: 100%; padding: 0.5rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.875rem; }
                .btn-chat-send { background-color: #4CAF50; color: white; font-weight: 600; padding: 0.5rem; border-radius: 0.5rem; transition: background-color 0.2s; }
                .btn-chat-send:hover { background-color: #388E3C; }
                .btn-chat-send:disabled { background-color: #9E9E9E; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default LiveChatWidget;