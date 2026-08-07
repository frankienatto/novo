import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    Staff, AppNotification, AdminSection, DBState, ChatConversation, ChatMessage, AdPlatform, CampaignGoal, AdCampaign, CampaignPhase, MarketingMixPlan, CustomAudience, Expense, Room, Block, ScheduledPost, AddOn, Bed, AdPlatformString, SiteContent, ThemeSettings, DailyBriefing, SocialConnection, AIEngagementAgent, Project, ShoppingListItem, Ad, MediaAsset, BriefingAction, SocialMediaPlatform, CampaignContext, CampaignPerformanceAnalysis, PropertyInfo, SynapseMessage, ManagementReport, Product, Guest, RoomType, Booking, SubscriptionPlan, PropertyEvent, LocalGuideTip, Facility, RatePlan, BookingRestriction, OTAPlatform, PaymentGatewaySettings, PaymentDetails, BrandIdentity, BusinessDiagnosis, ExpansionSimulation, ProfitabilityOpportunity, AutomationRule,
    PartnerService, ServiceBooking, DashboardActionCard, SaleItem, DrinkPairingSuggestion, DynamicPriceSuggestion, TaskStatus, EmailTemplate, EmailCampaign, AutomatedEmail, PromoCode, PackageDeal,
    Equipment, WorkOrder, Supplier, PurchaseOrder, MaintenanceSuggestion, EquipmentInfoSuggestion, OTAConnection,
    IntegrationSettings, IntegrationSyncLog, IntegrationBillingMapping, ExternalAPIKey,
    MarketInsight, AIPackageSuggestion, CoworkingPlan, PropertyUnitId
} from '../../types';
import { generateDailyBriefing, generateBusinessDiagnosis, generateProfitabilityPlan, simulateExpansion, generateCaptionForImage, generateDashboardActions } from '../../services/geminiService';
import Logo from '../Logo';
import NotificationBell from './NotificationBell';
import { eventBus, updateOnboardingTaskStatus } from '../../services/apiService';
import { 
    LayoutDashboard, Calendar, Bed as BedIcon, ClipboardList, Users, UserCog, ShoppingCart, AreaChart, BarChart2, MessageSquare, Bot, 
    Palette, Settings, LogOut, Menu, X, FolderKanban, Warehouse, ListOrdered, ShieldCheck, Workflow, FileText, Image, PenSquare, LifeBuoy, BrainCircuit, Building, Save, Loader2, Search, CreditCard, Tags, Footprints, SprayCan, ChevronDown, TrendingUp, Lightbulb, TestTube2, Presentation, Video, Mail, Wrench, Package, Star
} from 'lucide-react';
import { GeneralAdminDashboard } from './dashboards/GeneralAdminDashboard';
import { ManagerDashboard } from './dashboards/ManagerDashboard';
import { ReceptionDashboard } from './dashboards/ReceptionDashboard';
import CalendarView from './CalendarView';
import RoomsView from './RoomsView';
import BookingsView from './BookingsView';
import GuestsView from './GuestsView';
import StaffView from './StaffView';
import { POSView } from './POSView';
import FinancialManagerView from './FinancialManagerView';
import { SocialMediaManagerView } from './SocialMediaManagerView';
import { AdCampaignManagerView } from './AdCampaignManagerView';
import ReportsView from './ReportsView';
import OmniChannelView from './OmniChannelView';
import InternalChatView from './InternalChatView';
import AITeamManagerView from './AITeamManagerView';
import { AIStrategyConsultantView } from './AIStrategyConsultantView';
import { VisualEditorView } from './VisualEditorView';
import AIEngagementAgentView from './AIEngagementAgentView';
import AIMarketingLabView from './AIMarketingLabView';
import ProjectsView from './ProjectsView';
import InventoryView from './InventoryView';
import ShoppingListView from './ShoppingListView';
import MarketingOrchestratorView from './MarketingOrchestratorView';
import ManagementCenterView from './ManagementCenterView';
import SynapseAgentView from './SynapseAgentView';
import SaaSAdminView from './SaaSAdminView';
import SubscriptionManagerView from './SubscriptionManagerView';
import { RateManagerView } from './RateManagerView';
import { ChannelManagerView } from './ChannelManagerView';
import MySubscriptionView from './MySubscriptionView';
import Modal from './Modal';
import Drawer from './Drawer';
import OnboardingWizard from './OnboardingWizard';
import GuestJourneyAIView from './GuestJourneyAIView';
import GuestProfileView from './GuestProfileView';
import { SynapseCommandPalette } from './SynapseCommandPalette';
import HousekeepingView from './HousekeepingView';
import CreativeStudio from './CreativeStudioView';
import IntegrationsView from './IntegrationsView';
import { MarketingDashboard } from './dashboards/GrowthHubDashboard';
import OnboardingDashboard from './OnboardingDashboard';
import PartnerServicesView from './PartnerServicesView';
import VigilanciaView from './VigilanciaView';
import MyTasksDashboard from './dashboards/MyTasksDashboard';
import { CoworkingView } from './CoworkingView';
import { DeliveryOrdersView } from './DeliveryOrdersView';
import FinanceDashboard from './dashboards/FinanceDashboard';
import EmailAutopilotView from './EmailAutopilotView';
import MaintenanceManagerView from './MaintenanceManagerView';
import SupplierManagerView from './SupplierManagerView';


import UnitSelector from './UnitSelector';


// Define props for all handlers passed from App.tsx
interface AdminDashboardProps {
    currentUser: Staff;
    db: DBState;
    notifications: AppNotification[];
    chatData: { conversations: ChatConversation[]; messages: ChatMessage[] };
    onLogout: () => void;
    onMarkNotificationAsRead: (id: string) => void;
    onMarkAllNotificationsAsRead: () => void;
    onRoomStatusChange: (roomId: number, newStatus: import('../../types').RoomStatus) => Promise<void>;
    onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
    onGuestAdd: (guestData: Omit<import('../../types').Guest, 'id'>) => Promise<void>;
    onGuestUpdate: (guestData: import('../../types').Guest) => Promise<void>;
    onRoomAdd: (roomData: Omit<Room, 'id' | 'status'>) => Promise<void>;
    onRoomUpdate: (updatedRoom: Room) => Promise<void>;
    onBookingAdd: (bookingData: Omit<import('../../types').Booking, 'id' | 'totalPrice' | 'balance' | 'paymentStatus' | 'status'>) => Promise<void>;
    onBookingUpdate: (bookingId: string, updates: Partial<Pick<import('../../types').Booking, 'checkIn' | 'checkOut' | 'roomId'>>) => Promise<void>;
    onStaffAdd: (staffData: Omit<Staff, 'id'>) => Promise<void>;
    onStaffUpdate: (updatedStaff: Staff) => Promise<void>;
    onStaffDelete: (staffId: string) => Promise<void>;
    onTaskAdd: (taskData: Omit<import('../../types').StaffTask, 'id'>) => Promise<void>;
    onTaskUpdate: (task: import('../../types').StaffTask) => Promise<void>;
    onSale: (transactionData: Omit<import('../../types').Transaction, 'id' | 'timestamp'>, paymentDetails?: PaymentDetails | { method: 'PIX' }) => Promise<void>;
    onProductAdd: (productData: Omit<Product, 'id'>) => Promise<void>;
    onProductUpdate: (product: Product) => Promise<void>;
    onProductDelete: (productId: string) => Promise<void>;
    onSendMessage: (conversationId: string, text: string, senderId: string, senderName: string) => Promise<ChatMessage>;
    onMarkConversationAsRead: (conversationId: string) => Promise<void>;
    onConnectPlatform: (platform: AdPlatform) => Promise<void>;
    onApplyABTest: (adSetId: string, newCopy: { headline: string; description: string; }) => Promise<void>;
    onApplyRule: (campaignId: string, rule: { condition: string; action: string; }) => Promise<void>;
    onDeleteRule: (campaignId: string, ruleId: string) => Promise<void>;
    onCreateAudience: (audienceData: Omit<CustomAudience, 'id'>) => Promise<void>;
    onUpdateAd: (campaignId: string, adSetId: string, adId: string, updates: Partial<Ad>) => Promise<void>;
    onChangeAdCampaignStatus: (campaignId: string, newStatus: AdCampaign['status']) => Promise<void>;
    onAnalyzeCampaign: (campaignId: string, adSetId: string) => Promise<CampaignPerformanceAnalysis | null>;
    onAddExpense: (data: Omit<Expense, 'id'>) => Promise<void>;
    onDeleteExpense: (id: string) => Promise<void>;
    onAddBlock: (blockData: Omit<Block, 'id'>) => Promise<void>;
    onAddScheduledPost: (postData: Omit<ScheduledPost, 'id'>) => Promise<void>;
    onUpdateScheduledPost: (postId: string, updates: Partial<ScheduledPost>) => Promise<void>;
    onDeleteScheduledPost: (postId: string) => Promise<void>;
    onAddOnSave: (addOn: Omit<AddOn, 'id'> | AddOn) => Promise<void>;
    onAddOnDelete: (id: string) => Promise<void>;
    onBedAssignment: (bookingId: string, roomId: number, bedNumber: number) => Promise<void>;
    onUpdateRoomBeds: (roomId: number, newBedCount: number) => Promise<void>;
    onSaveSiteContent: (content: SiteContent) => Promise<void>;
    onSaveThemeSettings: (settings: ThemeSettings) => Promise<void>;
    onSavePropertyEvents: (events: PropertyEvent[]) => Promise<void>;
    onSaveLocalGuideTips: (tips: LocalGuideTip[]) => Promise<void>;
    onSaveFacilities: (facilities: Facility[]) => Promise<void>;
    onSaveRatePlan: (plan: Omit<RatePlan, 'id'> | RatePlan) => Promise<void>;
    onDeleteRatePlan: (planId: string) => Promise<void>;
    onSaveBookingRestriction: (restriction: Omit<BookingRestriction, 'id'> | BookingRestriction) => Promise<void>;
    onDeleteBookingRestriction: (restrictionId: string) => Promise<void>;
    onSavePaymentGatewaySettings: (settings: PaymentGatewaySettings) => Promise<void>;
    onApproveReview: (reviewId: string) => Promise<void>;
    onRejectReview: (reviewId: string) => Promise<void>;
    onApproveTask: (taskId: string) => Promise<void>;
    onRejectTask: (taskId: string, comment: string) => Promise<void>;
    onPublishWorkSchedule: (schedule: any) => Promise<void>;
    onSaveStaffPerformanceReview: (staffId: string, review: any) => Promise<void>;
    onSaveOnboardingPlan: (staffId: string, plan: any) => Promise<void>;
    onStartInternalChat: (user1Id: string, user1Name: string, user2Id: string, user2Name: string) => Promise<ChatConversation>;
    onCheckIn: (bookingId: string) => Promise<void>;
    onCheckOut: (bookingId: string) => Promise<void>;
    onSavePlatformConnections: (connections: SocialConnection[]) => Promise<void>;
    onGeneratePersonas: (audienceDescription: string) => Promise<void>;
    onCreatePersonaFromAudience: (audience: CustomAudience) => Promise<void>;
    onConnectAgentAccount: (platform: SocialMediaPlatform) => Promise<void>;
    onDisconnectAgentAccount: () => Promise<void>;
    onRunAgent: () => Promise<void>;
    onProjectAdd: (projectData: Omit<Project, 'id' | 'taskIds' | 'createdAt'>) => Promise<void>;
    onProjectUpdate: (project: Project) => Promise<void>;
    onProjectDelete: (projectId: string) => Promise<void>;
    onAdjustStock: (productId: string, newStock: number) => Promise<void>;
    onAddShoppingListItem: (itemData: Omit<ShoppingListItem, 'id' | 'status'>) => Promise<void>;
    onAddShoppingListItems: (items: Omit<ShoppingListItem, 'id' | 'status'>[]) => Promise<void>;
    onUpdateShoppingListItemStatus: (listId: string, itemId: string, status: "Pendente" | "Comprado", unitCost?: number) => Promise<void>;
    onReceiveStock: (listId: string, items: { productId: string; quantity: number; itemId: string; }[]) => Promise<void>;
    onCompleteShoppingList: (listId: string) => Promise<void>;
    onAddMediaAsset: (assetData: Omit<MediaAsset, 'id' | 'createdAt'>) => Promise<void>;
    onDeleteMediaAsset: (assetId: string) => Promise<void>;
    onRunMarketingOrchestration: (objective: string, budget: number, period: string) => Promise<void>;
    onGetManagementReport: () => Promise<ManagementReport | null>;
    synapseChatHistory: SynapseMessage[];
    onSendSynapseCommand: (command: string) => Promise<void>;
    onRunSynapseOrchestrationCycle: () => Promise<void>;
    onAddProperty: (propertyData: Omit<PropertyInfo, 'id'>) => Promise<void>;
    onUpdateProperty: (propertyData: PropertyInfo) => Promise<void>;
    onCompleteOnboarding: (staffId: string) => Promise<void>;
    onConnectOTA: (platform: OTAPlatform, propertyId: string) => Promise<void>;
    onDisconnectOTA: (platform: OTAPlatform) => Promise<void>;
    onUpdateOTAConnection: (platform: OTAPlatform, updates: Partial<OTAConnection>) => Promise<void>;
    onSyncAllChannels: () => Promise<void>;
    onUpdateIntegration: (id: string, updates: Partial<IntegrationSettings>) => Promise<void>;
    onSyncIntegration: (platform: string) => Promise<void>;
    onAddIntegrationMapping: (mapping: Omit<IntegrationBillingMapping, 'id'>) => Promise<void>;
    onAddExternalAPIKey: (name: string, scope: 'Leitura' | 'Leitura/Escrita') => Promise<void>;
    onDeleteExternalAPIKey: (id: string) => Promise<void>;
    onChangeSubscriptionPlan: (propertyId: string, newPlanId: string) => Promise<void>;
    onSaveSubscriptionPlan: (plan: Omit<SubscriptionPlan, 'id'> | SubscriptionPlan) => Promise<void>;
    onDeleteSubscriptionPlan: (planId: string) => Promise<void>;
    onDeleteGuestPost: (postId: string) => Promise<void>;
    onDeletePostComment: (postId: string, commentTimestamp: string) => Promise<void>;
    onFinalizeAccount: (bookingId: string) => Promise<void>;
    onSaveBrandIdentity: (identity: BrandIdentity) => Promise<void>;
    onGenerateCampaignIdeas: (goal: string) => Promise<void>;
    onRemixMediaAsset: (assetId: string, prompt: string) => Promise<void>;
    onApplyPriceSuggestion: (roomType: RoomType, newPrice: number) => Promise<void>;
    onCreateCampaignFromOpportunity: (opportunity: any) => Promise<void>;
    onSavePartnerService: (service: Omit<PartnerService, 'id'> | PartnerService) => Promise<void>;
    onDeletePartnerService: (serviceId: string) => Promise<void>;
    onUpdateServiceBookingStatus: (bookingId: string, status: ServiceBooking['status']) => Promise<void>;
    onAddAdCampaign: (campaignData: any) => Promise<void>;
    onRunNextGuestJourneyAction: (journeyId: string) => Promise<void>;
    onGetDrinkPairingSuggestion: (cartItems: SaleItem[]) => Promise<DrinkPairingSuggestion | null>;
    onGenerateAndSaveVideoAsset: (prompt: string) => Promise<void>;
    onGetMarketInsights: (location: string, period: string) => Promise<MarketInsight[]>;
    onGetAIPackageSuggestions: (location: string, insights: MarketInsight[], hostelVibe: string) => Promise<AIPackageSuggestion[]>;
    onGetDynamicPriceSuggestions: (period: string, marketInsights: MarketInsight[]) => Promise<DynamicPriceSuggestion[] | null>;
    onApplyDynamicPriceSuggestions: (suggestions: { roomId: number; newPrice: number }[]) => Promise<void>;
    onSaveCoworkingPlan: (plan: Omit<CoworkingPlan, 'id'> | CoworkingPlan) => Promise<void>;
    onDeleteCoworkingPlan: (planId: string) => Promise<void>;
    onSaveEmailTemplate: (template: Omit<EmailTemplate, 'id'> | EmailTemplate) => Promise<void>;
    onDeleteEmailTemplate: (templateId: string) => Promise<void>;
    onSaveEmailCampaign: (campaign: Omit<EmailCampaign, 'id'> | EmailCampaign) => Promise<void>;
    onSendEmailCampaign: (campaignId: string) => Promise<void>;
    onSaveAutomatedEmails: (automations: AutomatedEmail[]) => Promise<void>;
    onSavePromoCode: (promoCode: Omit<PromoCode, 'id'> | PromoCode) => Promise<void>;
    onDeletePromoCode: (promoCodeId: string) => Promise<void>;
    onSavePackageDeal: (packageDeal: Omit<PackageDeal, 'id'> | PackageDeal) => Promise<void>;
    onDeletePackageDeal: (packageDealId: string) => Promise<void>;
    // Maintenance & Supplier Handlers
    onSaveEquipment: (equipment: Omit<Equipment, 'id'> | Equipment) => Promise<void>;
    onDeleteEquipment: (equipmentId: string) => Promise<void>;
    onSaveWorkOrder: (workOrder: Omit<WorkOrder, 'id'> | WorkOrder) => Promise<void>;
    onDeleteWorkOrder: (workOrderId: string) => Promise<void>;
    onSaveSupplier: (supplier: Omit<Supplier, 'id'> | Supplier) => Promise<void>;
    onDeleteSupplier: (supplierId: string) => Promise<void>;
    onSavePurchaseOrder: (purchaseOrder: Omit<PurchaseOrder, 'id'> | PurchaseOrder) => Promise<void>;
    onDeletePurchaseOrder: (purchaseOrderId: string) => Promise<void>;
    onReceivePurchaseOrderItems: (purchaseOrderId: string) => Promise<void>;
    onGenerateAndSaveDigitalMenu: () => Promise<void>;
    onGetMaintenanceSuggestion: (description: string) => Promise<MaintenanceSuggestion | null>;
    onGetEquipmentInfoSuggestion: (equipmentName: string) => Promise<EquipmentInfoSuggestion | null>;
    // Project Management Handlers
    onAddTaskComment: (taskId: string, staffId: string, text: string) => Promise<void>;
    onAddProjectAttachment: (projectId: string, fileName: string, url: string) => Promise<void>;
    onAddTaskAttachment: (taskId: string, fileName: string, url: string) => Promise<void>;
    onGenerateTaskDependencies: (newTaskDescription: string, projectId: string) => Promise<{ dependencies: string[] } | null>;
    onUpdateTableItems: (tableId: string | null, items: SaleItem[]) => Promise<void>;
    onAddTable: (tableData: { number: number; capacity: number; name?: string; propertyId?: PropertyUnitId }) => Promise<void>;
    onDeleteTable: (tableId: string) => Promise<void>;
    onAddCoworkingCheckIn: (checkIn: any) => Promise<void>;
    onUpdateCoworkingCheckIn: (checkInId: string, updates: any) => Promise<void>;
    onAddDeliveryOrder: (order: any) => Promise<void>;
    onUpdateDeliveryOrder: (orderId: string, updates: any) => Promise<void>;
}

const navItems: { id: AdminSection, label: string, icon: React.ElementType, category: string }[] = [
    // Geral
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Geral' },
    { id: 'management_center', label: 'Comando Central', icon: ShieldCheck, category: 'Geral' },
    { id: 'synapse_agent', label: 'SYNAPSE Agent', icon: Bot, category: 'Geral' },
    
    // Operações
    { id: 'calendar', label: 'Calendário', icon: Calendar, category: 'Operações' },
    { id: 'coworking', label: 'Coworking', icon: Users, category: 'Operações' },
    { id: 'delivery_orders', label: 'Tele Entrega', icon: Package, category: 'Operações' },
    { id: 'bookings', label: 'Reservas', icon: ClipboardList, category: 'Operações' },
    { id: 'rooms', label: 'Quartos', icon: BedIcon, category: 'Operações' },
    { id: 'housekeeping', label: 'Governança', icon: SprayCan, category: 'Operações' },
    { id: 'vigilancia', label: 'Vigilância', icon: Video, category: 'Operações' },
    { id: 'rate_manager', label: 'Tarifas e Restrições', icon: Tags, category: 'Operações' },
    { id: 'guests', label: 'Hóspedes', icon: Users, category: 'Operações' },
    { id: 'partner_services', label: 'Serviços de Parceiros', icon: Users, category: 'Operações' },
    { id: 'integrations', label: 'Integrações', icon: Workflow, category: 'Operações' },
    
    // Gestão
    { id: 'staff', label: 'Central de Equipe', icon: UserCog, category: 'Gestão' },
    { id: 'projects', label: 'Projetos', icon: FolderKanban, category: 'Gestão' },
    { id: 'financial_manager', label: 'Financeiro', icon: AreaChart, category: 'Gestão' },
    { id: 'pos', label: 'PDV (Caixa)', icon: ShoppingCart, category: 'Gestão' },
    { id: 'inventory', label: 'Estoque', icon: Warehouse, category: 'Gestão' },
    { id: 'shopping_list', label: 'Lista de Compras', icon: ListOrdered, category: 'Gestão' },
    { id: 'maintenance_manager', label: 'Gestor de Manutenção', icon: Wrench, category: 'Gestão' },
    { id: 'supplier_manager', label: 'Gestão de Fornecedores', icon: Package, category: 'Gestão' },
    { id: 'reports', label: 'Relatórios', icon: FileText, category: 'Gestão' },
    { id: 'team_manager_ai', label: 'Gestor de Equipe IA', icon: Bot, category: 'Gestão' },
    
    // Comunicação
    { id: 'omni_channel', label: 'Atendimento', icon: MessageSquare, category: 'Comunicação' },
    { id: 'internal_chat', label: 'Chat Interno', icon: LifeBuoy, category: 'Comunicação' },
    
    // Marketing
    { id: 'marketing_dashboard', label: 'Painel de Marketing', icon: BarChart2, category: 'Marketing' },
    { id: 'ai_strategy_consultant', label: 'Estratégia e Insights', icon: Lightbulb, category: 'Marketing' },
    { id: 'ai_marketing_lab', label: 'Laboratório de MKT', icon: TestTube2, category: 'Marketing' },
    { id: 'creative_studio', label: 'Conteúdo e Criativo', icon: Palette, category: 'Marketing' },
    { id: 'social_media', label: 'Redes Sociais', icon: PenSquare, category: 'Marketing' },
    { id: 'ad_campaign_manager', label: 'Campanhas', icon: Presentation, category: 'Marketing' },
    { id: 'email_autopilot', label: 'Autopilot de Email', icon: Mail, category: 'Marketing' },
    { id: 'marketing_orchestrator', label: 'Orquestrador IA', icon: Workflow, category: 'Marketing' },
    { id: 'ai_engagement_agent', label: 'Agente de Engajamento', icon: Bot, category: 'Marketing' },
    { id: 'guest_journey_ai', label: 'Jornada do Cliente IA', icon: Footprints, category: 'Marketing' },
    { id: 'reputation_manager', label: 'Gestor de Reputação', icon: Star, category: 'Marketing' },
    
    // Configurações
    { id: 'property_settings', label: 'Propriedades', icon: Settings, category: 'Configurações' },
    { id: 'my_subscription', label: 'Minha Assinatura', icon: CreditCard, category: 'Configurações' },

    // SaaS
    { id: 'saas_admin', label: 'SaaS Admin', icon: Building, category: 'SaaS' },
    { id: 'subscriptions', label: 'Assinaturas', icon: CreditCard, category: 'SaaS' },
];

const RoomForm: React.FC<{
    initialData: Omit<Room, 'id' | 'status'> | Room;
    onSave: (data: Omit<Room, 'id' | 'status'> | Room) => void;
    onClose: () => void;
}> = ({ initialData, onSave, onClose }) => {
    const [formData, setFormData] = useState(initialData);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['capacity', 'basePrice'].includes(name);
        setFormData(prev => ({...prev, [name]: isNumeric ? Number(value) : value }));
    };

    const handleAmenitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, amenities: e.target.value.split(',').map(a => a.trim())}));
    };
    
    const handleIcalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev, 
            icalConfig: value ? [{ platform: 'Airbnb', url: value }] : []
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col h-full">
            <div className="flex-grow space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Unidade do Hostel</label>
                    <select name="propertyId" value={formData.propertyId || 'beach'} onChange={handleChange} className="input-base font-semibold">
                        <option value="beach">🏖️ Forest House Beach (Praia)</option>
                        <option value="sanctuary">🌿 Forest House Santuário (A 3km da Praia)</option>
                    </select>
                </div>
                <div><label>Nome do Quarto</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="input-base" required /></div>
                <div><label>Tipo</label><select name="type" value={formData.type} onChange={handleChange} className="input-base">{Object.values(RoomType).map(rt => <option key={rt} value={rt}>{rt}</option>)}</select></div>
                <div><label>Capacidade</label><input type="number" name="capacity" value={formData.capacity} onChange={handleChange} className="input-base" required /></div>
                <div><label>Preço Base (R$)</label><input type="number" name="basePrice" value={formData.basePrice} onChange={handleChange} className="input-base" required /></div>
                <div><label>URL da Imagem</label><input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="input-base" required /></div>
                <div><label>Amenidades (separadas por vírgula)</label><input type="text" name="amenities" value={Array.isArray(formData.amenities) ? formData.amenities.join(', ') : ''} onChange={handleAmenitiesChange} className="input-base"/></div>
                <div><label>URL iCal (Sincronização)</label><input type="text" name="icalUrl" value={formData.icalConfig && formData.icalConfig.length > 0 ? formData.icalConfig[0].url : ''} onChange={handleIcalChange} className="input-base" placeholder="https://..." /></div>
            </div>
            <div className="flex-shrink-0 flex justify-end gap-2 border-t pt-4 mt-4">
                 <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                 <button type="submit" className="btn-primary">Salvar</button>
            </div>
        </form>
    );
};


export const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
    const { currentUser, db, onLogout, notifications, onMarkNotificationAsRead, onMarkAllNotificationsAsRead, chatData } = props;
    const [activeSection, setActiveSection] = useState<AdminSection>(currentUser.role === 'Diretor de Marketing' ? 'marketing_dashboard' : 'dashboard');
    const [selectedUnit, setSelectedUnit] = useState<PropertyUnitId | 'all'>(
        currentUser.propertyId && currentUser.propertyId !== 'all' ? currentUser.propertyId : 'all'
    );
    const [viewingGuestProfileId, setViewingGuestProfileId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const [dailyBriefing, setDailyBriefing] = useState<DailyBriefing | null>(null);
    const [dashboardActions, setDashboardActions] = useState<DashboardActionCard[]>([]);
    const [isBriefingLoading, setIsBriefingLoading] = useState(true);
    const [isActionsLoading, setIsActionsLoading] = useState(true);
    const dashboardDataFetched = useRef(false);
    const [isSynapseOpen, setIsSynapseOpen] = useState(false);
    const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['Geral', 'Marketing', 'Operações', 'Gestão']));
    const [pageAction, setPageAction] = useState<BriefingAction | null>(null);

    // State for AI Strategy Consultant
    const [diagnosisResult, setDiagnosisResult] = useState<BusinessDiagnosis | null>(null);
    const [profitabilityResult, setProfitabilityResult] = useState<ProfitabilityOpportunity | null>(null);
    const [simulationResult, setSimulationResult] = useState<ExpansionSimulation | null>(null);

    const isNewAdmin = currentUser.onboardingCompleted === false && ['Gerente', 'Administrador Geral', 'Super Administrador'].includes(currentUser.role);
    const isNewStaff = currentUser.onboardingCompleted === false && !isNewAdmin;


    // Modal & Drawer States
    const [drawerState, setDrawerState] = useState<{
        isOpen: boolean;
        content: 'addRoom' | 'editRoom' | null;
        data?: any;
    }>({ isOpen: false, content: null, data: null });
    
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [newGuestForm, setNewGuestForm] = useState<Omit<Guest, 'id'>>({ fullName: '', email: '', phone: '', cpf: '', password: '' });
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Omit<Product, 'id'> | Product | null>(null);
    
    type NewBookingFormState = Omit<Booking, 'id' | 'totalPrice' | 'balance' | 'paymentStatus' | 'status' | 'addOns' | 'source' | 'reviewId' | 'idPhotoUrl' | 'signatureUrl' | 'rulesAcknowledged' | 'guestJourneyId' | 'preCheckoutCompleted' | 'preCheckoutTime'>;
    const [newBookingForm, setNewBookingForm] = useState<NewBookingFormState>({
        guestId: '', roomId: 0, checkIn: '', checkOut: '', numGuests: 1, ratePlanId: ''
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsBriefingLoading(true);
            setIsActionsLoading(true);
            try {
                // Fetch in parallel
                const [briefing, actionsResult] = await Promise.all([
                    generateDailyBriefing(db),
                    generateDashboardActions(db)
                ]);
                setDailyBriefing(briefing);
                setDashboardActions(actionsResult?.actions || []);
                dashboardDataFetched.current = true; // Mark as successfully fetched
            } catch (e: any) {
                console.error("Failed to fetch dashboard data:", e);
                eventBus.emit('new-toast', { type: 'error', title: 'Falha ao buscar dados do dashboard', message: e.message });
                // Don't set the ref to true, allowing a retry on re-navigation
            } finally {
                setIsBriefingLoading(false);
                setIsActionsLoading(false);
            }
        };

        if (activeSection === 'dashboard' && !dashboardDataFetched.current) {
            fetchDashboardData();
        }
    }, [activeSection, db]); // Depends on db to refetch if core data changes, but guarded by the ref.

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                setIsSynapseOpen(prev => !prev);
            }
            if (event.key === 'Escape') {
                setIsSynapseOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        const handleNavigate = (data: { section: AdminSection }) => {
            setActiveSection(data.section);
            setIsSynapseOpen(false); 
        };

        eventBus.on('synapse-navigate', handleNavigate);
        return () => {
            eventBus.off('synapse-navigate', handleNavigate);
        };
    }, []);

    useEffect(() => {
        const activeItem = navItems.find(item => item.id === activeSection);
        if (activeItem) {
            setOpenCategories(prev => new Set(prev).add(activeItem.category));
        }
    }, [activeSection]);


    const headerTitle = useMemo(() => {
        if (isNewStaff) return "Seja Bem-vindo(a)!";
        const customTitle = db.themeSettings.adminPanel.headerTitles?.[activeSection];
        if (customTitle) return customTitle;
        return navItems.find(item => item.id === activeSection)?.label || 'Dashboard';
    }, [activeSection, db.themeSettings.adminPanel.headerTitles, isNewStaff]);

    const navCategories = useMemo(() => {
        const categories = [...new Set(navItems.map(item => item.category))];
        const saasIndex = categories.indexOf('SaaS');
        if (saasIndex > -1) {
            categories.splice(saasIndex, 1);
            categories.push('SaaS');
        }
        return categories;
    }, []);

    const filteredNavItems = useMemo(() => {
        if (!currentUser) return navItems;
        if (currentUser.role === 'Super Administrador' || currentUser.role === 'Administrador Geral') {
            return navItems;
        }
        const userPermissions = Array.isArray(currentUser.permissions) ? currentUser.permissions : [];
        const permissions = [...userPermissions];
        if (currentUser.role === 'Gerente' && !permissions.includes('integrations')) {
            permissions.push('integrations');
        }
        return navItems.filter(item => permissions.includes(item.id));
    }, [currentUser?.permissions, currentUser?.role]);
    
    const toggleCategory = (category: string) => {
        setOpenCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const handleNotificationClick = (notification: AppNotification) => {
        if (notification.linkTo) {
            setActiveSection(notification.linkTo);
        }
        onMarkNotificationAsRead(notification.id);
    };
    
    const handleBriefingAction = (action: BriefingAction) => {
        setPageAction(action); // Set the action for the target component
        if (action.payload?.section) {
            setActiveSection(action.payload.section);
        } else {
             switch (action.type) {
                case 'VIEW_BOOKING':
                    setActiveSection('bookings');
                    break;
                case 'MODERATE_REVIEW':
                    setActiveSection('ai_strategy_consultant');
                    break;
                case 'VIEW_CALENDAR':
                    setActiveSection('calendar');
                    break;
                case 'CREATE_TASK':
                    setActiveSection('staff');
                    break;
                case 'CREATE_SOCIAL_POST':
                     setActiveSection('social_media');
                     break;
                case 'ANALYZE_FINANCIALS':
                     setActiveSection('financial_manager');
                     break;
                case 'OPTIMIZE_PROFITABILITY':
                case 'SIMULATE_EXPANSION':
                    setActiveSection('ai_strategy_consultant');
                    break;
                case 'CREATE_CAMPAIGN':
                    setActiveSection('ad_campaign_manager');
                    break;
                default:
                    setPageAction(null); // Clear action if not navigational
                    break;
            }
        }
    };

    const handleNavigateWithAction = (section: AdminSection, action: BriefingAction) => {
        setPageAction(action);
        setActiveSection(section);
    };
    
    const handleOpenRoomDrawer = (room: Room | null) => {
        setDrawerState({
            isOpen: true,
            content: room ? 'editRoom' : 'addRoom',
            data: room || { name: '', type: RoomType.PRIVATE_SINGLE, capacity: 1, basePrice: 100, amenities: ['Wi-Fi'], imageUrl: '' },
        });
    };

    const handleCloseDrawer = () => {
        setDrawerState({ isOpen: false, content: null, data: null });
    };

    const handleSaveRoom = async (roomData: Room | Omit<Room, 'id' | 'status'>) => {
        try {
            if ('id' in roomData) {
                await props.onRoomUpdate(roomData);
            } else {
                await props.onRoomAdd(roomData as Omit<Room, 'id' | 'status'>);
            }
            handleCloseDrawer();
            alert("Quarto salvo com sucesso!");
        } catch (e: any) {
            alert("Erro ao salvar quarto: " + e.message);
        }
    };
    
    const handleOpenBookingModal = (data: { roomId?: number, checkIn?: string, checkOut?: string } | null = null) => {
        setNewBookingForm({
            guestId: db.guests[0]?.id || '',
            roomId: data?.roomId || db.rooms[0]?.id || 0,
            checkIn: data?.checkIn || new Date().toISOString().split('T')[0],
            checkOut: data?.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
            numGuests: 1,
            ratePlanId: db.ratePlans.find(r => r.isDefault)?.id || ''
        });
        setIsBookingModalOpen(true);
    };

    const handleOpenGuestModal = () => {
        setNewGuestForm({ fullName: '', email: '', phone: '', cpf: '', password: '' });
        setIsGuestModalOpen(true);
    };

    const handleOpenProductModal = (type: 'addProduct' | 'editProduct', data?: Product) => {
        if (type === 'addProduct') {
            setEditingProduct({ name: '', price: 0, costPrice: undefined, category: 'Comida & Bebida', stock: 0, lowStockThreshold: 5 });
        } else if (data) {
            setEditingProduct(data);
        }
        setIsProductModalOpen(true);
    };

    const handleBookingFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewBookingForm(prev => ({ ...prev, [name]: name === 'roomId' || name === 'numGuests' ? Number(value) : value }));
    };

    const handleSaveBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await props.onBookingAdd({...newBookingForm, source: 'Walk-in'});
            setIsBookingModalOpen(false);
            alert("Reserva criada com sucesso!");
        } catch (e: any) {
            alert("Erro ao criar reserva: " + e.message);
        }
    };
    
    const handleGuestFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewGuestForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveGuest = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await props.onGuestAdd(newGuestForm);
            setIsGuestModalOpen(false);
            alert("Hóspede cadastrado com sucesso!");
        } catch (e: any) {
            alert("Erro ao cadastrar hóspede: " + e.message);
        }
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        if ('id' in editingProduct) {
            await props.onProductUpdate(editingProduct);
        } else {
            await props.onProductAdd(editingProduct as Omit<Product, 'id'>);
        }
        setIsProductModalOpen(false);
    };

    // Handlers for AI Strategy Consultant
    const handleGenerateDiagnosis = async () => {
        setDiagnosisResult(null);
        const result = await generateBusinessDiagnosis(db);
        setDiagnosisResult(result);
    };

    const handleGenerateProfitabilityPlan = async () => {
        setProfitabilityResult(null);
        const result = await generateProfitabilityPlan(db);
        setProfitabilityResult(result);
    };

    const handleSimulateExpansion = async (query: string) => {
        setSimulationResult(null);
        const result = await simulateExpansion(query, db);
        setSimulationResult(result);
    };


    const renderDashboard = () => {
        const maintenanceRoles: Staff['role'][] = ['Manutenção', 'Limpeza', 'Jardim'];
        
        if (maintenanceRoles.includes(currentUser.role)) {
            return <MyTasksDashboard 
                        db={db}
                        currentUser={currentUser}
                        selectedUnit={selectedUnit}
                        onTaskStatusChange={props.onTaskStatusChange}
                   />;
        }

        switch (currentUser.role) {
            case 'Recepção':
                 return <ReceptionDashboard 
                        db={db}
                        currentUser={currentUser}
                        onCheckIn={props.onCheckIn}
                        onCheckOut={props.onCheckOut}
                        onRoomStatusChange={props.onRoomStatusChange}
                        onAddBooking={() => handleOpenBookingModal()}
                        onAddGuest={() => handleOpenGuestModal()}
                   />;
            case 'Financeiro':
                return <FinanceDashboard 
                            db={db}
                            currentUser={currentUser}
                            onNavigate={setActiveSection}
                            selectedUnit={selectedUnit}
                        />;
            case 'Super Administrador':
            case 'Administrador Geral':
            case 'Gerente':
                return <GeneralAdminDashboard 
                    db={db} 
                    currentUser={currentUser} 
                    onBriefingAction={handleBriefingAction} 
                    dailyBriefing={dailyBriefing}
                    isLoadingBriefing={isBriefingLoading}
                    dashboardActions={dashboardActions}
                    isLoadingActions={isActionsLoading}
                    onNavigate={setActiveSection}
                />;
            case 'Diretor de Marketing':
                return <MarketingDashboard 
                            db={db} 
                            onBriefingAction={handleBriefingAction}
                            onCreateCampaignFromOpportunity={props.onCreateCampaignFromOpportunity}
                        />;
            default:
                return <MyTasksDashboard currentUser={currentUser} db={db} selectedUnit={selectedUnit} onTaskStatusChange={props.onTaskStatusChange} />;
        }
    }

    const renderSection = () => {
        switch (activeSection) {
            case 'dashboard':
                return renderDashboard();
            case 'marketing_dashboard':
                return <MarketingDashboard 
                            db={db} 
                            onBriefingAction={handleBriefingAction}
                            onCreateCampaignFromOpportunity={props.onCreateCampaignFromOpportunity}
                        />;
            case 'calendar':
                return <CalendarView db={db} selectedUnit={selectedUnit} onBookingUpdate={props.onBookingUpdate} onNewBooking={handleOpenBookingModal} />;
            case 'rooms':
                return <RoomsView rooms={db.rooms} onStatusChange={props.onRoomStatusChange} onAddRoom={() => handleOpenRoomDrawer(null)} onEditRoom={handleOpenRoomDrawer} onManageBeds={props.onUpdateRoomBeds}/>;
            case 'housekeeping':
                return <HousekeepingView 
                    db={db}
                    rooms={db.rooms} 
                    staff={db.staff} 
                    staffTasks={db.staffTasks} 
                    onRoomStatusChange={props.onRoomStatusChange}
                    currentUser={currentUser}
                    onApproveTask={props.onApproveTask}
                    onRejectTask={props.onRejectTask}
                />;
            case 'vigilancia':
                return <VigilanciaView 
                    db={db} 
                    onAddCamera={props.onAddCamera}
                    onUpdateCamera={props.onUpdateCamera}
                    onDeleteCamera={props.onDeleteCamera}
                    onSaveSurveillanceSettings={props.onSaveSurveillanceSettings}
                />;
            case 'bookings':
                return <BookingsView db={db} selectedUnit={selectedUnit} onAddBooking={() => handleOpenBookingModal()} onCheckIn={props.onCheckIn} onCheckOut={props.onCheckOut} onFinalizeAccount={props.onFinalizeAccount}/>;
            case 'guests':
                return <GuestsView db={db} onAddGuest={handleOpenGuestModal} onEditGuest={(guest) => { setViewingGuestProfileId(guest.id); }} onDeleteGuestPost={props.onDeleteGuestPost} onDeletePostComment={props.onDeletePostComment} />;
            case 'staff':
                return <StaffView 
                    db={db} 
                    currentUser={currentUser} 
                    selectedUnit={selectedUnit}
                    onStaffAdd={props.onStaffAdd} 
                    onStaffUpdate={props.onStaffUpdate} 
                    onStaffDelete={props.onStaffDelete} 
                    onTaskAdd={props.onTaskAdd}
                    onTaskStatusChange={props.onTaskStatusChange}
                />;
            case 'coworking':
                return <CoworkingView 
                    db={db} 
                    onAddCoworkingCheckIn={props.onAddCoworkingCheckIn} 
                    onUpdateCoworkingCheckIn={props.onUpdateCoworkingCheckIn}
                    onSaveCoworkingPlan={props.onSaveCoworkingPlan}
                    onDeleteCoworkingPlan={props.onDeleteCoworkingPlan}
                    onSale={props.onSale}
                />;
            case 'delivery_orders':
                return <DeliveryOrdersView db={db} onSale={props.onSale} onAddDeliveryOrder={props.onAddDeliveryOrder} onUpdateDeliveryOrder={props.onUpdateDeliveryOrder} />;
            case 'pos':
                return <POSView 
                    db={db} 
                    onSale={props.onSale} 
                    onProductModalOpen={handleOpenProductModal} 
                    onProductDelete={props.onProductDelete} 
                    onGetDrinkPairingSuggestion={props.onGetDrinkPairingSuggestion} 
                    onGetPOSSuggestions={props.onGetPOSSuggestions}
                    onGenerateAndSaveDigitalMenu={props.onGenerateAndSaveDigitalMenu} 
                    onUpdateTableItems={props.onUpdateTableItems}
                    onAddTable={props.onAddTable}
                    onDeleteTable={props.onDeleteTable}
                />;
            case 'financial_manager':
                return <FinancialManagerView 
                            db={db} 
                            onAddExpense={props.onAddExpense} 
                            onDeleteExpense={props.onDeleteExpense}
                            onProductAdd={props.onProductAdd}
                            onProductUpdate={props.onProductUpdate}
                        />;
            case 'inventory':
                return <InventoryView db={{products: db.products}} selectedUnit={selectedUnit} onProductUpdate={props.onProductUpdate} onProductModalOpen={handleOpenProductModal} onAdjustStock={props.onAdjustStock}/>;
            case 'shopping_list':
                return <ShoppingListView db={db} onAddItem={props.onAddShoppingListItem} onAddShoppingListItems={props.onAddShoppingListItems} onUpdateItemStatus={props.onUpdateShoppingListItemStatus} onReceiveStock={props.onReceiveStock} onCompleteShoppingList={props.onCompleteShoppingList} />;
            case 'maintenance_manager':
                return <MaintenanceManagerView db={db} onSaveEquipment={props.onSaveEquipment} onDeleteEquipment={props.onDeleteEquipment} onSaveWorkOrder={props.onSaveWorkOrder} onDeleteWorkOrder={props.onDeleteWorkOrder} onGetMaintenanceSuggestion={props.onGetMaintenanceSuggestion} onGetEquipmentInfoSuggestion={props.onGetEquipmentInfoSuggestion} />;
            case 'supplier_manager':
                return <SupplierManagerView db={db} onSaveSupplier={props.onSaveSupplier} onDeleteSupplier={props.onDeleteSupplier} onSavePurchaseOrder={props.onSavePurchaseOrder} onDeletePurchaseOrder={props.onDeletePurchaseOrder} onReceivePurchaseOrderItems={props.onReceivePurchaseOrderItems} />;
            case 'social_media':
                return <SocialMediaManagerView db={db} onAddPost={props.onAddScheduledPost} onUpdatePost={props.onUpdateScheduledPost} onDeletePost={props.onDeleteScheduledPost} onAddMediaAsset={props.onAddMediaAsset} onDeleteMediaAsset={props.onDeleteMediaAsset} initialAction={pageAction} onActionConsumed={() => setPageAction(null)} />;
            case 'ad_campaign_manager':
                return <AdCampaignManagerView db={db} onConnectPlatform={props.onConnectPlatform} onApplyABTest={props.onApplyABTest} onApplyRule={props.onApplyRule} onDeleteRule={props.onDeleteRule} onCreateAudience={props.onCreateAudience} onUpdateAd={props.onUpdateAd} onChangeAdCampaignStatus={props.onChangeAdCampaignStatus} onCreatePersonaFromAudience={props.onCreatePersonaFromAudience} onCreateCampaignFromOpportunity={props.onCreateCampaignFromOpportunity} onAddAdCampaign={props.onAddAdCampaign} initialAction={pageAction} onActionConsumed={() => setPageAction(null)}/>;
            case 'email_autopilot':
                return <EmailAutopilotView 
                            db={db}
                            onSaveTemplate={props.onSaveEmailTemplate}
                            onDeleteTemplate={props.onDeleteEmailTemplate}
                            onSaveCampaign={props.onSaveEmailCampaign}
                            onSendCampaign={props.onSendEmailCampaign}
                            onSaveAutomations={props.onSaveAutomatedEmails}
                        />;
            case 'reports':
                return <ReportsView db={db}/>;
            case 'omni_channel':
                return <OmniChannelView chatData={chatData} currentUser={currentUser} onSendMessage={props.onSendMessage} onMarkAsRead={props.onMarkConversationAsRead}/>;
            case 'internal_chat':
                return <InternalChatView db={db} currentUser={currentUser} onStartChat={props.onStartInternalChat} onSendMessage={props.onSendMessage} />;
            case 'team_manager_ai':
                return <AITeamManagerView db={db} onPublishWorkSchedule={props.onPublishWorkSchedule} onSaveStaffPerformanceReview={props.onSaveStaffPerformanceReview} onSaveOnboardingPlan={props.onSaveOnboardingPlan}/>;
            case 'ai_marketing_lab':
                return <AIMarketingLabView />;
            case 'creative_studio':
                return <CreativeStudio 
                    db={db}
                    onAddScheduledPost={props.onAddScheduledPost}
                    onAddMediaAsset={props.onAddMediaAsset}
                    onSaveBrandIdentity={props.onSaveBrandIdentity}
                    onGenerateCampaignIdeas={props.onGenerateCampaignIdeas}
                    onRemixMediaAsset={props.onRemixMediaAsset}
                    onNavigateWithAction={handleNavigateWithAction}
                    onGenerateAndSaveVideoAsset={props.onGenerateAndSaveVideoAsset}
                />;
            case 'ai_strategy_consultant':
            case 'reputation_manager':
                return <AIStrategyConsultantView 
                    db={db} 
                    onApproveReview={props.onApproveReview} 
                    onRejectReview={props.onRejectReview} 
                    onAddScheduledPost={props.onAddScheduledPost} 
                    initialAction={pageAction} 
                    onActionConsumed={() => setPageAction(null)}
                    onApplyPriceSuggestion={props.onApplyPriceSuggestion}
                    diagnosisResult={diagnosisResult}
                    profitabilityResult={profitabilityResult}
                    simulationResult={simulationResult}
                    onGenerateDiagnosis={handleGenerateDiagnosis}
                    onGenerateProfitabilityPlan={handleGenerateProfitabilityPlan}
                    onSimulateExpansion={handleSimulateExpansion}
                    onNavigateWithAction={handleNavigateWithAction}
                    onCreateCampaignFromOpportunity={props.onCreateCampaignFromOpportunity}
                />;
            case 'property_settings':
                return <VisualEditorView {...props} />;
            case 'projects':
                return <ProjectsView 
                    db={db} 
                    currentUser={currentUser} 
                    onProjectAdd={props.onProjectAdd} 
                    onProjectUpdate={props.onProjectUpdate} 
                    onProjectDelete={props.onProjectDelete}
                    onTaskAdd={props.onTaskAdd}
                    onTaskUpdate={props.onTaskUpdate}
                    onAddShoppingListItems={props.onAddShoppingListItems}
                    onAddExpense={props.onAddExpense}
                    onDeleteExpense={props.onDeleteExpense}
                    onAddTaskComment={props.onAddTaskComment}
                    onAddProjectAttachment={props.onAddProjectAttachment}
                    onAddTaskAttachment={props.onAddTaskAttachment}
                    onGenerateTaskDependencies={props.onGenerateTaskDependencies}
                />;
            case 'ai_engagement_agent':
                return <AIEngagementAgentView db={db} onGeneratePersonas={props.onGeneratePersonas} onConnectAgentAccount={props.onConnectAgentAccount} onDisconnectAgentAccount={props.onDisconnectAgentAccount} onRunAgent={props.onRunAgent}/>;
            case 'marketing_orchestrator':
                return <MarketingOrchestratorView campaignContext={db.campaignContext} onRunMarketingOrchestration={props.onRunMarketingOrchestration} onGenerateCampaignsFromPlan={async () => {}} onGenerateCreativesForPhase={async () => {}} setActiveSection={setActiveSection}/>;
            case 'management_center':
                return <ManagementCenterView onGetManagementReport={props.onGetManagementReport} />;
            case 'synapse_agent':
                return <SynapseAgentView chatHistory={db.synapseChatHistory} onSendCommand={props.onSendSynapseCommand} db={db} onRunSynapseOrchestrationCycle={props.onRunSynapseOrchestrationCycle} />;
            case 'saas_admin':
                 return <SaaSAdminView db={db} onAddProperty={props.onAddProperty} onUpdateProperty={props.onUpdateProperty}/>;
            case 'subscriptions':
                return <SubscriptionManagerView db={db} onUpdateProperty={props.onUpdateProperty} onSaveSubscriptionPlan={props.onSaveSubscriptionPlan} onDeleteSubscriptionPlan={props.onDeleteSubscriptionPlan}/>;
            case 'rate_manager':
                return <RateManagerView 
                    db={db} 
                    onSaveRatePlan={props.onSaveRatePlan} 
                    onDeleteRatePlan={props.onDeleteRatePlan} 
                    onSaveBookingRestriction={props.onSaveBookingRestriction} 
                    onDeleteBookingRestriction={props.onDeleteBookingRestriction} 
                    onGetMarketInsights={props.onGetMarketInsights}
                    onGetAIPackageSuggestions={props.onGetAIPackageSuggestions}
                    onGetDynamicPriceSuggestions={props.onGetDynamicPriceSuggestions} 
                    onApplyDynamicPriceSuggestions={props.onApplyDynamicPriceSuggestions}
                    onSavePromoCode={props.onSavePromoCode}
                    onDeletePromoCode={props.onDeletePromoCode}
                    onSavePackageDeal={props.onSavePackageDeal}
                    onDeletePackageDeal={props.onDeletePackageDeal}
                    onSyncRatesToOTAs={props.onSyncRatesToOTAs}
                />;
            case 'channel_manager':
                return <ChannelManagerView db={db} onConnect={props.onConnectOTA} onDisconnect={props.onDisconnectOTA} onSyncAllChannels={props.onSyncAllChannels} onUpdateOTAConnection={props.onUpdateOTAConnection} />;
            case 'my_subscription':
                return <MySubscriptionView db={db} onChangeSubscriptionPlan={props.onChangeSubscriptionPlan} />;
            case 'guest_journey_ai':
                return <GuestJourneyAIView db={db} onRunNextAction={props.onRunNextGuestJourneyAction} />;
            case 'partner_services':
                return <PartnerServicesView 
                    db={db} 
                    onSaveService={props.onSavePartnerService}
                    onDeleteService={props.onDeletePartnerService}
                    onUpdateBookingStatus={props.onUpdateServiceBookingStatus}
                />;
            case 'integrations':
                return <IntegrationsView 
                    db={db}
                    onUpdateIntegration={props.onUpdateIntegration}
                    onSyncNow={props.onSyncIntegration}
                    onAddMapping={props.onAddIntegrationMapping}
                    onAddAPIKey={props.onAddExternalAPIKey}
                    onDeleteAPIKey={props.onDeleteExternalAPIKey}
                />;
            default:
                return <div>Seção não encontrada</div>;
        }
    };
    
    return (
        <div className="flex h-screen bg-[#F0F2F5] text-[var(--admin-text-color)] font-sans" style={{
            '--admin-primary-color': db.themeSettings.adminPanel.primaryColor,
            '--admin-sidebar-color': db.themeSettings.adminPanel.sidebarColor,
            '--admin-bg-color': db.themeSettings.adminPanel.backgroundColor,
            '--admin-text-color': db.themeSettings.adminPanel.textColor,
            '--admin-menu-text-color': db.themeSettings.adminPanel.menuTextColor,
            '--admin-card-radius': db.themeSettings.adminPanel.cardBorderRadius,
            '--admin-button-radius': db.themeSettings.adminPanel.buttonBorderRadius,
        } as React.CSSProperties}>
            {isNewAdmin && (
                <OnboardingWizard 
                    currentUser={currentUser} 
                    db={db}
                    onPropertyInfoSave={props.onUpdateProperty}
                    onRoomAdd={props.onRoomAdd}
                    onCompleteOnboarding={props.onCompleteOnboarding}
                />
            )}
            
            <div aria-hidden="true" onClick={() => setIsMobileMenuOpen(false)} className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
            
            <aside className={`fixed md:relative inset-y-0 left-0 z-40 bg-[var(--admin-sidebar-color)] text-[var(--admin-menu-text-color)] flex flex-col transition-all duration-500 ease-in-out shadow-2xl ${isSidebarOpen ? 'md:w-72' : 'md:w-24'} ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0 w-72'}`}>
                <div className="flex items-center justify-center h-24 border-b border-white/5 flex-shrink-0 px-6">
                    <div className="relative group">
                        <img 
                            src={db.themeSettings.adminPanel.logoUrl} 
                            alt="Logo" 
                            className={`object-contain transition-all duration-500 drop-shadow-lg ${(isSidebarOpen || isMobileMenuOpen) ? 'h-32' : 'h-16'}`}
                        />
                         {!isSidebarOpen && !isMobileMenuOpen && (
                            <div className="absolute inset-0 bg-[var(--admin-primary-color)]/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
                         )}
                    </div>
                </div>
                <nav className="flex-grow overflow-y-auto no-scrollbar py-6">
                    {navCategories.map(category => (
                        <div key={category} className="mb-6 px-4">
                            <button onClick={() => toggleCategory(category)} className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors ${(isSidebarOpen || isMobileMenuOpen) ? 'hover:bg-white/5' : 'justify-center'}`}>
                                <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500/80 transition-opacity duration-300 ${(isSidebarOpen || isMobileMenuOpen) ? 'opacity-100' : 'opacity-0 hidden'}`}>
                                    {category}
                                </h3>
                                <ChevronDown size={14} className={`text-gray-500 transition-all duration-300 ${(isSidebarOpen || isMobileMenuOpen) ? (openCategories.has(category) ? 'rotate-180 text-[var(--admin-primary-color)]' : 'rotate-0') : 'hidden'}`} />
                            </button>
                            {openCategories.has(category) && (
                                <ul className="mt-2 space-y-1">
                                    {filteredNavItems.filter(item => item.category === category).map(item => (
                                        <li key={item.id}>
                                            <button 
                                                onClick={() => { setActiveSection(item.id); setIsMobileMenuOpen(false); }} 
                                                className={`w-full flex items-center transition-all duration-300 rounded-xl group relative overflow-hidden ${isSidebarOpen || isMobileMenuOpen ? 'px-4 py-3' : 'p-4 justify-center'} ${activeSection === item.id ? 'bg-[var(--admin-primary-color)] text-white shadow-lg shadow-[var(--admin-primary-color)]/20' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                                                title={item.label}
                                                disabled={isNewStaff}
                                            >
                                                <item.icon size={22} className={`transition-transform duration-300 group-hover:scale-110 ${activeSection === item.id ? 'text-white' : ''}`} />
                                                {(isSidebarOpen || isMobileMenuOpen) && (
                                                    <span className={`ml-4 font-semibold text-sm tracking-wide transition-all duration-300 ${activeSection === item.id ? 'translate-x-1' : ''}`}>
                                                        {item.label}
                                                    </span>
                                                )}
                                                {activeSection === item.id && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-white rounded-r-full"></div>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </nav>
                <div className="p-4 border-t border-white/5">
                     <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                        {isSidebarOpen ? <X size={20}/> : <Menu size={20}/>}
                     </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 flex-shrink-0 z-10 animate-fade-in-down">
                    <div className="flex items-center justify-between px-4 lg:px-8 h-20 md:h-24">
                        <div className="flex items-center">
                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 md:p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 mr-3 md:mr-6 lg:hidden transition-colors">
                                <Menu size={24}/>
                            </button>
                            <div>
                                <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-brand-dark to-brand-green bg-clip-text text-transparent">{headerTitle}</h1>
                                <p className="text-[10px] md:text-xs text-gray-400 font-medium tracking-wider hidden sm:block">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 lg:gap-6">
                            <UnitSelector selectedUnit={selectedUnit} onUnitChange={setSelectedUnit} />
                            
                             <div className="hidden xl:flex items-center bg-gray-100 rounded-2xl px-4 py-2 border border-black/5 group focus-within:ring-2 focus-within:ring-[var(--admin-primary-color)]/20 transition-all">
                                <Search size={18} className="text-gray-400" />
                                <input type="text" placeholder="Buscar em Forest House..." className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-64 placeholder-gray-400" />
                                <span className="text-[10px] font-bold text-gray-400 bg-white px-1.5 py-0.5 rounded shadow-sm border border-black/5 ml-2">⌘K</span>
                             </div>

                             <button onClick={() => setIsSynapseOpen(true)} title="Agente SYNAPSE (Cmd+K)" className="p-2 md:p-3 bg-[var(--admin-primary-color)]/10 text-[var(--admin-primary-color)] hover:bg-[var(--admin-primary-color)] hover:text-white rounded-xl md:rounded-2xl transition-all duration-300 shadow-sm flex-shrink-0">
                                <Bot size={20} className="md:w-6 md:h-6"/>
                            </button>
                            
                            <NotificationBell 
                                notifications={notifications} 
                                onNotificationClick={handleNotificationClick}
                                onMarkAllRead={onMarkAllNotificationsAsRead}
                            />
                            
                            <div className="h-8 md:h-10 w-[1px] bg-gray-200 mx-1 md:mx-2 hidden sm:block"></div>

                            <div className="flex items-center gap-3 md:gap-4 group">
                                <div className="text-right hidden sm:block">
                                    <p className="font-bold text-sm text-gray-900 group-hover:text-[var(--admin-primary-color)] transition-colors truncate max-w-[100px] md:max-w-none">{currentUser.name}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate max-w-[100px] md:max-w-none">{currentUser.role}</p>
                                </div>
                                <div className="relative flex-shrink-0">
                                     <img className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl object-cover ring-2 ring-[var(--admin-primary-color)]/10 group-hover:ring-[var(--admin-primary-color)] transition-all" src={`https://i.pravatar.cc/150?u=${currentUser.id}`} alt={currentUser.name} />
                                     <div className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                <button onClick={onLogout} title="Sair" className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                    <LogOut size={22}/>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
                
                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-6">
                     {isNewStaff ? (
                        <OnboardingDashboard 
                            currentUser={currentUser}
                            db={db}
                            onCompleteOnboarding={props.onCompleteOnboarding}
                            onUpdateTaskStatus={updateOnboardingTaskStatus}
                        />
                     ) : viewingGuestProfileId ? (
                        <GuestProfileView guestId={viewingGuestProfileId} db={db} onBack={() => setViewingGuestProfileId(null)} onNavigateToBooking={() => setActiveSection('bookings')} onGuestUpdate={props.onGuestUpdate} onFinalizeAccount={props.onFinalizeAccount} />
                    ) : (
                        renderSection()
                    )}
                </main>
            </div>
            
            <SynapseCommandPalette 
                isOpen={isSynapseOpen}
                onClose={() => setIsSynapseOpen(false)}
                chatHistory={db.synapseChatHistory}
                onSendCommand={props.onSendSynapseCommand}
            />
            
            {/* Drawer for Rooms */}
            <Drawer 
                isOpen={drawerState.isOpen && (drawerState.content === 'addRoom' || drawerState.content === 'editRoom')}
                onClose={handleCloseDrawer}
                title={drawerState.content === 'addRoom' ? 'Novo Quarto' : 'Editar Quarto'}
            >
                {drawerState.data && <RoomForm initialData={drawerState.data} onSave={handleSaveRoom} onClose={handleCloseDrawer} />}
            </Drawer>

            {/* Other Modals */}
            <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="Nova Reserva">
                <form onSubmit={handleSaveBooking} className="space-y-4">
                    <div><label>Hóspede</label><select name="guestId" value={newBookingForm.guestId} onChange={handleBookingFormChange} className="input-base" required>{db.guests.map(g => <option key={g.id} value={g.id}>{g.fullName}</option>)}</select></div>
                    <div>
                        <label>Quarto / Unidade</label>
                        <select name="roomId" value={newBookingForm.roomId} onChange={handleBookingFormChange} className="input-base font-medium" required>
                            {db.rooms.map(r => (
                                <option key={r.id} value={r.id}>
                                    {r.propertyId === 'sanctuary' ? '[🌿 Santuário]' : '[🏖️ Praia]'} {r.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div><label>Check-in</label><input type="date" name="checkIn" value={newBookingForm.checkIn} onChange={handleBookingFormChange} className="input-base" required /></div>
                    <div><label>Check-out</label><input type="date" name="checkOut" value={newBookingForm.checkOut} onChange={handleBookingFormChange} className="input-base" required /></div>
                    <div><label>Nº de Hóspedes</label><input type="number" name="numGuests" value={newBookingForm.numGuests} onChange={handleBookingFormChange} className="input-base" required min="1"/></div>
                    <div><label>Plano de Tarifa</label><select name="ratePlanId" value={newBookingForm.ratePlanId} onChange={handleBookingFormChange} className="input-base" required>{db.ratePlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                    <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsBookingModalOpen(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Salvar Reserva</button></div>
                </form>
            </Modal>

            <Modal isOpen={isGuestModalOpen} onClose={() => setIsGuestModalOpen(false)} title="Adicionar Novo Hóspede">
                <form onSubmit={handleSaveGuest} className="space-y-4">
                    <div><label>Nome Completo</label><input type="text" name="fullName" value={newGuestForm.fullName} onChange={handleGuestFormChange} className="input-base" required /></div>
                    <div><label>Email</label><input type="email" name="email" value={newGuestForm.email} onChange={handleGuestFormChange} className="input-base" required /></div>
                    <div><label>Telefone</label><input type="tel" name="phone" value={newGuestForm.phone} onChange={handleGuestFormChange} className="input-base" required /></div>
                    <div><label>CPF</label><input type="text" name="cpf" value={newGuestForm.cpf} onChange={handleGuestFormChange} className="input-base" required /></div>
                    <div><label>Senha de Acesso (opcional)</label><input type="password" name="password" value={newGuestForm.password || ''} onChange={handleGuestFormChange} className="input-base" placeholder="Deixe em branco para não alterar" /></div>
                    <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsGuestModalOpen(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Salvar Hóspede</button></div>
                </form>
            </Modal>

             <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={editingProduct && 'id' in editingProduct ? 'Editar Produto' : 'Novo Produto'}>
                {editingProduct && (
                    <form onSubmit={handleSaveProduct} className="space-y-4">
                        <div><label>Nome do Produto</label><input type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="input-base" required /></div>
                        <div><label>Categoria</label><select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value as any})} className="input-base"><option>Comida & Bebida</option><option>Aluguel</option><option>Passeio</option><option>Coworking</option><option>Outros</option></select></div>
                        <div className="grid grid-cols-2 gap-4">
                             <div><label>Preço de Custo (R$)</label><input type="number" step="0.01" value={editingProduct.costPrice || ''} onChange={e => setEditingProduct({...editingProduct, costPrice: Number(e.target.value)})} className="input-base" /></div>
                             <div><label>Preço de Venda (R$)</label><input type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="input-base" required /></div>
                        </div>
                        <div><label>Estoque Atual</label><input type="number" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} className="input-base" required /></div>
                        <div><label>Nível de Alerta de Estoque Baixo</label><input type="number" value={editingProduct.lowStockThreshold} onChange={e => setEditingProduct({...editingProduct, lowStockThreshold: Number(e.target.value)})} className="input-base" required /></div>
                        <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsProductModalOpen(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Salvar</button></div>
                    </form>
                )}
            </Modal>
        </div>
    );
};