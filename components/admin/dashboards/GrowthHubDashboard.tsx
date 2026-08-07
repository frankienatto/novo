
import React, { useState, useEffect } from 'react';
import { DBState, AdminSection, GrowthHubInsight, GrowthHubAction, BriefingAction } from '../../../types';
import { Section } from '../shared';
import { 
    generateGrowthHubInsights,
    generateRecommendedActions
} from '../../../services/geminiService';
import { 
    TrendingUp, Loader2, Sparkles, Lightbulb, BarChart2, Palette, CheckCircle, ArrowRight
} from 'lucide-react';

interface MarketingDashboardProps {
    db: DBState;
    onBriefingAction: (action: BriefingAction) => void;
    onCreateCampaignFromOpportunity: (opportunity: any) => Promise<void>;
}

const insightIcons: { [key in GrowthHubInsight['type']]: React.ElementType } = {
    performance: BarChart2,
    opportunity: Lightbulb,
    creative: Palette,
};

const insightColors: { [key in GrowthHubInsight['type']]: { border: string; bg: string; text: string; } } = {
    performance: { border: 'border-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-800' },
    opportunity: { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-800' },
    creative: { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-800' },
};

// Map of icon names from the Gemini API to the actual Lucide components
const actionIconComponents: { [key: string]: React.ElementType } = {
    BarChart2,
    Palette,
    Lightbulb,
};

// A small component to dynamically render the correct icon based on its name
const ActionIcon: React.FC<{ name: string; size: number; className: string }> = ({ name, size, className }) => {
    const IconComponent = actionIconComponents[name] || Lightbulb; // Fallback to Lightbulb icon
    return <IconComponent size={size} className={className} />;
};

export const MarketingDashboard: React.FC<MarketingDashboardProps> = ({ db, onBriefingAction, onCreateCampaignFromOpportunity }) => {
    
    const [insights, setInsights] = useState<GrowthHubInsight[] | null>(null);
    const [actions, setActions] = useState<GrowthHubAction[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHubData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [insightResult, actionResult] = await Promise.all([
                    generateGrowthHubInsights(db),
                    generateRecommendedActions(db)
                ]);
                setInsights(insightResult?.insights || []);
                setActions(actionResult?.actions || []);
            } catch (error) {
                console.error("Failed to load Growth Hub data:", error);
                setError("Não foi possível carregar os insights da IA. Tente novamente mais tarde.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchHubData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const handleActionClick = (action: BriefingAction) => {
        onBriefingAction(action);
    };

    if (isLoading) {
        return (
             <div className="flex items-center justify-center p-10 bg-gray-50 rounded-lg">
                <Loader2 className="animate-spin text-brand-green mr-4" size={32} />
                <span className="text-lg font-semibold text-gray-600">O Painel de Marketing IA está analisando seus dados...</span>
            </div>
        );
    }
    
    if (error) {
        return <div className="p-10 text-center text-red-600 bg-red-50 rounded-lg">{error}</div>;
    }
    
    return (
        <Section title="Painel de Marketing" icon={BarChart2}>
            <p className="text-gray-600 -mt-2 mb-6">Sua central de inteligência para decisões de marketing rápidas e eficazes, alimentada por IA.</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna de Ações Recomendadas */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                        <Sparkles className="text-brand-green"/>
                        Ações Recomendadas
                    </h3>
                    <div className="space-y-3">
                        {actions?.map((action, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm transform hover:-translate-y-1 transition-transform duration-200">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <ActionIcon name={action.icon} size={18} className="text-brand-green" />
                                    {action.title}
                                </h4>
                                <p className="text-sm text-gray-600 my-2">{action.description}</p>
                                <button
                                    onClick={() => handleActionClick(action.action)}
                                    className="w-full bg-brand-dark text-white font-semibold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-700"
                                    style={{ borderRadius: 'var(--admin-button-radius)'}}
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
                             const color = insightColors[insight.type];
                            return (
                                 <div key={index} className={`p-4 rounded-lg border-l-4 ${color.bg} ${color.border}`}>
                                    <h4 className={`font-bold ${color.text} flex items-center gap-2`}><Icon size={16}/> {insight.title}</h4>
                                    <p className="text-sm text-gray-700 my-2">{insight.text}</p>
                                     <button
                                        onClick={() => handleActionClick(insight.action)}
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
