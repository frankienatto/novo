import React from 'react';
import { Page } from '../types';
import { ArrowLeft, Bus, Shield, Sun, Utensils } from 'lucide-react';

interface UsefulLinksViewProps {
    setPage: (page: Page) => void;
}

const UsefulLinksView: React.FC<UsefulLinksViewProps> = ({ setPage }) => {
    const linkSections = [
        {
            title: "Transporte Público",
            icon: Bus,
            links: [
                { name: "Consórcio Fênix (Ônibus Floripa)", url: "#" },
                { name: "Horários de Ônibus Executivo", url: "#" },
            ]
        },
        {
            title: "Segurança e Emergência",
            icon: Shield,
            links: [
                { name: "Polícia Militar", url: "#", note: "Emergência: 190" },
                { name: "Bombeiros", url: "#", note: "Emergência: 193" },
                { name: "Delegacia do Turista", url: "#" },
            ]
        },
        {
            title: "Clima e Praias",
            icon: Sun,
            links: [
                { name: "Previsão do Tempo (Climatempo)", url: "#" },
                { name: "Condições das Praias (IMA)", url: "#" },
            ]
        },
        {
            title: "Gastronomia e Delivery",
            icon: Utensils,
            links: [
                { name: "iFood (Delivery)", url: "#" },
                { name: "Guia de Restaurantes (Veja Floripa)", url: "#" },
            ]
        }
    ];

    return (
        <div className="bg-brand-light min-h-screen py-8">
            <div className="container mx-auto p-4 sm:p-0">
                <div className="max-w-3xl mx-auto">
                    <button onClick={() => setPage('home')} className="flex items-center gap-2 text-brand-secondary hover:text-brand-dark mb-6">
                        <ArrowLeft size={20} />
                        Voltar para o Início
                    </button>
                    <div className="bg-white p-8 rounded-2xl shadow-lg">
                        <h1 className="text-4xl font-extrabold text-brand-dark mb-4">Links Úteis</h1>
                        <p className="text-lg text-gray-600 mb-8">Informações importantes para tornar sua estadia em Florianópolis ainda mais tranquila e segura.</p>
                        
                        <div className="space-y-6">
                            {linkSections.map(section => (
                                <div key={section.title}>
                                    <h2 className="text-2xl font-bold text-brand-dark mb-3 flex items-center gap-3">
                                        <section.icon className="text-brand-green" size={24} />
                                        {section.title}
                                    </h2>
                                    <ul className="space-y-2 list-inside list-disc pl-2 text-brand-green">
                                        {section.links.map(link => (
                                            <li key={link.name}>
                                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-brand-dark hover:text-brand-green hover:underline">
                                                    {link.name}
                                                </a>
                                                {link.note && <span className="text-sm text-gray-500 ml-2">({link.note})</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsefulLinksView;
