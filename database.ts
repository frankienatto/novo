import { Room, Guest, Booking, Review, Product, Transaction, Staff, StaffTask, RoomType, RoomStatus, TaskStatus, ChatConversation, ChatMessage, AdCampaign, PlatformConnection, CustomAudience, Expense, AddOn, PropertyEvent, Block, ScheduledPost, PropertyInfo, LocalGuideTip, SharedSpaceControls, GuestActivity, ActivityParticipant, ActivityComment, ActivityContribution, SiteContent, ThemeSettings, AdminSection, SocialConnection, AIEngagementAgent, Project, ShoppingList, Facility, MediaAsset, SynapseMessage, Achievement, Reward, GuestPost, LoyaltyLevel, GuestStory, CheckIn, SubscriptionPlan, RatePlan, BookingRestriction, OTAConnection, GuestJourney, EventParticipant, GuestNotification, PlaylistSong, LostAndFoundItem, ClassifiedsItem, RedeemedReward, CampaignIdea, BrandIdentity, PartnerService, ServiceBooking, Camera, MotionAlert, SurveillanceSettings, EmailTemplate, EmailCampaign, AutomatedEmail, PromoCode, PackageDeal, Equipment, WorkOrder, Supplier, PurchaseOrder, AppNotification, IntegrationSettings, IntegrationSyncLog, IntegrationBillingMapping, ExternalAPIKey } from './types';

export const allAdminSections: AdminSection[] = [
    'dashboard', 'calendar', 'rooms', 'bookings', 'guests', 'staff', 
    'housekeeping', 'team_manager_ai', 'pos', 'financial_manager', 'inventory', 
    'shopping_list', 'social_media', 'ad_campaign_manager', 'reports', 
    'omni_channel', 'internal_chat', 'ai_strategy_consultant', 'ai_marketing_lab', 
    'creative_studio', 'property_settings', 'projects', 'ai_engagement_agent', 
    'marketing_orchestrator', 'management_center', 'saas_admin', 'subscriptions', 
    'synapse_agent', 'rate_manager', 'channel_manager', 'my_subscription', 
    'guest_journey_ai', 'marketing_dashboard', 'partner_services', 'vigilancia', 'email_autopilot',
    'maintenance_manager', 'supplier_manager', 'integrations', 'reputation_manager'
];

const marketingSections: AdminSection[] = [
    'dashboard', 'reports', 'ai_strategy_consultant', 'social_media',
    'ad_campaign_manager', 'ai_marketing_lab', 'creative_studio', 'ai_engagement_agent', 
    'marketing_orchestrator', 'guest_journey_ai', 'marketing_dashboard', 'email_autopilot',
    'reputation_manager'
];

const receptionSections: AdminSection[] = [
    'dashboard', 'calendar', 'bookings', 'guests', 'pos', 'omni_channel', 'vigilancia'
];

const managementSections: AdminSection[] = ['pos', 'financial_manager', 'inventory', 'shopping_list', 'staff', 'team_manager_ai', 'internal_chat', 'reports', 'projects', 'management_center', 'rate_manager', 'maintenance_manager', 'supplier_manager', 'integrations', 'reputation_manager'];

export const themePresets = {
    admin: [
        {
            name: 'Padrão (Forest Beach)',
            settings: {
                primaryColor: '#2D5A27',
                sidebarColor: '#1F2937',
                backgroundColor: '#F9FAFB',
                textColor: '#1F2937',
                cardBorderRadius: '16px',
                buttonBorderRadius: '8px',
            }
        },
        {
            name: 'Moderno (Azul)',
            settings: {
                primaryColor: '#3B82F6',
                sidebarColor: '#111827',
                backgroundColor: '#F3F4F6',
                textColor: '#111827',
                cardBorderRadius: '12px',
                buttonBorderRadius: '6px',
            }
        },
        {
            name: 'Dark Elegance',
            settings: {
                primaryColor: '#A78BFA', // violet-400
                sidebarColor: '#1E293B', // slate-800
                backgroundColor: '#0F172A', // slate-900
                textColor: '#E2E8F0', // slate-200
                cardBorderRadius: '8px',
                buttonBorderRadius: '4px',
            }
        },
    ],
    guest: [
         {
            name: 'Claro e Arejado',
            settings: {
                primaryColor: '#4CAF50',
                backgroundColor: '#F9FAFB',
                cardColor: '#FFFFFF',
                textColor: '#1F2937',
                cardBorderRadius: '16px',
                buttonBorderRadius: '8px',
            }
        },
        {
            name: 'Praia Noturna',
            settings: {
                primaryColor: '#38BDF8', // lightBlue-400
                backgroundColor: '#0F172A', // slate-900
                cardColor: '#1E293B', // slate-800
                textColor: '#E2E8F0', // slate-200
                cardBorderRadius: '12px',
                buttonBorderRadius: '999px',
            }
        },
        {
            name: 'Tropical (Vibrante)',
            settings: {
                primaryColor: '#EC4899', // pink-500
                backgroundColor: '#FFFBEB', // yellow-50
                cardColor: '#FFFFFF',
                textColor: '#374151',
                cardBorderRadius: '24px',
                buttonBorderRadius: '2px',
            }
        }
    ]
}

const subscriptionPlans: SubscriptionPlan[] = [
    {
        id: 'PLAN_ESSENTIAL',
        name: 'Essencial',
        price: 299,
        description: 'Para a gestão essencial do dia a dia da sua propriedade. Perfeito para começar.',
        features: [
            'dashboard', 'calendar', 'rooms', 'bookings', 'guests', 'pos', 'reports', 'housekeeping', 
            'property_settings', 'my_subscription'
        ]
    },
    {
        id: 'PLAN_GROWTH',
        name: 'Crescimento',
        price: 699,
        description: 'Otimize suas operações e comece a escalar seu marketing com ferramentas inteligentes.',
        features: [
            // All Essencial features
            'dashboard', 'calendar', 'rooms', 'bookings', 'guests', 'pos', 'reports', 'housekeeping', 
            'property_settings', 'my_subscription',
            // Growth features
            'staff', 'projects', 'financial_manager', 'inventory', 'shopping_list', 
            'omni_channel', 'internal_chat', 'rate_manager', 'channel_manager',
            'social_media', 'ad_campaign_manager',
            'synapse_agent', // Intro to AI
            'maintenance_manager', 'supplier_manager'
        ]
    },
    {
        id: 'PLAN_SYNAPSE_AI',
        name: 'Synapse AI',
        price: 1199,
        description: 'Desbloqueie todo o potencial do seu negócio com o poder da suíte completa de automação e inteligência artificial da Synapse.',
        features: allAdminSections.filter(s => s !== 'saas_admin' && s !== 'subscriptions')
    }
];

const ratePlans: RatePlan[] = [
    { id: 'RP_STD', name: 'Tarifa Padrão', description: 'Tarifa flexível padrão.', priceModifier: 0, modifierType: 'fixed', isDefault: true },
    { id: 'RP_NR', name: 'Não Reembolsável', description: 'Tarifa com desconto, sem opção de cancelamento.', priceModifier: -10, modifierType: 'percentage', isDefault: false },
    { id: 'RP_BFAST', name: 'Café da Manhã Incluso', description: 'Inclui nosso delicioso café da manhã.', priceModifier: 35, modifierType: 'fixed', isDefault: false },
];


export const db = {
    currentPropertyId: 'P01',
    properties: [
        {
            id: 'P01',
            name: 'Forest Beach House',
            address: 'Rua Fernandes Francisco Coutinho 329, Canasvieiras, Florianópolis, SC',
            cnpj: '12.345.678/0001-90',
            phone: '(48) 99999-8888',
            email: 'contato@forestbeachhouse.com',
            checkInTime: '14:00',
            checkOutTime: '11:00',
            wifiNetwork: 'ForestHouse_Guest',
            wifiPass: 'natureza123',
            rules: [
                "Respeite o horário de silêncio das 22:00 às 08:00.",
                "É proibido fumar nas áreas internas do hostel, incluindo os quartos.",
                "Não é permitida a entrada de pessoas não hospedadas nos quartos.",
                "Mantenha as áreas comuns limpas e organizadas após o uso, especialmente a cozinha.",
                "Qualquer dano à propriedade do hostel será cobrado do responsável.",
                "O hostel não se responsabiliza por itens pessoais perdidos. Utilize os armários."
            ],
            planId: 'PLAN_SYNAPSE_AI',
            subscriptionStatus: 'Ativa',
            paymentGatewaySettings: {
                stripe: { connected: false, publicKey: '', secretKey: '' },
                mercadoPago: { connected: false, publicKey: '', accessToken: '' },
                paypal: { connected: false, email: '' },
            },
            currency: 'BRL',
            localTaxRate: 0,
            policies: {
                cancellation: 'Cancelamento gratuito até 7 dias antes do check-in para tarifas flexíveis. Tarifas não-reembolsáveis não permitem cancelamento.',
                payment: 'Pagamento de 50% no ato da reserva e 50% no check-in. Aceitamos cartão de crédito, PIX e dinheiro.',
                pets: 'Não aceitamos animais de estimação para garantir o conforto de todos os hóspedes.',
            },
            hostelVibe: 'Nossa vibe é jovem, descontraída e conectada com a natureza. Somos o lugar ideal para surfistas, aventureiros e pessoas que querem fazer novas amizades. A música é parte da nossa alma, com playlists que vão do reggae ao indie.',
            socialLinks: {
                instagram: 'https://instagram.com/forestbeachhouse',
                facebook: 'https://facebook.com/forestbeachhouse',
                tiktok: '',
                twitter: '',
            }
        }
    ] as PropertyInfo[],
    subscriptionPlans,
    ratePlans,
    rooms: [
        { id: 3, name: 'Quarto 03 - Individual c/ ar', type: RoomType.PRIVATE_SINGLE, capacity: 1, basePrice: 150, imageUrl: 'https://i.imgur.com/TP67J8z.jpg', amenities: ['Wi-Fi', 'Ar Condicionado'], status: RoomStatus.AVAILABLE, occupants: [], beds: [] },
        { id: 4, name: 'Quarto 04 - Individual/Casal s/ ar', type: RoomType.PRIVATE_DOUBLE, capacity: 2, basePrice: 120, imageUrl: 'https://i.imgur.com/wgyJ1Bc.jpg', amenities: ['Wi-Fi'], status: RoomStatus.AVAILABLE, occupants: [], beds: [] },
        { id: 5, name: 'Quarto 05 - Casal c/ ar', type: RoomType.PRIVATE_COUPLE, capacity: 2, basePrice: 200, imageUrl: 'https://i.imgur.com/5ULyD1A.jpg', amenities: ['Wi-Fi', 'Ar Condicionado'], status: RoomStatus.AVAILABLE, occupants: [], beds: [] },
        { id: 6, name: 'Quarto 06 - Quádruplo/Familiar', type: RoomType.PRIVATE_FAMILY, capacity: 4, basePrice: 250, imageUrl: 'https://i.imgur.com/SAilyKm.jpg', amenities: ['Wi-Fi', 'TV'], status: RoomStatus.AVAILABLE, occupants: [], beds: [] },
        { id: 7, name: 'Quarto 07 - Casal c/ ar', type: RoomType.PRIVATE_COUPLE, capacity: 2, basePrice: 200, imageUrl: 'https://i.imgur.com/lNBUbAC.jpg', amenities: ['Wi-Fi', 'Ar Condicionado'], status: RoomStatus.AVAILABLE, occupants: [], beds: [] },
        { id: 8, name: 'Quarto 08 - Casal c/ ar', type: RoomType.PRIVATE_COUPLE, capacity: 2, basePrice: 200, imageUrl: 'https://i.imgur.com/Xbq2q0D.jpg', amenities: ['Wi-Fi', 'Ar Condicionado'], status: RoomStatus.AVAILABLE, occupants: [], beds: [] },
        { id: 9, name: 'Quarto 09 - Casal c/ ar', type: RoomType.PRIVATE_COUPLE, capacity: 2, basePrice: 200, imageUrl: 'https://i.imgur.com/4MzLVWt.jpg', amenities: ['Wi-Fi', 'Ar Condicionado'], status: RoomStatus.AVAILABLE, occupants: [], beds: [] },
        { id: 10, name: 'Quarto 10 - Comp. Feminino (4 camas)', type: RoomType.SHARED_DORM_FEMALE, capacity: 4, basePrice: 80, imageUrl: 'https://i.imgur.com/Gv4f88i.jpg', amenities: ['Wi-Fi', 'Armários'], status: RoomStatus.AVAILABLE, occupants: [], beds: Array.from({length: 4}, (_, i) => ({ bedNumber: i + 1, bookingId: null, guestName: null })) },
        { id: 11, name: 'Quarto 11 - Comp. Feminino (4 camas)', type: RoomType.SHARED_DORM_FEMALE, capacity: 4, basePrice: 80, imageUrl: 'https://i.imgur.com/gzzk9Fh.jpg', amenities: ['Wi-Fi', 'Armários'], status: RoomStatus.AVAILABLE, occupants: [], beds: Array.from({length: 4}, (_, i) => ({ bedNumber: i + 1, bookingId: null, guestName: null })) },
        { id: 12, name: 'Quarto 12 - Comp. Masculino (12 camas)', type: RoomType.SHARED_DORM_MALE, capacity: 12, basePrice: 70, imageUrl: 'https://i.imgur.com/LznVK6w.jpg', amenities: ['Wi-Fi', 'Armários'], status: RoomStatus.AVAILABLE, occupants: [], beds: Array.from({length: 12}, (_, i) => ({ bedNumber: i + 1, bookingId: null, guestName: null })) },
        { id: 13, name: 'Quarto Extra (Recepção) (Emergência)', type: RoomType.RECEPTION_EMERGENCY, capacity: 1, basePrice: 0, imageUrl: 'https://i.imgur.com/3FiBYXa.jpg', amenities: [], status: RoomStatus.MAINTENANCE, occupants: [], beds: [] },
        { id: 14, name: 'Sala Temporada A (4 camas)', type: RoomType.SEASONAL_ROOM, capacity: 4, basePrice: 100, imageUrl: 'https://i.imgur.com/awCGOWi.jpg', amenities: ['Wi-Fi'], status: RoomStatus.AVAILABLE, occupants: [], beds: Array.from({length: 4}, (_, i) => ({ bedNumber: i + 1, bookingId: null, guestName: null })) },
        { id: 15, name: 'Sala Temporada B (6 camas)', type: RoomType.SEASONAL_ROOM, capacity: 6, basePrice: 100, imageUrl: 'https://i.imgur.com/7kS9yGH.jpg', amenities: ['Wi-Fi'], status: RoomStatus.AVAILABLE, occupants: [], beds: Array.from({length: 6}, (_, i) => ({ bedNumber: i + 1, bookingId: null, guestName: null })) },
    ] as Room[],

    guests: [
        { id: 'G001', fullName: 'Ana Silva', email: 'ana.silva@example.com', phone: '48999991111', cpf: '111.222.333-44', password: 'password123', birthDate: '1990-08-15', nationality: 'Brasileira', gender: 'Feminino', 
            address: { street: 'Rua das Flores', number: '123', city: 'Florianópolis', state: 'SC', zip: '88000-000' },
            bio: 'Viajante solo apaixonada por yoga e boa comida. Sempre em busca de lugares com alma e boas energias.',
            interests: ['gastronomia', 'yoga', 'leitura'],
            personalitySummary: 'uma viajante que busca relaxamento, boas experiências culinárias e bem-estar',
            theme: 'tropical',
            favoriteTipIds: ['LG04', 'LGH02'],
            itinerary: [],
            unlockedAchievements: ['ACH_FIRST_STEP', 'ACH_CURIOUS'],
            points: 20,
            weeklyPoints: 10,
            conciergeChatHistory: [
                {
                    id: `CONCIERGE_WELCOME_G001`,
                    sender: 'agent',
                    text: `Olá, Ana! Sou seu concierge de IA. Como posso tornar sua estadia inesquecível hoje?\n\nVocê pode me perguntar sobre:\n• "Qual a melhor praia para hoje?"\n• "Onde posso comer uma boa moqueca?"\n• "Qual a senha do Wi-Fi?"`,
                    timestamp: new Date().toISOString()
                }
            ]
        },
        { id: 'G002', fullName: 'Bruno Costa', email: 'bruno.costa@example.com', phone: '48999992222', cpf: '222.333.444-55', password: 'password456', birthDate: '1988-10-20', nationality: 'Argentino', gender: 'Masculino', 
            address: { street: 'Av. Beira Mar', number: '456', city: 'Florianópolis', state: 'SC', zip: '88000-001' },
            bio: 'Surfista e fotógrafo amador. Gosto de explorar trilhas e lugares secretos.',
            interests: ['surf', 'trilhas', 'fotografia'],
            personalitySummary: 'um aventureiro que adora registrar a natureza e pegar ondas',
            theme: 'tropical',
            favoriteTipIds: [],
            itinerary: [],
            unlockedAchievements: ['ACH_FIRST_STEP'],
            points: 10,
            weeklyPoints: 5,
            conciergeChatHistory: [
                {
                    id: `CONCIERGE_WELCOME_G002`,
                    sender: 'agent',
                    text: `Olá, Bruno! Sou seu concierge de IA. Como posso tornar sua estadia inesquecível hoje?\n\nVocê pode me perguntar sobre:\n• "Qual a melhor praia para hoje?"\n• "Onde posso comer uma boa moqueca?"\n• "Qual a senha do Wi-Fi?"`,
                    timestamp: new Date().toISOString()
                }
            ]
        },
        { id: 'G003', fullName: 'Lucas Oliveira', email: 'lucas.o@example.com', phone: '48999993333', cpf: '333.444.555-66', password: 'password789', points: 45, weeklyPoints: 30 },
        { id: 'G004', fullName: 'Mariana Lima', email: 'mari.lima@example.com', phone: '48999994444', cpf: '444.555.666-77', password: 'password101', points: 80, weeklyPoints: 55 },
        { id: 'G005', fullName: 'Pedro Martins', email: 'pedro.m@example.com', phone: '48999995555', cpf: '555.666.777-88', password: 'password202', points: 120, weeklyPoints: 70 },
    ] as Guest[],

    bookings: [
        { id: 'B001', guestId: 'G001', roomId: 1, ratePlanId: 'RP_STD', checkIn: '2024-07-25', checkOut: '2024-07-28', numGuests: 2, totalPrice: 600, status: 'Checked-out', source: 'Website', balance: 0, paymentStatus: 'Paid', reviewId: 'R01', rulesAcknowledged: true, addOns: [], guestJourneyId: 'GJ003' },
        { id: 'B002', guestId: 'G002', roomId: 13, ratePlanId: 'RP_STD', checkIn: '2024-07-27', checkOut: '2024-08-03', numGuests: 1, totalPrice: 420, status: 'Checked-in', source: 'Walk-in', balance: 25, paymentStatus: 'Paid', rulesAcknowledged: true, addOns: [], guestJourneyId: 'GJ001' },
        { 
            id: 'B003', guestId: 'G001', roomId: 11, ratePlanId: 'RP_BFAST', checkIn: '2024-08-15', checkOut: '2024-08-20', numGuests: 4, totalPrice: 1750, status: 'Confirmed', source: 'Phone', balance: 0, paymentStatus: 'Paid', rulesAcknowledged: false, addOns: [],
            travelDetails: {
                transport: 'plane',
                arrivalDateTime: '2024-08-15T14:30',
                flightOrBusNumber: 'AD4020',
                shareRide: true
            }
        },
        { id: 'B004', guestId: 'G002', roomId: 8, ratePlanId: 'RP_STD', checkIn: '2024-07-29', checkOut: '2024-08-01', numGuests: 2, totalPrice: 600, status: 'Checked-in', source: 'Website', balance: 0, paymentStatus: 'Paid', rulesAcknowledged: true, addOns: [], guestJourneyId: 'GJ002' },
        { id: 'B005', guestId: 'G002', roomId: 2, ratePlanId: 'RP_NR', checkIn: '2024-07-10', checkOut: '2024-07-15', numGuests: 1, totalPrice: 600, status: 'Checked-out', source: 'Website', balance: 0, paymentStatus: 'Paid', reviewId: 'R02', rulesAcknowledged: true, addOns: [] },
        { id: 'B006', guestId: 'G001', roomId: 12, ratePlanId: 'RP_STD', checkIn: '2024-07-01', checkOut: '2024-07-05', numGuests: 1, totalPrice: 260, status: 'Checked-out', source: 'Walk-in', balance: 0, paymentStatus: 'Paid', reviewId: 'R03', rulesAcknowledged: true, addOns: [] },
        { id: 'B007', guestId: 'G003', roomId: 14, ratePlanId: 'RP_STD', checkIn: '2024-07-18', checkOut: '2024-07-20', numGuests: 1, totalPrice: 140, status: 'Checked-out', source: 'Website', balance: 0, paymentStatus: 'Paid', reviewId: 'R04' },
        { id: 'B008', guestId: 'G004', roomId: 5, ratePlanId: 'RP_BFAST', checkIn: '2024-07-22', checkOut: '2024-07-25', numGuests: 2, totalPrice: 705, status: 'Checked-out', source: 'Website', balance: 0, paymentStatus: 'Paid', reviewId: 'R05', rulesAcknowledged: true, addOns: [] },
        { id: 'B009', guestId: 'G005', roomId: 12, ratePlanId: 'RP_STD', checkIn: '2024-07-20', checkOut: '2024-07-27', numGuests: 1, totalPrice: 455, status: 'Checked-out', source: 'Walk-in', balance: 0, paymentStatus: 'Paid', reviewId: 'R06', rulesAcknowledged: true, addOns: [] },
        { id: 'B010', guestId: 'G003', roomId: 16, ratePlanId: 'RP_STD', checkIn: '2024-08-16', checkOut: '2024-08-19', numGuests: 1, totalPrice: 210, status: 'Confirmed', source: 'Website', balance: 0, paymentStatus: 'Paid', rulesAcknowledged: false, addOns: [] },
    ] as Booking[],

    reviews: [
        { id: 'R01', bookingId: 'B001', guestId: 'G001', guestName: 'Ana Silva', rating: 5, comment: "Lugar incrível! A equipe é muito atenciosa e a limpeza é impecável. A área da fogueira é um charme. Com certeza voltarei!", date: "2024-07-29", status: 'Approved', source: 'Website', responded: true },
        { id: 'R02', bookingId: 'B005', guestId: 'G002', guestName: 'Bruno Costa', rating: 4, comment: "Adorei a estadia, ótimo custo-benefício. A cozinha compartilhada é muito bem equipada. Só achei o quarto compartilhado um pouco barulhento à noite.", date: "2024-07-16", status: 'Approved', source: 'Booking.com', responded: false },
        { id: 'R03', bookingId: 'B006', guestId: 'G001', guestName: 'Ana Silva', rating: 2, comment: "O chuveiro do meu quarto não estava esquentando direito e a internet estava muito lenta. Precisa melhorar.", date: "2024-07-06", status: 'Approved', source: 'Google', responded: false },
        { id: 'R04', bookingId: 'B007', guestId: 'G003', guestName: 'Lucas Oliveira', rating: 4, comment: "Hostel com uma vibe muito boa! A localização é ótima e as áreas comuns são perfeitas para conhecer gente nova. O barulho de um dos quartos incomodou um pouco, mas no geral foi uma ótima experiência.", date: "2024-07-20", status: 'Approved', source: 'Website', responded: true },
        { id: 'R05', bookingId: 'B008', guestId: 'G004', guestName: 'Mariana Lima', rating: 5, comment: "Que lugar especial! A energia do hostel é contagiante, a equipe é super amigável e tudo é muito limpo. A localização é perfeita, perto de tudo. Fiz amigos incríveis aqui. Recomendo 100%!", date: "2024-07-26", status: 'Approved', source: 'Google', responded: false },
        { id: 'R06', bookingId: 'B009', guestId: 'G005', guestName: 'Pedro Martins', rating: 5, comment: "Melhor hostel de Floripa! A localização é perfeita, o staff é super gente boa e as instalações são ótimas. Os churrascos comunitários são a melhor parte, conheci muita gente legal. Voltarei com certeza!", date: "2024-07-28", status: 'Approved', source: 'Booking.com', responded: true }
    ] as Review[],

    products: [
        { id: 'P01', name: 'Café da Manhã', price: 25, category: 'Comida & Bebida', stock: 100, lowStockThreshold: 20, description: 'Café da manhã completo com frutas, pães e bolos.' },
        { id: 'P02', name: 'Refrigerante', price: 5, costPrice: 2.5, category: 'Comida & Bebida', stock: 80, lowStockThreshold: 24, description: 'Refrigerante lata 350ml bem gelado.' },
        { id: 'P03', name: 'Cerveja Artesanal', price: 15, costPrice: 8, category: 'Comida & Bebida', stock: 40, lowStockThreshold: 12, description: 'Cerveja local artesanal tipo IPA.' },
        { id: 'P04', name: 'Aluguel de Toalha', price: 10, category: 'Aluguel', stock: 50, lowStockThreshold: 10, description: 'Toalha de banho extra limpa.' },
        { id: 'P05', name: 'Aluguel Prancha Surf', price: 50, category: 'Aluguel', stock: 10, lowStockThreshold: 3, description: 'Prancha de surf para iniciantes e intermediários.' },
        { id: 'P06', name: 'Passeio de Barco', price: 80, category: 'Passeio', stock: 1000, lowStockThreshold: 1000 },
        { id: 'P07', name: 'Snack', price: 8, costPrice: 4, category: 'Comida & Bebida', stock: 60, lowStockThreshold: 15 },
        { id: 'P08', name: 'Cadeado', price: 20, costPrice: 10, category: 'Outros', stock: 20, lowStockThreshold: 5 },
        { id: 'P09', name: 'Coworking - 1 Hora', price: 15, category: 'Coworking', stock: 1000, lowStockThreshold: 1000 },
        { id: 'P10', name: 'Coworking - Diária', price: 60, category: 'Coworking', stock: 1000, lowStockThreshold: 1000 },
        { id: 'P11', name: 'Serviço de Lavanderia', price: 40, category: 'Outros', stock: 1000, lowStockThreshold: 1000 },
        { id: 'P12', name: 'Detergente 5L', price: 25, costPrice: 18, category: 'Limpeza', stock: 10, lowStockThreshold: 2 },
        { id: 'P13', name: 'Desinfetante Lavanda 5L', price: 30, costPrice: 22, category: 'Limpeza', stock: 10, lowStockThreshold: 2 },
    ] as Product[],

    transactions: [
        { 
            id: 'T01', 
            items: [{ productId: 'P01', quantity: 1, unitPrice: 25, name: 'Café da Manhã', propertyUnitId: 'beach', propertyId: 'beach' }], 
            total: 25, 
            paymentMethod: 'Conta do Quarto', 
            bookingId: 'B002', 
            guestName: 'Bruno Costa', 
            timestamp: new Date().toISOString(),
            propertyUnitId: 'beach',
            propertyId: 'beach'
        }
    ] as Transaction[],

    staff: [
      { id: 'S00', name: 'SaaS Admin', role: 'Super Administrador', email: 'super@admin.com', password: 'super', permissions: allAdminSections },
      { id: 'FRANKIE', name: 'Frankie Natto', role: 'Super Administrador', email: 'frankienatto@gmail.com', password: 'admin', permissions: allAdminSections },
      { id: 'S01', name: 'Camila Ceballos', role: 'Gerente', email: 'camila.c@hostel.com', password: 'admin', permissions: [...managementSections, ...receptionSections, 'property_settings'], onboardingCompleted: false },
      { id: 'S02', name: 'Francisco Castro', role: 'Administrador Geral', email: 'francisco.c@hostel.com', password: 'admin', permissions: allAdminSections },
      { id: 'S03', name: 'Alezzandro', role: 'Manutenção', email: 'alezzandro@hostel.com', password: 'staff', permissions: ['dashboard'] },
      { id: 'S04', name: 'Alejandro', role: 'Manutenção', email: 'alejandro@hostel.com', password: 'staff', permissions: ['dashboard'] },
      { id: 'S05', name: 'Renan', role: 'Limpeza', email: 'renan@hostel.com', password: 'staff', permissions: ['dashboard'] },
      { id: 'S06', name: 'Tiago Zuccolo', role: 'Financeiro', email: 'tiago.z@hostel.com', password: 'staff', permissions: ['dashboard', 'financial_manager', 'inventory', 'shopping_list', 'pos', 'reports'] },
      { id: 'S07', name: 'Carlos Pereira', role: 'Jardim', email: 'carlos.p@hostel.com', password: 'staff', permissions: ['dashboard'] },
      { id: 'S08', name: 'Vinicios Matias', role: 'Diretor de Marketing', email: 'vinicios.m@hostel.com', password: 'staff', permissions: marketingSections },
      { id: 'S09', name: 'Laura Mendes', role: 'Recepção', email: 'laura.m@hostel.com', password: 'staff', permissions: receptionSections },
    ] as Staff[],

    staffTasks: [
      { id: 'TSK01', description: 'Limpeza completa do Quarto Duplo 04', status: TaskStatus.TODO, roomId: 4, assigneeId: 'S05' },
      { id: 'TSK02', description: 'Verificar ar condicionado do Dormitório 13', status: TaskStatus.IN_PROGRESS, roomId: 13, assigneeId: 'S03' },
      { id: 'TSK03', description: 'Repor toalhas no Quarto Casal 01', status: TaskStatus.DONE, roomId: 1, assigneeId: 'S05' },
      { id: 'TSK04', description: 'Organizar área da recepção', status: TaskStatus.TODO, assigneeId: 'S02' },
      { id: 'TSK05', description: 'Comprar produtos de limpeza', status: TaskStatus.TODO, assigneeId: 'S06' },
      { id: 'TSK06', description: 'Revisar pintura do Quarto 06', status: TaskStatus.AWAITING_CHECK, roomId: 6, assigneeId: 'S03' },
      { id: 'TSK07', description: 'Comprar tinta para o deck', status: TaskStatus.DONE, assigneeId: 'S01', projectId: 'PROJ01', startDate: '2024-07-22', endDate: '2024-07-24' },
      { id: 'TSK08', description: 'Contratar eletricista para nova iluminação', status: TaskStatus.AWAITING_CHECK, assigneeId: 'S01', projectId: 'PROJ01', startDate: '2024-07-25', endDate: '2024-07-29' },
      { id: 'TSK09', description: 'Consertar torneira do Quarto 01', status: TaskStatus.TODO, roomId: 1, assigneeId: 'S03' },
      { id: 'TSK10', description: 'Aparar a grama da área da piscina', status: TaskStatus.TODO, assigneeId: 'S07' },
      { id: 'TSK11', description: 'Regar as plantas da recepção', status: TaskStatus.TODO, assigneeId: 'S07' },
      { id: 'TSK_PROJ01_3', description: 'Lixar e preparar o deck', status: TaskStatus.IN_PROGRESS, assigneeId: 'S03', projectId: 'PROJ01', startDate: '2024-07-25', endDate: '2024-07-28' },
      { id: 'TSK_PROJ01_4', description: 'Pintar o deck', status: TaskStatus.TODO, assigneeId: 'S03', projectId: 'PROJ01', startDate: '2024-07-29', endDate: '2024-08-02' },
      { id: 'TSK_PROJ01_5', description: 'Instalar nova iluminação', status: TaskStatus.TODO, assigneeId: 'S04', projectId: 'PROJ01', startDate: '2024-07-30', endDate: '2024-08-05' },
    ] as StaffTask[],
    
    expenses: [
        { id: 'E01', description: 'Pagamento de funcionários', amount: 8000, category: 'Salários', date: '2024-07-05', propertyUnitId: 'beach', propertyId: 'beach' },
        { id: 'E02', description: 'Conta de luz', amount: 850.50, category: 'Contas', date: '2024-07-10', propertyUnitId: 'beach', propertyId: 'beach' },
        { id: 'E03', description: 'Campanha de marketing - Verão', amount: 1500, category: 'Marketing', date: '2024-07-12', propertyUnitId: 'beach', propertyId: 'beach' },
        { id: 'E04', description: 'Reposição de estoque - Bar', amount: 600, category: 'Suprimentos', date: '2024-07-15', propertyUnitId: 'sanctuary', propertyId: 'sanctuary' },
        { id: 'E05', description: 'Conserto ar condicionado - Quarto 06', amount: 350, category: 'Manutenção', date: '2024-07-20', propertyUnitId: 'beach', propertyId: 'beach' },
        { id: 'E06', description: 'Compra de material para deck', amount: 2500, category: 'Manutenção', date: '2024-07-22', projectId: 'PROJ01', propertyUnitId: 'sanctuary', propertyId: 'sanctuary' },
    ] as Expense[],

    chatConversations: [
        { id: 'C01', guestName: 'Júlia Martins', lastMessage: 'Oi, tudo bem? A praia fica longe?', source: 'Instagram', unread: true, timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), category: 'Informações', summary: 'Pergunta sobre a distância da praia.' },
        { id: 'C02', guestName: 'Fernando Pereira', lastMessage: 'Obrigado!', source: 'Website', unread: false, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), category: 'Serviços', summary: 'Pergunta sobre armários individuais.' },
        { id: 'C03', guestName: 'Carla Dias', lastMessage: 'Qual o valor do café da manhã?', source: 'Facebook', unread: false, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), category: 'Preços', summary: 'Pergunta o preço do café da manhã.' },
        { 
            id: 'GUESTCHAT_G001_G002', 
            guestName: 'Chat: Ana Silva & Bruno Costa',
            participants: [
                { guestId: 'G001', guestName: 'Ana Silva' },
                { guestId: 'G002', guestName: 'Bruno Costa' }
            ],
            lastMessage: 'Fechado! Nos vemos lá.', 
            source: 'Website', 
            unread: false, 
            timestamp: new Date(Date.now() - 3600000).toISOString(), 
            isInternal: false 
        },
        { id: 'CHAT_GA01', guestName: 'Grupo: Churrasco na Piscina', lastMessage: 'E aí, galera!', source: 'Website', unread: false, timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), isInternal: false, isGroupChat: true, activityId: 'GA01' },
        { id: 'CHAT_GA02', guestName: 'Grupo: Passeio para a Praia Mole', lastMessage: 'Vamos nessa!', source: 'Website', unread: false, timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), isInternal: false, isGroupChat: true, activityId: 'GA02' },
        { 
            id: 'CHAT_PRE_ARRIVAL_B003', 
            guestName: 'Grupo Pré-Chegada: 15/08 - 22/08',
            lastMessage: 'Alguém chegando pelo aeroporto na quinta?', 
            source: 'Website', 
            unread: true, 
            timestamp: new Date(Date.now() - 3600000).toISOString(), 
            isInternal: false,
            isGroupChat: true,
            activityId: 'PRE_ARRIVAL_B003' // Using a fake activityId to group pre-arrival guests for the same week
        },
    ] as ChatConversation[],

    chatMessages: [
        { id: 'M01_1', conversationId: 'C01', senderId: 'GUEST_WEBSITE_Júlia_Martins', senderName: 'Júlia Martins', text: 'Oi, tudo bem? A praia fica longe?', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
        { id: 'M02_1', conversationId: 'C02', senderId: 'GUEST_WEBSITE_Fernando_Pereira', senderName: 'Fernando Pereira', text: 'Olá, gostaria de saber se vocês têm armários individuais.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 - 60000).toISOString() },
        { id: 'M02_2', conversationId: 'C02', senderId: 'AGENT_SYSTEM', senderName: 'Atendente', text: 'Olá, Fernando! Sim, todos os nossos dormitórios possuem armários individuais. Você pode trazer seu cadeado ou alugar um na recepção.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 - 30000).toISOString() },
        { id: 'M02_3', conversationId: 'C02', senderId: 'GUEST_WEBSITE_Fernando_Pereira', senderName: 'Fernando Pereira', text: 'Obrigado!', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        { id: 'M03_1', conversationId: 'C03', senderId: 'GUEST_WEBSITE_Carla_Dias', senderName: 'Carla Dias', text: 'Qual o valor do café da manhã?', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
        { id: 'M03_2', conversationId: 'C03', senderId: 'AGENT_SYSTEM', senderName: 'Atendente', text: 'Olá Carla! Nosso café da manhã especial custa R$25 por pessoa.', timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString() },
        { id: 'GM_01', conversationId: 'GUESTCHAT_G001_G002', senderId: 'G002', senderName: 'Bruno Costa', text: 'E aí, Ana! Vi que você também curte fotografia. Animada pra explorar as praias daqui?', timestamp: new Date(Date.now() - 3700000).toISOString() },
        { id: 'GM_02', conversationId: 'GUESTCHAT_G001_G002', senderId: 'G001', senderName: 'Ana Silva', text: 'Opa, com certeza! A luz do fim de tarde parece incrível. Vamos combinar de ir na Praia Mole amanhã?', timestamp: new Date(Date.now() - 3650000).toISOString() },
        { id: 'GM_03', conversationId: 'GUESTCHAT_G001_G002', senderId: 'G002', senderName: 'Bruno Costa', text: 'Fechado! Nos vemos lá.', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 'PA_M01', conversationId: 'CHAT_PRE_ARRIVAL_B003', senderId: 'G001', senderName: 'Ana Silva', text: 'E aí, pessoal! Animados pra semana que vem?', timestamp: new Date(Date.now() - 3700000).toISOString() },
    ] as ChatMessage[],
    
    adCampaigns: [
        { 
            id: 'AD01', name: 'Promoção de Verão 2024', platform: 'Meta Ads', status: 'Ativa', rules: [],
            adSets: [
                {
                    id: 'AS01-1', name: 'Público Amplo - Surfistas', status: 'Ativa', 
                    audience: { name: 'Interesses em Surf', description: 'Pessoas de 18-35 anos interessadas em surf, praias e viagens de aventura.' },
                    kpis: { impressions: 35000, clicks: 1200, cost: 950.00, conversions: 42 },
                    ads: [
                        { id: 'A01-1-1', name: 'Vídeo Pôr do Sol', status: 'Ativa', copy: { headline: 'Sua Onda Perfeita te Espera', description: 'Pegue as melhores ondas e relaxe no Forest Beach House.' }, creativeUrl: 'https://i.imgur.com/rMIE6sS.jpg' }
                    ]
                }
            ]
        },
        { 
            id: 'AD02', name: 'Nômades Digitais - Foco em Coworking', platform: 'Google Ads', status: 'Ativa', rules: [],
            adSets: [
                {
                    id: 'AS02-1', name: 'Pesquisa - "Coworking Florianópolis"', status: 'Ativa', 
                    audience: { name: 'Palavras-chave de Coworking', description: 'Usuários pesquisando por "hostel com coworking", "trabalho remoto florianópolis".' },
                    kpis: { impressions: 12500, clicks: 875, cost: 1250.70, conversions: 25 },
                    ads: [
                        { id: 'A02-1-1', name: 'Anúncio de Texto - Produtividade', status: 'Ativa', copy: { headline: 'Hostel com Coworking em Floripa', description: 'Trabalhe com vista para o verde e a 5 minutos da praia. Wi-fi de alta velocidade!' } }
                    ]
                }
            ]
        },
        { 
            id: 'AD03', name: 'Campanha Institucional', platform: 'Meta Ads', status: 'Pausada', rules: [],
            adSets: [
                {
                    id: 'AS03-1', name: 'Visitantes do Site - 30 dias', status: 'Pausada', 
                    audience: { name: 'Remarketing', description: 'Pessoas que visitaram o site nos últimos 30 dias.' },
                    kpis: { impressions: 8000, clicks: 250, cost: 300.50, conversions: 8 },
                     ads: [
                        { id: 'A03-1-1', name: 'Carrossel de Fotos', status: 'Pausada', copy: { headline: 'Sentiu Saudades?', description: 'Volte para o Forest Beach House e aproveite um desconto de 10% na sua próxima reserva.' }, creativeUrl: 'https://i.imgur.com/TP67J8z.jpg' }
                    ]
                }
            ]
        },
    ] as AdCampaign[],

    platformConnections: [
        { platform: 'Meta Ads', connected: false, accountName: null, accountId: null },
        { platform: 'Google Ads', connected: false, accountName: null, accountId: null },
    ] as PlatformConnection[],

    socialConnections: [
        { platform: 'Facebook', connected: false, handleOrNumber: null },
        { platform: 'Instagram', connected: false, handleOrNumber: null },
        { platform: 'Twitter', connected: false, handleOrNumber: null },
        { platform: 'WhatsApp', connected: false, handleOrNumber: null },
    ] as SocialConnection[],

    customAudiences: [] as CustomAudience[],
    
    addOns: [
        { id: 'AO01', name: 'Café da Manhã Completo', price: 35 },
        { id: 'AO02', name: 'Aluguel de Toalha Extra', price: 10 },
        { id: 'AO03', name: 'Passeio de Barco para Ilha do Campeche', price: 150 },
        { id: 'AO04', name: 'Late Check-out (até 14h)', price: 50 },
    ] as AddOn[],

    propertyEvents: [
        { id: 'EV01', title: 'Churrasco Comunitário', description: 'Venha socializar e aproveitar um ótimo churrasco!', date: '2024-08-03', time: '19:00', imageUrl: 'https://i.imgur.com/a72sIy0.jpg', icon: 'Users', location: 'Forest Beach House Hostel' },
        { id: 'EV02', title: 'Noite de Fogueira e Violão', description: 'Música ao vivo e marshmallow na fogueira.', date: '2024-08-05', time: '20:00', imageUrl: 'https://i.imgur.com/JK2mhio.jpg', icon: 'Music', location: 'Jardim do Forest Beach House Hostel' },
        { id: 'EV03', title: 'Aula de Yoga no Jardim', description: 'Comece o dia renovado com uma aula de yoga ao ar livre.', date: '2024-08-10', time: '08:00', imageUrl: 'https://i.imgur.com/5hRG2y0.jpg', icon: 'Leaf', location: 'Jardim do Forest Beach House Hostel'},
    ] as PropertyEvent[],

    eventParticipants: [] as EventParticipant[],

    localGuideTips: [
        { id: 'LG01', category: 'Praias', title: 'Praia de Canasvieiras', description: 'Águas calmas e ótima infraestrutura. Perfeita para famílias e para quem gosta de agito.', imageUrl: 'https://i.imgur.com/0ayxhMh.jpg', icon: 'Waves', location: 'Praia de Canasvieiras, Florianópolis, SC' },
        { id: 'LG02', category: 'Praias', title: 'Praia da Lagoinha', description: 'Um paraíso de águas cristalinas e tranquilas, cercada por natureza. Ideal para relaxar.', imageUrl: 'https://i.imgur.com/cmXKvbn.jpg', icon: 'Sun', location: 'Praia Lagoinha do Norte, Florianópolis, SC' },
        { id: 'LG03', category: 'Trilhas', title: 'Trilha do Morro das Aranhas', description: 'Uma caminhada desafiadora que leva a uma vista espetacular da Praia do Santinho.', imageUrl: 'https://i.imgur.com/T6FCS84.jpg', icon: 'Mountain', location: 'Início da Trilha do Morro das Aranhas, Florianópolis' },
        { id: 'LG04', category: 'Restaurantes', title: 'Restaurante Pôr do Sol', description: 'Frutos do mar frescos com uma vista incrível do pôr do sol em Santo Antônio de Lisboa.', imageUrl: 'https://i.imgur.com/vvpYU9t.jpg', icon: 'UtensilsCrossed', location: 'Santo Antônio de Lisboa, Florianópolis, SC' },
        { id: 'LG05', category: 'Praias', title: 'Praia Mole', description: 'Famosa por suas ondas fortes, é o point dos surfistas e do público jovem. Quiosques descolados agitam a orla.', imageUrl: 'https://i.imgur.com/mCvOu7G.jpg', icon: 'Waves', location: 'Praia Mole, Florianópolis, SC' },
        { id: 'LG06', category: 'Praias', title: 'Praia da Joaquina', description: 'Além do surf, suas dunas são perfeitas para a prática de sandboard. Visual incrível.', imageUrl: 'https://i.imgur.com/0pSJC6y.jpg', icon: 'Waves', location: 'Praia da Joaquina, Florianópolis, SC' },
        { id: 'LG07', category: 'Praias', title: 'Campeche', description: 'Extensa faixa de areia branca e mar agitado. Em frente, a paradisíaca Ilha do Campeche.', imageUrl: 'https://i.imgur.com/Jprve1v.jpg', icon: 'Waves', location: 'Praia do Campeche, Florianópolis, SC' },
        { id: 'LG08', category: 'Trilhas', title: 'Trilha da Costa da Lagoa', description: 'Caminhada pela mata, passando por vilarejos de pescadores, cachoeiras e restaurantes com comida local.', imageUrl: 'https://i.imgur.com/JK4arbJ.jpg', icon: 'Mountain', location: 'Canto dos Araçás, Lagoa da Conceição, Florianópolis' },
        { id: 'LG09', category: 'Trilhas', title: 'Trilha do Gravatá', description: 'Curta e com uma vista deslumbrante, essa trilha leva a uma pequena e charmosa praia secreta.', imageUrl: 'https://i.imgur.com/bwsuHCA.jpg', icon: 'Mountain', location: 'Trilha do Gravatá, Florianópolis, SC' },
        { id: 'LGH01', category: 'Hostel', title: 'Horário do Café da Manhã', description: 'Nosso café da manhã é servido diariamente das 08:00 às 10:00 na área comum.', imageUrl: 'https://i.imgur.com/6rIg6aw.jpg', icon: 'Coffee', location: 'Forest Beach House Hostel' },
        { id: 'LGH02', category: 'Hostel', title: 'Regras do Hostel', description: 'Conheça nossas regras para uma convivência harmoniosa e segura para todos os hóspedes.', imageUrl: 'https://i.imgur.com/mwACY5o.jpg', icon: 'Sun', location: 'Forest Beach House Hostel' },
        { id: 'LG10', category: 'Praias', title: 'Praia dos Ingleses', description: 'Uma das praias mais movimentadas do norte da ilha, com ótima infraestrutura, dunas e águas mais quentes.', imageUrl: 'https://i.imgur.com/qrVspmr.jpg', icon: 'Waves', location: 'Praia dos Ingleses, Florianópolis, SC' },
        { id: 'LG11', category: 'Passeios', title: 'Centro Histórico', description: 'Explore a arquitetura colonial, o Mercado Público, a Catedral Metropolitana e a famosa Figueira da Praça XV.', imageUrl: 'https://i.imgur.com/5wlCZUi.jpg', icon: 'Building', location: 'Centro, Florianópolis, SC' }
    ] as LocalGuideTip[],

    blocks: [] as Block[],
    bookingRestrictions: [] as BookingRestriction[],
    otaConnections: [
        { platform: 'Booking.com', connected: true, propertyId: '1234567', lastSync: new Date(Date.now() - 3600 * 1000).toISOString(), markup: 15 },
        { platform: 'Airbnb', connected: false, propertyId: null, lastSync: null, markup: 18 },
        { platform: 'Expedia', connected: false, propertyId: null, lastSync: null, markup: 20 },
        { platform: 'Beds24', connected: false, propertyId: null, lastSync: null, markup: 0 },
    ] as OTAConnection[],
    
    scheduledPosts: [] as ScheduledPost[],

    sharedSpaces: {
        livingRoomTV: {
            isOn: false,
            volume: 25,
            currentApp: null,
        },
        commonAreaPlaylist: {
            nowPlaying: {
                id: 'S001',
                title: 'Island in the Sun',
                artist: 'Weezer',
                addedByGuestId: 'G001',
                addedByGuestName: 'Ana',
                votes: ['G001', 'G004']
            },
            queue: [
                {
                    id: 'S002',
                    title: 'Santeria',
                    artist: 'Sublime',
                    addedByGuestId: 'G002',
                    addedByGuestName: 'Bruno',
                    votes: ['G002']
                }
            ]
        },
        kitchenCleanliness: 'ok',
    } as SharedSpaceControls,

    guestActivities: [
        { id: 'GA01', creatorId: 'G002', creatorName: 'Bruno Costa', title: 'Churrasco na Piscina', description: 'Vamos organizar um churrasco no sábado! Quem topa? Faremos uma vaquinha para a carne e bebida.', date: new Date(Date.now() + 2 * 86400000).toISOString(), maxParticipants: 15, crowdfundingTarget: 300, chatConversationId: 'CHAT_GA01', photoAlbum: [] },
        { id: 'GA02', creatorId: 'G001', creatorName: 'Ana Silva', title: 'Passeio para a Praia Mole', description: 'Vamos combinar de ir para a Praia Mole amanhã de manhã? A gente divide um Uber!', date: new Date(Date.now() + 86400000).toISOString(), maxParticipants: 6, chatConversationId: 'CHAT_GA02', photoAlbum: [] },
    ] as GuestActivity[],
    
    activityParticipants: [
        { activityId: 'GA01', guestId: 'G002', guestName: 'Bruno Costa' },
        { activityId: 'GA02', guestId: 'G001', guestName: 'Ana Silva' },
        { activityId: 'GA02', guestId: 'G002', guestName: 'Bruno Costa' },
    ] as ActivityParticipant[],

    activityComments: [
        { id: 'AC01', activityId: 'GA02', guestId: 'G002', guestName: 'Bruno Costa', text: 'To dentro! Que horas?', timestamp: new Date(Date.now() - 100000).toISOString() },
        { id: 'AC02', activityId: 'GA02', guestId: 'G001', guestName: 'Ana Silva', text: 'Umas 9h?', timestamp: new Date().toISOString() },
    ] as ActivityComment[],

    activityContributions: [
        { activityId: 'GA01', guestId: 'G002', amount: 30 },
        { activityId: 'GA01', guestId: 'G004', amount: 30 },
    ] as ActivityContribution[],

    siteContent: {
        hero: {
            title: 'Sua Casa Longe de Casa',
            subtitle: 'Conecte-se com a natureza, a praia e novas experiências no Forest Beach House.',
            imageUrl: 'https://i.imgur.com/jr0J5UN.jpg',
        },
        whyUs: {
            title: 'Por Que Nos Amar?',
            subtitle: 'Criamos um espaço onde cada detalhe é pensado para sua felicidade.',
            items: [
                { icon: 'Waves', title: 'Perto da Praia', text: 'A poucos passos da areia, sinta a brisa do mar sempre que quiser.' },
                { icon: 'Users', title: 'Comunidade Vibrante', text: 'Conecte-se com viajantes de todo o mundo e faça amigos para a vida.' },
                { icon: 'Leaf', title: 'Imersão na Natureza', text: 'Nosso jardim é um oásis de tranquilidade para você recarregar as energias.' },
            ]
        },
        about: {
            title: 'Nosso Refúgio em Canasvieiras',
            text1: 'O Forest Beach House é mais que um hostel, é um ponto de encontro. Aqui, a vibe descontraída da praia encontra o abraço acolhedor da floresta.',
            text2: 'Seja para relaxar em nossas redes, trabalhar no nosso coworking ou socializar na cozinha compartilhada, criamos um ambiente para você se sentir em casa e viver experiências autênticas.',
            imageUrls: [
                'https://i.imgur.com/NfMtdaz.jpg',
                'https://i.imgur.com/MLce0GF.jpg',
                'https://i.imgur.com/Nbzbcej.jpg',
                'https://i.imgur.com/r1Fdi4d.jpg'
            ]
        },
        experiences: {
            title: 'Experiências Únicas',
            items: [
                { title: "Noites de Fogueira", description: "Música, histórias e novas amizades sob as estrelas.", imageUrl: "https://i.imgur.com/y6CnfTv.jpg" },
                { title: "Churrascos Comunitários", description: "Prove o autêntico churrasco e compartilhe momentos.", imageUrl: "https://i.imgur.com/7LNw44S.jpg" },
                { title: "Aulas de Surf", description: "Aprenda a surfar nas melhores ondas de Canasvieiras.", imageUrl: "https://i.imgur.com/QzGbIJ9.jpg" },
            ]
        },
        facilities: [
            { id: 'FAC01', name: "WiFi Gratuito de Alta Velocidade", icon: "Wifi", description: "Conecte-se com o mundo ou trabalhe remotamente em qualquer lugar do hostel.", imageUrl: "https://i.imgur.com/wz9fCqS.jpg", longDescription: "Oferecemos uma conexão de fibra ótica de alta velocidade em todas as áreas do hostel, desde os quartos até o nosso jardim. Perfeito para nômades digitais e para quem não abre mão de estar conectado." }, 
            { id: 'FAC02', name: "Cafeteria Aconchegante", icon: "UtensilsCrossed", description: "Comece seu dia com um café especial e lanches deliciosos em nosso espaço.", imageUrl: "https://i.imgur.com/MLce0GF.jpg", longDescription: "Nossa cafeteria é o lugar perfeito para um café da manhã reforçado, um lanche da tarde ou simplesmente para relaxar com um bom livro e uma xícara de café." }, 
            { id: 'FAC03', name: "Área de Jogos e Social", icon: "Sparkles", description: "Divirta-se e conheça outros viajantes em nossa área de entretenimento.", imageUrl: "https://i.imgur.com/Nbzbcej.jpg", longDescription: "Com mesa de sinuca, jogos de tabuleiro e um ambiente descontraído, nossa área social é o coração do hostel, onde as amizades acontecem." }, 
            { id: 'FAC04', name: "Espaço Coworking", icon: "Library", description: "Um lugar tranquilo e inspirador para nômades digitais manterem a produtividade.", imageUrl: "https://i.imgur.com/yP5xLnt.jpg", longDescription: "Precisa trabalhar? Nosso espaço de coworking oferece estações de trabalho confortáveis, tomadas e um ambiente focado para você não perder o prazo." },
            { id: 'FAC05', name: "Cozinha Compartilhada Completa", icon: "UtensilsCrossed", description: "Prepare suas próprias refeições e economize, sentindo-se em casa.", imageUrl: "https://i.imgur.com/NfMtdaz.jpg", longDescription: "Totalmente equipada com fogão, geladeira, micro-ondas e todos os utensílios que você precisa para preparar suas refeições e compartilhar experiências gastronômicas." }, 
            { id: 'FAC06', name: "Sala de TV com Filmes", icon: "Tv", description: "Relaxe e assista seus filmes e séries favoritas após um dia de praia.", imageUrl: "https://i.imgur.com/Xw2Yj2A.jpg", longDescription: "Com sofás confortáveis, uma TV grande e acesso a serviços de streaming, nossa sala de TV é perfeita para dias chuvosos ou para relaxar à noite." }, 
            { id: 'FAC07', name: "Lavanderia Self-service", icon: "WashingMachine", description: "Mantenha suas roupas limpas e prontas para a próxima aventura.", imageUrl: "https://i.imgur.com/BJIaW3T.jpg", longDescription: "Viaje leve! Nossa lavanderia está disponível para os hóspedes usarem, garantindo que você tenha sempre roupas limpas durante sua estadia." },
            { id: 'FAC08', name: "Jardim e Gazebo", icon: "Sun", description: "Um refúgio verde para ler, meditar ou simplesmente relaxar ao ar livre.", imageUrl: "https://i.imgur.com/r1Fdi4d.jpg", longDescription: "Nosso jardim exuberante com um gazebo charmoso é o local ideal para se desconectar, ler um livro na rede ou simplesmente apreciar a natureza." },
        ],
        cta: {
            title: 'Pronto para a Aventura?',
            subtitle: 'Sua cama no paraíso está esperando por você. Faça memórias inesquecíveis.',
            buttonText: 'Reservar Minha Estadia',
        }
    } as SiteContent,
    themeSettings: {
        adminPanel: {
            primaryColor: '#2D5A27',
            sidebarColor: '#1F2937',
            backgroundColor: '#F9FAFB',
            textColor: '#1F2937',
            menuTextColor: '#E5E7EB',
            logoUrl: 'https://i.imgur.com/jiDNGTh.png',
            headerTitles: {},
            cardBorderRadius: '16px',
            buttonBorderRadius: '8px',
        },
        guestPortal: {
            primaryColor: '#2D5A27',
            backgroundColor: '#F9FAFB',
            cardColor: '#FFFFFF',
            textColor: '#1F2937',
            welcomeTitle: "Minha Estadia",
            welcomeSubtitle: "Olá, {guestName}! Bem-vindo(a) ao seu painel.",
            cardTitles: {
                quickAccess: "Acesso Rápido",
                roomControls: "Controles do Quarto",
                tvControls: "Controle da TV da Sala",
                services: "Serviços & Fatura",
                communityHub: "Explore o Hostel",
            },
            cardBorderRadius: '16px',
            buttonBorderRadius: '8px',
        },
        publicSite: {
            headerLayout: 'default',
            searchLayout: 'inline',
            aboutGalleryLayout: 'grid',
            experiencesLayout: 'grid',
            facilitiesLayout: 'grid',
            footerLayout: 'default',
            primaryColor: '#2D5A27',
            backgroundColor: '#F9FAFB',
            textColor: '#1F2937',
            cardBackgroundColor: '#FFFFFF',
            logoUrl: 'https://i.imgur.com/uEFOBeo.png',
            logoHeight: '80px',
            cardBorderRadius: '16px',
            buttonBorderRadius: '8px',
        }
    } as ThemeSettings,
    publishedWorkSchedule: null,
    staffPerformanceReviews: {},
    onboardingPlans: {},
    aiEngagementAgent: {
        targetAudienceDescription: '',
        connectedAccount: null,
        personas: [],
        isRunning: false,
        log: [],
    } as AIEngagementAgent,
    projects: [
        { id: 'PROJ01', name: 'Reforma da Área da Piscina', description: 'Renovar o deck, pintar e adicionar nova iluminação.', status: 'Ativo', ownerId: 'S01', taskIds: ['TSK07', 'TSK08'], createdAt: '2024-07-20', budget: 15000 },
        { id: 'PROJ02', name: 'Lançamento Campanha de Inverno', description: 'Criar e executar a campanha de marketing para a baixa temporada.', status: 'Ativo', ownerId: 'S08', taskIds: [], createdAt: '2024-07-25', budget: 8000 },
        { id: 'PROJ03', name: 'Implantação do Sistema de Reservas', description: 'Finalizar a configuração e treinar a equipe no novo sistema.', status: 'Concluído', ownerId: 'S02', taskIds: [], createdAt: '2024-06-10' },
    ] as Project[],
    shoppingLists: [
        {
            id: 'SL01',
            name: 'Compras Semanais Julho #4',
            status: 'Pendente',
            createdAt: '2024-07-28',
            items: [
                { id: 'SLI01', name: 'Tinta para deck', category: 'Manutenção', status: 'Pendente', projectId: 'PROJ01' },
                { id: 'SLI02', name: 'Lâmpadas LED', category: 'Manutenção', status: 'Pendente', projectId: 'PROJ01' },
                { id: 'SLI03', name: 'Sacos de lixo (100L)', category: 'Limpeza', status: 'Comprado' },
            ]
        }
    ] as ShoppingList[],
    mediaLibrary: [
        { id: 'MED01', type: 'image', url: 'https://i.imgur.com/y6CnfTv.jpg', prompt: 'Noite de Fogueira', createdAt: new Date().toISOString() },
        { id: 'MED02', type: 'image', url: 'https://i.imgur.com/7LNw44S.jpg', prompt: 'Churrasco Comunitário', createdAt: new Date().toISOString() },
    ] as MediaAsset[],
    campaignContext: null,
    achievements: [
        { id: 'ACH_FIRST_STEP', name: 'Primeiros Passos', description: 'Fez login no Portal do Hóspede pela primeira vez.', icon: 'Footprints' },
        { id: 'ACH_EXPLORER', name: 'Explorador Nato', description: 'Favoritou sua primeira dica no guia Explorar.', icon: 'Map' },
        { id: 'ACH_SOCIALITE', name: 'Puxou Assunto', description: 'Iniciou um chat com outro hóspede.', icon: 'MessageSquare' },
        { id: 'ACH_HOST', name: 'Anfitrião da Galera', description: 'Criou sua primeira atividade na comunidade.', icon: 'Megaphone' },
        { id: 'ACH_CURIOUS', name: 'Interessado', description: 'Personalizou seus interesses nas configurações.', icon: 'Sparkles' },
        { id: 'ACH_DESIGNER', name: 'Meu Estilo', description: 'Escolheu um tema para o seu portal.', icon: 'Palette' },
        { id: 'ACH_PLANNER', name: 'Planejador de Viagens', description: 'Adicionou um item ao seu roteiro.', icon: 'Route' },
        { id: 'ACH_SOCIAL_BUTTERFLY', name: 'Borboleta Social', description: 'Curtiu ou comentou em um post pela primeira vez.', icon: 'ThumbsUp' },
        { id: 'ACH_CHECKIN_MASTER', name: 'Mestre do Check-in', description: 'Fez seu primeiro check-in em um local.', icon: 'MapPin' },
        { id: 'ACH_PROFILE_PIC', name: 'Identidade Revelada', description: 'Adicionou uma foto de perfil pela primeira vez.', icon: 'Camera' },
        { id: 'ACH_BIO', name: 'Contador de Histórias', description: 'Escreveu uma bio para se apresentar à comunidade.', icon: 'BookOpen' },
    ] as Achievement[],
    rewards: [
        { id: 'REW01', name: 'Café da Manhã Grátis', description: 'Um delicioso café da manhã por nossa conta.', cost: 50, icon: 'Coffee' },
        { id: 'REW02', name: '1 Drink no Bar', description: 'Escolha um drink especial do nosso cardápio.', cost: 75, icon: 'Beer' },
        { id: 'REW03', name: 'Late Check-out', description: 'Faça seu check-out até as 14h, sem pressa.', cost: 120, icon: 'Clock' },
        { id: 'REW04', name: 'Aluguel de Toalha Grátis', description: 'Uma toalha limpinha para sua estadia.', cost: 20, icon: 'CheckSquare' },
        { id: 'REW05', name: 'Aluguel de Prancha de Surf (2h)', description: 'Aproveite as ondas com uma de nossas pranchas.', cost: 150, icon: 'Waves' },
        { id: 'REW06', name: '1 Hora de Coworking', description: 'Use nosso espaço de coworking para focar no trabalho.', cost: 30, icon: 'Laptop' },
    ] as Reward[],
    guestPosts: [
        { 
            id: 'GP_01', 
            guestId: 'G002', 
            guestName: 'Bruno Costa', 
            text: 'Dia incrível de surf na Praia Mole! Altas ondas! Quem anima amanhã?', 
            mediaUrl: 'https://i.imgur.com/Gv4f88i.jpg', 
            mediaType: 'image',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            likes: ['G001', 'G004'],
            comments: [
                { guestId: 'G001', guestName: 'Ana Silva', text: 'Eu animo! Me chama!', timestamp: new Date(Date.now() - 1800000).toISOString() }
            ]
        },
        { 
            id: 'GP_VIDEO_01', 
            guestId: 'G001', 
            guestName: 'Ana Silva', 
            text: 'Aula de yoga no nascer do sol foi mágica! ✨🧘‍♀️', 
            mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-doing-yoga-on-the-beach-at-sunrise-1560-large.mp4', 
            mediaType: 'video',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            likes: ['G002', 'G005'],
            comments: [
                { guestId: 'G002', guestName: 'Bruno Costa', text: 'Visual incrível!', timestamp: new Date(Date.now() - 3600000).toISOString() }
            ]
        },
        { 
            id: 'GP_02', 
            guestId: 'G004', 
            guestName: 'Mariana Lima', 
            text: 'Alguém recomenda um bom restaurante de frutos do mar aqui perto?', 
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            likes: ['G005'],
            comments: []
        }
    ] as GuestPost[],
    guestStories: [
        {
            id: 'GS_01',
            guestId: 'G001',
            guestName: 'Ana Silva',
            mediaUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop',
            mediaType: 'image',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
            viewers: []
        },
        {
            id: 'GS_02',
            guestId: 'G002',
            guestName: 'Bruno Costa',
            mediaUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1000&auto=format&fit=crop',
            mediaType: 'image',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
            viewers: []
        }
    ] as GuestStory[],
    loyaltyLevels: [
        { id: 'LL01', name: 'Novato', minPoints: 0, icon: 'Award' },
        { id: 'LL02', name: 'Explorador', minPoints: 50, icon: 'Map' },
        { id: 'LL03', name: 'Aventureiro', minPoints: 150, icon: 'Mountain' },
        { id: 'LL04', name: 'Lenda do Hostel', minPoints: 300, icon: 'Crown' },
    ] as LoyaltyLevel[],
    checkIns: [] as CheckIn[],
    synapseChatHistory: [
        {
            id: 'SYNAPSE_WELCOME_1',
            sender: 'agent',
            text: 'Olá! Eu sou o SYNAPSE, seu agente de gestão unificado.',
            timestamp: new Date(Date.now() - 2000).toISOString(),
        },
        {
            id: 'SYNAPSE_WELCOME_2',
            sender: 'agent',
            text: 'Você pode me pedir para realizar tarefas complexas. Por exemplo:\n• "Crie uma campanha de marketing para o feriado de Corpus Christi com foco em casais jovens e um orçamento de R$1500"\n• "Me dê um resumo da gestão da última semana"',
            timestamp: new Date().toISOString(),
        }
    ] as SynapseMessage[],
    synapseOrchestrationLog: [],
    guestJourneys: [
        {
            id: 'GJ001',
            bookingId: 'B002',
            guestId: 'G002',
            status: 'in-stay',
            satisfactionScore: 88,
            engagementLevel: 'high',
            actionLog: [
                { id: 'ACT01', type: 'SEND_MESSAGE', status: 'executed', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), details: { message: 'Olá Bruno, bem-vindo! Vimos que você curte surf. As ondas estão ótimas na Praia Mole hoje!' }, justification: 'Hóspede com interesse em surf. Mensagem de boas-vindas personalizada.' },
                { id: 'ACT02', type: 'OFFER_UPSELL', status: 'executed', timestamp: new Date(Date.now() - 86400000).toISOString(), details: { offer: 'Aluguel de Prancha de Surf', discount: '15%' }, justification: 'Interesse em surf e previsão de bom tempo.' },
                { id: 'ACT03', type: 'SUGGEST_ACTIVITY', status: 'planned', timestamp: new Date(Date.now() + 86400000).toISOString(), details: { activity: 'Trilha do Gravatá' }, justification: 'Hóspede com interesse em trilhas.' },
            ]
        },
        {
            id: 'GJ002',
            bookingId: 'B004',
            guestId: 'G002', // Same guest, different booking
            status: 'in-stay',
            satisfactionScore: 92,
            engagementLevel: 'medium',
            actionLog: [
                 { id: 'ACT04', type: 'SEND_MESSAGE', status: 'planned', timestamp: new Date(Date.now() - 86400000).toISOString(), details: { message: 'A previsão é de chuva amanhã à tarde. Que tal uma sessão de cinema na nossa sala de TV?' }, justification: 'Proatividade baseada na previsão do tempo para melhorar a experiência.' },
                 { id: 'ACT05', type: 'CREATE_TASK', status: 'executed', timestamp: new Date().toISOString(), details: { task: 'Verificar se o hóspede Bruno Costa precisa de toalhas extras.', assignee: 'Limpeza' }, justification: 'Análise de histórico indicou que o hóspede costuma solicitar toalhas extras em estadias mais longas.' },
            ]
        },
         {
            id: 'GJ003',
            bookingId: 'B001',
            guestId: 'G001',
            status: 'post-stay',
            satisfactionScore: 95,
            engagementLevel: 'high',
            actionLog: [
                 { id: 'ACT06', type: 'REQUEST_REVIEW', status: 'planned', timestamp: new Date(Date.now() + 2 * 86400000).toISOString(), details: { platform: 'Google' }, justification: 'Hóspede teve uma ótima estadia (sentimento positivo detectado), alta probabilidade de avaliação positiva.' },
            ]
        }
    ] as GuestJourney[],
    guestNotifications: [
        { id: 'GN01', guestId: 'G001', type: 'achievement', title: 'Conquista Desbloqueada!', message: 'Parabéns, você agora é um Explorador Nato!', timestamp: new Date().toISOString(), read: false },
        { id: 'GN02', guestId: 'G001', type: 'event', title: 'Lembrete de Evento', message: 'O Churrasco Comunitário começa em 1 hora!', timestamp: new Date().toISOString(), read: true },
    ] as GuestNotification[],
    notifications: [] as AppNotification[],
    lostAndFoundItems: [],
    classifiedsItems: [],
    redeemedRewards: [] as RedeemedReward[],
    brandIdentity: {
        logoUrl: '',
        vibeKeywords: 'praiano, jovem, descontraído, natureza, comunidade',
        targetAudience: 'Mochileiros e viajantes solo de 20 a 35 anos, que buscam experiências autênticas, novas amizades e contato com a natureza. São aventureiros, sociáveis e valorizam um ambiente acolhedor.'
    },
    campaignIdeas: [],
    partnerServices: [
        {
            id: 'PS01',
            type: 'Passeio',
            name: 'Passeio de Barco Pirata',
            description: 'Uma aventura divertida para toda a família pelas praias do norte da ilha, com show e muita animação.',
            imageUrl: 'https://i.imgur.com/5hRG2y0.jpg',
            partnerName: 'Escunas Pirata Floripa',
            totalPrice: 120,
            commissionType: 'percentage',
            commissionValue: 15,
        },
        {
            id: 'PS02',
            type: 'Aluguel',
            name: 'Aluguel de Carro Econômico',
            description: 'Explore a ilha no seu ritmo. Alugue um carro econômico com KM livre e seguro incluso.',
            imageUrl: 'https://i.imgur.com/GKr938R.jpg',
            partnerName: 'Floripa Rent a Car',
            totalPrice: 150,
            commissionType: 'fixed',
            commissionValue: 25,
        },
        {
            id: 'PS03',
            type: 'Trilha',
            name: 'Trilha Guiada para a Lagoinha do Leste',
            description: 'Conheça um dos visuais mais incríveis de Florianópolis com um guia experiente. Trilha de nível médio.',
            imageUrl: 'https://i.imgur.com/T6FCS84.jpg',
            partnerName: 'Floripa Eco Trilhas',
            totalPrice: 90,
            commissionType: 'percentage',
            commissionValue: 20,
        }
    ] as PartnerService[],
    serviceBookings: [] as ServiceBooking[],
    cameras: [
        { id: 'CAM01', name: 'Recepção Beach', location: 'Recepção', status: 'Online', streamUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80', propertyUnitId: 'beach', propertyId: 'beach', brandPreset: 'Intelbras', ipAddress: '192.168.1.101' },
        { id: 'CAM02', name: 'Entrada Principal Beach', location: 'Entrada', status: 'Online', streamUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80', propertyUnitId: 'beach', propertyId: 'beach', brandPreset: 'Intelbras', ipAddress: '192.168.1.102' },
        { id: 'CAM03', name: 'Bar & Deck Beach', location: 'Bar & Lounge', status: 'Online', streamUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', hasMotion: true, propertyUnitId: 'beach', propertyId: 'beach', brandPreset: 'iCSee', ipAddress: '192.168.1.103' },
        { id: 'CAM04', name: 'Cozinha Beach', location: 'Cozinha', status: 'Online', streamUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80', propertyUnitId: 'beach', propertyId: 'beach', brandPreset: 'Intelbras', ipAddress: '192.168.1.104' },
        { id: 'CAM05', name: 'Recepção Santuário', location: 'Recepção', status: 'Online', streamUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80', propertyUnitId: 'sanctuary', propertyId: 'sanctuary', brandPreset: 'Hikvision', ipAddress: '192.168.2.101' },
        { id: 'CAM06', name: 'Jardim & Trilha Santuário', location: 'Área Externa', status: 'Online', streamUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', propertyUnitId: 'sanctuary', propertyId: 'sanctuary', brandPreset: 'Hikvision', ipAddress: '192.168.2.102' },
        { id: 'CAM07', name: 'Deck Yoga & Piscina Santuário', location: 'Deck Yoga', status: 'Online', streamUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80', hasMotion: true, propertyUnitId: 'sanctuary', propertyId: 'sanctuary', brandPreset: 'iCSee', ipAddress: '192.168.2.103' },
        { id: 'CAM08', name: 'Estacionamento Santuário', location: 'Estacionamento', status: 'Online', streamUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80', propertyUnitId: 'sanctuary', propertyId: 'sanctuary', brandPreset: 'Dahua', ipAddress: '192.168.2.104' },
    ] as Camera[],
    motionAlerts: [
        { id: 'MA01', cameraId: 'CAM03', cameraName: 'Bar & Deck Beach', location: 'Bar & Lounge', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), clipUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', read: false, propertyUnitId: 'beach', propertyId: 'beach' },
        { id: 'MA02', cameraId: 'CAM07', cameraName: 'Deck Yoga & Piscina Santuário', location: 'Deck Yoga', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), clipUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80', read: true, propertyUnitId: 'sanctuary', propertyId: 'sanctuary' },
        { id: 'MA03', cameraId: 'CAM02', cameraName: 'Entrada Principal Beach', location: 'Entrada', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), clipUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80', read: true, propertyUnitId: 'beach', propertyId: 'beach' },
    ] as MotionAlert[],
    surveillanceSettings: {
        bridgeServerUrl: null
    },
    emailTemplates: [
        { id: 'TPL01', name: 'Boas-vindas (Padrão)', subject: 'Sua reserva no {{hostelName}} está confirmada!', body: '<h1>Olá, {{guestName}}!</h1><p>Sua reserva está confirmada! Estamos ansiosos para te receber de {{checkIn}} a {{checkOut}}.</p><p>Para agilizar sua chegada e personalizar sua estadia, acesse nosso portal do hóspede: <a href="{{portalLink}}">Acessar Portal</a></p>' },
        { id: 'TPL02', name: 'Pedido de Avaliação', subject: 'Como foi sua estadia no {{hostelName}}?', body: '<h1>Olá, {{guestName}},</h1><p>Esperamos que tenha tido uma ótima estadia! Gostaríamos de ouvir sua opinião. Por favor, deixe uma avaliação clicando no link abaixo.</p>' },
        { id: 'TPL03', name: 'Promoção de Inverno', subject: '❄️ Escapada de inverno com 20% de desconto!', body: '<h1>Olá, {{guestName}}!</h1><p>Sentindo saudades da praia? Nós também sentimos sua falta! Planeje sua próxima viagem de inverno e ganhe 20% de desconto na sua estadia. Use o código INVERNO20.</p>' },
        { id: 'TPL04', name: 'Boas-vindas (Descontraído)', subject: 'E aí, {{guestName}}! Tudo pronto para sua vibe no {{hostelName}}?', body: '<h1>E aí, {{guestName}}!</h1><p>Sua cama já está te esperando! Mal podemos esperar para te receber aqui no paraíso de {{checkIn}} a {{checkOut}}. Se prepare para altas ondas e boas energias!</p><p>Acesse seu portal para já ir entrando no clima: <a href="{{portalLink}}">Meu Portal</a></p>' },
        { id: 'TPL05', name: 'Feliz Aniversário!', subject: 'Um presente especial do {{hostelName}} para você!', body: '<h1>Feliz Aniversário, {{guestName}}!</h1><p>Nós do {{hostelName}} desejamos a você um dia incrível! Como presente, que tal 15% de desconto na sua próxima reserva? Use o código NIVER15.</p>' },
    ] as EmailTemplate[],
    emailCampaigns: [
        { 
            id: 'EC01',
            name: 'Promoção de Inverno',
            subject: '❄️ Escapada de inverno com 20% de desconto!',
            templateId: 'TPL03',
            audience: 'Hóspedes Anteriores',
            status: 'Enviada',
            sentAt: new Date(Date.now() - 7 * 86400000).toISOString(),
            performance: {
                sent: 450,
                opens: 42, // as percentage
                clicks: 15, // as percentage
            }
        }
    ] as EmailCampaign[],
    automatedEmails: [
        { 
            trigger: 'BOOKING_CONFIRMED', 
            templateAId: 'TPL01', 
            templateBId: 'TPL04',
            isActive: true, 
            delayDays: 0,
            performance: {
                templateA: { sent: 52, opens: 28, clicks: 10 },
                templateB: { sent: 48, opens: 35, clicks: 18 }
            }
        },
        { trigger: 'PRE_ARRIVAL', templateAId: 'TPL01', isActive: false, delayDays: -2 },
        { trigger: 'POST_STAY', templateAId: 'TPL02', isActive: true, delayDays: 1 },
        { trigger: 'GUEST_BIRTHDAY', templateAId: 'TPL05', isActive: true, delayDays: -7 },
    ] as AutomatedEmail[],
    helpChatHistory: [],
    promoCodes: [
        { id: 'PC01', code: 'VERAO15', discountType: 'percentage', discountValue: 15, validUntil: '2024-12-31', minNights: 3, isActive: true },
        { id: 'PC02', code: 'BEMVINDO50', discountType: 'fixed', discountValue: 50, validUntil: '2024-12-31', isActive: true },
        { id: 'PC03', code: 'INVERNOOFF', discountType: 'percentage', discountValue: 20, validUntil: '2024-08-31', isActive: false },
    ] as PromoCode[],
    packageDeals: [
        { 
            id: 'PD01', 
            name: 'Pacote Romântico', 
            description: 'Uma estadia inesquecível para dois. Inclui quarto de casal, café da manhã especial e late check-out.',
            price: 250,
            priceType: 'per_night',
            minNights: 2,
            validFrom: '2024-01-01',
            validTo: '2024-12-31',
            imageUrl: 'https://i.imgur.com/gzzk9Fh.jpg',
            includedRoomType: RoomType.PRIVATE_COUPLE,
            includedAddOnIds: ['AO01', 'AO04'],
            isActive: true,
        },
        { 
            id: 'PD02', 
            name: 'Semana do Nômade Digital', 
            description: 'Trabalhe do paraíso. Inclui 7 noites em quarto privativo, café da manhã e acesso ilimitado ao coworking.',
            price: 1000,
            priceType: 'total_stay',
            minNights: 7,
            validFrom: '2024-01-01',
            validTo: '2024-12-31',
            imageUrl: 'https://i.imgur.com/wgyJ1Bc.jpg',
            includedRoomType: RoomType.PRIVATE_SINGLE,
            includedAddOnIds: ['AO01'], // O acesso ao coworking seria gerenciado por fora nesse caso
            isActive: true,
        }
    ] as PackageDeal[],
    equipment: [
      { id: 'EQ01', name: 'Ar Condicionado Quarto 01', location: 'Quarto 01', lastMaintenanceDate: '2024-01-15', maintenanceIntervalDays: 180 },
      { id: 'EQ02', name: 'Geladeira Cozinha Principal', location: 'Cozinha', lastMaintenanceDate: '2024-03-20', maintenanceIntervalDays: 365 },
      { id: 'EQ03', name: 'Aquecedor de Água Central', location: 'Casa de Máquinas', lastMaintenanceDate: '2023-12-10', maintenanceIntervalDays: 240 },
    ] as Equipment[],
    workOrders: [
      { id: 'WO01', equipmentId: 'EQ03', description: 'Aquecedor não está mantendo a temperatura.', status: 'A Fazer', priority: 'Alta', openedAt: new Date().toISOString(), assigneeId: 'S03' },
      { id: 'WO02', equipmentId: 'EQ01', description: 'Ar condicionado está fazendo barulho estranho.', status: 'Em Andamento', priority: 'Média', openedAt: new Date(Date.now() - 86400000).toISOString(), assigneeId: 'S04' },
    ] as WorkOrder[],
    suppliers: [
      { id: 'SUP01', name: 'Distribuidora de Bebidas Gelada', category: 'Comida & Bebida', contactName: 'Carlos', phone: '48988776655', rating: 5 },
      { id: 'SUP02', name: 'Limpa Tudo Produtos de Limpeza', category: 'Limpeza', contactName: 'Mariana', email: 'vendas@limpatudo.com', rating: 4 },
      { id: 'SUP03', name: 'Parafuso & Cia', category: 'Manutenção', phone: '4832324545', rating: 3 },
    ] as Supplier[],
    purchaseOrders: [
      { id: 'PO01', supplierId: 'SUP01', items: [{ productId: 'P03', name: 'Cerveja Artesanal IPA', quantity: 24, unitPrice: 12 }, { productId: 'P02', name: 'Refrigerante Cola', quantity: 48, unitPrice: 4 }], totalCost: 480.00, status: 'Enviada', orderedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 'PO02', supplierId: 'SUP02', items: [{ productId: 'P12', name: 'Detergente 5L', quantity: 4, unitPrice: 18 }, { productId: 'P13', name: 'Desinfetante Lavanda 5L', quantity: 4, unitPrice: 22 }], totalCost: 160.00, status: 'Pendente', orderedAt: new Date().toISOString() },
    ] as PurchaseOrder[],
    digitalMenu: null,
    tables: [
        { id: 'T01', number: 1, capacity: 2, status: 'Livre' as any, currentItems: [] },
        { id: 'T02', number: 2, capacity: 4, status: 'Livre' as any, currentItems: [] },
        { id: 'T03', number: 3, capacity: 4, status: 'Livre' as any, currentItems: [] },
        { id: 'T04', number: 4, capacity: 6, status: 'Livre' as any, currentItems: [] },
    ],
    integrationSettings: [
        { id: 'INT01', platform: 'Cloudbeds', connected: true, apiKey: 'cb_sk_live_9f8d7e6c5b4a3...', propertyId: 'CB_PRO_123', lastSync: new Date().toISOString(), status: 'Ativo', config: { syncRooms: true, syncGuests: true, syncPOS: false }, updatedAt: new Date().toISOString() },
        { id: 'INT02', platform: 'Aloha Pro', connected: false, status: 'Pausado', config: { syncRooms: true, syncGuests: true, syncPOS: true }, updatedAt: new Date().toISOString() }
    ] as IntegrationSettings[],
    integrationSyncLogs: [
        { id: 'LOG01', timestamp: new Date().toISOString(), platform: 'Aloha Pro', action: 'Configuração Inicial', status: 'Success', details: 'Integração preparada para conexão via API.', updatedAt: new Date().toISOString() }
    ] as IntegrationSyncLog[],
    integrationBillingMappings: [
        { id: 'MAP01', appItemName: 'Consumo Restaurante', pmsItemName: 'Restaurante POS', integrationId: 'INT02', updatedAt: new Date().toISOString() }
    ] as IntegrationBillingMapping[],
    externalApiKeys: [
        { id: 'AK01', name: 'Integração Web Webhook', key: 'sk_live_abc123', createdAt: new Date().toISOString(), scope: 'Leitura/Escrita', updatedAt: new Date().toISOString() }
    ] as ExternalAPIKey[],
    coworkingPlans: [
        { id: 'cw-plan-hour', name: 'Hora Avulsa', type: 'hour', price: 15.00 },
        { id: 'cw-plan-day', name: 'Diária', type: 'day', price: 60.00 },
        { id: 'cw-plan-month', name: 'Mensal', type: 'month', price: 800.00 }
    ] as any,
    coworkingDesks: [
        { id: 'desk-1', name: 'Estação 1', status: 'Ocupada', currentCheckInId: 'checkin-1' },
        { id: 'desk-2', name: 'Estação 2', status: 'Livre' },
        { id: 'desk-3', name: 'Estação 3', status: 'Livre' },
        { id: 'room-a', name: 'Sala de Call A', status: 'Livre' }
    ] as any,
    coworkingCheckIns: [
        {
            id: 'checkin-1',
            deskId: 'desk-1',
            guestName: 'Carlos Mendonça',
            startTime: new Date().toISOString(),
            planId: 'cw-plan-day',
            status: 'Active',
            currentItems: [
                { id: 'item-1', productId: 'p1', name: 'Café Expresso', price: 5.0, quantity: 2, totalPrice: 10.0 }
            ]
        }
    ] as any,
    deliveryOrders: [
        {
            id: 'order-1',
            customerName: 'Mariana Souza',
            customerPhone: '48999999999',
            customerAddress: 'Rua das Flores, 123 - Centro',
            items: [],
            total: 45.90,
            status: 'Preparing',
            source: 'App Próprio',
            courierType: 'Motoboy Próprio',
            createdAt: new Date().toISOString()
        },
        {
            id: 'order-2',
            customerName: 'Roberto Alves',
            customerPhone: '48999999998',
            customerAddress: 'Avenida Beira Mar, 456 - Agronômica',
            items: [],
            total: 89.50,
            status: 'Pending',
            source: 'iFood',
            courierType: 'iFood',
            createdAt: new Date().toISOString()
        }
    ] as any,
};