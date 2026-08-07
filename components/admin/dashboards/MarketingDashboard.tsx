import React, { useState, useEffect } from 'react';
import { DBState, AdminSection, GrowthHubInsight, GrowthHubAction } from '../../../types';
import { Section } from '../shared';
import { 
    generateGrowthHubInsights,
    generateRecommendedActions
} from '../../../services/geminiService';
import { 
    TrendingUp, Loader2, Sparkles, Lightbulb, BarChart2, Palette, CheckCircle, ArrowRight
} from 'lucide-react';

interface GrowthHubDashboardProps {
    db: DBState;
    setActiveSection: (section: AdminSection) => void;
}

const insightIcons: { [key in GrowthHubInsight['type']]: React.ElementType } = {
    performance: BarChart2,
    opportunity: Lightbulb,
    creative: Palette,
};

const insightColors: { [key in GrowthHubInsight['type']]: string } = {
    performance: 'border-yellow-400 bg-yellow-50',
    opportunity: 'border-blue-400 bg-blue-50',
    creative: 'border-purple-400 bg-purple-50',
};

export const GrowthHubDashboard: React.FC<GrowthHubDashboardProps> = ({ db, setActiveSection }) => {
    
    const [insights, setInsights] = useState<GrowthHubInsight[] | null>(null);
    const [actions, setActions] = useState<GrowthHubAction[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHubData = async () => {
            setIsLoading(true);
            try {
                const [insightResult, actionResult] = await Promise.all([
                    generateGrowthHubInsights(db),
                    generateRecommendedActions(db)
                ]);
                setInsights(insightResult?.insights || []);
                setActions(actionResult?.actions || []);
            } catch (error) {
                console.error("Failed to load Growth Hub data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHubData();
    }, [db]);
    
    if (isLoading) {
        return (
             <div className="flex items-center justify-center p-10">
                <Loader2 className="animate-spin text-brand-green mr-4" size={32} />
                <span className="text-lg font-semibold text-gray-600">Analisando dados de marketing...</span>
            </div>
        );
    }
    
    return (
        <Section title="Centro de Comando de Crescimento" icon={TrendingUp}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna de Ações Recomendadas */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                        <Sparkles className="text-brand-green"/>
                        Ações Recomendadas
                    </h3>
                    <div className="space-y-3">
                        {actions?.map((action, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-gray-800">{action.title}</h4>
                                <p className="text-sm text-gray-600 my-2">{action.description}</p>
                                <button
                                    onClick={() => setActiveSection(action.action.payload?.section)}
                                    className="w-full bg-brand-dark text-white font-semibold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-700"
                                >
                                    {action.action.label} <ArrowRight size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Coluna de Insights da IA */}
                <div className="lg:col-span-2 space-y-4">
                     <h3 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                        <Lightbulb className="text-brand-green"/>
                        Insights da IA
                    </h3>
                    <div className="space-y-3">
                        {insights?.map((insight, index) => {
                             const Icon = insightIcons[insight.type];
                             const colorClass = insightColors[insight.type];
                            return (
                                 <div key={index} className={`p-4 rounded-lg border-l-4 ${colorClass}`}>
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2"><Icon size={16}/> {insight.title}</h4>
                                    <p className="text-sm text-gray-600 my-2">{insight.text}</p>
                                     <button
                                        onClick={() => setActiveSection(insight.action.payload?.section)}
                                        className="text-sm font-bold text-brand-green hover:underline"
                                    >
                                        {insight.action.label}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </Section>
    );
};
