import React, { useMemo, useState, useRef, useEffect, FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Guest, 
    Booking, 
    Room, 
    Page, 
    DBState, 
    ChatConversation, 
    ChatMessage, 
    ThemeSettings,
    SharedSpaceControls,
    SaleItem,
    Transaction,
    GuestActivity,
    ActivityParticipant,
    ActivityComment,
    ActivityContribution,
    StaffTask,
    Product,
    LocalGuideTip,
    ItineraryItem,
    PropertyEvent,
    Achievement,
    GuestPost,
    Reward,
    CheckIn,
    LoyaltyLevel,
    AIConciergeMessage,
    EventParticipant,
    GuestNotification,
    GuestPostComment,
    PlaylistSong,
    LostAndFoundItem,
    ClassifiedsItem,
    PropertyInfo,
    PaymentDetails,
    PartnerService,
    ServiceBooking,
    GuestStory
} from '../types';
import { eventBus } from '../services/apiService';
import { generatePersonalizedTip } from '../services/geminiService';
import { 
    User, Mail, Phone, Hash, Calendar, Moon, Users, CheckCircle, Star, X, Lightbulb, Power, Thermometer, BellOff, ConciergeBell, Wrench, Send, Loader2, Home, Users2, Settings, Sun, Palette, MessageSquare, Plus, Minus, Tv, BookOpen, Wallet, Gift, MessageCircle as MessageCircleIcon, PiggyBank, Edit, Trash2, ArrowLeft, Wind, Map, Heart, Utensils, Waves, CalendarPlus, PlusCircle, ShoppingCart, Newspaper, MapPin, Route, Clock, Megaphone, Trophy, Award, Footprints, Sparkles, Star as StarIcon, Image as ImageIcon, Coffee, Beer, CheckSquare, Camera, Bike, Music, Crown, Mountain, Bot, Globe, FileText, Volume2, AppWindow, Youtube, Clapperboard, Film, CreditCard, QrCode, AlertTriangle, Menu, Wifi, Search, Key, Leaf, Smartphone, FileSpreadsheet, Bell, Save, ThumbsUp, Heart as HeartIcon, Sofa, Medal, Users as UsersIcon, Camera as CameraIcon, Info, HelpCircle, Copy, UtensilsCrossed, Lock, LogOut, ArrowUp, ShieldCheck, Box, Shield, MessageCircle, ChevronRight, Check, Video, VideoOff, Paperclip, Smile, Printer, Download, LayoutGrid, List, MoreHorizontal, Bookmark, Target
} from 'lucide-react';

interface GuestPortalViewProps {
    currentUser: Guest;
    db: DBState;
    chatData: { conversations: ChatConversation[]; messages: ChatMessage[] };
    setPage: (page: Page, params?: any) => void;
    logout: () => void;
    guestNotifications: GuestNotification[];
    onUpdateRoomControls: (roomId: number, controls: Partial<Pick<Room, 'lightsOn' | 'fanSpeed' | 'doNotDisturb'>>) => void;
    onRequestService: (bookingId: string, serviceType: 'Limpeza' | 'Manutenção' | 'Lavanderia', details: string) => Promise<StaffTask>;
    onUpdateProfile: (guestId: string, updates: Partial<Guest>) => Promise<void>;
    onReviewSubmit: (bookingId: string, guest: Guest, rating: number, comment: string) => Promise<void>;
    onAcknowledgeRules: (bookingId: string) => Promise<void>;
    onPayBalance: (bookingId: string, paymentDetails?: PaymentDetails | { method: 'PIX' }) => Promise<Booking>;
    onUpdateLivingRoomTV: (updates: Partial<SharedSpaceControls['livingRoomTV']>) => Promise<void>;
    onAddSongToPlaylist: (guestId: string, title: string, artist: string) => Promise<void>;
    onUpvoteSong: (guestId: string, songId: string) => Promise<void>;
    onPlaceRoomServiceOrder: (bookingId: string, items: SaleItem[]) => Promise<Transaction>;
    onStartReceptionChat: (guestId: string, guestName: string) => Promise<ChatConversation>;
    onStartGuestChat: (guest1Id: string, guest1Name: string, guest2Id: string, guest2Name: string) => Promise<ChatConversation>;
    onSendMessage: (conversationId: string, text: string, senderId: string, senderName: string) => Promise<ChatMessage>;
    onCreateGuestActivity: (activityData: Omit<GuestActivity, 'id' | 'creatorName' | 'chatConversationId' | 'photoAlbum'>) => Promise<GuestActivity>;
    onUpdateGuestActivity: (activityData: GuestActivity) => Promise<GuestActivity>;
    onDeleteGuestActivity: (activityId: string) => Promise<void>;
    onJoinGuestActivity: (activityId: string, guestId: string, guestName: string) => Promise<ActivityParticipant>;
    onLeaveGuestActivity: (activityId: string, guestId: string) => Promise<void>;
    onAddActivityComment: (activityId: string, guestId: string, guestName: string, text: string) => Promise<ActivityComment>;
    onMakeActivityContribution: (activityId: string, guestId: string, amount: number) => Promise<ActivityContribution>;
    onToggleFavoriteTip: (guestId: string, tipId: string) => Promise<void>;
    onUpdateItinerary: (guestId: string, itinerary: ItineraryItem[]) => Promise<void>;
    onUnlockAchievement: (guestId: string, achievementId: string) => Promise<void>;
    onRedeemReward: (guestId: string, rewardId: string) => Promise<void>;
    onAddGuestPost: (guestId: string, text: string, mediaUrl?: string, mediaType?: 'image' | 'video') => Promise<void>;
    onMakeCheckIn: (guestId: string, locationId: string, locationType: 'tip' | 'activity') => Promise<void>;
    onSendConciergeMessage: (guestId: string, message: string) => Promise<AIConciergeMessage>;
    onRsvpToEvent: (eventId: string, guestId: string, guestName: string) => Promise<void>;
    onCancelRsvpFromEvent: (eventId: string, guestId: string) => Promise<void>;
    onGetBookingStatement: (bookingId: string) => Promise<{ date: string; description: string; amount: number }[]>;
    onGetIcebreakerSuggestions: (guestId: string) => Promise<{ suggestions: { guestId: string, guestName: string, suggestion: string }[] } | null>;
    onGenerateItinerary: (guestId: string) => Promise<void>;
    onMarkNotificationAsRead: (guestId: string, notificationId: string) => Promise<void>;
    onTogglePostLike: (postId: string, guestId: string) => Promise<void>;
    onAddPostComment: (postId: string, guestId: string, text: string) => Promise<void>;
    onAddPhotoToActivityAlbum: (activityId: string, photoUrl: string) => Promise<void>;
    onAddLostAndFoundItem: (itemData: Omit<LostAndFoundItem, 'id' | 'guestName'>) => Promise<void>;
    onClaimFoundItem: (itemId: string, claimerId: string) => Promise<void>;
    onDeleteLostAndFoundItem: (itemId: string, requestorId: string) => Promise<void>;
    onAddClassifiedsItem: (itemData: Omit<ClassifiedsItem, 'id' | 'guestName' | 'status'>) => Promise<void>;
    onDeleteClassifiedsItem: (itemId: string, requestorId: string) => Promise<void>;
    onCheckStayExtension: (bookingId: string, newCheckOutDate: string) => Promise<{ available: boolean; extensionCost: number; newTotalPrice: number; error?: string }>;
    onConfirmStayExtension: (bookingId: string, newCheckOutDate: string) => Promise<void>;
    onGetLodgingAgreement: (bookingId: string) => Promise<{ title: string, content: string }>;
    onGetInvoice: (bookingId: string) => Promise<{ title: string, content: string }>;
    onPreCheckout: (bookingId: string, checkoutTime: string) => Promise<void>;
    onUpdateKitchenStatus: (newStatus: 'ok' | 'needs_attention') => Promise<void>;
    onBookPartnerService: (guestId: string, serviceId: string, serviceDate: string) => Promise<ServiceBooking>;
    onAddGuestStory: (guestId: string, mediaUrl: string, mediaType?: 'image' | 'video') => Promise<void>;
    onViewStory: (storyId: string, guestId: string) => Promise<void>;
}

// Helper Components
const MediaContent: React.FC<{ url?: string; type?: 'image' | 'video'; className?: string }> = ({ url, type = 'image', className = "" }) => {
    if (!url) return null;
    
    if (type === 'video') {
        return (
            <video 
                src={url} 
                className={`${className} object-cover`} 
                controls 
                preload="metadata"
                playsInline
            />
        );
    }
    
    return <img src={url} className={`${className} object-cover`} alt="Post media" />;
};

const PortalModal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' }> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
    if (!isOpen) return null;
    const sizeClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', 'full': 'max-w-full h-full rounded-none' }[size];
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className={`bg-white text-gray-800 shadow-xl w-full ${sizeClass} ${size === 'full' ? '' : 'max-h-[90vh]'} flex flex-col ${size === 'full' ? '' : 'rounded-2xl'}`} onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 p-5 flex justify-between items-center border-b">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><X size={24} /></button>
                </header>
                <main className="p-5 flex-grow overflow-y-auto">{children}</main>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ label: string; icon: React.ElementType; active: boolean; onClick: () => void; isMobile?: boolean; hasNotification?: boolean; }> = ({ label, icon: Icon, active, onClick, isMobile = false, hasNotification = false }) => {
    return (
        <div className="relative w-full">
            <button
                onClick={onClick}
                className={`flex items-center gap-4 px-5 py-4 text-sm font-black uppercase tracking-widest transition-all w-full relative group ${
                    isMobile ? 'flex-col text-[10px] px-1 py-3 gap-1 tracking-tight normal-case' : 'justify-start'
                } ${
                    active 
                    ? `text-brand-green ${isMobile ? 'bg-transparent' : 'bg-brand-green/5 border-r-4 border-brand-green'}` 
                    : `${isMobile ? 'text-white/60 hover:text-white/90' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`
                }`}
            >
                <Icon size={isMobile ? 22 : 20} strokeWidth={active ? 2.5 : 2} />
                <span className={isMobile ? 'font-bold' : 'inline'}>{label}</span>
                
                {!isMobile && active && (
                    <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute left-0 w-1.5 h-8 bg-brand-green rounded-r-full"
                    />
                )}
            </button>
            {hasNotification && (
                <span className="absolute top-3 right-4 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
            )}
        </div>
    );
};

const ThemeStyle = ({ themeSettings }: { themeSettings: ThemeSettings['guestPortal'] }) => {
    const css = `
        :root {
            --portal-bg: ${themeSettings.backgroundColor};
            --portal-text: ${themeSettings.textColor};
            --portal-card-bg: ${themeSettings.cardColor};
            --portal-primary: ${themeSettings.primaryColor};
            --guest-card-radius: ${themeSettings.cardBorderRadius};
            --guest-button-radius: ${themeSettings.buttonBorderRadius};
        }
        [data-theme='dark'] {
            --portal-bg: #111827;
            --portal-text: #E5E7EB;
            --portal-card-bg: #1F2937;
            --portal-primary: #60A5FA;
        }
        [data-theme='tropical'] {
            --portal-bg: #FFFBEB;
            --portal-text: #374151;
            --portal-card-bg: #FFFFFF;
            --portal-primary: #EC4899;
        }
        .input-base-portal {
            @apply w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[var(--portal-primary)]/50 focus:border-[var(--portal-primary)] transition-shadow duration-200 text-gray-800;
        }
        .animate-story-progress {
            animation: storyProgress 3s linear forwards;
        }
        @keyframes storyProgress {
            from { width: 0%; }
            to { width: 100%; }
        }
    `;
    return <style>{css}</style>;
};

const allIcons: { [key: string]: React.ElementType } = { Footprints, Map, MessageSquare, Megaphone, Sparkles, Palette, Route, ThumbsUp, MapPin, Camera, BookOpen, Star: StarIcon, Award, Crown, Coffee, Beer, CheckSquare };

// Define static data outside the component to prevent re-creation on renders
const weather = {
    city: "Florianópolis",
    temp: 26,
    condition: "Ensolarado com poucas nuvens",
    min: 22,
    max: 29,
    icon: Sun,
};

export const GuestPortalView: FC<GuestPortalViewProps> = (props) => {
    const { currentUser, db, chatData, setPage, logout, guestNotifications, onUpdateProfile, onSendConciergeMessage, onAddGuestPost, onTogglePostLike, onAddPostComment, onMakeCheckIn, onRedeemReward, onGenerateItinerary, onRequestService, onPlaceRoomServiceOrder, onGetIcebreakerSuggestions, onRsvpToEvent, onCancelRsvpFromEvent, onGetBookingStatement, onMarkNotificationAsRead, onCreateGuestActivity, onUpdateGuestActivity, onDeleteGuestActivity, onJoinGuestActivity, onLeaveGuestActivity, onUpdateLivingRoomTV, onAddSongToPlaylist, onUpvoteSong, onStartGuestChat, onSendMessage, onMakeActivityContribution, onAddPhotoToActivityAlbum, onAddLostAndFoundItem, onClaimFoundItem, onDeleteLostAndFoundItem, onAddClassifiedsItem, onDeleteClassifiedsItem, onUpdateRoomControls, onPayBalance, onAcknowledgeRules, onCheckStayExtension, onConfirmStayExtension, onGetLodgingAgreement, onGetInvoice, onAddActivityComment, onStartReceptionChat, onToggleFavoriteTip, onUpdateItinerary, onPreCheckout, onUpdateKitchenStatus, onBookPartnerService, onAddGuestStory, onViewStory } = props;
    
    type Tab = 'inicio' | 'minhaEstadia' | 'areasComuns' | 'community' | 'chat' | 'explore' | 'events' | 'itinerary' | 'concierge' | 'rewards' | 'settings' | 'mural' | 'marketplace';
    const [activeTab, setActiveTab] = useState<Tab>('inicio');
    
    const [isRoomServiceModalOpen, setIsRoomServiceModalOpen] = useState(false);
    const [isServiceRequestModalOpen, setIsServiceRequestModalOpen] = useState(false);
    const [isGuestProfileModalOpen, setIsGuestProfileModalOpen] = useState(false);
    const [selectedGuestProfile, setSelectedGuestProfile] = useState<Guest | null>(null);
    const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
    const [statementData, setStatementData] = useState<{ date: string; description: string; amount: number }[]>([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [isItineraryDetailModalOpen, setIsItineraryDetailModalOpen] = useState(false);
    const [selectedItineraryItem, setSelectedItineraryItem] = useState<ItineraryItem | null>(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [mapUrl, setMapUrl] = useState('');
    const [isPreCheckoutModalOpen, setIsPreCheckoutModalOpen] = useState(false);
    const [isPayBalanceModalOpen, setIsPayBalanceModalOpen] = useState(false);
    const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
    const [isNfcModalOpen, setIsNfcModalOpen] = useState(false);
    
    const [serviceRequestDetails, setServiceRequestDetails] = useState({ type: 'Limpeza' as 'Limpeza' | 'Manutenção' | 'Lavanderia', details: '' });
    const [roomServiceCart, setRoomServiceCart] = useState<SaleItem[]>([]);
    const [icebreakerSuggestions, setIcebreakerSuggestions] = useState<{ suggestions: { guestId: string, guestName: string, suggestion: string }[] } | null>(null);
    const [conciergeInput, setConciergeInput] = useState('');
    const [isConciergeLoading, setIsConciergeLoading] = useState(false);
    const [newPostText, setNewPostText] = useState('');
    const [newPostMedia, setNewPostMedia] = useState<string | null>(null);
    const [newPostMediaType, setNewPostMediaType] = useState<'image' | 'video'>('image');
    const newPostMediaRef = useRef<HTMLInputElement>(null);
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [wifiCopied, setWifiCopied] = useState(false);
    const [communityView, setCommunityView] = useState<'feed' | 'people' | 'activities'>('feed');
    const [communityLayout, setCommunityLayout] = useState<'list' | 'grid'>('list');
    const [selectedStory, setSelectedStory] = useState<{ guestId: string; storyIndex: number } | null>(null);
    const [isNewStoryModalOpen, setIsNewStoryModalOpen] = useState(false);

    useEffect(() => {
        if (selectedStory) {
            const stories = db.guestStories.filter(s => s.guestId === selectedStory.guestId);
            const currentStory = stories[selectedStory.storyIndex];
            if (currentStory && !currentStory.viewers.includes(currentUser.id)) {
                onViewStory(currentStory.id, currentUser.id);
            }

            const timer = setTimeout(() => {
                if (selectedStory.storyIndex < stories.length - 1) {
                    setSelectedStory({ ...selectedStory, storyIndex: selectedStory.storyIndex + 1 });
                } else {
                    setSelectedStory(null);
                }
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [selectedStory, db.guestStories, currentUser.id, onViewStory]);

    const [profileData, setProfileData] = useState({
        bio: currentUser.bio || '',
        interests: currentUser.interests || [],
        theme: currentUser.theme || 'light',
        profilePictureUrl: currentUser.profilePictureUrl || ''
    });
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // State for Guest-created Activities
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Omit<GuestActivity, 'id' | 'creatorName' | 'chatConversationId' | 'photoAlbum'> | GuestActivity | null>(null);
    const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
    const [contributionAmount, setContributionAmount] = useState<number | string>('');
    const [activityToContribute, setActivityToContribute] = useState<GuestActivity | null>(null);
    const [isActivityDetailModalOpen, setIsActivityDetailModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<GuestActivity | null>(null);
    const [activityDetailTab, setActivityDetailTab] = useState<'details' | 'chat' | 'photos'>('details');
    const [groupChatMessage, setGroupChatMessage] = useState('');
    const photoInputRef = useRef<HTMLInputElement>(null);
    
    // State for Jukebox
    const [songSearch, setSongSearch] = useState('');
    
    // State for Chat
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [chatMessageInput, setChatMessageInput] = useState('');
    const chatMessagesEndRef = useRef<HTMLDivElement>(null);

    // State for Mural
    const [isLostFoundModalOpen, setIsLostFoundModalOpen] = useState(false);
    const [lostFoundData, setLostFoundData] = useState<Omit<LostAndFoundItem, 'id'|'guestId'|'guestName'|'date'|'claimerId'>>({ status: 'lost', itemName: '', description: '', locationFoundOrLost: '', imageUrl: undefined });
    const [isClassifiedsModalOpen, setIsClassifiedsModalOpen] = useState(false);
    const [classifiedsData, setClassifiedsData] = useState<Omit<ClassifiedsItem, 'id'|'guestId'|'guestName'|'status'>>({ category: 'Venda', title: '', description: '', price: 0, imageUrl: undefined });
    const [muralTab, setMuralTab] = useState<'lostfound' | 'classifieds'>('lostfound');
    const muralImageInputRef = useRef<HTMLInputElement>(null);

    // State for My Stay enhancements
    const [newCheckOutDate, setNewCheckOutDate] = useState('');
    const [extensionOffer, setExtensionOffer] = useState<{ available: boolean; extensionCost: number; newTotalPrice: number; error?: string } | null>(null);
    const [isCheckingExtension, setIsCheckingExtension] = useState(false);
    const [isConfirmingExtension, setIsConfirmingExtension] = useState(false);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [documentContent, setDocumentContent] = useState({ title: '', content: '' });
    const [preCheckoutTime, setPreCheckoutTime] = useState('11:00');
    const [preCheckoutStep, setPreCheckoutStep] = useState(1);
    const [isFinalizingPayment, setIsFinalizingPayment] = useState(false);
    
    // State for NFC Modal Animation
    const [nfcAnimationState, setNfcAnimationState] = useState<'idle' | 'scanning' | 'unlocked'>('idle');

    // State for new dynamic home tab
    const [personalizedTip, setPersonalizedTip] = useState<{tip: LocalGuideTip, justification: string} | null>(null);
    const [isTipLoading, setIsTipLoading] = useState(false);

    // Payment Modal State
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
    const [cardDetails, setCardDetails] = useState({ number: '', holderName: '', expiry: '', cvc: '' });

    // Mobile "More" menu
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    // Partner Service Booking Modal State
    const [isPartnerServiceModalOpen, setIsPartnerServiceModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<PartnerService | null>(null);
    const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);


    const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
    const isSubmitting = (id: string) => submittingIds.has(id);
    const setSubmit = (id: string, status: boolean) => {
        setSubmittingIds(prev => {
            const newSet = new Set(prev);
            if (status) newSet.add(id);
            else newSet.delete(id);
            return newSet;
        });
    };


    const activeBooking = useMemo(() => db.bookings.find(b => b.guestId === currentUser.id && ['Checked-in', 'Confirmed', 'Pre-Checked-in'].includes(b.status)), [db.bookings, currentUser.id]);
    const activeRoom = useMemo(() => activeBooking ? db.rooms.find(r => r.id === activeBooking.roomId) : null, [activeBooking, db.rooms]);
    const activeProperty = useMemo(() => db.properties.find(p => p.id === db.currentPropertyId) || db.properties[0], [db.properties, db.currentPropertyId]);
    const theme = currentUser.theme || 'light';
    const guestPortalSettings = db.themeSettings.guestPortal;

    const getLoyaltyLevelForPoints = (points: number) => {
        if (!db.loyaltyLevels || db.loyaltyLevels.length === 0) {
            return { id: 'fallback', name: 'Visitante', minPoints: 0, icon: 'Users', perks: ['Acesso ao Portal', 'Dicas Locais'] };
        }
        return db.loyaltyLevels
            .filter(l => points >= l.minPoints)
            .sort((a, b) => b.minPoints - a.minPoints)[0] || db.loyaltyLevels[0];
    };

    const currentLoyaltyLevel = useMemo(() => {
        return getLoyaltyLevelForPoints(currentUser.points || 0);
    }, [db.loyaltyLevels, currentUser.points]);

    const unreadNotifications = guestNotifications.filter(n => !n.read);
    const hasUnreadChat = useMemo(() => (chatData?.conversations || []).some(c => c.unread && (c.participants?.some(p => p.guestId === currentUser.id) || c.activityId)), [chatData?.conversations, currentUser.id]);
    
    useEffect(() => {
        const fetchPersonalizedTip = async () => {
            if (activeTab === 'inicio' && !personalizedTip && !isTipLoading) {
                setIsTipLoading(true);
                const result = await generatePersonalizedTip(currentUser, db.localGuideTips, weather);
                if (result && result.tipId) {
                    const tip = db.localGuideTips.find(t => t.id === result.tipId);
                    if (tip) {
                        setPersonalizedTip({ tip, justification: result.justification });
                    }
                }
                setIsTipLoading(false);
            }
        };
        fetchPersonalizedTip();
    }, [activeTab, currentUser, db.localGuideTips, personalizedTip, isTipLoading]);

    useEffect(() => {
        const fetchIcebreakers = async () => {
            const suggestions = await onGetIcebreakerSuggestions(currentUser.id);
            setIcebreakerSuggestions(suggestions);
        };
        if (activeTab === 'community') {
            fetchIcebreakers();
        }
    }, [activeTab, currentUser.id, onGetIcebreakerSuggestions]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    useEffect(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatData?.messages, activeChatId, currentUser.conciergeChatHistory]);
    
    useEffect(() => {
        if (isNfcModalOpen) {
            setNfcAnimationState('idle'); // Reset on open
            const t1 = setTimeout(() => setNfcAnimationState('scanning'), 500);
            const t2 = setTimeout(() => setNfcAnimationState('unlocked'), 2500);
            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
            };
        }
    }, [isNfcModalOpen]);
    
    const handleSendConciergeMessage = async () => {
        if (!conciergeInput.trim()) return;
        setIsConciergeLoading(true);
        const userMessage = conciergeInput;
        setConciergeInput('');
        await onSendConciergeMessage(currentUser.id, userMessage);
        setIsConciergeLoading(false);
    };

    const handleAddPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostText.trim()) return;
        setSubmit('add-post', true);
        await onAddGuestPost(currentUser.id, newPostText, newPostMedia || undefined, newPostMediaType);
        setNewPostText('');
        setNewPostMedia(null);
        if (newPostMediaRef.current) newPostMediaRef.current.value = '';
        setIsNewPostModalOpen(false);
        setSubmit('add-post', false);
    };

    const handlePostMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const isVideo = file.type.startsWith('video/');
            setNewPostMediaType(isVideo ? 'video' : 'image');
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPostMedia(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAddComment = async (postId: string) => {
        const text = commentInputs[postId];
        if (!text || !text.trim()) return;
        setSubmit(`comment-${postId}`, true);
        await onAddPostComment(postId, currentUser.id, text);
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        setSubmit(`comment-${postId}`, false);
    };

    const handleRedeem = async (reward: Reward) => {
        if (currentUser.points === undefined || currentUser.points < reward.cost) {
            alert("Pontos insuficientes!");
            return;
        }
        setSubmit(`reward-${reward.id}`, true);
        await onRedeemReward(currentUser.id, reward.id);
        setSubmit(`reward-${reward.id}`, false);
    };

    const handleRequestServiceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(activeBooking) {
            setSubmit('request-service', true);
            await onRequestService(activeBooking.id, serviceRequestDetails.type, serviceRequestDetails.details);
            setServiceRequestDetails({ type: 'Limpeza', details: '' });
            setIsServiceRequestModalOpen(false);
            setSubmit('request-service', false);
            eventBus.emit('new-toast', { type: 'success', title: 'Solicitação Enviada', message: `Sua solicitação de ${serviceRequestDetails.type} foi enviada.` });
        }
    };
    
    const handlePlaceOrder = async () => {
        if(activeBooking && roomServiceCart.length > 0) {
            setSubmit('place-order', true);
            await onPlaceRoomServiceOrder(activeBooking.id, roomServiceCart);
            setIsRoomServiceModalOpen(false);
            setRoomServiceCart([]);
            setSubmit('place-order', false);
            eventBus.emit('new-toast', { type: 'success', title: 'Pedido Enviado', message: 'Seu pedido de serviço de quarto foi enviado para a cozinha.' });
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileData(p => ({ ...p, profilePictureUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        await onUpdateProfile(currentUser.id, profileData);
        setIsSavingProfile(false);
        eventBus.emit('new-toast', { type: 'success', title: 'Perfil Atualizado', message: 'Suas informações foram salvas.' });
    };

    const handleInterestToggle = (interest: string) => {
        setProfileData(prev => {
            const interests = prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest];
            return { ...prev, interests };
        });
    };
    
    const handleOpenStatement = async () => {
        if (activeBooking) {
            const data = await onGetBookingStatement(activeBooking.id);
            setStatementData(data);
            setIsStatementModalOpen(true);
        }
    };
    
    const handleViewProfile = (guestId: string) => {
        const guest = db.guests.find(g => g.id === guestId);
        if (guest) {
            setSelectedGuestProfile(guest);
            setIsGuestProfileModalOpen(true);
        }
    };
    
    const handleJoinActivity = async (activityId: string) => {
        setSubmit(`join-activity-${activityId}`, true);
        await onJoinGuestActivity(activityId, currentUser.id);
        setSubmit(`join-activity-${activityId}`, false);
        eventBus.emit('new-toast', { type: 'success', title: 'Participação Confirmada', message: 'Você agora faz parte desta atividade!' });
    };

    const handleLeaveActivity = async (activityId: string) => {
        setSubmit(`leave-activity-${activityId}`, true);
        await onLeaveGuestActivity(activityId, currentUser.id);
        setSubmit(`leave-activity-${activityId}`, false);
        eventBus.emit('new-toast', { type: 'info', title: 'Participação Cancelada', message: 'Você saiu da atividade.' });
    };

    const handleGenerateItineraryClick = async () => {
        setSubmit('generate-itinerary', true);
        await onGenerateItinerary(currentUser.id);
        setSubmit('generate-itinerary', false);
    };

    const handleAddToItinerary = async (sourceId: string, type: 'tip' | 'event', title: string) => {
        const id = `itinerary-${sourceId}`;
        setSubmit(id, true);
        const newItem: ItineraryItem = {
            id: `ITI_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            title,
            type,
            sourceId,
        };
        const newItinerary = [...(currentUser.itinerary || []), newItem];
        await onUpdateItinerary(currentUser.id, newItinerary);
        eventBus.emit('new-toast', { type: 'success', title: 'Item Adicionado', message: `"${title}" foi adicionado ao seu roteiro.`});
        setSubmit(id, false);
    };
    
    const addToCart = (product: Product) => {
        setRoomServiceCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { productId: product.id, name: product.name, quantity: 1, unitPrice: product.price }];
        });
    };

    const cartTotal = useMemo(() => roomServiceCart.reduce((total, item) => total + (item.unitPrice * item.quantity), 0), [roomServiceCart]);


    const allInterests = useMemo(() => Array.from(new Set(['surf', 'trilhas', 'gastronomia', 'festa', 'relaxar', 'yoga', 'leitura', 'fotografia', ...(currentUser.interests || [])])), [currentUser.interests]);
    
    // Guest Activity Handlers
    const handleOpenActivityModal = (activity: GuestActivity | null) => {
        if (activity) {
            const localDate = new Date(activity.date);
            const localISOString = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            setEditingActivity({ ...activity, date: localISOString });
        } else {
            const defaultDate = new Date();
            defaultDate.setHours(defaultDate.getHours() + 1);
            const localISOString = new Date(defaultDate.getTime() - (defaultDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            setEditingActivity({
                creatorId: currentUser.id,
                title: '',
                description: '',
                date: localISOString,
            });
        }
        setIsActivityModalOpen(true);
    };

    const handleSaveActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingActivity) return;
        
        setSubmit('save-activity', true);
        const activityData = { ...editingActivity, date: new Date(editingActivity.date).toISOString() };

        if ('id' in activityData) {
            await onUpdateGuestActivity(activityData as GuestActivity);
        } else {
            await onCreateGuestActivity(activityData as Omit<GuestActivity, 'id' | 'creatorName' | 'chatConversationId' | 'photoAlbum'>);
        }
        setIsActivityModalOpen(false);
        setEditingActivity(null);
        setSubmit('save-activity', false);
    };

    const handleActivityInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditingActivity(prev => {
            if (!prev) return null;
            const numericFields = ['maxParticipants', 'crowdfundingTarget'];
            if (numericFields.includes(name)) {
                const numValue = value === '' ? undefined : Number(value);
                return { ...prev, [name]: numValue };
            }
            return { ...prev, [name]: value };
        });
    };
    
    const handleOpenActivityDetail = (activity: GuestActivity) => {
        setSelectedActivity(activity);
        setActivityDetailTab('details');
        setIsActivityDetailModalOpen(true);
    };
    
    const handleAddSong = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!songSearch.trim()) return;
        // Simulate searching and finding a song
        const parts = songSearch.split(' - ');
        const artist = parts.length > 1 ? parts.pop()!.trim() : 'Artista Desconhecido';
        const title = parts.join(' - ').trim();
        await onAddSongToPlaylist(currentUser.id, title, artist);
        setSongSearch('');
    };

    const leaderboardGuests = useMemo(() => {
        return [...db.guests]
            .sort((a, b) => (b.weeklyPoints || 0) - (a.weeklyPoints || 0))
            .slice(0, 10);
    }, [db.guests]);
    
    const handleOpenContributionModal = (activity: GuestActivity) => {
        setActivityToContribute(activity);
        setContributionAmount('');
        setIsContributionModalOpen(true);
    };

    const handleMakeContribution = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activityToContribute || !contributionAmount || Number(contributionAmount) <= 0) return;
        setSubmit('make-contribution', true);
        await onMakeActivityContribution(activityToContribute.id, currentUser.id, Number(contributionAmount));
        setIsContributionModalOpen(false);
        setSubmit('make-contribution', false);
    };
    
    // Chat handlers
    const handleStartChat = async (guest?: Guest) => {
        if (!guest) return;
        const conversation = await onStartGuestChat(currentUser.id, currentUser.fullName, guest.id, guest.fullName);
        if (conversation) {
            setActiveChatId(conversation.id);
            setActiveTab('chat');
            setIsGuestProfileModalOpen(false);
        }
    };

    const handleSendChatMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!chatMessageInput.trim() || !activeChatId) return;
        await onSendMessage(activeChatId, chatMessageInput, currentUser.id, currentUser.fullName);
        setChatMessageInput('');
    };

    const handleSendGroupChatMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupChatMessage.trim() || !selectedActivity?.chatConversationId) return;
        setSubmit('group-chat', true);
        await onSendMessage(selectedActivity.chatConversationId, groupChatMessage, currentUser.id, currentUser.fullName);
        setGroupChatMessage('');
        setSubmit('group-chat', false);
    };

    const handlePhotoUploadActivity = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedActivity) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                onAddPhotoToActivityAlbum(selectedActivity.id, reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleMuralImageSelect = (e: React.ChangeEvent<HTMLInputElement>, setState: React.Dispatch<React.SetStateAction<any>>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setState((prev: any) => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleReportLostFound = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmit('lost-found', true);
        await onAddLostAndFoundItem({
            ...lostFoundData,
            guestId: currentUser.id,
            date: new Date().toISOString(),
        });
        setIsLostFoundModalOpen(false);
        setSubmit('lost-found', false);
        setLostFoundData({ status: 'lost', itemName: '', description: '', locationFoundOrLost: '', imageUrl: undefined });
    };

    const handleCreateClassified = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmit('classified', true);
        await onAddClassifiedsItem({
            ...classifiedsData,
            guestId: currentUser.id,
        });
        setIsClassifiedsModalOpen(false);
        setSubmit('classified', false);
        setClassifiedsData({ category: 'Venda', title: '', description: '', price: 0, imageUrl: undefined });
    };

    const handleContactSeller = async (sellerId: string) => {
        const seller = db.guests.find(g => g.id === sellerId);
        if (!seller) {
            eventBus.emit('new-toast', { type: 'error', title: 'Erro', message: 'Vendedor não encontrado.' });
            return;
        }
        try {
            const conversation = await onStartGuestChat(currentUser.id, currentUser.fullName, seller.id, seller.fullName);
            setActiveChatId(conversation.id);
            setActiveTab('chat');
        } catch (error) {
            console.error("Failed to start chat with seller:", error);
            eventBus.emit('new-toast', { type: 'error', title: 'Erro', message: 'Não foi possível iniciar o chat.' });
        }
    };
    
    const handleCheckExtension = async () => {
        if (!activeBooking || !newCheckOutDate) return;
        setIsCheckingExtension(true);
        const result = await onCheckStayExtension(activeBooking.id, newCheckOutDate);
        setExtensionOffer(result);
        setIsCheckingExtension(false);
    };

    const handleConfirmExtension = async () => {
        if (!activeBooking || !newCheckOutDate) return;
        setIsConfirmingExtension(true);
        await onConfirmStayExtension(activeBooking.id, newCheckOutDate);
        setIsConfirmingExtension(false);
        setExtensionOffer(null);
        setNewCheckOutDate('');
        eventBus.emit('new-toast', { type: 'success', title: 'Estadia Estendida', message: 'Sua reserva foi prolongada com sucesso.' });
    };

    const [isDocumentLoading, setIsDocumentLoading] = useState(false);

    const handleOpenDocument = async (type: 'agreement' | 'invoice') => {
        if (!activeBooking) return;
        setIsDocumentLoading(true);
        try {
            let doc;
            if (type === 'agreement') {
                doc = await onGetLodgingAgreement(activeBooking.id);
            } else {
                doc = await onGetInvoice(activeBooking.id);
            }
            
            if (doc && doc.content) {
                setDocumentContent(doc);
                setIsDocumentModalOpen(true);
            } else {
                eventBus.emit('new-toast', { 
                    type: 'error', 
                    title: 'Erro ao Carregar', 
                    message: 'Não foi possível gerar o documento no momento.' 
                });
            }
        } catch (error) {
            console.error("Error loading document:", error);
            eventBus.emit('new-toast', { 
                type: 'error', 
                title: 'Erro', 
                message: 'Ocorreu uma falha ao abrir o documento.' 
            });
        } finally {
            setIsDocumentLoading(false);
        }
    };

    const handleAcceptRules = async () => {
        if (activeBooking) {
            await onAcknowledgeRules(activeBooking.id);
            setIsRulesModalOpen(false);
        }
    };

    const handleOpenItineraryDetail = (item: ItineraryItem) => {
        setSelectedItineraryItem(item);
        setIsItineraryDetailModalOpen(true);
    };

    const handleOpenMap = (locations: (string | undefined)[]) => {
        const validLocations = locations.filter(Boolean) as string[];
        if (validLocations.length === 0) return;

        let url;
        if (validLocations.length === 1) {
            url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(validLocations[0])}`;
        } else {
            const origin = db.properties.find(p => p.id === db.currentPropertyId)?.address;
            const destination = validLocations[validLocations.length - 1];
            const waypoints = validLocations.slice(0, -1).join('|');
            url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin || validLocations[0])}&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints)}`;
        }
        window.open(url, '_blank');
    };
    
    const handleClearDayItinerary = async (date: string) => {
        if (!currentUser.itinerary) return;
        setSubmit(`clear-itinerary-${date}`, true);
        const newItinerary = currentUser.itinerary.filter(item => item.date.split('T')[0] !== date);
        await onUpdateItinerary(currentUser.id, newItinerary);
        setSubmit(`clear-itinerary-${date}`, false);
    };

    const handleFinalizePreCheckout = async () => {
        if (!activeBooking) return;
        setSubmit('pre-checkout', true);
        await onPreCheckout(activeBooking.id, preCheckoutTime);
        setSubmit('pre-checkout', false);
        setPreCheckoutStep(3);
    };

    const handleProcessBalancePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBooking) return;
        setSubmit('pay-balance', true);
        let details: PaymentDetails | { method: 'PIX' } | undefined;
        if(paymentMethod === 'card') {
             details = { method: 'Cartão de Crédito', ...cardDetails, cardNumber: cardDetails.number, expiryDate: cardDetails.expiry };
        } else {
            details = { method: 'PIX' };
        }
        await onPayBalance(activeBooking.id, details);
        setIsPayBalanceModalOpen(false);
        setSubmit('pay-balance', false);
    };
    
    const handlePayBalanceAndFinalize = async () => {
        if (!activeBooking) return;
        setIsFinalizingPayment(true);
        await onPayBalance(activeBooking.id);
        await handleFinalizePreCheckout();
        setIsFinalizingPayment(false);
    };

    const handleContactReception = async () => {
        if(!activeProperty) return;
        const conversation = await onStartReceptionChat(currentUser.id, currentUser.fullName);
        setActiveChatId(conversation.id);
        setActiveTab('chat');
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bom dia";
        if (hour < 18) return "Boa tarde";
        return "Boa noite";
    };

    const nextItineraryItem = useMemo(() => {
        const now = new Date();
        const upcomingItems = (currentUser.itinerary || [])
            .map(item => {
                // Handle full ISO string date and date-only string
                const datePart = item.date.split('T')[0];
                return { ...item, dateTime: new Date(`${datePart}T${item.time || '00:00:00'}`) };
            })
            .filter(item => item.dateTime >= now)
            .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
        return upcomingItems[0] || null;
    }, [currentUser.itinerary]);

    const latestPost = useMemo(() => {
        return [...(db.guestPosts || [])].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    }, [db.guestPosts]);

    const handleOpenPartnerServiceModal = (service: PartnerService) => {
        setSelectedService(service);
        setIsPartnerServiceModalOpen(true);
    };
    
    const handleBookService = async () => {
        if (!selectedService || !serviceDate) return;
        setSubmit(`book-service-${selectedService.id}`, true);
        try {
            await onBookPartnerService(currentUser.id, selectedService.id, serviceDate);
            eventBus.emit('new-toast', { type: 'success', title: 'Serviço Contratado!', message: `${selectedService.name} foi agendado com sucesso.` });
            setIsPartnerServiceModalOpen(false);
            setSelectedService(null);
        } catch (error: any) {
            eventBus.emit('new-toast', { type: 'error', title: 'Erro ao Contratar', message: error.message });
        } finally {
            setSubmit(`book-service-${selectedService.id}`, false);
        }
    };
    
    const tabs: { id: Tab, label: string, icon: React.ElementType, notification?: boolean }[] = [
        { id: 'inicio', label: 'Início', icon: Home },
        { id: 'minhaEstadia', label: 'Minha Estadia', icon: Key },
        { id: 'areasComuns', label: 'Áreas Comuns', icon: Sofa },
        { id: 'marketplace', label: 'Marketplace', icon: Sparkles },
        { id: 'community', label: 'Comunidade', icon: Users2 },
        { id: 'mural', label: 'Mural', icon: Newspaper },
        { id: 'chat', label: 'Chat', icon: MessageCircleIcon, notification: hasUnreadChat },
        { id: 'explore', label: 'Explorar', icon: Map },
        { id: 'events', label: 'Eventos', icon: Megaphone },
        { id: 'itinerary', label: 'Meu Roteiro', icon: Route },
        { id: 'concierge', label: 'Concierge IA', icon: Bot },
        { id: 'rewards', label: 'Recompensas', icon: Gift, notification: unreadNotifications.some(n => n.type === 'reward' || n.type === 'achievement') },
        { id: 'settings', label: 'Ajustes', icon: Settings }
    ];

    const activeTabInfo = useMemo(() => tabs.find(tab => tab.id === activeTab), [activeTab, tabs]);

    const renderTabContent = () => {
        switch(activeTab) {
            case 'inicio': {
                return (
                     <div className="space-y-12 pb-12">
                         <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-brand-dark p-10 rounded-3xl text-white relative overflow-hidden shadow-2xl"
                         >
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Mountain className="h-32 w-auto" />
                            </div>
                            <div className="relative z-10">
                                <div className="mb-4 inline-block bg-white/10 backdrop-blur-md rounded-full px-4 py-1 border border-white/20">
                                    <span className="text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-2">
                                        <Sparkles size={12} className="text-brand-sand" /> Dashboard de Hospedagem
                                    </span>
                                </div>
                                <h1 className="text-5xl font-black mb-4 font-serif leading-tight">
                                    {getGreeting()}, <br/>{(currentUser.fullName || 'Hóspede').split(' ')[0]}
                                </h1>
                                <p className="text-white/60 font-medium max-w-md">Sua experiência personalizada no Forest Beach House começa aqui. Como podemos tornar seu dia incrível?</p>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-brand-green/20 rounded-full blur-3xl"></div>
                         </motion.div>

                         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {/* Card 1: Personalized AI Tip */}
                             <motion.div 
                                whileHover={{ y: -5 }}
                                className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 border border-gray-50 flex flex-col relative overflow-hidden group"
                             >
                                <div className="absolute top-0 left-0 w-1 h-full bg-brand-green"></div>
                                <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <Sparkles size={16} className="text-brand-green animate-pulse"/>
                                    Dica do Concierge IA
                                </h3>
                                {isTipLoading && <div className="flex-grow flex items-center justify-center py-12"><Loader2 className="animate-spin text-brand-green" /></div>}
                                {personalizedTip && !isTipLoading && (
                                     <div className="flex-grow flex flex-col">
                                        <p className="text-2xl font-black text-gray-800 mb-2 leading-tight">{personalizedTip.tip.title}</p>
                                        <p className="text-sm text-gray-600 font-medium italic mb-8 grow">"{personalizedTip.justification}"</p>
                                        <button 
                                            onClick={() => {
                                                setSelectedItineraryItem({id: `temp-${personalizedTip.tip.id}`, date: new Date().toISOString(), title: personalizedTip.tip.title, type: 'tip', sourceId: personalizedTip.tip.id});
                                                setIsItineraryDetailModalOpen(true);
                                            }} 
                                            className="w-full bg-gray-50 text-brand-green font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-brand-green hover:text-white transition-all shadow-sm border border-gray-100"
                                        >
                                            Explorar Detalhes
                                        </button>
                                    </div>
                                )}
                                {!personalizedTip && !isTipLoading && <p className="text-sm text-gray-400 font-medium py-12 text-center">IA preparando algo especial...</p>}
                             </motion.div>

                             {/* Card 2: Next Activity */}
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 border border-gray-50 flex flex-col relative"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-brand-sand"></div>
                                <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <Clock size={16} className="text-brand-sand"/>
                                    Seu Próximo Passo
                                </h3>
                                {nextItineraryItem ? (
                                    <div className="flex-grow flex flex-col">
                                        <div className="mb-8">
                                            <p className="text-xs font-black text-brand-sand uppercase tracking-widest mb-1">Início às {nextItineraryItem.time}</p>
                                            <p className="text-2xl font-black text-gray-800 leading-tight">{nextItineraryItem.title}</p>
                                        </div>
                                        <button onClick={() => setActiveTab('itinerary')} className="mt-auto w-full group flex items-center justify-between text-xs font-black uppercase tracking-widest text-gray-500 hover:text-brand-dark transition-colors">
                                            Roteiro Completo <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-grow flex flex-col items-center justify-center text-center py-6">
                                        <p className="text-sm text-gray-400 font-medium mb-8">Nenhuma atividade agendada para hoje.</p>
                                        <motion.button 
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setActiveTab('itinerary')} 
                                            className="w-full bg-brand-sand text-brand-dark font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-brand-sand/20"
                                        >
                                            Gerar com IA
                                        </motion.button>
                                    </div>
                                )}
                            </motion.div>
                            
                            {/* Card 3: Quick Access */}
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 border border-gray-50 flex flex-col relative"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-gray-200"></div>
                                <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <Smartphone size={16} className="text-gray-400"/>
                                    Acesso Rápido
                                </h3>
                                <div className="grid grid-cols-2 gap-4 flex-grow">
                                    {[
                                        { id: 'minhaEstadia', label: 'Quarto', icon: Key },
                                        { id: 'concierge', label: 'IA', icon: Bot },
                                        { id: 'chat', label: 'Chat', icon: MessageSquare },
                                        { id: 'explore', label: 'Explorar', icon: Map }
                                    ].map((action) => (
                                        <button 
                                            key={action.id}
                                            onClick={() => setActiveTab(action.id as any)}
                                            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 hover:bg-brand-green/5 hover:text-brand-green transition-all border border-gray-100 group"
                                        >
                                            <action.icon size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                         </div>

                         <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {/* Community Card */}
                            {latestPost && (
                                <motion.div 
                                    whileHover={{ y: -5 }}
                                    className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 border border-gray-50 flex flex-col"
                                >
                                    <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-8 flex items-center gap-3">
                                        <Users size={16} className="text-blue-400"/>
                                        Comunidade
                                    </h3>
                                    <div className="flex items-center gap-4 mb-6">
                                        <img src={latestPost.guestProfilePictureUrl || `https://i.pravatar.cc/150?u=${latestPost.guestId}`} alt={latestPost.guestName} className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-50 shadow-sm" />
                                        <div>
                                            <p className="font-black text-gray-900 tracking-tight">{latestPost.guestName}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(latestPost.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 font-medium leading-relaxed mb-8 line-clamp-2 italic">"{latestPost.text}"</p>
                                    <button onClick={() => setActiveTab('community')} className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors">
                                        Ver mural completo <ChevronRight size={14} />
                                    </button>
                                </motion.div>
                            )}

                             {/* Weather & Settings */}
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <motion.div 
                                    whileHover={{ y: -5 }}
                                    className="bg-gradient-to-br from-yellow-50 to-orange-50 p-8 rounded-3xl shadow-xl shadow-black/5 border border-yellow-100 flex flex-col items-center text-center justify-center relative overflow-hidden"
                                >
                                    <Sun size={24} className="absolute top-4 right-4 text-orange-200" />
                                    <weather.icon size={64} className="text-yellow-400 mb-4 animate-pulse"/>
                                    <p className="text-5xl font-black text-gray-900 mb-1">{weather.temp}°C</p>
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">{weather.condition}</p>
                                </motion.div>

                                <motion.div 
                                    whileHover={{ y: -5 }}
                                    className="bg-brand-sand/30 p-8 rounded-3xl shadow-xl shadow-black/5 border border-brand-sand/50 flex flex-col items-center text-center justify-center relative"
                                >
                                    <Award size={24} className="absolute top-4 right-4 text-brand-sand" />
                                    <p className="text-5xl font-black text-brand-dark mb-1">{currentUser.points || 0}</p>
                                    <p className="text-[10px] font-black text-brand-dark uppercase tracking-[0.2em] mb-6">Status {currentLoyaltyLevel?.name}</p>
                                    <button onClick={() => setActiveTab('rewards')} className="bg-brand-dark text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-brand-dark/20">
                                        Subir de Nível
                                    </button>
                                </motion.div>
                             </div>
                         </div>
                     </div>
                );
            }
            case 'minhaEstadia': {
                if (!activeBooking || !activeRoom || !activeProperty) {
                    return (
                        <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <AlertTriangle size={48} className="text-gray-300 mb-4" />
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Sem Reservas Ativas</h3>
                            <p className="text-gray-400 font-medium max-w-xs mt-2">Não encontramos nenhuma estadia em andamento para sua conta.</p>
                        </div>
                    );
                }

                const ToggleButton = ({ label, icon: Icon, active, onClick }: { label: string, icon: React.ElementType, active: boolean, onClick: () => void }) => (
                    <div className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-brand-green/30 transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-brand-green/10 text-brand-green' : 'bg-gray-100 text-gray-400'}`}>
                                <Icon size={20} />
                            </div>
                            <span className="font-black text-gray-900 text-xs uppercase tracking-widest">{label}</span>
                        </div>
                        <div onClick={onClick} className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-all ${active ? 'bg-brand-green shadow-lg shadow-brand-green/20' : 'bg-gray-200'}`}>
                            <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${active ? 'translate-x-6' : ''}`} />
                        </div>
                    </div>
                );

                return (
                    <div className="space-y-8 animate-fade-in pb-12">
                        {!activeBooking.rulesAcknowledged && (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-brand-dark p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-6 border border-white/10"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-brand-sand/20 rounded-2xl flex items-center justify-center text-brand-sand shrink-0">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white text-xs uppercase tracking-widest">Requisito de Hospedagem</h3>
                                        <p className="text-sm text-white/80 font-medium">Aceite as regras da casa para ativar todos os recursos do seu quarto.</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsRulesModalOpen(true)} className="bg-brand-sand text-brand-dark font-black py-4 px-8 rounded-2xl hover:bg-white transition-all text-xs uppercase tracking-widest shadow-lg shadow-brand-sand/10 w-full sm:w-auto">
                                    Revisar Termos
                                </button>
                            </motion.div>
                        )}
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-8">
                                {/* Digital Key Interactive Widget */}
                                <div className="bg-brand-dark p-8 rounded-[40px] shadow-2xl shadow-brand-dark/20 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
                                        <Key size={160} className="text-white" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-10">
                                            <div>
                                                <h3 className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Acesso Digital</h3>
                                                <p className="text-3xl font-black text-white tracking-tighter">Porta #{activeRoom.name}</p>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                                                <p className="text-[10px] font-black text-brand-green uppercase tracking-widest flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse" /> Bluetooth Ativo
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center justify-center py-10">
                                            <motion.button 
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => {
                                                    setNfcAnimationState('idle'); 
                                                    setIsNfcModalOpen(true);
                                                }}
                                                className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-green to-emerald-400 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)] group cursor-pointer border-8 border-white/10"
                                            >
                                                <Lock className="text-white group-hover:scale-110 transition-transform" size={40} />
                                            </motion.button>
                                            <p className="mt-8 text-white/60 text-[10px] font-black uppercase tracking-widest text-center">Toque para desbloquear</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Room Controls Card */}
                                <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-black/5 border border-gray-50">
                                    <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-8 flex items-center gap-3">
                                        <Key size={16} className="text-brand-green"/>
                                        Interface do Quarto: {activeRoom.name}
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <ToggleButton label="Não Perturbe" icon={BellOff} active={!!activeRoom.doNotDisturb} onClick={() => onUpdateRoomControls(activeRoom.id, { doNotDisturb: !activeRoom.doNotDisturb })} />
                                        <ToggleButton label="Luzes Principais" icon={Lightbulb} active={activeRoom.lightsOn} onClick={() => onUpdateRoomControls(activeRoom.id, { lightsOn: !activeRoom.lightsOn })} />
                                        
                                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-xl bg-gray-100 text-gray-400 group-hover:bg-brand-green/10 transition-colors`}>
                                                    <Wind size={20} />
                                                </div>
                                                <span className="font-black text-gray-900 text-xs uppercase tracking-widest">Ventilador</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm">
                                                {([0, 1, 2, 3] as const).map(speed => (
                                                    <button 
                                                        key={speed}
                                                        onClick={() => onUpdateRoomControls(activeRoom.id, { fanSpeed: speed })}
                                                        className={`w-10 h-10 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeRoom.fanSpeed === speed ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'text-gray-400 hover:bg-gray-50'}`}
                                                    >
                                                        {speed === 0 ? 'Off' : speed}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-100">
                                        <button onClick={() => setIsQrCodeModalOpen(true)} className="p-5 bg-gray-50 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-brand-green/5 hover:text-brand-green transition-all group">
                                            <QrCode size={24} className="group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">QR Access</span>
                                        </button>
                                        <button onClick={() => setIsNfcModalOpen(true)} className="p-5 bg-gray-50 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-brand-green/5 hover:text-brand-green transition-all group">
                                            <Smartphone size={24} className="group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">NFC Link</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Guest Info Card */}
                                <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-black/5 border border-gray-50 flex flex-col h-full">
                                    <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-10 flex items-center gap-3">
                                        <Wallet size={16} className="text-brand-green"/>
                                        Sua Reserva e Financeiro
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Wi-Fi Premium</p>
                                                <p className="font-black text-gray-900">{activeProperty.wifiNetwork}</p>
                                                <p className="font-bold text-gray-500 text-xs tracking-widest font-mono mt-1">{activeProperty.wifiPass}</p>
                                            </div>
                                            <button 
                                                onClick={() => { navigator.clipboard.writeText(activeProperty.wifiPass); setWifiCopied(true); setTimeout(() => setWifiCopied(false), 2000); }} 
                                                className="bg-white p-4 rounded-xl shadow-sm text-blue-500 hover:text-blue-600 transition-all border border-blue-100"
                                            >
                                                {wifiCopied ? <CheckCircle size={24} className="animate-bounce" /> : <Copy size={24} />}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-gray-50 rounded-2xl">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Check-in</p>
                                                <p className="font-black text-gray-900">{activeProperty.checkInTime}</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-2xl">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Check-out</p>
                                                <p className="font-black text-gray-900">{activeProperty.checkOutTime}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={handleContactReception} className="w-full mt-6 bg-brand-dark text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-gray-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3">
                                        <MessageCircleIcon size={18}/> Chat com Concierge
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Finance Card */}
                                <div className="bg-brand-dark p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Wallet size={120} className="text-white" />
                                    </div>
                                    <h3 className="font-black text-white/50 text-xs uppercase tracking-widest mb-10 flex items-center gap-3 relative z-10">
                                        <PiggyBank size={16} className="text-white/50"/>
                                        Fluxo Financeiro
                                    </h3>
                                    <div className="mb-10 relative z-10">
                                        <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-2">Saldo em Aberto</p>
                                        <p className={`text-6xl font-black font-serif ${activeBooking.balance > 0 ? 'text-brand-sand' : 'text-green-400'}`}>
                                            {activeBooking.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 relative z-10">
                                        <button onClick={() => setIsPayBalanceModalOpen(true)} className="bg-brand-green text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest hover:shadow-2xl hover:shadow-brand-green/20 transition-all flex items-center justify-center gap-2">
                                            Pagar Saldo <CreditCard size={14} />
                                        </button>
                                        <button onClick={handleOpenStatement} className="bg-white/10 text-white backdrop-blur-md font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">
                                            Extrato
                                        </button>
                                        <button onClick={() => setIsPreCheckoutModalOpen(true)} className="col-span-2 bg-white text-brand-dark font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-brand-sand transition-all shadow-xl">
                                            Saída Digital
                                        </button>
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-white/10 flex flex-col gap-2 relative z-10">
                                        <button 
                                            onClick={() => handleOpenDocument('agreement')} 
                                            disabled={isDocumentLoading}
                                            className="text-left text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isDocumentLoading ? <Loader2 size={10} className="animate-spin" /> : null}
                                            Contrato de Hospedagem
                                        </button>
                                        <button 
                                            onClick={() => handleOpenDocument('invoice')} 
                                            disabled={isDocumentLoading}
                                            className="text-left text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isDocumentLoading ? <Loader2 size={10} className="animate-spin" /> : null}
                                            Notas Fiscais & Recibos
                                        </button>
                                    </div>
                                </div>

                                {/* Services Card */}
                                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 border border-gray-50">
                                    <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-8 flex items-center gap-3">
                                        <Coffee size={16} className="text-brand-green"/>
                                        Serviços Exclusivos
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => setIsRoomServiceModalOpen(true)} className="p-6 bg-gray-50 rounded-2xl flex flex-col items-center gap-4 hover:bg-brand-green/5 hover:text-brand-green transition-all group">
                                            <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                                                <Utensils size={32} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-center">Room Service</span>
                                        </button>
                                        <button onClick={() => setIsServiceRequestModalOpen(true)} className="p-6 bg-gray-50 rounded-2xl flex flex-col items-center gap-4 hover:bg-brand-green/5 hover:text-brand-green transition-all group">
                                            <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                                                <Wrench size={32} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-center">Manutenção</span>
                                        </button>
                                    </div>
                                    
                                    <div className="mt-8 pt-8 border-t border-gray-100">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Prolongar sua experiência</h4>
                                        <div className="flex gap-3">
                                            <input type="date" value={newCheckOutDate} onChange={e => setNewCheckOutDate(e.target.value)} className="flex-grow p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all font-bold text-gray-700 text-sm"/>
                                            <motion.button 
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleCheckExtension} 
                                                disabled={isCheckingExtension || !newCheckOutDate} 
                                                className="bg-brand-dark text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                                            >
                                                Check
                                            </motion.button>
                                        </div>
                                        {isCheckingExtension && <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400"><Loader2 className="animate-spin" size={14}/> Validando disponibilidade...</div>}
                                        {extensionOffer && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={`mt-4 p-6 rounded-2xl border ${extensionOffer.available ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}
                                            >
                                                {extensionOffer.available ? (
                                                    <div className="text-center">
                                                        <p className="text-green-600 font-bold text-sm mb-4">Ótimas notícias! Conseguimos estender sua estadia.</p>
                                                        <p className="text-2xl font-black text-green-700 mb-6">{extensionOffer.extensionCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} <span className="text-xs uppercase tracking-widest opacity-60">adicionais</span></p>
                                                        <button onClick={handleConfirmExtension} disabled={isConfirmingExtension} className="w-full bg-green-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-green-200">
                                                            {isConfirmingExtension ? <Loader2 className="animate-spin mx-auto"/> : 'Confirmar Reserva'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-red-500 font-bold text-sm text-center">Infelizmente esta data não está disponível para o quarto atual.</p>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
            case 'areasComuns': {
                const tv = db.sharedSpaces.livingRoomTV;
                const playlist = db.sharedSpaces.commonAreaPlaylist;
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
                         {/* TV and Sound Card */}
                         <div className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 border border-gray-50 flex flex-col h-full">
                            <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-8 flex items-center gap-3">
                                <Tv size={16} className="text-brand-green"/>
                                Smart TV & Multimedia
                            </h3>
                            
                            <div className="space-y-6 flex-grow">
                                <div className="flex justify-between items-center p-6 bg-gray-50 rounded-2xl border border-gray-100 group transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl transition-colors ${tv.isOn ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <Power size={20} />
                                        </div>
                                        <div>
                                            <span className="font-black text-gray-900 text-xs uppercase tracking-widest block">Power Status</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tv.isOn ? 'Disponível' : 'Em espera'}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => onUpdateLivingRoomTV({ isOn: !tv.isOn })} className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-all ${tv.isOn ? 'bg-green-500' : 'bg-gray-200'}`}>
                                        <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${tv.isOn ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>

                                <div className={`space-y-6 transition-all ${!tv.isOn ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Controle de Volume</span>
                                            <span className="text-xs font-black text-gray-900">{tv.volume}%</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => onUpdateLivingRoomTV({ volume: Math.max(0, tv.volume - 5) })} className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center font-black">-</button>
                                            <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden relative">
                                                <div className="absolute top-0 left-0 h-full bg-brand-green" style={{ width: `${tv.volume}%` }}></div>
                                            </div>
                                            <button onClick={() => onUpdateLivingRoomTV({ volume: Math.min(100, tv.volume + 5) })} className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center font-black">+</button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Selecione o Conteúdo</span>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['Netflix', 'YouTube', 'TV Aberta'].map(app => (
                                                <button 
                                                    key={app}
                                                    onClick={() => onUpdateLivingRoomTV({ currentApp: app })}
                                                    className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${tv.currentApp === app ? 'bg-brand-dark text-white border-brand-dark shadow-xl' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-white'}`}
                                                >
                                                    {app}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                         </div>

                         {/* Jukebox Card */}
                         <div className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 border border-gray-50 flex flex-col h-full">
                            <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-8 flex items-center gap-3">
                                <Music size={16} className="text-purple-400"/>
                                Social Jukebox
                            </h3>

                            <div className="space-y-8 flex-grow">
                                {playlist.nowPlaying ? (
                                    <div className="p-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl shadow-xl text-white relative overflow-hidden group">
                                        <Music size={48} className="absolute -right-4 -bottom-4 text-white/20 rotate-12 group-hover:scale-110 transition-transform" />
                                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Tocando agora</p>
                                        <p className="text-xl font-black tracking-tight leading-tight">{playlist.nowPlaying.title}</p>
                                        <p className="text-xs font-bold text-white/80 mt-1">{playlist.nowPlaying.artist}</p>
                                    </div>
                                ) : (
                                    <div className="p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Silêncio no lounge...</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Próximas Escolhas</h4>
                                     <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {playlist.queue.sort((a,b) => b.votes.length - a.votes.length).map(song => (
                                            <div key={song.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 group">
                                                <div className="min-w-0">
                                                    <p className="font-black text-gray-900 text-xs truncate leading-tight">{song.title}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">por {song.addedByGuestName}</p>
                                                </div>
                                                <button 
                                                    onClick={() => onUpvoteSong(currentUser.id, song.id)} 
                                                    className={`h-10 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${song.votes.includes(currentUser.id) ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'bg-white shadow-sm border border-gray-100 hover:border-purple-300'}`}
                                                >
                                                    <ArrowUp size={14} className={song.votes.includes(currentUser.id) ? 'animate-bounce' : ''} /> {song.votes.length}
                                                </button>
                                            </div>
                                        ))}
                                     </div>
                                </div>
                            </div>
                            
                            <form onSubmit={handleAddSong} className="mt-8 flex gap-3">
                                <input 
                                    value={songSearch} 
                                    onChange={e => setSongSearch(e.target.value)} 
                                    type="text" 
                                    placeholder="Sua música favorita..." 
                                    className="flex-grow p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all font-bold text-gray-700 text-sm"
                                />
                                <button type="submit" className="w-14 h-14 bg-purple-500 text-white rounded-2xl flex items-center justify-center hover:bg-purple-600 transition-all shadow-lg shadow-purple-200">
                                    <Plus size={24} />
                                </button>
                            </form>
                         </div>

                         {/* Shared Spaces Status Card */}
                         <div className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 border border-gray-50 lg:col-span-2">
                             <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-8 flex items-center gap-3">
                                <ShieldCheck size={16} className="text-blue-400"/>
                                Status de Áreas Comuns
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className={`p-8 rounded-3xl flex flex-col items-center justify-center text-center transition-all ${db.sharedSpaces.kitchenCleanliness === 'ok' ? 'bg-green-50 border border-green-100' : 'bg-orange-50 border border-orange-100'}`}>
                                    {db.sharedSpaces.kitchenCleanliness === 'ok' ? (
                                        <>
                                            <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center text-green-500 mb-6">
                                                <Sparkles size={32} />
                                            </div>
                                            <h4 className="text-xl font-black text-gray-900 mb-2">Cozinha Brilhando</h4>
                                            <p className="text-xs font-medium text-gray-500 mb-8 max-w-xs">Todos estão colaborando! Aproveite o espaço organizado para suas refeições.</p>
                                            <button onClick={() => onUpdateKitchenStatus('needs_attention')} className="bg-white/50 text-orange-600 font-black py-4 px-8 rounded-2xl text-[10px] uppercase tracking-widest border border-orange-100 hover:bg-white transition-all">Reportar Sujeira</button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center text-orange-500 mb-6 font-black text-4xl">!</div>
                                            <h4 className="text-xl font-black text-gray-900 mb-2">Atenção Necessária</h4>
                                            <p className="text-xs font-medium text-gray-400 mb-8 max-w-xs">Nossa equipe já foi sinalizada. Em breve voltaremos ao normal.</p>
                                            <button onClick={() => onUpdateKitchenStatus('ok')} className="bg-brand-green text-white font-black py-4 px-8 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-brand-green/20">Tudo Limpo!</button>
                                        </>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-8 rounded-3xl flex flex-col justify-center">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Próximos Eventos do Hostel</h4>
                                    <div className="space-y-4">
                                        {[
                                            { time: '19:00', title: 'Sunset BBQ no Deck', color: 'bg-orange-500' },
                                            { time: '21:00', title: 'Karaoke & Drinks', color: 'bg-purple-500' }
                                        ].map((ev, i) => (
                                            <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                                <div className={`w-2 h-10 rounded-full ${ev.color}`}></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{ev.time}</p>
                                                    <p className="font-black text-gray-900 text-sm group-hover:text-brand-green transition-colors">{ev.title}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => setActiveTab('events')} className="mt-8 text-left text-[10px] font-black uppercase tracking-widest text-brand-green flex items-center gap-2">Explorar Calendário <ArrowLeft size={14} className="rotate-180" /></button>
                                </div>
                            </div>
                         </div>

                         {/* Guest-Facing Common Area Cameras */}
                         <div className="space-y-8">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-2 flex items-center gap-3">
                                        <Video size={16} className="text-brand-green"/>
                                        Espiada nas Áreas Comuns
                                    </h3>
                                    <p className="text-sm font-medium text-gray-400">Veja como está o movimento antes de descer!</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {db.cameras.filter(c => ['Recepção', 'Bar', 'Lounge', 'Piscina', 'Prainha'].some(loc => c.name.includes(loc) || c.location.includes(loc))).map(camera => (
                                    <motion.div 
                                        key={camera.id}
                                        whileHover={{ y: -5 }}
                                        className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-xl shadow-black/5"
                                    >
                                        <div className="relative aspect-video bg-gray-900 flex items-center justify-center group text-center p-4">
                                            <Video size={32} className="text-white/20 group-hover:scale-110 transition-transform mb-2" />
                                            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white">
                                                <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse" /> Ao Vivo
                                            </div>
                                            <div className="absolute bottom-4 left-4">
                                                <p className="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-md">{camera.name}</p>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                            <p className="text-white/40 text-[10px] uppercase font-bold tracking-tighter">Clique para abrir stream</p>
                                        </div>
                                        <div className="p-4 flex justify-between items-center bg-gray-50/50">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{camera.location}</span>
                                            <button className="text-[9px] font-black uppercase tracking-widest text-brand-green hover:text-brand-dark transition-colors">Ver Agora</button>
                                        </div>
                                    </motion.div>
                                ))}
                                {db.cameras.filter(c => ['Recepção', 'Bar', 'Lounge', 'Piscina', 'Prainha'].some(loc => c.name.includes(loc) || c.location.includes(loc))).length === 0 && (
                                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                                        <VideoOff className="mx-auto mb-4 text-gray-300" size={48} />
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Nenhuma câmera comum configurada.</p>
                                    </div>
                                )}
                            </div>
                         </div>
                    </div>
                );
            }
            case 'marketplace': {
                return (
                    <div className="space-y-16 pb-12 animate-fade-in">
                        <header className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Sparkles size={16} className="text-brand-green"/>
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em]">Marketplace de Experiências</h3>
                            </div>
                            <h2 className="text-5xl font-black text-gray-900 tracking-tighter max-w-2xl">Torne sua estadia inesquecível.</h2>
                            <p className="text-gray-400 font-medium text-lg max-w-xl">Curadoria exclusiva de tours, gastronomia e bem-estar selecionada pelo nosso time de local advisors.</p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {db.partnerServices.map(service => (
                                <motion.div 
                                    whileHover={{ y: -10 }}
                                    key={service.id} 
                                    className="bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-black/5 overflow-hidden flex flex-col group cursor-pointer"
                                    onClick={() => handleOpenPartnerServiceModal(service)}
                                >
                                    <div className="relative h-72 overflow-hidden">
                                        <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                        <div className="absolute top-6 right-6">
                                            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2">
                                                <Star size={14} className="text-yellow-400 fill-current" />
                                                <span className="text-xs font-black text-gray-900">4.9</span>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                                            <p className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Ver Detalhes do Parceiro</p>
                                        </div>
                                    </div>
                                    <div className="p-10 flex flex-col flex-grow">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-6 h-6 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                                                <Award size={12} />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-green">{service.partnerName}</p>
                                        </div>
                                        <h4 className="text-2xl font-black text-brand-dark tracking-tight mb-4 group-hover:text-brand-green transition-colors">{service.name}</h4>
                                        <p className="text-gray-400 font-medium text-sm leading-relaxed mb-8 line-clamp-3 italic">"{service.description}"</p>
                                        
                                        <div className="mt-auto pt-8 border-t border-gray-50 flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">A partir de</p>
                                                <p className="font-black text-2xl text-brand-dark">{service.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenPartnerServiceModal(service);
                                                }}
                                                className="bg-brand-dark text-white font-black py-4 px-8 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-brand-green transition-all shadow-xl shadow-black/10"
                                            >
                                                Reservar
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Special Banner */}
                        <div className="bg-brand-sand/30 rounded-[60px] p-16 flex flex-col md:flex-row items-center gap-12 border border-brand-sand/50">
                            <div className="flex-grow space-y-6">
                                <div className="inline-flex items-center gap-3 bg-brand-sand/50 px-4 py-2 rounded-full border border-brand-sand">
                                    <Sparkles size={16} className="text-brand-dark" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark">Oferta Exclusiva Guest</span>
                                </div>
                                <h3 className="text-4xl font-black text-brand-dark tracking-tighter">Day Trip: Mergulho & Picnic</h3>
                                <p className="text-brand-dark/60 font-medium text-lg leading-relaxed">Ganhe 15% de desconto e upgrade para picnic gourmet em roteiros agendados pelo portal.</p>
                                <button className="bg-brand-dark text-white font-black py-5 px-12 rounded-3xl text-sm uppercase tracking-widest hover:bg-gray-800 transition-all shadow-2xl shadow-brand-dark/20 text-[10px]">Ativar Desconto</button>
                            </div>
                            <div className="w-full md:w-1/2 aspect-video rounded-[40px] overflow-hidden shadow-2xl ring-8 ring-white/20">
                                <img src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                );
            }
            case 'community': {
                return (
                    <div className="space-y-12 pb-12">
                         {/* Stories Bar */}
                         <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-2">
                             <button 
                                 onClick={() => setIsNewStoryModalOpen(true)}
                                 className="flex flex-col items-center gap-2 flex-shrink-0 group"
                             >
                                 <div className="relative">
                                     <img src={currentUser.profilePictureUrl || `https://i.pravatar.cc/100?u=${currentUser.id}`} className="w-16 h-16 rounded-full border-2 border-brand-green group-hover:scale-105 transition-transform object-cover p-1" />
                                     <div className="absolute bottom-0 right-0 bg-brand-green text-white rounded-full p-1 border-2 border-white shadow-sm">
                                         <Plus size={12} strokeWidth={4} />
                                     </div>
                                 </div>
                                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sua História</span>
                             </button>

                             {/* Group stories by guest */}
                             {Object.entries(
                                 db.guestStories.reduce((acc, story) => {
                                     if (!acc[story.guestId]) acc[story.guestId] = [];
                                     acc[story.guestId].push(story);
                                     return acc;
                                 }, {} as Record<string, typeof db.guestStories>)
                             ).map(([guestId, stories]) => {
                                 const guest = db.guests.find(g => g.id === guestId);
                                 const hasUnseen = (stories as GuestStory[]).some(s => !s.viewers.includes(currentUser.id));
                                 return (
                                     <button 
                                         key={guestId}
                                         onClick={() => setSelectedStory({ guestId, storyIndex: 0 })}
                                         className="flex flex-col items-center gap-2 flex-shrink-0 group"
                                     >
                                         <div className={`p-1 rounded-full border-2 ${hasUnseen ? 'border-brand-green' : 'border-gray-200'} group-hover:scale-105 transition-transform`}>
                                             <img src={guest?.profilePictureUrl || `https://i.pravatar.cc/100?u=${guestId}`} className="w-14 h-14 rounded-full border-2 border-white object-cover" />
                                         </div>
                                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{(guest?.fullName || 'Visitante').split(' ')[0]}</span>
                                     </button>
                                 );
                             })}
                         </div>

                         {/* Navigation for Community */}
                         <div className="flex items-center justify-between bg-gray-50/50 p-2 rounded-[32px] border border-gray-100">
                            <div className="flex gap-1">
                                {[
                                    { id: 'feed', label: 'Feed', icon: LayoutGrid },
                                    { id: 'people', label: 'Pessoas', icon: UsersIcon },
                                    { id: 'activities', label: 'Atividades', icon: Megaphone }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setCommunityView(tab.id as any)}
                                        className={`px-6 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${communityView === tab.id ? 'bg-white text-brand-dark shadow-xl shadow-black/5' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <tab.icon size={16} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {communityView === 'feed' && (
                                <div className="flex gap-1 bg-white/50 p-1 rounded-xl border border-gray-100 mr-2">
                                    <button 
                                        onClick={() => setCommunityLayout('list')}
                                        className={`p-2 rounded-lg transition-all ${communityLayout === 'list' ? 'bg-white text-brand-dark shadow-sm ring-1 ring-black/5' : 'text-gray-400'}`}
                                    >
                                        <List size={18} />
                                    </button>
                                    <button 
                                        onClick={() => setCommunityLayout('grid')}
                                        className={`p-2 rounded-lg transition-all ${communityLayout === 'grid' ? 'bg-white text-brand-dark shadow-sm ring-1 ring-black/5' : 'text-gray-400'}`}
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                </div>
                            )}
                         </div>

                         {communityView === 'feed' && (
                             <div className="max-w-2xl mx-auto space-y-10">
                                {communityLayout === 'list' ? (
                                    <>
                                <motion.div 
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => setIsNewPostModalOpen(true)}
                                    className="bg-white p-6 rounded-[40px] shadow-xl shadow-black/5 border border-gray-50 flex items-center gap-6 cursor-pointer group"
                                >
                                    <img src={currentUser.profilePictureUrl || `https://i.pravatar.cc/100?u=${currentUser.id}`} className="w-12 h-12 rounded-full border-2 border-white shadow-md" />
                                    <div className="flex-grow bg-gray-50 rounded-2xl px-6 py-4 text-gray-400 font-medium text-sm group-hover:bg-gray-100 transition-colors">
                                        No que você está pensando, {(currentUser.fullName || 'Hóspede').split(' ')[0]}?
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center">
                                            <ImageIcon size={20} />
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-500 flex items-center justify-center">
                                            <Video size={20} />
                                        </div>
                                    </div>
                                </motion.div>

                                <div className="space-y-10">
                                    {db.guestPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((post, idx) => {
                                        const isLiked = post.likes.includes(currentUser.id);
                                        const postGuest = db.guests.find(g => g.id === post.guestId);
                                        return (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                key={post.id} 
                                                className="bg-white rounded-[48px] shadow-2xl shadow-black/5 border border-gray-50 overflow-hidden"
                                            >
                                                <div className="p-8 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <img src={postGuest?.profilePictureUrl || `https://i.pravatar.cc/100?u=${post.guestId}`} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-brand-green ring-offset-2" />
                                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-gray-900 tracking-tight">{post.guestName}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(post.timestamp).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <button className="text-gray-400 hover:text-gray-600 p-2"><MoreHorizontal size={20} /></button>
                                                </div>

                                                {(post.mediaUrl || post.imageUrl) && (
                                                    <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden relative group">
                                                        <MediaContent 
                                                            url={post.mediaUrl || post.imageUrl} 
                                                            type={post.mediaType} 
                                                            className="w-full h-full"
                                                        />
                                                        {post.mediaType === 'video' && (
                                                            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-xl text-white">
                                                                <Video size={16} />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="p-8 space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-6">
                                                            <button 
                                                                onClick={() => onTogglePostLike(post.id, currentUser.id)}
                                                                className={`flex items-center gap-2 group ${isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'} transition-all`}
                                                            >
                                                                <motion.div whileTap={{ scale: 1.5 }}>
                                                                    <Heart size={26} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "drop-shadow-lg" : ""} />
                                                                </motion.div>
                                                                <span className="text-xs font-black">{post.likes.length}</span>
                                                            </button>
                                                            <button className="flex items-center gap-2 text-gray-400 hover:text-brand-green group transition-all">
                                                                <MessageCircle size={26} />
                                                                <span className="text-xs font-black">{post.comments.length}</span>
                                                            </button>
                                                            <button className="text-gray-400 hover:text-blue-500 transition-all">
                                                                <Send size={24} />
                                                            </button>
                                                        </div>
                                                        <button className="text-gray-400 hover:text-orange-500 transition-all">
                                                            <Bookmark size={24} />
                                                        </button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <p className="text-gray-800 text-sm leading-relaxed">
                                                            <span className="font-black mr-2">{(post.guestName || '').split(' ')[0]}</span>
                                                            {post.content}
                                                        </p>

                                                        {post.comments.length > 0 && (
                                                            <div className="space-y-3 pt-4 border-t border-gray-50">
                                                                {post.comments.slice(0, 2).map((comment, cidx) => (
                                                                    <div key={comment.id} className="text-xs flex items-start gap-2">
                                                                        <span className="font-black text-gray-900 shrink-0">{(comment.guestName || '').split(' ')[0]}</span>
                                                                        <span className="text-gray-600 line-clamp-2">{comment.text}</span>
                                                                    </div>
                                                                ))}
                                                                {post.comments.length > 2 && (
                                                                    <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-brand-green transition-colors">Ver todos os {post.comments.length} comentários</button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                                                        <img src={currentUser.profilePictureUrl || `https://i.pravatar.cc/100?u=${currentUser.id}`} className="w-8 h-8 rounded-full border border-gray-100" />
                                                        <div className="flex-grow flex items-center gap-2">
                                                            <input 
                                                                type="text" 
                                                                value={commentInputs[post.id] || ''}
                                                                onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                                placeholder="Adicione um comentário..." 
                                                                className="flex-grow text-xs font-medium border-none focus:ring-0 placeholder-gray-300 p-0"
                                                            />
                                                            {(commentInputs[post.id] || '').trim() && (
                                                                <button 
                                                                    onClick={() => {
                                                                        onAddPostComment(post.id, currentUser.id, commentInputs[post.id]);
                                                                        setCommentInputs(prev => ({ ...prev, [post.id]: '' }));
                                                                    }}
                                                                    className="text-brand-green text-[10px] font-black uppercase tracking-widest"
                                                                >
                                                                    Postar
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                </>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1 lg:gap-2">
                                        {db.guestPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((post, idx) => {
                                            const isLiked = post.likes.includes(currentUser.id);
                                            return (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    key={post.id} 
                                                    className="aspect-square relative group cursor-pointer overflow-hidden rounded-lg md:rounded-2xl"
                                                    onClick={() => { /* Open post detail modal */ }}
                                                >
                                                    <MediaContent 
                                                        url={post.mediaUrl || post.imageUrl} 
                                                        type={post.mediaType} 
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-black text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <HeartIcon size={18} fill="currentColor" />
                                                            {post.likes.length}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <MessageSquare size={18} fill="none" />
                                                            {post.comments.length}
                                                        </div>
                                                    </div>
                                                    {post.mediaType === 'video' && (
                                                        <div className="absolute top-2 right-2 text-white opacity-80">
                                                            <Video size={16} />
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                             </div>
                         )}

                         {communityView === 'people' && (
                             <div className="bg-white p-12 rounded-[40px] shadow-xl shadow-black/5 border border-gray-50 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                    <Users2 size={200} className="text-brand-green" />
                                </div>
                                <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-12 flex items-center gap-3 relative z-10">
                                    <UsersIcon size={16} className="text-brand-green"/>
                                    Pessoas Maravilhosas na Casa
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-10 relative z-10">
                                    {db.guests.filter(g => g.id !== currentUser.id).map(guest => (
                                        <motion.div 
                                            whileHover={{ y: -8 }}
                                            key={guest.id} 
                                            className="flex flex-col items-center group cursor-pointer"
                                            onClick={() => handleViewProfile(guest.id)}
                                        >
                                            <div className="relative mb-4">
                                                <div className="absolute inset-0 bg-brand-green rounded-[24px] blur-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                                <img 
                                                    src={guest.profilePictureUrl || `https://i.pravatar.cc/150?u=${guest.id}`} 
                                                    alt={guest.fullName} 
                                                    className="w-20 h-20 rounded-[28px] object-cover ring-2 ring-gray-100 group-hover:ring-brand-green transition-all shadow-xl relative z-10" 
                                                />
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full z-20"></div>
                                            </div>
                                            <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest text-center truncate w-full mb-1">{(guest.fullName || 'Visitante').split(' ')[0]}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">{(guest as any).loyaltyLevel || 'Viajante'}</p>
                                        </motion.div>
                                    ))}
                                </div>

                                {icebreakerSuggestions && (icebreakerSuggestions.suggestions || []).length > 0 && (
                                     <div className="mt-16 pt-12 border-t border-gray-50 relative z-10">
                                         <div className="flex items-center gap-3 mb-8">
                                            <div className="w-8 h-8 rounded-xl bg-brand-sand/30 flex items-center justify-center text-brand-dark">
                                                <Sparkles size={16}/>
                                            </div>
                                            <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">Sugestões de Amizade (IA)</h4>
                                         </div>
                                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                             {icebreakerSuggestions.suggestions.map(s => {
                                                 const targetGuest = db.guests.find(g => g.id === s.guestId);
                                                 return (
                                                     <motion.button 
                                                        whileHover={{ x: 5 }}
                                                        key={s.guestId} 
                                                        disabled={!targetGuest}
                                                        onClick={() => handleStartChat(targetGuest)}
                                                        className="bg-gray-50/50 text-gray-700 p-6 rounded-[32px] text-[11px] font-bold text-left hover:bg-white hover:shadow-xl transition-all flex items-center gap-5 border border-gray-100 disabled:opacity-50"
                                                     >
                                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                                                            <MessageSquare size={16} className="text-brand-green" />
                                                        </div>
                                                        <span className="flex-grow leading-relaxed italic">"{s.suggestion}"</span>
                                                     </motion.button>
                                                 );
                                             })}
                                         </div>
                                     </div>
                                )}
                             </div>
                         )}

                         {communityView === 'activities' && (
                             <div className="space-y-12">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-brand-dark p-12 rounded-[50px] shadow-2xl shadow-black/20 relative overflow-hidden">
                                    <div className="absolute bottom-0 right-0 p-12 opacity-5 pointer-events-none">
                                        <Megaphone size={250} className="text-white" />
                                    </div>
                                    <div className="relative z-10 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-brand-sand/20 flex items-center justify-center text-brand-sand">
                                                <UsersIcon size={20} />
                                            </div>
                                            <h3 className="text-xs font-black text-brand-sand uppercase tracking-[0.3em]">Co-experiências</h3>
                                        </div>
                                        <h2 className="text-4xl font-black text-white tracking-tighter max-w-lg">Crie momentos, convide novos amigos.</h2>
                                        <p className="text-brand-sand/60 font-medium text-lg leading-relaxed max-w-md">Propõe uma atividade, divida os custos ou apenas curta em grupo.</p>
                                    </div>
                                    <button 
                                        onClick={() => handleOpenActivityModal(null)} 
                                        className="relative z-10 bg-brand-sand text-brand-dark font-black py-6 px-12 rounded-[24px] text-sm uppercase tracking-widest flex items-center gap-4 hover:bg-white transition-all shadow-2xl shadow-black/20"
                                    >
                                        <Plus size={20} /> Criar Minha Atividade
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {(db.guestActivities || []).map(activity => {
                                        const participants = (db.activityParticipants || []).filter(p => p.activityId === activity.id);
                                        const isParticipant = participants.some(p => p.guestId === currentUser.id);
                                        const isCreator = activity.creatorId === currentUser.id;
                                        const totalContributed = (db.activityContributions || [])
                                               .filter(c => c.activityId === activity.id)
                                               .reduce((sum, c) => sum + c.amount, 0);
                                        const progressPercentage = activity.crowdfundingTarget ? (totalContributed / activity.crowdfundingTarget) * 100 : 0;

                                        return (
                                            <motion.div 
                                                whileHover={{ y: -10 }}
                                                key={activity.id} 
                                                className="bg-white rounded-[40px] shadow-xl shadow-black/5 border border-gray-50 overflow-hidden flex flex-col group"
                                            >
                                                <div className="p-10 pb-0">
                                                    <div className="flex justify-between items-start mb-8">
                                                        <div className="flex items-center gap-4">
                                                            <img src={`https://i.pravatar.cc/100?u=${activity.creatorId}`} className="w-14 h-14 rounded-2xl object-cover ring-4 ring-gray-50" />
                                                            <div>
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Inspirado por {(activity.creatorName || '').split(' ')[0]}</p>
                                                                <h4 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-brand-green transition-colors">{activity.title}</h4>
                                                            </div>
                                                        </div>
                                                        {isCreator && (
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handleOpenActivityModal(activity)} className="p-3 text-gray-300 hover:text-brand-dark hover:bg-gray-50 rounded-xl transition-all"><Edit size={18}/></button>
                                                                <button onClick={() => onDeleteGuestActivity(activity.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8 italic">"{activity.description}"</p>
                                                    
                                                    <div className="flex flex-wrap gap-4 mb-10">
                                                        <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100">
                                                            <Calendar size={16} className="text-brand-green" />
                                                            <span className="text-[11px] font-black uppercase text-gray-700 tracking-widest">{new Date(activity.date).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100">
                                                            <Clock size={16} className="text-brand-green" />
                                                            <span className="text-[11px] font-black uppercase text-gray-700 tracking-widest">{new Date(activity.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</span>
                                                        </div>
                                                    </div>

                                                    {activity.crowdfundingTarget && (
                                                        <div className="mb-10 p-6 bg-brand-sand/10 rounded-3xl border border-brand-sand/20 relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                                <PiggyBank size={60} className="text-brand-dark" />
                                                            </div>
                                                            <div className="flex justify-between items-center mb-4 relative z-10">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-brand-dark shadow-sm">
                                                                        <Target size={16} />
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Meta Solidária</span>
                                                                </div>
                                                                <span className="text-lg font-black text-brand-dark">
                                                                    {Math.round(progressPercentage)}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-white/40 rounded-full h-3 mb-4 relative z-10 overflow-hidden shadow-inner">
                                                                <motion.div 
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${progressPercentage}%` }}
                                                                    className="bg-brand-dark h-full rounded-full shadow-lg"
                                                                ></motion.div>
                                                            </div>
                                                            <div className="flex justify-between items-center relative z-10">
                                                                <p className="text-[11px] font-black text-brand-dark uppercase tracking-widest">
                                                                    Acumulado: {totalContributed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                </p>
                                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                                    Alvo: {activity.crowdfundingTarget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-auto p-10 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex -space-x-3">
                                                            {participants.slice(0, 3).map(p => {
                                                                const guest = db.guests.find(g => g.id === p.guestId);
                                                                return <img key={p.guestId} src={guest?.profilePictureUrl || `https://i.pravatar.cc/150?u=${p.guestId}`} alt={p.guestName} className="w-12 h-12 rounded-2xl border-4 border-white object-cover shadow-xl" title={p.guestName} />;
                                                            })}
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{participants.length} Confirmados</p>
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Junte-se a nós!</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex gap-3 w-full sm:w-auto">
                                                        {!isCreator && (isParticipant ? 
                                                            <button 
                                                                onClick={() => { setSubmit(`leave-${activity.id}`, true); onLeaveGuestActivity(activity.id, currentUser.id).finally(() => setSubmit(`leave-${activity.id}`, false)) }} 
                                                                disabled={isSubmitting(`leave-${activity.id}`)} 
                                                                className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all border border-red-100 bg-white shadow-xl shadow-red-100/20"
                                                            >
                                                                {isSubmitting(`leave-${activity.id}`) ? <Loader2 size={18} className="animate-spin"/> : 'Desistir'}
                                                            </button> :
                                                            <button 
                                                                onClick={() => { setSubmit(`join-${activity.id}`, true); onJoinGuestActivity(activity.id, currentUser.id, currentUser.fullName).finally(() => setSubmit(`join-${activity.id}`, false)) }} 
                                                                disabled={isSubmitting(`join-${activity.id}`)} 
                                                                className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-brand-green text-white hover:bg-brand-dark transition-all shadow-2xl shadow-brand-green/30"
                                                            >
                                                                {isSubmitting(`join-${activity.id}`) ? <Loader2 size={18} className="animate-spin"/> : 'Garantir Vaga'}
                                                            </button>
                                                        )}
                                                        {activity.crowdfundingTarget && !isCreator && (
                                                            <button onClick={() => handleOpenContributionModal(activity)} className="h-14 w-14 flex items-center justify-center rounded-2xl bg-brand-sand text-brand-dark hover:bg-white transition-all shadow-xl shadow-brand-sand/20 border border-brand-sand/30">
                                                                <PiggyBank size={24}/>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                             </div>
                         )}
                    </div>
                );
            }
            case 'mural': {
                 const statusClasses = {
                    lost: 'bg-red-50 text-red-600 border-red-100',
                    found: 'bg-green-50 text-green-600 border-green-100',
                    claimed: 'bg-gray-100 text-gray-400 border-gray-200 grayscale',
                };
                 return (
                    <div className="space-y-10 pb-12">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Mural da Casa</h2>
                                <p className="text-sm font-medium text-gray-400">Achados & Perdidos e Classificados entre hóspedes.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <div className="flex bg-gray-50 p-1.5 rounded-2xl">
                                    <button 
                                        onClick={() => setMuralTab('lostfound')} 
                                        className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${muralTab === 'lostfound' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Achados & Perdidos
                                    </button>
                                    <button 
                                        onClick={() => setMuralTab('classifieds')} 
                                        className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${muralTab === 'classifieds' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Classificados
                                    </button>
                                </div>
                                <button 
                                    onClick={() => muralTab === 'lostfound' ? setIsLostFoundModalOpen(true) : setIsClassifiedsModalOpen(true)} 
                                    className="bg-brand-dark text-white font-black py-4 px-8 rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-gray-800 transition-all shadow-xl shadow-black/10 justify-center group"
                                >
                                    <Plus size={16} className="group-hover:rotate-90 transition-transform" /> 
                                    {muralTab === 'lostfound' ? 'Reportar Item' : 'Novo Anúncio'}
                                </button>
                            </div>
                        </div>

                        {muralTab === 'lostfound' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {(db.lostAndFoundItems || []).map((item, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ y: -5 }}
                                        key={item.id} 
                                        className={`group rounded-[32px] border transition-all overflow-hidden bg-white shadow-xl shadow-black/5 ${item.status === 'claimed' ? 'opacity-60 grayscale' : 'border-gray-50'}`}
                                    >
                                        <div className="relative h-60 overflow-hidden">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.itemName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                                            ) : (
                                                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200">
                                                    <Box size={64} strokeWidth={1} />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border backdrop-blur-md shadow-lg ${statusClasses[item.status]}`}>
                                                    {item.status === 'lost' ? 'Perdido' : item.status === 'found' ? 'Encontrado' : 'Reivindicado'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-8">
                                            <h4 className="text-xl font-black text-gray-900 tracking-tight mb-3">{item.itemName}</h4>
                                            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6 line-clamp-2 italic">"{item.description}"</p>
                                            
                                            <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                                    <MapPin size={14} className="text-brand-green" />
                                                </div>
                                                {item.locationFoundOrLost}
                                            </div>

                                            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <img src={`https://i.pravatar.cc/100?u=${item.guestId}`} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{(item.guestName || '').split(' ')[0]}</p>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Hóspede</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {item.status === 'found' && item.guestId !== currentUser.id && (
                                                        <button 
                                                            onClick={() => onClaimFoundItem(item.id, currentUser.id)} 
                                                            className="bg-brand-green text-white text-[10px] font-black uppercase tracking-widest py-3 px-6 rounded-xl hover:bg-brand-dark transition-all shadow-lg shadow-brand-green/20"
                                                        >
                                                            Reivindicar
                                                        </button>
                                                    )}
                                                     {item.guestId === currentUser.id && item.status !== 'claimed' && (
                                                        <button onClick={() => onDeleteLostAndFoundItem(item.id, currentUser.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                            <Trash2 size={18}/>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                             </div>
                        )}

                        {muralTab === 'classifieds' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {(db.classifiedsItems || []).filter(i => i.status === 'active').map((item, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ y: -5 }}
                                        key={item.id} 
                                        className="bg-white rounded-[32px] border border-gray-50 flex flex-col overflow-hidden shadow-xl shadow-black/5 group"
                                    >
                                        <div className="relative h-60 overflow-hidden">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                                            ) : (
                                                <div className="w-full h-full bg-brand-sand/10 flex items-center justify-center text-brand-sand">
                                                    <ShoppingCart size={64} strokeWidth={1} />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl bg-white/80 backdrop-blur-md text-brand-dark border border-white/50 shadow-lg">
                                                    {item.category}
                                                </span>
                                            </div>
                                            <div className="absolute bottom-4 right-4 animate-bounce-slow">
                                                <div className="bg-brand-green text-white px-5 py-2 rounded-2xl shadow-xl border border-white/20">
                                                    <p className="text-lg font-black">{item.price > 0 ? item.price.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : 'Grátis'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-8 flex-grow flex flex-col">
                                            <h4 className="text-xl font-black text-gray-900 tracking-tight mb-3">{item.title}</h4>
                                            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8 line-clamp-3">"{item.description}"</p>
                                            
                                            <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <img src={`https://i.pravatar.cc/100?u=${item.guestId}`} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{(item.guestName || '').split(' ')[0]}</p>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{new Date().toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {item.guestId !== currentUser.id ? (
                                                        <button 
                                                            onClick={() => handleContactSeller(item.guestId)} 
                                                            className="bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest py-3 px-6 rounded-xl hover:bg-brand-green transition-all shadow-xl shadow-black/10"
                                                        >
                                                            Interessado
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => onDeleteClassifiedsItem(item.id, currentUser.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                            <Trash2 size={18}/>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            }
            case 'chat': {
                 return (
                    <div className="flex h-[calc(100vh-180px)] bg-white rounded-[40px] shadow-2xl shadow-black/10 border border-gray-50 overflow-hidden">
                        {/* Conversations Sidebar */}
                        <aside className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/30 backdrop-blur-sm">
                            <div className="p-8 border-b border-gray-100/50 bg-white/50">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Mensagens</h3>
                                    <div className="bg-brand-green/10 text-brand-green p-1.5 rounded-lg">
                                        <MessageSquare size={16} />
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Concierge & Hóspedes</p>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                <motion.button 
                                    whileHover={{ x: 5 }}
                                    onClick={async () => { const c = await onStartReceptionChat(currentUser.id, currentUser.fullName); setActiveChatId(c.id); }} 
                                    className={`w-full text-left p-5 rounded-3xl transition-all flex items-center gap-4 group ${activeChatId === 'reception' ? 'bg-brand-dark text-white shadow-2xl shadow-black/20 scale-[1.02]' : 'hover:bg-white text-gray-600 shadow-sm border border-transparent hover:border-gray-100'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${activeChatId === 'reception' ? 'bg-white/10' : 'bg-brand-dark text-white group-hover:scale-110 transition-transform'}`}>
                                        <Shield size={24} className={activeChatId === 'reception' ? 'text-brand-sand' : 'text-white'} />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-[11px] font-black uppercase tracking-widest">Recepção</p>
                                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                                        </div>
                                        <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest truncate">Atendimento 24h disponível</p>
                                    </div>
                                </motion.button>
                                
                                <div className="pt-6 pb-2">
                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] px-4">Conversas Recentes</p>
                                </div>

                                {chatData.conversations.filter(c => c.participants?.some(p => p.guestId === currentUser.id) || db.guestActivities.find(a => a.id === c.activityId)?.creatorId === currentUser.id || db.activityParticipants.some(p => p.activityId === c.activityId && p.guestId === currentUser.id)).map(c => {
                                    const otherParticipant = c.participants?.find(p => p.guestId !== currentUser.id);
                                    const title = c.isGroupChat ? c.guestName : otherParticipant?.guestName || c.guestName;
                                    const isActive = activeChatId === c.id;
                                    const lastMessage = c.messages ? c.messages[c.messages.length - 1] : null;
                                    
                                    return (
                                        <motion.button 
                                            whileHover={{ x: 5 }}
                                            key={c.id} 
                                            onClick={() => setActiveChatId(c.id)} 
                                            className={`w-full text-left p-5 rounded-3xl transition-all flex items-center gap-4 group ${isActive ? 'bg-brand-green text-white shadow-2xl shadow-brand-green/20 scale-[1.02]' : 'hover:bg-white text-gray-600 shadow-sm border border-transparent hover:border-gray-100'}`}
                                        >
                                            <div className="relative shrink-0">
                                                <img src={`https://i.pravatar.cc/150?u=${c.id}`} className="w-12 h-12 rounded-2xl object-cover shadow-md group-hover:rotate-3 transition-transform" />
                                                {isActive && (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                                                        <div className="w-2 h-2 bg-brand-green rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-[11px] font-black uppercase tracking-widest truncate max-w-[120px]">{title}</p>
                                                    <span className="text-[8px] font-bold opacity-50">{lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                                                </div>
                                                <p className="text-[9px] font-medium opacity-60 truncate">
                                                    {lastMessage ? lastMessage.text : 'Nenhuma mensagem ainda'}
                                                </p>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                                
                                {chatData.conversations.length === 0 && (
                                    <div className="text-center py-10 px-6">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Nenhuma conversa encontrada</p>
                                    </div>
                                )}
                            </div>
                        </aside>

                        {/* Chat Area */}
                        <main className="flex-grow flex flex-col bg-white overflow-hidden relative">
                            {activeChatId ? (
                                <>
                                    {/* Chat Header */}
                                    <header className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center p-0.5 shadow-sm">
                                                <img src={`https://i.pravatar.cc/150?u=${activeChatId}`} className="w-full h-full rounded-[14px] object-cover" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-gray-900 tracking-tight">
                                                    {chatData.conversations.find(c => c.id === activeChatId)?.isGroupChat 
                                                        ? chatData.conversations.find(c => c.id === activeChatId)?.guestName 
                                                        : (chatData.conversations.find(c => c.id === activeChatId)?.participants?.find(p => p.guestId !== currentUser.id)?.guestName || chatData.conversations.find(c => c.id === activeChatId)?.guestName || 'Recepção')}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Online agora</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="p-3 text-gray-400 hover:text-brand-dark hover:bg-gray-50 rounded-xl transition-all">
                                                <Phone size={18} />
                                            </button>
                                            <button className="p-3 text-gray-400 hover:text-brand-dark hover:bg-gray-50 rounded-xl transition-all">
                                                <Video size={18} />
                                            </button>
                                            <button className="p-3 text-gray-400 hover:text-brand-dark hover:bg-gray-50 rounded-xl transition-all">
                                                <Info size={18} />
                                            </button>
                                        </div>
                                    </header>

                                    {/* Messages List */}
                                    <div className="flex-grow overflow-y-auto p-8 space-y-8 custom-scrollbar bg-gray-50/20">
                                        {chatData.messages.filter(m => m.conversationId === activeChatId).map((msg, idx) => {
                                            const isMe = msg.senderId === currentUser.id;
                                            return (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ duration: 0.4 }}
                                                    key={idx} 
                                                    className={`flex ${isMe ? 'justify-end' : 'justify-start md:gap-4'}`}
                                                >
                                                    {!isMe && (
                                                        <img src={`https://i.pravatar.cc/100?u=${msg.senderId}`} className="hidden md:block w-9 h-9 rounded-xl mt-auto object-cover border-2 border-white shadow-md" />
                                                    )}
                                                    <div className={`max-w-[75%] ${isMe ? 'order-1' : 'order-2'}`}>
                                                        <div className={`p-4 rounded-[24px] shadow-sm relative group overflow-hidden ${isMe ? 'bg-brand-dark text-white rounded-tr-none shadow-black/10' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                                                            {isMe && <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />}
                                                            <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                                        </div>
                                                        <p className={`text-[8px] font-black uppercase tracking-widest mt-2 px-2 opacity-40 ${isMe ? 'text-right' : 'text-left'}`}>
                                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • Visto
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                        <div ref={chatMessagesEndRef} />
                                    </div>

                                    {/* Chat Input */}
                                    <footer className="p-8 bg-white border-t border-gray-100">
                                        <form 
                                            onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
                                            className="flex items-center gap-4 bg-gray-50 p-2 rounded-[24px] border border-gray-100 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-green/10 transition-all"
                                        >
                                            <button type="button" className="p-3 text-gray-400 hover:text-brand-green hover:bg-white rounded-xl transition-all">
                                                <Paperclip size={18} />
                                            </button>
                                            <input 
                                                type="text" 
                                                value={chatMessageInput} 
                                                onChange={e => setChatMessageInput(e.target.value)} 
                                                placeholder="Sua mensagem aqui..." 
                                                className="flex-grow bg-transparent border-none focus:ring-0 text-sm font-medium placeholder-gray-300"
                                            />
                                            <button type="button" className="p-3 text-gray-400 hover:text-gray-600 transition-colors">
                                                <Smile size={18} />
                                            </button>
                                            <motion.button 
                                                whileTap={{ scale: 0.9 }}
                                                type="submit"
                                                className="bg-brand-dark hover:bg-brand-green text-white w-12 h-12 rounded-xl shadow-xl shadow-black/10 transition-all flex items-center justify-center group"
                                            >
                                                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            </motion.button>
                                        </form>
                                    </footer>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-40 px-12">
                                    <div className="w-24 h-24 bg-gray-50 rounded-[35px] flex items-center justify-center text-gray-300 shadow-inner">
                                        <MessageSquare size={48} strokeWidth={1} />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Escolha uma conversa</p>
                                        <p className="text-xs font-medium text-gray-400 max-w-xs mx-auto">Conecte-se com nossa equipe ou outros hóspedes para compartilhar experiências.</p>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>
                );
            }
            case 'explore': {
                return (
                    <div className="space-y-16 pb-12">
                        {Object.entries(db.localGuideTips.reduce((acc, tip) => {
                            (acc[tip.category] = acc[tip.category] || []).push(tip);
                            return acc;
                        }, {} as Record<string, LocalGuideTip[]>)).map(([category, tips]) => (
                            <div key={category} className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em]">{category}</h3>
                                    <div className="h-px bg-gray-100 flex-grow"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {(tips as any[]).map((tip: LocalGuideTip) => {
                                        const isInItinerary = currentUser.itinerary?.some(item => item.sourceId === tip.id && item.type === 'tip');
                                        const id = `fav-${tip.id}`;
                                        return (
                                            <motion.div 
                                                whileHover={{ y: -5 }}
                                                key={tip.id} 
                                                className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-gray-50 overflow-hidden flex flex-col group cursor-pointer"
                                            >
                                                <div className="relative h-56 overflow-hidden">
                                                    <img src={tip.imageUrl} alt={tip.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    <div className="absolute top-4 right-4 flex gap-2">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setSubmit(id, true); onToggleFavoriteTip(currentUser.id, tip.id).finally(() => setSubmit(id, false)) }} 
                                                            className={`w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg transition-all ${currentUser.favoriteTipIds?.includes(tip.id) ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
                                                        >
                                                            {isSubmitting(id) ? <Loader2 size={16} className="animate-spin"/> : <Heart size={18} fill={currentUser.favoriteTipIds?.includes(tip.id) ? "currentColor" : "none"} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-8 flex-grow flex flex-col">
                                                    <h4 className="text-xl font-black text-gray-900 tracking-tight mb-2 uppercase">{tip.title}</h4>
                                                    <p className="text-gray-500 font-medium text-xs leading-relaxed mb-6 line-clamp-3">{tip.description}</p>
                                                    
                                                    <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between items-center">
                                                        <div className="flex gap-2">
                                                            {tip.location && (
                                                                <button onClick={(e) => { e.stopPropagation(); handleOpenMap([tip.location!]) }} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-brand-dark hover:text-white transition-all flex items-center justify-center">
                                                                    <MapPin size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleAddToItinerary(tip.id, 'tip', tip.title) }} 
                                                            disabled={isInItinerary || isSubmitting(`itinerary-${tip.id}`)} 
                                                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isInItinerary ? 'bg-gray-100 text-gray-400' : 'bg-brand-sand text-brand-dark hover:bg-brand-dark hover:text-white shadow-lg shadow-brand-sand/20'}`}
                                                        >
                                                            {isSubmitting(`itinerary-${tip.id}`) ? <Loader2 size={14} className="animate-spin" /> : (isInItinerary ? 'No Roteiro' : 'Adicionar ao Roteiro')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }
            case 'events': {
                return (
                    <div className="space-y-12">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                            <div>
                                <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-2 flex items-center gap-3">
                                    <Calendar size={16} className="text-brand-green"/>
                                    Eventos Forest House
                                </h3>
                                <p className="text-sm font-medium text-gray-400">Momentos compartilhados que transformam hóspedes em amigos.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {db.propertyEvents.map(event => {
                                const participants = db.eventParticipants.filter(p => p.eventId === event.id);
                                const isAttending = participants.some(p => p.guestId === currentUser.id);
                                 const isInItinerary = currentUser.itinerary?.some(item => item.sourceId === event.id && item.type === 'event');
                                 const id = `rsvp-${event.id}`;
                                return (
                                    <motion.div 
                                        whileHover={{ y: -5 }}
                                        key={event.id} 
                                        className="bg-white rounded-[40px] shadow-xl shadow-black/5 border border-gray-50 flex flex-col md:flex-row overflow-hidden group"
                                    >
                                        <div className="md:w-2/5 relative h-64 md:h-auto overflow-hidden">
                                            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl flex flex-col items-center min-w-[70px]">
                                                <span className="text-2xl font-black text-gray-900 leading-none">{new Date(event.date).getDate()}</span>
                                                <span className="text-[10px] font-black uppercase text-brand-green tracking-widest">{new Date(event.date).toLocaleDateString('pt-BR', {month: 'short'})}</span>
                                            </div>
                                        </div>
                                        <div className="p-10 md:w-3/5 flex flex-col">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Clock size={14} className="text-gray-400" />
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{event.time}</span>
                                                    </div>
                                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{event.title}</h3>
                                                </div>
                                            </div>
                                            
                                            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8 flex-grow">{event.description}</p>
                                            
                                            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-auto pt-8 border-t border-gray-50">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex -space-x-3">
                                                        {participants.slice(0, 3).map(p => (
                                                            <img key={p.guestId} src={db.guests.find(g => g.id === p.guestId)?.profilePictureUrl || `https://i.pravatar.cc/150?u=${p.guestId}`} className="w-10 h-10 rounded-full border-2 border-white object-cover" title={p.guestName}/>
                                                        ))}
                                                    </div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        {participants.length} Confirmados
                                                    </p>
                                                </div>
                                                
                                                <div className="flex gap-2 w-full sm:w-auto">
                                                    {event.location && (
                                                        <button onClick={() => handleOpenMap([event.location!])} className="w-12 h-12 rounded-xl bg-gray-50 text-gray-400 hover:bg-brand-dark hover:text-white transition-all flex items-center justify-center shrink-0">
                                                            <MapPin size={20} />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleAddToItinerary(event.id, 'event', event.title)} 
                                                        disabled={isInItinerary || isSubmitting(`itinerary-${event.id}`)} 
                                                        className={`h-12 px-6 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all w-full sm:w-auto ${isInItinerary ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600 hover:bg-brand-dark hover:text-white'}`}
                                                    >
                                                         {isSubmitting(`itinerary-${event.id}`) ? <Loader2 size={16} className="animate-spin" /> : (isInItinerary ? 'No Roteiro' : 'Salvar')}
                                                    </button>
                                                    <button 
                                                        onClick={() => { setSubmit(id, true); (isAttending ? onCancelRsvpFromEvent(event.id, currentUser.id) : onRsvpToEvent(event.id, currentUser.id, currentUser.fullName)).finally(() => setSubmit(id, false)); }}
                                                        disabled={isSubmitting(id)}
                                                        className={`h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center transition-all w-full sm:w-auto shadow-xl ${isAttending ? 'bg-red-50 text-red-500 shadow-red-100' : 'bg-brand-green text-white shadow-brand-green/20'}`}
                                                    >
                                                        {isSubmitting(id) ? <Loader2 size={16} className="animate-spin" /> : (isAttending ? 'Sair' : 'Participar')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                );
            }
            case 'itinerary': {
                const itineraryByDate = (currentUser.itinerary || []).reduce((acc, item) => {
                    const dateKey = item.date.split('T')[0];
                    (acc[dateKey] = acc[dateKey] || []).push(item);
                    return acc;
                }, {} as Record<string, ItineraryItem[]>);
            
                const getSource = (item: ItineraryItem) => {
                    return item.type === 'tip'
                        ? db.localGuideTips.find(t => t.id === item.sourceId)
                        : db.propertyEvents.find(e => e.id === item.sourceId);
                };
 
                const getIconForItem = (item: ItineraryItem) => {
                    const source = getSource(item);
                    const iconName = source?.icon;
                    const iconMap: { [key: string]: React.ElementType } = {
                        'Waves': Waves, 'Sun': Sun, 'Mountain': Mountain, 'UtensilsCrossed': UtensilsCrossed,
                        'Users': Users, 'Music': Music, 'Leaf': Leaf, 'Coffee': Coffee, 'Default': MapPin,
                    };
                    const IconComponent = (iconName && iconMap[iconName]) ? iconMap[iconName] : iconMap['Default'];
                    return <IconComponent size={20} className="text-white" />;
                };
            
                return (
                    <div className="space-y-12">
                        <div className="bg-brand-dark rounded-[40px] p-12 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                                <Route size={200} />
                            </div>
                            <div className="relative z-10 max-w-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <Sparkles size={24} className="text-brand-sand" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-brand-sand">Seu Roteiro IA</h3>
                                </div>
                                <h2 className="text-4xl font-black tracking-tight mb-4">Experiência Personalizada</h2>
                                <p className="text-brand-sand/60 font-medium mb-12 italic">"O luxo está na personalização. Deixe nossa inteligência artificial desenhar o dia perfeito com base nos seus interesses."</p>
                                
                                <motion.button 
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleGenerateItineraryClick} 
                                    disabled={isSubmitting('generate-itinerary')} 
                                    className="bg-brand-sand text-brand-dark font-black py-4 px-8 rounded-2xl flex items-center gap-4 transition-all hover:bg-white disabled:opacity-50 shadow-xl shadow-brand-sand/10"
                                >
                                    {isSubmitting('generate-itinerary') ? <Loader2 className="animate-spin" /> : <><Sparkles size={20} /> Atualizar Meu Roteiro</>}
                                </motion.button>
                            </div>
                        </div>
                        
                        {Object.keys(itineraryByDate).length === 0 && !isSubmitting('generate-itinerary') && (
                            <div className="text-center py-24">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-200">
                                    <Route size={48} />
                                </div>
                                <h4 className="text-xl font-black text-gray-900 mb-2">Sua jornada começa aqui.</h4>
                                <p className="text-gray-400 font-medium text-sm">Adicione itens ao roteiro ou deixe nossa IA te surpreender.</p>
                            </div>
                        )}
                        
                        {Object.entries(itineraryByDate).sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime()).map(([date, items]) => {
                            const locations = (items as any[]).map(item => getSource(item)?.location).filter(Boolean) as string[];
                            return (
                                <div key={date} className="space-y-8">
                                    <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-8 rounded-[30px] border border-gray-50 shadow-sm gap-6">
                                        <div>
                                            <p className="text-[10px] font-black text-brand-green uppercase tracking-[0.2em] mb-1">{new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' })}</p>
                                            <h4 className="text-2xl font-black text-gray-900 tracking-tight">{new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', timeZone: 'UTC' })}</h4>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => handleOpenMap(locations)} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-600 hover:bg-brand-dark hover:text-white transition-all flex items-center gap-3">
                                                <MapPin size={16}/> Mapa do Dia
                                            </button>
                                            <button onClick={() => handleClearDayItinerary(date)} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all" disabled={isSubmitting(`clear-itinerary-${date}`)}>
                                                {isSubmitting(`clear-itinerary-${date}`) ? <Loader2 size={16} className="animate-spin"/> : 'Reiniciar'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4 ml-4 sm:ml-12 border-l-2 border-dashed border-gray-100 pl-8 pb-8">
                                        {(items as any[]).map((item, idx) => {
                                            const source = getSource(item);
                                            return (
                                                <motion.div 
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    key={item.id} 
                                                    className="group relative"
                                                >
                                                    <div className="absolute -left-[45px] top-4 w-8 h-8 rounded-full bg-brand-dark flex items-center justify-center shadow-lg shadow-black/20 z-10 group-hover:scale-110 transition-transform">
                                                        {getIconForItem(item)}
                                                    </div>
                                                    <div className="bg-white p-8 rounded-3xl border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all flex flex-col sm:flex-row items-center gap-8 group cursor-pointer" onClick={() => handleOpenItineraryDetail(item)}>
                                                        {source?.imageUrl && (
                                                            <div className="w-full sm:w-32 h-24 rounded-2xl overflow-hidden shrink-0">
                                                                <img src={source.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                            </div>
                                                        )}
                                                        <div className="flex-grow">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-brand-green bg-brand-green/10 px-2 py-1 rounded-md">{item.type === 'tip' ? 'Sugestão' : 'Evento'}</span>
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{source?.time || 'Todo o dia'}</span>
                                                            </div>
                                                            <h5 className="text-lg font-black text-gray-900 tracking-tight mb-2 uppercase">{item.title}</h5>
                                                            <p className="text-gray-400 font-medium text-xs italic">"{item.justification}"</p>
                                                        </div>
                                                        <div className="shrink-0">
                                                            <ChevronRight size={20} className="text-gray-200 group-hover:text-brand-dark transition-all translate-x-0 group-hover:translate-x-2" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            }
            case 'concierge': {
                return (
                    <div className="flex flex-col h-full bg-white rounded-[40px] shadow-2xl shadow-black/5 overflow-hidden border border-gray-50">
                        <header className="px-12 py-8 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-brand-dark rounded-2xl flex items-center justify-center text-brand-sand shadow-xl shadow-black/20">
                                    <Bot size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Seu Concierge Pessoal</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Sempre Disponível</p>
                                    </div>
                                </div>
                            </div>
                        </header>
                        
                        <main className="flex-grow px-12 py-8 overflow-y-auto space-y-8 bg-gray-50/10">
                            {(currentUser.conciergeChatHistory || []).map(msg => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={msg.id} 
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-2xl p-6 rounded-[28px] text-sm font-medium leading-relaxed ${msg.sender === 'user' ? 'bg-brand-dark text-white rounded-br-none shadow-xl shadow-black/10' : 'bg-white text-gray-700 rounded-bl-none shadow-sm border border-gray-100'}`}>
                                        {msg.isLoading ? <Loader2 size={24} className="animate-spin text-brand-green" /> : <p className="whitespace-pre-wrap">{msg.text}</p>}
                                    </div>
                                </motion.div>
                            ))}
                             <div ref={chatMessagesEndRef} />
                        </main>
                        
                        <footer className="px-12 py-10 bg-white border-t border-gray-50">
                            <form onSubmit={(e) => { e.preventDefault(); handleSendConciergeMessage(); }} className="flex gap-4 p-3 bg-gray-50 rounded-3xl border border-gray-100 focus-within:bg-white focus-within:ring-8 focus-within:ring-brand-green/5 focus-within:border-brand-green transition-all">
                                <input 
                                    value={conciergeInput} 
                                    onChange={e => setConciergeInput(e.target.value)} 
                                    type="text" 
                                    placeholder="Como posso tornar sua estadia extraordinária?" 
                                    className="flex-grow bg-transparent border-none outline-none px-6 py-2 font-bold text-gray-700 text-sm placeholder:text-gray-400" 
                                    disabled={isConciergeLoading}
                                />
                                <motion.button 
                                    whileTap={{ scale: 0.95 }}
                                    type="submit" 
                                    className="w-14 h-14 bg-brand-green text-white rounded-2xl flex items-center justify-center hover:bg-green-600 transition-all shadow-xl shadow-brand-green/20" 
                                    disabled={isConciergeLoading || !conciergeInput.trim()}
                                >
                                    <Send size={24}/>
                                </motion.button>
                            </form>
                        </footer>
                    </div>
                )
            }
            case 'rewards': {
                const nextLevel = db.loyaltyLevels.find(l => (currentUser.points || 0) < l.minPoints);

                return (
                    <div className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 bg-brand-dark rounded-[40px] p-12 text-white overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                    <Star size={200} />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="font-black text-brand-sand text-xs uppercase tracking-[0.3em] mb-8">Clube de Fidelidade Forest</h3>
                                    <div className="flex flex-col sm:flex-row items-end gap-12 mb-12">
                                        <div className="shrink-0 text-center sm:text-left">
                                            <p className="text-7xl font-black text-white leading-none mb-2">{currentUser.points || 0}</p>
                                            <p className="text-[10px] font-black uppercase text-brand-sand tracking-widest">Pontos Acumulados</p>
                                        </div>
                                        <div className="flex-grow w-full">
                                            <div className="flex justify-between items-end mb-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-brand-sand/60 mb-1">Nível Atual</p>
                                                    <span className="text-2xl font-black tracking-tight uppercase">{currentLoyaltyLevel.name}</span>
                                                </div>
                                                {nextLevel && (
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black uppercase text-brand-sand/60 mb-1">Próximo Objetivo</p>
                                                        <span className="text-sm font-black tracking-tight uppercase text-brand-sand">{nextLevel.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden p-1">
                                                {nextLevel ? (
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${((currentUser.points || 0) - currentLoyaltyLevel.minPoints) / (nextLevel.minPoints - currentLoyaltyLevel.minPoints) * 100}%` }}
                                                        className="bg-brand-sand h-full rounded-full shadow-lg shadow-brand-sand/20"
                                                    ></motion.div>
                                                ) : (
                                                    <div className="bg-brand-sand h-full rounded-full w-full"></div>
                                                )}
                                            </div>
                                            {nextLevel && (
                                                <p className="text-[10px] font-black text-brand-sand/60 mt-4 uppercase tracking-widest text-center">
                                                    Você está a {nextLevel.minPoints - (currentUser.points || 0)} pontos do próximo nível de privilégios.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-12 border-t border-white/5">
                                        {(currentLoyaltyLevel.perks || []).map((perk, i) => (
                                            <div key={i} className="flex flex-col gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-brand-sand/10 flex items-center justify-center text-brand-sand">
                                                    <Check size={16} />
                                                </div>
                                                <p className="text-[10px] font-black uppercase text-brand-sand tracking-widest leading-normal">{perk}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                             <motion.div 
                                whileHover={{ y: -5 }}
                                className="bg-white p-12 rounded-[40px] shadow-xl shadow-black/5 border border-gray-50 flex flex-col"
                             >
                                 <h3 className="font-black text-gray-900 text-xs uppercase tracking-[0.3em] mb-8">Leaderboard Hóspedes</h3>
                                 <div className="space-y-6">
                                    {leaderboardGuests.slice(0, 3).map((guest, index) => (
                                        <div key={guest.id} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${guest.id === currentUser.id ? 'bg-brand-green/10 border border-brand-green/20' : 'hover:bg-gray-50'}`}>
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-gray-400">
                                                {index + 1}
                                            </div>
                                            <div className="flex-grow">
                                                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{(guest.fullName || 'Visitante').split(' ')[0]}</p>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{getLoyaltyLevelForPoints(guest.points || 0).name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-brand-green">{guest.weeklyPoints || 0}</p>
                                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">PTS / SEMANA</p>
                                            </div>
                                        </div>
                                    ))}
                                 </div>
                                 <button className="mt-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-brand-dark transition-all">Ver Ranking Completo</button>
                            </motion.div>
                        </div>
                        
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em]">Recompensas Disponíveis</h3>
                                <div className="h-px bg-gray-100 flex-grow"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {db.rewards.map(reward => {
                                    const canRedeem = (currentUser.points || 0) >= reward.cost;
                                    return (
                                        <motion.div 
                                            whileHover={canRedeem ? { y: -5 } : {}}
                                            key={reward.id} 
                                            className={`bg-white p-8 rounded-[30px] border border-gray-50 shadow-sm flex flex-col group ${!canRedeem ? 'opacity-50 grayscale' : 'hover:shadow-xl hover:shadow-black/5'}`}
                                        >
                                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mb-6 group-hover:bg-brand-sand group-hover:text-brand-dark transition-all">
                                                <Gift size={28}/>
                                            </div>
                                            <h4 className="text-lg font-black text-gray-900 tracking-tight uppercase mb-2">{reward.name}</h4>
                                            <p className="text-gray-400 font-medium text-xs leading-relaxed mb-8 flex-grow">{reward.description}</p>
                                            <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                                                <div>
                                                    <p className="text-xl font-black text-brand-green">{reward.cost}</p>
                                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Pontos Necessários</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleRedeem(reward)} 
                                                    disabled={!canRedeem || isSubmitting(`reward-${reward.id}`)} 
                                                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${canRedeem ? 'bg-brand-dark text-white hover:bg-brand-green shadow-lg shadow-black/10' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    {isSubmitting(`reward-${reward.id}`) ? <Loader2 size={16} className="animate-spin"/> : 'Resgatar'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                        
                        <div className="space-y-8">
                             <div className="flex items-center gap-4">
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em]">Conquistas Forest</h3>
                                <div className="h-px bg-gray-100 flex-grow"></div>
                            </div>
                             <div className="flex flex-wrap gap-6">
                                {db.achievements.map(ach => {
                                    const isUnlocked = (currentUser.unlockedAchievements || []).includes(ach.id);
                                    const Icon = allIcons[ach.icon as keyof typeof allIcons] || StarIcon;
                                    return (
                                         <motion.div 
                                            whileHover={{ scale: 1.05 }}
                                            key={ach.id} 
                                            className={`relative group text-center p-6 w-40 rounded-[30px] border transition-all ${isUnlocked ? 'bg-white border-brand-sand shadow-lg shadow-brand-sand/10' : 'bg-gray-50/50 border-gray-100 opacity-40 grayscale'}`}
                                         >
                                            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 transition-all ${isUnlocked ? 'bg-brand-sand text-brand-dark' : 'bg-gray-100 text-gray-400'}`}>
                                                <Icon size={32}/>
                                            </div>
                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-tight">{ach.name}</p>
                                            {isUnlocked && (
                                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-green text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                                    <Check size={14} />
                                                </div>
                                            )}
                                         </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                );
            }
            case 'settings': {
                return (
                    <div className="max-w-4xl space-y-12 pb-12">
                        <div className="flex items-center gap-8 bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm">
                            <div className="relative group">
                                <img src={currentUser.profilePictureUrl || `https://i.pravatar.cc/150?u=${currentUser.id}`} className="w-32 h-32 rounded-[32px] object-cover shadow-2xl shadow-black/10 group-hover:scale-105 transition-transform" />
                                <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-green text-white rounded-xl flex items-center justify-center border-4 border-white shadow-xl hover:bg-brand-dark transition-all">
                                    <Camera size={18} />
                                </button>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2 uppercase">{currentUser.fullName}</h3>
                                <p className="text-gray-400 font-medium text-sm mb-4">{currentUser.email}</p>
                                <div className="flex gap-2">
                                    <span className="text-[10px] font-black text-brand-green bg-brand-green/10 px-3 py-1 rounded-full uppercase tracking-widest">Hóspede {currentLoyaltyLevel.name}</span>
                                    <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-widest">Desde {new Date().getFullYear()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm space-y-8">
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em]">Preferências de Estadia</h4>
                                <div className="space-y-6">
                                    <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Alergias Alimentares</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['Glúten', 'Lactose', 'Amendoim', 'Frutos do Mar'].map(tag => (
                                                <button key={tag} className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-[10px] font-black text-gray-600 uppercase tracking-widest hover:border-brand-green hover:text-brand-green transition-all">{tag}</button>
                                            ))}
                                            <button className="px-4 py-2 rounded-xl bg-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-brand-dark hover:text-white transition-all">+</button>
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Modo Não Perturbe Padrão</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ativar automaticamente após às 22h</p>
                                        </div>
                                        <div className="w-12 h-6 bg-gray-200 rounded-full relative p-1 transition-all"><div className="w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Experiência Tropical</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Interface com cores inspiradas na natureza</p>
                                        </div>
                                        <div className="w-12 h-6 bg-brand-green rounded-full relative p-1 transition-all"><div className="w-4 h-4 bg-white rounded-full shadow-sm translate-x-6"></div></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm space-y-8">
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em]">Segurança & Conta</h4>
                                <div className="space-y-4">
                                    <button className="w-full text-left p-6 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-between group hover:bg-brand-dark hover:text-white transition-all">
                                        <div className="flex items-center gap-4">
                                            <Shield size={20} className="text-gray-400 group-hover:text-brand-sand transition-all" />
                                            <div>
                                                <p className="text-sm font-black uppercase tracking-tight">Alterar Senha</p>
                                                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Última alteração há 3 meses</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} />
                                    </button>
                                    <button className="w-full text-left p-6 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-between group hover:bg-brand-dark hover:text-white transition-all">
                                        <div className="flex items-center gap-4">
                                            <Mail size={20} className="text-gray-400 group-hover:text-brand-sand transition-all" />
                                            <div>
                                                <p className="text-sm font-black uppercase tracking-tight">E-mail de Notificações</p>
                                                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">{currentUser.email}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} />
                                    </button>
                                    <div className="pt-8">
                                        <button onClick={logout} className="w-full p-6 bg-red-50 text-red-500 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-100">Encerrar Sessão</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
        }
    };

    return (
    <div data-theme={theme} className="bg-[var(--portal-bg)] text-[var(--portal-text)] min-h-screen font-sans pb-16 md:pb-0">
        <ThemeStyle themeSettings={guestPortalSettings} />
        <div className="flex h-screen">
            {/* Sidebar */}
            <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 overflow-y-auto shadow-2xl shadow-black/5 z-20">
                <div className="p-8 flex flex-col items-center">
                    <div className="relative group mb-4">
                        <div className="absolute inset-0 bg-brand-green/20 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                        <img 
                            src={currentUser.profilePictureUrl || `https://i.pravatar.cc/150?u=${currentUser.id}`} 
                            alt={currentUser.fullName} 
                            className="w-24 h-24 rounded-full relative z-10 object-cover ring-4 ring-white shadow-lg" 
                        />
                        <div className="absolute -bottom-2 -right-2 bg-brand-sand text-brand-dark text-[10px] font-black px-3 py-1 rounded-full shadow-sm z-20 border border-white">
                            {currentLoyaltyLevel?.name}
                        </div>
                    </div>
                    <h2 className="font-black text-gray-900 text-lg uppercase tracking-tight text-center leading-tight">{currentUser.fullName}</h2>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <Star size={10} className="text-brand-sand" fill="currentColor"/> {currentUser.points || 0} Pontos
                    </div>
                </div>

                <nav className="flex-grow py-2">
                    {tabs.map(tab => (
                        <TabButton
                            key={tab.id}
                            label={tab.label}
                            icon={tab.icon}
                            active={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            hasNotification={tab.notification}
                        />
                    ))}
                </nav>

                <div className="p-6 mt-auto border-t border-gray-50 flex flex-col gap-2">
                    <button 
                        onClick={() => setPage('home')}
                        className="w-full flex items-center gap-3 px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-brand-green hover:bg-gray-50 rounded-xl transition-all"
                    >
                        <Home size={18} />
                        <span>Voltar ao Site</span>
                    </button>
                    <button 
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-5 py-3 text-xs font-black uppercase tracking-widest text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <LogOut size={18} />
                        <span>Sair da Conta</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col overflow-hidden">
                <header className="flex justify-between items-center mb-6 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="md:hidden">
                            <img src={currentUser.profilePictureUrl || `https://i.pravatar.cc/150?u=${currentUser.id}`} alt={currentUser.fullName} className="w-10 h-10 rounded-full object-cover" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">{activeTabInfo?.label}</h1>
                    </div>
                    <div className="relative" ref={notificationRef}>
                        <button onClick={() => setIsNotificationOpen(p => !p)} className="relative p-2 rounded-full hover:bg-black/10">
                            <Bell size={24} />
                            {unreadNotifications.length > 0 && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-[var(--portal-bg)]"></span>}
                        </button>
                        {isNotificationOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-[var(--portal-card-bg)] rounded-lg shadow-lg border border-black/10 z-10">
                                <div className="p-3 font-bold border-b">Notificações</div>
                                <div className="max-h-80 overflow-y-auto">
                                    {guestNotifications.map(n => (
                                        <div key={n.id} className={`p-3 border-b text-sm ${!n.read ? 'bg-blue-500/10' : ''}`}>
                                            <p className="font-semibold">{n.title}</p>
                                            <p>{n.message}</p>
                                            {!n.read && <button onClick={() => onMarkNotificationAsRead(currentUser.id, n.id)} className="text-xs text-blue-500 hover:underline mt-1">Marcar como lida</button>}
                                        </div>
                                    ))}
                                     {guestNotifications.length === 0 && <p className="text-center text-sm p-4 text-gray-500">Nenhuma notificação.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </header>
                <div className="flex-grow overflow-y-auto">
                    {renderTabContent()}
                </div>
            </main>
        </div>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
            <div className="bg-brand-dark/95 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-black/40 border border-white/10 grid grid-cols-6 p-2 ring-1 ring-white/5">
                <TabButton label="Início" icon={Home} active={activeTab === 'inicio'} onClick={() => setActiveTab('inicio')} isMobile />
                <TabButton label="Estadia" icon={Key} active={activeTab === 'minhaEstadia'} onClick={() => setActiveTab('minhaEstadia')} isMobile />
                <TabButton label="Comunidade" icon={Users2} active={activeTab === 'community'} onClick={() => setActiveTab('community')} isMobile />
                <TabButton label="Chat" icon={MessageCircleIcon} active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} isMobile hasNotification={hasUnreadChat}/>
                <TabButton label="Mural" icon={Newspaper} active={activeTab === 'mural'} onClick={() => setActiveTab('mural')} isMobile />
                <TabButton label="Mais" icon={Menu} active={isMoreMenuOpen} onClick={() => setIsMoreMenuOpen(true)} isMobile />
            </div>
        </div>
        
        {/* Modals */}
        <PortalModal isOpen={isMoreMenuOpen} onClose={() => setIsMoreMenuOpen(false)} title="Explorar Forest House" size="full">
            <div className="flex flex-col h-full bg-white px-6 py-8">
                <div className="text-center mb-10">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-2">Menu Completo</p>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">O que você busca?</h2>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-auto">
                    {tabs.map(tab => (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setIsMoreMenuOpen(false);
                            }}
                            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-[28px] transition-all border ${activeTab === tab.id ? 'bg-brand-dark text-white shadow-xl border-transparent' : 'bg-gray-50 text-gray-400 border-gray-100/50 hover:bg-white hover:shadow-lg hover:text-brand-dark'}`}
                        >
                            <div className={`p-3 rounded-2xl ${activeTab === tab.id ? 'bg-white/10 text-white' : 'bg-white text-gray-400 shadow-sm'}`}>
                                <tab.icon size={22} />
                            </div>
                            <span className="font-black text-[9px] uppercase tracking-widest text-center leading-tight">{tab.label}</span>
                        </motion.button>
                    ))}
                </div>

                <div className="mt-12 space-y-4">
                    <motion.button 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setPage('home'); setIsMoreMenuOpen(false); }}
                        className="w-full flex items-center justify-between p-6 bg-gray-50 rounded-[28px] group transition-all hover:bg-brand-sand/10"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-dark group-hover:scale-110 transition-transform">
                                <Home size={18}/>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Voltar ao Site</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Página Institucional</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                    </motion.button>

                    <button 
                        onClick={() => { logout(); setIsMoreMenuOpen(false); }}
                        className="w-full p-6 text-red-500 font-black text-[10px] uppercase tracking-[0.3em] bg-red-50 rounded-[28px] hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                        Encerrar Sessão
                    </button>
                </div>
            </div>
        </PortalModal>
         <PortalModal isOpen={isServiceRequestModalOpen} onClose={() => setIsServiceRequestModalOpen(false)} title="Solicitar Serviço">
            <form onSubmit={handleRequestServiceSubmit} className="space-y-8 py-4">
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tipo de Serviço</label>
                        <select value={serviceRequestDetails.type} onChange={e => setServiceRequestDetails({...serviceRequestDetails, type: e.target.value as any})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all font-bold text-gray-700 text-sm">
                            <option>Limpeza</option>
                            <option>Manutenção</option>
                            <option>Lavanderia</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Detalhes (opcional)</label>
                        <textarea value={serviceRequestDetails.details} onChange={e => setServiceRequestDetails({...serviceRequestDetails, details: e.target.value})} placeholder="Ex: Chuveiro não esquenta." className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all font-bold text-gray-700 text-sm" rows={4}></textarea>
                    </div>
                    <button type="submit" disabled={isSubmitting('request-service')} className="w-full bg-brand-dark text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3">
                        {isSubmitting('request-service') ? <Loader2 className="animate-spin" size={18}/> : (
                            <>Enviar Solicitação <ChevronRight size={16}/></>
                        )}
                    </button>
                </div>
            </form>
         </PortalModal>
        <PortalModal isOpen={isRoomServiceModalOpen} onClose={() => setIsRoomServiceModalOpen(false)} title="Serviço de Quarto">
             <div className="space-y-4">
                                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {/* Categories */}
                                    {Array.from(new Set(db.products.filter(p => !p.category || p.category.includes('Comida') || p.category.includes('Bebida') || p.category.includes('Quarto')).map(p => p.category || 'Geral'))).map(cat => (
                                        <div key={cat} className="space-y-3">
                                            <h5 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{cat}</h5>
                                            <div className="grid grid-cols-1 gap-3">
                                                {db.products.filter(p => (p.category || 'Geral') === cat).map(product => (
                                                    <div key={product.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-lg transition-all group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-dark group-hover:bg-brand-sand transition-all">
                                                                <Utensils size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{product.name}</p>
                                                                <p className="text-[10px] font-black text-brand-green uppercase tracking-widest">{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => addToCart(product)} 
                                                            className="p-3 bg-white text-brand-dark rounded-xl shadow-sm border border-gray-100 hover:bg-brand-dark hover:text-white transition-all"
                                                        >
                                                            <Plus size={18}/>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                {cartTotal > 0 && (
                    <div className="pt-4 border-t">
                        <h4 className="font-bold mb-2">Seu Pedido:</h4>
                        <div className="space-y-1 text-sm">
                            {roomServiceCart.map(item => (
                                <div key={item.productId} className="flex justify-between">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span>{(item.unitPrice * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                            <span>Total:</span>
                            <span>{cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">O valor será adicionado à conta do seu quarto.</p>
                        <button onClick={handlePlaceOrder} disabled={isSubmitting('place-order')} className="w-full mt-4 bg-[var(--portal-primary)] text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2">
                            {isSubmitting('place-order') ? <Loader2 className="animate-spin"/> : 'Fazer Pedido'}
                        </button>
                    </div>
                )}
            </div>
        </PortalModal>
        <PortalModal isOpen={isGuestProfileModalOpen} onClose={() => setIsGuestProfileModalOpen(false)} title={`Perfil de ${(selectedGuestProfile?.fullName || 'Visitante').split(' ')[0]}`}>
            {selectedGuestProfile && (
                <div className="text-center">
                    <img src={selectedGuestProfile.profilePictureUrl || `https://i.pravatar.cc/150?u=${selectedGuestProfile.id}`} alt={selectedGuestProfile.fullName} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
                    <p className="text-sm text-gray-600 italic mb-4">"{selectedGuestProfile.bio || 'Ainda sem bio.'}"</p>
                    <h4 className="font-semibold mb-2">Interesses:</h4>
                    <div className="flex flex-wrap gap-2 justify-center mb-6">
                        {(selectedGuestProfile.interests || []).map(interest => <span key={interest} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">{interest}</span>)}
                    </div>
                    <button 
                        onClick={() => selectedGuestProfile && handleStartChat(selectedGuestProfile)} 
                        className="w-full bg-brand-dark text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-green transition-all shadow-xl shadow-black/10 text-[10px] uppercase tracking-widest"
                    >
                        <MessageSquare size={16} /> Enviar Mensagem
                    </button>
                </div>
            )}
        </PortalModal>
        <PortalModal isOpen={isStatementModalOpen} onClose={() => setIsStatementModalOpen(false)} title="Extrato da Estadia">
            <div className="space-y-2">
                {statementData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm p-2 bg-black/5 rounded-md">
                        <div>
                            <p className="font-semibold">{item.description}</p>
                            <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                        </div>
                        <p className="font-semibold">{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                ))}
                <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t">
                    <span>Total:</span>
                    <span>{statementData.reduce((sum, i) => sum + i.amount, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
            </div>
        </PortalModal>
        <PortalModal 
            isOpen={isNewPostModalOpen} 
            onClose={() => setIsNewPostModalOpen(false)} 
            title="Nova Postagem no Mural"
        >
            <form onSubmit={handleAddPost} className="space-y-6">
                <div className="relative">
                    <textarea 
                        value={newPostText} 
                        onChange={e => setNewPostText(e.target.value)} 
                        placeholder={`No que você está pensando, ${(currentUser.fullName || 'Hóspede').split(' ')[0]}?`} 
                        className="w-full h-40 p-6 bg-gray-50 border border-gray-100 rounded-[32px] outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all font-medium text-gray-700 resize-none" 
                        required 
                    />
                </div>

                {newPostMedia && (
                    <div className="relative rounded-[32px] overflow-hidden border border-gray-100 shadow-xl group">
                        <MediaContent url={newPostMedia} type={newPostMediaType} className="w-full h-64" />
                        <button 
                            type="button"
                            onClick={() => setNewPostMedia(null)}
                            className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white p-2 rounded-xl hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => newPostMediaRef.current?.click()}
                        className="flex items-center justify-center gap-3 p-5 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-white hover:shadow-lg transition-all text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-green"
                    >
                        <ImageIcon size={18} />
                        FOTO
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (newPostMediaRef.current) {
                                newPostMediaRef.current.accept = "video/*";
                                newPostMediaRef.current.click();
                            }
                        }}
                        className="flex items-center justify-center gap-3 p-5 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-white hover:shadow-lg transition-all text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-purple-500"
                    >
                        <Video size={18} />
                        VÍDEO
                    </button>
                    <input 
                        type="file" 
                        accept="image/*,video/*" 
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const isVideo = file.type.startsWith('video/');
                                setNewPostMediaType(isVideo ? 'video' : 'image');
                                handlePostMediaSelect(e);
                            }
                        }} 
                        ref={newPostMediaRef} 
                        className="hidden"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting('add-post') || !newPostText.trim()} 
                    className="w-full bg-brand-dark text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs hover:bg-brand-green transition-all shadow-2xl shadow-brand-dark/20 disabled:opacity-50"
                >
                    {isSubmitting('add-post') ? <Loader2 className="animate-spin" size={20} /> : (
                        <>Publicar no Mural <Send size={18}/></>
                    )}
                </button>
            </form>
        </PortalModal>
        <PortalModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} title="Regras da Casa">
             {activeProperty && (
                <div className="space-y-4">
                    <ul className="space-y-2 list-disc list-inside text-gray-600 max-h-80 overflow-y-auto">
                        {activeProperty.rules.map((rule, i) => <li key={i}>{rule}</li>)}
                    </ul>
                    <button onClick={handleAcceptRules} className="w-full bg-[var(--portal-primary)] text-white font-bold py-2.5 rounded-lg">
                        Li e Aceito as Regras
                    </button>
                </div>
            )}
        </PortalModal>
        <PortalModal isOpen={isItineraryDetailModalOpen} onClose={() => setIsItineraryDetailModalOpen(false)} title={selectedItineraryItem?.title || 'Detalhes'}>
             {(() => {
                if (!selectedItineraryItem) return null;
                const source = selectedItineraryItem.type === 'tip'
                    ? db.localGuideTips.find(t => t.id === selectedItineraryItem.sourceId)
                    : db.propertyEvents.find(e => e.id === selectedItineraryItem.sourceId);
                if (!source) return <p>Detalhes não encontrados.</p>;
                const isInItinerary = currentUser.itinerary?.some(item => item.sourceId === source.id);
                
                return (
                    <div className="space-y-4">
                        <img src={source.imageUrl} alt={source.title} className="w-full h-40 object-cover rounded-lg"/>
                        <p className="text-gray-600">{source.description}</p>
                        {source.location && <p className="text-sm font-semibold flex items-center gap-2"><MapPin size={14}/> {source.location}</p>}
                        <div className="flex gap-2">
                            {source.location && <button onClick={() => handleOpenMap([source.location])} className="flex-1 bg-blue-500 text-white font-bold py-2 rounded-lg text-sm">Ver no Mapa</button>}
                            <button onClick={() => handleAddToItinerary(source.id, selectedItineraryItem.type, source.title)} disabled={isInItinerary || isSubmitting(`itinerary-${source.id}`)} className="flex-1 bg-gray-200 font-bold py-2 rounded-lg text-sm disabled:bg-gray-300 disabled:cursor-not-allowed">
                                {isInItinerary ? 'Já está no roteiro' : 'Adicionar ao Roteiro'}
                            </button>
                        </div>
                    </div>
                )
            })()}
        </PortalModal>
         <PortalModal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} title="Mapa" size="2xl">
            <iframe src={mapUrl} width="100%" height="450" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
        </PortalModal>
        <PortalModal isOpen={isPayBalanceModalOpen} onClose={() => setIsPayBalanceModalOpen(false)} title="Pagar Saldo">
             {activeBooking && (
                <form onSubmit={handleProcessBalancePayment} className="space-y-8 py-4">
                    <div className="text-center space-y-2">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Saldo Pendente</p>
                        <p className="text-5xl font-black text-red-600 tracking-tighter">{activeBooking.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                        <button 
                            type="button" 
                            onClick={() => setPaymentMethod('card')} 
                            className={`flex-1 py-3 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${paymentMethod === 'card' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <CreditCard size={14}/> Cartão
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setPaymentMethod('pix')} 
                            className={`flex-1 py-3 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${paymentMethod === 'pix' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <QrCode size={14}/> PIX
                        </button>
                    </div>

                    {paymentMethod === 'card' && (
                        <div className="space-y-5 animate-slide-up">
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Número do Cartão</label>
                                <input type="text" value={cardDetails.number} onChange={e => setCardDetails({...cardDetails, number: e.target.value})} placeholder="**** **** **** ****" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all font-bold text-gray-700 text-sm" />
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nome no Cartão</label>
                                <input type="text" value={cardDetails.holderName} onChange={e => setCardDetails({...cardDetails, holderName: e.target.value})} placeholder="Como está no cartão" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all font-bold text-gray-700 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Validade (MM/AA)</label>
                                    <input type="text" value={cardDetails.expiry} onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})} placeholder="MM/AA" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all font-bold text-gray-700 text-sm" />
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">CVC</label>
                                    <input type="text" value={cardDetails.cvc} onChange={e => setCardDetails({...cardDetails, cvc: e.target.value})} placeholder="***" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all font-bold text-gray-700 text-sm" />
                                </div>
                            </div>
                        </div>
                    )}

                    {paymentMethod === 'pix' && (
                        <div className="text-center p-8 bg-brand-green/5 rounded-[32px] border border-brand-green/10 animate-slide-up">
                            <div className="w-48 h-48 bg-white mx-auto mb-6 rounded-3xl shadow-lg flex items-center justify-center border-4 border-white">
                                <QrCode size={120} className="text-brand-dark opacity-10" />
                            </div>
                            <p className="font-black text-gray-900 text-xs uppercase tracking-widest mb-1">Pagamento Instantâneo PIX</p>
                            <p className="text-xs text-gray-500 font-medium italic">O QR Code será ativado ao clicar no botão abaixo.</p>
                        </div>
                    )}

                    <button type="submit" disabled={isSubmitting('pay-balance')} className="w-full bg-brand-dark text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3">
                        {isSubmitting('pay-balance') ? <Loader2 className="animate-spin" size={18}/> : (
                            <>Confirmar Pagamento <ChevronRight size={16}/></>
                        )}
                    </button>
                </form>
            )}
        </PortalModal>
        <PortalModal
            isOpen={isPartnerServiceModalOpen}
            onClose={() => setIsPartnerServiceModalOpen(false)}
            title={`Contratar: ${selectedService?.name}`}
        >
            {selectedService && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">{selectedService.description}</p>
                    <p><strong>Preço:</strong> {selectedService.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <div>
                        <label className="block text-sm font-medium mb-1">Selecione a data para o serviço:</label>
                        <input
                            type="date"
                            value={serviceDate}
                            onChange={e => setServiceDate(e.target.value)}
                            className="input-base-portal"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <p className="text-xs text-gray-500">O valor será adicionado à conta da sua estadia e pode ser pago no check-out.</p>
                    <button
                        onClick={handleBookService}
                        disabled={isSubmitting(`book-service-${selectedService.id}`)}
                        className="w-full bg-brand-dark text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2"
                    >
                        {isSubmitting(`book-service-${selectedService.id}`) ? <Loader2 className="animate-spin" /> : 'Confirmar e Contratar'}
                    </button>
                </div>
            )}
        </PortalModal>
        <PortalModal isOpen={isNfcModalOpen} onClose={() => setIsNfcModalOpen(false)} title="Chave Digital (NFC)">
            <div className="text-center flex flex-col items-center justify-center h-64">
                <div className={`transition-transform duration-1000 ${nfcAnimationState === 'scanning' ? '-translate-y-8' : ''}`}>
                    <Smartphone size={64} className="text-gray-800" />
                </div>
                <div className={`mt-8 p-4 rounded-full transition-colors duration-500 ${nfcAnimationState === 'unlocked' ? 'bg-green-200' : 'bg-red-200'}`}>
                    <Lock size={48} className={`${nfcAnimationState === 'unlocked' ? 'text-green-700' : 'text-red-700'}`} />
                </div>
                <p className="mt-6 font-semibold">
                    {nfcAnimationState === 'idle' && 'Aproxime seu celular da fechadura.'}
                    {nfcAnimationState === 'scanning' && 'Lendo chave digital...'}
                    {nfcAnimationState === 'unlocked' && 'Porta Destrancada!'}
                </p>
            </div>
        </PortalModal>

        <PortalModal isOpen={isPreCheckoutModalOpen} onClose={() => setIsPreCheckoutModalOpen(false)} title="Saída Digital (Pre-Check-out)">
            <div className="space-y-6">
                {preCheckoutStep === 1 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <p className="text-gray-600 mb-6 font-medium italic text-sm">Agilize sua saída confirmando o horário previsto para deixar o quarto.</p>
                            <div className="flex flex-wrap justify-center gap-4">
                                {['08:00', '09:00', '10:00', '11:00', '12:00'].map(time => (
                                    <button 
                                        key={time}
                                        onClick={() => setPreCheckoutTime(time)}
                                        className={`px-6 py-4 rounded-2xl font-black text-xs transition-all ${preCheckoutTime === time ? 'bg-brand-dark text-white border-transparent shadow-xl shadow-black/20' : 'bg-gray-50 text-gray-500 border border-gray-100 hover:border-brand-green hover:bg-white'}`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="bg-brand-green/5 p-6 rounded-3xl border border-brand-green/10 italic text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
                            <p>Ao realizar o pré-check-out, nossa equipe já deixará sua fatura final preparada e as taxas de serviço revisadas para que sua partida seja o mais suave possível.</p>
                        </div>

                        <button 
                            onClick={handleFinalizePreCheckout}
                            disabled={isSubmitting('pre-checkout') || !preCheckoutTime}
                            className="w-full bg-brand-dark text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isSubmitting('pre-checkout') ? <Loader2 className="animate-spin" size={18}/> : (
                                <>Confirmar Saída Digital <ChevronRight size={16}/></>
                            )}
                        </button>
                    </div>
                )}
                {preCheckoutStep === 2 && (
                    <div className="text-center space-y-6 py-8">
                        <div className="w-20 h-20 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={40} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Preisões Confirmadas!</h3>
                        <p className="text-gray-500 font-medium text-sm">Obrigado por nos avisar. Nossa equipe foi notificada e já estamos preparando tudo para sua partida às {preCheckoutTime}.</p>
                        <button 
                            onClick={() => setIsPreCheckoutModalOpen(false)}
                            className="w-full bg-brand-dark text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs"
                        >
                            Fechar
                        </button>
                    </div>
                )}
            </div>
        </PortalModal>

        <PortalModal isOpen={isDocumentModalOpen} onClose={() => setIsDocumentModalOpen(false)} title={documentContent.title}>
            <div className="space-y-6 max-h-[75vh] flex flex-col pt-2">
                <div id="hotel-document-to-print" className="bg-white p-8 sm:p-12 border border-gray-100 rounded-[32px] shadow-sm flex-grow overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start mb-10 border-b border-gray-50 pb-8">
                        <div>
                            <p className="font-black text-gray-900 uppercase text-xs tracking-widest">{activeProperty.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{activeProperty.address}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Documento Digital</p>
                            <p className="text-[10px] text-gray-300 font-medium">#{new Date().getTime().toString(16).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="max-w-none text-gray-700 leading-relaxed font-medium text-sm">
                        {documentContent.content.split('\n').map((para, i) => para.trim() ? <p key={i} className="mb-4 whitespace-pre-wrap">{para}</p> : <div key={i} className="h-4" />)}
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-50 flex justify-between items-center text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                        <span>Assinado Digitalmente</span>
                        <span>{new Date().toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => {
                            const printContents = document.getElementById('hotel-document-to-print')?.innerHTML;
                            const originalContents = document.body.innerHTML;
                            if (printContents) {
                                // Simple print approach for the demo environment
                                const printWindow = window.open('', '_blank');
                                if (printWindow) {
                                    printWindow.document.write(`
                                        <html>
                                            <head>
                                                <title>${documentContent.title}</title>
                                                <style>
                                                    body { font-family: sans-serif; padding: 40px; color: #333; }
                                                    .prose p { margin-bottom: 15px; line-height: 1.6; }
                                                    .flex { display: flex; justify-content: space-between; }
                                                    .text-right { text-align: right; }
                                                    .border-b { border-bottom: 1px solid #eee; }
                                                    .border-t { border-top: 1px solid #eee; }
                                                    .mb-10 { margin-bottom: 40px; }
                                                    .mt-12 { margin-top: 48px; }
                                                    .pb-8 { padding-bottom: 32px; }
                                                    .pt-8 { padding-top: 32px; }
                                                    .font-black { font-weight: 900; }
                                                    .text-xs { font-size: 12px; }
                                                    .text-gray-900 { color: #111; }
                                                    .text-gray-400 { color: #999; }
                                                    .uppercase { text-transform: uppercase; }
                                                    .tracking-widest { letter-spacing: 0.1em; }
                                                </style>
                                            </head>
                                            <body>${printContents}</body>
                                        </html>
                                    `);
                                    printWindow.document.close();
                                    printWindow.print();
                                }
                            }
                        }}
                        className="flex-1 bg-white border border-gray-100 text-gray-500 font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-gray-50 hover:text-gray-900 transition-all flex items-center justify-center gap-2"
                    >
                        <Printer size={14} /> Imprimir PDF
                    </button>
                    <button 
                        onClick={() => setIsDocumentModalOpen(false)}
                        className="flex-1 bg-brand-dark text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all shadow-xl shadow-black/10"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </PortalModal>

        <PortalModal isOpen={isLostFoundModalOpen} onClose={() => setIsLostFoundModalOpen(false)} title="Registrar no Mural">
            <div className="space-y-6">
                <div className="flex border-b border-gray-100">
                    <button onClick={() => setLostFoundData({...lostFoundData, status: 'lost'})} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${lostFoundData.status === 'lost' ? 'border-b-2 border-brand-dark text-gray-900' : 'text-gray-400 opacity-60'}`}>Perdi Algo</button>
                    <button onClick={() => setLostFoundData({...lostFoundData, status: 'found'})} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${lostFoundData.status === 'found' ? 'border-b-2 border-brand-dark text-gray-900' : 'text-gray-400 opacity-60'}`}>Encontrei Algo</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">O que é?</label>
                        <input 
                            type="text" 
                            value={lostFoundData.itemName}
                            onChange={e => setLostFoundData({...lostFoundData, itemName: e.target.value})}
                            placeholder="Ex: Óculos de sol, Chave de carro"
                            className="input-base-portal"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Deixe uma descrição</label>
                        <textarea 
                            value={lostFoundData.description}
                            onChange={e => setLostFoundData({...lostFoundData, description: e.target.value})}
                            placeholder="Descreva detalhes que ajudem na identificação..."
                            className="input-base-portal"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Local aproximado</label>
                        <input 
                            type="text" 
                            value={lostFoundData.locationFoundOrLost}
                            onChange={e => setLostFoundData({...lostFoundData, locationFoundOrLost: e.target.value})}
                            placeholder="Ex: Próximo à piscina, Refeitório"
                            className="input-base-portal"
                        />
                    </div>
                    <button 
                        onClick={handleReportLostFound}
                        disabled={isSubmitting('add-lostfound') || !lostFoundData.itemName}
                        className="w-full bg-brand-dark text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                    >
                        {isSubmitting('add-lostfound') ? <Loader2 className="animate-spin" /> : 'Publicar no Mural'}
                    </button>
                </div>
            </div>
        </PortalModal>

        <PortalModal isOpen={isClassifiedsModalOpen} onClose={() => setIsClassifiedsModalOpen(false)} title="Novo Item nos Classificados">
            <div className="space-y-6">
                 <div className="flex border-b border-gray-100">
                    <button onClick={() => setClassifiedsData({...classifiedsData, category: 'Venda'})} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${classifiedsData.category === 'Venda' ? 'border-b-2 border-brand-dark text-gray-900' : 'text-gray-400 opacity-60'}`}>Venda</button>
                    <button onClick={() => setClassifiedsData({...classifiedsData, category: 'Troca'})} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${classifiedsData.category === 'Troca' ? 'border-b-2 border-brand-dark text-gray-900' : 'text-gray-400 opacity-60'}`}>Troca</button>
                    <button onClick={() => setClassifiedsData({...classifiedsData, category: 'Doação'})} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${classifiedsData.category === 'Doação' ? 'border-b-2 border-brand-dark text-gray-900' : 'text-gray-400 opacity-60'}`}>Doação</button>
                </div>

                <div className="space-y-4">
                     <div>
                        <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Título do Anúncio</label>
                        <input 
                            type="text" 
                            value={classifiedsData.title}
                            onChange={e => setClassifiedsData({...classifiedsData, title: e.target.value})}
                            placeholder="O que você está oferecendo?"
                            className="input-base-portal"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Valor (opcional)</label>
                        <input 
                            type="number" 
                            value={classifiedsData.price}
                            onChange={e => setClassifiedsData({...classifiedsData, price: Number(e.target.value)})}
                            placeholder="R$ 0,00"
                            className="input-base-portal"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Descrição</label>
                        <textarea 
                            value={classifiedsData.description}
                            onChange={e => setClassifiedsData({...classifiedsData, description: e.target.value})}
                            placeholder="Descreva o item e as condições..."
                            className="input-base-portal"
                            rows={3}
                        />
                    </div>
                    <button 
                        onClick={handleCreateClassified}
                        disabled={isSubmitting('add-classifieds') || !classifiedsData.title}
                        className="w-full bg-brand-dark text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                    >
                        {isSubmitting('add-classifieds') ? <Loader2 className="animate-spin" /> : 'Criar Anúncio'}
                    </button>
                </div>
            </div>
        </PortalModal>

        <PortalModal 
            isOpen={isActivityModalOpen} 
            onClose={() => {
                setIsActivityModalOpen(false);
                setEditingActivity(null);
            }} 
            title={editingActivity && 'id' in editingActivity ? 'Editar Atividade' : 'Sugerir Atividade'}
        >
            <div className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Nome da Atividade</label>
                        <input 
                            type="text" 
                            value={editingActivity?.name || ''}
                            onChange={e => setEditingActivity(p => ({...(p || {}), name: e.target.value} as any))}
                            placeholder="Ex: Trilha ao Pôr do Sol"
                            className="input-base-portal"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Data</label>
                            <input 
                                type="date" 
                                value={editingActivity?.date || ''}
                                onChange={e => setEditingActivity(p => ({...(p || {}), date: e.target.value} as any))}
                                className="input-base-portal"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Horário</label>
                            <input 
                                type="time" 
                                value={editingActivity?.time || ''}
                                onChange={e => setEditingActivity(p => ({...(p || {}), time: e.target.value} as any))}
                                className="input-base-portal"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Localização</label>
                        <input 
                            type="text" 
                            value={editingActivity?.location || ''}
                            onChange={e => setEditingActivity(p => ({...(p || {}), location: e.target.value} as any))}
                            placeholder="Onde será?"
                            className="input-base-portal"
                        />
                    </div>
                     <div>
                        <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Descrição</label>
                        <textarea 
                            value={editingActivity?.description || ''}
                            onChange={e => setEditingActivity(p => ({...(p || {}), description: e.target.value} as any))}
                            placeholder="Detalhes sobre a atividade..."
                            className="input-base-portal"
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Máx. Participantes</label>
                            <input 
                                type="number" 
                                value={editingActivity?.maxParticipants || 0}
                                onChange={e => setEditingActivity(p => ({...(p || {}), maxParticipants: Number(e.target.value)} as any))}
                                className="input-base-portal"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Meta de Contribuição (R$)</label>
                            <input 
                                type="number" 
                                value={editingActivity?.contributionGoal || 0}
                                onChange={e => setEditingActivity(p => ({...(p || {}), contributionGoal: Number(e.target.value)} as any))}
                                className="input-base-portal"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveActivity}
                        disabled={isSubmitting('save-activity') || !editingActivity?.name}
                        className="w-full bg-brand-dark text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                    >
                        {isSubmitting('save-activity') ? <Loader2 className="animate-spin" /> : 'Salvar Atividade'}
                    </button>
                </div>
            </div>
        </PortalModal>

        <PortalModal 
            isOpen={isActivityDetailModalOpen} 
            onClose={() => setIsActivityDetailModalOpen(false)} 
            title={selectedActivity?.name || 'Detalhes da Atividade'}
            size="2xl"
        >
            {selectedActivity && (
                <div className="flex flex-col h-[70vh]">
                    <div className="flex border-b border-gray-100 mb-6 shrink-0 overflow-x-auto">
                        <button onClick={() => setActivityDetailTab('details')} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activityDetailTab === 'details' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-400'}`}>Informações</button>
                        <button onClick={() => setActivityDetailTab('chat')} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activityDetailTab === 'chat' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-400'}`}>Bate-papo</button>
                        <button onClick={() => setActivityDetailTab('photos')} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activityDetailTab === 'photos' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-400'}`}>Álbum Coletivo</button>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                        {activityDetailTab === 'details' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 italic">
                                            <p className="text-gray-600 font-medium leading-relaxed">"{selectedActivity.description}"</p>
                                        </div>
                                        <div className="flex flex-col gap-4 text-xs font-black text-gray-500 uppercase tracking-widest">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-brand-green">
                                                    <Calendar size={14} />
                                                </div>
                                                <span>{new Date(selectedActivity.date).toLocaleDateString('pt-BR')} às {selectedActivity.time}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-brand-green">
                                                    <MapPin size={14} />
                                                </div>
                                                <span>{selectedActivity.location}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-brand-green">
                                                    <Users2 size={14} />
                                                </div>
                                                <span>{selectedActivity.participantIds.length} / {selectedActivity.maxParticipants} participantes</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="bg-brand-dark p-8 rounded-[40px] text-white shadow-xl shadow-brand-dark/20 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-12 translate-x-12"></div>
                                            <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-4">Contribuição Coletiva</p>
                                            <div className="flex items-baseline gap-2 mb-2">
                                                <span className="text-3xl font-black">R$ {selectedActivity.currentContribution || 0}</span>
                                                <span className="text-sm opacity-60 font-black">/ R$ {selectedActivity.contributionGoal}</span>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-2 mb-6">
                                                <div className="bg-brand-green h-full rounded-full shadow-lg shadow-brand-green/30" style={{ width: `${Math.min(100, ((selectedActivity.currentContribution || 0) / selectedActivity.contributionGoal) * 100)}%` }}></div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setActivityToContribute(selectedActivity);
                                                    setIsContributionModalOpen(true);
                                                }}
                                                className="w-full bg-white text-brand-dark font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-brand-sand transition-all"
                                            >
                                                Contribuir Agora
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Participantes Confirmados</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedActivity.participantIds.map(id => {
                                                    const guest = db.guests.find(g => g.id === id);
                                                    return (
                                                        <div key={id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 group">
                                                            <img src={guest?.profilePictureUrl || `https://i.pravatar.cc/100?u=${id}`} className="w-6 h-6 rounded-lg object-cover" />
                                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{(guest?.fullName || 'Visitante').split(' ')[0]}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activityDetailTab === 'chat' && (
                            <div className="h-full flex flex-col bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden relative">
                                <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                    {(selectedActivity.comments || []).map((comm, idx) => (
                                        <div key={idx} className={`flex flex-col ${comm.guestId === currentUser.id ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-xs font-medium leading-relaxed ${comm.guestId === currentUser.id ? 'bg-brand-dark text-white rounded-tr-none' : 'bg-white text-gray-600 border border-gray-100 rounded-tl-none'}`}>
                                                {comm.text}
                                            </div>
                                            <p className="text-[8px] font-black text-gray-300 mt-2 uppercase tracking-widest">{comm.guestName} • {new Date(comm.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
                                    <input 
                                        type="text" 
                                        value={groupChatMessage}
                                        onChange={e => setGroupChatMessage(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendGroupChatMessage(e)}
                                        placeholder="Digite sua mensagem..."
                                        className="flex-grow bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-medium focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
                                    />
                                    <button 
                                        onClick={(e) => handleSendGroupChatMessage(e)}
                                        disabled={!groupChatMessage.trim()}
                                        className="p-4 bg-brand-dark text-white rounded-2xl hover:bg-brand-green transition-all shadow-lg shadow-black/5 disabled:opacity-50"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {activityDetailTab === 'photos' && (
                            <div className="space-y-8 pb-8">
                                <div className="flex justify-between items-center bg-gray-50 p-8 rounded-[40px] border border-gray-100 border-dashed">
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-1">Compartilhe flashes</h4>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Suas fotos aparecerão no álbum da atividade</p>
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" id="photo-vibe-upload" onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => onAddPhotoToActivityAlbum(selectedActivity.id, reader.result as string);
                                            reader.readAsDataURL(file);
                                        }
                                    }}/>
                                    <label htmlFor="photo-vibe-upload" className="px-8 py-4 bg-white text-brand-dark border border-gray-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-dark hover:text-white transition-all cursor-pointer shadow-lg shadow-black/5">
                                        Subir Fotos
                                    </label>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    {(selectedActivity.photoAlbum || []).map((photo, i) => (
                                        <motion.div 
                                            whileHover={{ scale: 1.02 }}
                                            key={photo.id || i} 
                                            className="relative aspect-square rounded-[32px] overflow-hidden group shadow-xl shadow-black/5 border border-white"
                                        >
                                            <img src={photo.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                                <p className="text-[8px] font-black text-white uppercase tracking-widest">Por {photo.guestName}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {(selectedActivity.photoAlbum || []).length === 0 && (
                                        <div className="col-span-3 text-center py-20 grayscale opacity-40">
                                            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                                                <Camera size={32} />
                                            </div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhuma foto postada ainda.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-8 border-t border-gray-100 flex gap-4 shrink-0">
                        {selectedActivity.participantIds.includes(currentUser.id) ? (
                            <button 
                                onClick={() => handleLeaveActivity(selectedActivity.id)}
                                disabled={isSubmitting(`leave-activity-${selectedActivity.id}`)}
                                className="flex-1 bg-red-50 text-red-500 font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all"
                            >
                                Sair da Atividade
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleJoinActivity(selectedActivity.id)}
                                disabled={isSubmitting(`join-activity-${selectedActivity.id}`) || selectedActivity.participantIds.length >= selectedActivity.maxParticipants}
                                className="flex-1 bg-brand-dark text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-brand-green transition-all"
                            >
                                {selectedActivity.participantIds.length >= selectedActivity.maxParticipants ? 'Atividade Lotada' : 'Participar desta Atividade'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </PortalModal>

        <PortalModal isOpen={isContributionModalOpen} onClose={() => setIsContributionModalOpen(false)} title="Fazer Contribuição Coletiva">
            <div className="space-y-6">
                <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 text-center">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Apoiar Atividade</p>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">{activityToContribute?.name}</h3>
                    <p className="text-xs text-gray-400 font-medium leading-relaxed">Sua contribuição ajuda a viabilizar as experiências coletivas da comunidade Forest.</p>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-300">R$</span>
                        <input 
                            type="number" 
                            value={contributionAmount}
                            onChange={e => setContributionAmount(e.target.value)}
                            placeholder="0,00"
                            className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xl text-brand-dark focus:ring-4 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {[10, 30, 50].map(val => (
                            <button 
                                key={val}
                                onClick={() => setContributionAmount(val.toString())}
                                className="py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-brand-green hover:text-brand-green transition-all"
                            >
                                + R$ {val}
                            </button>
                        ))}
                    </div>
                    
                    <button 
                        onClick={handleMakeContribution}
                        disabled={isSubmitting('contribution') || !contributionAmount}
                        className="w-full bg-brand-dark text-white font-black py-5 rounded-[28px] flex items-center justify-center gap-2 uppercase tracking-widest text-[11px] hover:bg-brand-green transition-all shadow-xl shadow-black/10"
                    >
                        {isSubmitting('contribution') ? <Loader2 className="animate-spin" /> : 'Confirmar Contribuição'}
                    </button>
                </div>
            </div>
        </PortalModal>

        {/* Story Viewer Modal */}
        <AnimatePresence>
            {selectedStory && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
                >
                    <div className="relative w-full max-w-md aspect-[9/16] bg-brand-dark overflow-hidden rounded-3xl shadow-2xl">
                        {/* Story Content */}
                        {(() => {
                            const stories = db.guestStories.filter(s => s.guestId === selectedStory.guestId);
                            const currentStory = stories[selectedStory.storyIndex];
                            if (!currentStory) return null;

                            return (
                                <>
                                    <MediaContent url={currentStory.mediaUrl} type={currentStory.mediaType} className="w-full h-full object-cover" />
                                    
                                    {/* Progress Bars */}
                                    <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
                                        {stories.map((_, i) => (
                                            <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full bg-white transition-all duration-[3000ms] ${i < selectedStory.storyIndex ? 'w-full' : i === selectedStory.storyIndex ? 'w-full animate-story-progress' : 'w-0'}`}
                                                ></div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* User Info */}
                                    <div className="absolute top-8 left-4 flex items-center gap-2 z-10">
                                        <img src={currentStory.guestProfilePictureUrl || `https://i.pravatar.cc/100?u=${currentStory.guestId}`} className="w-8 h-8 rounded-full border border-white" />
                                        <div className="text-white">
                                            <p className="text-[10px] font-black uppercase tracking-widest">{currentStory.guestName}</p>
                                            <p className="text-[8px] opacity-60 uppercase font-bold">{new Date(currentStory.createdAt).toLocaleTimeString()}</p>
                                        </div>
                                    </div>

                                    {/* Navigation */}
                                    <div className="absolute inset-y-0 inset-x-0 flex">
                                        <div 
                                            className="flex-1 cursor-pointer" 
                                            onClick={() => {
                                                if (selectedStory.storyIndex > 0) {
                                                    setSelectedStory({ ...selectedStory, storyIndex: selectedStory.storyIndex - 1 });
                                                }
                                            }}
                                        ></div>
                                        <div 
                                            className="flex-1 cursor-pointer" 
                                            onClick={() => {
                                                if (selectedStory.storyIndex < stories.length - 1) {
                                                    setSelectedStory({ ...selectedStory, storyIndex: selectedStory.storyIndex + 1 });
                                                } else {
                                                    setSelectedStory(null);
                                                }
                                            }}
                                        ></div>
                                    </div>
                                </>
                            );
                        })()}

                        <button onClick={() => setSelectedStory(null)} className="absolute top-4 right-4 text-white p-2 z-20"><X size={24} /></button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* New Story Modal */}
        <PortalModal isOpen={isNewStoryModalOpen} onClose={() => setIsNewStoryModalOpen(false)} title="Nova História">
             <div className="space-y-6">
                <div className="aspect-[9/16] bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100 flex items-center justify-center relative group overflow-hidden">
                    <input type="file" id="story-upload-btn" className="hidden" accept="image/*,video/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                             const reader = new FileReader();
                             reader.onload = async (ev) => {
                                 const res = ev.target?.result as string;
                                 await onAddGuestStory(currentUser.id, res, file.type.startsWith('video') ? 'video' : 'image');
                                 setIsNewStoryModalOpen(false);
                             };
                             reader.readAsDataURL(file);
                        }
                    }} />
                    <label htmlFor="story-upload-btn" className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center cursor-pointer">
                         <div className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-brand-green mb-6 group-hover:scale-110 transition-transform">
                             <Camera size={32} />
                         </div>
                         <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-2">Compartilhe o Momento</h4>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">Sua história ficará visível para outros hóspedes por 24 horas.</p>
                    </label>
                </div>
                <div className="p-6 bg-brand-green/5 rounded-3xl border border-brand-green/10">
                    <p className="text-[10px] font-bold text-brand-green uppercase tracking-widest leading-relaxed text-center">
                        DICA: Histórias de atividades coletivas ganham visibilidade no feed!
                    </p>
                </div>
            </div>
        </PortalModal>
    </div>
    );
};