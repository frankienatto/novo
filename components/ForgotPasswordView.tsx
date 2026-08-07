

import React, { useState } from 'react';
import { Page } from '../types';
import Logo from './Logo';
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react';

interface ForgotPasswordViewProps {
    setPage: (page: Page) => void;
}

const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ setPage }) => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would trigger an API call to send a reset email.
        // For this frontend-only version, we'll just show the success message.
        setIsSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <button onClick={() => setPage('home')} className="mb-8">
                    <Logo className="h-24 w-48 mx-auto" />
                </button>
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                    {isSubmitted ? (
                        <div className="text-center">
                            <CheckCircle size={48} className="mx-auto text-brand-green mb-4" />
                            <h1 className="text-2xl font-bold text-brand-dark mb-2">Verifique seu Email</h1>
                            <p className="text-gray-600">Se uma conta com o email <strong>{email}</strong> existir, enviamos um link para você redefinir sua senha.</p>
                            <button onClick={() => setPage('login')} className="mt-6 w-full bg-brand-dark text-white font-bold py-2 rounded-lg hover:bg-gray-700">
                                Voltar para o Login
                            </button>
                        </div>
                    ) : (
                        <>
                            <button onClick={() => setPage('login')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-dark mb-4">
                                <ArrowLeft size={16} /> Voltar para o Login
                            </button>
                            <h1 className="text-3xl font-extrabold text-brand-dark mb-2">Esqueceu sua Senha?</h1>
                            <p className="text-brand-secondary mb-6">Sem problemas. Insira seu email e enviaremos um link para você voltar a ter acesso à sua conta.</p>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <div className="relative">
                                        <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="input-base pl-10"
                                            required
                                            placeholder="seu@email.com"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-brand-green text-white font-bold py-3 rounded-lg text-lg hover:bg-brand-green-dark transition-all">
                                    Enviar Link de Redefinição
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordView;