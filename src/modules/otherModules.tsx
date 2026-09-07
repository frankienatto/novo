import React from 'react';
import { Card, Badge, SynapseContextBar } from '../shared/ui';
import { 
  Users, 
  Target, 
  Cpu, 
  CheckSquare, 
  Compass, 
  Activity, 
  Calendar, 
  BookOpen, 
  ConciergeBell, 
  Brush, 
  Wrench, 
  Globe 
} from 'lucide-react';

export const SalesModule: React.FC = () => (
  <div className="space-y-5 pb-10">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          Sales CRM & Pipeline Comercial
        </h2>
        <p className="text-xs text-slate-500">Gestão Comercial, Grupos, Eventos & Pipeline de Reservas Diretas</p>
      </div>
      <Badge variant="success">Fase 4.3 Integrada</Badge>
    </div>

    {/* Synapse Context Bar — Sales */}
    <SynapseContextBar module="sales" defaultExpanded={true} />

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Pipeline de Grupos</span>
        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">R$ 142.800</span>
      </div>
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Taxa de Fechamento</span>
        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">38.2%</span>
      </div>
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Leads Qualificados</span>
        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">19 ativos</span>
      </div>
    </div>
  </div>
);

export const MarketingModule: React.FC = () => (
  <div className="space-y-5 pb-10">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-600" />
          Marketing Intelligence & Aquisição
        </h2>
        <p className="text-xs text-slate-500">Segmentação de Hóspedes, Retenção de LTV & Campanhas de Canal Direto</p>
      </div>
      <Badge variant="success">Fase 4.3 Integrada</Badge>
    </div>

    {/* Synapse Context Bar — Marketing */}
    <SynapseContextBar module="marketing" defaultExpanded={true} />

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">CAC Médio</span>
        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">R$ 48,20</span>
      </div>
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">ROAS Campanhas</span>
        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">6.4x</span>
      </div>
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">LTV Projetado</span>
        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">R$ 1.890</span>
      </div>
    </div>
  </div>
);

export const DirectBookingModule: React.FC = () => (
  <div className="space-y-5 pb-10">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-600" />
          Motor de Reservas Diretas & Web Engine
        </h2>
        <p className="text-xs text-slate-500">Conversão de tráfego próprio, pacotes e personalização de checkout</p>
      </div>
      <Badge variant="success">Fase 4.3 Integrada</Badge>
    </div>

    {/* Synapse Context Bar — Direct Booking */}
    <SynapseContextBar module="direct_booking" defaultExpanded={true} />

    <Card title="Canais Diretos & Integração OTA">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-700 dark:text-slate-300">
        Monitoramento contínuo de paridade tarifária e conversão do motor direto habilitado.
      </div>
    </Card>
  </div>
);

export const DecisionModule: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-600" />
          Decision Engine
        </h2>
        <p className="text-xs text-slate-500">Motor de Recomendações Prescritivas & Explainable AI</p>
      </div>
      <Badge variant="success">Etapa 12.2 Pronta</Badge>
    </div>
    <Card title="Módulo Decision Engine Configurado">
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
        Pronto para apresentar scoring, impacto financeiro estimado e justificativa prescritiva.
      </div>
    </Card>
  </div>
);

export const ApprovalModule: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-emerald-600" />
          Human Approval Center
        </h2>
        <p className="text-xs text-slate-500">Aprovação Humana Obrigatória & Rastro de Auditoria (ADR-005)</p>
      </div>
      <Badge variant="warning">Aprovação Requerida</Badge>
    </div>
    <Card title="Módulo Human Approval Configurado">
      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200">
        Pronto para interface de aprovação/rejeição com formulário de justificativa.
      </div>
    </Card>
  </div>
);

export const PlanningModule: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Compass className="w-5 h-5 text-emerald-600" />
          Planning Center
        </h2>
        <p className="text-xs text-slate-500">Playbooks Operacionais & Sequenciamento Manual</p>
      </div>
      <Badge variant="success">Etapa 12.2 Pronta</Badge>
    </div>
    <Card title="Módulo Planning Configurado">
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
        Pronto para estruturação de checklists operacionais em modo manual.
      </div>
    </Card>
  </div>
);

export const ExecutionModule: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          Execution Tracking
        </h2>
        <p className="text-xs text-slate-500">Acompanhamento Operacional de Execução Manual</p>
      </div>
      <Badge variant="success">Etapa 12.2 Pronta</Badge>
    </div>
    <Card title="Módulo Execution Configurado">
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
        Pronto para acompanhamento do progresso manual sem execuções automáticas.
      </div>
    </Card>
  </div>
);
