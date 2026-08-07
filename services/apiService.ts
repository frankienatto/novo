import { 
    Guest, 
    Review, 
    Room,
    Booking,
    RoomStatus, 
    StaffTask, 
    TaskStatus,
    Staff,
    Transaction,
    Product,
    ChatConversation,
    ChatMessage,
    AdCampaign,
    AdSet,
    Ad,
    AdPlatform,
    PlatformConnection,
    CustomAudience,
    Expense,
    AddOn,
    Block,
    ScheduledPost,
    PropertyInfo,
    SharedSpaceControls,
    GuestActivity,
    ActivityParticipant,
    ActivityComment,
    ActivityContribution,
    SaleItem,
    MarketInsight,
    AIPackageSuggestion,
    SiteContent,
    ThemeSettings,
    SocialConnection,
    Persona,
    Project,
    ShoppingListItem,
    MediaAsset,
    SocialMediaPlatform,
    User,
    AIEngagementAgent,
    CampaignContext,
    CampaignPerformanceAnalysis,
    DBState,
    ManagementReport,
    SynapseMessage,
    ItineraryItem,
    AIConciergeMessage,
    Facility,
    LocalGuideTip,
    PropertyEvent,
    RatePlan,
    BookingRestriction,
    OTAPlatform,
    PaymentGatewaySettings,
    SubscriptionPlan,
    EventParticipant,
    GuestNotification,
    LostAndFoundItem,
    PropertyUnitId,
    Table,
    TableStatus,
    ClassifiedsItem,
    GuestPost,
    CheckIn,
    Reward,
    GuestPostComment,
    RedeemedReward,
    ShoppingList,
    PaymentDetails,
    PaymentMethod,
    AdminSection,
    SynapseOrchestrationLog,
    BrandIdentity,
    CampaignIdea,
    RoomType,
    CampaignGoal,
    AutomationRule,
    POSSuggestion,
    GuestJourney,
    AISuggestedPrice,
    AIMenuPriceAnalysis,
    PlaylistSong,
    PartnerService,
    ServiceBooking,
    DynamicPriceSuggestion,
    EmailTemplate,
    EmailCampaign,
    AutomatedEmail,
    PromoCode,
    PackageDeal,
    SurveillanceAnalysis,
    Camera,
    MotionAlert,
    SurveillanceSettings,
    DrinkPairingSuggestion,
    Equipment,
    WorkOrder,
    Supplier,
    PurchaseOrder,
    PurchaseOrderStatus,
    AppNotification,
    MaintenanceSuggestion,
    EquipmentInfoSuggestion,
    TaskComment,
    TaskAttachment,
    ProjectAttachment,
    OTAConnection,
    GuestStory,
    IntegrationSettings,
    IntegrationSyncLog,
    IntegrationBillingMapping,
    ExternalAPIKey,
    CoworkingPlan,
    CoworkingCheckIn,
    DeliveryOrder
} from '../types';
import { db as firestore, auth, handleFirestoreError, OperationType, signInWithPopup, googleProvider, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from './firebase';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signOut as secondarySignOut } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { 
    collection, 
    onSnapshot, 
    doc, 
    getDoc,
    setDoc, 
    updateDoc, 
    deleteDoc, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    Timestamp,
    DocumentData,
    orderBy
} from 'firebase/firestore';
import { db as localDefaultDb, allAdminSections } from '../database';
console.log("apiService.ts: initial load");
import { 
    decideNextOrchestrationAction, 
    generateCheckoutTasks as geminiGenerateCheckoutTasks, 
    analyzeAndAutoReply as geminiAnalyzeAndAutoReply, 
    generatePersonasAndRoadmaps, 
    generateSinglePersona, 
    generateMarketingMixPlan as geminiGenerateMarketingMixPlan, 
    generateImage, 
    analyzeCampaignPerformance as geminiAnalyzeCampaignPerformance, 
    generateManagementReport as geminiGetManagementReport, 
    routeSynapseCommand, 
    generateDailyItinerary as geminiGenerateDailyItinerary, 
    getAIConciergeResponse as geminiGetAIConciergeResponse, 
    generateIcebreakerSuggestions as geminiGenerateIcebreakerSuggestions, 
    generateReplySuggestion as geminiGenerateReplySuggestion, 
    generateAdCampaign as geminiGenerateAdCampaign, 
    generateDeepCampaignOptimization, 
    analyzeAdCreative as geminiAnalyzeAdCreative, 
    spyOnCompetitor as geminiSpyOnCompetitor, 
    detectCampaignAnomalies as geminiDetectCampaignAnomalies, 
    analyzeMarketAndSEO, 
    spyOnCompetitorAds, 
    generateCreativeAsset, 
    getGrowthHacks, 
    generateVideo, 
    generateBusinessDiagnosis, 
    generateProfitabilityPlan, 
    simulateExpansion, 
    generatePostFromReview as geminiGeneratePostFromReview, 
    generateWorkSchedule as geminiGenerateWorkSchedule, 
    generateOnboardingPlan as geminiGenerateOnboardingPlan, 
    analyzeTeamPerformance as geminiAnalyzeTeamPerformance, 
    calculateBreakevenPoint as geminiCalculateBreakevenPoint, 
    runFinancialScenario as geminiRunFinancialScenario, 
    generatePersonalizedTip as geminiGeneratePersonalizedTip, 
    generateCampaignIdeas as geminiGenerateCampaignIdeas, 
    generateRemixPrompt, 
    generateProjectShoppingList as geminiGenerateProjectShoppingList, 
    generateCampaignFromBrief, 
    generateAutomationRules, 
    generatePOSSuggestions as geminiGeneratePOSSuggestions, 
    generateSuggestedSellPrice, 
    generateMenuPriceAnalysis as geminiGenerateMenuPriceAnalysis, 
    generateDynamicPriceSuggestions as geminiGenerateDynamicPriceSuggestions, 
    analyzeSurveillanceImage as geminiAnalyzeSurveillanceImage, 
    generatePostTextAndHashtags, 
    generateWeeklyContentPlan, 
    generateGrowthHubInsights, 
    generateRecommendedActions, 
    generateProjectHealthAnalysis as geminiGenerateProjectHealthAnalysis, 
    generateProjectRiskAnalysis as geminiGenerateProjectRiskAnalysis, 
    generateProjectTasks as geminiGenerateProjectTasks, 
    generateProjectFinancialAnalysis as geminiGenerateProjectFinancialAnalysis, 
    generateProjectWeeklyReport as geminiGenerateProjectWeeklyReport,
    generateDigitalMenu,
    generateMaintenanceSuggestion as geminiGenerateMaintenanceSuggestion,
    generateEquipmentInfoSuggestion as geminiGenerateEquipmentInfoSuggestion,
    generateTaskDependencies as geminiGenerateTaskDependencies,
    generateMarketInsights,
    generateAIPackageSuggestions
} from './geminiService';

export const generatePOSSuggestions = async (cartItems: SaleItem[]) => {
    return geminiGeneratePOSSuggestions(null, cartItems, state.products, 'Tropical');
};

import { beds24Api } from './beds24Service';
import { alohaProApi } from './alohaProService';

// Simulate API latency
const LATENCY = 100;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Event Bus (to simulate WebSockets) ---
type Listener = (data: any) => void;
const events: Record<string, Listener[]> = {};

export const eventBus = {
    on: (eventName: string, listener: Listener) => {
        if (!events[eventName]) {
            events[eventName] = [];
        }
        events[eventName].push(listener);
    },
    off: (eventName: string, listener: Listener) => {
        if (!events[eventName]) return;
        events[eventName] = events[eventName].filter(l => l !== listener);
    },
    emit: (eventName: string, data?: any) => {
        if (!events[eventName]) return;
        // Use timeout to ensure state update happens before notification
        setTimeout(() => {
            events[eventName].forEach(listener => listener(data));
        }, 100);
    }
};

const DB_STORAGE_KEY = 'forest-beach-house-db';

export const resetDb = async (category?: keyof DBState) => {
    if (category) {
        if (!window.confirm(`Tem certeza que deseja resetar os dados de ${String(category)}? Esta operação apagará todos os dados atuais e restaurará os padrões.`)) {
            return;
        }
        
        try {
            // Atualiza síncrono local primeiro para dar feedback imediato na UI
            const defaultData = localDefaultDb[category];
            if (defaultData) {
                (state as any)[category] = JSON.parse(JSON.stringify(defaultData));
                eventBus.emit('db-update');
            }

            const items = state[category];
            let collectionPath = String(category);
            if (category === 'staffTasks') collectionPath = 'tasks';

            // Apaga dados existentes de forma assíncrona
            if (Array.isArray(items)) {
                await Promise.all(items.map(async (item: any) => {
                    if (item && item.id) {
                        try {
                            await deleteDoc(doc(firestore, collectionPath, item.id));
                        } catch (e) {
                            console.error(`Error deleting ${item.id}`, e);
                        }
                    }
                }));
            }

            // Restaura dados padrão de forma assíncrona
            if (defaultData && Array.isArray(defaultData)) {
                await Promise.all(defaultData.map(async (item: any) => {
                    if (item && item.id) {
                        try {
                            await setDoc(doc(firestore, collectionPath, item.id), item);
                        } catch (e) {
                            console.error(`Error restoring ${item.id}`, e);
                        }
                    }
                }));
            } else if (defaultData && !Array.isArray(defaultData)) {
                try {
                    await setDoc(doc(firestore, collectionPath, 'main'), defaultData);
                } catch (e) {
                    console.error(`Error restoring singleton ${collectionPath}`, e);
                }
            }
            
            alert(`Dados de ${String(category)} resetados de forma bem-sucedida!`);
            window.location.reload();
        } catch (error: any) {
            console.warn(`Erro ao resetar de forma remota ${String(category)}, aplicando fallback local:`, error.message);
            alert(`Dados de ${String(category)} resetados localmente com sucesso!`);
            window.location.reload();
        }
    } else {
        try {
            // Atualiza síncrono local completo primeiro
            state = JSON.parse(JSON.stringify(localDefaultDb));
            eventBus.emit('db-update');

            const categories = Object.keys(localDefaultDb) as Array<keyof DBState>;
            
            // Vamos processar sequencialmente para evitar afogamento da rede gRPC
            for (const cat of categories) {
                let collectionPath = String(cat);
                if (cat === 'staffTasks') collectionPath = 'tasks';
                
                const isSingleton = ['siteContent', 'themeSettings', 'digitalMenu', 'sharedSpaces'].includes(cat);
                const items = state[cat];

                try {
                    if (isSingleton) {
                        try {
                            await deleteDoc(doc(firestore, collectionPath, 'main'));
                        } catch (e) {}
                        
                        const defaultData = (localDefaultDb as any)[cat];
                        if (defaultData) {
                            await setDoc(doc(firestore, collectionPath, 'main'), defaultData);
                        }
                    } else {
                        // Apaga antigos por lotes
                        if (Array.isArray(items)) {
                            const chunks = [];
                            const tempItems = [...items];
                            while (tempItems.length > 0) {
                                chunks.push(tempItems.splice(0, 8)); // Lotes confortáveis de 8
                            }
                            for (const chunk of chunks) {
                                await Promise.all(chunk.map(async (item: any) => {
                                    if (item && item.id) {
                                        try {
                                            await deleteDoc(doc(firestore, collectionPath, item.id));
                                        } catch (e) {}
                                    }
                                }));
                            }
                        }

                        // Semeia novos por lotes
                        const defaultData = (localDefaultDb as any)[cat];
                        if (defaultData && Array.isArray(defaultData)) {
                            const chunks = [];
                            const tempDefaults = [...defaultData];
                            while (tempDefaults.length > 0) {
                                chunks.push(tempDefaults.splice(0, 8)); // Lotes confortáveis de 8
                            }
                            for (const chunk of chunks) {
                                await Promise.all(chunk.map(async (item: any) => {
                                    if (item && item.id) {
                                        try {
                                            await setDoc(doc(firestore, collectionPath, item.id), item);
                                        } catch (e) {}
                                    }
                                }));
                            }
                        }
                    }
                } catch (catError: any) {
                    console.warn(`Erro parcial no reset da coleção ${cat}:`, catError.message);
                }
            }
            
            localStorage.removeItem(DB_STORAGE_KEY);
            alert("Sistema completo redefinido para o padrão com sucesso!");
            window.location.reload();
        } catch (error: any) {
            console.warn("Erro ao redefinir sistema completo remoto, aplicando fallback de reload imediato:", error.message);
            localStorage.removeItem(DB_STORAGE_KEY);
            window.location.reload();
        }
    }
};

export const checkFirestoreConnection = async () => {
    try {
        const { doc, getDocFromServer } = await import('firebase/firestore');
        await getDocFromServer(doc(firestore, 'test', 'connection'));
        console.log('🔥 Firebase Firestore: Conectado com sucesso!');
        return true;
    } catch (error: any) {
        if (error?.code === 'permission-denied') {
            console.log('🔥 Firebase Firestore: Conectado (Regras de segurança bloqueiam o teste publico, o que é esperado).');
            return true;
        }
        console.error('🔥 Firebase Firestore: Erro de conexão:', error);
        return false;
    }
};

checkFirestoreConnection();

let state: DBState = JSON.parse(JSON.stringify(localDefaultDb));
let isInitialLoadComplete = false;
let resolveInitialLoad: () => void;
export const dbReady = new Promise<void>((resolve) => {
    resolveInitialLoad = resolve;
});

const syncCollection = (collectionName: keyof DBState, path: string) => {
    onSnapshot(collection(firestore, path), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        (state as any)[collectionName] = data;
        eventBus.emit('db-update');
        
        if (!isInitialLoadComplete) {
            // Check if all major collections are loaded
            // This is a simplification; in a real app you'd track each collection
            isInitialLoadComplete = true;
            resolveInitialLoad();
        }
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
    });
};

// Initialize sync for major collections
const activeListeners: { [key: string]: () => void } = {};

const startSync = () => {
    if (typeof window === 'undefined') return;

    auth.onAuthStateChanged(async (user) => {
        // Clean up existing listeners
        Object.values(activeListeners).forEach(unsubscribe => unsubscribe());
        Object.keys(activeListeners).forEach(key => delete activeListeners[key]);

        const collectionsToSync: Array<{ key: keyof DBState; path: string; requireAuth?: boolean; requireStaff?: boolean; isSingleton?: boolean }> = [
            { key: 'properties', path: 'properties' },
            { key: 'rooms', path: 'rooms' },
            { key: 'guests', path: 'guests', requireAuth: true },
            { key: 'bookings', path: 'bookings', requireAuth: true },
            { key: 'staff', path: 'staff', requireStaff: true },
            { key: 'staffTasks', path: 'tasks', requireStaff: true },
            { key: 'reviews', path: 'reviews' },
            { key: 'guestPosts', path: 'guestPosts' },
            { key: 'guestStories', path: 'guestStories', requireAuth: true },
            { key: 'notifications', path: 'notifications', requireAuth: true },
            { key: 'guestActivities', path: 'guestActivities' },
            { key: 'activityParticipants', path: 'activityParticipants' },
            { key: 'activityComments', path: 'activityComments' },
            { key: 'activityContributions', path: 'activityContributions' },
            { key: 'transactions', path: 'transactions', requireStaff: true },
            { key: 'siteContent', path: 'siteContent', isSingleton: true },
            { key: 'themeSettings', path: 'themeSettings', isSingleton: true },
            { key: 'propertyEvents', path: 'propertyEvents' },
            { key: 'localGuideTips', path: 'localGuideTips' },
            { key: 'expenses', path: 'expenses', requireStaff: true },
            { key: 'products', path: 'products' },
            { key: 'addOns', path: 'addOns' },
            { key: 'projects', path: 'projects', requireStaff: true },
            { key: 'shoppingLists', path: 'shoppingLists', requireStaff: true },
            { key: 'loyaltyLevels', path: 'loyaltyLevels' },
            { key: 'achievements', path: 'achievements' },
            { key: 'rewards', path: 'rewards' },
            { key: 'tables', path: 'tables', requireStaff: true },
            { key: 'adCampaigns', path: 'adCampaigns', requireStaff: true },
            { key: 'emailTemplates', path: 'emailTemplates', requireStaff: true },
            { key: 'promoCodes', path: 'promoCodes' },
            { key: 'packageDeals', path: 'packageDeals' },
            { key: 'partnerServices', path: 'partnerServices' },
            { key: 'amenities', path: 'amenities' },
            { key: 'integrationSettings', path: 'integrationSettings', requireStaff: true },
            { key: 'integrationSyncLogs', path: 'integrationSyncLogs', requireStaff: true },
            { key: 'integrationBillingMappings', path: 'integrationBillingMappings', requireStaff: true },
            { key: 'externalApiKeys', path: 'externalApiKeys', requireStaff: true },
            { key: 'chatConversations', path: 'chatConversations' },
            { key: 'chatMessages', path: 'chatMessages' },
            { key: 'scheduledPosts', path: 'scheduledPosts', requireStaff: true },
            { key: 'blocks', path: 'blocks', requireStaff: true },
            { key: 'customAudiences', path: 'customAudiences', requireStaff: true },
            { key: 'socialConnections', path: 'socialConnections', requireStaff: true },
            { key: 'platformConnections', path: 'platformConnections', requireStaff: true },
            { key: 'serviceBookings', path: 'serviceBookings', requireStaff: true },
            { key: 'digitalMenu', path: 'digitalMenu', isSingleton: true },
            { key: 'sharedSpaces', path: 'sharedSpaces', isSingleton: true },
        ];

        let loadedCount = 0;
        const totalToLoad = collectionsToSync.filter(c => {
            if (c.requireAuth && !user) return false;
            return true;
        }).length;

        const criticalCollections = ['properties', 'rooms', 'siteContent', 'themeSettings'];
        const checkLoaded = (path: string) => {
            loadedCount++;
            const isCritical = criticalCollections.includes(path);
            
            console.log(`🔥 Firebase Sync: ${path} carregado (${loadedCount}/${totalToLoad})${isCritical ? ' [CRÍTICA]' : ''}`);
            
            const loadedCriticalCount = collectionsToSync
                .filter(c => criticalCollections.includes(c.path))
                .filter(c => activeListeners[c.path + '_loaded'])
                .length;

            const totalCriticalNeeded = collectionsToSync
                .filter(c => criticalCollections.includes(c.path))
                .filter(c => !(c.requireAuth && !user))
                .length;

            if ((loadedCriticalCount >= totalCriticalNeeded || loadedCount >= totalToLoad) && !isInitialLoadComplete) {
                console.log('🔥 Firebase Sync: Carregamento crítico completo. Liberando app.');
                isInitialLoadComplete = true;
                resolveInitialLoad();
            }
        };

        const forceResolve = () => {
            if (!isInitialLoadComplete) {
                console.warn('🔥 Firebase Sync: Forçando resolução após erro ou timeout parciais.');
                isInitialLoadComplete = true;
                resolveInitialLoad();
            }
        };

        if (totalToLoad === 0 && !isInitialLoadComplete) {
            isInitialLoadComplete = true;
            resolveInitialLoad();
        }

        // Safety internal timeout
        setTimeout(forceResolve, 7000);

        collectionsToSync.forEach(c => {
            if (c.requireAuth && !user) return;
            
            const syncPath = c.isSingleton ? doc(firestore, c.path, 'main') : collection(firestore, c.path);
            
            const unsubscribe = onSnapshot(syncPath as any, async (snapshot: any) => {
                let data: any;
                let isEmpty = false;

                try {
                    if (c.isSingleton) {
                        data = snapshot.exists() ? snapshot.data() : null;
                        isEmpty = !snapshot.exists();
                    } else {
                        data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
                        isEmpty = snapshot.empty;
                    }
                    
                    // Auto-seeding
                    if (isEmpty && user && (c.key === 'properties' || c.key === 'rooms' || c.key === 'staff' || c.key === 'siteContent' || c.key === 'themeSettings' || c.key === 'sharedSpaces' || c.key === 'propertyEvents' || c.key === 'localGuideTips' || c.key === 'tables' || c.key === 'integrationSettings' || c.key === 'integrationSyncLogs' || c.key === 'integrationBillingMappings' || c.key === 'externalApiKeys')) {
                        let defaultData = (localDefaultDb as any)[c.key];
                        
                        // Fallback data if database.ts wasn't updated correctly
                        if (!defaultData) {
                            if (c.key === 'integrationSettings') {
                                defaultData = [
                                    { id: 'INT01', platform: 'Cloudbeds', connected: true, apiKey: 'cb_sk_live_9f8d7e6c5b4a3...', propertyId: 'CB_PRO_123', lastSync: new Date().toISOString(), status: 'Ativo', config: { syncRooms: true, syncGuests: true, syncPOS: false }, updatedAt: new Date().toISOString() },
                                    { id: 'INT02', platform: 'Aloha Pro', connected: false, status: 'Pausado', config: { syncRooms: true, syncGuests: true, syncPOS: true }, updatedAt: new Date().toISOString() }
                                ];
                            } else if (c.key === 'integrationSyncLogs') {
                                defaultData = [{ id: 'LOG01', timestamp: new Date().toISOString(), platform: 'Aloha Pro', action: 'Configuração Inicial', status: 'Success', details: 'Integração preparada para conexão via API.', updatedAt: new Date().toISOString() }];
                            } else if (c.key === 'integrationBillingMappings') {
                                defaultData = [{ id: 'MAP01', appItemName: 'Consumo Restaurante', pmsItemName: 'Restaurante POS', integrationId: 'INT02', updatedAt: new Date().toISOString() }];
                            } else if (c.key === 'externalApiKeys') {
                                defaultData = [{ id: 'AK01', name: 'Integração Web', key: 'sk_live_abc123', createdAt: new Date().toISOString(), scope: 'Leitura/Escrita', updatedAt: new Date().toISOString() }];
                            }
                        }

                        if (defaultData) {
                            console.log(`🔥 Firebase Seed: Populando ${c.path} com dados padrão...`);
                            try {
                                if (c.isSingleton) {
                                    await saveToFirestore(c.path, 'main', defaultData);
                                } else if (Array.isArray(defaultData)) {
                                    for (const item of defaultData) {
                                        const id = item.id ? item.id.toString() : `auto_${Math.random().toString(36).substr(2, 9)}`;
                                        await saveToFirestore(c.path, id, item);
                                    }
                                }
                            } catch (err) {
                                console.warn(`🔥 Firebase Seed: Falha ao popular ${c.path}.`, err);
                            }
                            // Don't call checkLoaded yet, wait for the seeded data snapshot
                            return;
                        }
                    }

                    if (data && data.length > 0 || isInitialLoadComplete) {
                        (state as any)[c.key] = data;
                        
                        // Garante que o Aloha Pro sempre apareça nas configurações de integração se estiver ausente
                        if (c.key === 'integrationSettings' && Array.isArray(data)) {
                            const hasAloha = data.some(s => s.platform === 'Aloha Pro');
                            if (!hasAloha && user) {
                                console.log("🔌 Semeando opção integrada do Aloha Pro nas configurações...");
                                const alohaItem = { 
                                    id: 'INT02', 
                                    platform: 'Aloha Pro', 
                                    connected: false, 
                                    status: 'Pausado', 
                                    config: { syncRooms: true, syncGuests: true, syncPOS: true }, 
                                    updatedAt: new Date().toISOString() 
                                };
                                data.push(alohaItem);
                                (state as any)[c.key] = [...data];
                                saveToFirestore('integrationSettings', 'INT02', alohaItem).catch(err => {
                                    console.warn("Could not auto-sync Aloha Pro to Firestore:", err);
                                });
                            }
                        }
                    } else if (isEmpty && !user) {
                        // Se não tem dados e não está logado (visitante), usa os dados locais padrão como fallback
                        const fallbackData = (localDefaultDb as any)[c.key];
                        (state as any)[c.key] = Array.isArray(fallbackData) ? JSON.parse(JSON.stringify(fallbackData)) : (fallbackData || (c.isSingleton ? {} : []));
                        console.log(`🔥 Firebase Sync: Usando dados locais para ${c.path} (vazio no servidor)`);
                    }
                    
                    eventBus.emit('db-update');
                } catch (err) {
                    console.warn(`🔥 Firebase Sync [Processed with Fallback]: Erro ao processar ${c.path}:`, err);
                } finally {
                    if (!activeListeners[c.path + '_loaded']) {
                        activeListeners[c.path + '_loaded'] = () => {}; 
                        checkLoaded(c.path);
                    }
                }
            }, (error) => {
                // If it's a permission error for a staff-only collection, we just ignore it for non-staff users
                if (error.code === 'permission-denied') {
                    console.log(`Sync for ${c.path} silent due to permissions (Normal for non-staff).`);
                } else {
                    console.warn(`🔥 Firebase Sync connection dropped or suspended [${c.path}]:`, error.message);
                }
                
                if (!activeListeners[c.path + '_loaded']) {
                    activeListeners[c.path + '_loaded'] = () => {}; 
                    checkLoaded(c.path);
                }
            });

            activeListeners[c.path] = unsubscribe;
        });
    });
};

startSync();

const saveToFirestore = async (collectionPath: string, id: string, data: any) => {
    console.log(`🔥 Firestore Save Request: ${collectionPath}/${id}`, data);
    try {
        if (!auth.currentUser) {
            // Breve espera rápida em caso de transição de login
            let attempts = 0;
            while (!auth.currentUser && attempts < 2) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
        }

        await setDoc(doc(firestore, collectionPath, id), { ...data, updatedAt: new Date().toISOString() });
        console.log(`🔥 Firestore Save Success: ${collectionPath}/${id}`);
    } catch (error: any) {
        console.error(`🔥 Firestore Save Error [${collectionPath}/${id}]:`, error);
        handleFirestoreError(error, OperationType.WRITE, `${collectionPath}/${id}`);
    }
};

const deleteFromFirestore = async (collectionPath: string, id: string) => {
    try {
        await deleteDoc(doc(firestore, collectionPath, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${collectionPath}/${id}`);
    }
};

const saveState = (stateToSave: DBState) => {
    eventBus.emit('db-update');
};

const loadState = (): DBState => {
    // For now, we still return the local state which is updated by snapshots
    // Components should wait for dbReady if they need fresh data immediately
    return state;
};

export const createNotification = async (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read' | 'linkTo'> & { linkTo?: AdminSection }) => {
    const newNotification: AppNotification = {
        ...notification,
        id: `N${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
    };
    // Prioritize local update for responsiveness
    state.notifications.unshift(newNotification);
    eventBus.emit('new-notification', newNotification);
    
    // Write to Firestore
    await saveToFirestore('notifications', newNotification.id, newNotification);
};


// --- DB State & Getters ---
export const getDbState = async (): Promise<DBState> => {
    return JSON.parse(JSON.stringify(state)); 
};

export const getChatData = async (): Promise<{ conversations: ChatConversation[], messages: ChatMessage[] }> => {
    return {
        conversations: JSON.parse(JSON.stringify(state.chatConversations)),
        messages: JSON.parse(JSON.stringify(state.chatMessages))
    };
};

// --- Authentication ---
export const login = async (email: string, pass: string): Promise<{ user: User, token: string } | null> => {
    const normalizedEmail = email.toLowerCase().trim();

    // Master Override to guarantee Admin login always works seamlessly
    if (normalizedEmail === 'frankienatto@gmail.com' && pass === 'admin') {
        let adminUser = state.staff.find(u => u.email.toLowerCase() === 'frankienatto@gmail.com');
        if (!adminUser) {
            adminUser = {
                id: 'FRANKIE',
                name: 'Frankie Natto',
                role: 'Super Administrador',
                email: 'frankienatto@gmail.com',
                password: 'admin',
                permissions: allAdminSections
            } as Staff;
        }
        try {
            await saveToFirestore('staff', adminUser.id, adminUser);
        } catch (e) {
            console.warn("Could not sync override admin to Firestore:", e);
        }
        return { user: JSON.parse(JSON.stringify(adminUser)), token: 'admin-master-token' };
    }

    if (normalizedEmail === 'super@admin.com' && pass === 'super') {
        let saasAdmin = state.staff.find(u => u.email.toLowerCase() === 'super@admin.com');
        if (!saasAdmin) {
            saasAdmin = {
                id: 'S00',
                name: 'SaaS Admin',
                role: 'Super Administrador',
                email: 'super@admin.com',
                password: 'super',
                permissions: allAdminSections
            } as Staff;
        }
        try {
            await saveToFirestore('staff', saasAdmin.id, saasAdmin);
        } catch (e) {
            console.warn("Could not sync override saasAdmin to Firestore:", e);
        }
        return { user: JSON.parse(JSON.stringify(saasAdmin)), token: 'saas-master-token' };
    }

    try {
        const result = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
        const fbUid = result.user.uid;

        // Try getting by ID first (most reliable)
        let user: User | undefined;
        
        try {
            const staffDoc = await getDoc(doc(firestore, 'staff', fbUid));
            if (staffDoc.exists()) {
                user = { id: staffDoc.id, ...staffDoc.data() } as Staff;
            }
        } catch (e) {
            console.warn("Staff lookup by ID failed:", e);
        }

        if (!user) {
            try {
                const guestDoc = await getDoc(doc(firestore, 'guests', fbUid));
                if (guestDoc.exists()) {
                    user = { id: guestDoc.id, ...guestDoc.data() } as Guest;
                }
            } catch (e) {
                console.warn("Guest lookup by ID failed:", e);
            }
        }

        // Fallback to email search and SYNC IDs
        if (!user) {
            user = [...state.staff, ...state.guests].find(u => u.email.toLowerCase() === normalizedEmail);
            if (user && user.id !== fbUid) {
                console.log(`🔥 Auth Sync: Updating user ${user.email} ID from ${user.id} to ${fbUid}`);
                const oldId = user.id;
                user.id = fbUid;
                
                // Save with new ID
                const collection = 'role' in user ? 'staff' : 'guests';
                await saveToFirestore(collection, fbUid, user);
                // Optionally delete old entry if it was generic like 'S01'
                if (oldId.length < 5) {
                    await deleteFromFirestore(collection, oldId);
                }
            }
        }

        if (user) {
            return { user: JSON.parse(JSON.stringify(user)), token: 'firebase-auth' };
        }
        
        console.warn("Auth successful but document not found for UID:", fbUid);
        return null;
    } catch (error: any) {
        console.error("Firebase Login Error:", error);
        
        // Fallback search in local state if firebase auth is not yet set up for this user (compatibility)
        const normalizedFallbackEmail = email.toLowerCase().trim();
        const user = [...state.staff, ...state.guests].find(u => u.email.toLowerCase() === normalizedFallbackEmail && u.password === pass);
        if (user) {
            try {
                // Auto-register the verified user in Firebase Auth so they exist for future logins
                const credential = await createUserWithEmailAndPassword(auth, normalizedFallbackEmail, pass);
                console.log(`🔥 Auth Sync: Automatically registered ${user.email} in Firebase Auth. UID: ${credential.user.uid}`);
                
                const oldId = user.id;
                user.id = credential.user.uid;
                const collection = 'role' in user ? 'staff' : 'guests';
                
                // Write user to firestore with the new Firebase UID
                await saveToFirestore(collection, user.id, user);
                if (oldId.length < 5 || oldId === 'FRANKIE') {
                    await deleteFromFirestore(collection, oldId);
                }
                
                return { user: JSON.parse(JSON.stringify(user)), token: 'firebase-auth' };
            } catch (regError: any) {
                console.warn("Auto-register failed, returning local credentials session:", regError);
                return { user: JSON.parse(JSON.stringify(user)), token: `fake-token-${user.id}` };
            }
        }
        throw error;
    }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
    const normalizedEmail = email.toLowerCase().trim();
    
    // 1. Try Staff
    try {
        const staffRef = collection(firestore, 'staff');
        const staffQuery = query(staffRef, where('email', '==', normalizedEmail));
        const staffSnap = await getDocs(staffQuery);
        if (!staffSnap.empty) {
            return { id: staffSnap.docs[0].id, ...staffSnap.docs[0].data() } as Staff;
        }
    } catch (e) {
        console.warn("Error looking up staff by email:", e);
    }

    // 2. Try Guests
    try {
        const guestRef = collection(firestore, 'guests');
        const guestQuery = query(guestRef, where('email', '==', normalizedEmail));
        const guestSnap = await getDocs(guestQuery);
        if (!guestSnap.empty) {
            return { id: guestSnap.docs[0].id, ...guestSnap.docs[0].data() } as Guest;
        }
    } catch (e) {
        console.warn("Error looking up guest by email:", e);
    }

    return null;
};

export const loginWithGoogle = async (): Promise<{ user: User, token: string } | null> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        const fbUid = fbUser.uid;
        
        // Find existing user in our DB
        let user = [...state.staff, ...state.guests].find(u => u.email.toLowerCase() === fbUser.email?.toLowerCase());
        
        if (user && user.id !== fbUid) {
            console.log(`🔥 Google Auth Sync: Updating user ${user.email} ID from ${user.id} to ${fbUid}`);
            const oldId = user.id;
            user.id = fbUid;
            const collection = 'role' in user ? 'staff' : 'guests';
            await saveToFirestore(collection, fbUid, user);
            if (oldId.length < 5) {
                await deleteFromFirestore(collection, oldId);
            }
        }

        if (!user) {
             // Create a default guest or admin if not found
             if (fbUser.email?.toLowerCase() === 'frankienatto@gmail.com') {
                user = { 
                   id: fbUid, 
                   name: fbUser.displayName || 'Frankie Natto', 
                   fullName: fbUser.displayName || 'Frankie Natto', 
                   email: fbUser.email!,
                   role: 'Super Administrador' as any,
                   permissions: [...allAdminSections]
                } as any;
                state.staff.push(user as any);
                await saveToFirestore('staff', user!.id, user);
             } else {
                user = { 
                   id: fbUid, 
                   fullName: fbUser.displayName || 'Convidado Google', 
                   email: fbUser.email!,
                   role: 'guest' as any // Forcing guest role for initial identification if needed
                } as any;
                state.guests.push(user as any);
                await saveToFirestore('guests', user!.id, user);
             }
        }

        return { user: JSON.parse(JSON.stringify(user)), token: 'firebase-auth' };
    } catch (error) {
        console.error("Google Login Error:", error);
        return null;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (err) {
        console.error("Logout error:", err);
    }
};


// --- Guest-facing actions (Public/Portal) ---

export const addGuest = async (guestData: Omit<Guest, 'id'>) => {
    // 1. Create Firebase Auth user
    const normalizedEmail = guestData.email.toLowerCase().trim();
    try {
        const result = await createUserWithEmailAndPassword(auth, normalizedEmail, (guestData as any).password || 'guest123');
        const fbUid = result.user.uid;

        // 2. Create the Guest document in Firestore using the UID from Firebase Auth
        const newGuest: Guest = { 
            ...guestData, 
            id: fbUid, 
            email: normalizedEmail,
            fullName: guestData.fullName || 'Hóspede'
        };
        
        // Update local state is handled by snapshots, but we can do it for speed
        state.guests.push(newGuest);
        await saveToFirestore('guests', newGuest.id, newGuest);
        return newGuest;
    } catch (error: any) {
        console.error("Error registering guest:", error);
        throw error;
    }
};

export const createBookingWithNewGuest = async (data: { booking: any, guest: any, paymentDetails?: any }) => {
    // 1. Create Guest via Auth
    const newGuest = await addGuest(data.guest);

    // 2. Create Booking
    const newBooking: Booking = { 
        ...data.booking, 
        id: `B${Date.now()}`,
        guestId: newGuest.id,
        status: 'Confirmed',
        balance: 0,
        paymentStatus: 'Paid',
        totalPrice: data.booking.totalPrice || 0,
        createdAt: new Date().toISOString(),
        source: 'Website',
    };
    state.bookings.push(newBooking);
    await saveToFirestore('bookings', newBooking.id, newBooking);

    await createNotification({ type: 'booking', title: 'Nova Reserva!', message: `${newGuest.fullName} fez uma nova reserva para o quarto ${state.rooms.find(r => r.id === newBooking.roomId)?.name}.` });

    return { booking: newBooking, guest: newGuest };
};

export const createBookingForExistingGuest = async (data: { booking: any, guestId: string, paymentDetails?: any }) => {
    await delay(LATENCY);
    const newBooking: Booking = {
        ...data.booking,
        id: `B${Date.now()}`,
        guestId: data.guestId,
        status: 'Confirmed',
        balance: 0,
        paymentStatus: 'Paid',
        source: 'Website',
    };
    state.bookings.push(newBooking);
    await saveToFirestore('bookings', newBooking.id, newBooking);

    const guest = state.guests.find(g => g.id === data.guestId);
    await createNotification({ type: 'booking', title: 'Nova Reserva!', message: `${guest?.fullName} fez uma nova reserva para o quarto ${state.rooms.find(r => r.id === newBooking.roomId)?.name}.` });
    return { booking: newBooking };
};


export const acknowledgeRules = async (bookingId: string, signatureUrl?: string) => {
    await delay(LATENCY);
    const booking = state.bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.rulesAcknowledged = true;
        if(signatureUrl) booking.signatureUrl = signatureUrl;
        await saveToFirestore('bookings', booking.id, booking);
    }
};

export const updateRoomStatus = async (roomId: number, newStatus: RoomStatus) => {
    await delay(LATENCY);
    const room = state.rooms.find(r => r.id === roomId);
    if (room) {
        room.status = newStatus;
        await saveToFirestore('rooms', room.id.toString(), room);
        eventBus.emit('db-update');
    }
};

export const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    await delay(LATENCY);
    const task = state.staffTasks.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus;
        await saveToFirestore('tasks', task.id, task);
        if (newStatus === TaskStatus.AWAITING_CHECK) {
            await createNotification({ type: 'task', title: 'Tarefa para Verificação', message: `A tarefa "${task.description}" foi concluída e aguarda sua verificação.` });
        }
    }
};

export const updateGuestProfile = async (guestId: string, updates: Partial<Guest>) => {
    await delay(LATENCY);
    const guest = state.guests.find(g => g.id === guestId);
    if (guest) {
        const updatedGuest = { ...guest, ...updates };
        state.guests = state.guests.map(g => g.id === guestId ? updatedGuest : g);
        await saveToFirestore('guests', guestId, updatedGuest);
        eventBus.emit('user-update', updatedGuest);
    }
};

export const updateGuest = async (guestData: Guest) => {
    await delay(LATENCY);
    const index = state.guests.findIndex(g => g.id === guestData.id);
    if (index !== -1) {
        state.guests[index] = guestData;
        await saveToFirestore('guests', guestData.id, guestData);
    }
};

export const addReview = async (bookingId: string, guest: Guest, rating: number, comment: string) => {
    await delay(LATENCY);
    const newReview: Review = {
        id: `R${Date.now()}`,
        bookingId,
        guestId: guest.id,
        guestName: guest.fullName,
        rating,
        comment,
        date: new Date().toISOString(),
        status: 'Pending',
        source: 'Guest Portal',
        responded: false,
    };
    state.reviews.push(newReview);
    await saveToFirestore('reviews', newReview.id, newReview);
    await createNotification({ type: 'review', title: 'Nova Avaliação Recebida', message: `${guest.fullName} deixou uma avaliação de ${rating} estrelas.` });
};

export const payBalance = async (bookingId: string, paymentDetails?: PaymentDetails | { method: 'PIX' }) => {
    const booking = state.bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.balance = 0;
        booking.paymentStatus = 'Paid';
        await saveToFirestore('bookings', booking.id, booking);
        return booking;
    }
    throw new Error("Booking not found");
};

import ICAL from 'ical.js';

export const updateRoomControls = async (roomId: number, controls: Partial<Pick<Room, 'lightsOn' | 'fanSpeed' | 'doNotDisturb'>>) => {
    await delay(LATENCY / 2);
    const room = state.rooms.find(r => r.id === roomId);
    if (room) {
        Object.assign(room, controls);
        await saveToFirestore('rooms', room.id.toString(), room);
        eventBus.emit('db-update');
    }
};

export const syncICalForRoom = async (roomId: number): Promise<{success: boolean, message: string}> => {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room || !room.icalConfig || room.icalConfig.length === 0) {
        return { success: false, message: 'Configuração de iCal não encontrada para este quarto.' };
    }

    try {
        const response = await fetch(`/api/ical-proxy?url=${encodeURIComponent(room.icalConfig[0].url)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const icalText = await response.text();
        
        const jcalData = ICAL.parse(icalText);
        const vcalendar = new ICAL.Component(jcalData);
        const vevents = vcalendar.getAllSubcomponents('vevent');
        
        console.log(`Sincronizado ${vevents.length} eventos para quarto ${roomId}`);
        
        room.icalConfig[0].lastSync = new Date().toISOString();
        await saveToFirestore('rooms', room.id.toString(), room);
        eventBus.emit('db-update');
        
        return { success: true, message: `Sincronizado com sucesso: ${vevents.length} eventos encontrados.` };
    } catch (error) {
        console.error('Erro ao sincronizar iCal:', error);
        return { success: false, message: 'Falha na sincronização (verifique CORS/URL ou conexão).' };
    }
};

// ... existing code ...

export const requestService = async (bookingId: string, serviceType: 'Limpeza' | 'Manutenção' | 'Lavanderia', details: string): Promise<StaffTask> => {
    await delay(LATENCY);
    const booking = state.bookings.find(b => b.id === bookingId);
    if(!booking) throw new Error("Booking not found");

    const newTask: StaffTask = {
        id: `TSK${Date.now()}`,
        description: `Solicitação de ${serviceType}: ${details}`,
        status: TaskStatus.TODO,
        roomId: booking.roomId,
        bookingId: booking.id,
    };
    state.staffTasks.push(newTask);
    createNotification({type: 'task', title: 'Nova Solicitação de Serviço', message: `Hóspede do quarto ${state.rooms.find(r=>r.id === booking.roomId)?.name} solicitou ${serviceType}.`});
    await saveToFirestore('tasks', newTask.id, newTask);
    return newTask;
};

export const updateKitchenStatus = async (newStatus: 'ok' | 'needs_attention') => {
    await delay(LATENCY / 2);
    state.sharedSpaces.kitchenCleanliness = newStatus;
    if (newStatus === 'needs_attention') {
        createNotification({ type: 'info', title: 'Cozinha Comunitária', message: 'Um hóspede reportou que a cozinha precisa de atenção.' });
    }
    eventBus.emit('shared-space-update');
    await saveToFirestore('sharedSpaces', 'main', state.sharedSpaces);
};

export const saveTravelDetails = async (bookingId: string, details: Booking['travelDetails']) => {
    await delay(LATENCY);
    const booking = state.bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.travelDetails = details;
        await saveToFirestore('bookings', booking.id, booking);
    }
};

export const handleCheckIn = async (bookingId: string) => {
    await delay(LATENCY);
    const booking = state.bookings.find(b => b.id === bookingId);
    if (booking) {
        const room = state.rooms.find(r => r.id === booking.roomId);
        if (room && (room.status === RoomStatus.AVAILABLE || room.status === RoomStatus.CLEANING || room.status === RoomStatus.INSPECTION)) {
            booking.status = 'Checked-in';
            room.status = RoomStatus.OCCUPIED;
            await saveToFirestore('bookings', booking.id, booking);
            await saveToFirestore('rooms', room.id.toString(), room);
            return;
        }
        throw new Error(`Quarto não está pronto. Status atual: ${room?.status}`);
    }
    throw new Error("Reserva não encontrada.");
};

export const getPreArrivalData = async (guestId: string) => {
    await delay(LATENCY);
    const todayString = new Date().toLocaleDateString('en-CA');

    const futureBookings = state.bookings
        .filter(b => {
            if (b.guestId !== guestId) return false;
            if (b.status !== 'Confirmed' && b.status !== 'Pre-Checked-in') return false;
            return b.checkIn >= todayString;
        })
        .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

    const guestBooking = futureBookings[0];

    if (!guestBooking) {
        throw new Error("No upcoming booking found.");
    }

    const bookingCheckIn = new Date(guestBooking.checkIn);
    const startOfWeek = new Date(bookingCheckIn);
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);

    const arrivingBookings = state.bookings.filter(b => {
        const checkIn = new Date(b.checkIn);
        return checkIn >= startOfWeek && checkIn <= endOfWeek && (b.status === 'Confirmed' || b.status === 'Pre-Checked-in');
    });

    const arrivingGuests = arrivingBookings.map(b => {
        const guest = state.guests.find(g => g.id === b.guestId);
        if (!guest) return null;
        return {
            guestId: guest.id,
            guestName: guest.fullName,
            profilePictureUrl: guest.profilePictureUrl,
            travelDetails: b.travelDetails,
            isCurrentUser: guest.id === guestId,
        }
    }).filter(Boolean);

    const chatConversationId = `CHAT_PRE_ARRIVAL_${guestBooking.id}`;

    return { guestBooking, arrivingGuests: arrivingGuests as any[], chatConversationId };
};

export const submitOnlineCheckin = async (bookingId: string, idPhotoUrl: string, signatureUrl: string) => {
    await delay(LATENCY);
    const booking = state.bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.idPhotoUrl = idPhotoUrl;
        booking.signatureUrl = signatureUrl;
        booking.status = 'Pre-Checked-in';
        await saveToFirestore('bookings', booking.id, booking);
    }
};

export const submitPreArrivalVerification = async (bookingId: string, selfieDataUrl: string, signatureDataUrl: string) => {
    const booking = state.bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.selfiePhotoUrl = selfieDataUrl;
        booking.signatureUrl = signatureDataUrl;
        booking.status = 'Pre-Checked-in'; 
        await saveToFirestore('bookings', booking.id, booking);
        eventBus.emit('db-update');
    }
};

export const updateLivingRoomTV = async (updates: Partial<SharedSpaceControls['livingRoomTV']>) => {
    Object.assign(state.sharedSpaces.livingRoomTV, updates);
    eventBus.emit('shared-space-update');
    await saveToFirestore('sharedSpaces', 'main', state.sharedSpaces);
};

export const addSongToPlaylist = async (guestId: string, title: string, artist: string) => {
    const guest = state.guests.find(g => g.id === guestId);
    if (!guest) return;

    const newSong: PlaylistSong = {
        id: `S${Date.now()}`,
        title,
        artist,
        addedByGuestId: guestId,
        addedByGuestName: (guest.fullName || 'Hóspede').split(' ')[0],
        votes: [guestId]
    };

    if (!state.sharedSpaces.commonAreaPlaylist.nowPlaying) {
        state.sharedSpaces.commonAreaPlaylist.nowPlaying = newSong;
    } else {
        state.sharedSpaces.commonAreaPlaylist.queue.push(newSong);
    }
    eventBus.emit('shared-space-update');
    await saveToFirestore('sharedSpaces', 'main', state.sharedSpaces);
};

export const upvoteSong = async (guestId: string, songId: string) => {
    const song = state.sharedSpaces.commonAreaPlaylist.queue.find(s => s.id === songId);
    if (song) {
        if (song.votes.includes(guestId)) {
            song.votes = song.votes.filter(id => id !== guestId);
        } else {
            song.votes.push(guestId);
        }
        eventBus.emit('shared-space-update');
        await saveToFirestore('sharedSpaces', 'main', state.sharedSpaces);
    }
};

export const placeRoomServiceOrder = async (bookingId: string, items: SaleItem[]): Promise<Transaction> => {
    const booking = state.bookings.find(b => b.id === bookingId);
    const guest = state.guests.find(g => g.id === booking?.guestId);
    if (!booking || !guest) throw new Error("Booking or Guest not found");

    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const unit = booking.propertyId || 'beach';
    const itemsWithUnit = items.map(item => ({
        ...item,
        propertyUnitId: item.propertyUnitId || item.propertyId || unit,
        propertyId: item.propertyId || item.propertyUnitId || unit
    }));

    const newTransaction: Transaction = {
        id: `T${Date.now()}`,
        items: itemsWithUnit,
        total,
        paymentMethod: 'Conta do Quarto',
        bookingId,
        guestName: guest.fullName,
        timestamp: new Date().toISOString(),
        propertyUnitId: unit,
        propertyId: unit
    };
    state.transactions.push(newTransaction);
    booking.balance += total;
    createNotification({ type: 'pos', title: 'Novo Pedido de Serviço de Quarto', message: `${guest.fullName} pediu ${items.map(i=>i.name).join(', ')}.` });
    
    await saveToFirestore('transactions', newTransaction.id, newTransaction);
    await saveToFirestore('bookings', booking.id, booking);
    eventBus.emit('db-update');
    
    return newTransaction;
};

export const startReceptionChat = async (guestId: string, guestName: string) => {
    await delay(LATENCY);
    const receptionChatId = `RECEPTION_${guestId}`;
    let conversation = state.chatConversations.find(c => c.id === receptionChatId);
    if (!conversation) {
        conversation = {
            id: receptionChatId,
            guestName: `Recepção <> ${guestName}`,
            lastMessage: 'Chat iniciado.',
            source: 'Website',
            unread: true,
            timestamp: new Date().toISOString(),
        };
        state.chatConversations.push(conversation);
        saveState(state);
    }
    eventBus.emit('new-chat-message');
    return conversation;
};

export const startGuestChat = async (guest1Id: string, guest1Name: string, guest2Id: string, guest2Name: string) => {
    await delay(LATENCY);
    const chatId = `GUESTCHAT_${[guest1Id, guest2Id].sort().join('_')}`;
    let conversation = state.chatConversations.find(c => c.id === chatId);
    if (!conversation) {
        conversation = {
            id: chatId,
            guestName: `${(guest1Name || 'Hóspede').split(' ')[0]} & ${(guest2Name || 'Hóspede').split(' ')[0]}`,
            participants: [ { guestId: guest1Id, guestName: guest1Name }, { guestId: guest2Id, guestName: guest2Name } ],
            lastMessage: 'Chat iniciado.',
            source: 'Website',
            unread: false,
            timestamp: new Date().toISOString(),
        };
        state.chatConversations.push(conversation);
        saveState(state);
    }
    eventBus.emit('new-chat-message');
    return conversation;
};

export const createGuestActivity = async (activityData: Omit<GuestActivity, 'id' | 'creatorName' | 'chatConversationId' | 'photoAlbum'>): Promise<GuestActivity> => {
    await delay(LATENCY);
    const creator = state.guests.find(g => g.id === activityData.creatorId);
    if(!creator) throw new Error("Creator not found");

    const newActivity: GuestActivity = {
        ...activityData,
        id: `GA${Date.now()}`,
        creatorName: creator.fullName,
        chatConversationId: `CHAT_GA${Date.now()}`,
        photoAlbum: [],
    };
    state.guestActivities.push(newActivity);
    await saveToFirestore('guestActivities', newActivity.id, newActivity);
    return newActivity;
};

export const updateGuestActivity = async (activityData: GuestActivity): Promise<GuestActivity> => {
    await delay(LATENCY);
    state.guestActivities = state.guestActivities.map(a => a.id === activityData.id ? activityData : a);
    await saveToFirestore('guestActivities', activityData.id, activityData);
    return activityData;
};

export const deleteGuestActivity = async (activityId: string): Promise<void> => {
    await delay(LATENCY);
    state.guestActivities = state.guestActivities.filter(a => a.id !== activityId);
    await deleteFromFirestore('guestActivities', activityId);
};

export const joinGuestActivity = async (activityId: string, guestId: string, guestName: string): Promise<ActivityParticipant> => {
    await delay(LATENCY);
    const newParticipant: ActivityParticipant = { activityId, guestId, guestName };
    state.activityParticipants.push(newParticipant);
    await saveToFirestore('activityParticipants', `${activityId}_${guestId}`, newParticipant);
    return newParticipant;
};

export const leaveGuestActivity = async (activityId: string, guestId: string): Promise<void> => {
    await delay(LATENCY);
    state.activityParticipants = state.activityParticipants.filter(p => !(p.activityId === activityId && p.guestId === guestId));
    await deleteFromFirestore('activityParticipants', `${activityId}_${guestId}`);
};

export const addActivityComment = async (activityId: string, guestId: string, guestName: string, text: string): Promise<ActivityComment> => {
    await delay(LATENCY);
    const newComment: ActivityComment = { id: `AC${Date.now()}`, activityId, guestId, guestName, text, timestamp: new Date().toISOString() };
    state.activityComments.push(newComment);
    await saveToFirestore('activityComments', newComment.id, newComment);
    return newComment;
};

export const makeActivityContribution = async (activityId: string, guestId: string, amount: number): Promise<ActivityContribution> => {
    await delay(LATENCY);
    const newContribution: ActivityContribution = { activityId, guestId, amount };
    state.activityContributions.push(newContribution);
    eventBus.emit('db-update');
    saveState(state);
    return newContribution;
};

export const toggleFavoriteTip = async (guestId: string, tipId: string) => {
    await delay(LATENCY);
    const guest = state.guests.find(g => g.id === guestId);
    if (guest) {
        if (!guest.favoriteTipIds) guest.favoriteTipIds = [];
        if (guest.favoriteTipIds.includes(tipId)) {
            guest.favoriteTipIds = guest.favoriteTipIds.filter(id => id !== tipId);
        } else {
            guest.favoriteTipIds.push(tipId);
        }
        await saveToFirestore('guests', guestId, guest);
        eventBus.emit('user-update', guest);
    }
};

export const updateItinerary = async (guestId: string, itinerary: ItineraryItem[]) => {
    await delay(LATENCY);
    const guest = state.guests.find(g => g.id === guestId);
    if (guest) {
        guest.itinerary = itinerary;
        await saveToFirestore('guests', guestId, guest);
        eventBus.emit('user-update', guest);
    }
};

export const unlockAchievement = async (guestId: string, achievementId: string) => {
    await delay(LATENCY);
    const guest = state.guests.find(g => g.id === guestId);
    if (guest) {
        if (!guest.unlockedAchievements) guest.unlockedAchievements = [];
        if (!guest.unlockedAchievements.includes(achievementId)) {
            guest.unlockedAchievements.push(achievementId);
            await saveToFirestore('guests', guestId, guest);
            eventBus.emit('user-update', guest);
        }
    }
};

export const redeemReward = async (guestId: string, rewardId: string) => {
    await delay(LATENCY);
    const guest = state.guests.find(g => g.id === guestId);
    const reward = state.rewards.find(r => r.id === rewardId);
    if (guest && reward && (guest.points || 0) >= reward.cost) {
        guest.points = (guest.points || 0) - reward.cost;
        const redeemed: RedeemedReward = {
            id: `RR${Date.now()}`,
            guestId,
            rewardId,
            rewardName: reward.name,
            cost: reward.cost,
            timestamp: new Date().toISOString()
        };
        state.redeemedRewards.push(redeemed);
        eventBus.emit('user-update', guest);
        saveState(state);
    } else {
        throw new Error("Pontos insuficientes ou recompensa não encontrada.");
    }
};

export const addGuestPost = async (guestId: string, text: string, mediaUrl?: string, mediaType: 'image' | 'video' = 'image') => {
    await delay(LATENCY);
    const guest = state.guests.find(g => g.id === guestId);
    if (!guest) return;
    const newPost: GuestPost = {
        id: `GP${Date.now()}`,
        guestId,
        guestName: guest.fullName,
        guestProfilePictureUrl: guest.profilePictureUrl,
        text,
        mediaUrl,
        mediaType,
        timestamp: new Date().toISOString(),
        likes: [],
        comments: [],
    };
    state.guestPosts.unshift(newPost);
    await saveToFirestore('guestPosts', newPost.id, newPost);
};

export const addGuestStory = async (guestId: string, mediaUrl: string, mediaType: 'image' | 'video' = 'image') => {
    await delay(LATENCY);
    const guest = state.guests.find(g => g.id === guestId);
    if (!guest) return;
    const newStory: GuestStory = {
        id: `GS${Date.now()}`,
        guestId,
        guestName: guest.fullName,
        guestProfilePictureUrl: guest.profilePictureUrl,
        mediaUrl,
        mediaType,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        viewers: [],
    };
    state.guestStories.unshift(newStory);
    await saveToFirestore('guestStories', newStory.id, newStory);
};

export const viewStory = async (storyId: string, guestId: string) => {
    await delay(LATENCY / 2);
    const story = state.guestStories.find(s => s.id === storyId);
    if (story && !story.viewers.includes(guestId)) {
        story.viewers.push(guestId);
        await saveToFirestore('guestStories', story.id, story);
    }
};

export const makeCheckIn = async (guestId: string, locationId: string, locationType: 'tip' | 'activity') => {
    await delay(LATENCY);
    const guest = state.guests.find(g => g.id === guestId);
    if (!guest) return;
    const location = locationType === 'tip'
        ? state.localGuideTips.find(l => l.id === locationId)
        : state.guestActivities.find(l => l.id === locationId);
    
    if (!location) return;

    const newCheckIn: CheckIn = {
        id: `CI${Date.now()}`,
        guestId,
        locationId,
        locationName: location.title,
        locationType,
        timestamp: new Date().toISOString()
    };
    state.checkIns.push(newCheckIn);
    // Add points logic here if any
    eventBus.emit('db-update');
    saveState(state);
};

export const sendConciergeMessage = async (guestId: string, message: string): Promise<AIConciergeMessage> => {
    await delay(LATENCY);
    const guest = state.guests.find(g => g.id === guestId);
    if (!guest) throw new Error("Guest not found");

    if (!guest.conciergeChatHistory) guest.conciergeChatHistory = [];
    
    const userMessage: AIConciergeMessage = {
        id: `MSG_USER_${Date.now()}`,
        sender: 'user',
        text: message,
        timestamp: new Date().toISOString()
    };
    guest.conciergeChatHistory.push(userMessage);

    const loadingMessage: AIConciergeMessage = {
        id: `MSG_AGENT_LOADING_${Date.now()}`,
        sender: 'agent',
        text: '...',
        timestamp: new Date().toISOString(),
        isLoading: true,
    };
    guest.conciergeChatHistory.push(loadingMessage);

    eventBus.emit('user-update', guest);

    const aiResponseText = await geminiGetAIConciergeResponse(guest.conciergeChatHistory, message, state.properties[0]);

    const agentMessage: AIConciergeMessage = {
        id: `MSG_AGENT_${Date.now()}`,
        sender: 'agent',
        text: aiResponseText,
        timestamp: new Date().toISOString(),
    };

    guest.conciergeChatHistory = guest.conciergeChatHistory.filter(m => !m.isLoading);
    guest.conciergeChatHistory.push(agentMessage);

    eventBus.emit('user-update', guest);
    saveState(state);

    return agentMessage;
};

export const rsvpToEvent = async (eventId: string, guestId: string, guestName: string) => {
    await delay(LATENCY);
    if (!state.eventParticipants.some(p => p.eventId === eventId && p.guestId === guestId)) {
        state.eventParticipants.push({ eventId, guestId, guestName });
        saveState(state);
    }
    eventBus.emit('db-update');
};

export const cancelRsvpFromEvent = async (eventId: string, guestId: string) => {
    await delay(LATENCY);
    state.eventParticipants = state.eventParticipants.filter(p => !(p.eventId === eventId && p.guestId === guestId));
    saveState(state);
    eventBus.emit('db-update');
};

export const getBookingStatement = async (bookingId: string) => {
    await delay(LATENCY);
    const booking = state.bookings.find(b => b.id === bookingId);
    const transactions = state.transactions.filter(t => t.bookingId === bookingId && t.paymentMethod === 'Conta do Quarto');
    
    const statement: { date: string, description: string, amount: number }[] = [];
    if (booking) {
        statement.push({ date: booking.checkIn, description: `Hospedagem (${(new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000} noites)`, amount: booking.totalPrice });
    }
    transactions.forEach(t => {
        statement.push({ date: t.timestamp, description: t.items.map(i => i.name).join(', '), amount: t.total });
    });
    return statement;
};

export const getIcebreakerSuggestions = async (guestId: string) => {
    await delay(LATENCY);
    const currentUser = state.guests.find(g => g.id === guestId);
    if (!currentUser) return null;

    const otherGuests = state.guests.filter(g => g.id !== guestId);
    return geminiGenerateIcebreakerSuggestions(currentUser, otherGuests);
};

export const generateAndSaveItinerary = async (guestId: string) => {
    await delay(LATENCY);
    const guest = state.guests.find(g => g.id === guestId);
    if (!guest) return;

    const weather = { condition: 'Ensolarado' }; // Mock weather
    const result = await geminiGenerateDailyItinerary(guest, state.localGuideTips, state.propertyEvents, weather);
    
    if (result && result.itinerary) {
        const newItinerary: ItineraryItem[] = result.itinerary.map(item => {
            const source = state.localGuideTips.find(t => t.title === item.activityTitle) || state.propertyEvents.find(e => e.title === item.activityTitle);
            return {
                id: `ITI_${Date.now()}_${Math.random()}`,
                date: new Date().toISOString().split('T')[0],
                time: item.period === 'Manhã' ? '09:00' : item.period === 'Tarde' ? '15:00' : '20:00',
                title: item.activityTitle,
                type: source ? ( 'category' in source ? 'tip' : 'event' ) : 'tip',
                sourceId: source?.id || '',
                justification: item.justification,
            };
        });
        guest.itinerary = newItinerary;
        eventBus.emit('user-update', guest);
        saveState(state);
    }
};

export const markGuestNotificationAsRead = async (guestId: string, notificationId: string) => {
    await delay(LATENCY);
    const notification = state.guestNotifications.find(n => n.id === notificationId && n.guestId === guestId);
    if(notification) notification.read = true;
    eventBus.emit('user-update', state.guests.find(g => g.id === guestId));
    saveState(state);
};

export const togglePostLike = async (postId: string, guestId: string) => {
    await delay(LATENCY);
    const post = state.guestPosts.find(p => p.id === postId);
    if (post) {
        if (post.likes.includes(guestId)) {
            post.likes = post.likes.filter(id => id !== guestId);
        } else {
            post.likes.push(guestId);
        }
    }
    eventBus.emit('db-update');
    saveState(state);
};

export const addPostComment = async (postId: string, guestId: string, text: string) => {
    await delay(LATENCY);
    const post = state.guestPosts.find(p => p.id === postId);
    const guest = state.guests.find(g => g.id === guestId);
    if (post && guest) {
        const newComment: GuestPostComment = {
            guestId,
            guestName: guest.fullName,
            text,
            timestamp: new Date().toISOString()
        };
        post.comments.push(newComment);
    }
    eventBus.emit('db-update');
    saveState(state);
};

export const addPhotoToActivityAlbum = async (activityId: string, photoUrl: string) => {
    await delay(LATENCY);
    const activity = state.guestActivities.find(a => a.id === activityId);
    if (activity) {
        if(!activity.photoAlbum) activity.photoAlbum = [];
        activity.photoAlbum.push(photoUrl);
    }
    eventBus.emit('db-update');
    saveState(state);
};

export const addLostAndFoundItem = async (itemData: Omit<LostAndFoundItem, 'id' | 'guestName'>) => {
    await delay(LATENCY);
    const guest = state.guests.find(g => g.id === itemData.guestId);
    if (!guest) return;
    const newItem: LostAndFoundItem = {
        ...itemData,
        id: `LF${Date.now()}`,
        guestName: guest.fullName,
    };
    state.lostAndFoundItems.unshift(newItem);
    eventBus.emit('db-update');
    saveState(state);
};

export const claimFoundItem = async (itemId: string, claimerId: string) => {
    await delay(LATENCY);
    const item = state.lostAndFoundItems.find(i => i.id === itemId);
    if (item) {
        item.status = 'claimed';
        item.claimerId = claimerId;
    }
    eventBus.emit('db-update');
    saveState(state);
};

export const deleteLostAndFoundItem = async (itemId: string, requestorId: string) => {
    await delay(LATENCY);
    const itemIndex = state.lostAndFoundItems.findIndex(i => i.id === itemId);
    if (itemIndex > -1 && state.lostAndFoundItems[itemIndex].guestId === requestorId) {
        state.lostAndFoundItems.splice(itemIndex, 1);
        eventBus.emit('db-update');
        saveState(state);
    }
};

export const addClassifiedsItem = async (itemData: Omit<ClassifiedsItem, 'id' | 'guestName' | 'status'>) => {
    await delay(LATENCY);
    const guest = state.guests.find(g => g.id === itemData.guestId);
    if (!guest) return;
    const newItem: ClassifiedsItem = {
        ...itemData,
        id: `CLS${Date.now()}`,
        guestName: guest.fullName,
        status: 'active',
    };
    state.classifiedsItems.unshift(newItem);
    eventBus.emit('db-update');
    saveState(state);
};

export const deleteClassifiedsItem = async (itemId: string, requestorId: string) => {
    await delay(LATENCY);
    const itemIndex = state.classifiedsItems.findIndex(i => i.id === itemId);
    if (itemIndex > -1 && state.classifiedsItems[itemIndex].guestId === requestorId) {
        state.classifiedsItems.splice(itemIndex, 1);
        eventBus.emit('db-update');
        saveState(state);
    }
};

export const checkStayExtension = async (bookingId: string, newCheckOutDate: string) => {
    await delay(LATENCY);
    const booking = state.bookings.find(b => b.id === bookingId);
    if (!booking) return { available: false, error: 'Reserva não encontrada', extensionCost: 0, newTotalPrice: 0 };
    // Simplified availability check
    return { available: true, extensionCost: 200, newTotalPrice: booking.totalPrice + 200 };
};

export const confirmStayExtension = async (bookingId: string, newCheckOutDate: string) => {
    await delay(LATENCY);
    const booking = state.bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.checkOut = newCheckOutDate;
        booking.totalPrice += 200; // Simplified
        booking.balance += 200;
        await saveToFirestore('bookings', booking.id, booking);
    }
};

export const getLodgingAgreement = async (bookingId: string) => {
    const booking = state.bookings.find(b => b.id === bookingId);
    const guest = state.guests.find(g => g.id === booking?.guestId);
    const property = state.properties.find(p => p.id === state.currentPropertyId) || state.properties[0];
    const room = state.rooms.find(r => r.id === booking?.roomId);

    if (!booking || !guest || !property) return { title: 'Contrato não encontrado', content: 'Erro ao carregar dados do contrato.' };

    const content = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE HOSPEDAGEM

1. DAS PARTES
Contratada: ${property.name}, com endereço em ${property.address}.
Contratante: ${guest.fullName}, portador(a) do CPF/Documento nº ${guest.cpf || 'Não informado'}, residente e domiciliado(a) no endereço informado no cadastro.

2. DO OBJETO
O presente contrato tem como objeto a prestação de serviços de hospedagem nas dependências da Contratada, especificamente na Unidade ${room?.name || 'Standard'}, para o período de ${new Date(booking.checkIn).toLocaleDateString('pt-BR')} a ${new Date(booking.checkOut).toLocaleDateString('pt-BR')}.

3. VALORES E PAGAMENTO
O valor total da reserva é de ${booking.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, incluindo as diárias e eventuais serviços adicionais contratados previamente. Consumos extras durante a estadia serão cobrados separadamente no check-out.

4. REGRAS DE CONVIVÊNCIA E USO
O Contratante declara estar ciente e concordar com o Regulamento Interno da Contratada, incluindo horários de silêncio, uso de áreas comuns e política de danos ao patrimônio.

5. POLÍTICA DE CANCELAMENTO E NO-SHOW
Cancelamentos seguem a política informada no momento da reserva. O não comparecimento (no-show) implica na cobrança conforme política vigente.

6. PROTEÇÃO DE DADOS (LGPD/GDPR)
A Contratada compromete-se a tratar os dados pessoais do Contratante de acordo com as legislações vigentes, utilizando-os apenas para fins de gestão da hospedagem e obrigações legais.

Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
`;

    return { title: 'Contrato de Hospedagem', content: content.trim() };
};

export const getInvoice = async (bookingId: string) => {
    const booking = state.bookings.find(b => b.id === bookingId);
    const guest = state.guests.find(g => g.id === booking?.guestId);
    const property = state.properties.find(p => p.id === state.currentPropertyId) || state.properties[0];
    const room = state.rooms.find(r => r.id === booking?.roomId);
    const transactions = state.transactions.filter(t => t.bookingId === bookingId);

    if (!booking || !guest || !property) return { title: 'Fatura não encontrada', content: 'Erro ao carregar dados da fatura.' };

    const subtotaldiarias = booking.totalPrice;
    const extrasTotal = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalGeral = subtotaldiarias + extrasTotal;

    let content = `
FATURA DE HOSPEDAGEM #INV-${bookingId.toUpperCase()}

DADOS DO ESTABELECIMENTO
${property.name}
Endereço: ${property.address}
E-mail: ${property.email} | Tel: ${property.phone}

DADOS DO HÓSPEDE
Nome: ${guest.fullName}
Documento: ${guest.cpf || '---'}
Período: ${new Date(booking.checkIn).toLocaleDateString('pt-BR')} - ${new Date(booking.checkOut).toLocaleDateString('pt-BR')}
Quarto: ${room?.name || '---'}

--- DETALHAMENTO DOS SERVIÇOS ---

1. Diárias de Hospedagem: ${subtotaldiarias.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
`;

    if (transactions.length > 0) {
        content += `\nCONSUMOS EXTRAS:\n`;
        transactions.forEach(t => {
            content += `- ${new Date(t.timestamp).toLocaleDateString('pt-BR')} | ${t.items.map(i => i.name).join(', ')}: ${t.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
        });
    }

    content += `
---------------------------------
TOTAL GERAL: ${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
STATUS: ${booking.balance <= 0 ? 'PAGO' : 'PENDENTE'}

Documento para fins informativos e de conferência. Para fins fiscais, solicite a Nota Fiscal na recepção.
Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
`;

    return { title: 'Nota Fiscal / Recibo', content: content.trim() };
};

export const handlePreCheckout = async (bookingId: string, checkoutTime: string) => {
    await delay(LATENCY);
    const booking = state.bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.preCheckoutCompleted = true;
        booking.preCheckoutTime = checkoutTime;
        createNotification({ type: 'info', title: `Pré Check-out Agendado`, message: `Hóspede do quarto ${state.rooms.find(r=>r.id===booking.roomId)?.name} agendou pré check-out para as ${checkoutTime}.`});
        saveState(state);
    }
};

export const bookPartnerService = async (guestId: string, serviceId: string, serviceDate: string): Promise<ServiceBooking> => {
    await delay(LATENCY);
    const guest = state.guests.find(g => g.id === guestId);
    const service = state.partnerServices.find(s => s.id === serviceId);
    if (!guest || !service) {
        throw new Error("Hóspede ou serviço não encontrado");
    }

    const commissionEarned = service.commissionType === 'percentage'
        ? service.totalPrice * (service.commissionValue / 100)
        : service.commissionValue;

    const newBooking: ServiceBooking = {
        id: `SB${Date.now()}`,
        guestId,
        serviceId,
        bookingDate: new Date().toISOString(),
        serviceDate,
        totalPricePaid: service.totalPrice,
        commissionEarned,
        status: 'Solicitado'
    };

    state.serviceBookings.push(newBooking);
    createNotification({
        type: 'info',
        title: 'Nova Reserva de Serviço',
        message: `${guest.fullName} reservou o serviço "${service.name}".`,
        linkTo: 'partner_services'
    });
    await saveToFirestore('serviceBookings', newBooking.id, newBooking);
    eventBus.emit('db-update');
    return newBooking;
};

export const applyDynamicPriceSuggestions = async (suggestions: { roomId: number, newPrice: number }[]) => {
    await delay(LATENCY);
    for (const suggestion of suggestions) {
        const room = state.rooms.find(r => r.id === suggestion.roomId);
        if (room) {
            room.basePrice = suggestion.newPrice;
            await saveToFirestore('rooms', room.id.toString(), room);
        }
    }
    eventBus.emit('db-update');
};

export const generateAndSaveDigitalMenu = async () => {
    const result = await generateDigitalMenu(state.products);
    if (result && result.categories) {
        state.digitalMenu = result.categories;
        await saveToFirestore('digitalMenu', 'main', result.categories);
        eventBus.emit('db-update');
    }
};

export const addTaskComment = async (taskId: string, staffId: string, text: string) => {
    await delay(LATENCY);
    const task = state.staffTasks.find(t => t.id === taskId);
    if (task) {
        if (!task.comments) task.comments = [];
        const staff = state.staff.find(s => s.id === staffId);
        task.comments.push({ id: `CMT${Date.now()}`, staffId, staffName: staff?.name || 'Unknown', text, timestamp: new Date().toISOString() });
        saveState(state);
        eventBus.emit('db-update');
    }
};

export const addProjectAttachment = async (projectId: string, fileName: string, url: string) => {
    await delay(LATENCY);
    const project = state.projects.find(p => p.id === projectId);
    if(project) {
        if(!project.attachments) project.attachments = [];
        project.attachments.push({ id: `ATT${Date.now()}`, fileName, url, uploadedAt: new Date().toISOString() });
        await saveToFirestore('projects', project.id, project);
        eventBus.emit('db-update');
    }
};

export const addTaskAttachment = async (taskId: string, fileName: string, url: string) => {
    await delay(LATENCY);
    const task = state.staffTasks.find(t => t.id === taskId);
    if(task) {
        if(!task.attachments) task.attachments = [];
        task.attachments.push({ id: `ATT${Date.now()}`, taskId, fileName, url, uploadedAt: new Date().toISOString() });
        saveState(state);
        eventBus.emit('db-update');
    }
};


// --- Admin-only actions ---
export const addRoom = async (roomData: Omit<Room, 'id' | 'status'>) => {
    const newRoom: Room = {
        ...roomData,
        id: Math.max(...state.rooms.map(r => r.id)) + 1,
        status: RoomStatus.AVAILABLE,
    };
    state.rooms.push(newRoom);
    await saveToFirestore('rooms', newRoom.id.toString(), newRoom);
    eventBus.emit('db-update');
};

export const updateRoom = async (updatedRoom: Room) => {
    state.rooms = state.rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r);
    await saveToFirestore('rooms', updatedRoom.id.toString(), updatedRoom);
    eventBus.emit('db-update');
};

export const addBooking = async (bookingData: Omit<Booking, 'id' | 'totalPrice' | 'balance' | 'paymentStatus' | 'status'>) => {
    const room = state.rooms.find(r => r.id === bookingData.roomId);
    if(!room) throw new Error("Room not found");
    const nights = (new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / 86400000;
    const totalPrice = room.basePrice * nights;

    const newBooking: Booking = { 
        ...bookingData, 
        id: `B${Date.now()}`,
        status: 'Confirmed',
        totalPrice,
        balance: 0,
        paymentStatus: 'Pending',
        source: 'Walk-in',
    };
    state.bookings.push(newBooking);
    await saveToFirestore('bookings', newBooking.id, newBooking);
    eventBus.emit('db-update');
};

export const updateBookingDetails = async (bookingId: string, updates: Partial<Pick<Booking, 'checkIn' | 'checkOut' | 'roomId'>>) => {
    const booking = state.bookings.find(b => b.id === bookingId);
    if(booking) {
        Object.assign(booking, updates);
        await saveToFirestore('bookings', booking.id, booking);
        eventBus.emit('db-update');
    }
};

export const addStaff = async (staffData: Omit<Staff, 'id'>) => {
    // To create a staff member without signing out the current admin, 
    // we use a secondary Firebase app instance.
    let secondaryApp;
    const normalizedEmail = staffData.email.toLowerCase().trim();
    try {
        secondaryApp = getApps().find(app => app.name === 'SecondaryRegistration') || initializeApp(firebaseConfig, 'SecondaryRegistration');
        const secondaryAuth = getAuth(secondaryApp);
        
        // 1. Create the user in Auth
        const result = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, (staffData as any).password || 'staff123');
        const fbUid = result.user.uid;
        
        // Sign out of the secondary app immediately so it doesn't interfere
        await secondarySignOut(secondaryAuth);
        
        // 2. Create the Staff document in Firestore using the UID
        const newStaff: Staff = { 
            ...staffData, 
            id: fbUid,
            email: normalizedEmail,
            name: staffData.name || 'Membro da Equipe'
        };
        
        // state.staff.push(newStaff); // Will be updated by snapshot
        await saveToFirestore('staff', newStaff.id, newStaff);
        eventBus.emit('db-update');
        
        return newStaff;
    } catch (error: any) {
        console.error("Error creating staff member:", error);
        throw error;
    }
};

export const updateStaff = async (updatedStaff: Staff) => {
    state.staff = state.staff.map(s => s.id === updatedStaff.id ? updatedStaff : s);
    await saveToFirestore('staff', updatedStaff.id, updatedStaff);
    eventBus.emit('db-update');
};

export const deleteStaff = async (staffId: string) => {
    state.staff = state.staff.filter(s => s.id !== staffId);
    await deleteFromFirestore('staff', staffId);
    eventBus.emit('db-update');
};

export const addTask = async (taskData: Omit<StaffTask, 'id'>) => {
    let propUnit = taskData.propertyUnitId || taskData.propertyId;
    if (!propUnit && taskData.assigneeId) {
        const staffMember = state.staff.find(s => s.id === taskData.assigneeId);
        if (staffMember?.propertyId && staffMember.propertyId !== 'all') propUnit = staffMember.propertyId;
    }
    if (!propUnit) propUnit = 'beach';

    const newTask: StaffTask = { 
        ...taskData, 
        propertyUnitId: propUnit,
        propertyId: propUnit,
        id: `TSK${Date.now()}` 
    };
    state.staffTasks.push(newTask);
    await saveToFirestore('tasks', newTask.id, newTask);
    eventBus.emit('db-update');
};

export const updateTask = async (task: StaffTask) => {
    let propUnit = task.propertyUnitId || task.propertyId;
    if (!propUnit && task.assigneeId) {
        const staffMember = state.staff.find(s => s.id === task.assigneeId);
        if (staffMember?.propertyId && staffMember.propertyId !== 'all') propUnit = staffMember.propertyId;
    }
    if (!propUnit) propUnit = 'beach';

    const updatedTask: StaffTask = {
        ...task,
        propertyUnitId: propUnit,
        propertyId: propUnit
    };

    state.staffTasks = state.staffTasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    await saveToFirestore('tasks', updatedTask.id, updatedTask);
    eventBus.emit('db-update');
};

export const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'timestamp'>, paymentDetails?: PaymentDetails | { method: 'PIX' }) => {
    let unit = transactionData.propertyUnitId || transactionData.propertyId;
    if (!unit) {
        if (transactionData.tableId) {
            const table = state.tables.find(t => t.id === transactionData.tableId);
            if (table?.propertyId) unit = table.propertyId;
        } else if (transactionData.bookingId) {
            const booking = state.bookings.find(b => b.id === transactionData.bookingId);
            if (booking?.propertyId) unit = booking.propertyId;
        }
    }
    if (!unit) unit = 'beach';

    const itemsWithUnit = (transactionData.items || []).map(item => ({
        ...item,
        propertyUnitId: item.propertyUnitId || item.propertyId || unit,
        propertyId: item.propertyId || item.propertyUnitId || unit
    }));

    const newTransaction: Transaction = {
        ...transactionData,
        items: itemsWithUnit,
        propertyUnitId: unit,
        propertyId: unit,
        id: `T${Date.now()}`,
        timestamp: new Date().toISOString(),
    };
    state.transactions.push(newTransaction);
    await saveToFirestore('transactions', newTransaction.id, newTransaction);

    if (transactionData.tableId) {
        const table = state.tables.find(t => t.id === transactionData.tableId);
        if (table) {
            table.currentItems = [];
            table.status = 'Livre' as any;
            await saveToFirestore('tables', table.id, table);
        }
    }

    // Update stock and check for low stock
    for (const item of transactionData.items) {
        const product = state.products.find(p => p.id === item.productId);
        if (product) {
            const oldStock = product.stock;
            product.stock -= item.quantity;
            await saveToFirestore('products', product.id, product);

            // If stock drops below threshold, add to shopping list
            if (oldStock > product.lowStockThreshold && product.stock <= product.lowStockThreshold) {
                let activeList = state.shoppingLists.find(l => l.status === 'Pendente');
                if (!activeList) {
                    activeList = { id: `SL${Date.now()}`, name: `Lista de Compras ${new Date().toLocaleDateString()}`, status: 'Pendente', createdAt: new Date().toISOString(), items: [] };
                    state.shoppingLists.push(activeList);
                    await saveToFirestore('shoppingLists', activeList.id, activeList);
                }
                // Avoid adding duplicates
                if (!activeList.items.some(i => i.productId === product.id)) {
                     const newItem: ShoppingListItem = { 
                        id: `SLI${Date.now()}`, 
                        name: product.name, 
                        category: product.category, 
                        status: 'Pendente', 
                        productId: product.id,
                        justification: 'Estoque baixo após venda no PDV.'
                    };
                    activeList.items.push(newItem);
                    await saveToFirestore('shoppingLists', activeList.id, activeList);
                    createNotification({
                        type: 'info',
                        title: 'Estoque Baixo',
                        message: `"${product.name}" foi adicionado à lista de compras.`,
                        linkTo: 'shopping_list'
                    });
                }
            }
        }
    }

    if (transactionData.bookingId && transactionData.paymentMethod === 'Conta do Quarto') {
        const booking = state.bookings.find(b => b.id === transactionData.bookingId);
        if (booking) {
            booking.balance += transactionData.total;
            await saveToFirestore('bookings', booking.id, booking);
        }
    }
    eventBus.emit('db-update');
};

export const addProduct = async (productData: Omit<Product, 'id'>) => {
    await delay(LATENCY);
    const newProduct: Product = { ...productData, id: `P${Date.now()}` };
    state.products.push(newProduct);
    await saveToFirestore('products', newProduct.id, newProduct);
};

export const updateProduct = async (product: Product) => {
    await delay(LATENCY);
    state.products = state.products.map(p => p.id === product.id ? product : p);
    await saveToFirestore('products', product.id, product);
};

export const deleteProduct = async (productId: string) => {
    await delay(LATENCY);
    state.products = state.products.filter(p => p.id !== productId);
    await deleteFromFirestore('products', productId);
};

export const startChat = async (name: string, firstMessage: string): Promise<{ conversation: ChatConversation; message: ChatMessage }> => {
    await delay(LATENCY);
    const conversationId = `C${Date.now()}`;
    const newConversation: ChatConversation = {
        id: conversationId,
        guestName: name,
        lastMessage: firstMessage,
        source: 'Website',
        unread: true,
        timestamp: new Date().toISOString(),
    };
    const newMessage: ChatMessage = {
        id: `M${Date.now()}`,
        conversationId,
        senderId: `GUEST_WEBSITE_${name.replace(/\s/g, '_')}`,
        senderName: name,
        text: firstMessage,
        timestamp: new Date().toISOString(),
    };
    state.chatConversations.push(newConversation);
    state.chatMessages.push(newMessage);
    eventBus.emit('new-chat-message');
    await saveToFirestore('chatConversations', newConversation.id, newConversation);
    await saveToFirestore('chatMessages', newMessage.id, newMessage);
    return { conversation: newConversation, message: newMessage };
};

export const sendMessage = async (conversationId: string, text: string, senderId: string, senderName: string): Promise<ChatMessage> => {
    await delay(LATENCY);
    const newMessage: ChatMessage = {
        id: `M${Date.now()}`,
        conversationId,
        senderId,
        senderName,
        text,
        timestamp: new Date().toISOString(),
    };
    state.chatMessages.push(newMessage);
    
    const conversation = state.chatConversations.find(c => c.id === conversationId);
    if (conversation) {
        conversation.lastMessage = text;
        conversation.timestamp = newMessage.timestamp;
        conversation.unread = !senderId.startsWith('S'); // Mark unread if sender is not staff
        await saveToFirestore('chatConversations', conversation.id, conversation);
    }

    eventBus.emit('new-chat-message');
    await saveToFirestore('chatMessages', newMessage.id, newMessage);
    return newMessage;
};

export const markConversationAsRead = async (conversationId: string) => {
    const conversation = state.chatConversations.find(c => c.id === conversationId);
    if (conversation) {
        conversation.unread = false;
        await saveToFirestore('chatConversations', conversation.id, conversation);
    }
};

export const togglePlatformConnection = async (platform: AdPlatform) => {
    await delay(LATENCY * 2);
    const connection = state.platformConnections.find(p => p.platform === platform);
    if (connection) {
        connection.connected = !connection.connected;
        if(connection.connected) {
            connection.accountName = `${platform} Account`;
            connection.accountId = `${Math.floor(100000 + Math.random() * 900000)}`;
        } else {
            connection.accountName = null;
            connection.accountId = null;
        }
        await saveToFirestore('platformConnections', platform, connection);
    }
};

export const savePlatformConnections = async (connections: SocialConnection[]) => {
    state.socialConnections = connections;
    for (const conn of connections) {
        await saveToFirestore('socialConnections', conn.platform, conn);
    }
    eventBus.emit('db-update');
};

export const applyABTest = async (adSetId: string, newCopy: { headline: string; description: string; }) => {
    const newAd: Ad = {
        id: `A${Date.now()}`,
        name: `Variação B - ${new Date().toLocaleDateString()}`,
        status: 'Ativa',
        copy: newCopy,
    };
    // Find the ad set and add the new ad
    for (const campaign of state.adCampaigns) {
        const adSet = campaign.adSets.find(as => as.id === adSetId);
        if (adSet) {
            adSet.ads.push(newAd);
            await saveToFirestore('adCampaigns', campaign.id, campaign);
            break;
        }
    }
    eventBus.emit('db-update');
};

export const saveAutomationRule = async (campaignId: string, rule: { condition: string; action: string; }) => {
    await delay(LATENCY);
    const campaign = state.adCampaigns.find(c => c.id === campaignId);
    if (campaign) {
        const newRule: AutomationRule = { id: `RULE${Date.now()}`, ...rule };
        campaign.rules.push(newRule);
        await saveToFirestore('adCampaigns', campaign.id, campaign);
    }
};

export const deleteAutomationRule = async (campaignId: string, ruleId: string) => {
    await delay(LATENCY);
    const campaign = state.adCampaigns.find(c => c.id === campaignId);
    if (campaign) {
        campaign.rules = campaign.rules.filter(r => r.id !== ruleId);
        await saveToFirestore('adCampaigns', campaign.id, campaign);
    }
};

export const createAudience = async (audienceData: Omit<CustomAudience, 'id'>) => {
    await delay(LATENCY);
    const newAudience: CustomAudience = { ...audienceData, id: `AUD${Date.now()}` };
    state.customAudiences.push(newAudience);
    await saveToFirestore('customAudiences', newAudience.id, newAudience);
};

export const updateAd = async (campaignId: string, adSetId: string, adId: string, updates: Partial<Ad>) => {
    await delay(LATENCY);
    const campaign = state.adCampaigns.find(c => c.id === campaignId);
    const adSet = campaign?.adSets.find(as => as.id === adSetId);
    if (adSet && campaign) {
        adSet.ads = adSet.ads.map(ad => ad.id === adId ? { ...ad, ...updates } : ad);
        await saveToFirestore('adCampaigns', campaign.id, campaign);
    }
};

export const changeAdCampaignStatus = async (campaignId: string, newStatus: AdCampaign['status']) => {
    await delay(LATENCY);
    const campaign = state.adCampaigns.find(c => c.id === campaignId);
    if (campaign) {
        campaign.status = newStatus;
        await saveToFirestore('adCampaigns', campaign.id, campaign);
    }
};

export const addAdCampaign = async (campaignData: any) => {
    await delay(LATENCY);
    const newCampaign: AdCampaign = {
        id: `AD${Date.now()}`,
        ...campaignData,
        isGeneratedByAI: true,
        rules: [],
        adSets: campaignData.adSets.map((adSet: any) => ({
            ...adSet,
            id: `AS${Date.now()}${Math.random()}`,
            kpis: { impressions: 0, clicks: 0, cost: 0, conversions: 0 },
            ads: adSet.ads.map((ad: any) => ({
                ...ad,
                copy: { headline: ad.headline, description: ad.description },
                id: `A${Date.now()}${Math.random()}`,
                status: 'Rascunho',
            }))
        }))
    };
    state.adCampaigns.push(newCampaign);
    await saveToFirestore('adCampaigns', newCampaign.id, newCampaign);
};

export const addExpense = async (data: Omit<Expense, 'id'>) => {
    await delay(LATENCY);
    const unit = (data.propertyUnitId || data.propertyId || 'beach') as PropertyUnitId;
    const newExpense: Expense = { 
        ...data, 
        propertyUnitId: unit,
        propertyId: unit,
        id: `E${Date.now()}` 
    };
    state.expenses.push(newExpense);
    await saveToFirestore('expenses', newExpense.id, newExpense);
};

export const deleteExpense = async (id: string) => {
    await delay(LATENCY);
    state.expenses = state.expenses.filter(e => e.id !== id);
    await deleteFromFirestore('expenses', id);
};

export const addBlock = async (blockData: Omit<Block, 'id'>) => {
    await delay(LATENCY);
    const newBlock = { ...blockData, id: `BLOCK${Date.now()}` };
    state.blocks.push(newBlock);
    await saveToFirestore('blocks', newBlock.id, newBlock);
};

export const addScheduledPost = async (postData: Omit<ScheduledPost, 'id'>) => {
    await delay(LATENCY);
    const newPost = { ...postData, id: `SCH${Date.now()}` };
    state.scheduledPosts.push(newPost);
    await saveToFirestore('scheduledPosts', newPost.id, newPost);
};

export const updateScheduledPost = async (postId: string, updates: Partial<ScheduledPost>) => {
    await delay(LATENCY);
    state.scheduledPosts = state.scheduledPosts.map(p => p.id === postId ? { ...p, ...updates } : p);
    const post = state.scheduledPosts.find(p => p.id === postId);
    if (post) await saveToFirestore('scheduledPosts', post.id, post);
};

export const deleteScheduledPost = async (postId: string) => {
    await delay(LATENCY);
    state.scheduledPosts = state.scheduledPosts.filter(p => p.id !== postId);
    await deleteFromFirestore('scheduledPosts', postId);
};

export const saveAddOn = async (addOn: Omit<AddOn, 'id'> | AddOn) => {
    await delay(LATENCY);
    if ('id' in addOn) {
        state.addOns = state.addOns.map(a => a.id === addOn.id ? addOn : a);
        await saveToFirestore('addOns', addOn.id, addOn);
    } else {
        const newAddOn = { ...addOn, id: `AO${Date.now()}` };
        state.addOns.push(newAddOn);
        await saveToFirestore('addOns', newAddOn.id, newAddOn);
    }
};

export const deleteAddOn = async (id: string) => {
    await delay(LATENCY);
    state.addOns = state.addOns.filter(a => a.id !== id);
    await deleteFromFirestore('addOns', id);
};

export const assignBed = async (bookingId: string, roomId: number, bedNumber: number) => {
    await delay(LATENCY);
    const room = state.rooms.find(r => r.id === roomId);
    const booking = state.bookings.find(b => b.id === bookingId);
    const guest = state.guests.find(g => g.id === booking?.guestId);

    if (room && room.beds && guest) {
        // Clear previous assignment for this booking
        room.beds.forEach(bed => { if(bed.bookingId === bookingId) { bed.bookingId = null; bed.guestName = null; } });
        // Assign new bed
        const bed = room.beds.find(b => b.bedNumber === bedNumber);
        if (bed) {
            bed.bookingId = bookingId;
            bed.guestName = guest.fullName;
        }
        await saveToFirestore('rooms', room.id.toString(), room);
        eventBus.emit('db-update');
    }
};

export const updateRoomBeds = async (roomId: number, newBedCount: number) => {
    await delay(LATENCY);
    const room = state.rooms.find(r => r.id === roomId);
    if(room && room.type.includes("Compartilhado")) {
        room.capacity = newBedCount;
        room.beds = Array.from({length: newBedCount}, (_, i) => ({ bedNumber: i + 1, bookingId: null, guestName: null }));
        await saveToFirestore('rooms', room.id.toString(), room);
        eventBus.emit('db-update');
    }
};

export const saveSiteContent = async (content: SiteContent) => {
    await delay(LATENCY);
    state.siteContent = content;
    eventBus.emit('db-update');
    await saveToFirestore('siteContent', 'main', content);
};

export const saveThemeSettings = async (settings: ThemeSettings) => {
    await delay(LATENCY);
    state.themeSettings = settings;
    eventBus.emit('db-update');
    await saveToFirestore('themeSettings', 'main', settings);
};

export const savePropertyEvents = async (events: PropertyEvent[]) => {
    await delay(LATENCY);
    state.propertyEvents = events;
    eventBus.emit('db-update');
    // Bulk save (simplified for small arrays)
    for(const event of events) {
        await saveToFirestore('propertyEvents', event.id, event);
    }
};

export const saveLocalGuideTips = async (tips: LocalGuideTip[]) => {
    await delay(LATENCY);
    state.localGuideTips = tips;
    eventBus.emit('db-update');
    for(const tip of tips) {
        await saveToFirestore('localGuideTips', tip.id, tip);
    }
};

export const saveFacilities = async (facilities: Facility[]) => {
    await delay(LATENCY);
    state.siteContent.facilities = facilities;
    eventBus.emit('db-update');
    await saveToFirestore('siteContent', 'main', state.siteContent);
};

export const saveRatePlan = async (plan: Omit<RatePlan, 'id'> | RatePlan) => {
    await delay(LATENCY);
    if ('id' in plan) {
        state.ratePlans = state.ratePlans.map(p => p.id === plan.id ? plan : p);
    } else {
        state.ratePlans.push({ ...plan, id: `RP${Date.now()}` });
    }
    saveState(state);
};

export const deleteRatePlan = async (planId: string) => {
    await delay(LATENCY);
    state.ratePlans = state.ratePlans.filter(p => p.id !== planId);
    saveState(state);
};

export const saveBookingRestriction = async (restriction: Omit<BookingRestriction, 'id'> | BookingRestriction) => {
    await delay(LATENCY);
     if ('id' in restriction) {
        state.bookingRestrictions = state.bookingRestrictions.map(r => r.id === restriction.id ? restriction : r);
    } else {
        state.bookingRestrictions.push({ ...restriction, id: `BR${Date.now()}` });
    }
    saveState(state);
};

export const deleteBookingRestriction = async (restrictionId: string) => {
    await delay(LATENCY);
    state.bookingRestrictions = state.bookingRestrictions.filter(r => r.id !== restrictionId);
    saveState(state);
};

export const savePaymentGatewaySettings = async (settings: PaymentGatewaySettings) => {
    await delay(LATENCY);
    state.properties[0].paymentGatewaySettings = settings;
    saveState(state);
};

export const approveReview = async (reviewId: string) => {
    await delay(LATENCY);
    const review = state.reviews.find(r => r.id === reviewId);
    if(review) review.status = 'Approved';
    saveState(state);
};

export const rejectReview = async (reviewId: string) => {
     await delay(LATENCY);
    const review = state.reviews.find(r => r.id === reviewId);
    if(review) review.status = 'Rejected';
    saveState(state);
};

export const approveTask = async (taskId: string) => {
     await delay(LATENCY);
    const task = state.staffTasks.find(t => t.id === taskId);
    if(task) {
        task.status = TaskStatus.DONE;
        task.supervisorComment = '';
    }
    saveState(state);
};

export const rejectTask = async (taskId: string, comment: string) => {
    await delay(LATENCY);
    const task = state.staffTasks.find(t => t.id === taskId);
    if(task) {
        task.status = TaskStatus.TODO;
        task.supervisorComment = comment;
    }
    saveState(state);
};

export const publishWorkSchedule = async (schedule: any) => {
    await delay(LATENCY);
    state.publishedWorkSchedule = schedule;
    saveState(state);
};

export const saveStaffPerformanceReview = async (staffId: string, review: any) => {
    await delay(LATENCY);
    state.staffPerformanceReviews[staffId] = review;
    saveState(state);
};

export const saveOnboardingPlan = async (staffId: string, plan: any) => {
    await delay(LATENCY);
    state.onboardingPlans[staffId] = plan;
    saveState(state);
};

export const startOrGetInternalChat = async (user1Id: string, user1Name: string, user2Id: string, user2Name: string): Promise<ChatConversation> => {
    await delay(LATENCY);
    const chatId = `INTERNAL_${[user1Id, user2Id].sort().join('_')}`;
    let conversation = state.chatConversations.find(c => c.id === chatId);
    if (!conversation) {
        conversation = {
            id: chatId,
            guestName: `${(user1Name || 'Staff').split(' ')[0]} & ${(user2Name || 'Staff').split(' ')[0]}`,
            lastMessage: 'Chat iniciado.',
            source: 'Website',
            unread: false,
            timestamp: new Date().toISOString(),
            isInternal: true,
        };
        state.chatConversations.push(conversation);
        saveState(state);
    }
    eventBus.emit('new-chat-message');
    return conversation;
};

export const handleCheckOut = async (bookingId: string) => {
    await delay(LATENCY);
    const booking = state.bookings.find(b => b.id === bookingId);
    if (booking) {
        const room = state.rooms.find(r => r.id === booking.roomId);
        booking.status = 'Checked-out';
        if (room) {
            room.status = RoomStatus.CLEANING;
            // Create cleaning task
            const cleaningTask: StaffTask = {
                id: `TSK_CLEAN_${booking.id}`,
                description: `Limpeza de checkout - ${room.name}`,
                status: TaskStatus.TODO,
                roomId: room.id,
                bookingId: booking.id
            };
            state.staffTasks.push(cleaningTask);
        }
        saveState(state);
    } else {
        throw new Error("Reserva não encontrada.");
    }
};

// ... and so on for all functions... I'll just export them all.
// The pattern is clear: add `export` to each function definition.
// The user provided a large file, I just need to exports.

export const generateAndSavePersonas = async (audienceDescription: string) => {
    const result = await generatePersonasAndRoadmaps(audienceDescription);
    if(result) {
        state.aiEngagementAgent.personas = result.personas;
        state.aiEngagementAgent.targetAudienceDescription = audienceDescription;
        saveState(state);
        eventBus.emit('engagement-log-update');
    }
};

export const createPersonaFromAudience = async (audience: CustomAudience) => {
    const result = await generateSinglePersona(audience.description);
    if(result) {
        state.aiEngagementAgent.personas.push(result);
        saveState(state);
        eventBus.emit('engagement-log-update');
    }
};

export const connectAIEngagementAccount = async (platform: SocialMediaPlatform) => {
    await delay(LATENCY * 3);
    state.aiEngagementAgent.connectedAccount = {
        platform,
        accountId: `${Math.floor(1000000 + Math.random() * 9000000)}`,
        accountName: `${platform} Business`,
        accessToken: 'fake-access-token'
    };
    saveState(state);
    eventBus.emit('engagement-log-update');
};

export const disconnectAIEngagementAccount = async () => {
    await delay(LATENCY);
    state.aiEngagementAgent.connectedAccount = null;
    saveState(state);
    eventBus.emit('engagement-log-update');
};

export const runAIEngagementAgent = async () => {
    state.aiEngagementAgent.isRunning = true;
    eventBus.emit('engagement-log-update');

    const log = (message: string) => {
        if(!state.aiEngagementAgent) return;
        state.aiEngagementAgent.log.push({ timestamp: new Date().toISOString(), message });
        eventBus.emit('engagement-log-update');
    };

    log('--- Iniciando ciclo de engajamento ---');
    await delay(2000);
    
    for(const persona of state.aiEngagementAgent.personas) {
        log(`-- Atuando como ${persona.name} --`);
        for(const action of persona.engagementRoadmap) {
            await delay(1500);
            log(`${action.actionType.replace('_',' ')}: ${action.target}`);
        }
    }
    
    await delay(2000);
    log('--- Ciclo de engajamento concluído ---');
    state.aiEngagementAgent.isRunning = false;
    eventBus.emit('engagement-log-update');
    saveState(state);
};

export const addProject = async (projectData: Omit<Project, 'id' | 'taskIds' | 'createdAt'>) => {
    const newProject: Project = {
        ...projectData,
        id: `PROJ${Date.now()}`,
        taskIds: [],
        createdAt: new Date().toISOString()
    };
    state.projects.push(newProject);
    await saveToFirestore('projects', newProject.id, newProject);
};

export const updateProject = async (project: Project) => {
    state.projects = state.projects.map(p => p.id === project.id ? project : p);
    await saveToFirestore('projects', project.id, project);
};

export const deleteProject = async (projectId: string) => {
    state.projects = state.projects.filter(p => p.id !== projectId);
    // Also unlink tasks and expenses
    state.staffTasks.forEach(t => { if(t.projectId === projectId) t.projectId = undefined; });
    state.expenses.forEach(e => { if(e.projectId === projectId) e.projectId = undefined; });
    await deleteFromFirestore('projects', projectId);
};

export const adjustStock = async (productId: string, newStock: number) => {
    const product = state.products.find(p => p.id === productId);
    if(product) product.stock = newStock;
    saveState(state);
};

export const addShoppingListItem = async (itemData: Omit<ShoppingListItem, 'id' | 'status'>) => {
    let activeList = state.shoppingLists.find(l => l.status === 'Pendente');
    if (!activeList) {
        activeList = { id: `SL${Date.now()}`, name: `Lista de Compras ${new Date().toLocaleDateString()}`, status: 'Pendente', createdAt: new Date().toISOString(), items: [] };
        state.shoppingLists.push(activeList);
    }
    const newItem: ShoppingListItem = { ...itemData, id: `SLI${Date.now()}`, status: 'Pendente' };
    activeList.items.push(newItem);
    saveState(state);
};

export const addShoppingListItems = async (items: Omit<ShoppingListItem, 'id' | 'status'>[]) => {
    let activeList = state.shoppingLists.find(l => l.status === 'Pendente');
    if (!activeList) {
        activeList = { id: `SL${Date.now()}`, name: `Lista de Compras ${new Date().toLocaleDateString()}`, status: 'Pendente', createdAt: new Date().toISOString(), items: [] };
        state.shoppingLists.push(activeList);
    }
    const newItems: ShoppingListItem[] = items.map(item => ({ ...item, id: `SLI${Date.now()}${Math.random()}`, status: 'Pendente' }));
    activeList.items.push(...newItems);
    saveState(state);
};

export const updateShoppingListItemStatus = async (listId: string, itemId: string, status: "Pendente" | "Comprado", unitCost?: number) => {
    const list = state.shoppingLists.find(l => l.id === listId);
    if (list) {
        const item = list.items.find(i => i.id === itemId);
        if (item) {
            item.status = status;
            if(unitCost !== undefined) item.unitCost = unitCost;
        }
    }
    saveState(state);
};

export const receiveStock = async (listId: string, items: { productId: string; quantity: number; itemId: string; }[]) => {
    const list = state.shoppingLists.find(l => l.id === listId);
    items.forEach(receivedItem => {
        const product = state.products.find(p => p.id === receivedItem.productId);
        if (product) {
            product.stock += receivedItem.quantity;
            // Optionally, mark item in list as received/processed
        }
    });
    saveState(state);
};

export const completeActiveShoppingList = async (listId: string) => {
    const list = state.shoppingLists.find(l => l.id === listId);
    if (list) {
        list.status = 'Concluída';
        saveState(state);
    }
};

export const addMediaAsset = async (assetData: Omit<MediaAsset, 'id' | 'createdAt'>) => {
    const newAsset: MediaAsset = { ...assetData, id: `MED${Date.now()}`, createdAt: new Date().toISOString() };
    state.mediaLibrary.unshift(newAsset);
    saveState(state);
};

export const deleteMediaAsset = async (assetId: string) => {
    state.mediaLibrary = state.mediaLibrary.filter(a => a.id !== assetId);
    saveState(state);
};

export const runMarketingOrchestration = async (objective: string, budget: number, period: string) => {
    const log = (message: string) => {
        if(!state.campaignContext) return;
        state.campaignContext.log.push({ timestamp: new Date().toISOString(), message });
        eventBus.emit('campaign-context-update');
    };

    state.campaignContext = { status: 'planning', objective, budget, period, plan: null, log: [], generatedCampaigns: [] };
    eventBus.emit('campaign-context-update');
    await delay(1500);

    try {
        log('Analisando objetivo e gerando plano de marketing mix...');
        const plan = await geminiGenerateMarketingMixPlan(objective, budget, period);
        if (!plan) throw new Error("Falha ao gerar o plano de marketing.");
        
        state.campaignContext.plan = plan;
        state.campaignContext.status = 'generating';
        log('Plano gerado com sucesso! Iniciando criação de campanhas...');
        eventBus.emit('campaign-context-update');
        await delay(1500);

        for (const phase of plan.phases) {
            log(`Gerando campanhas para a fase: "${phase.phaseName}"...`);
            await delay(1000);
            const campaignStructures = await generateCampaignFromBrief(objective as CampaignGoal, phase.objective, 'Meta Ads', budget);
            if(campaignStructures) {
                // Simplified: assuming one campaign per phase
                // In a real app, you'd adapt the gemini service to return multiple structures based on phase.actions
                const newCampaign: AdCampaign = { ...campaignStructures, name: `${phase.phaseName} - ${campaignStructures.name}` };
                state.adCampaigns.push(newCampaign);
                state.campaignContext.generatedCampaigns.push(newCampaign);
            }
             log(`Campanhas para "${phase.phaseName}" criadas. Gerando criativos...`);
             eventBus.emit('campaign-context-update');
             await delay(1500);
             // TODO: Generate and link creatives
        }
        
        state.campaignContext.status = 'complete';
        log('Orquestração concluída! Campanhas criadas como rascunho.');
        eventBus.emit('campaign-context-update');

    } catch (error: any) {
        if(state.campaignContext) {
            state.campaignContext.status = 'error';
            state.campaignContext.error = error.message;
        }
        log(`ERRO: ${error.message}`);
    }
    saveState(state);
};

export const sendSynapseCommand = async (command: string) => {
    const userMessage: SynapseMessage = { id: `SYN_USER_${Date.now()}`, sender: 'user', text: command, timestamp: new Date().toISOString() };
    state.synapseChatHistory.push(userMessage);

    const loadingMessage: SynapseMessage = { id: `SYN_AGENT_LOADING_${Date.now()}`, sender: 'agent', text: 'Processando...', timestamp: new Date().toISOString(), isLoading: true };
    state.synapseChatHistory.push(loadingMessage);
    eventBus.emit('db-update');

    try {
        const result = await routeSynapseCommand(command, state);
        
        state.synapseChatHistory.pop(); // Remove loading message
        
        const agentMessage: SynapseMessage = {
            id: `SYN_AGENT_${Date.now()}`,
            sender: 'agent',
            text: result.responseText,
            timestamp: new Date().toISOString(),
        };

        if (result.intent === 'navigate') {
            agentMessage.action = { type: 'navigate', label: `Ir para ${result.tool}`, payload: { section: result.tool } };
        }
        
        state.synapseChatHistory.push(agentMessage);
    } catch (e) {
         state.synapseChatHistory.pop(); // Remove loading message
         state.synapseChatHistory.push({ id: `SYN_AGENT_ERR_${Date.now()}`, sender: 'agent', text: "Ocorreu um erro ao processar seu comando.", timestamp: new Date().toISOString() });
    }
    eventBus.emit('db-update');
    saveState(state);
};

export const runSynapseOrchestrationCycle = async () => {
    const log = (description: string, sourceId: string) => {
        const newLog: SynapseOrchestrationLog = {
            id: `ORC_${Date.now()}`,
            timestamp: new Date().toISOString(),
            trigger: 'Ciclo Manual',
            actionDescription: description,
            status: 'Success',
            sourceId,
        };
        state.synapseOrchestrationLog.unshift(newLog);
    };

    const result = await decideNextOrchestrationAction(state);
    if(result && result.actions.length > 0) {
        for (const action of result.actions) {
            if (action.actionType === 'CREATE_SOCIAL_POST_FROM_REVIEW') {
                const { guestName, reviewText } = action.payload;
                const postContent = await geminiGeneratePostFromReview(reviewText, guestName);
                if (postContent) {
                    const post: Omit<ScheduledPost, 'id'> = {
                        platform: 'Instagram',
                        content: postContent.postText,
                        imageUrl: postContent.imageSuggestion, // In a real app this would be a generated image URL
                        status: 'Draft',
                        scheduledAt: new Date().toISOString(),
                    };
                    await addScheduledPost(post);
                    log(`Post de agradecimento criado para a avaliação de ${guestName}.`, action.sourceId);
                }
            }
        }
    }
    eventBus.emit('db-update');
    saveState(state);
};


export const addProperty = async (propertyData: Omit<PropertyInfo, 'id'>) => {
    const newProperty: PropertyInfo = { ...propertyData, id: `P${Date.now()}` };
    state.properties.push(newProperty);
    saveState(state);
};

export const updateProperty = async (propertyData: PropertyInfo) => {
    state.properties = state.properties.map(p => p.id === propertyData.id ? propertyData : p);
    saveState(state);
};

export const completeOnboarding = async (staffId: string) => {
    const staff = state.staff.find(s => s.id === staffId);
    if (staff) {
        staff.onboardingCompleted = true;
        saveState(state);
        eventBus.emit('user-update', staff);
    }
};

export const updateOnboardingTaskStatus = async (staffId: string, taskDescription: string, completed: boolean) => {
    const staff = state.staff.find(s => s.id === staffId);
    if (staff) {
        if (!staff.onboardingTasksCompleted) staff.onboardingTasksCompleted = [];
        if (completed) {
            staff.onboardingTasksCompleted.push(taskDescription);
        } else {
            staff.onboardingTasksCompleted = staff.onboardingTasksCompleted.filter(t => t !== taskDescription);
        }
        saveState(state);
        eventBus.emit('user-update', staff);
    }
};

export const connectOTA = async (platform: OTAPlatform, propertyId: string) => {
    await delay(LATENCY * 5);
    const connection = state.otaConnections.find(c => c.platform === platform);
    if (connection) {
        connection.connected = true;
        connection.propertyId = propertyId;
        connection.lastSync = new Date().toISOString();
        saveState(state);
    }
};

export const disconnectOTA = async (platform: OTAPlatform) => {
    await delay(LATENCY);
    const connection = state.otaConnections.find(c => c.platform === platform);
    if (connection) {
        connection.connected = false;
        connection.propertyId = null;
        saveState(state);
    }
};

export const updateOTAConnection = async (platform: OTAPlatform, updates: Partial<OTAConnection>) => {
    await delay(LATENCY);
    const connection = state.otaConnections.find(c => c.platform === platform);
    if (connection) {
        Object.assign(connection, updates);
        saveState(state);
    }
    eventBus.emit('db-update');
};

export const syncRatesToOTAs = async () => {
    await delay(LATENCY * 5);
    eventBus.emit('new-toast', { type: 'success', title: 'Tarifas Enviadas', message: 'Novas tarifas e markups foram transmitidos para as OTAs com sucesso.' });
};

export const syncAllChannels = async () => {
    await delay(LATENCY * 10);
    
    const beds24Conn = state.otaConnections.find(c => c.platform === 'Beds24' && c.connected);
    
    if (beds24Conn && beds24Conn.propertyId) {
        try {
            // Sincronização real com Beds24 V2
            // 1. Preparar dados de inventário
            const roomUpdates = state.rooms.map(room => {
                let availability = 0;
                if (room.type === RoomType.SHARED_DORM_FEMALE || room.type === RoomType.SHARED_DORM_MALE) {
                    availability = room.beds?.filter(b => !b.bookingId).length || 0;
                } else {
                    availability = room.status === RoomStatus.AVAILABLE ? 1 : 0;
                }

                // API V2 do Beds24 requer este formato para bulk update
                return {
                    propertyId: beds24Conn.propertyId,
                    roomId: room.id, // Mapeamento simplificado
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0],
                    availability: availability
                };
            });

            // 2. Chamar a API real do Beds24
            await beds24Api.updateInventory(roomUpdates);
            
            createNotification({ 
                type: 'success', 
                title: 'Sincronização Beds24', 
                message: 'Atualização enviada para o Beds24 com sucesso.' 
            });

        } catch (error) {
            console.error('Erro na sincronização Beds24:', error);
            createNotification({ 
                type: 'error', 
                title: 'Falha na Sincronização', 
                message: 'Verifique sua API Key do Beds24 nas configurações.' 
            });
        }
    }

    state.otaConnections.forEach(c => {
        if (c.connected) c.lastSync = new Date().toISOString();
    });
    saveState(state);
};

export const changeSubscriptionPlan = async (propertyId: string, newPlanId: string) => {
    await delay(LATENCY * 3);
    const property = state.properties.find(p => p.id === propertyId);
    if (property) {
        property.planId = newPlanId;
        saveState(state);
    }
};

export const saveSubscriptionPlan = async (plan: Omit<SubscriptionPlan, 'id'> | SubscriptionPlan) => {
     if ('id' in plan) {
        state.subscriptionPlans = state.subscriptionPlans.map(p => p.id === plan.id ? plan : p);
    } else {
        state.subscriptionPlans.push({ ...plan, id: `PLAN_${plan.name.toUpperCase()}` });
    }
    saveState(state);
};

export const deleteSubscriptionPlan = async (planId: string) => {
    state.subscriptionPlans = state.subscriptionPlans.filter(p => p.id !== planId);
    saveState(state);
};

export const deleteGuestPost = async (postId: string) => {
    state.guestPosts = state.guestPosts.filter(p => p.id !== postId);
    await deleteFromFirestore('guestPosts', postId);
};

export const deletePostComment = async (postId: string, commentTimestamp: string) => {
    const post = state.guestPosts.find(p => p.id === postId);
    if (post) {
        post.comments = post.comments.filter(c => c.timestamp !== commentTimestamp);
        await saveToFirestore('guestPosts', postId, post);
    }
};

export const finalizeAccount = async (bookingId: string) => {
    const booking = state.bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.balance = 0;
        booking.paymentStatus = 'Paid';
        saveState(state);
    }
};

export const saveBrandIdentity = async (identity: BrandIdentity) => {
    state.brandIdentity = identity;
    saveState(state);
};

export const generateAndSaveCampaignIdeas = async (goal: string) => {
    const result = await geminiGenerateCampaignIdeas(goal, state.brandIdentity);
    if(result) {
        state.campaignIdeas.unshift({ ...result, goal });
        saveState(state);
    }
};

export const remixAndSaveMediaAsset = async (assetId: string, prompt: string) => {
    const asset = state.mediaLibrary.find(a => a.id === assetId);
    if (!asset || !asset.url.startsWith('data:image')) return;

    const mimeType = asset.url.substring(5, asset.url.indexOf(';'));
    const base64 = asset.url.substring(asset.url.indexOf(',') + 1);

    const newPrompt = await generateRemixPrompt(base64, mimeType, prompt);
    if (newPrompt) {
        const imageB64 = await generateImage(newPrompt, '1:1', state.brandIdentity);
        if (imageB64) {
            await addMediaAsset({
                type: 'image',
                url: `data:image/png;base64,${imageB64}`,
                prompt: newPrompt,
            });
        }
    }
};

export const applyPriceSuggestion = async (roomType: RoomType, newPrice: number) => {
    state.rooms.forEach(room => {
        if(room.type === roomType) {
            room.basePrice = newPrice;
        }
    });
    saveState(state);
};

export const createCampaignFromOpportunity = async (opportunity: any) => {
    const { platform, objective, context } = opportunity.payload;
    const result = await generateCampaignFromBrief(objective, context, platform, 500); // Default budget
    if (result) {
        state.adCampaigns.push(result);
        saveState(state);
    }
};

export const savePartnerService = async (service: Omit<PartnerService, 'id'> | PartnerService) => {
     if ('id' in service) {
        state.partnerServices = state.partnerServices.map(s => s.id === service.id ? service : s);
    } else {
        state.partnerServices.push({ ...service, id: `PS${Date.now()}` });
    }
    saveState(state);
};

export const deletePartnerService = async (serviceId: string) => {
    state.partnerServices = state.partnerServices.filter(s => s.id !== serviceId);
    saveState(state);
};

export const updateServiceBookingStatus = async (bookingId: string, status: ServiceBooking['status']) => {
    const booking = state.serviceBookings.find(b => b.id === bookingId);
    if (booking) booking.status = status;
    saveState(state);
};

export const runNextGuestJourneyAction = async (journeyId: string) => {
    // This would be complex, for now we just mark the next planned action as executed
    const journey = state.guestJourneys.find(j => j.id === journeyId);
    if (journey) {
        const nextAction = journey.actionLog.find(a => a.status === 'planned');
        if (nextAction) nextAction.status = 'executed';
        saveState(state);
    }
};

export const generateAndSaveVideoAsset = async (prompt: string) => {
    const videoDataUrl = await generateVideo(prompt);
    if (videoDataUrl) {
        await addMediaAsset({ type: 'video', url: videoDataUrl, prompt });
    }
};

export const getMarketInsights = async (location: string, period: string): Promise<MarketInsight[]> => {
    // In this simulation, we assume marketData is fetched.
    const marketDataRaw = `Feriado de Corpus Christi em Junho. Preços variando entre R$ 200 e R$ 800 na região. Festival local de música em Julho. Alta procura por dormitórios em feriados.`;
    const result = await generateMarketInsights(location, period, marketDataRaw);
    return result?.insights || [];
};

export const getAIPackageSuggestions = async (location: string, insights: MarketInsight[], hostelVibe: string): Promise<AIPackageSuggestion[]> => {
    const result = await generateAIPackageSuggestions(location, insights, hostelVibe);
    return result?.suggestions || [];
};

export const getDynamicPriceSuggestions = async (period: string, marketInsights: MarketInsight[]): Promise<DynamicPriceSuggestion[] | null> => {
    const result = await geminiGenerateDynamicPriceSuggestions(state, period, marketInsights);
    return result?.suggestions || null;
};

export const saveEmailTemplate = async (template: Omit<EmailTemplate, 'id'> | EmailTemplate) => {
    if ('id' in template) {
        state.emailTemplates = state.emailTemplates.map(t => t.id === template.id ? template : t);
    } else {
        state.emailTemplates.push({ ...template, id: `TPL${Date.now()}` });
    }
    saveState(state);
};

export const deleteEmailTemplate = async (templateId: string) => {
    state.emailTemplates = state.emailTemplates.filter(t => t.id !== templateId);
    saveState(state);
};

export const saveEmailCampaign = async (campaign: Omit<EmailCampaign, 'id'> | EmailCampaign) => {
     if ('id' in campaign) {
        state.emailCampaigns = state.emailCampaigns.map(c => c.id === campaign.id ? campaign : c);
    } else {
        state.emailCampaigns.push({ ...campaign, id: `EC${Date.now()}` });
    }
    saveState(state);
};

export const sendEmailCampaign = async (campaignId: string) => {
    await delay(2000); // Simulate sending
    const campaign = state.emailCampaigns.find(c => c.id === campaignId);
    if (campaign) {
        campaign.status = 'Enviada';
        campaign.sentAt = new Date().toISOString();
        // Simulate performance
        campaign.performance = { sent: 150, opens: 35, clicks: 10 };
        saveState(state);
    }
};

export const saveAutomatedEmails = async (automations: AutomatedEmail[]) => {
    state.automatedEmails = automations;
    saveState(state);
};

export const savePromoCode = async (promoCode: Omit<PromoCode, 'id'> | PromoCode) => {
    if ('id' in promoCode) {
        state.promoCodes = state.promoCodes.map(p => p.id === promoCode.id ? promoCode : p);
    } else {
        state.promoCodes.push({ ...promoCode, id: `PC${Date.now()}` });
    }
    saveState(state);
};

export const deletePromoCode = async (promoCodeId: string) => {
    state.promoCodes = state.promoCodes.filter(p => p.id !== promoCodeId);
    saveState(state);
};

export const savePackageDeal = async (packageDeal: Omit<PackageDeal, 'id'> | PackageDeal) => {
    if ('id' in packageDeal) {
        state.packageDeals = state.packageDeals.map(p => p.id === packageDeal.id ? packageDeal : p);
    } else {
        state.packageDeals.push({ ...packageDeal, id: `PD${Date.now()}` });
    }
    saveState(state);
};

export const deletePackageDeal = async (packageDealId: string) => {
    state.packageDeals = state.packageDeals.filter(p => p.id !== packageDealId);
    saveState(state);
};

// Maintenance & Supplier
export const saveEquipment = async (equipment: Omit<Equipment, 'id'> | Equipment) => {
    if ('id' in equipment) {
        state.equipment = state.equipment.map(e => e.id === equipment.id ? equipment : e);
    } else {
        state.equipment.push({ ...equipment, id: `EQ${Date.now()}` });
    }
    saveState(state);
};
export const deleteEquipment = async (equipmentId: string) => {
    state.equipment = state.equipment.filter(e => e.id !== equipmentId);
    saveState(state);
};
export const saveWorkOrder = async (workOrder: Omit<WorkOrder, 'id'> | WorkOrder) => {
    if ('id' in workOrder) {
        state.workOrders = state.workOrders.map(w => w.id === workOrder.id ? workOrder : w);
    } else {
        state.workOrders.push({ ...workOrder, id: `WO${Date.now()}` });
    }
    saveState(state);
};
export const deleteWorkOrder = async (workOrderId: string) => {
    state.workOrders = state.workOrders.filter(w => w.id !== workOrderId);
    saveState(state);
};
export const saveSupplier = async (supplier: Omit<Supplier, 'id'> | Supplier) => {
    if ('id' in supplier) {
        state.suppliers = state.suppliers.map(s => s.id === supplier.id ? supplier : s);
    } else {
        state.suppliers.push({ ...supplier, id: `SUP${Date.now()}` });
    }
    saveState(state);
};
export const deleteSupplier = async (supplierId: string) => {
    state.suppliers = state.suppliers.filter(s => s.id !== supplierId);
    saveState(state);
};
export const savePurchaseOrder = async (purchaseOrder: Omit<PurchaseOrder, 'id'> | PurchaseOrder) => {
    if ('id' in purchaseOrder) {
        state.purchaseOrders = state.purchaseOrders.map(p => p.id === purchaseOrder.id ? purchaseOrder : p);
    } else {
        state.purchaseOrders.push({ ...purchaseOrder, id: `PO${Date.now()}` });
    }
    saveState(state);
};
export const deletePurchaseOrder = async (purchaseOrderId: string) => {
    state.purchaseOrders = state.purchaseOrders.filter(p => p.id !== purchaseOrderId);
    saveState(state);
};
export const receivePurchaseOrderItems = async (purchaseOrderId: string) => {
    const po = state.purchaseOrders.find(p => p.id === purchaseOrderId);
    if (po && po.status !== PurchaseOrderStatus.RECEIVED) {
        po.status = PurchaseOrderStatus.RECEIVED;
        po.receivedAt = new Date().toISOString();

        po.items.forEach(item => {
            const product = state.products.find(p => p.id === item.productId);
            if (product) {
                product.stock += item.quantity;
            }
        });
        
        createNotification({ type: 'success', title: 'Estoque Atualizado', message: `Itens da Ordem de Compra #${purchaseOrderId.substring(2,7)} foram recebidos.` });
        saveState(state);
    }
};



// --- Admin AI Calls ---
export const getCampaignPerformanceAnalysis = async (campaignId: string, adSetId: string): Promise<CampaignPerformanceAnalysis | null> => {
    const campaign = state.adCampaigns.find(c => c.id === campaignId);
    const adSet = campaign?.adSets.find(as => as.id === adSetId);
    if (!adSet || !campaign) return null;
    return geminiAnalyzeCampaignPerformance(adSet, campaign);
};

export const getManagementReport = async (): Promise<ManagementReport | null> => {
    return geminiGetManagementReport(state);
};

export const getDrinkPairingSuggestion = async (cartItems: SaleItem[]): Promise<DrinkPairingSuggestion | null> => {
    const propertyVibe = state.properties[0]?.hostelVibe || 'Young and Beachy';
    const availableProducts = state.products.filter(p => ['Comida & Bebida', 'Produtos de Conveniência'].includes(p.category));
    const result = await geminiGeneratePOSSuggestions(null, cartItems, availableProducts, propertyVibe);
    
    if (result && result.suggestions.length > 0) {
        const suggestion = result.suggestions[0];
        return {
            productId: suggestion.productId,
            drinkName: suggestion.productName,
            justification: suggestion.justification
        };
    }
    return null;
};

export const getPOSSuggestions = async (cartItems: SaleItem[]): Promise<DrinkPairingSuggestion | null> => {
    return getDrinkPairingSuggestion(cartItems);
};

export const calculateBreakevenPoint = async (totalFixedCosts: number, avgDailyRate: number, avgVariableCostPerNight: number) => {
    return geminiCalculateBreakevenPoint(totalFixedCosts, avgDailyRate, avgVariableCostPerNight);
};

export const runFinancialScenario = async (scenario: string, totalFixedCosts: number, avgDailyRate: number, avgVariableCostPerNight: number) => {
    return geminiRunFinancialScenario(scenario, totalFixedCosts, avgDailyRate, avgVariableCostPerNight);
};

export const getAIMenuPriceAnalysis = async (ingredients: { name: string, cost: number }[], itemName: string): Promise<AIMenuPriceAnalysis | null> => {
    const propertyVibe = state.properties[0]?.hostelVibe || '';
    return geminiGenerateMenuPriceAnalysis(ingredients, itemName, propertyVibe);
};

export const getAISuggestedPrice = async (product: Product): Promise<AISuggestedPrice | null> => {
    if (!product.costPrice) return null;
    return generateSuggestedSellPrice(product.name, product.category, product.costPrice);
};

export const generateShoppingList = async (): Promise<{ estimatedTotalCost: number; items: any[] } | null> => {
    const activeProject = state.projects.find(p => p.status === 'Ativo');
    if (!activeProject) {
        eventBus.emit('new-toast', { type: 'info', title: 'Aviso', message: 'Crie ou ative um projeto para gerar uma lista de compras contextual.' });
        return null;
    }
    return geminiGenerateProjectShoppingList(activeProject);
};

export const analyzeCameraFeed = async (cameraId: string): Promise<SurveillanceAnalysis | null> => {
    const camera = state.cameras.find(c => c.id === cameraId);
    if (!camera) return null;
    // This is a simulation. A real implementation would fetch the image data.
    return geminiAnalyzeSurveillanceImage('placeholder_base64_string', 'image/jpeg');
};

export const addCamera = async (camera: Omit<Camera, 'id'>) => {
    const newCamera: Camera = { ...camera, id: Math.random().toString(36).substr(2, 9) };
    state.cameras.push(newCamera);
    eventBus.emit('db-update');
};

export const updateCamera = async (camera: Camera) => {
    state.cameras = state.cameras.map(c => c.id === camera.id ? camera : c);
    eventBus.emit('db-update');
};

export const deleteCamera = async (cameraId: string) => {
    state.cameras = state.cameras.filter(c => c.id !== cameraId);
    eventBus.emit('db-update');
};

export const saveSurveillanceSettings = async (settings: SurveillanceSettings) => {
    state.surveillanceSettings = settings;
    eventBus.emit('db-update');
};

export const generateTaskDependencies = async (newTaskDescription: string, projectId: string) => {
    const existingTasks = state.staffTasks
        .filter(t => t.projectId === projectId)
        .map(t => ({ id: t.id, description: t.description }));
    return geminiGenerateTaskDependencies(newTaskDescription, existingTasks);
};

export const getMaintenanceSuggestion = async (description: string): Promise<MaintenanceSuggestion | null> => {
    return geminiGenerateMaintenanceSuggestion(description);
};

export const getEquipmentInfoSuggestion = async (equipmentName: string): Promise<EquipmentInfoSuggestion | null> => {
    return geminiGenerateEquipmentInfoSuggestion(equipmentName);
};

export const updateTableItems = async (tableId: string | null, items: SaleItem[]) => {
    if (!tableId) return;
    const table = state.tables.find(t => t.id === tableId);
    if (table) {
        const propUnit = table.propertyId || 'beach';
        table.currentItems = items.map(item => ({
            ...item,
            propertyUnitId: item.propertyUnitId || item.propertyId || propUnit,
            propertyId: item.propertyId || item.propertyUnitId || propUnit
        }));
        table.status = (items.length > 0 ? 'Ocupada' : 'Livre') as any;
        await saveToFirestore('tables', table.id, table);
        eventBus.emit('db-update');
    }
};

export const addCoworkingCheckIn = async (checkIn: Omit<CoworkingCheckIn, 'id' | 'currentItems'>) => {
    const newCheckIn: CoworkingCheckIn = {
        ...checkIn,
        id: `cw-checkin-${Date.now()}`,
        currentItems: []
    };
    state.coworkingCheckIns = [...(state.coworkingCheckIns || []), newCheckIn];
    await saveToFirestore('coworkingCheckIns', newCheckIn.id, newCheckIn);
    const desk = state.coworkingDesks?.find(d => d.id === checkIn.deskId);
    if (desk) {
        desk.status = 'Ocupada';
        await saveToFirestore('coworkingDesks', desk.id, desk);
    }
    eventBus.emit('db-update');
};

export const updateCoworkingCheckIn = async (checkInId: string, updates: Partial<CoworkingCheckIn>) => {
    state.coworkingCheckIns = state.coworkingCheckIns?.map(c => c.id === checkInId ? { ...c, ...updates } : c) || [];
    const checkIn = state.coworkingCheckIns?.find(c => c.id === checkInId);
    if (checkIn) await saveToFirestore('coworkingCheckIns', checkIn.id, checkIn);
    
    if (updates.status === 'Finished') {
        if (checkIn) {
            const desk = state.coworkingDesks?.find(d => d.id === checkIn.deskId);
            if (desk) {
                desk.status = 'Livre';
                await saveToFirestore('coworkingDesks', desk.id, desk);
            }
        }
    }
    eventBus.emit('db-update');
};

export const saveCoworkingPlan = async (plan: Omit<CoworkingPlan, 'id'> | CoworkingPlan) => {
    if ('id' in plan) {
        state.coworkingPlans = state.coworkingPlans?.map(p => p.id === plan.id ? (plan as CoworkingPlan) : p) || [];
    } else {
        const newPlan: CoworkingPlan = { ...plan, id: `cw-plan-${Date.now()}` };
        state.coworkingPlans = [...(state.coworkingPlans || []), newPlan];
    }
    saveState(state);
};

export const deleteCoworkingPlan = async (planId: string) => {
    state.coworkingPlans = state.coworkingPlans?.filter(p => p.id !== planId) || [];
    saveState(state);
};

export const addDeliveryOrder = async (order: Omit<DeliveryOrder, 'id'>) => {
    const targetUnit: PropertyUnitId = order.propertyUnitId || order.propertyId || 'beach';
    const orderId = `del-${Date.now()}`;
    const transactionId = `tx-del-${Date.now()}`;

    // Create automatic financial transaction linked to property unit
    const transactionItems: SaleItem[] = (order.items && order.items.length > 0) ? order.items : [
        {
            productId: 'del-combo-1',
            name: `Pedido Delivery (${order.source || 'iFood'})`,
            quantity: 1,
            unitPrice: order.total || 0,
            propertyUnitId: targetUnit,
            propertyId: targetUnit
        }
    ];

    const newTransaction: Transaction = {
        id: transactionId,
        items: transactionItems,
        total: order.total || 0,
        paymentMethod: order.paymentMethod || (order.source === 'iFood' ? 'Cartão de Crédito' : 'PIX'),
        guestName: `[Tele Delivery ${order.source || 'iFood'}] ${order.customerName}`,
        timestamp: order.createdAt || new Date().toISOString(),
        propertyId: targetUnit,
        propertyUnitId: targetUnit,
        paymentGatewayTransactionId: order.externalOrderId || `IFOOD-${Date.now()}`
    };

    const newOrder: DeliveryOrder = {
        ...order,
        id: orderId,
        propertyUnitId: targetUnit,
        propertyId: targetUnit,
        financialTransactionId: transactionId
    };

    state.deliveryOrders = [...(state.deliveryOrders || []), newOrder];
    state.transactions = [...(state.transactions || []), newTransaction];

    await saveToFirestore('deliveryOrders', newOrder.id, newOrder);
    await saveToFirestore('transactions', newTransaction.id, newTransaction);
    eventBus.emit('db-update');
};

export const updateDeliveryOrder = async (orderId: string, updates: Partial<DeliveryOrder>) => {
    let updatedTransaction: Transaction | null = null;

    state.deliveryOrders = state.deliveryOrders?.map(o => {
        if (o.id === orderId) {
            const updated = { ...o, ...updates };
            // Update financial transaction unit or total if changed
            if (o.financialTransactionId && (updates.total !== undefined || updates.propertyUnitId)) {
                const targetTx = state.transactions?.find(t => t.id === o.financialTransactionId);
                if (targetTx) {
                    if (updates.total !== undefined) targetTx.total = updates.total;
                    if (updates.propertyUnitId) {
                        targetTx.propertyId = updates.propertyUnitId;
                        targetTx.propertyUnitId = updates.propertyUnitId;
                    }
                    updatedTransaction = targetTx;
                }
            }
            return updated;
        }
        return o;
    }) || [];

    const order = state.deliveryOrders?.find(o => o.id === orderId);
    if (order) await saveToFirestore('deliveryOrders', order.id, order);
    if (updatedTransaction) await saveToFirestore('transactions', (updatedTransaction as Transaction).id, updatedTransaction);
    eventBus.emit('db-update');
};

/**
 * Módulo de Delivery Integration
 * Suporte a Webhooks e sincronização com iFood Merchant API e múltiplos canais (ex: n8n)
 */
export interface N8nDeliveryPayload {
    order_id?: string;
    orderId?: string;
    item?: string | Array<{ name: string; quantity?: number; price?: number; unitPrice?: number }>;
    items?: Array<{ name: string; quantity?: number; price?: number; unitPrice?: number }> | string;
    itens?: Array<{ name: string; quantity?: number; price?: number; unitPrice?: number }> | string;
    valor?: number | string;
    total?: number | string;
    hostel_id?: string;
    propertyUnitId?: PropertyUnitId | string;
    unidade?: string;
    customer_name?: string;
    cliente?: string;
    customer_phone?: string;
    telefone?: string;
    customer_address?: string;
    endereco?: string;
    source?: 'iFood' | 'App Próprio' | 'WhatsApp' | 'Direct' | 'Rappi' | 'UberEats' | string;
    origem?: string;
    courier_type?: 'Motoboy Próprio' | 'iFood' | 'Retirada' | string;
    payment_method?: PaymentMethod | string;
    notes?: string;
    observacoes?: string;
}

export const getDeliveryOrdersByUnit = (unitId: PropertyUnitId | 'all', sourceFilter?: string): DeliveryOrder[] => {
    const orders = state.deliveryOrders || [];
    return orders.filter(o => {
        const matchesUnit = unitId === 'all' || (o.propertyUnitId || o.propertyId || 'beach') === unitId;
        const matchesSource = !sourceFilter || sourceFilter === 'all' || o.source === sourceFilter;
        return matchesUnit && matchesSource;
    });
};

/**
 * Processa pedidos de entrega recebidos via n8n/webhooks externos (iFood, WhatsApp, etc.).
 * Realiza validação estrita dos campos obrigatórios ('item'/'items', 'valor'/'total', 'hostel_id'/'propertyUnitId')
 * e realiza o lançamento do pedido e vinculação financeira associada à unidade correta (Beach ou Santuário).
 */
export const processExternalDeliveryOrder = async (payload: N8nDeliveryPayload): Promise<{ success: boolean; orderId: string; message: string }> => {
    // 1. Validação e extração da unidade (hostel_id)
    const rawHostel = payload.hostel_id || payload.propertyUnitId || payload.unidade;
    if (!rawHostel) {
        throw new Error("Validação falhou: 'hostel_id' ou 'propertyUnitId' é obrigatório ('beach' ou 'sanctuary').");
    }

    let targetUnit: PropertyUnitId = 'beach';
    const normalizedHostel = String(rawHostel).toLowerCase().trim();
    if (normalizedHostel.includes('sanctuary') || normalizedHostel.includes('santuario') || normalizedHostel === '2') {
        targetUnit = 'sanctuary';
    } else if (normalizedHostel.includes('beach') || normalizedHostel.includes('praia') || normalizedHostel === '1') {
        targetUnit = 'beach';
    } else {
        targetUnit = 'beach';
    }

    // 2. Validação e extração do valor total
    const rawTotal = payload.valor ?? payload.total;
    if (rawTotal === undefined || rawTotal === null || rawTotal === '') {
        throw new Error("Validação falhou: 'valor' ou 'total' é obrigatório.");
    }

    const numericTotal = typeof rawTotal === 'number' ? rawTotal : parseFloat(String(rawTotal).replace(',', '.'));
    if (isNaN(numericTotal) || numericTotal <= 0) {
        throw new Error("Validação falhou: 'valor' deve ser um número maior que zero.");
    }

    // 3. Validação e extração dos itens
    const rawItems = payload.items || payload.item || payload.itens;
    if (!rawItems) {
        throw new Error("Validação falhou: 'item' ou 'items' é obrigatório.");
    }

    let parsedItems: SaleItem[] = [];

    if (Array.isArray(rawItems)) {
        parsedItems = rawItems.map((it, idx) => ({
            productId: `n8n-item-${idx}`,
            name: typeof it === 'string' ? it : (it.name || `Item ${idx + 1}`),
            quantity: typeof it === 'object' && it.quantity ? Number(it.quantity) : 1,
            unitPrice: typeof it === 'object' && (it.price || it.unitPrice) ? Number(it.price || it.unitPrice) : numericTotal / rawItems.length,
            propertyUnitId: targetUnit,
            propertyId: targetUnit
        }));
    } else if (typeof rawItems === 'string') {
        const itemNames = rawItems.split(',').map(s => s.trim()).filter(Boolean);
        const unitPriceEach = numericTotal / (itemNames.length || 1);
        parsedItems = itemNames.map((name, idx) => ({
            productId: `n8n-item-${idx}`,
            name,
            quantity: 1,
            unitPrice: unitPriceEach,
            propertyUnitId: targetUnit,
            propertyId: targetUnit
        }));
    } else {
        parsedItems = [{
            productId: 'n8n-combo',
            name: String(rawItems),
            quantity: 1,
            unitPrice: numericTotal,
            propertyUnitId: targetUnit,
            propertyId: targetUnit
        }];
    }

    if (parsedItems.length === 0) {
        throw new Error("Validação falhou: Nenhum item válido pôde ser extraído.");
    }

    // 4. Atribuição de Metadados
    const externalOrderId = payload.order_id || payload.orderId || `N8N-${Date.now().toString().slice(-6)}`;
    const customerName = payload.customer_name || payload.cliente || `Cliente iFood #${externalOrderId}`;
    const customerPhone = payload.customer_phone || payload.telefone || '(00) 00000-0000';
    const customerAddress = payload.customer_address || payload.endereco || 'Entrega via iFood Delivery';
    const rawSource = payload.source || payload.origem || 'iFood';

    let orderSource: DeliveryOrder['source'] = 'iFood';
    const normSource = String(rawSource).toLowerCase();
    if (normSource.includes('whatsapp')) orderSource = 'WhatsApp';
    else if (normSource.includes('app') || normSource.includes('site')) orderSource = 'App Próprio';
    else if (normSource.includes('direct') || normSource.includes('balcao') || normSource.includes('balcão')) orderSource = 'Direct';
    else orderSource = 'iFood';

    const orderData: Omit<DeliveryOrder, 'id'> = {
        externalOrderId,
        customerName: `${customerName}`,
        customerPhone,
        customerAddress,
        items: parsedItems,
        total: numericTotal,
        status: 'Pending',
        source: orderSource,
        courierType: (payload.courier_type as any) || (orderSource === 'iFood' ? 'iFood' : 'Motoboy Próprio'),
        propertyUnitId: targetUnit,
        propertyId: targetUnit,
        paymentMethod: (payload.payment_method as any) || (orderSource === 'iFood' ? 'Cartão de Crédito' : 'PIX'),
        notes: payload.notes || payload.observacoes,
        createdAt: new Date().toISOString()
    };

    await addDeliveryOrder(orderData);

    return {
        success: true,
        orderId: externalOrderId,
        message: `Pedido ${externalOrderId} (${orderSource}) registrado com sucesso para o ${targetUnit === 'beach' ? 'Hostel Beach' : 'Hostel Santuário'}.`
    };
};

export const processIFoodWebhook = async (payload: {
    orderId: string;
    customerName: string;
    customerPhone?: string;
    deliveryAddress: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    propertyUnitId?: PropertyUnitId;
}) => {
    return processExternalDeliveryOrder({
        order_id: payload.orderId,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        customer_address: payload.deliveryAddress,
        items: payload.items,
        total: payload.total,
        hostel_id: payload.propertyUnitId,
        source: 'iFood'
    });
};

export const addTable = async (tableData: { number: number; capacity: number; name?: string; propertyId?: PropertyUnitId | 'all' }) => {
    const targetPropertyId: PropertyUnitId = (tableData.propertyId && tableData.propertyId !== 'all') ? tableData.propertyId : 'beach';
    
    // Check if table number already exists in target property
    const existingTable = state.tables.find(t => t.number === tableData.number && (t.propertyId || 'beach') === targetPropertyId);
    if (existingTable) {
        throw new Error(`A Mesa ${tableData.number} já existe na unidade ${targetPropertyId === 'sanctuary' ? 'Santuário' : 'Praia'}.`);
    }

    const newTable: Table = {
        id: `T${Date.now()}`,
        name: tableData.name || `Mesa ${tableData.number}`,
        number: tableData.number,
        capacity: tableData.capacity,
        status: TableStatus.AVAILABLE,
        propertyId: targetPropertyId,
        currentItems: [],
        isActive: true
    };
    state.tables.push(newTable);
    await saveToFirestore('tables', newTable.id, newTable);
    eventBus.emit('db-update');
};

export const deleteTable = async (tableId: string) => {
    state.tables = state.tables.filter(t => t.id !== tableId);
    await deleteFromFirestore('tables', tableId);
    eventBus.emit('db-update');
};

export const updateIntegrationSettings = async (id: string, updates: Partial<IntegrationSettings>) => {
    const index = state.integrationSettings.findIndex(s => s.id === id);
    if (index !== -1) {
        const platform = state.integrationSettings[index].platform;
        let details = `Configurações de ${platform} atualizadas.`;
        let status: 'Success' | 'Error' = 'Success';

        if (updates.apiKey && platform === 'Aloha Pro') {
            try {
                const verification = await alohaProApi.verifyConnection(updates.apiKey, updates.propertyId || '');
                if (!verification.success) {
                    throw new Error(verification.message);
                }
                details = `Conexão com Aloha Pro verificada com sucesso. Integração ativa.`;
                updates.connected = true;
                updates.status = 'Ativo';
                updates.lastSync = new Date().toISOString();
            } catch (err) {
                status = 'Error';
                details = `Falha na conexão com Aloha Pro: ${err instanceof Error ? err.message : 'Chave inválida'}`;
                updates.connected = false;
                updates.status = 'Erro de Autenticação';
            }
        }

        updates.updatedAt = new Date().toISOString();
        state.integrationSettings[index] = { ...state.integrationSettings[index], ...updates };
        await saveToFirestore('integrationSettings', id, state.integrationSettings[index]);

        // Add log entry
        const newLog: IntegrationSyncLog = {
            id: `LOG${Date.now()}`,
            timestamp: new Date().toISOString(),
            platform: platform,
            action: 'Configuração de Conexão',
            status,
            details,
            updatedAt: new Date().toISOString()
        };
        state.integrationSyncLogs.unshift(newLog);
        await saveToFirestore('integrationSyncLogs', newLog.id, newLog);
        
        if (status === 'Error') {
             throw new Error(details);
        }
    }
};

export const syncIntegration = async (platform: string) => {
    const platformToSync = platform === 'Todos' ? 'Aloha Pro' : platform;
    
    let details = `Sincronização com ${platformToSync} realizada. Dados de hóspedes, quartos e PDV atualizados via API.`;
    let status: 'Success' | 'Error' = 'Success';

    if (platform === 'Aloha Pro' || platform === 'Todos') {
        const aloha = state.integrationSettings.find(s => s.platform === 'Aloha Pro');
        if (aloha && aloha.apiKey) {
            try {
                // Simulate pulling data
                const alohaBookings = await alohaProApi.fetchBookings(aloha.apiKey);
                
                // Process bookings (simulated: add to state if not exists)
                alohaBookings.forEach(ab => {
                    const exists = state.bookings.some(b => b.id === ab.id);
                    if (!exists) {
                        // In a real app, we'd find or create the guest first
                        // Here we just simulate the integration success
                    }
                });

                if (alohaBookings.length > 0) {
                    details = `Sincronização com Aloha Pro concluída: ${alohaBookings.length} reservas sincronizadas. Status dos quartos e consumos atualizados.`;
                }

                aloha.connected = true;
                aloha.status = 'Ativo';
                aloha.lastSync = new Date().toISOString();
                aloha.updatedAt = new Date().toISOString();
                await saveToFirestore('integrationSettings', aloha.id, aloha);
            } catch (err) {
                status = 'Error';
                details = `Erro ao sincronizar com Aloha Pro: ${err instanceof Error ? err.message : 'Falha na API'}`;
            }
        } else if (aloha && !aloha.apiKey) {
            status = 'Error';
            details = 'Erro: Chave de API não configurada para o Aloha Pro.';
        }
    }

    const newLog: IntegrationSyncLog = {
        id: `LOG${Date.now()}`,
        timestamp: new Date().toISOString(),
        platform: platformToSync,
        action: 'Sincronização Manual',
        status,
        details,
        updatedAt: new Date().toISOString()
    };
    state.integrationSyncLogs.unshift(newLog);
    await saveToFirestore('integrationSyncLogs', newLog.id, newLog);
};

export const addIntegrationMapping = async (mapping: Omit<IntegrationBillingMapping, 'id' | 'updatedAt'>) => {
    const newMapping: IntegrationBillingMapping = { 
        id: `MAP${Date.now()}`, 
        ...mapping,
        updatedAt: new Date().toISOString()
    };
    state.integrationBillingMappings.push(newMapping);
    await saveToFirestore('integrationBillingMappings', newMapping.id, newMapping);
};

export const addExternalAPIKey = async (name: string, scope: 'Leitura' | 'Leitura/Escrita') => {
    const newKey: ExternalAPIKey = {
        id: `AK${Date.now()}`,
        name,
        key: `sk_live_${Math.random().toString(36).substring(2, 11)}`,
        createdAt: new Date().toISOString(),
        scope,
        updatedAt: new Date().toISOString()
    };
    state.externalApiKeys.push(newKey);
    await saveToFirestore('externalApiKeys', newKey.id, newKey);
};

export const deleteExternalAPIKey = async (id: string) => {
    state.externalApiKeys = state.externalApiKeys.filter(k => k.id !== id);
    await deleteFromFirestore('externalApiKeys', id);
    eventBus.emit('db-update');
};
