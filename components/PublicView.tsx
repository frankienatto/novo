import React from 'react';
import { Room, Review, Page, DBState, ChatConversation, ChatMessage, SiteContent, ThemeSettings, PropertyInfo, Facility } from '../types';
import { Bed, Users, Wifi, Wind, Sun, UtensilsCrossed, Tv, WashingMachine, Library, Sparkles, MapPin, Mail, Phone, Star, Waves, Leaf, Quote, X, ArrowRight, Instagram, Facebook, Calendar, User, Key } from 'lucide-react';
import LiveChatWidget from './LiveChatWidget';
import { motion, AnimatePresence } from 'motion/react';

const amenityIcons: { [key: string]: React.ElementType } = {
    // For Room amenities (from room.amenities array)
    'wi-fi': Wifi,
    'ar condicionado': Wind,
    'arcondicionado': Wind,
    'cozinha compartilhada': UtensilsCrossed,
    'sala de tv': Tv,
    'lavanderia': WashingMachine,
    'biblioteca': Library,
    'gazebo com jardim': Sparkles,

    // For general purpose icons (from whyUs section)
    'waves': Waves,
    'users': Users,
    'leaf': Leaf,
    
    // For Facilities icons (from siteContent.facilities array, using toLowerCase())
    'wifi': Wifi,
    'utensilscrossed': UtensilsCrossed,
    'sparkles': Sparkles,
    'library': Library,
    'tv': Tv,
    'washingmachine': WashingMachine,
    'sun': Sun,

    // Default fallback
    default: Sun
};

const DynamicIcon: React.FC<{ name: string, className?: string, size?: number }> = ({ name, className = "text-[var(--ps-primary)]", size = 20 }) => {
    const normalizedName = name.toLowerCase().replace(/\s+/g, '');
    const IconComponent = amenityIcons[normalizedName] || amenityIcons[name.toLowerCase()] || amenityIcons.default;
    return <IconComponent size={size} className={className} />;
};


const RoomCard: React.FC<{ room: Room, index: number, onReserve: (roomId: number) => void }> = ({ room, index, onReserve }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-[2rem] overflow-hidden transition-all duration-500 shadow-sm hover:shadow-xl hover:-translate-y-1 block border border-gray-100/50"
    >
        <div className="relative overflow-hidden aspect-[1.3/1]">
            <img className="w-full h-full object-cover" src={room.imageUrl} alt={room.name} />
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-brand-green px-3 py-1.5 rounded-full text-[9px] font-bold shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
                <Leaf size={10} /> Sustentável
            </div>
        </div>
        <div className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-display font-bold text-brand-dark leading-tight">{room.name}</h3>
                <div className="flex items-center text-amber-500">
                    <Star size={14} className="fill-current mr-1" />
                    <span className="text-xs font-bold">4.9</span>
                </div>
            </div>
            
            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-6 block">{room.type}</p>
            
            <div className="flex flex-wrap gap-2 mb-8">
                {room.amenities.slice(0, 3).map(amenity => (
                     <div key={amenity} className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-xl text-[10px] font-bold text-gray-500 border border-gray-100 group-hover:bg-brand-green-light/5 transition-colors">
                        <DynamicIcon name={amenity} size={12} className="text-brand-green/60" />
                        <span className="truncate max-w-[90px]">{amenity}</span>
                    </div>
                ))}
            </div>
            
            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">A partir de</span>
                    <p className="text-2xl font-extrabold text-brand-green-light">R${room.basePrice}<span className="text-xs text-gray-400 font-medium ml-1">/noite</span></p>
                </div>
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onReserve(room.id)} 
                    className="bg-brand-green-light/10 text-brand-green-light hover:bg-brand-green-light hover:text-white p-4 rounded-2xl transition-all duration-300"
                >
                    <ArrowRight size={20} />
                </motion.button>
            </div>
        </div>
    </motion.div>
);

const TestimonialCard: React.FC<{ review: Review, index: number }> = ({ review, index }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-8 md:p-10 flex flex-col h-full group border border-gray-100 rounded-[2rem] relative overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
        >
            <div className="absolute -top-4 -right-4 text-brand-green/5 group-hover:text-brand-green/10 transition-colors duration-500">
                <Quote size={100} />
            </div>
            <div className="flex items-center gap-1 mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < review.rating ? 'text-amber-400 fill-current' : 'text-gray-100'} />
                ))}
            </div>
            <p className="text-brand-dark/80 mb-8 flex-grow italic leading-relaxed text-lg font-serif relative z-10">"{review.comment}"</p>
            <div className="flex items-center gap-4 mt-auto relative z-10 border-t border-gray-50 pt-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-green-light/10 flex items-center justify-center text-brand-green-light font-display font-extrabold text-xl">
                    {review.guestName.charAt(0)}
                </div>
                <div>
                    <h4 className="font-display font-extrabold text-brand-dark leading-none mb-1.5">{review.guestName}</h4>
                    <p className="text-[10px] text-brand-green-light uppercase tracking-widest font-bold">Hóspede Verificado</p>
                </div>
            </div>
        </motion.div>
    );
};


interface PublicViewProps {
    setPage: (page: Page, params?: any) => void; 
    db: DBState;
    chatData: { conversations: ChatConversation[]; messages: ChatMessage[] };
    onStartChat: (name: string, firstMessage: string) => Promise<{ conversation: ChatConversation; message: ChatMessage }>;
    onSendMessage: (conversationId: string, text: string, senderId: string, senderName: string) => Promise<ChatMessage>;
}

const PublicView: React.FC<PublicViewProps> = ({ setPage, db, chatData, onStartChat, onSendMessage }) => {
    
    const [selectedFacility, setSelectedFacility] = React.useState<Facility | null>(null);
    const activeProperty = React.useMemo(() => db.properties.find(p => p.id === db.currentPropertyId), [db.properties, db.currentPropertyId]);

    if (!activeProperty || !db.siteContent || !db.themeSettings) {
        return <div className="text-center p-10">Carregando conteúdo da propriedade...</div>
    }

    const { siteContent, themeSettings } = db;
    const { publicSite } = themeSettings;
    
    const handleBookingSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const searchParams = {
            checkIn: formData.get('checkin'),
            checkOut: formData.get('checkout'),
            guests: formData.get('guests'),
        };
        setPage('booking', searchParams);
    };
    
    const approvedReviews = db.reviews.filter(r => r.status === 'Approved');

    const searchBoxClass = publicSite.searchLayout === 'stacked' 
        ? "flex flex-col gap-2"
        : "flex flex-col sm:flex-row items-stretch sm:items-center gap-2";

    const renderGallery = () => {
        switch(publicSite.aboutGalleryLayout) {
            case 'carousel-simple':
                return (
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 py-2 no-scrollbar">
                        {siteContent.about.imageUrls.map((url, index) => (
                             <img key={`about-img-${index}`} src={url} alt={`Hostel Area ${index + 1}`} className="snap-center flex-shrink-0 w-[85%] sm:w-2/3 shadow-xl object-cover aspect-[4/3] rounded-[2rem] border-4 border-white" />
                        ))}
                    </div>
                )
            case 'grid':
            default:
                return (
                    <div className="grid grid-cols-2 gap-3 md:gap-6">
                        <div className="space-y-3 md:space-y-6">
                            <img src={siteContent.about.imageUrls[0]} alt="Gallery 1" className="w-full h-48 md:h-64 object-cover rounded-[2rem] shadow-xl" />
                            <img src={siteContent.about.imageUrls[1]} alt="Gallery 2" className="w-full h-32 md:h-48 object-cover rounded-[2rem] shadow-xl" />
                        </div>
                        <div className="space-y-3 md:space-y-6 pt-6 md:pt-12">
                            <img src={siteContent.about.imageUrls[2]} alt="Gallery 3" className="w-full h-32 md:h-48 object-cover rounded-[2rem] shadow-xl" />
                            <img src={siteContent.about.imageUrls[3]} alt="Gallery 4" className="w-full h-48 md:h-64 object-cover rounded-[2rem] shadow-xl" />
                        </div>
                    </div>
                )
        }
    };

    const renderExperiences = () => {
        const gridClass = publicSite.experiencesLayout === 'list'
            ? "grid-cols-1"
            : "grid-cols-1 md:grid-cols-3";
            
        return (
             <div className={`grid ${gridClass} gap-8`}>
                {siteContent.experiences.items.map(exp => (
                    <div key={exp.title} className="relative overflow-hidden shadow-lg h-80 group" style={{borderRadius: 'var(--ps-card-radius)'}}>
                        <img src={exp.imageUrl} alt={exp.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-6 text-white">
                            <h3 className="text-2xl font-bold">{exp.title}</h3>
                            <p className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-0 group-hover:h-auto">{exp.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        )
    }
    
    const renderFooter = () => {
        const defaultFooter = (
             <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-center gap-y-8 md:gap-x-16">
                    <div className="h-24 md:h-28 flex-shrink-0">
                        <img src="https://i.imgur.com/jiDNGTh.png" alt="Logo" className="h-full w-auto object-contain" />
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold mb-4">Entre em Contato</h2>
                        <div className="flex flex-col items-center md:items-start gap-y-2">
                            <div className="flex items-center gap-3"><MapPin className="text-[var(--ps-primary)]" /><span>{activeProperty.address}</span></div>
                            <div className="flex items-center gap-3"><Mail className="text-[var(--ps-primary)]" /><span>{activeProperty.email}</span></div>
                            <div className="flex items-center gap-3"><Phone className="text-[var(--ps-primary)]" /><span>{activeProperty.phone}</span></div>
                        </div>
                    </div>
                </div>
                 <div className="mt-8 pt-6 border-t border-gray-700 flex flex-col sm:flex-row justify-center items-center gap-x-6 gap-y-2 text-sm text-gray-300">
                    <div className="flex gap-x-6">
                        <button onClick={() => setPage('usefulLinks')} className="hover:text-white">Links Úteis</button>
                        <span>|</span>
                        <button onClick={() => setPage('termsAndConditions')} className="hover:text-white">Termos e Condições</button>
                    </div>
                    <p className="text-gray-400 mt-4 sm:mt-0">&copy; 2024 {activeProperty.name}. Todos os direitos reservados.</p>
                </div>
            </div>
        );
        
         const multiColumnFooter = (
            <div className="container mx-auto px-6 text-left grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                     <div className="h-32 mb-4">
                        <img src="https://i.imgur.com/jiDNGTh.png" alt="Logo" className="h-full w-auto object-contain" />
                    </div>
                    <p className="text-gray-400 max-w-sm">{siteContent.hero.subtitle}</p>
                </div>
                <div>
                     <h3 className="font-bold text-lg mb-4">Links Rápidos</h3>
                     <ul className="space-y-2 text-gray-300">
                        <li><button onClick={() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white">Início</button></li>
                        <li><button onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white">Quartos</button></li>
                        <li><button onClick={() => document.getElementById('facilities')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white">Facilidades</button></li>
                        <li><button onClick={() => setPage('usefulLinks')} className="hover:text-white">Links Úteis</button></li>
                        <li><button onClick={() => setPage('termsAndConditions')} className="hover:text-white">Termos e Condições</button></li>
                     </ul>
                </div>
                 <div>
                     <h3 className="font-bold text-lg mb-4">Contato</h3>
                     <ul className="space-y-2 text-gray-300">
                        <li className="flex items-center gap-2"><MapPin size={16} className="text-[var(--ps-primary)]"/> {activeProperty.address}</li>
                        <li className="flex items-center gap-2"><Mail size={16} className="text-[var(--ps-primary)]"/> {activeProperty.email}</li>
                        <li className="flex items-center gap-2"><Phone size={16} className="text-[var(--ps-primary)]"/> {activeProperty.phone}</li>
                     </ul>
                </div>
                 <p className="text-sm text-gray-400 mt-8 md:col-span-4 text-center border-t border-gray-700 pt-6">&copy; 2024 {activeProperty.name}. Todos os direitos reservados.</p>
            </div>
        );
        
        return publicSite.footerLayout === 'multi-column' ? multiColumnFooter : defaultFooter;
    }


    return (
        <div>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 px-6 py-4 flex justify-between items-center transition-all duration-500">
                <div className="h-10 cursor-pointer" onClick={() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })}>
                    <img src={publicSite.logoUrl} alt="Logo" className="object-contain" style={{ width: '168.025px', height: '86px', marginTop: '-24px' }} />
                </div>
                <div className="hidden md:flex items-center gap-8">
                    {['Início', 'Acomodações', 'Facilidades', 'Contato'].map((item, i) => (
                        <button 
                            key={i}
                            onClick={() => {
                                const id = item === 'Início' ? 'home' : item === 'Acomodações' ? 'rooms' : item.toLowerCase();
                                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark hover:text-brand-green transition-colors"
                        >
                            {item}
                        </button>
                    ))}
                </div>
                <button 
                    onClick={() => setPage('login')}
                    className="bg-brand-dark text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-green transition-all shadow-lg shadow-brand-dark/10 flex items-center gap-2"
                >
                    <User size={14} /> Área do Hóspede
                </button>
            </nav>

            <main className="bg-[var(--ps-bg)] text-[var(--ps-text)] font-sans">
                {/* Hero Section */}
                <section id="home" className="relative min-h-[85vh] md:h-screen flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <motion.div 
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="w-full h-full"
                        >
                            <img 
                                src={siteContent.hero.imageUrl} 
                                alt="Background" 
                                className="w-full h-full object-cover brightness-[0.7]"
                            />
                        </motion.div>
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/30 to-brand-dark/40"></div>
                    </div>

                    <div className="relative z-10 text-center text-white px-4 pt-16 md:pt-0 w-full max-w-6xl">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mb-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/20"
                        >
                            <Sparkles size={14} className="text-brand-accent" />
                            <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">Elegância à Beira Mar</span>
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold mb-8 tracking-tighter leading-[1.05] text-white drop-shadow-2xl"
                        >
                            {siteContent.hero.title}
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 1 }}
                            className="text-lg md:text-2xl mb-14 max-w-3xl mx-auto text-white/95 font-medium leading-relaxed px-4 drop-shadow-lg"
                        >
                            {siteContent.hero.subtitle}
                        </motion.p>
                        
                        <div className="flex flex-col items-center gap-8">
                             <motion.form 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1, duration: 0.8 }}
                                onSubmit={handleBookingSearch} 
                                className="glass-card p-2 rounded-3xl md:rounded-full w-full max-w-5xl flex flex-col md:flex-row gap-2 border-white/30 shadow-2xl"
                            >
                                <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-2 px-2 py-1">
                                    <div className="text-left px-4 py-2 md:py-3 bg-brand-green/5 rounded-2xl md:rounded-full transition-all border border-transparent focus-within:border-brand-green/20">
                                        <label className="flex items-center gap-2 text-[9px] uppercase font-bold text-brand-green/60 mb-1 tracking-widest leading-none">
                                            <Calendar size={12} /> Check-in
                                        </label>
                                        <input type="date" name="checkin" className="bg-transparent border-none focus:ring-0 text-brand-dark w-full p-0 font-bold text-sm" required />
                                    </div>
                                    <div className="text-left px-4 py-2 md:py-3 bg-brand-green/5 rounded-2xl md:rounded-full transition-all border border-transparent focus-within:border-brand-green/20">
                                        <label className="flex items-center gap-2 text-[9px] uppercase font-bold text-brand-green/60 mb-1 tracking-widest leading-none">
                                            <Calendar size={12} /> Check-out
                                        </label>
                                        <input type="date" name="checkout" className="bg-transparent border-none focus:ring-0 text-brand-dark w-full p-0 font-bold text-sm" required />
                                    </div>
                                    <div className="text-left px-4 py-2 md:py-3 bg-brand-green/5 rounded-2xl md:rounded-full transition-all border border-transparent focus-within:border-brand-green/20">
                                        <label className="flex items-center gap-2 text-[9px] uppercase font-bold text-brand-green/60 mb-1 tracking-widest leading-none">
                                            <Users size={12} /> Hóspedes
                                        </label>
                                        <input type="number" name="guests" placeholder="0" min="1" className="bg-transparent border-none focus:ring-0 text-brand-dark w-full p-0 font-bold text-sm" required />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    className="bg-brand-green-light hover:bg-brand-green text-white font-bold py-4 md:py-2 px-10 rounded-2xl md:rounded-full transition-all duration-300 shadow-lg shadow-brand-green/20 uppercase tracking-[0.2em] text-xs"
                                >
                                    Reservar
                                </button>
                            </motion.form>

                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.5 }}
                                onClick={() => setPage('login')}
                                className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:border-white/50 transition-colors">
                                    <Key size={16} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Já tem reserva? Acesse o Portal do Hóspede</span>
                            </motion.button>
                        </div>
                    </div>
                </section>
                
                {/* Why Us Section */}
                <section id="why-us" className="py-24 md:py-40 bg-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                    <div className="container mx-auto px-4 md:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-20 md:mb-32">
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-brand-accent mb-4 block">Diferenciais Foresthouse</span>
                            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-brand-dark leading-tight uppercase mb-8 tracking-tight">{siteContent.whyUs.title}</h2>
                            <p className="text-gray-500 font-medium leading-relaxed text-lg">{siteContent.whyUs.subtitle}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
                            {siteContent.whyUs.items.map((item, index) => (
                                <motion.div 
                                    key={index} 
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex flex-col items-center text-center group"
                                >
                                    <div className="w-20 h-20 rounded-3xl bg-brand-sand transform rotate-3 group-hover:rotate-6 transition-all duration-300 flex items-center justify-center mb-8 relative">
                                        <div className="absolute inset-0 bg-brand-green/5 rounded-3xl -rotate-6 group-hover:-rotate-12 transition-all duration-300"></div>
                                        <DynamicIcon name={item.icon} size={32} className="text-brand-green relative z-10" />
                                    </div>
                                    <h3 className="text-xl font-display font-extrabold text-brand-dark mb-4 uppercase tracking-tight">{item.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed font-medium">{item.text}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* About Section */}
                <section id="about" className="py-24 md:py-40 bg-white border-t border-gray-50">
                    <div className="container mx-auto px-4 md:px-8">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-brand-green mb-4 block">Sobre o Foresthouse</span>
                                <h2 className="text-3xl md:text-5xl font-display font-extrabold text-brand-dark mb-8 leading-tight tracking-tight uppercase">{siteContent.about.title}</h2>
                                <div className="space-y-6 text-gray-500 font-medium leading-relaxed text-base md:text-lg">
                                    <p>{siteContent.about.text1}</p>
                                    <p>{siteContent.about.text2}</p>
                                </div>
                            </motion.div>
                           {renderGallery()}
                         </div>
                    </div>
                </section>

                {/* Rooms Section */}
                <section id="rooms" className="py-24 md:py-40 bg-brand-sand/40">
                    <div className="container mx-auto px-4 md:px-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-24 gap-8">
                            <div className="max-w-xl">
                                <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-brand-green mb-4 block">Acomodações Selecionadas</span>
                                <h2 className="text-4xl md:text-5xl font-display font-extrabold text-brand-dark leading-tight uppercase tracking-tight">Sua Estadia em Canasvieiras</h2>
                            </div>
                            <motion.button 
                                whileHover={{ x: 5 }}
                                onClick={() => setPage('booking')} 
                                className="flex items-center gap-2 text-brand-green font-bold uppercase tracking-[0.2em] text-[10px] group border-b border-transparent hover:border-brand-green transition-all pb-1 w-fit"
                            >
                                Ver Todas <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                            {db.rooms.slice(0, 3).map((room, index) => (
                                <RoomCard key={room.id} room={room} index={index} onReserve={(roomId) => setPage('booking', { roomId })} />
                            ))}
                        </div>
                    </div>
                </section>
                
                <section id="experiences" className="py-24 md:py-32 bg-white">
                     <div className="container mx-auto px-4 md:px-8 text-center">
                        <div className="max-w-2xl mx-auto mb-16">
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-brand-green mb-4 block">Momentos Únicos</span>
                            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-brand-dark mb-6 tracking-tight uppercase leading-tight">{siteContent.experiences.title}</h2>
                        </div>
                         {renderExperiences()}
                    </div>
                </section>

                <section id="facilities" className="py-20 md:py-32 bg-gray-50/50">
                    <div className="container mx-auto px-4 md:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-brand-green mb-4 block">Para seu Conforto</span>
                            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-brand-dark mb-6 tracking-tight uppercase">Nossa Estrutura</h2>
                            <p className="text-gray-500 font-medium leading-relaxed">Instalações completas para que você aproveite cada segundo em Canasvieiras.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                           {siteContent.facilities.map((facility, idx) => (
                                <motion.button 
                                    key={facility.id} 
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setSelectedFacility(facility)} 
                                    className="bg-white p-6 md:p-8 hover:shadow-xl transition-all text-left group border border-gray-100 rounded-2xl"
                                >
                                   <div className="mb-6 w-12 h-12 rounded-2xl bg-brand-green/5 flex items-center justify-center group-hover:bg-brand-green group-hover:text-white transition-all">
                                       <DynamicIcon name={facility.icon} size={24} className="transition-colors" />
                                   </div>
                                   <h4 className="font-display font-black text-brand-dark mb-2 text-sm uppercase tracking-tight">{facility.name}</h4>
                                   <p className="text-xs text-gray-400 font-bold leading-relaxed group-hover:text-gray-500 transition-colors uppercase tracking-[0.2em]">Saiba Mais</p>
                                </motion.button>
                           ))}
                        </div>
                    </div>
                </section>
                
                {/* Testimonials Section */}
                <section id="testimonials" className="py-24 sm:py-32 bg-[var(--ps-bg)]">
                    <div className="container mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--ps-text)] mb-6 tracking-tight leading-none uppercase font-display">Histórias que nos Inspiram</h2>
                            <p className="text-gray-500 text-lg font-medium">Momentos reais compartilhados por quem viveu a experiência Forest Beach House.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {approvedReviews.slice(0, 3).map((review, index) => (
                                <TestimonialCard key={review.id} review={review} index={index} />
                            ))}
                        </div>
                    </div>
                </section>
                
                {/* CTA Section */}
                <section id="cta" className="bg-[var(--ps-primary)]">
                    <div className="container mx-auto px-6 py-16 sm:py-20 text-center text-white">
                         <h2 className="text-3xl sm:text-4xl font-bold mb-4">{siteContent.cta.title}</h2>
                         <p className="max-w-xl mx-auto mb-8">{siteContent.cta.subtitle}</p>
                         <button onClick={() => setPage('booking')} className="bg-white text-[var(--ps-primary)] font-bold py-3 px-8 text-lg hover:bg-gray-200 transition-all transform hover:scale-105" style={{borderRadius: 'var(--ps-button-radius)'}}>
                            {siteContent.cta.buttonText}
                        </button>
                    </div>
                </section>


                {/* Footer */}
                <footer id="contact" className="bg-brand-dark text-white pt-24 pb-12 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-green/20 rounded-full blur-3xl -mr-48 -mt-48 opacity-20"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-accent/20 rounded-full blur-3xl -ml-48 -mb-48 opacity-20"></div>
                    
                    <div className="container mx-auto px-6 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 mb-20 text-center md:text-left">
                            <div className="lg:col-span-1">
                                <div className="h-16 mb-8 flex justify-center md:justify-start">
                                    <img src={publicSite.logoUrl} alt="Logo" className="h-full w-auto object-contain brightness-0 invert" />
                                </div>
                                <p className="text-gray-400 text-sm max-w-sm mb-10 leading-relaxed font-medium mx-auto md:mx-0">
                                    {siteContent.hero.subtitle}
                                </p>
                                <div className="flex justify-center md:justify-start gap-4">
                                    <motion.a whileHover={{ y: -5, scale: 1.1 }} href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-brand-green-light transition-all border border-white/10">
                                        <Instagram size={20} />
                                    </motion.a>
                                    <motion.a whileHover={{ y: -5, scale: 1.1 }} href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-brand-green-light transition-all border border-white/10">
                                        <Facebook size={20} />
                                    </motion.a>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-display font-black text-xs uppercase tracking-[0.3em] mb-8 text-brand-accent">Explorar</h3>
                                <ul className="space-y-4 text-gray-400 font-bold text-[11px] uppercase tracking-widest">
                                    <li><button onClick={() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Início</button></li>
                                    <li><button onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Acomodações</button></li>
                                    <li><button onClick={() => document.getElementById('facilities')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Estrutura</button></li>
                                    <li><button onClick={() => setPage('usefulLinks')} className="hover:text-white transition-colors">Guia Local</button></li>
                                </ul>
                            </div>
                            
                            <div className="md:col-span-2 lg:col-span-1">
                                <h3 className="font-display font-black text-xs uppercase tracking-[0.3em] mb-8 text-brand-accent">Onde Estamos</h3>
                                <ul className="space-y-6 text-gray-400 text-sm font-medium">
                                    <li className="flex items-start justify-center md:justify-start gap-4">
                                        <MapPin size={18} className="text-brand-accent shrink-0 mt-1" />
                                        <span className="leading-relaxed">{activeProperty.address}</span>
                                    </li>
                                    <li className="flex items-center justify-center md:justify-start gap-4">
                                        <Phone size={18} className="text-brand-accent shrink-0" />
                                        <span>{activeProperty.phone}</span>
                                    </li>
                                    <li className="flex items-center justify-center md:justify-start gap-4">
                                        <Mail size={18} className="text-brand-accent shrink-0" />
                                        <span>{activeProperty.email}</span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-display font-black text-xs uppercase tracking-[0.3em] mb-8 text-brand-accent">Newsletter</h3>
                                <p className="text-xs text-gray-400 mb-6 font-medium">Fique por dentro de promoções e eventos exclusivos.</p>
                                <form className="flex flex-col gap-3">
                                    <input type="email" placeholder="Seu melhor e-mail" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-accent transition-colors" />
                                    <button className="bg-brand-accent text-brand-dark font-black text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-white transition-colors">Inscrever-se</button>
                                </form>
                            </div>
                        </div>
                        
                        <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] text-center md:text-left">
                                &copy; 2024 Forest Beach House. Design by Foresthouse Team.
                            </p>
                            <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                                <button onClick={() => setPage('termsAndConditions')} className="hover:text-white transition-colors">Termos de Uso</button>
                                <button className="hover:text-white transition-colors">Políticas de Cancelamento</button>
                                <button className="hover:text-white transition-colors">Privacidade</button>
                            </div>
                        </div>
                    </div>
                </footer>
            </main>

            {/* Facility Modal */}
            {selectedFacility && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedFacility(null)}>
                    <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="relative">
                             <img src={selectedFacility.imageUrl} alt={selectedFacility.name} className="w-full h-56 object-cover" />
                             <button onClick={() => setSelectedFacility(null)} className="absolute top-3 right-3 bg-white/70 rounded-full p-1.5 text-gray-800 hover:bg-white"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-brand-dark mb-2">{selectedFacility.name}</h3>
                            <p className="text-gray-700">{selectedFacility.longDescription}</p>
                        </div>
                    </div>
                </div>
            )}

            <LiveChatWidget 
                chatData={chatData}
                onStartChat={onStartChat}
                onSendMessage={onSendMessage}
            />
        </div>
    );
};

export default PublicView;
