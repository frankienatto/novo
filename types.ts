import { Type } from "@google/genai";

export interface Facility {
    id: string;
    icon: string;
    name: string;
    description: string;
    imageUrl: string;
    longDescription: string;
}

export interface ProjectAttachment {
    id: string;
    fileName: string;
    url: string; // base64 data URL
    uploadedAt: string;
}

export interface TaskAttachment extends ProjectAttachment {
    taskId: string;
}

export interface TaskComment {
    id: string;
    staffId: string;
    staffName: string;
    text: string;
    timestamp: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    status: 'Ativo' | 'Concluído' | 'Arquivado';
    ownerId: string; // Staff ID
    taskIds: string[];
    createdAt: string;
    budget?: number;
    attachments?: ProjectAttachment[];
}

export type SiteContent = {
    hero: {
        title: string;
        subtitle: string;
        imageUrl: string;
    };
    whyUs: {
        title:string;
        subtitle: string;
        items: {
            icon: string;
            title: string;
            text: string;
        }[];
    };
    about: {
        title: string;
        text1: string;
        text2: string;
        imageUrls: string[];
    };
    experiences: {
        title: string;
        items: {
            title: string;
            description: string;
            imageUrl: string;
        }[];
    };
    facilities: Facility[];
    cta: {
        title: string;
        subtitle: string;
        buttonText: string;
    }
}

export type ThemeSettings = {
    adminPanel: {
        primaryColor: string;
        sidebarColor: string;
        backgroundColor: string;
        textColor: string;
        menuTextColor: string;
        logoUrl: string;
        headerTitles: { [key in AdminSection]?: string };
        cardBorderRadius: string;
        buttonBorderRadius: string;
    };
    guestPortal: {
        primaryColor: string;
        backgroundColor: string;
        cardColor: string;
        textColor: string;
        welcomeTitle: string;
        welcomeSubtitle: string;
        cardTitles: {
            quickAccess: string;
            roomControls: string;
            tvControls: string;

            services: string;
            communityHub: string;
        };
        cardBorderRadius: string;
        buttonBorderRadius: string;
    };
    publicSite: {
        headerLayout: 'default' | 'logo-center';
        searchLayout: 'inline' | 'stacked';
        aboutGalleryLayout: 'grid' | 'carousel-simple';
        experiencesLayout: 'grid' | 'list';
        facilitiesLayout: 'grid' | 'list';
        footerLayout: 'default' | 'multi-column';
        primaryColor: string;
        backgroundColor: string;
        textColor: string;
        cardBackgroundColor: string;
        logoUrl: string;
        logoHeight: string;
        cardBorderRadius: string;
        buttonBorderRadius: string;
    };
}

export type PropertyUnitId = 'beach' | 'sanctuary';

export interface PropertyUnit {
    id: PropertyUnitId;
    name: string;
    tagline: string;
    color: string;
    badgeBg: string;
    badgeText: string;
    address: string;
    distanceFromBeach: string;
    totalBeds: number;
}

export const PROPERTY_UNITS: PropertyUnit[] = [
    {
        id: 'beach',
        name: 'Forest House Beach',
        tagline: 'Frente à praia & Vibe Social',
        color: '#2D5A27',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        badgeText: '🏖️ Unidade Praia',
        address: 'Av. Beira Mar, 100 - Praia',
        distanceFromBeach: '0m da praia',
        totalBeds: 45,
    },
    {
        id: 'sanctuary',
        name: 'Forest House Santuário & Reserva',
        tagline: 'Eco-Reserva Privativa & Natureza (A 3km da Praia)',
        color: '#059669',
        badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
        badgeText: '🌿 Unidade Santuário',
        address: 'Estrada da Reserva, 300 - A 3km da Praia',
        distanceFromBeach: '3km da praia',
        totalBeds: 27,
    }
];

export enum RoomType {
  SHARED_DORM_FEMALE = 'Dormitório Compartilhado Feminino',
  SHARED_DORM_MALE = 'Dormitório Compartilhado Masculino',
  PRIVATE_SINGLE = 'Quarto Individual',
  PRIVATE_DOUBLE = 'Quarto Duplo',
  PRIVATE_COUPLE = 'Quarto de Casal',
  PRIVATE_TRIPLE = 'Quarto Triplo',
  PRIVATE_QUAD = 'Quarto Quádruplo',
  PRIVATE_FAMILY = 'Quarto Familiar',
  RECEPTION_EMERGENCY = 'Quarto Recepção (Emergência)',
  SEASONAL_ROOM = 'Sala (Temporada)',
}

export const INITIAL_ROOMS: Omit<Room, 'status'>[] = [
    // Unidade Praia (Forest House Beach)
    { id: 3, name: 'Quarto 3', type: RoomType.PRIVATE_SINGLE, capacity: 1, basePrice: 150, imageUrl: '', amenities: ['Ar Condicionado'], propertyId: 'beach' },
    { id: 4, name: 'Quarto 4', type: RoomType.PRIVATE_SINGLE, capacity: 2, basePrice: 120, imageUrl: '', amenities: [], propertyId: 'beach' },
    { id: 5, name: 'Quarto 5', type: RoomType.PRIVATE_COUPLE, capacity: 2, basePrice: 200, imageUrl: '', amenities: ['Ar Condicionado'], propertyId: 'beach' },
    { id: 6, name: 'Quarto 6', type: RoomType.PRIVATE_FAMILY, capacity: 4, basePrice: 250, imageUrl: '', amenities: [], propertyId: 'beach' },
    { id: 7, name: 'Quarto 7', type: RoomType.PRIVATE_COUPLE, capacity: 2, basePrice: 200, imageUrl: '', amenities: ['Ar Condicionado'], propertyId: 'beach' },
    { id: 8, name: 'Quarto 8', type: RoomType.PRIVATE_COUPLE, capacity: 2, basePrice: 200, imageUrl: '', amenities: ['Ar Condicionado'], propertyId: 'beach' },
    { id: 9, name: 'Quarto 9', type: RoomType.PRIVATE_COUPLE, capacity: 2, basePrice: 200, imageUrl: '', amenities: ['Ar Condicionado'], propertyId: 'beach' },
    { id: 10, name: 'Quarto 10', type: RoomType.SHARED_DORM_FEMALE, capacity: 4, basePrice: 80, imageUrl: '', amenities: ['Compartilhado Feminino'], propertyId: 'beach' },
    { id: 11, name: 'Quarto 11', type: RoomType.SHARED_DORM_FEMALE, capacity: 4, basePrice: 80, imageUrl: '', amenities: ['Compartilhado Feminino'], propertyId: 'beach' },
    { id: 12, name: 'Quarto 12', type: RoomType.SHARED_DORM_MALE, capacity: 12, basePrice: 70, imageUrl: '', amenities: ['Compartilhado Masculino'], propertyId: 'beach' },
    { id: 13, name: 'Recepção (Emergência)', type: RoomType.RECEPTION_EMERGENCY, capacity: 1, basePrice: 0, imageUrl: '', amenities: [], propertyId: 'beach' },
    { id: 14, name: 'Sala 1 (Temporada)', type: RoomType.SEASONAL_ROOM, capacity: 4, basePrice: 100, imageUrl: '', amenities: [], propertyId: 'beach' },
    { id: 15, name: 'Sala 2 (Temporada)', type: RoomType.SEASONAL_ROOM, capacity: 6, basePrice: 100, imageUrl: '', amenities: [], propertyId: 'beach' },

    // Unidade Santuário & Reserva (Nova Unidade com 27 Camas)
    { id: 101, name: 'Suíte Santuário Privativa', type: RoomType.PRIVATE_COUPLE, capacity: 2, basePrice: 240, imageUrl: '', amenities: ['Ar Condicionado', 'Varanda Privativa', 'Vista Floresta'], propertyId: 'sanctuary' },
    { id: 102, name: 'Suíte Eco Zen', type: RoomType.PRIVATE_TRIPLE, capacity: 3, basePrice: 280, imageUrl: '', amenities: ['Ar Condicionado', 'Banheiro Privativo', 'Deck Zen'], propertyId: 'sanctuary' },
    { id: 103, name: 'Dormitório Natureza Misto (6 Bed)', type: RoomType.SHARED_DORM_MALE, capacity: 6, basePrice: 75, imageUrl: '', amenities: ['Ar Condicionado', 'Armários Individuais'], propertyId: 'sanctuary' },
    { id: 104, name: 'Dormitório Santuário Fem. (6 Bed)', type: RoomType.SHARED_DORM_FEMALE, capacity: 6, basePrice: 78, imageUrl: '', amenities: ['Ar Condicionado', 'Espelho Maquiagem', 'Secador'], propertyId: 'sanctuary' },
    { id: 105, name: 'Dormitório Tranquilidade (6 Bed)', type: RoomType.SHARED_DORM_MALE, capacity: 6, basePrice: 75, imageUrl: '', amenities: ['Ar Condicionado', 'Tomadas USB'], propertyId: 'sanctuary' },
    { id: 106, name: 'Chalé Reserva Familiar', type: RoomType.PRIVATE_QUAD, capacity: 4, basePrice: 350, imageUrl: '', amenities: ['Ar Condicionado', 'Cozinha Compacta', 'Rede de Descanso'], propertyId: 'sanctuary' },
];

export enum RoomStatus {
  AVAILABLE = 'Disponível',
  OCCUPIED = 'Ocupado',
  CLEANING = 'Limpeza',
  INSPECTION = 'Em Inspeção',
  MAINTENANCE = 'Manutenção'
}

export interface Bed {
    bedNumber: number;
    bookingId: string | null;
    guestName: string | null;
}

export interface IcalConfig {
    platform: OTAPlatform;
    url: string;
    lastSync?: string;
}

export interface Room {
  id: number;
  name: string;
  type: RoomType;
  capacity: number;
  basePrice: number;
  imageUrl: string;
  amenities: string[];
  status: RoomStatus;
  propertyId?: PropertyUnitId;
  occupants?: { guestId: string; guestName: string; bookingId: string }[];
  beds?: Bed[];
  lightsOn?: boolean;
  fanSpeed?: 0 | 1 | 2 | 3;
  doNotDisturb?: boolean;
  icalConfig?: IcalConfig[];
}

export interface ItineraryItem {
    id: string; // Unique ID for the itinerary item itself
    date: string; // ISO Date string (YYYY-MM-DD)
    time?: string; // Optional time (HH:MM)
    title: string;
    type: 'tip' | 'event';
    sourceId: string; // ID of the LocalGuideTip or PropertyEvent
    justification?: string;
}

export interface Achievement {
    id: string; // e.g., 'ACH_EXPLORER'
    name: string;
    description: string;
    icon: string; // Lucide icon name
}

export interface GuestPostComment {
    guestId: string;
    guestName: string;
    text: string;
    timestamp: string;
}

export interface GuestPost {
    id: string;
    guestId: string;
    guestName: string;
    guestProfilePictureUrl?: string;
    text: string;
    imageUrl?: string; // Keep for backward compatibility
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    timestamp: string;
    likes: string[]; // Array of guest IDs who liked the post
    comments: GuestPostComment[];
}

export interface Reward {
    id: string;
    name: string;
    description: string;
    cost: number; // in points
    icon: string;
}

export interface LoyaltyLevel {
    id: string;
    name: string;
    minPoints: number;
    icon: string;
    perks: string[];
}

export interface CheckIn {
    id: string;
    guestId: string;
    locationId: string; // ID of LocalGuideTip or GuestActivity
    locationName: string;
    locationType: 'tip' | 'activity';
    timestamp: string;
}

export interface AIConciergeMessage {
    id: string;
    sender: 'user' | 'agent';
    text: string;
    timestamp: string;
    isLoading?: boolean;
}

export interface Guest {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    cpf: string;
    password?: string;
    birthDate?: string;
    nationality?: string;
    gender?: 'Masculino' | 'Feminino' | 'Outro' | 'Não informado';
    address?: {
        street: string;
        number: string;
        city: string;
        state: string;
        zip: string;
    };
    profilePictureUrl?: string;
    bio?: string;
    socials?: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
    };
    googleId?: string;
    facebookId?: string;
    interests?: string[]; // e.g., 'surf', 'trilhas', 'gastronomia', 'festa', 'relaxar'
    personalitySummary?: string; // AI-generated summary, e.g., "Aventureiro que ama natureza e esportes."
    theme?: 'light' | 'dark' | 'tropical';
    favoriteTipIds?: string[];
    itinerary?: ItineraryItem[];
    unlockedAchievements?: string[];
    points?: number;
    weeklyPoints?: number;
    lastPostTimestamp?: string;
    conciergeChatHistory?: AIConciergeMessage[];
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
}

export interface RatePlan {
    id: string;
    name: string;
    description: string;
    priceModifier: number; // Can be positive or negative
    modifierType: 'fixed' | 'percentage';
    isDefault: boolean;
}

export interface Booking {
  id: string;
  guestId: string;
  roomId: number;
  ratePlanId: string;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  totalPrice: number;
  status: 'Confirmed' | 'Pending' | 'Checked-in' | 'Checked-out' | 'Cancelled' | 'Pre-Checked-in';
  source: 'Website' | 'Walk-in' | 'Phone' | 'Aloha Pro' | 'Beds24' | 'Booking.com' | 'Airbnb';
  balance: number; // For extra charges from POS
  paymentStatus: 'Paid' | 'Pending';
  propertyId?: PropertyUnitId;
  reviewId?: string;
  idPhotoUrl?: string;
  signatureUrl?: string;
  selfiePhotoUrl?: string;
  rulesAcknowledged?: boolean;
  addOns?: AddOn[];
  guestJourneyId?: string;
  preCheckoutCompleted?: boolean;
  preCheckoutTime?: string;
  paymentIntentId?: string;
  promoCodeId?: string;
  packageDealId?: string;
  travelDetails?: {
      transport: 'plane' | 'bus' | 'car' | 'other';
      arrivalDateTime: string;
      flightOrBusNumber?: string;
      shareRide: boolean;
  };
}

export interface Staff {
  id: string;
  name: string;
  role: 'Super Administrador' | 'Administrador Geral' | 'Gerente' | 'Diretor de Marketing' | 'Recepção' | 'Limpeza' | 'Manutenção' | 'Financeiro' | 'Jardim';
  email: string;
  password?: string;
  permissions: AdminSection[];
  onboardingCompleted?: boolean;
  onboardingTasksCompleted?: string[];
  propertyId?: PropertyUnitId | 'all';
}

export type User = Guest | Staff;

export interface Review {
    id: string;
    bookingId: string;
    guestId: string;
    guestName: string;
    rating: number;
    comment: string;
    date: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    source: string;
    responded: boolean;
    sentiment?: 'Positivo' | 'Negativo' | 'Neutro';
    topics?: string[];
}

export enum TableStatus {
    AVAILABLE = 'Livre',
    OCCUPIED = 'Ocupada',
    RESERVED = 'Reservada',
}

export interface Table {
    id: string;
    number: number;
    capacity: number;
    status: TableStatus;
    propertyId?: PropertyUnitId;
    name?: string;
    currentBookingId?: string; // If linked to a room guest
    currentGuestName?: string;
    isActive?: boolean;
    currentItems: SaleItem[];
}

export interface Product {
    id: string;
    name: string;
    price: number;
    costPrice?: number;
    category: 'Comida & Bebida' | 'Aluguel' | 'Passeio' | 'Coworking' | 'Outros' | 'Manutenção' | 'Limpeza' | 'Suprimentos';
    stock: number;
    lowStockThreshold: number;
    description?: string;
    imageUrl?: string;
    propertyId?: PropertyUnitId | 'all';
}

export interface SaleItem {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    propertyId?: PropertyUnitId | 'all';
    propertyUnitId?: PropertyUnitId | 'all';
}

export type PaymentMethod = 'Cartão de Crédito' | 'Dinheiro' | 'Conta do Quarto' | 'PIX' | 'PayPal';

export interface PaymentDetails {
    method: 'Cartão de Crédito';
    cardNumber: string;
    expiryDate: string;
    cvc: string;
    holderName: string;
}

export interface Transaction {
    id: string;
    items: SaleItem[];
    total: number;
    paymentMethod: PaymentMethod;
    bookingId?: string;
    guestName: string;
    timestamp: string;
    tableId?: string;
    propertyId?: PropertyUnitId;
    propertyUnitId: PropertyUnitId;
    paymentGatewayTransactionId?: string;
}

export enum TaskStatus {
  TODO = 'A Fazer',
  IN_PROGRESS = 'Em Andamento',
  AWAITING_CHECK = 'Aguardando Verificação',
  DONE = 'Concluído'
}

export interface StaffTask {
  id: string;
  description: string;
  status: TaskStatus;
  assigneeId?: string;
  roomId?: number;
  bookingId?: string;
  propertyId?: PropertyUnitId | 'all';
  propertyUnitId?: PropertyUnitId | 'all';
  supervisorComment?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
  dependencies?: string[]; // Array of task IDs
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    category: 'Luz' | 'Água' | 'Internet' | 'Marketing Digital' | 'Lavanderia' | 'Material de Limpeza' | 'Marketing' | 'Manutenção' | 'Salários' | 'Suprimentos' | 'Contas' | 'Outros';
    date: string;
    projectId?: string;
    propertyId?: PropertyUnitId | 'shared';
    propertyUnitId: PropertyUnitId;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    description: string;
    features: AdminSection[];
}

export interface PaymentGatewaySettings {
    stripe: {
        connected: boolean;
        publicKey: string;
        secretKey: string;
    };
    mercadoPago: {
        connected: boolean;
        publicKey: string;
        accessToken: string;
    };
    paypal: {
        connected: boolean;
        email: string;
    };
}

export interface PropertyInfo {
    id: string;
    name: string;
    address: string;
    cnpj: string;
    phone: string;
    email: string;
    checkInTime: string;
    checkOutTime: string;
    wifiNetwork: string;
    wifiPass: string;
    rules: string[];
    planId: string;
    subscriptionStatus: 'Ativa' | 'Atrasada' | 'Cancelada';
    paymentGatewaySettings: PaymentGatewaySettings;
    currency: 'BRL' | 'USD' | 'EUR';
    localTaxRate: number; // Percentage
    policies: {
        cancellation: string;
        payment: string;
        pets: string;
    };
    hostelVibe: string;
    socialLinks: {
        instagram?: string;
        facebook?: string;
        tiktok?: string;
        twitter?: string;
    };
}

export interface PropertyEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    imageUrl: string;
    icon: string;
    location?: string;
}

export interface EventParticipant {
    eventId: string;
    guestId: string;
    guestName: string;
}

export interface LocalGuideTip {
    id: string;
    category: 'Praias' | 'Trilhas' | 'Restaurantes' | 'Passeios' | 'Hostel';
    title: string;
    description: string;
    imageUrl: string;
    icon: string;
    location?: string;
}

export interface Block {
    id: string;
    roomId: number;
    startDate: string;
    endDate: string;
    reason: string;
}

export interface BookingRestriction {
    id: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    type: 'minStay' | 'minAdvance';
    value: number; // number of nights for minStay, number of days for minAdvance
    name: string; // e.g., "Feriado de Ano Novo"
}

export interface AppNotification {
    id: string;
    type: 'booking' | 'checkin' | 'pos' | 'task' | 'review' | 'guest' | 'chat' | 'success' | 'error' | 'info' | 'synapse';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    linkTo?: AdminSection;
}

export interface GuestNotification {
    id: string;
    guestId: string;
    type: 'achievement' | 'reward' | 'system' | 'event';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
}

export type AdPlatformString = 'Instagram' | 'Facebook' | 'X' | 'TikTok';

export interface ScheduledPost {
    id: string;
    platform: AdPlatformString;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    status: 'Scheduled' | 'Draft';
    scheduledAt: string; // ISO String
    campaignId?: string;
}

export interface PlaylistSong {
    id: string;
    title: string;
    artist: string;
    addedByGuestId: string;
    addedByGuestName: string;
    votes: string[]; // array of guest IDs
}

export interface SharedSpaceControls {
    livingRoomTV: {
        isOn: boolean;
        volume: number;
        currentApp: 'Netflix' | 'YouTube' | 'TV Aberta' | null;
    };
    commonAreaPlaylist: {
        nowPlaying: PlaylistSong | null;
        queue: PlaylistSong[];
    };
    kitchenCleanliness: 'ok' | 'needs_attention';
}

export interface GuestActivity {
    id: string;
    creatorId: string; // guestId
    creatorName: string;
    title: string;
    description: string;
    date: string; // ISO string for the activity date/time
    maxParticipants?: number;
    crowdfundingTarget?: number;
    chatConversationId?: string;
    photoAlbum?: string[];
}

export interface ActivityParticipant {
    activityId: string;
    guestId: string;
    guestName: string;
}

export interface ActivityComment {
    id: string;
    activityId: string;
    guestId: string;
    guestName: string;
    text: string;
    timestamp: string;
}

export interface ActivityContribution {
    activityId: string;
    guestId: string;
    amount: number;
}

export type OTAPlatform = 'Booking.com' | 'Airbnb' | 'Expedia' | 'Beds24';

export interface OTAConnection {
    platform: OTAPlatform;
    connected: boolean;
    propertyId: string | null;
    lastSync: string | null;
    markup?: number;
}

export type AdminSection =
  | 'dashboard'
  | 'calendar'
  | 'rooms'
  | 'bookings'
  | 'guests'
  | 'staff'
  | 'housekeeping'
  | 'team_manager_ai'
  | 'pos'
  | 'coworking'
  | 'delivery_orders'
  | 'financial_manager'
  | 'inventory'
  | 'shopping_list'
  | 'social_media'
  | 'ad_campaign_manager'
  | 'reports'
  | 'omni_channel'
  | 'internal_chat'
  | 'ai_strategy_consultant'
  | 'ai_marketing_lab'
  | 'creative_studio'
  | 'property_settings'
  | 'projects'
  | 'ai_engagement_agent'
  | 'marketing_orchestrator'
  | 'management_center'
  | 'saas_admin'
  | 'subscriptions'
  | 'synapse_agent'
  | 'rate_manager'
  | 'channel_manager'
  | 'my_subscription'
  | 'guest_journey_ai'
  | 'partner_services'
  | 'vigilancia'
  | 'marketing_dashboard'
  | 'email_autopilot'
  | 'maintenance_manager'
  | 'supplier_manager'
  | 'integrations'
  | 'reputation_manager';

export type Page = 'home' | 'booking' | 'register' | 'login' | 'guestPortal' | 'onlineCheckin' | 'admin' | 'staffDashboard' | 'operationalDashboard' | 'forgotPassword' | 'bookingWidget' | 'usefulLinks' | 'termsAndConditions' | 'preArrivalPortal' | 'digitalMenu' | 'synapse';

export type MessageSource = 'Instagram' | 'Facebook' | 'Website';

export interface ChatConversation {
    id: string;
    guestName: string; // Title of the chat (e.g., Guest Name, Group Name)
    participants?: { guestId: string; guestName: string; }[];
    lastMessage: string;
    source: MessageSource;
    unread: boolean;
    timestamp: string;
    category?: string;
    summary?: string;
    intent?: 'High' | 'Medium' | 'Low';
    isInternal?: boolean;
    isGroupChat?: boolean;
    activityId?: string;
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string; // Can be a guest ID, staff ID, 'AGENT_SYSTEM', or 'GUEST_WEBSITE_...'
    senderName: string; // The name to display for the sender
    text: string;
    timestamp: string;
    isAutoReply?: boolean;
}

export type AdPlatform = 'Google Ads' | 'Meta Ads' | 'TikTok Ads' | 'X Ads';
export type SocialPlatform = 'Facebook' | 'Instagram' | 'Twitter' | 'WhatsApp';

export interface CustomAudience {
    id: string;
    name: string;
    platform: AdPlatform;
    type: 'Interests' | 'Lookalike';
    description: string;
}

export interface PlatformConnection {
    platform: AdPlatform;
    connected: boolean;
    accountName: string | null;
    accountId: string | null;
}

export interface SocialConnection {
    platform: SocialPlatform;
    connected: boolean;
    handleOrNumber: string | null;
}

// --- AI Engagement Agent Types ---
export type SocialMediaPlatform = 'Instagram' | 'Facebook';

export interface EngagementAction {
    actionType: string;
    target: string;
    description: string;
}

export interface Persona {
    name: string;
    age: number;
    location: string;
    interests: string[];
    bio: string;
    engagementRoadmap: EngagementAction[];
}

export interface AIEngagementAgent {
    targetAudienceDescription: string;
    connectedAccount: {
        platform: SocialMediaPlatform;
        accountId: string;
        accountName: string;
        accessToken: string; // This would be encrypted in a real backend
    } | null;
    personas: Persona[];
    isRunning: boolean;
    log: { timestamp: string; message: string; }[];
}

export interface ShoppingListItem {
    id: string;
    name: string;
    category: string;
    status: 'Pendente' | 'Comprado';
    unitCost?: number;
    productId?: string; // Links back to a Product for stock receiving
    projectId?: string;
    // AI generated fields
    suggestedQuantity?: string;
    justification?: string;
}

export interface ShoppingList {
    id: string;
    name: string;
    status: 'Pendente' | 'Concluída';
    createdAt: string;
    items: ShoppingListItem[];
}

export interface MediaAsset {
    id: string;
    type: 'image' | 'video';
    url: string; // base64 data URL for images, regular URL for videos
    prompt?: string; // If generated by AI
    createdAt: string;
}

export type CampaignGoal = 'Aumentar Reservas' | 'Promover Oferta' | 'Consciência de Marca';

export interface AutomationRule {
    id: string;
    condition: string;
    action: string;
}

export interface Ad {
    id: string;
    name: string;
    status: 'Ativa' | 'Pausada' | 'Em Análise' | 'Rascunho';
    copy: {
        headline: string;
        description: string;
    };
    creativePrompt?: string;
    mediaAssetId?: string;
    creativeUrl?: string;
}

export interface AdSet {
    id: string;
    name: string;
    status: 'Ativa' | 'Pausada' | 'Rascunho';
    audience: {
        name: string;
        description: string;
    };
    kpis: {
        impressions: number;
        clicks: number;
        cost: number;
        conversions: number;
    };
    ads: Ad[];
}

export interface AdCampaign {
    id: string;
    name: string;
    platform: AdPlatform;
    status: 'Ativa' | 'Pausada' | 'Concluída' | 'Rascunho';
    isGeneratedByAI?: boolean;
    adSets: AdSet[];
    rules: AutomationRule[];
}

export interface PlatformBudget {
  platform: AdPlatform;
  percentage: number;
  amount: number;
  justification: string;
}

export interface CampaignPhase {
  phaseName: string;
  duration: string;
  objective: string;
  actions: string[];
  generatedCampaignIds?: string[];
}

export interface MarketingMixPlan {
  strategicVision: string;
  budgetSplit: PlatformBudget[];
  phases: CampaignPhase[];
  keyMetrics: string[];
  creativeGuidelines: string;
}

export interface CampaignContext {
    status: 'idle' | 'planning' | 'generating' | 'complete' | 'error';
    objective: string;
    budget: number;
    period: string;
    plan: MarketingMixPlan | null;
    log: { timestamp: string; message: string; }[];
    error?: string | null;
    generatedCampaigns: AdCampaign[];
}

export interface CampaignPerformanceAnalysis {
    summary: {
        performanceLevel: 'Excelente' | 'Bom' | 'Razoável' | 'Ruim' | 'Crítico';
        text: string;
    };
    insights: {
        text: string;
        type: 'positivo' | 'negativo' | 'neutro';
    }[];
    recommendations: {
        text: string;
        priority: 'Alta' | 'Média' | 'Baixa';
    }[];
}

export interface ManagementReport {
  financialSummary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    keyInsight: string;
  };
  projectStatus: {
    activeProjects: number;
    atRiskProjects: { name: string; reason: string; }[];
  };
  teamPerformance: {
    tasksCompleted: number;
    topPerformer: { name: string; completedTasks: number; };
    keyInsight: string;
  };
  inventoryAlerts: {
    lowStockItems: { name: string; stock: number; }[];
  };
  strategicRecommendations: {
    priority: 'Alta' | 'Média' | 'Baixa';
    recommendation: string;
  }[];
}

export interface SynapseMessage {
    id: string;
    sender: 'user' | 'agent';
    text: string;
    timestamp: string;
    isLoading?: boolean;
    action?: {
        type: 'navigate';
        label: string;
        payload: {
            section: AdminSection;
            entityId?: string;
        };
    };
}

export interface SynapseOrchestrationLog {
    id: string;
    timestamp: string;
    trigger: string;
    actionDescription: string;
    status: 'Success' | 'Error' | 'In Progress';
    sourceId: string;
    relatedLink?: {
        section: AdminSection;
        label: string;
    };
}

// --- Guest Journey AI Types ---
export type AIActionType =
    | 'SEND_MESSAGE'
    | 'SUGGEST_ACTIVITY'
    | 'OFFER_UPSELL'
    | 'CREATE_TASK'
    | 'REQUEST_REVIEW';

export interface AIAction {
    id: string;
    type: AIActionType;
    status: 'planned' | 'executed' | 'cancelled';
    timestamp: string;
    details: { [key: string]: any }; // e.g., { message: "Olá!", channel: "whatsapp" }
    justification: string; // Why the AI chose this action
}

export interface GuestJourney {
    id: string;
    bookingId: string;
    guestId: string;
    status: 'pre-arrival' | 'in-stay' | 'post-stay' | 'completed';
    satisfactionScore: number; // 0-100, predicted by AI
    engagementLevel: 'low' | 'medium' | 'high';
    actionLog: AIAction[];
}

export interface LostAndFoundItem {
    id: string;
    guestId: string;
    guestName: string;
    itemName: string;
    description: string;
    locationFoundOrLost: string;
    date: string; // ISO String
    status: 'lost' | 'found' | 'claimed';
    imageUrl?: string;
    claimerId?: string; // guestId of the person who claimed it
}

export interface ClassifiedsItem {
    id: string;
    guestId: string;
    guestName: string;
    title: string;
    description: string;
    price: number;
    category: 'Venda' | 'Compra' | 'Serviço';
    imageUrl?: string;
    contactInfo?: string; // Could be "Contact via chat"
    status: 'active' | 'sold' | 'inactive';
}

export interface RedeemedReward {
    id: string;
    guestId: string;
    rewardId: string;
    rewardName: string;
    cost: number;
    timestamp: string;
}

// --- Creative Studio Enhancements ---
export interface BrandIdentity {
    logoUrl?: string; // base64 data URL
    vibeKeywords: string; // comma-separated keywords
    targetAudience: string;
}

export interface CampaignIdea {
    goal: string;
    imagePrompts: { title: string; prompt: string; }[];
    videoScript: { title: string; scenes: { scene: number; description: string; }[]; };
    captions: { platform: AdPlatformString; text: string; }[];
    hashtags: string[];
}

// --- Project Management AI Types ---
export interface ProjectHealthAnalysis {
  status: 'Saudável' | 'Em Risco' | 'Fora do Rumo';
  summary: string;
  keyInsights: string[];
  justification: string;
}

export interface ProjectRisk {
  risk: string;
  severity: 'Alto' | 'Média' | 'Baixo';
  recommendation: string;
}

export interface ProjectTaskSuggestion {
    description: string;
    suggestedAssigneeRole: Staff['role'] | 'Qualquer';
}

export interface ProjectFinancialAnalysis {
  status: 'Saudável' | 'Atenção' | 'Crítico';
  summary: string;
  recommendations: string[];
}

export interface PartnerService {
    id: string;
    type: 'Passeio' | 'Aluguel' | 'Trilha' | 'Outro';
    name: string;
    description: string;
    imageUrl: string;
    partnerName: string;
    totalPrice: number;
    commissionType: 'percentage' | 'fixed';
    commissionValue: number;
    bookingUrl?: string;
}

export interface ServiceBooking {
    id: string;
    guestId: string;
    serviceId: string;
    bookingDate: string; 
    serviceDate: string; 
    totalPricePaid: number;
    commissionEarned: number;
    status: 'Solicitado' | 'Confirmado' | 'Realizado' | 'Cancelado';
}

export interface Camera {
    id: string;
    name: string;
    location: string;
    status: 'Online' | 'Offline';
    streamUrl: string; // RTSP/HLS/Image URL
    hasMotion?: boolean;
    propertyUnitId?: PropertyUnitId;
    propertyId?: PropertyUnitId;
    brandPreset?: 'Intelbras' | 'iCSee' | 'Hikvision' | 'Dahua' | 'RTSP Custom' | 'Outro';
    ipAddress?: string;
}

export interface SurveillanceAnalysis {
    description: string;
    threatLevel: 'Nenhum' | 'Baixo' | 'Médio' | 'Alto';
    suggestedAction: string;
}

export interface MotionAlert {
    id: string;
    cameraId: string;
    cameraName: string;
    location: string;
    timestamp: string;
    clipUrl: string;
    read: boolean;
    propertyUnitId?: PropertyUnitId;
    propertyId?: PropertyUnitId;
    aiAnalysis?: SurveillanceAnalysis;
}

export interface SurveillanceSettings {
    bridgeServerUrl: string | null;
}

// --- Email Autopilot Types ---
export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string; // Can contain HTML and placeholders like {{guestName}}
}

export type AutomationTrigger = 'BOOKING_CONFIRMED' | 'PRE_ARRIVAL' | 'POST_STAY' | 'GUEST_BIRTHDAY' | 'GUEST_LEVEL_UP';

export interface AutomatedEmail {
    trigger: AutomationTrigger;
    templateAId: string;
    templateBId?: string | null; // For A/B testing
    isActive: boolean;
    delayDays: number; // e.g., -2 for 2 days before arrival, 1 for 1 day after checkout
    performance?: {
        templateA: { sent: number, opens: number, clicks: number }; // counts, not percentages
        templateB?: { sent: number, opens: number, clicks: number };
    };
}

export type CampaignAudience = 'Todos os Hóspedes' | 'Hóspedes Atuais' | 'Hóspedes Anteriores';

export interface EmailCampaign {
    id: string;
    name: string;
    subject: string;
    templateId: string;
    audience: CampaignAudience;
    status: 'Rascunho' | 'Enviada';
    sentAt?: string;
    performance?: {
        sent: number;
        opens: number; // percentage
        clicks: number; // percentage
    };
}

export interface HelpMessage {
    id: string;
    sender: 'user' | 'agent';
    text: string;
    timestamp: string;
    isLoading?: boolean;
}

export interface PromoCode {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    validUntil: string; // ISO Date string
    minNights?: number;
    isActive: boolean;
}

export interface PackageDeal {
    id: string;
    name: string;
    description: string;
    price: number;
    priceType: 'per_night' | 'total_stay';
    minNights: number;
    validFrom: string; // ISO Date string
    validTo: string;   // ISO Date string
    imageUrl: string;
    includedRoomType: RoomType;
    includedAddOnIds: string[];
    isActive: boolean;
}

// --- Maintenance & Supplier Types ---
export interface Equipment {
  id: string;
  name: string;
  location: string;
  lastMaintenanceDate: string; // ISO Date string
  maintenanceIntervalDays: number;
  nextMaintenanceDate?: string; // Calculated field
  notes?: string;
}

export enum WorkOrderPriority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
  URGENT = 'Urgente'
}
export enum WorkOrderStatus {
  TODO = 'A Fazer',
  IN_PROGRESS = 'Em Andamento',
  DONE = 'Concluído'
}

export interface WorkOrder {
  id: string;
  equipmentId: string;
  roomId?: number;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  openedAt: string; // ISO Date string
  assigneeId?: string;
  notes?: string;
  cost?: number;
}

export enum SupplierCategory {
    FOOD_BEVERAGE = 'Comida & Bebida',
    CLEANING = 'Limpeza',
    MAINTENANCE = 'Manutenção',
    OTHER = 'Outros'
}

export interface Supplier {
  id: string;
  name: string;
  category: SupplierCategory;
  contactName?: string;
  phone?: string;
  email?: string;
  rating: 1 | 2 | 3 | 4 | 5;
}

export enum PurchaseOrderStatus {
  PENDING = 'Pendente',
  SENT = 'Enviada',
  RECEIVED = 'Recebida',
  CANCELLED = 'Cancelada'
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  items: { productId: string; name: string; quantity: number; unitPrice?: number }[];
  totalCost: number;
  status: PurchaseOrderStatus;
  orderedAt: string; // ISO Date string
  receivedAt?: string; // ISO Date string
}

export interface MaintenanceSuggestion {
    possibleCauses: string[];
    recommendedSolutions: string[];
}

export interface EquipmentInfoSuggestion {
    suggestedIntervalDays: number;
    maintenanceChecklist: string[];
}

// --- Digital Menu Types ---
export interface DigitalMenuItem {
    productId: string;
    name: string;
    price: number;
    description: string;
}

export interface DigitalMenuCategory {
    categoryName: string;
    items: DigitalMenuItem[];
}

export interface MarketInsight {
  id: string;
  category: 'Feriado' | 'Evento' | 'Tendência' | 'Concorrência';
  title: string;
  description: string;
  impactLevel: 'Alto' | 'Médio' | 'Baixo';
  date?: string;
}

export interface AIPackageSuggestion {
  id: string;
  name: string;
  description: string;
  price: number;
  includes: string[];
  justification: string;
}

export interface GuestStory {
    id: string;
    guestId: string;
    guestName: string;
    guestProfilePictureUrl?: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    createdAt: string;
    expiresAt: string;
    viewers: string[]; // guestIds
}

export interface CoworkingPlan {
    id: string;
    name: string;
    type: 'hour' | 'day' | 'month';
    price: number;
}

export interface CoworkingDesk {
    id: string;
    name: string;
    status: 'Livre' | 'Ocupada' | 'Em Manutenção';
    currentCheckInId?: string;
}

export interface CoworkingCheckIn {
    id: string;
    deskId: string;
    guestName: string;
    guestPhone?: string;
    startTime: string;
    endTime?: string;
    planId: string;
    status: 'Active' | 'Finished';
    currentItems: SaleItem[]; // This acts as the Comanda (Tab)
}

export interface DeliveryOrder {
    id: string;
    externalOrderId?: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    items: SaleItem[];
    subtotal?: number;
    deliveryFee?: number;
    total: number;
    status: 'Pending' | 'Preparing' | 'Dispatched' | 'Delivered' | 'Cancelled';
    source: 'App Próprio' | 'iFood' | 'WhatsApp' | 'Direct' | 'Rappi' | 'UberEats';
    courierType: 'Motoboy Próprio' | 'iFood' | 'Retirada';
    propertyUnitId?: PropertyUnitId;
    propertyId?: PropertyUnitId;
    paymentMethod?: PaymentMethod;
    financialTransactionId?: string;
    notes?: string;
    createdAt: string;
}

export interface DBState {
    properties: PropertyInfo[];
    currentPropertyId: string;
    subscriptionPlans: SubscriptionPlan[];
    rooms: Room[];
    guests: Guest[];
    bookings: Booking[];
    reviews: Review[];
    products: Product[];
    transactions: Transaction[];
    staff: Staff[];
    staffTasks: StaffTask[];
    chatConversations: ChatConversation[];
    chatMessages: ChatMessage[];
    adCampaigns: AdCampaign[];
    platformConnections: PlatformConnection[];
    socialConnections: SocialConnection[];
    customAudiences: CustomAudience[];
    expenses: Expense[];
    addOns: AddOn[];
    ratePlans: RatePlan[];
    propertyEvents: PropertyEvent[];
    eventParticipants: EventParticipant[];
    localGuideTips: LocalGuideTip[];
    blocks: Block[];
    bookingRestrictions: BookingRestriction[];
    otaConnections: OTAConnection[];
    scheduledPosts: ScheduledPost[];
    sharedSpaces: SharedSpaceControls;
    guestActivities: GuestActivity[];
    activityParticipants: ActivityParticipant[];
    activityComments: ActivityComment[];
    activityContributions: ActivityContribution[];
    siteContent: SiteContent;
    coworkingPlans: CoworkingPlan[];
    coworkingDesks: CoworkingDesk[];
    coworkingCheckIns: CoworkingCheckIn[];
    deliveryOrders: DeliveryOrder[];
    themeSettings: ThemeSettings;
    publishedWorkSchedule: any | null;
    staffPerformanceReviews: Record<string, any>;
    onboardingPlans: Record<string, any>;
    aiEngagementAgent: AIEngagementAgent;
    projects: Project[];
    shoppingLists: ShoppingList[];
    mediaLibrary: MediaAsset[];
    campaignContext: CampaignContext | null;
    managementReport?: ManagementReport | null;
    achievements: Achievement[];
    rewards: Reward[];
    guestPosts: GuestPost[];
    guestStories: GuestStory[];
    loyaltyLevels: LoyaltyLevel[];
    checkIns: CheckIn[];
    synapseChatHistory: SynapseMessage[];
    synapseOrchestrationLog: SynapseOrchestrationLog[];
    guestJourneys: GuestJourney[];
    guestNotifications: GuestNotification[];
    notifications: AppNotification[];
    lostAndFoundItems: LostAndFoundItem[];
    classifiedsItems: ClassifiedsItem[];
    redeemedRewards: RedeemedReward[];
    brandIdentity: BrandIdentity;
    campaignIdeas: CampaignIdea[];
    partnerServices: PartnerService[];
    serviceBookings: ServiceBooking[];
    cameras: Camera[];
    motionAlerts: MotionAlert[];
    surveillanceSettings: SurveillanceSettings;
    emailTemplates: EmailTemplate[];
    emailCampaigns: EmailCampaign[];
    automatedEmails: AutomatedEmail[];
    helpChatHistory: HelpMessage[];
    promoCodes: PromoCode[];
    packageDeals: PackageDeal[];
    // Maintenance & Supplier Data
    equipment: Equipment[];
    workOrders: WorkOrder[];
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
    digitalMenu: DigitalMenuCategory[] | null;
    tables: Table[];
    amenities: string[];
    integrationSettings: IntegrationSettings[];
    integrationSyncLogs: IntegrationSyncLog[];
    integrationBillingMappings: IntegrationBillingMapping[];
    externalApiKeys: ExternalAPIKey[];
}


// --- AI Marketing Lab Types ---

export interface MarketAnalysis {
    domain: string;
    trafficSources: { source: string; percentage: number }[];
    topKeywords: string[];
    audienceProfile: string;
    seoOpportunities: string[];
}

export interface AdSpy {
    competitorName: string;
    strategy: string;
    exampleAds: {
        headline: string;
        description: string;
        creativeDescription: string;
    }[];
    counterStrategy: string[];
}

export interface CreativeAsset {
    assetType: 'Imagem' | 'Vídeo';
    topic: string;
    imagePrompt?: string;
    textOverlays?: string[];
    videoScript?: { scene: number; description: string; duration: string }[];
    suggestedAudio?: string;
}

export interface GrowthHack {
    title: string;
    description: string;
    difficulty: 'Fácil' | 'Média' | 'Difícil';
}

export type GrowthHubInsightType = 'performance' | 'opportunity' | 'creative';

export interface GrowthHubAction {
    title: string;
    description: string;
    icon: string; // Lucide icon name
    action: BriefingAction;
}

export interface GrowthHubInsight {
    type: GrowthHubInsightType;
    title: string;
    text: string;
    action: BriefingAction;
}

export interface WeeklyPostSuggestion {
    day: string;
    platform: AdPlatformString;
    topic: string;
    idea: string;
}

// --- Creative Studio Types ---
export type CreativePlatform = 'Google Imagen' | 'Google Veo' | 'Google Fonts' | 'Google Trends';

// --- AI Strategy Consultant Types ---
export interface BusinessDiagnosis {
    keyInsights: { insight: string; data: string }[];
    crossModuleCorrelations: { finding: string; implication: string }[];
    warnings: { warning: string; recommendation: string }[];
}

export interface ProfitabilityOpportunity {
    pricingSuggestions: {
        roomType: RoomType;
        newPrice: number;
        period: string;
        reason: string;
        weekendSuggestion: string;
    }[];
    packageDeals: {
        dealName: string;
        description: string;
        marketingSuggestion: {
           channel: 'Anúncio no Instagram' | 'Post Orgânico' | 'Campanha de Email';
           headline: string;
           callToAction: string;
       };
    }[];
}

export interface ExpansionSimulation {
    simulationSummary: string;
    estimatedCost: string;
    projectedRevenueIncrease: string;
    estimatedROI: string;
    risksAndConsiderations: string[];
}


// --- Actionable Daily Briefing Types ---
export type BriefingActionType =
  | 'VIEW_BOOKING'
  | 'MODERATE_REVIEW'
  | 'VIEW_CALENDAR'
  | 'CREATE_TASK'
  | 'CREATE_SOCIAL_POST'
  | 'ANALYZE_FINANCIALS'
  | 'OPTIMIZE_PROFITABILITY'
  | 'SIMULATE_EXPANSION'
  | 'CREATE_CAMPAIGN'
  | 'VIEW_SECTION';

export interface BriefingAction {
    type: BriefingActionType;
    label: string;
    payload?: { [key: string]: any };
}

export interface AttentionPoint {
    text: string;
    severity: 'High' | 'Medium' | 'Low';
    action?: BriefingAction;
}

export interface ProactiveSuggestion {
    text: string;
    action?: BriefingAction;
}

export interface IntegrationSettings {
    id: string;
    platform: 'Aloha Pro' | 'Cloudbeds' | 'Beds24' | 'Hotellistat' | 'Outro';
    connected: boolean;
    apiKey?: string;
    apiSecret?: string;
    propertyId?: string;
    lastSync?: string;
    status: 'Ativo' | 'Pausado' | 'Erro' | 'Erro de Autenticação';
    config: {
        syncRooms: boolean;
        syncGuests: boolean;
        syncPOS: boolean;
    };
    updatedAt?: string;
}

export interface IntegrationSyncLog {
    id: string;
    timestamp: string;
    platform: string;
    action: string;
    status: 'Success' | 'Error' | 'Warning';
    details: string;
    updatedAt?: string;
}

export interface IntegrationBillingMapping {
    id: string;
    appItemName: string;
    pmsItemName: string;
    integrationId: string;
    updatedAt?: string;
}

export interface ExternalAPIKey {
    id: string;
    name: string;
    key: string;
    createdAt: string;
    scope: 'Leitura' | 'Leitura/Escrita';
    updatedAt?: string;
}

export interface DailyBriefing {
    summary: {
        title: string;
        points: string[];
    };
    attentionPoints: {
        title: string;
        points: AttentionPoint[];
    };
    proactiveSuggestions: {
        title: string;
        points: ProactiveSuggestion[];
    };
}

export interface DashboardActionCard {
    title: string;
    justification: string;
    icon: string; // Lucide icon name
    action: BriefingAction;
}

export interface POSSuggestion {
    productId: string;
    productName: string;
    justification: string;
    type: 'upsell' | 'cross-sell' | 'promo' | 'personalized';
}

export interface DrinkPairingSuggestion {
    productId: string;
    drinkName: string;
    justification: string;
}

export interface AISuggestedPrice {
    suggestedPrice: number;
    justification: string;
}

export interface AIMenuPriceAnalysis {
    suggestedPrice: number;
    analysis: string;
}

export interface DynamicPriceSuggestion {
    roomId: number;
    roomName: string;
    currentPrice: number;
    suggestedPrice: number;
    justification: string;
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface ReviewAnalysis {
    sentiment: 'Positivo' | 'Negativo' | 'Neutro';
    topics: string[];
}

export interface ReplySuggestion {
    suggestions: string[];
}