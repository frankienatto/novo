
/**
 * Beds24 API V2 Service Implementation
 * Documentation: https://beds24.com/api/v2
 */

const getHeaders = () => {
    // Credenciais Beds24 nunca podem ser carregadas pelo bundle público. A
    // integração deve ser executada por um endpoint server-side autenticado.
    throw new Error('Integração Beds24 indisponível: requer configuração server-side.');
};

export const beds24Api = {
    // Buscar todas as propriedades da conta
    getProperties: async () => {
        const response = await fetch('https://api.beds24.com/v2/properties', {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Falha ao buscar propriedades no Beds24');
        return await response.json();
    },

    // Atualizar Inventário (Disponibilidade)
    // Documentação V2: POST /inventory
    updateInventory: async (updates: any[]) => {
        const response = await fetch('https://api.beds24.com/v2/inventory', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(updates)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Falha ao atualizar inventário no Beds24');
        }
        return await response.json();
    }
};
