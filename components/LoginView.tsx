import React, { useState } from 'react';
import { Page } from '../types';
import Logo from './Logo';
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, Lock, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginViewProps {
    setPage: (page: Page) => void;
    handleLogin: (email: string, pass: string) => Promise<boolean>;
    handleLoginWithGoogle?: () => Promise<boolean>;
}

const SocialButton: React.FC<{ provider: string, onClick?: () => void, children: React.ReactNode }> = ({ provider, onClick, children }) => (
    <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button" 
        onClick={onClick}
        className="w-full flex justify-center items-center gap-3 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold text-gray-700 bg-white shadow-sm"
    >
        {children}
    </motion.button>
);


const LoginView: React.FC<LoginViewProps> = ({ setPage, handleLogin, handleLoginWithGoogle }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const success = await handleLogin(email, password);
            if (!success) {
                setError('As credenciais informadas não correspondem a nenhum usuário ou a senha está incorreta.');
            }
        } catch (err: any) {
            console.error("Login component error:", err);
            let msg = err.message || 'Ocorreu um erro ao entrar.';
            if (err.code === 'auth/user-not-found') msg = "Usuário não encontrado.";
            if (err.code === 'auth/wrong-password') msg = "Senha incorreta.";
            if (err.code === 'auth/invalid-credential') msg = "Credenciais inválidas. Verifique seu e-mail e senha.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const onGoogleLogin = async () => {
        if (!handleLoginWithGoogle) return;
        setIsLoading(true);
        try {
            await handleLoginWithGoogle();
        } catch (err: any) {
            setError(err.message || 'Erro no login com Google.');
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
                className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 md:p-24 relative z-10 bg-white"
            >
                <div className="max-w-md w-full mx-auto">
                    <button 
                        onClick={() => setPage('home')} 
                        className="mb-12 group flex items-center gap-2 text-gray-400 hover:text-brand-green transition-colors font-bold text-sm uppercase tracking-widest"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Voltar para o site
                    </button>

                    <div className="mb-10">
                        <Logo className="h-16 w-auto mb-8" />
                        <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight font-display uppercase">Bem-vindo de volta</h1>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            Acesse sua conta para gerenciar suas reservas e experiências na Forest House Beach.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <SocialButton provider="Google" onClick={onGoogleLogin}>
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                            <span>Google</span>
                        </SocialButton>
                        <SocialButton provider="Facebook">
                            <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-1.5c-1 0-1.5.5-1.5 1.5V12h3l-.5 3h-2.5v6.95c5.05-.98 8.55-5.32 8.55-10.15z"></path></svg>
                            <span>Facebook</span>
                        </SocialButton>
                    </div>

                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                        <div className="text-sm text-orange-800">
                            <p className="font-bold">Aviso Configuração:</p>
                            <p>Se o login Google falhar, verifique se o provedor está <strong>Ativado</strong> no Console do Firebase. Use o login de e-mail como alternativa.</p>
                        </div>
                    </div>

                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                        <div className="relative flex justify-center text-xs"><span className="px-4 bg-white text-gray-400 font-black uppercase tracking-[0.2em]">Ou login convencional</span></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Mail size={12} /> Email de Acesso
                            </label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                name="email" 
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all font-bold text-gray-700" 
                                required 
                                placeholder="exemplo@email.com"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Lock size={12} /> Senha
                                </label>
                                <button type="button" onClick={() => setPage('forgotPassword')} className="text-[10px] uppercase tracking-widest font-black text-brand-green hover:text-brand-green-light transition-colors">Esqueceu?</button>
                            </div>
                            <div className="relative">
                                <input 
                                    type={showPassword ? 'text' : 'password'}
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    name="password" 
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all font-bold text-gray-700" 
                                    required 
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-brand-green"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold flex items-center gap-3 border border-red-100"
                            >
                                <CheckCircle2 size={18} className="rotate-180" />
                                {error}
                            </motion.div>
                        )}

                        <motion.button 
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full bg-brand-green text-white font-black py-5 rounded-2xl text-lg hover:shadow-2xl hover:shadow-brand-green/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Entrar na Conta'}
                        </motion.button>
                    </form>

                    <p className="text-center text-sm font-bold text-gray-400 mt-12 uppercase tracking-widest">
                        Não tem conta?{' '}
                        <button onClick={() => setPage('register')} className="text-brand-green hover:text-brand-green-light transition-colors ml-2">
                            Criar Agora
                        </button>
                    </p>
                </div>
            </motion.div>

            {/* Right Side: Image/Info */}
            <div className="hidden lg:block lg:w-1/2 relative bg-brand-dark overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                    alt="Forest House Beach" 
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/20 to-transparent"></div>
                
                <div className="absolute inset-0 flex flex-col justify-end p-24 text-white">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="mb-6 inline-block bg-brand-green/20 backdrop-blur-md rounded-full px-4 py-1 border border-brand-green/30">
                            <span className="text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-2">
                                <Sparkles size={12} className="text-brand-sand" /> Luxury Boutique House
                            </span>
                        </div>
                        <h2 className="text-6xl font-black mb-8 font-serif leading-tight">Sua jornada <br/>começa aqui.</h2>
                        <div className="flex gap-12">
                            <div className="flex flex-col">
                                <span className="text-5xl font-black text-brand-sand">100%</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Energia Positiva</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-5xl font-black text-brand-sand">4.9/5</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Avaliação Média</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
