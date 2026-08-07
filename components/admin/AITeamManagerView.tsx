
import React, { useState } from 'react';
import { Section } from './shared';
import { generateWorkSchedule, generateOnboardingPlan, analyzeTeamPerformance } from '../../services/geminiService';
import { DBState, Staff, StaffTask } from '../../types';
import { Loader2, BrainCircuit, Calendar, TrendingUp, UserCog, Send, Save } from 'lucide-react';

interface AITeamManagerViewProps {
    db: DBState;
    onPublishWorkSchedule: (schedule: any) => Promise<void>;
    onSaveStaffPerformanceReview: (staffId: string, review: any) => Promise<void>;
    onSaveOnboardingPlan: (staffId: string, plan: any) => Promise<void>;
}


const AITeamManagerView: React.FC<AITeamManagerViewProps> = ({ db, onPublishWorkSchedule, onSaveStaffPerformanceReview, onSaveOnboardingPlan }) => {
    // State for Schedule Generator
    const [scheduleConstraints, setScheduleConstraints] = useState('');
    const [scheduleResult, setScheduleResult] = useState<{ schedule: any[] } | null>(null);
    const [isScheduleLoading, setIsScheduleLoading] = useState(false);

    // State for Onboarding Generator
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [onboardingResult, setOnboardingResult] = useState<{ plan: any[] } | null>(null);
    const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);

    // State for Performance Analysis
    const [performanceTargetId, setPerformanceTargetId] = useState<string>('');
    const [performanceResult, setPerformanceResult] = useState<any | null>(null);
    const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);

    const handleGenerateSchedule = async () => {
        setIsScheduleLoading(true);
        setScheduleResult(null);
        const result = await generateWorkSchedule(db.staff, scheduleConstraints);
        setScheduleResult(result);
        setIsScheduleLoading(false);
    };

    const handleGenerateOnboarding = async () => {
        if (!selectedEmployeeId) {
            alert("Por favor, selecione um funcionário.");
            return;
        }
        const employee = db.staff.find(s => s.id === selectedEmployeeId);
        if (!employee) return;

        setIsOnboardingLoading(true);
        setOnboardingResult(null);
        const result = await generateOnboardingPlan(employee.name, employee.role, db.staff);
        setOnboardingResult(result);
        setIsOnboardingLoading(false);
    };

    const handleAnalyzePerformance = async () => {
        setIsPerformanceLoading(true);
        setPerformanceResult(null);
        const result = await analyzeTeamPerformance(db.staffTasks, db.staff, performanceTargetId || undefined);
        setPerformanceResult(result);
        setIsPerformanceLoading(false);
    };

    const handleSavePerformanceReview = async () => {
        if (performanceTargetId && performanceResult) {
            await onSaveStaffPerformanceReview(performanceTargetId, performanceResult);
            alert("Análise de desempenho salva e enviada para o funcionário!");
        }
    };

    return (
        <div className="space-y-8">
            {/* Top Row: Schedule and Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Section title="Gerador de Escala de Trabalho" icon={Calendar}>
                    <p className="text-sm text-gray-600 mb-4">Gere uma escala semanal para a equipe, adicionando restrições se necessário.</p>
                    <textarea 
                        value={scheduleConstraints}
                        onChange={(e) => setScheduleConstraints(e.target.value)}
                        placeholder="Ex: Beatriz precisa de folga na quarta-feira."
                        className="w-full p-2 border border-gray-300 rounded-md mb-4"
                        rows={2}
                    />
                    <button onClick={handleGenerateSchedule} disabled={isScheduleLoading} className="w-full bg-brand-dark text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                        {isScheduleLoading ? <Loader2 className="animate-spin" /> : <><BrainCircuit size={18}/> Gerar Escala</>}
                    </button>
                    {scheduleResult?.schedule && (
                        <>
                            <div className="mt-6 space-y-4 max-h-96 overflow-y-auto pr-2">
                                {scheduleResult.schedule.map((dayData: any) => (
                                    <div key={dayData.day} className="p-3 bg-gray-50 rounded-lg">
                                        <h4 className="font-bold text-gray-800">{dayData.day}</h4>
                                        <ul className="list-disc list-inside pl-2 text-sm text-gray-700">
                                            {dayData.shifts.map((shift: any, index: number) => (
                                                <li key={index}><strong>{shift.staffName}:</strong> {shift.shift}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => onPublishWorkSchedule(scheduleResult)} className="mt-4 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                                <Send size={16} /> Publicar Escala
                            </button>
                        </>
                    )}
                </Section>

                <Section title="Análise de Performance" icon={TrendingUp}>
                    <p className="text-sm text-gray-600 mb-4">Selecione um membro da equipe para uma análise individual, ou deixe em branco para analisar a equipe toda.</p>
                    <div className="flex gap-2 mb-4">
                        <select
                            value={performanceTargetId}
                            onChange={(e) => setPerformanceTargetId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                            <option value="">Análise de Equipe Completa</option>
                            {db.staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <button onClick={handleAnalyzePerformance} disabled={isPerformanceLoading} className="bg-brand-dark text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                            {isPerformanceLoading ? <Loader2 className="animate-spin" /> : <><BrainCircuit size={18}/> Analisar</>}
                        </button>
                    </div>
                    {performanceResult && (
                        <>
                        <div className="mt-6 space-y-3 text-sm max-h-80 overflow-y-auto pr-2">
                            {performanceResult.mostProductive && !performanceTargetId && (
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <h4 className="font-bold text-blue-800">Destaque da Equipe</h4>
                                    <p><strong>{performanceResult.mostProductive.name}</strong> - {performanceResult.mostProductive.reason}</p>
                                </div>
                            )}
                            <div>
                                <h4 className="font-bold text-gray-800">Resumo:</h4>
                                <p className="text-gray-700">{performanceResult.summary}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-green-700">Pontos Fortes:</h4>
                                <ul className="list-disc list-inside pl-2 text-gray-700">
                                    {performanceResult.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-yellow-700">Sugestões de Melhoria:</h4>
                                <ul className="list-disc list-inside pl-2 text-gray-700">
                                    {performanceResult.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        </div>
                         {performanceTargetId && (
                            <button
                                onClick={handleSavePerformanceReview}
                                className="mt-4 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                            >
                                <Save size={16} /> Salvar e Enviar Análise
                            </button>
                        )}
                        </>
                    )}
                </Section>
            </div>
            
            {/* Bottom Row: Onboarding */}
            <Section title="Plano de Onboarding para Novos Funcionários" icon={UserCog}>
                 <p className="text-sm text-gray-600 mb-4">Selecione um membro da equipe para gerar um plano de integração de 3 dias.</p>
                 <div className="grid grid-cols-1 mb-4">
                     <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Funcionário</label>
                        <select 
                            value={selectedEmployeeId} 
                            onChange={(e) => setSelectedEmployeeId(e.target.value)} 
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                           <option value="">Selecione um funcionário</option>
                           {db.staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                        </select>
                     </div>
                 </div>
                 <button onClick={handleGenerateOnboarding} disabled={isOnboardingLoading || !selectedEmployeeId} className="w-full bg-brand-dark text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                    {isOnboardingLoading ? <Loader2 className="animate-spin" /> : <><BrainCircuit size={18}/> Gerar Plano de Onboarding</>}
                 </button>
                 {onboardingResult?.plan && (
                    <>
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {onboardingResult.plan.map((dayData: any) => (
                                <div key={dayData.day} className="p-4 bg-gray-50 rounded-lg border">
                                    <h4 className="font-bold text-lg text-brand-dark">Dia {dayData.day}: {dayData.theme}</h4>
                                    <p className="text-sm font-semibold text-brand-green mb-2">Mentor: {dayData.mentor}</p>
                                    <ul className="list-disc list-inside pl-2 text-sm text-gray-700 space-y-1">
                                        {dayData.tasks.map((task: string, index: number) => <li key={index}>{task}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                         <button onClick={() => onSaveOnboardingPlan(selectedEmployeeId, onboardingResult)} className="mt-4 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                            <Save size={16} /> Salvar e Atribuir Plano
                        </button>
                    </>
                 )}
            </Section>
        </div>
    );
};

export default AITeamManagerView;
