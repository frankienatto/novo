import React, { useState } from 'react';
import { Page, Guest } from '../types';
import { ArrowLeft, Loader2, User, Mail, Phone, Fingerprint, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import Logo from './Logo';
import { motion } from 'motion/react';

interface RegisterViewProps {
    setPage: (page: Page) => void;
    onRegister: (guestData: Omit<Guest, 'id'>) => Promise<void>;
}

const SocialButton: React.FC<{ provider: string, children: React.ReactNode }> = ({ provider, children }) => (
    <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button" 
        className="w-full flex justify-center items-center gap-3 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold text-gray-700 bg-white shadow-sm"
    >
        {children}
    </motion.button>
);

const RegisterView: React.FC<RegisterViewProps> = ({ setPage, onRegister }) => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const guestData = {
            fullName: formData.get('fullName') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            cpf: formData.get('cpf') as string,
            password: formData.get('password') as string,
        };
        try {
            await onRegister(guestData);
            setIsSubmitted(true);
        } catch (error: any) {
            console.error("Registration failed", error);
            let msg = "Ocorreu um erro no cadastro. Tente novamente.";
            if (error.code === 'auth/email-already-in-use') msg = "Este e-mail já está em uso por outro usuário.";
            if (error.code === 'auth/weak-password') msg = "A senha é muito fraca. Use pelo menos 6 caracteres.";
            if (error.code === 'auth/invalid-email') msg = "O e-mail informado não é válido.";
            alert(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex overflow-hidden">
            {/* Left Side: Form */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 md:p-16 lg:p-20 overflow-y-auto relative z-10 bg-white"
            >
                <div className="max-w-md w-full mx-auto">
                    <button 
                        onClick={() => setPage('home')} 
                        className="mb-10 group flex items-center gap-2 text-gray-400 hover:text-brand-green transition-colors font-bold text-sm uppercase tracking-widest"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Início
                    </button>

                    {!isSubmitted ? (
                        <div className="animate-fade-in">
                            <div className="mb-8">
                                <Logo className="h-12 w-auto mb-6" />
                                <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight font-display uppercase">Criar Sua Conta</h1>
                                <p className="text-gray-500 font-medium leading-relaxed">
                                    Junte-se à nossa comunidade e tenha acesso a experiências exclusivas na Forest House Beach.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                <SocialButton provider="Google">
                                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                    <span>Google</span>
                                </SocialButton>
                                <SocialButton provider="Facebook">
                                    <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-1.5c-1 0-1.5.5-1.5 1.5V12h3l-.5 3h-2.5v6.95c5.05-.98 8.55-5.32 8.55-10.15z"></path></svg>
                                    <span>Facebook</span>
                                </SocialButton>
                            </div>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                                <div className="relative flex justify-center text-xs"><span className="px-4 bg-white text-gray-400 font-black uppercase tracking-[0.2em]">Ou cadastro manual</span></div>
                            </div>

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <User size={12} /> Nome Completo
                                    </label>
                                    <input type="text" name="fullName" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all font-bold text-gray-700" required placeholder="Ex: João Silva" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <Mail size={12} /> Email
                                    </label>
                                    <input type="email" name="email" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all font-bold text-gray-700" required placeholder="seu@email.com" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                            <Phone size={12} /> Telefone
                                        </label>
                                        <input type="tel" name="phone" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all font-bold text-gray-700" required placeholder="(73) 99999-9999" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                            <Fingerprint size={12} /> CPF
                                        </label>
                                        <input type="text" name="cpf" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all font-bold text-gray-700" required placeholder="000.000.000-00" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <Lock size={12} /> Senha de Acesso
                                    </label>
                                    <input type="password" name="password" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all font-bold text-gray-700" required placeholder="No mínimo 6 caracteres" />
                                </div>
                                
                                <div className="pt-2">
                                    <motion.button 
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        type="submit" 
                                        disabled={isLoading} 
                                        className="w-full bg-brand-green text-white font-black py-5 rounded-2xl text-lg hover:shadow-2xl hover:shadow-brand-green/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : 'Finalizar Cadastro'}
                                    </motion.button>
                                </div>
                            </form>

                            <p className="text-center text-sm font-bold text-gray-400 mt-10 uppercase tracking-widest">
                                Já tem uma conta?{' '}
                                <button onClick={() => setPage('login')} className="text-brand-green hover:text-brand-green-light transition-colors ml-2">
                                    Fazer Login
                                </button>
                            </p>
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center py-10"
                        >
                            <div className="w-24 h-24 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-8 text-brand-green">
                                <ShieldCheck size={48} />
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 mb-4 font-display uppercase tracking-tight">Cadastro Realizado!</h2>
                            <p className="text-gray-500 font-medium mb-12 text-lg">Seja bem-vindo(a) ao Forest House Beach! Sua jornada de luxo e tranquilidade começa agora.</p>
                            
                            <div className="space-y-4">
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setPage('login')} 
                                    className="w-full bg-brand-green text-white font-black py-5 rounded-2xl text-lg hover:shadow-2xl hover:shadow-brand-green/20 transition-all uppercase tracking-widest"
                                >
                                    Acessar Minha Conta
                                </motion.button>
                                <button onClick={() => setPage('home')} className="w-full text-gray-400 font-black py-3 uppercase tracking-widest text-sm hover:text-brand-dark transition-colors">
                                    Voltar para o Início
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Right Side: Image/Info */}
            <div className="hidden lg:block lg:w-1/2 relative bg-brand-dark overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1544124499-58912cbddaad?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                    alt="Beach House Interior" 
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-brand-dark via-brand-dark/30 to-transparent"></div>
                
                <div className="absolute inset-0 flex flex-col justify-center p-24 text-white">
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="mb-6 inline-block bg-brand-green/20 backdrop-blur-md rounded-full px-4 py-1 border border-brand-green/30">
                            <span className="text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-2">
                                <Sparkles size={12} className="text-brand-sand" /> Guest Experience AI
                            </span>
                        </div>
                        <h2 className="text-6xl font-black mb-8 font-serif leading-tight">Um novo conceito <br/>de hospedagem.</h2>
                        <ul className="space-y-6">
                            {[
                                "Automação Inteligente em cada detalhe",
                                "Experiências personalizadas por IA",
                                "Atendimento Omni-channel 24/7",
                                "Check-in digital sem burocracia"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-4 text-white/80 font-medium">
                                    <div className="w-1.5 h-1.5 bg-brand-sand rounded-full"></div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default RegisterView;
