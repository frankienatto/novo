import React from 'react';
import { Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { Page, User as UserType, Guest, Staff, ThemeSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
    page: Page;
    setPage: (page: Page) => void;
    currentUser: UserType | null;
    logout: () => void;
    themeSettings: ThemeSettings;
}

const Header: React.FC<HeaderProps> = ({ page, setPage, currentUser, logout, themeSettings }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const layout = themeSettings.publicSite.headerLayout;
    const logoHeight = themeSettings.publicSite.logoHeight;

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '#home', label: 'Início', page: 'home' as Page },
        { href: '#rooms', label: 'Quartos', page: 'home' as Page },
        { href: '#synapse', label: 'Synapse OS', page: 'synapse' as Page },
        { href: '#portal', label: 'Hóspedes', page: 'guestPortal' as Page },
        { href: '#facilities', label: 'Facilidades', page: 'home' as Page },
        { href: '#contact', label: 'Contato', page: 'home' as Page },
    ];
    
    const handleNavClick = (targetPage: Page, targetId?: string) => {
        setPage(targetPage);
        setIsMenuOpen(false);
        if (targetId && targetPage === 'home') {
             setTimeout(() => {
                const element = document.getElementById(targetId.replace('#', ''));
                if (element) {
                    const offset = 80;
                    const bodyRect = document.body.getBoundingClientRect().top;
                    const elementRect = element.getBoundingClientRect().top;
                    const elementPosition = elementRect - bodyRect;
                    const offsetPosition = elementPosition - offset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }
    }

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
    }
    
    const handleMyAccountClick = () => {
        if (!currentUser) return;
        
        if ('role' in currentUser) { // Staff
             if (['Gerente', 'Administrador Geral', 'Super Administrador'].includes(currentUser.role)) {
                setPage('admin');
            } else {
                setPage('operationalDashboard');
            }
        } else { // Guest
            setPage('guestPortal');
        }
        setIsMenuOpen(false);
    }
    
    const Logo = () => (
         <button 
            onClick={() => handleNavClick('home', '#home')} 
            className={`focus:outline-none w-auto transition-transform hover:scale-105 ${layout === 'logo-center' ? 'absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2' : ''}`}
            style={{ height: isScrolled ? '32px' : logoHeight }}
          >
             <img 
                src={themeSettings.publicSite.logoUrl} 
                alt="Logo" 
                className="hidden h-full w-auto object-contain"
            />
        </button>
    );

    const UserActions = () => {
        const textColorClass = isScrolled ? 'text-gray-600' : 'text-white';
        const subTextColorClass = isScrolled ? 'text-gray-400' : 'text-white/60';

        if (currentUser) {
            return (
                <div className="hidden md:flex items-center space-x-6 font-sans">
                    <button 
                        onClick={handleMyAccountClick} 
                        className="flex items-center gap-2 group"
                    >
                        <div className={`w-8 h-8 rounded-full ${isScrolled ? 'bg-brand-green/10 text-brand-green' : 'bg-white/20 text-white'} flex items-center justify-center group-hover:bg-brand-green group-hover:text-white transition-all`}>
                            <User size={15} />
                        </div>
                        <span className={`text-sm font-bold ${isScrolled ? 'text-gray-700' : 'text-white'}`}>Olá, {('role' in currentUser ? (currentUser.name || 'Staff') : (currentUser.fullName || 'Hóspede')).split(' ')[0]}</span>
                    </button>
                    <button 
                        onClick={handleLogout} 
                        className={`${isScrolled ? 'text-gray-400' : 'text-white/60'} hover:text-red-500 transition-colors`}
                        title="Sair"
                    >
                        <LogOut size={16}/>
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPage('booking')}
                        className="bg-brand-green text-white font-bold py-2.5 px-6 text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-green/20"
                        style={{ borderRadius: 'var(--ps-button-radius)' }}
                    >
                        Reservar
                    </motion.button>
                </div>
            );
        }

        return (
            <div className="hidden md:flex items-center space-x-6 font-sans">
                <button onClick={() => setPage('login')} className={`text-xs font-bold uppercase tracking-[0.2em] ${isScrolled ? 'text-gray-500' : 'text-white'} hover:text-brand-green transition-colors`}>Login</button>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage('booking')}
                    className="bg-brand-green text-white font-bold py-2.5 px-8 text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-green/20"
                    style={{ borderRadius: 'var(--ps-button-radius)' }}
                >
                    Reservar
                </motion.button>
            </div>
        );
    };

    const NavMenu = () => (
        <nav className="hidden md:flex items-center space-x-8">
           {navLinks.map(link => (
               <button 
                    key={link.label} 
                    onClick={() => handleNavClick(link.page, link.href)} 
                    className={`${isScrolled ? 'text-gray-700' : 'text-white'} font-bold text-xs uppercase tracking-[0.15em] hover:text-brand-green transition-all relative group`}
                >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-green transition-all group-hover:w-full"></span>
               </button>
           ))}
        </nav>
    );


    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-xl py-2 shadow-sm border-b border-gray-100' : 'bg-transparent py-4 md:py-6'}`}>
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between">
                    <Logo />

                    <div className="hidden lg:flex flex-grow items-center justify-center">
                        <NavMenu />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:block">
                            <UserActions />
                        </div>
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)} 
                            className={`p-2 rounded-lg lg:hidden transition-all ${
                                isScrolled 
                                ? 'text-brand-dark hover:bg-gray-100' 
                                : 'text-white hover:bg-white/10'
                            }`}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 overflow-hidden shadow-2xl"
                    >
                        <nav className="flex flex-col space-y-2 p-6">
                            {navLinks.map(link => (
                               <button 
                                    key={link.label} 
                                    onClick={() => handleNavClick(link.page, link.href)} 
                                    className="text-brand-dark font-bold text-[11px] uppercase tracking-[0.2em] text-left py-4 border-b border-gray-50 flex items-center justify-between group"
                                >
                                   {link.label}
                                   <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand-green/10 transition-colors">
                                       <ChevronDown size={14} className="-rotate-90 text-gray-300 group-hover:text-brand-green" />
                                   </div>
                               </button>
                           ))}
                            <div className="pt-4 space-y-4">
                            {currentUser ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={handleMyAccountClick} className="bg-gray-100 text-brand-dark font-bold text-[10px] uppercase tracking-widest py-4 rounded-xl text-center">Dashboard</button>
                                    <button onClick={handleLogout} className="bg-red-50 text-red-500 font-bold text-[10px] uppercase tracking-widest py-4 rounded-xl text-center">Sair</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => { setPage('login'); setIsMenuOpen(false); }} className="bg-gray-100 text-brand-dark font-bold text-[10px] uppercase tracking-widest py-4 rounded-xl text-center">Login</button>
                                    <button onClick={() => { setPage('register'); setIsMenuOpen(false); }} className="bg-brand-green/10 text-brand-green font-bold text-[10px] uppercase tracking-widest py-4 rounded-xl text-center">Cadastrar</button>
                                </div>
                            )}
                            </div>
                            <button 
                                onClick={() => { setPage('booking'); setIsMenuOpen(false); }} 
                                className="bg-brand-green-light text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-brand-green/20 w-full uppercase tracking-[0.2em] text-xs mt-2"
                            >
                                Reservar Agora
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
