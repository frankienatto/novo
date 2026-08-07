import React from 'react';
import { Page } from '../types';
import { ArrowLeft, FileText } from 'lucide-react';

interface TermsAndConditionsViewProps {
    setPage: (page: Page) => void;
}

const TermsAndConditionsView: React.FC<TermsAndConditionsViewProps> = ({ setPage }) => {
    return (
        <div className="bg-brand-light min-h-screen py-8">
            <div className="container mx-auto p-4 sm:p-0">
                <div className="max-w-3xl mx-auto">
                    <button onClick={() => setPage('home')} className="flex items-center gap-2 text-brand-secondary hover:text-brand-dark mb-6">
                        <ArrowLeft size={20} />
                        Voltar para o Início
                    </button>
                    <div className="bg-white p-8 rounded-2xl shadow-lg prose max-w-none">
                        <h1 className="text-4xl font-extrabold text-brand-dark mb-4 flex items-center gap-3">
                            <FileText size={32} />
                            Termos, Condições e Legislação
                        </h1>

                        <h2>1. Termos de Uso</h2>
                        <p>Ao acessar ao site Forest Beach House, concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis.</p>

                        <h2>2. Política de Reserva e Cancelamento</h2>
                        <p>As reservas são confirmadas mediante pagamento. A política de cancelamento varia de acordo com a tarifa selecionada. Tarifas não-reembolsáveis não permitem cancelamento ou alteração. Tarifas flexíveis permitem cancelamento gratuito até 7 dias antes do check-in.</p>
                        
                        <h2>3. Regras da Propriedade</h2>
                        <p>Todos os hóspedes devem seguir as regras da propriedade, que incluem, mas não se limitam a, respeito aos horários de silêncio, proibição de fumo em áreas internas e responsabilidade por danos causados.</p>

                        <h2>4. Lei Geral de Proteção de Dados (LGPD)</h2>
                        <p>Seus dados pessoais coletados durante a reserva e o check-in são utilizados exclusivamente para a prestação dos serviços de hospedagem e para cumprir obrigações legais, em conformidade com a Lei nº 13.709/2018.</p>
                        
                        <h2>5. Isenção de Responsabilidade</h2>
                        <p>O Forest Beach House não se responsabiliza por objetos de valor deixados nas áreas comuns ou nos quartos. Recomendamos o uso de armários individuais com cadeado.</p>
                        
                        <p className="text-sm text-gray-500 mt-8">Última atualização: 29 de Julho de 2024</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditionsView;
