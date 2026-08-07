import React, { useState, useEffect, useRef } from 'react';
import { SynapseMessage, DBState, AdminSection } from '../../types';
import { eventBus } from '../../services/apiService';
import { Bot, Loader2, Send, Activity, Zap, Terminal } from 'lucide-react';

interface SynapseAgentViewProps {
    chatHistory: SynapseMessage[];
    onSendCommand: (command: string) => Promise<void>;
    db: DBState;
    onRunSynapseOrchestrationCycle: () => Promise<void>;
}

const suggestionPrompts = [
    "Mostre o calendário",
    "Adicione uma tarefa para a limpeza",
    "Qual a ocupação hoje?",
    "Crie uma nova reserva",
];

const SynapseAgentView: React.FC<SynapseAgentViewProps> = ({ chatHistory, onSendCommand, db, onRunSynapseOrchestrationCycle }) => {
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isOrchestrating, setIsOrchestrating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const logEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);
    
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [db.synapseOrchestrationLog]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSending) return;

        setIsSending(true);
        await onSendCommand(input);
        setInput('');
        setIsSending(false);
    };

    const handleRunCycle = async () => {
        setIsOrchestrating(true);
        await onRunSynapseOrchestrationCycle();
        setIsOrchestrating(false);
    };

    const handleActionClick = (action: SynapseMessage['action']) => {
        if (!action) return;
        if (action.type === 'navigate') {
            eventBus.emit('synapse-navigate', action.payload);
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[85vh]">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg flex flex-col border">
                 <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-brand-dark flex items-center gap-3">
                        <Bot className="text-brand-green" size={24}/>
                        Comando Manual do Agente SYNAPSE
                    </h2>
                </header>
                
                <main className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-6">
                    {chatHistory.map(msg => (
                        <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'agent' && <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center flex-shrink-0"><Bot className="text-brand-green" size={20}/></div>}
                            <div className={`max-w-xl p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-brand-green text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'}`}>
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

                <footer className="p-4 bg-white border-t rounded-b-2xl">
                    <form onSubmit={handleSubmit} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Peça ao SYNAPSE para criar uma campanha, gerar um relatório..."
                            className="input-base"
                            disabled={isSending}
                        />
                        <button type="submit" className="bg-brand-green text-white p-3 rounded-lg hover:bg-brand-green-dark" disabled={!input.trim() || isSending}>
                            {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </form>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {suggestionPrompts.map(prompt => (
                            <button key={prompt} onClick={() => setInput(prompt)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md hover:bg-gray-200">
                                {prompt}
                            </button>
                        ))}
                    </div>
                </footer>
            </div>

            <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg flex flex-col border">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-brand-dark flex items-center gap-3">
                        <Activity className="text-brand-green" size={22}/>
                        Orquestração Autônoma
                    </h2>
                </header>
                <main className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-4">
                     <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                        A IA monitora eventos e pode executar ações automaticamente, como criar posts de reviews positivos.
                     </div>
                     <button onClick={handleRunCycle} disabled={isOrchestrating} className="w-full bg-brand-dark text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                        {isOrchestrating ? <Loader2 className="animate-spin" /> : <><Zap size={16}/> Executar Ciclo Agora</>}
                     </button>
                     <div>
                         <h3 className="font-semibold text-gray-700 mt-4 mb-2">Log de Atividade Recente</h3>
                         <div ref={logEndRef} className="bg-gray-800 text-white font-mono text-xs p-3 rounded-lg h-64 overflow-y-auto">
                            {db.synapseOrchestrationLog.map(log => (
                                <p key={log.id}>
                                    <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}: </span>
                                    <span className={log.status === 'Error' ? 'text-red-400' : 'text-green-400'}>{log.actionDescription}</span>
                                </p>
                            ))}
                         </div>
                     </div>
                </main>
            </div>
        </div>
    );
};

export default SynapseAgentView;
