import { Booking, Guest, Room } from '../types';

/**
 * Service to handle integration with Aloha Pro.
 * In a production environment, this would call the actual Aloha Pro API endpoints.
 */
export const alohaProApi = {
    /**
     * Verifies the connection with Aloha Pro using the provided API Key.
     */
    verifyConnection: async (apiKey: string, propertyId: string) => {
        // Simulate API call to verify credentials
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (apiKey.startsWith('alo_') || apiKey.length > 10) {
            return { success: true, message: 'Conectado ao Aloha Pro com sucesso.' };
        }
        return { success: false, message: 'Chave de API inválida para o Aloha Pro.' };
    },

    /**
     * Pulls bookings from Aloha Pro.
     */
    fetchBookings: async (apiKey: string): Promise<Partial<Booking>[]> => {
        // Mock data fetch
        await new Promise(resolve => setTimeout(resolve, 2000));
        return [
            {
                guestId: 'G_ALOHA_01',
                checkIn: new Date().toISOString().split('T')[0],
                checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                status: 'Confirmed',
                source: 'Aloha Pro',
                totalPrice: 450.00
            }
        ];
    },

    /**
     * Pushes a POS transaction to Aloha Pro billing.
     */
    pushTransaction: async (apiKey: string, transaction: any) => {
        await new Promise(resolve => setTimeout(resolve, 800));
        return { success: true, externalId: `ALOHA_TX_${Date.now()}` };
    }
};
