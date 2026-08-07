import React from 'react';
import { Transaction, PropertyInfo, SaleItem, Booking, Guest, Room } from '../../types';
import { Printer, Download, X } from 'lucide-react';

interface ReceiptProps {
    propertyInfo?: PropertyInfo;
    transaction?: Transaction;
    booking?: Booking;
    guest?: Guest;
    room?: Room;
    onClose: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ propertyInfo, transaction, booking, guest, room, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    const total = transaction ? transaction.total : (booking ? booking.totalPrice : 0);
    const date = transaction ? new Date(transaction.timestamp) : new Date();

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex justify-center items-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative print:shadow-none print:w-full print:max-w-none">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 print:hidden">
                    <X />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 uppercase">{propertyInfo?.name || 'Forest House Hostel'}</h2>
                    <p className="text-xs text-gray-500">{propertyInfo?.address || 'Praia do Rosa, SC'}</p>
                    {propertyInfo?.cnpj && <p className="text-xs text-gray-500">CNPJ: {propertyInfo.cnpj}</p>}
                    {propertyInfo?.phone && <p className="text-xs text-gray-500">Tel: {propertyInfo.phone}</p>}
                </div>

                <div className="border-t border-b border-dashed py-4 mb-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">Recibo #:</span>
                        <span>{transaction ? transaction.id : (booking ? booking.id : 'N/A')}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">Data:</span>
                        <span>{date.toLocaleDateString()} {date.toLocaleTimeString()}</span>
                    </div>
                    {guest && (
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-semibold">Hóspede:</span>
                            <span>{guest.fullName || 'Hóspede'}</span>
                        </div>
                    )}
                    {room && (
                        <div className="flex justify-between text-sm">
                            <span className="font-semibold">Quarto:</span>
                            <span>{room.name || 'Alojamento'}</span>
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Itens</h3>
                    <div className="space-y-2">
                        {transaction && transaction.items && transaction.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span>{item.quantity || 1}x {item?.name || 'Item'}</span>
                                <span>{((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        ))}
                        {booking && (
                            <div className="flex justify-between text-sm">
                                <span>Hospedagem ({Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000)} diárias)</span>
                                <span>{(booking.totalPrice || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        )}
                        {booking && booking.addOns && booking.addOns.map((addon, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span>{addon?.name || 'Adicional'}</span>
                                <span>{(addon?.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-dashed pt-4 mb-6">
                    <div className="flex justify-between text-lg font-bold">
                        <span>TOTAL</span>
                        <span>{(total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Forma de Pagamento:</span>
                        <span>{transaction ? (transaction.paymentMethod || 'Dinheiro/PIX') : 'Pendente'}</span>
                    </div>
                </div>

                <div className="text-center text-xs text-gray-400 italic mb-6">
                    Obrigado pela preferência!<br />
                    Volte sempre à {propertyInfo?.name || 'Forest House'}
                </div>

                <div className="flex gap-2 print:hidden">
                    <button onClick={handlePrint} className="flex-1 bg-brand-dark text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
                        <Printer size={18} /> Imprimir
                    </button>
                    <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Receipt;
