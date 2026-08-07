import React, { useState } from 'react';
import { DBState, Staff } from '../../types';
import { CheckCircle, ChevronDown, Check, Star } from 'lucide-react';
import { Section } from './shared';

interface OnboardingDashboardProps {
    currentUser: Staff;
    db: DBState;
    onCompleteOnboarding: (staffId: string) => Promise<void>;
    onUpdateTaskStatus: (staffId: string, taskDescription: string, completed: boolean) => Promise<void>;
}

export const OnboardingDashboard: React.FC<OnboardingDashboardProps> = ({ currentUser, db, onCompleteOnboarding, onUpdateTaskStatus }) => {
    const [openDay, setOpenDay] = useState<number | null>(1);
    
    const plan = db.onboardingPlans[currentUser.id]?.plan;

    if (!plan) {
        return (
            <Section title={`Bem-vindo(a), ${currentUser.name}!`} icon={Star}>
                <div className="text-center p-8">
                    <h2 className="text-xl font-semibold">Seu plano de integração ainda não está pronto.</h2>
                    <p className="text-gray-600 mt-2">Por favor, peça ao seu gerente para gerar seu plano de onboarding no Gestor de Equipe IA.</p>
                </div>
            </Section>
        );
    }
    
    const allTasks = plan.flatMap((day: any) => day.tasks);
    const completedTasks = currentUser.onboardingTasksCompleted || [];
    const isPlanComplete = allTasks.every((task: string) => completedTasks.includes(task));

    const handleTaskToggle = (taskDescription: string) => {
        const isCompleted = completedTasks.includes(taskDescription);
        onUpdateTaskStatus(currentUser.id, taskDescription, !isCompleted);
    };
    
    const mentor = db.staff.find(s => s.name === plan[0]?.mentor);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border" style={{ borderRadius: 'var(--admin-card-radius)'}}>
                <h1 className="text-3xl font-bold text-brand-dark">Bem-vindo(a) à Equipe, {(currentUser.name || '').split(' ')[0]}!</h1>
                <p className="text-gray-600 mt-2">Este é o seu guia personalizado para seus primeiros dias. Complete as tarefas abaixo para se familiarizar com suas novas responsabilidades e com a nossa plataforma.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    {plan.map((dayData: any) => (
                        <div key={dayData.day} className="bg-white rounded-lg border" style={{ borderRadius: 'var(--admin-card-radius)'}}>
                            <button onClick={() => setOpenDay(openDay === dayData.day ? null : dayData.day)} className="w-full p-4 text-left flex justify-between items-center">
                                <h3 className="font-bold text-lg text-brand-dark">Dia {dayData.day}: {dayData.theme}</h3>
                                <ChevronDown className={`transition-transform ${openDay === dayData.day ? 'rotate-180' : ''}`} />
                            </button>
                            {openDay === dayData.day && (
                                <div className="p-4 border-t space-y-3">
                                    {dayData.tasks.map((task: string, index: number) => (
                                        <label key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="h-5 w-5 rounded text-brand-green focus:ring-brand-green"
                                                checked={completedTasks.includes(task)}
                                                onChange={() => handleTaskToggle(task)}
                                            />
                                            <span className={`flex-1 ${completedTasks.includes(task) ? 'line-through text-gray-500' : ''}`}>
                                                {task}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                
                <div className="space-y-6">
                    {mentor && (
                         <div className="bg-white p-4 rounded-lg shadow-sm border" style={{ borderRadius: 'var(--admin-card-radius)'}}>
                            <h3 className="font-semibold mb-3">Seu Mentor</h3>
                            <div className="flex items-center gap-3">
                                <img src={`https://i.pravatar.cc/150?u=${mentor.id}`} alt={mentor.name} className="w-12 h-12 rounded-full" />
                                <div>
                                    <p className="font-bold">{mentor.name}</p>
                                    <p className="text-sm text-gray-500">{mentor.role}</p>
                                </div>
                            </div>
                         </div>
                    )}
                    {isPlanComplete && (
                         <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center" style={{ borderRadius: 'var(--admin-card-radius)'}}>
                            <CheckCircle className="mx-auto text-green-600 mb-2" size={32}/>
                            <h3 className="font-bold text-green-800">Parabéns!</h3>
                            <p className="text-sm text-green-700 mb-3">Você completou todas as tarefas de integração.</p>
                            <button 
                                onClick={() => onCompleteOnboarding(currentUser.id)}
                                className="w-full bg-brand-green text-white font-bold py-2 rounded-md"
                                style={{ borderRadius: 'var(--admin-button-radius)'}}
                            >
                                Concluir Integração e Acessar Painel
                            </button>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingDashboard;
