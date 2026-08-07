import React from 'react';
import { Card, Badge } from '../shared/ui';
import { Users, Target, Cpu, CheckSquare, Compass, Activity } from 'lucide-react';

export const SalesModule: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          Sales CRM
        </h2>
        <p className="text-xs text-slate-500">Gestão Comercial & Pipeline de Reservas Diretas</p>
      </div>
      <Badge variant="success">Etapa 12.2 Pronta</Badge>
    </div>
    <Card title="Módulo Comercial Configurado">
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
        Pronto para renderização de funil comercial e kpis de conversão.
      </div>
    </Card>
  </div>
);

export const MarketingModule: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-600" />
          Marketing Intelligence
        </h2>
        <p className="text-xs text-slate-500">Segmentação de Hóspedes & Retenção de LTV</p>
      </div>
      <Badge variant="success">Etapa 12.2 Pronta</Badge>
    </div>
    <Card title="Módulo de Marketing Configurado">
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
        Pronto para exibição de audiências, ROI e inteligência geográfica.
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
