
import React, { ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';
import { Section } from '../shared';
import { Calendar, UserCheck, Star, ClipboardList, Loader2, Lightbulb, AlertTriangle, Sparkles, CheckCircle } from 'lucide-react';
import { Staff, StaffTask, TaskStatus, DailyBriefing, BriefingAction, AttentionPoint } from '../../../types';


export const KPICard: React.FC<{ title: string, value: string | number, icon: React.ElementType, prefix?: string, suffix?: string, themeColor?: string }> = ({ title, value, icon: Icon, prefix = '', suffix = '', themeColor = '#4CAF50' }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center border">
        <div className="p-3 rounded-full mr-4" style={{ backgroundColor: `${themeColor}1A` }}>
            <Icon style={{ color: themeColor }} size={24} />
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{prefix}{value}{suffix}</p>
        </div>
    </div>
);

export const ChartContainer: React.FC<{ title: string, children: ReactElement }> = ({ title, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border h-full">
        <h3 className="text-md font-semibold text-gray-700 mb-4">{title}</h3>
        <div style={{ width: '100%', height: '250px' }}>
            <ResponsiveContainer>
                {children}
            </ResponsiveContainer>
        </div>
    </div>
);


export const WorkScheduleWidget: React.FC<{ schedule: any | null }> = ({ schedule }) => {
    if (!schedule) return null;

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2"><Calendar size={18}/> Minha Escala Semanal</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {schedule.schedule.map((dayData: any) => (
                    <div key={dayData.day} className="p-2 bg-gray-50 rounded-md text-sm">
                        <h4 className="font-bold text-gray-800">{dayData.day}</h4>
                        <ul className="list-disc list-inside pl-2 text-gray-700">
                            {dayData.shifts.map((shift: any, index: number) => (
                                <li key={index}><strong>{shift.staffName}:</strong> {shift.shift}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const PerformanceReviewWidget: React.FC<{ review: any | null }> = ({ review }) => {
    if (!review) return null;

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2"><UserCheck size={18}/> Minha Análise de Desempenho</h3>
            <div className="space-y-2 text-sm max-h-60 overflow-y-auto pr-2">
                <div>
                    <h4 className="font-bold text-gray-800">Resumo:</h4>
                    <p className="text-gray-700 italic">"{review.summary}"</p>
                </div>
                <div>
                    <h4 className="font-bold text-green-700">Pontos Fortes:</h4>
                    <ul className="list-disc list-inside pl-2 text-gray-700">
                        {review.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-yellow-700">Sugestões de Melhoria:</h4>
                    <ul className="list-disc list-inside pl-2 text-gray-700">
                        {review.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export const OnboardingPlanWidget: React.FC<{ plan: any | null }> = ({ plan }) => {
    if (!plan) return null;

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border col-span-1 md:col-span-2">
            <h3 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2"><Star size={18}/> Meu Plano de Onboarding</h3>
             <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {plan.plan.map((dayData: any) => (
                    <div key={dayData.day} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-md text-blue-800">Dia {dayData.day}: {dayData.theme}</h4>
                        <p className="text-sm font-semibold text-blue-700 mb-2">Mentor: {dayData.mentor}</p>
                        <ul className="list-disc list-inside pl-2 text-sm text-gray-700 space-y-1">
                            {dayData.tasks.map((task: string, index: number) => <li key={index}>{task}</li>)}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const MyTasksWidget: React.FC<{
    tasks: StaffTask[];
    currentUser: Staff;
    onTaskStatusChange: (taskId: string) => void;
}> = ({ tasks, currentUser, onTaskStatusChange }) => {
    const myTasks = tasks.filter(t => t.assigneeId === currentUser.id);
    const todoTasks = myTasks.filter(t => t.status === TaskStatus.TODO);
    const inProgressTasks = myTasks.filter(t => t.status === TaskStatus.IN_PROGRESS);

    if (myTasks.filter(t => t.status === TaskStatus.TODO || t.status === TaskStatus.IN_PROGRESS).length === 0) {
        return (
            <div className="bg-white p-4 rounded-lg shadow-sm border col-span-1 md:col-span-2">
                <h3 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2"><ClipboardList size={18}/> Minhas Tarefas</h3>
                <div className="text-center py-10 text-gray-500">
                    <p>Você não tem tarefas pendentes. Bom trabalho!</p>
                </div>
            </div>
        );
    }

    const TaskItem = ({ task, key }: { task: StaffTask, key?: any }) => (
        <div className="bg-white p-3 rounded-lg shadow-sm border flex justify-between items-center">
            <span className="text-sm text-gray-700">{task.description}</span>
            <button
                onClick={() => onTaskStatusChange(task.id)}
                className="text-xs font-semibold text-gray-400 hover:text-brand-green"
                title="Mover para o próximo status"
            >
                &rarr;
            </button>
        </div>
    );

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border col-span-1 md:col-span-2">
            <h3 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2"><ClipboardList size={18}/> Minhas Tarefas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="font-semibold text-center mb-2 text-blue-700">A Fazer ({todoTasks.length})</h4>
                    <div className="space-y-2 bg-blue-50 p-2 rounded-lg min-h-[100px] max-h-60 overflow-y-auto">
                        {todoTasks.length > 0 ? todoTasks.map(t => <TaskItem key={t.id} task={t} />) : <p className="text-center text-xs text-gray-500 py-4">Nenhuma tarefa pendente.</p>}
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold text-center mb-2 text-yellow-700">Em Andamento ({inProgressTasks.length})</h4>
                    <div className="space-y-2 bg-yellow-50 p-2 rounded-lg min-h-[100px] max-h-60 overflow-y-auto">
                        {inProgressTasks.length > 0 ? inProgressTasks.map(t => <TaskItem key={t.id} task={t} />) : <p className="text-center text-xs text-gray-500 py-4">Nenhuma tarefa em andamento.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const DailyBriefingWidget: React.FC<{
    briefing: DailyBriefing | null;
    isLoading: boolean;
    onAction: (action: BriefingAction) => void;
}> = ({ briefing, isLoading, onAction }) => {
    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-center min-h-[200px]" style={{borderRadius: 'var(--admin-card-radius)'}}>
                <Loader2 className="animate-spin text-brand-green" size={32} />
                <p className="ml-4 text-gray-600 font-semibold">Gerando seu briefing diário inteligente...</p>
            </div>
        );
    }

    if (!briefing) {
        return null;
    }
    
    const severityClasses: Record<AttentionPoint['severity'] | string, { bg: string; text: string; border: string; }> = {
        High: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-500' },
        Medium: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-500' },
        Low: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-500' },
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border mb-6" style={{borderRadius: 'var(--admin-card-radius)'}}>
            <h2 className="text-2xl font-bold text-brand-dark mb-4 flex items-center gap-2">
                <Sparkles className="text-brand-green"/>
                Seu Briefing Diário Inteligente
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center gap-2">
                        <CheckCircle size={20} className="text-gray-500" />
                        {briefing.summary?.title || "Resumo"}
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                        {Array.isArray(briefing.summary?.points) ? briefing.summary.points.map((point, index) => <li key={index}>{point}</li>) : null}
                    </ul>
                </div>
                {/* Attention Points */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-gray-500"/>
                        {briefing.attentionPoints?.title || "Pontos de Atenção"}
                    </h3>
                    <div className="space-y-3">
                        {Array.isArray(briefing.attentionPoints?.points) ? briefing.attentionPoints.points.map((point, index) => (
                             <div key={index} className={`p-3 rounded-lg border-l-4 ${severityClasses[point.severity]?.bg || 'bg-gray-50'} ${severityClasses[point.severity]?.border || 'border-gray-500'}`}>
                                <p className={`text-sm font-medium ${severityClasses[point.severity]?.text || 'text-gray-800'}`}>{point.text}</p>
                                {point.action && (
                                     <button onClick={() => onAction(point.action!)} className="mt-2 text-xs font-bold text-white bg-brand-dark hover:bg-gray-700 py-1 px-3 rounded-full" style={{borderRadius: 'var(--admin-button-radius)'}}>
                                        {point.action.label}
                                    </button>
                                )}
                            </div>
                        )) : null}
                    </div>
                </div>
                {/* Proactive Suggestions */}
                 <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center gap-2">
                        <Lightbulb size={20} className="text-gray-500"/>
                        {briefing.proactiveSuggestions?.title || "Sugestões Proativas"}
                    </h3>
                    <div className="space-y-3">
                        {Array.isArray(briefing.proactiveSuggestions?.points) ? briefing.proactiveSuggestions.points.map((point, index) => (
                             <div key={index} className="p-3 rounded-lg bg-purple-50 border-l-4 border-purple-500">
                                <p className="text-sm font-medium text-purple-800">{point.text}</p>
                                {point.action && (
                                    <button onClick={() => onAction(point.action!)} className="mt-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 py-1 px-3 rounded-full" style={{borderRadius: 'var(--admin-button-radius)'}}>
                                        {point.action.label}
                                    </button>
                                )}
                            </div>
                        )) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};
