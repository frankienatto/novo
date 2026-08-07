import React, { useState, useRef, useEffect } from 'react';
import { Section } from './shared';
import { DBState, Persona, AIEngagementAgent, SocialMediaPlatform } from '../../types';
import { Bot, Sparkles, Loader2, User, MapPin, Heart, BookOpen, Send, CheckCircle, Link as LinkIcon, Play, Instagram, Facebook, Unlink } from 'lucide-react';

interface AIEngagementAgentViewProps {
    db: DBState;
    onGeneratePersonas: (audienceDescription: string) => Promise<void>;
    onConnectAgentAccount: (platform: SocialMediaPlatform) => Promise<void>;
    onDisconnectAgentAccount: () => Promise<void>;
    onRunAgent: () => Promise<void>;
}

const AIEngagementAgentView: React.FC<AIEngagementAgentViewProps> = ({ db, onGeneratePersonas, onConnectAgentAccount, onDisconnectAgentAccount, onRunAgent }) => {
    const agentState = db.aiEngagementAgent;
    const [audienceDescription, setAudienceDescription] = useState(agentState.targetAudienceDescription || '');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isConnecting, setIsConnecting] = useState<SocialMediaPlatform | null>(null);

    const logRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [agentState.log]);

    const handleGenerate = async () => {
        if (!audienceDescription.trim()) return;
        setIsGenerating(true);
        await onGeneratePersonas(audienceDescription);
        setIsGenerating(false);
    };

    const handleConnect = async (platform: SocialMediaPlatform) => {
        setIsConnecting(platform);
        await onConnectAgentAccount(platform);
        setIsConnecting(null);
    };

    const handleDisconnect = async () => {
        await onDisconnectAgentAccount();
    };

    const PersonaCard: React.FC<{ persona: Persona }> = ({ persona }) => (
        <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-bold text-lg text-brand-dark">{persona.name}, {persona.age}</h4>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2"><MapPin size={14}/> {persona.location}</div>
            <p className="text-sm text-gray-700 italic mb-3">"{persona.bio}"</p>
            <div className="mb-3">
                <h5 className="font-semibold text-xs text-gray-600 mb-1 flex items-center gap-1"><Heart size={14}/> Interesses</h5>
                <div className="flex flex-wrap gap-1">
                    {persona.interests.map(interest => <span key={interest} className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">{interest}</span>)}
                </div>
            </div>
            <div>
                <h5 className="font-semibold text-xs text-gray-600 mb-1 flex items-center gap-1"><BookOpen size={14}/> Roadmap de Engajamento</h5>
                <ul className="list-decimal list-inside text-xs space-y-1 text-gray-600">
                    {persona.engagementRoadmap.map((action, i) => <li key={i}>{action.actionType.replace('_', ' ')}: "{action.target}"</li>)}
                </ul>
            </div>
        </div>
    );

    return (
        <Section title="Agente de Engajamento IA" icon={Bot}>
            <p className="text-sm text-gray-600 mb-6">Este agente simula o comportamento de seu público-alvo nas redes sociais para "aquecer" seu Pixel do Meta Ads. Descreva seu público, gere personas e execute a simulação para melhorar a segmentação de seus anúncios.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuration Panel */}
                <div className="space-y-6">
                    {/* Step 1: Audience */}
                    <div className="bg-gray-50 p-4 rounded-xl border">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><span className="bg-brand-green text-white w-6 h-6 flex items-center justify-center rounded-full font-bold text-sm">1</span> Definir Público-Alvo</h3>
                        <textarea
                            value={audienceDescription}
                            onChange={e => setAudienceDescription(e.target.value)}
                            placeholder="Ex: mochileiros de 20-30 anos, da América do Sul, que amam surf, trilhas e festas."
                            className="w-full p-2 border border-gray-300 rounded-md"
                            rows={4}
                        />
                        <button onClick={handleGenerate} disabled={isGenerating || !audienceDescription.trim()} className="mt-2 w-full bg-brand-dark text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                            {isGenerating ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Gerar Personas</>}
                        </button>
                    </div>

                    {/* Step 2: Connect Account */}
                     <div className="bg-gray-50 p-4 rounded-xl border">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><span className="bg-brand-green text-white w-6 h-6 flex items-center justify-center rounded-full font-bold text-sm">2</span> Conectar Conta</h3>
                        {agentState.connectedAccount ? (
                            <div className="bg-green-100 border border-green-300 text-green-800 p-3 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={18} />
                                    <div>
                                        <span className="font-semibold">Conectado ao {agentState.connectedAccount.platform}</span>
                                        <p className="text-xs">{agentState.connectedAccount.accountName}</p>
                                    </div>
                                </div>
                                <button onClick={handleDisconnect} className="text-xs font-semibold hover:underline text-red-700 flex items-center gap-1"><Unlink size={12}/> Desconectar</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleConnect('Facebook')} disabled={isConnecting === 'Facebook'} className="bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:bg-gray-400">
                                     {isConnecting === 'Facebook' ? <Loader2 className="animate-spin"/> : <Facebook size={18}/>} Conectar
                                </button>
                                 <button onClick={() => handleConnect('Instagram')} disabled={isConnecting === 'Instagram'} className="bg-pink-500 text-white font-semibold py-2 px-3 rounded-lg hover:bg-pink-600 flex items-center justify-center gap-2 disabled:bg-gray-400">
                                     {isConnecting === 'Instagram' ? <Loader2 className="animate-spin"/> : <Instagram size={18}/>} Conectar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Step 3: Run Agent */}
                    <div className="bg-gray-50 p-4 rounded-xl border">
                         <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><span className="bg-brand-green text-white w-6 h-6 flex items-center justify-center rounded-full font-bold text-sm">3</span> Executar Ciclo de Engajamento</h3>
                         <button
                            onClick={onRunAgent}
                            disabled={agentState.isRunning || !agentState.connectedAccount || agentState.personas.length === 0}
                            className="w-full bg-brand-green text-white font-bold py-3 rounded-lg hover:bg-brand-green-dark flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                         >
                            {agentState.isRunning ? <Loader2 className="animate-spin"/> : <Play/>}
                            {agentState.isRunning ? 'Agente em Execução...' : 'Iniciar Agente'}
                         </button>
                    </div>
                </div>

                {/* Personas & Log */}
                <div className="space-y-6">
                    {/* Personas */}
                    <div className="bg-gray-50 p-4 rounded-xl border">
                        <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><User size={18}/> Personas Geradas</h3>
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                            {agentState.personas.length > 0 ? (
                                agentState.personas.map(p => <PersonaCard key={p.name} persona={p}/>)
                            ) : (
                                <p className="text-center text-gray-500 text-sm py-10">Gere personas a partir da descrição do seu público para começar.</p>
                            )}
                        </div>
                    </div>
                    {/* Log */}
                    <div className="bg-gray-50 p-4 rounded-xl border">
                        <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Send size={18}/> Log de Atividade do Agente</h3>
                         <div ref={logRef} className="bg-gray-900 text-white font-mono text-xs p-3 rounded-lg h-60 overflow-y-auto">
                            {agentState.log.map((entry, i) => (
                                <p key={i}>
                                    <span className="text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}: </span>
                                    <span className={entry.message.startsWith('---') ? 'text-yellow-400' : 'text-green-400'}>{entry.message}</span>
                                </p>
                            ))}
                         </div>
                    </div>
                </div>
            </div>
        </Section>
    );
};

export default AIEngagementAgentView;