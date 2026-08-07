import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PublicView from './components/PublicView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { BookingView } from './components/BookingView';
import RegisterView from './components/RegisterView';
import LoginView from './components/LoginView';
import { GuestPortalView } from './components/GuestPortalView';
import OnlineCheckinView from './components/OnlineCheckinView';
import ForgotPasswordView from './components/ForgotPasswordView';
import ToastContainer from './components/ToastContainer';
import * as apiService from './services/apiService';
import { eventBus } from './services/apiService';
import { Loader2, AlertTriangle } from 'lucide-react';
import { db as localDefaultDb } from './database';
import BookingWidgetView from './components/BookingWidgetView';
import UsefulLinksView from './components/UsefulLinksView';
import TermsAndConditionsView from './components/TermsAndConditionsView';
import PreArrivalPortalView from './components/PreArrivalPortalView';
import PublicDigitalMenuView from './components/PublicDigitalMenuView';
import { SynapseApp } from './src/SynapseApp';
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
    AppNotification,
    Product,
    User,
    Page,
    DBState,
    ChatConversation,
    ChatMessage,
    AdCampaign,
    AdPlatform,
    CampaignPhase,
    MarketingMixPlan,
    CustomAudience,
    Expense,
    RoomType,
    Block,
    PropertyUnitId,
    ScheduledPost,
    AddOn,
    PropertyInfo,
    MarketInsight,
    AIPackageSuggestion,
    SharedSpaceControls,
    GuestActivity,
    ActivityParticipant,
    ActivityComment,
    ActivityContribution,
    SaleItem,
    SiteContent,
    ThemeSettings,
    SocialConnection,
    Project,
    ShoppingListItem,
    Ad,
    MediaAsset,
    SocialMediaPlatform,
    CampaignPerformanceAnalysis,
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
    ClassifiedsItem,
    PaymentDetails,
    BrandIdentity,
    AutomationRule,
    DrinkPairingSuggestion,
    GuestJourney,
    PartnerService,
    ServiceBooking,
    DynamicPriceSuggestion,
    EmailTemplate,
    EmailCampaign,
    AutomatedEmail,
    PromoCode,
    PackageDeal,
    Equipment,
    WorkOrder,
    Supplier,
    PurchaseOrder,
    MaintenanceSuggestion,
    EquipmentInfoSuggestion,
    OTAConnection,
    IntegrationSettings,
    IntegrationSyncLog,
    IntegrationBillingMapping,
    ExternalAPIKey,
    CoworkingPlan
} from './types';
import { generateMaintenanceSuggestion, generateEquipmentInfoSuggestion, generateTaskDependencies } from './services/geminiService';

interface GuestData {
    fullName: string;
    email: string;
    phone: string;
    cpf: string;
    password?: string;
}

interface BookingData {
    roomId: number;
    checkIn: string;
    checkOut: string;
    numGuests: number;
    ratePlanId: string;
    addOnIds: string[];
    promoCode?: string;
    packageDealId?: string;
    totalPrice: number;
}

interface ChatData {
    conversations: ChatConversation[];
    messages: ChatMessage[];
}

interface AppSession {
    user: User | null;
    token: string | null;
}

const ThemeStyles: React.FC<{ themeSettings: ThemeSettings }> = ({ themeSettings }) => {
    const { publicSite, adminPanel, guestPortal } = themeSettings;
    const styles = `
        :root {
            /* Public Site */
            --ps-primary: ${publicSite.primaryColor};
            --ps-bg: ${publicSite.backgroundColor};
            --ps-text: ${publicSite.textColor};
            --ps-card-bg: ${publicSite.cardBackgroundColor};
            --ps-card-radius: ${publicSite.cardBorderRadius};
            --ps-button-radius: ${publicSite.buttonBorderRadius};

            /* Admin Panel */
            --admin-primary-color: ${adminPanel.primaryColor};
            --admin-sidebar-color: ${adminPanel.sidebarColor};
            --admin-bg-color: ${adminPanel.backgroundColor};
            --admin-text-color: ${adminPanel.textColor};
            --admin-menu-text-color: ${adminPanel.menuTextColor};
            --admin-card-radius: ${adminPanel.cardBorderRadius};
            --admin-button-radius: ${adminPanel.buttonBorderRadius};
            
            /* Guest Portal */
            --portal-bg: ${guestPortal.backgroundColor};
            --portal-text: ${guestPortal.textColor};
            --portal-card-bg: ${guestPortal.cardColor};
            --portal-primary: ${guestPortal.primaryColor};
        }

        /* Admin Panel Helper Classes defined globally now */
        .text-brand-green { color: var(--admin-primary-color); }
        .bg-brand-green { background-color: var(--admin-primary-color); }
        .bg-brand-green-dark:hover { filter: brightness(0.9); }
        .border-brand-green { border-color: var(--admin-primary-color); }
        .text-brand-dark { color: var(--admin-text-color); }
        .bg-brand-dark { background-color: var(--admin-text-color); }
        .bg-brand-sidebar { background-color: var(--admin-sidebar-color); }
        
         .btn-primary {
             background-color: var(--admin-primary-color);
             color: white;
             font-weight: bold;
             padding: 0.5rem 1rem;
             border-radius: var(--admin-button-radius, 8px);
        }
         .btn-secondary {
             background-color: #E5E7EB;
             color: #374151;
             font-weight: 600;
             padding: 0.5rem 1rem;
             border-radius: var(--admin-button-radius, 8px);
        }
    `;
    return <style>{styles}</style>;
};

const WidgetThemeStyles: React.FC<{ themeSettings: ThemeSettings }> = ({ themeSettings }) => {
    const { publicSite } = themeSettings;
    const styles = `
        body {
             background-color: ${publicSite.backgroundColor};
             color: ${publicSite.textColor};
        }
        :root {
            --widget-primary: ${publicSite.primaryColor};
            --widget-bg: ${publicSite.backgroundColor};
            --widget-text: ${publicSite.textColor};
            --widget-card-bg: ${publicSite.cardBackgroundColor};
            --widget-card-radius: ${publicSite.cardBorderRadius};
            --widget-button-radius: ${publicSite.buttonBorderRadius};
        }
        .input-base-widget {
          @apply w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[var(--widget-primary)]/50 focus:border-[var(--widget-primary)] transition-shadow duration-200 text-gray-800;
        }
    `;
    return <style>{styles}</style>;
};

export const App: React.FC = () => {
    const [page, setPage] = useState<Page>('home');
    const [pageParams, setPageParams] = useState<any>(null);
    const [session, setSession] = useState<AppSession>(() => {
        try {
            const savedSession = localStorage.getItem('synapse_hospitality_session');
            if (savedSession) {
                return JSON.parse(savedSession);
            }
        } catch (error) {
            console.error("Failed to load session from localStorage:", error);
            localStorage.removeItem('synapse_hospitality_session');
        }
        return { user: null, token: null };
    });
    const [dbState, setDbState] = useState<DBState | null>(localDefaultDb);
    const [loading, setLoading] = useState<boolean>(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [chatData, setChatData] = useState<ChatData>({ conversations: [], messages: [] });

    const isWidgetMode = window.location.pathname.includes('/widget');

    const currentUser = session.user;

    const getDashboardPageForUser = (user: User): Page => {
        if ('role' in user) {
            return 'admin';
        }
    
        const todayString = new Date().toLocaleDateString('en-CA');
    
        const activeBooking = dbState?.bookings.find(
            b => b.guestId === user.id && b.status === 'Checked-in'
        );
        if (activeBooking) {
            return 'guestPortal';
        }
        
        const futureBooking = dbState?.bookings.find(b => {
            if (b.guestId !== user.id) return false;
            if (b.status !== 'Confirmed' && b.status !== 'Pre-Checked-in') return false;
            return b.checkIn >= todayString;
        });
        if (futureBooking) {
            return 'preArrivalPortal';
        }
    
        return 'guestPortal'; // Fallback for guests with past or no bookings
    };

    useEffect(() => {
        // Handle routing from URL parameters on initial load
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = urlParams.get('page');
        if (pageParam === 'digitalMenu') {
            setPage('digitalMenu');
        }
    }, []);
    
    useEffect(() => {
        if (session.user && dbState) { // Ensure dbState is loaded before routing
            const publicPages: Page[] = ['home', 'login', 'register', 'forgotPassword', 'booking', 'bookingWidget', 'digitalMenu'];
            if (publicPages.includes(page)) {
                setPage(getDashboardPageForUser(session.user));
            }
        }
    }, [session, dbState, page]);

    useEffect(() => {
        const { auth } = apiService as any;
        if (!auth) return;

        const unsubscribe = auth.onAuthStateChanged(async (fbUser: any) => {
            if (!fbUser && session.user) {
                console.log("App: Firebase auth says no user, but session exists. Clearing session.");
                setSession({ user: null, token: null });
                localStorage.removeItem('synapse_hospitality_session');
                setPage('home');
            } else if (fbUser && (!session.user || session.user.email !== fbUser.email)) {
                console.log("App: Firebase auth user detected, syncing session.");
                
                // 1. Try to find in current dbState
                let matchedUser = dbState ? [...dbState.staff, ...dbState.guests].find(u => u.email.toLowerCase() === fbUser.email.toLowerCase()) : null;
                
                // 2. If not found in local dbState (common for new registrations), try fetching directly from API/Firestore
                if (!matchedUser) {
                    try {
                        console.log("App: User not in local state, performing direct lookup for", fbUser.email);
                        matchedUser = await apiService.getUserByEmail(fbUser.email);
                    } catch (e) {
                        console.warn("Direct user lookup failed:", e);
                    }
                }

                if (matchedUser) {
                    setSession({ user: matchedUser, token: 'firebase-auth' });
                } else {
                    console.warn("App: Authenticated but could not find user document for", fbUser.email);
                    // We might be in the middle of registration, give it a moment or show restricted access
                }
            }
        });
        return () => unsubscribe();
    }, [session.user, dbState]);

    const fetchData = async () => {
        try {
            const data = await apiService.getDbState();
            setDbState(data);
        } catch (error) {
            console.error("Failed to load DB state:", error);
        }
    };

    const fetchChatData = async () => {
        try {
            const data = await apiService.getChatData();
            if (data) setChatData(data);
        } catch(error) {
            console.error("Failed to load chat data:", error);
        }
    };

    useEffect(() => {
        const initialLoad = async () => {
            console.log("App: starting initialLoad");
            try {
                console.log("App: Aguardando sincronização do Firebase...");
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Timeout ao conectar com banco de dados")), 8000)
                );
                await Promise.race([apiService.dbReady, timeoutPromise]);
                await Promise.all([fetchData(), fetchChatData()]);
                console.log("App: data load successful");
            } catch (err) {
                console.error("App: data load failed or timed out", err);
                // Fallback: Tentamos carregar os dados mesmo assim (podem vir do cache ou local)
                try {
                    await Promise.all([fetchData(), fetchChatData()]);
                } catch (e) {
                    console.error("Fallback load also failed", e);
                }
            }
            console.log("App: data load finished silently");

            const handleNewNotification = (notification: AppNotification) => {
                setNotifications(prev => [notification, ...prev]);
                eventBus.emit('new-toast', notification);
            };

            const handleChatUpdate = () => {
                fetchChatData();
            };
            
            const handleSharedSpaceUpdate = fetchData;
            
            const handleUserUpdate = (updatedUser: User) => {
                 if (session.user && updatedUser.id === session.user.id) {
                     setSession(prev => ({ ...prev, user: updatedUser }));
                 }
                 fetchData(); // Refetch DB state to update other parts of the app
            };
            
            const handleEngagementLogUpdate = fetchData;
            
            const handleCampaignContextUpdate = fetchData;

            const handleDbUpdate = fetchData; // Generic handler for community actions

            eventBus.on('new-notification', handleNewNotification);
            eventBus.on('new-chat-message', handleChatUpdate);
            eventBus.on('shared-space-update', handleSharedSpaceUpdate);
            eventBus.on('user-update', handleUserUpdate);
            eventBus.on('engagement-log-update', handleEngagementLogUpdate);
            eventBus.on('campaign-context-update', handleCampaignContextUpdate);
            eventBus.on('db-update', handleDbUpdate);


            setLoading(false);

            return () => {
                eventBus.off('new-notification', handleNewNotification);
                eventBus.off('new-chat-message', handleChatUpdate);
                eventBus.off('shared-space-update', handleSharedSpaceUpdate);
                eventBus.off('user-update', handleUserUpdate);
                eventBus.off('engagement-log-update', handleEngagementLogUpdate);
                eventBus.off('db-update', handleDbUpdate);
            };
        };

        initialLoad();
    }, []);

    const setPageAndParams = (page: Page, params: any = null) => {
        setPage(page);
        setPageParams(params);
    };

    const logout = async () => {
        await apiService.logout();
        setSession({ user: null, token: null });
        localStorage.removeItem('synapse_hospitality_session');
        setPage('home');
    };

    const handleLoginWithGoogle = async () => {
        const result = await apiService.loginWithGoogle();
        if (result) {
            setSession({ user: result.user, token: result.token });
            localStorage.setItem('synapse_hospitality_session', JSON.stringify({ user: result.user, token: result.token }));
            return true;
        }
        return false;
    };

    const handleLogin = async (email: string, pass: string): Promise<boolean> => {
        const result = await apiService.login(email, pass);
        if (result) {
            setSession({ user: result.user, token: result.token });
            localStorage.setItem('synapse_hospitality_session', JSON.stringify({ user: result.user, token: result.token }));
            // Routing is now handled by the useEffect hook
            return true;
        }
        return false;
    };
    
    const addGuest = async (guestData: Omit<Guest, 'id'>) => {
        await apiService.addGuest(guestData);
    };

    const onBookingCreate = async (data: { booking: BookingData, guest?: GuestData, paymentDetails?: any }) => {
        let result;
        if (currentUser && 'fullName' in currentUser) {
            // Logged-in user
            result = await apiService.createBookingForExistingGuest({ booking: data.booking, guestId: currentUser.id, paymentDetails: data.paymentDetails });
            await fetchData();
            // Removido setPage('preArrivalPortal') para permitir que o modal de pagamento termine o fluxo
        } else {
            // New user
            if (!data.guest) throw new Error("Guest data is required for new user booking.");
            result = await apiService.createBookingWithNewGuest({ booking: data.booking, guest: data.guest, paymentDetails: data.paymentDetails });
            await fetchData();
            if (data.guest.password) {
                const loginResult = await apiService.login(data.guest.email, data.guest.password);
                if (loginResult) {
                    setSession({ user: loginResult.user, token: loginResult.token });
                    localStorage.setItem('synapse_hospitality_session', JSON.stringify({ user: loginResult.user, token: loginResult.token }));
                }
            }
        }
        return result;
    };

    const acknowledgeRules = async (bookingId: string, signatureUrl?: string) => {
        await apiService.acknowledgeRules(bookingId, signatureUrl);
        await fetchData();
    };

    const updateRoomStatus = async (roomId: number, newStatus: RoomStatus) => {
        await apiService.updateRoomStatus(roomId, newStatus);
    };

    const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
        await apiService.updateTaskStatus(taskId, newStatus);
    };

    const updateGuestProfile = async (guestId: string, updates: Partial<Guest>) => {
        await apiService.updateGuestProfile(guestId, updates);
        await fetchData();
    };
    
    const updateGuest = async (guestData: Guest) => {
        await apiService.updateGuest(guestData);
    };

    const addReview = async (bookingId: string, guest: Guest, rating: number, comment: string) => {
        await apiService.addReview(bookingId, guest, rating, comment);
        await fetchData();
    };
    
    const payBalance = async (bookingId: string, paymentDetails?: PaymentDetails | { method: 'PIX' }) => {
        const updatedBooking = await apiService.payBalance(bookingId, paymentDetails);
        await fetchData();
        return updatedBooking;
    };
    
    const updateRoomControls = async (roomId: number, controls: Partial<Pick<Room, 'lightsOn' | 'fanSpeed' | 'doNotDisturb'>>) => {
        await apiService.updateRoomControls(roomId, controls);
        await fetchData();
    };

    const requestService = async (bookingId: string, serviceType: 'Limpeza' | 'Manutenção' | 'Lavanderia', details: string): Promise<StaffTask> => {
        const task = await apiService.requestService(bookingId, serviceType, details);
        await fetchData();
        return task;
    };
    
    const updateKitchenStatus = async (newStatus: 'ok' | 'needs_attention') => {
        await apiService.updateKitchenStatus(newStatus);
        // No fetch, handled by event bus
    };

    const saveTravelDetails = async (bookingId: string, details: Booking['travelDetails']) => {
        await apiService.saveTravelDetails(bookingId, details);
        await fetchData();
    };

    const guestInitiatedCheckIn = async (bookingId: string) => {
        await apiService.handleCheckIn(bookingId);
        await fetchData();
    };

    const getPreArrivalData = (guestId: string) => apiService.getPreArrivalData(guestId);

    const handleGetMaintenanceSuggestion = (description: string): Promise<MaintenanceSuggestion | null> => {
        return generateMaintenanceSuggestion(description);
    };
    
    const handleGetEquipmentInfoSuggestion = (equipmentName: string): Promise<EquipmentInfoSuggestion | null> => {
        return generateEquipmentInfoSuggestion(equipmentName);
    };

    // --- Admin Dashboard Handlers ---
    const allAdminHandlers = {
        onLogout: logout,
        onMarkNotificationAsRead: (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)),
        onMarkAllNotificationsAsRead: () => setNotifications(prev => prev.map(n => ({ ...n, read: true }))),
        onRoomStatusChange: updateRoomStatus,
        onTaskStatusChange: updateTaskStatus,
        onGuestAdd: addGuest,
        onGuestUpdate: updateGuest,
        onRoomAdd: async (roomData: Omit<Room, 'id' | 'status'>) => { await apiService.addRoom(roomData); },
        onRoomUpdate: async (updatedRoom: Room) => { await apiService.updateRoom(updatedRoom); },
        onBookingAdd: async (bookingData: Omit<Booking, 'id' | 'totalPrice' | 'balance' | 'paymentStatus' | 'status'>) => { await apiService.addBooking(bookingData); },
        onBookingUpdate: async (bookingId: string, updates: Partial<Pick<Booking, 'checkIn' | 'checkOut' | 'roomId'>>) => { await apiService.updateBookingDetails(bookingId, updates); await fetchData(); },
        onStaffAdd: async (staffData: Omit<Staff, 'id'>) => { await apiService.addStaff(staffData); await fetchData(); },
        onStaffUpdate: async (updatedStaff: Staff) => { await apiService.updateStaff(updatedStaff); await fetchData(); },
        onStaffDelete: async (staffId: string) => { await apiService.deleteStaff(staffId); await fetchData(); },
        onTaskAdd: async (taskData: Omit<StaffTask, 'id'>) => { await apiService.addTask(taskData); await fetchData(); },
        onTaskUpdate: async (task: StaffTask) => { await apiService.updateTask(task); await fetchData(); },
        onSale: async (transactionData: Omit<Transaction, 'id' | 'timestamp'>, paymentDetails?: PaymentDetails | { method: 'PIX' }) => { await apiService.addTransaction(transactionData, paymentDetails); await fetchData(); },
        onProductAdd: async (productData: Omit<Product, 'id'>) => { await apiService.addProduct(productData); await fetchData(); },
        onProductUpdate: async (product: Product) => { await apiService.updateProduct(product); await fetchData(); },
        onProductDelete: async (productId: string) => { await apiService.deleteProduct(productId); await fetchData(); },
        onGenerateAndSaveDigitalMenu: async () => { await apiService.generateAndSaveDigitalMenu(); await fetchData(); },
        onUpdateTableItems: async (tableId: string | null, items: SaleItem[]) => { await apiService.updateTableItems(tableId, items); await fetchData(); },
        onAddTable: async (tableData: { number: number; capacity: number; name?: string; propertyId?: PropertyUnitId }) => { await apiService.addTable(tableData); await fetchData(); },
        onDeleteTable: async (tableId: string) => { await apiService.deleteTable(tableId); await fetchData(); },
        onAddDeliveryOrder: async (order: any) => { await apiService.addDeliveryOrder(order); await fetchData(); },
        onUpdateDeliveryOrder: async (orderId: string, updates: any) => { await apiService.updateDeliveryOrder(orderId, updates); await fetchData(); },
        onAddCoworkingCheckIn: async (checkIn: any) => { await apiService.addCoworkingCheckIn(checkIn); await fetchData(); },
        onUpdateCoworkingCheckIn: async (checkInId: string, updates: any) => { await apiService.updateCoworkingCheckIn(checkInId, updates); await fetchData(); },
        onGetPOSSuggestions: (cartItems: SaleItem[]) => apiService.generatePOSSuggestions(cartItems),
        onSendMessage: (conversationId: string, text: string, senderId: string, senderName: string) => apiService.sendMessage(conversationId, text, senderId, senderName),
        onMarkConversationAsRead: async (conversationId: string) => { await apiService.markConversationAsRead(conversationId); await fetchChatData(); },
        onConnectPlatform: async (platform: AdPlatform) => { await apiService.togglePlatformConnection(platform); await fetchData(); },
        onApplyABTest: async (adSetId: string, newCopy: { headline: string; description: string; }) => { await apiService.applyABTest(adSetId, newCopy); await fetchData(); },
        onApplyRule: async (campaignId: string, rule: { condition: string; action: string; }) => { await apiService.saveAutomationRule(campaignId, rule); await fetchData(); },
        onDeleteRule: async (campaignId: string, ruleId: string) => { await apiService.deleteAutomationRule(campaignId, ruleId); await fetchData(); },
        onCreateAudience: async (audienceData: Omit<CustomAudience, 'id'>) => { await apiService.createAudience(audienceData); await fetchData(); },
        onUpdateAd: async (campaignId: string, adSetId: string, adId: string, updates: Partial<Ad>) => { await apiService.updateAd(campaignId, adSetId, adId, updates); await fetchData(); },
        onChangeAdCampaignStatus: async (campaignId: string, newStatus: AdCampaign['status']) => { await apiService.changeAdCampaignStatus(campaignId, newStatus); await fetchData(); },
        onAnalyzeCampaign: (campaignId: string, adSetId: string) => apiService.getCampaignPerformanceAnalysis(campaignId, adSetId),
        onAddExpense: async (data: Omit<Expense, 'id'>) => { await apiService.addExpense(data); await fetchData(); },
        onDeleteExpense: async (id: string) => { await apiService.deleteExpense(id); await fetchData(); },
        onAddBlock: async (blockData: Omit<Block, 'id'>) => { await apiService.addBlock(blockData); await fetchData(); },
        onAddScheduledPost: async (postData: Omit<ScheduledPost, 'id'>) => { await apiService.addScheduledPost(postData); await fetchData(); },
        onUpdateScheduledPost: async (postId: string, updates: Partial<ScheduledPost>) => { await apiService.updateScheduledPost(postId, updates); await fetchData(); },
        onDeleteScheduledPost: async (postId: string) => { await apiService.deleteScheduledPost(postId); await fetchData(); },
        onAddOnSave: async (addOn: Omit<AddOn, 'id'> | AddOn) => { await apiService.saveAddOn(addOn); await fetchData(); },
        onAddOnDelete: async (id: string) => { await apiService.deleteAddOn(id); await fetchData(); },
        onBedAssignment: async (bookingId: string, roomId: number, bedNumber: number) => { await apiService.assignBed(bookingId, roomId, bedNumber); await fetchData(); },
        onUpdateRoomBeds: async (roomId: number, newBedCount: number) => { await apiService.updateRoomBeds(roomId, newBedCount); await fetchData(); },
        onSaveSiteContent: async (content: SiteContent) => { await apiService.saveSiteContent(content); await fetchData(); },
        onSaveThemeSettings: async (settings: ThemeSettings) => { await apiService.saveThemeSettings(settings); await fetchData(); },
        onSavePropertyEvents: async (events: PropertyEvent[]) => { await apiService.savePropertyEvents(events); await fetchData(); },
        onSaveLocalGuideTips: async (tips: LocalGuideTip[]) => { await apiService.saveLocalGuideTips(tips); await fetchData(); },
        onSaveFacilities: async (facilities: Facility[]) => { await apiService.saveFacilities(facilities); await fetchData(); },
        onSaveRatePlan: async (plan: Omit<RatePlan, 'id'> | RatePlan) => { await apiService.saveRatePlan(plan); await fetchData(); },
        onDeleteRatePlan: async (planId: string) => { await apiService.deleteRatePlan(planId); await fetchData(); },
        onSaveBookingRestriction: async (restriction: Omit<BookingRestriction, 'id'> | BookingRestriction) => { await apiService.saveBookingRestriction(restriction); await fetchData(); },
        onDeleteBookingRestriction: async (restrictionId: string) => { await apiService.deleteBookingRestriction(restrictionId); await fetchData(); },
        onSavePaymentGatewaySettings: async (settings: PaymentGatewaySettings) => { await apiService.savePaymentGatewaySettings(settings); await fetchData(); },
        onApproveReview: async (reviewId: string) => { await apiService.approveReview(reviewId); await fetchData(); },
        onRejectReview: async (reviewId: string) => { await apiService.rejectReview(reviewId); await fetchData(); },
        onApproveTask: async (taskId: string) => { await apiService.approveTask(taskId); await fetchData(); },
        onRejectTask: async (taskId: string, comment: string) => { await apiService.rejectTask(taskId, comment); await fetchData(); },
        onPublishWorkSchedule: async (schedule: any) => { await apiService.publishWorkSchedule(schedule); await fetchData(); },
        onSaveStaffPerformanceReview: async (staffId: string, review: any) => { await apiService.saveStaffPerformanceReview(staffId, review); await fetchData(); },
        onSaveOnboardingPlan: async (staffId: string, plan: any) => { await apiService.saveOnboardingPlan(staffId, plan); await fetchData(); },
        onStartInternalChat: (user1Id: string, user1Name: string, user2Id: string, user2Name: string) => apiService.startOrGetInternalChat(user1Id, user1Name, user2Id, user2Name),
        onCheckIn: async (bookingId: string) => { await apiService.handleCheckIn(bookingId); await fetchData(); },
        onCheckOut: async (bookingId: string) => { await apiService.handleCheckOut(bookingId); await fetchData(); },
        onSavePlatformConnections: async (connections: SocialConnection[]) => { await apiService.savePlatformConnections(connections); await fetchData(); },
        onGeneratePersonas: async (audienceDescription: string) => { await apiService.generateAndSavePersonas(audienceDescription); await fetchData(); },
        onCreatePersonaFromAudience: async (audience: CustomAudience) => { await apiService.createPersonaFromAudience(audience); await fetchData(); },
        onConnectAgentAccount: async (platform: SocialMediaPlatform) => { await apiService.connectAIEngagementAccount(platform); await fetchData(); },
        onDisconnectAgentAccount: async () => { await apiService.disconnectAIEngagementAccount(); await fetchData(); },
        onRunAgent: () => apiService.runAIEngagementAgent(),
        onProjectAdd: async (projectData: Omit<Project, 'id' | 'taskIds' | 'createdAt'>) => { await apiService.addProject(projectData); await fetchData(); },
        onProjectUpdate: async (project: Project) => { await apiService.updateProject(project); await fetchData(); },
        onProjectDelete: async (projectId: string) => { await apiService.deleteProject(projectId); await fetchData(); },
        onAdjustStock: async (productId: string, newStock: number) => { await apiService.adjustStock(productId, newStock); await fetchData(); },
        onAddShoppingListItem: async (itemData: Omit<ShoppingListItem, 'id' | 'status'>) => { await apiService.addShoppingListItem(itemData); await fetchData(); },
        onAddShoppingListItems: async (items: Omit<ShoppingListItem, 'id' | 'status'>[]) => { await apiService.addShoppingListItems(items); await fetchData(); },
        onUpdateShoppingListItemStatus: async (listId: string, itemId: string, status: "Pendente" | "Comprado", unitCost?: number) => { await apiService.updateShoppingListItemStatus(listId, itemId, status, unitCost); await fetchData(); },
        onReceiveStock: async (listId: string, items: { productId: string; quantity: number; itemId: string; }[]) => { await apiService.receiveStock(listId, items); await fetchData(); },
        onCompleteShoppingList: async (listId: string) => { await apiService.completeActiveShoppingList(listId); await fetchData(); },
        onAddMediaAsset: async (assetData: Omit<MediaAsset, 'id' | 'createdAt'>) => { await apiService.addMediaAsset(assetData); await fetchData(); },
        onDeleteMediaAsset: async (assetId: string) => { await apiService.deleteMediaAsset(assetId); await fetchData(); },
        onRunMarketingOrchestration: async (objective: string, budget: number, period: string) => { await apiService.runMarketingOrchestration(objective, budget, period); await fetchData(); },
        onGetManagementReport: () => apiService.getManagementReport(),
        synapseChatHistory: dbState?.synapseChatHistory || [],
        onSendSynapseCommand: async (command: string) => { await apiService.sendSynapseCommand(command); await fetchData(); },
        onRunSynapseOrchestrationCycle: async () => { await apiService.runSynapseOrchestrationCycle(); await fetchData(); },
        onAddProperty: async (propertyData: Omit<PropertyInfo, 'id'>) => { await apiService.addProperty(propertyData); await fetchData(); },
        onUpdateProperty: async (propertyData: PropertyInfo) => { await apiService.updateProperty(propertyData); await fetchData(); },
        onCompleteOnboarding: async (staffId: string) => { await apiService.completeOnboarding(staffId); await fetchData(); },
        onConnectOTA: async (platform: OTAPlatform, propertyId: string) => { await apiService.connectOTA(platform, propertyId); await fetchData(); },
        onDisconnectOTA: async (platform: OTAPlatform) => { await apiService.disconnectOTA(platform); await fetchData(); },
        onUpdateOTAConnection: async (platform: OTAPlatform, updates: Partial<OTAConnection>) => { await apiService.updateOTAConnection(platform, updates); await fetchData(); },
        onSyncAllChannels: async () => { await apiService.syncAllChannels(); await fetchData(); },
        onUpdateIntegration: async (id: string, updates: Partial<IntegrationSettings>) => { await apiService.updateIntegrationSettings(id, updates); await fetchData(); },
        onSyncIntegration: async (platform: string) => { await apiService.syncIntegration(platform); await fetchData(); },
        onAddIntegrationMapping: async (mapping: Omit<IntegrationBillingMapping, 'id'>) => { await apiService.addIntegrationMapping(mapping); await fetchData(); },
        onAddExternalAPIKey: async (name: string, scope: 'Leitura' | 'Leitura/Escrita') => { await apiService.addExternalAPIKey(name, scope); await fetchData(); },
        onDeleteExternalAPIKey: async (id: string) => { await apiService.deleteExternalAPIKey(id); await fetchData(); },
        onChangeSubscriptionPlan: async (propertyId: string, newPlanId: string) => { await apiService.changeSubscriptionPlan(propertyId, newPlanId); await fetchData(); },
        onSaveSubscriptionPlan: async (plan: Omit<SubscriptionPlan, 'id'> | SubscriptionPlan) => { await apiService.saveSubscriptionPlan(plan); await fetchData(); },
        onDeleteSubscriptionPlan: async (planId: string) => { await apiService.deleteSubscriptionPlan(planId); await fetchData(); },
        onDeleteGuestPost: async (postId: string) => { await apiService.deleteGuestPost(postId); await fetchData(); },
        onDeletePostComment: async (postId: string, commentTimestamp: string) => { await apiService.deletePostComment(postId, commentTimestamp); await fetchData(); },
        onFinalizeAccount: async (bookingId: string) => { await apiService.finalizeAccount(bookingId); await fetchData(); },
        onSaveBrandIdentity: async (identity: BrandIdentity) => { await apiService.saveBrandIdentity(identity); await fetchData(); },
        onGenerateCampaignIdeas: async (goal: string) => { await apiService.generateAndSaveCampaignIdeas(goal); await fetchData(); },
        onRemixMediaAsset: async (assetId: string, prompt: string) => { await apiService.remixAndSaveMediaAsset(assetId, prompt); await fetchData(); },
        onApplyPriceSuggestion: async (roomType: RoomType, newPrice: number) => { await apiService.applyPriceSuggestion(roomType, newPrice); await fetchData(); },
        onCreateCampaignFromOpportunity: async (opportunity: any) => { await apiService.createCampaignFromOpportunity(opportunity); await fetchData(); },
        onSavePartnerService: async (service: Omit<PartnerService, 'id'> | PartnerService) => { await apiService.savePartnerService(service); await fetchData(); },
        onDeletePartnerService: async (serviceId: string) => { await apiService.deletePartnerService(serviceId); await fetchData(); },
        onUpdateServiceBookingStatus: async (bookingId: string, status: ServiceBooking['status']) => { await apiService.updateServiceBookingStatus(bookingId, status); await fetchData(); },
        onAddAdCampaign: async (campaignData: any) => { await apiService.addAdCampaign(campaignData); await fetchData(); },
        onRunNextGuestJourneyAction: async (journeyId: string) => { await apiService.runNextGuestJourneyAction(journeyId); await fetchData(); },
        onSyncRatesToOTAs: async () => { await apiService.syncRatesToOTAs(); await fetchData(); },
        onGetDrinkPairingSuggestion: (cartItems: SaleItem[]) => apiService.getDrinkPairingSuggestion(cartItems),
        onGenerateAndSaveVideoAsset: async (prompt: string) => { await apiService.generateAndSaveVideoAsset(prompt); await fetchData(); },
        onGetMarketInsights: (location: string, period: string) => apiService.getMarketInsights(location, period),
        onGetAIPackageSuggestions: (location: string, insights: MarketInsight[], hostelVibe: string) => apiService.getAIPackageSuggestions(location, insights, hostelVibe),
        onGetDynamicPriceSuggestions: (period: string, marketInsights: MarketInsight[]) => apiService.getDynamicPriceSuggestions(period, marketInsights),
        onApplyDynamicPriceSuggestions: async (suggestions: { roomId: number; newPrice: number }[]) => { await apiService.applyDynamicPriceSuggestions(suggestions); await fetchData(); },
        onSaveCoworkingPlan: async (plan: Omit<CoworkingPlan, 'id'> | CoworkingPlan) => { await apiService.saveCoworkingPlan(plan); await fetchData(); },
        onDeleteCoworkingPlan: async (planId: string) => { await apiService.deleteCoworkingPlan(planId); await fetchData(); },
        onAddCamera: async (camera: any) => { await apiService.addCamera(camera); await fetchData(); },
        onUpdateCamera: async (camera: any) => { await apiService.updateCamera(camera); await fetchData(); },
        onDeleteCamera: async (cameraId: string) => { await apiService.deleteCamera(cameraId); await fetchData(); },
        onSaveSurveillanceSettings: async (settings: any) => { await apiService.saveSurveillanceSettings(settings); await fetchData(); },
        onSaveEmailTemplate: async (template: Omit<EmailTemplate, 'id'> | EmailTemplate) => { await apiService.saveEmailTemplate(template); await fetchData(); },
        onDeleteEmailTemplate: async (templateId: string) => { await apiService.deleteEmailTemplate(templateId); await fetchData(); },
        onSaveEmailCampaign: async (campaign: Omit<EmailCampaign, 'id'> | EmailCampaign) => { await apiService.saveEmailCampaign(campaign); await fetchData(); },
        onSendEmailCampaign: async (campaignId: string) => { await apiService.sendEmailCampaign(campaignId); await fetchData(); },
        onSaveAutomatedEmails: async (automations: AutomatedEmail[]) => { await apiService.saveAutomatedEmails(automations); await fetchData(); },
        onSavePromoCode: async (promoCode: Omit<PromoCode, 'id'> | PromoCode) => { await apiService.savePromoCode(promoCode); await fetchData(); },
        onDeletePromoCode: async (promoCodeId: string) => { await apiService.deletePromoCode(promoCodeId); await fetchData(); },
        onSavePackageDeal: async (packageDeal: Omit<PackageDeal, 'id'> | PackageDeal) => { await apiService.savePackageDeal(packageDeal); await fetchData(); },
        onDeletePackageDeal: async (packageDealId: string) => { await apiService.deletePackageDeal(packageDealId); await fetchData(); },
        onSaveEquipment: async (equipment: Omit<Equipment, 'id'> | Equipment) => { await apiService.saveEquipment(equipment); await fetchData(); },
        onDeleteEquipment: async (equipmentId: string) => { await apiService.deleteEquipment(equipmentId); await fetchData(); },
        onSaveWorkOrder: async (workOrder: Omit<WorkOrder, 'id'> | WorkOrder) => { await apiService.saveWorkOrder(workOrder); await fetchData(); },
        onDeleteWorkOrder: async (workOrderId: string) => { await apiService.deleteWorkOrder(workOrderId); await fetchData(); },
        onSaveSupplier: async (supplier: Omit<Supplier, 'id'> | Supplier) => { await apiService.saveSupplier(supplier); await fetchData(); },
        onDeleteSupplier: async (supplierId: string) => { await apiService.deleteSupplier(supplierId); await fetchData(); },
        onSavePurchaseOrder: async (purchaseOrder: Omit<PurchaseOrder, 'id'> | PurchaseOrder) => { await apiService.savePurchaseOrder(purchaseOrder); await fetchData(); },
        onDeletePurchaseOrder: async (purchaseOrderId: string) => { await apiService.deletePurchaseOrder(purchaseOrderId); await fetchData(); },
        onReceivePurchaseOrderItems: async (purchaseOrderId: string) => { await apiService.receivePurchaseOrderItems(purchaseOrderId); await fetchData(); },
        onGetMaintenanceSuggestion: handleGetMaintenanceSuggestion,
        onGetEquipmentInfoSuggestion: handleGetEquipmentInfoSuggestion,
        onAddTaskComment: async (taskId: string, staffId: string, text: string) => { await apiService.addTaskComment(taskId, staffId, text); await fetchData(); },
        onAddProjectAttachment: async (projectId: string, fileName: string, url: string) => { await apiService.addProjectAttachment(projectId, fileName, url); await fetchData(); },
        onAddTaskAttachment: async (taskId: string, fileName: string, url: string) => { await apiService.addTaskAttachment(taskId, fileName, url); await fetchData(); },
        onGenerateTaskDependencies: (newTaskDescription: string, projectId: string) => apiService.generateTaskDependencies(newTaskDescription, projectId),
    };

    const shouldShowHeader = () => {
        const portalPages: Page[] = ['guestPortal', 'onlineCheckin', 'admin', 'digitalMenu', 'synapse'];
        if (portalPages.includes(page)) {
            return false;
        }
        if (page === 'preArrivalPortal' && currentUser && 'fullName' in currentUser) {
            return false;
        }
        return true;
    };
    

    const handlePlaceOrder = async (items: SaleItem[], location: string) => {
        // Encontra mesa pelo número para vincular
        const table = dbState?.tables.find(t => `Mesa ${t.number}`.toLowerCase() === location.toLowerCase());
        if (table) {
            await apiService.updateTableItems(table.id, [...(table.currentItems || []), ...items]);
        }
        
        await apiService.createNotification({
            type: 'pos',
            title: 'Novo Pedido Digital!',
            message: `Pedido recebido de: ${location}. Total: ${items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
        });
        await fetchData();
    };

    const renderPage = () => {
        switch (page) {
            case 'home':
                return <PublicView setPage={setPageAndParams} db={dbState!} chatData={chatData} onStartChat={apiService.startChat} onSendMessage={apiService.sendMessage} />;
            case 'booking':
                return <BookingView setPage={setPageAndParams} initialParams={pageParams} db={dbState!} onBookingCreate={onBookingCreate} currentUser={currentUser as Guest | null} onAcknowledgeRules={acknowledgeRules} />;
            case 'register':
                return <RegisterView setPage={setPageAndParams} onRegister={addGuest} />;
            case 'login':
                return <LoginView setPage={setPageAndParams} handleLogin={handleLogin} handleLoginWithGoogle={handleLoginWithGoogle} />;
            case 'guestPortal':
                if (currentUser && 'fullName' in currentUser) {
                     return <GuestPortalView
                        currentUser={currentUser}
                        db={dbState!}
                        chatData={chatData}
                        setPage={setPageAndParams}
                        logout={logout}
                        guestNotifications={dbState!.guestNotifications}
                        onUpdateRoomControls={updateRoomControls}
                        onRequestService={requestService}
                        onUpdateProfile={updateGuestProfile}
                        onReviewSubmit={addReview}
                        onAcknowledgeRules={acknowledgeRules}
                        onPayBalance={payBalance}
                        onUpdateLivingRoomTV={apiService.updateLivingRoomTV}
                        onAddSongToPlaylist={apiService.addSongToPlaylist}
                        onUpvoteSong={apiService.upvoteSong}
                        onPlaceRoomServiceOrder={apiService.placeRoomServiceOrder}
                        onStartReceptionChat={apiService.startReceptionChat}
                        onStartGuestChat={apiService.startGuestChat}
                        onSendMessage={apiService.sendMessage}
                        onCreateGuestActivity={apiService.createGuestActivity}
                        onUpdateGuestActivity={apiService.updateGuestActivity}
                        onDeleteGuestActivity={apiService.deleteGuestActivity}
                        onJoinGuestActivity={apiService.joinGuestActivity}
                        onLeaveGuestActivity={apiService.leaveGuestActivity}
                        onAddActivityComment={apiService.addActivityComment}
                        onMakeActivityContribution={apiService.makeActivityContribution}
                        onToggleFavoriteTip={apiService.toggleFavoriteTip}
                        onUpdateItinerary={apiService.updateItinerary}
                        onUnlockAchievement={apiService.unlockAchievement}
                        onRedeemReward={apiService.redeemReward}
                        onAddGuestPost={apiService.addGuestPost}
                        onMakeCheckIn={apiService.makeCheckIn}
                        onSendConciergeMessage={apiService.sendConciergeMessage}
                        onRsvpToEvent={apiService.rsvpToEvent}
                        onCancelRsvpFromEvent={apiService.cancelRsvpFromEvent}
                        onGetBookingStatement={apiService.getBookingStatement}
                        onGetIcebreakerSuggestions={apiService.getIcebreakerSuggestions}
                        onGenerateItinerary={apiService.generateAndSaveItinerary}
                        onMarkNotificationAsRead={apiService.markGuestNotificationAsRead}
                        onTogglePostLike={apiService.togglePostLike}
                        onAddPostComment={apiService.addPostComment}
                        onAddPhotoToActivityAlbum={apiService.addPhotoToActivityAlbum}
                        onAddLostAndFoundItem={apiService.addLostAndFoundItem}
                        onClaimFoundItem={apiService.claimFoundItem}
                        onDeleteLostAndFoundItem={apiService.deleteLostAndFoundItem}
                        onAddClassifiedsItem={apiService.addClassifiedsItem}
                        onDeleteClassifiedsItem={apiService.deleteClassifiedsItem}
                        onCheckStayExtension={apiService.checkStayExtension}
                        onConfirmStayExtension={apiService.confirmStayExtension}
                        onGetLodgingAgreement={apiService.getLodgingAgreement}
                        onGetInvoice={apiService.getInvoice}
                        onPreCheckout={apiService.handlePreCheckout}
                        onUpdateKitchenStatus={updateKitchenStatus}
                        onBookPartnerService={apiService.bookPartnerService}
                        onAddGuestStory={apiService.addGuestStory}
                        onViewStory={apiService.viewStory}
                    />;
                }
                if (!currentUser) {
                    return <LoginView setPage={setPageAndParams} handleLogin={handleLogin} handleLoginWithGoogle={handleLoginWithGoogle} />;
                }
                return <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-500 font-bold p-8 text-center">
                    <AlertTriangle size={48} className="mb-4 text-orange-400" />
                    <p>Acesso Restrito: Apenas hóspedes podem acessar esta página.</p>
                    <button onClick={() => setPageAndParams('home')} className="mt-4 bg-brand-green text-white px-8 py-3 rounded-xl text-xs uppercase tracking-widest">Voltar ao Início</button>
                </div>;
            case 'onlineCheckin':
                // Assuming online checkin is initiated from guest portal with booking and guest data
                return <OnlineCheckinView booking={pageParams.booking} guest={pageParams.guest} onCheckinSubmit={apiService.submitOnlineCheckin} setPage={setPageAndParams} />;
            case 'admin':
                if (currentUser && 'role' in currentUser) {
                    return <AdminDashboard 
                        currentUser={currentUser} 
                        db={dbState!} 
                        notifications={notifications} 
                        chatData={chatData}
                        {...allAdminHandlers}
                    />;
                }
                return <div>Acesso Negado</div>;
            case 'forgotPassword':
                return <ForgotPasswordView setPage={setPageAndParams} />;
            case 'usefulLinks':
                return <UsefulLinksView setPage={setPageAndParams} />;
            case 'termsAndConditions':
                return <TermsAndConditionsView setPage={setPageAndParams} />;
            case 'preArrivalPortal':
                 if (currentUser && 'fullName' in currentUser) {
                    return <PreArrivalPortalView 
                        guest={currentUser}
                        db={dbState!}
                        onSaveTravelDetails={saveTravelDetails}
                        onCheckIn={guestInitiatedCheckIn}
                        setPage={setPageAndParams}
                        getPreArrivalData={getPreArrivalData}
                        onStartGuestChat={apiService.startGuestChat}
                        onSendMessage={apiService.sendMessage}
                        chatMessages={chatData?.messages || []}
                        onVerificationSubmit={apiService.submitPreArrivalVerification}
                    />;
                }
                return <div>Carregando...</div>;
            case 'digitalMenu':
                return <PublicDigitalMenuView db={dbState!} onPlaceOrder={handlePlaceOrder} />;
            case 'synapse':
                return <SynapseApp />;
            case 'bookingWidget':
                return (
                    <>
                        <WidgetThemeStyles themeSettings={dbState!.themeSettings} />
                        <BookingWidgetView 
                            db={dbState!}
                            onBookingCreate={onBookingCreate}
                        />
                    </>
                );
            default:
                return <div>Página não encontrada</div>;
        }
    };

    console.log("App: rendering. Loading:", loading, "dbState:", !!dbState);
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-900 p-6 text-center">
                <Loader2 className="animate-spin mb-6 text-brand-green" size={56} />
                <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Carregando Forest House Beach...</h2>
                <p className="text-gray-500 font-medium max-w-sm">Estamos preparando sua experiência de luxo. Isso pode levar alguns segundos dependendo da sua conexão.</p>
                <div className="mt-12 space-y-4">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Problemas ao carregar?</p>
                    <button 
                        onClick={() => setLoading(false)}
                        className="bg-white border border-gray-200 text-gray-700 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                    >
                        Entrar mesmo com erro
                    </button>
                </div>
            </div>
        );
    }

    if (!dbState) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-800 p-8 text-center">
                <AlertTriangle size={64} className="mb-4 text-red-500" />
                <h1 className="text-2xl font-bold mb-2">Erro ao carregar o sistema</h1>
                <p>Não foi possível conectar ao banco de dados. Por favor, tente recarregar a página.</p>
                <button onClick={() => window.location.reload()} className="mt-6 bg-brand-green text-white px-8 py-3 rounded-xl">Recarregar</button>
            </div>
        );
    }
    
     if (isWidgetMode) {
        if (!dbState) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-gray-500" size={48} /></div>;
        return (
            <>
                <WidgetThemeStyles themeSettings={dbState.themeSettings} />
                <BookingWidgetView 
                    db={dbState}
                    onBookingCreate={onBookingCreate as (data: { booking: any, guest: GuestData }) => Promise<any>}
                />
            </>
        );
    }

    return (
        <>
            {dbState && <ThemeStyles themeSettings={dbState.themeSettings} />}
            <div className="font-sans">
                {shouldShowHeader() && dbState && <Header page={page} setPage={setPageAndParams} currentUser={currentUser} logout={logout} themeSettings={dbState.themeSettings}/>}
                <main>
                    {renderPage()}
                </main>
                <ToastContainer />
            </div>
        </>
    );
};
