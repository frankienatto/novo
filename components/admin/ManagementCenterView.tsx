import React, { useState, useEffect } from 'react';
import { ManagementReport } from '../../types';
import { Section } from './shared';
import { ShieldCheck, Loader2, Sparkles, DollarSign, FolderKanban, UsersRound, Warehouse, Lightbulb } from 'lucide-react';

interface ManagementCenterViewProps {
    onGetManagementReport: () => Promise<ManagementReport | null>;
}

const ManagementCenterView: React.FC<ManagementCenterViewProps> = ({ onGetManagementReport }) => {
    const [report, setReport] = useState<ManagementReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateReport = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await onGetManagementReport();
            if (result) {
                setReport(result);
            } else {
                setError("Não foi possível gerar o relatório.");
            }
        } catch (e) {
            console.error(e);
            setError("Ocorreu um erro ao se comunicar com a IA.");
        }
        setIsLoading(false);
    };
    
    useEffect(() => {
        // Gera o relatório automaticamente ao carregar a página
        handleGenerateReport();
    }, []);
    
    const ResultCard: React.FC<{title: string, icon: React.ElementType, children: React.ReactNode, className?: string}> = ({title, icon: Icon, children, className}) => (
        <div className={`p-4 rounded-lg border ${className}`}>
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Icon size={18} /> {title}</h4>
            <div className="space-y-2 text-sm text-gray-700">{children}</div>
        </div>
    );

    const priorityClasses = {
        'Alta': 'border-red-500 text-red-800 bg-red-100',
        'Média': 'border-yellow-500 text-yellow-800 bg-yellow-100',
        'Baixa': 'border-blue-500 text-blue-800 bg-blue-100',
    };

    return (
        <Section title="Comando Central" icon={ShieldCheck}>
            <div className="bg-gray-50 p-6 rounded-2xl border">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-brand-dark">Relatório de Gestão Semanal da IA</h3>
                        <p className="text-gray-600 mt-1">O Gerente Virtual IA analisou todas as áreas e gerou o relatório consolidado abaixo.</p>
                    </div>
                     <button onClick={handleGenerateReport} disabled={isLoading} className="w-full md:w-auto bg-brand-dark text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                        {isLoading ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Reanalisar Dados</>}
                    </button>
                </div>

                {isLoading && (
                    <div className="text-center py-20">
                        <Loader2 className="animate-spin text-brand-green mx-auto" size={48} />
                        <p className="mt-4 text-gray-600">O Gerente Virtual está analisando os dados...</p>
                    </div>
                )}
                
                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

                {report && (
                    <div className="mt-8 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                             <ResultCard title="Resumo Financeiro" icon={DollarSign} className="bg-green-50 border-green-200">
                                <p><strong>Receita:</strong> {report.financialSummary?.totalRevenue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}</p>
                                <p><strong>Despesas:</strong> {report.financialSummary?.totalExpenses?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}</p>
                                <p className="font-bold border-t pt-2 mt-2">Lucro Líquido: {report.financialSummary?.netProfit?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}</p>
                                <p className="text-xs italic mt-2"><strong>Insight IA:</strong> {report.financialSummary?.keyInsight || '-'}</p>
                            </ResultCard>
                             <ResultCard title="Status dos Projetos" icon={FolderKanban} className="bg-blue-50 border-blue-200">
                                <p><strong>Projetos Ativos:</strong> {report.projectStatus?.activeProjects || 0}</p>
                                {report.projectStatus?.atRiskProjects && report.projectStatus.atRiskProjects.length > 0 && (
                                    <div>
                                        <p className="font-bold text-yellow-800">Projetos em Risco:</p>
                                        <ul className="list-disc list-inside">
                                            {report.projectStatus.atRiskProjects.map((p, i) => <li key={i}>{p.name}: {p.reason}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </ResultCard>
                             <ResultCard title="Performance da Equipe" icon={UsersRound} className="bg-indigo-50 border-indigo-200">
                                <p><strong>Tarefas Concluídas:</strong> {report.teamPerformance?.tasksCompleted || 0}</p>
                                <p><strong>Destaque:</strong> {report.teamPerformance?.topPerformer?.name || '-'} ({report.teamPerformance?.topPerformer?.completedTasks || 0} tarefas)</p>
                                <p className="text-xs italic mt-2"><strong>Insight IA:</strong> {report.teamPerformance?.keyInsight || '-'}</p>
                            </ResultCard>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                             <ResultCard title="Alertas de Inventário" icon={Warehouse} className="bg-yellow-50 border-yellow-200">
                                {report.inventoryAlerts?.lowStockItems && report.inventoryAlerts.lowStockItems.length > 0 ? (
                                    <ul className="list-disc list-inside">
                                        {report.inventoryAlerts.lowStockItems.map((item, i) => <li key={i}>{item.name} (Estoque: {item.stock})</li>)}
                                    </ul>
                                ) : <p>Nenhum item com estoque baixo.</p>}
                            </ResultCard>
                             <ResultCard title="Recomendações Estratégicas" icon={Lightbulb} className="bg-purple-50 border-purple-200">
                                 <ul className="space-y-2">
                                     {report.strategicRecommendations?.map((rec, i) => (
                                         <li key={i} className={`p-2 rounded-md border-l-4 ${priorityClasses[rec.priority as keyof typeof priorityClasses] || 'border-gray-500 bg-gray-100 text-gray-800'}`}>
                                            <strong>{rec.priority}:</strong> {rec.recommendation}
                                         </li>
                                     ))}
                                 </ul>
                            </ResultCard>
                        </div>
                    </div>
                )}
            </div>
        </Section>
    );
};

export default ManagementCenterView;