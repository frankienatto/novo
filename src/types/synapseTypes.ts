export type ThemeMode = 'light' | 'dark' | 'system';

export interface SynapseUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'executive' | 'manager' | 'operator';
  avatarUrl?: string;
}

export interface SynapseOrganization {
  id: string;
  name: string;
  code: string;
}

export interface SynapseProperty {
  id: string;
  orgId: string;
  name: string;
  city: string;
  status: 'active' | 'maintenance' | 'setup';
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  iconName?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  badgeCount?: number;
  badgeVariant?: 'default' | 'warning' | 'danger' | 'info' | 'success';
  module: 'executive' | 'revenue' | 'sales' | 'marketing' | 'decision' | 'approval' | 'planning' | 'execution';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    requestId: string;
    correlationId: string;
    timestamp: string;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ImpactLevel = 'high' | 'medium' | 'low';
export type RiskLevel = 'low' | 'medium' | 'high';
export type PriorityLevel = 'p1' | 'p2' | 'p3' | 'p4';

export interface DecisionRecommendation {
  id: string;
  title: string;
  description: string;
  impact: ImpactLevel;
  risk: RiskLevel;
  confidence: number;
  estimatedBenefit: string;
  estimatedEffort: string;
  reasoning: string;
  evidence: string[];
  sourceModule: 'Revenue Intelligence' | 'Marketing Intelligence' | 'Sales CRM' | 'Operational Planning';
  priority: PriorityLevel;
  approvalRequired: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'in_execution' | 'completed';
  createdAt: string;
  recommendedByAgent: string;
  simulatedScenarios?: {
    scenarioName: string;
    projectedRevenueGain: string;
    occupancyImpactPercent: number;
    riskScore: number;
  }[];
}

export interface ApprovalItem {
  id: string;
  recommendationId: string;
  title: string;
  sourceModule: string;
  impact: ImpactLevel;
  risk: RiskLevel;
  confidence: number;
  estimatedBenefit: string;
  reasoning: string;
  requestedBy: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  approvedBy?: string;
  rejectedBy?: string;
  decisionDate?: string;
  reason?: string;
  createdAt: string;
}

export interface PlaybookChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  requiredRole?: string;
}

export interface PlaybookItem {
  id: string;
  recommendationId: string;
  title: string;
  description: string;
  sourceModule: string;
  owner: string;
  priority: PriorityLevel;
  estimatedTime: string;
  dependencies: string[];
  checklist: PlaybookChecklistItem[];
  executionMode: 'manual';
  status: 'draft' | 'ready' | 'in_execution' | 'completed';
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  event: string;
  details?: string;
}

export interface ExecutionRecord {
  id: string;
  playbookId: string;
  title: string;
  owner: string;
  priority: PriorityLevel;
  status: 'waiting' | 'running' | 'blocked' | 'completed';
  progressPercent: number;
  completedChecklist: string[];
  totalChecklistCount: number;
  executionMode: 'manual';
  blockReason?: string;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
  timeline: TimelineEvent[];
}

