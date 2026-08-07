import React, { useState, useEffect, useRef } from 'react';
import { SynapseMessage } from '../../types';
import { Bot, Loader2, Send, X } from 'lucide-react';

interface SynapseCommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    chatHistory: SynapseMessage[];
    onSendCommand: (command: string) => Promise<void>;
}

export const SynapseCommandPalette: React.FC<SynapseCommandPaletteProps> = ({ isOpen, onClose, chatHistory, onSendCommand }) => {
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Foca no input quando o modal abre
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        // Rola para a última mensagem
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSending) return;
        setIsSending(true);
        const commandToSend = input;
        setInput('');
        await onSendCommand(commandToSend);
        setIsSending(false);
        inputRef.current?.focus();
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-start pt-24" onClick={onClose}>
            <div 
                className="bg-[var(--admin-bg-color)] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col h-[70vh] border"
                onClick={e => e.stopPropagation()}
                style={{ borderRadius: 'var(--admin-card-radius)' }}
            >
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                     <h2 className="text-lg font-bold text-[var(--admin-text-color)] flex items-center gap-2">
                        <Bot className="text-[var(--admin-primary-color)]" size={22}/>
                        Agente SYNAPSE
                     </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><X size={20}/></button>
                </header>

                <main className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-6">
                    {chatHistory.map(msg => (
                         <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'agent' && <div className="w-8 h-8 rounded-full bg-[var(--admin-primary-color)]/10 flex items-center justify-center flex-shrink-0"><Bot className="text-[var(--admin-primary-color)]" size={20}/></div>}
                            <div className={`max-w-xl p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-[var(--admin-primary-color)] text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'}`}>
                                {msg.isLoading ? (
                                    <div className="flex items-center gap-2 text-sm"><Loader2 size={16} className="animate-spin"/> <span>{msg.text}</span></div>
                                ) : (
                                    <div className="prose prose-sm max-w-none whitespace-pre-wrap">{msg.text}</div>
                                )}
                            </div>
                         </div>
                    ))}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="p-4 bg-white border-t rounded-b-2xl" style={{ borderBottomLeftRadius: 'var(--admin-card-radius)', borderBottomRightRadius: 'var(--admin-card-radius)' }}>
                    <form onSubmit={handleSubmit} className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Peça ao SYNAPSE para criar uma campanha, gerar um relatório..."
                            className="input-base"
                            disabled={isSending}
                        />
                        <button type="submit" className="btn-primary p-3" disabled={!input.trim() || isSending} style={{ borderRadius: 'var(--admin-button-radius)' }}>
                            {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};
