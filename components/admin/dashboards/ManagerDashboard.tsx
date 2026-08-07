import React, { useMemo } from 'react';
import { DBState, Review, TaskStatus, Staff, BriefingAction, DailyBriefing } from '../../../types';
import { Section } from '../shared';
import { KPICard, ChartContainer, MyTasksWidget, WorkScheduleWidget, PerformanceReviewWidget, OnboardingPlanWidget, DailyBriefingWidget } from './widgets';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Bed, ClipboardCheck, Star, ThumbsDown, ThumbsUp } from 'lucide-react';

interface ManagerDashboardProps {
    db: DBState;
    currentUser: Staff;
    onTaskStatusChange: (taskId: string) => void;
    onApproveReview: (reviewId: string) => Promise<void>;
    onRejectReview: (reviewId: string) => Promise<void>;
    onBriefingAction: (action: BriefingAction) => void;
    dailyBriefing: DailyBriefing | null;
    isLoadingBriefing: boolean;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ db, currentUser, onTaskStatusChange, onApproveReview, onRejectReview, onBriefingAction, dailyBriefing, isLoadingBriefing }) => {
    
    const operationalData = useMemo(() => {
        const occupancy = (db.rooms.filter(r => r.status === 'Ocupado').length / db.rooms.length) * 100;
        const tasksTodo = db.staffTasks.filter(t => t.status === 'A Fazer').length;
        const pendingReviews = db.reviews.filter(r => r.status === 'Pending').length;

        const taskStatusData = Object.values(TaskStatus).map(status => ({
            name: status,
            value: db.staffTasks.filter(t => t.status === status).length
        }));

        return { occupancy, tasksTodo, pendingReviews, taskStatusData };
    }, [db]);

    const COLORS = {
        [TaskStatus.TODO]: '#3B82F6',
        [TaskStatus.IN_PROGRESS]: '#F59E0B',
        [TaskStatus.AWAITING_CHECK]: '#8B5CF6',
        [TaskStatus.DONE]: '#10B981',
    };

    return (
        <div className="space-y-6">
            <DailyBriefingWidget briefing={dailyBriefing} isLoading={isLoadingBriefing} onAction={onBriefingAction} />

            <Section title="Comando Operacional" icon={Bed}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <KPICard title="Ocupação Atual" value={operationalData.occupancy.toFixed(1)} suffix="%" icon={Bed} />
                    <KPICard title="Tarefas a Fazer" value={operationalData.tasksTodo} icon={ClipboardCheck} />
                    <KPICard title="Avaliações Pendentes" value={operationalData.pendingReviews} icon={Star} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <ChartContainer title="Status das Tarefas">
                             <PieChart>
                                <Pie data={operationalData.taskStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} label={({ name, value }) => `${name}: ${value}`}>
                                     {operationalData.taskStatusData.map((entry) => <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as TaskStatus]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ChartContainer>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="bg-white p-4 rounded-lg shadow-sm border h-full">
                            <h3 className="text-md font-semibold text-gray-700 mb-4">Últimas Avaliações Pendentes</h3>
                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                                {db.reviews.filter(r => r.status === 'Pending').map(review => (
                                    <div key={review.id} className="bg-gray-50 p-3 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold">{review.guestName}</p>
                                                    <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"} />)}</div>
                                                </div>
                                                <p className="text-sm text-gray-600 italic mt-1">"{review.comment}"</p>
                                            </div>
                                            <div className="flex gap-2 ml-2">
                                                <button onClick={() => onApproveReview(review.id)} className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200"><ThumbsUp size={16} /></button>
                                                <button onClick={() => onRejectReview(review.id)} className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"><ThumbsDown size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {operationalData.pendingReviews === 0 && <p className="text-center text-gray-500 py-10">Nenhuma avaliação pendente.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

             <div className="mt-6 pt-6 border-t">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Meu Painel</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MyTasksWidget tasks={db.staffTasks} currentUser={currentUser} onTaskStatusChange={onTaskStatusChange} />
                    <WorkScheduleWidget schedule={db.publishedWorkSchedule} />
                    <PerformanceReviewWidget review={db.staffPerformanceReviews[currentUser.id]} />
                    <OnboardingPlanWidget plan={db.onboardingPlans[currentUser.id]} />
                </div>
            </div>
        </div>
    );
};