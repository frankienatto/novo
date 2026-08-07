import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, QrCode, Copy, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { createPaymentIntent, createPixPayment } from '../../services/paymentService';

// Carrega o Stripe com a chave pública do .env
const stripePromise = loadStripe((import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  bookingId: string;
  guestName: string;
  onSuccess: (provider: 'stripe' | 'pix') => void;
}

const StripeForm = ({ amount, bookingId, onSuccess, onError }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Criar PaymentIntent no backend
      const { clientSecret } = await createPaymentIntent(amount, bookingId);

      // 2. Confirmar pagamento com o Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement) as any,
        },
      });

      if (result.error) {
        setErrorMessage(result.error.message || 'Falha no pagamento');
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1a4731',
                '::placeholder': { color: '#aab7c4' },
              },
              invalid: { color: '#9e2146' },
            },
          }}
        />
      </div>
      
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 px-4 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-secondary transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
        Pagar R$ {amount.toFixed(2)}
      </button>
    </form>
  );
};

const PixSection = ({ amount, bookingId, guestName, onSuccess }: any) => {
  const [pixData, setPixData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const initPix = async () => {
      setIsLoading(true);
      try {
        const data = await createPixPayment(amount, bookingId, guestName);
        setPixData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    initPix();
  }, []);

  const copyToClipboard = () => {
    if (pixData?.copyPaste) {
      navigator.clipboard.writeText(pixData.copyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>;

  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      <div className="p-4 bg-white rounded-xl shadow-inner border-2 border-gray-100">
        <QRCodeSVG value={pixData?.qrCode || ''} size={200} />
      </div>

      <div className="w-full space-y-3">
        <p className="text-sm text-gray-600">Escaneie o QR Code ou use o código abaixo:</p>
        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <code className="text-xs text-gray-700 truncate flex-1 text-left">
            {pixData?.copyPaste}
          </code>
          <button 
            onClick={copyToClipboard}
            className="p-2 hover:bg-white rounded-md transition-colors"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
          </button>
        </div>
      </div>

      <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm flex items-start gap-3 text-left">
        <div className="mt-1"><AlertCircle className="w-4 h-4" /></div>
        <p>O pagamento via PIX é instantâneo. Sua reserva será confirmada assim que o sistema detectar a transação.</p>
      </div>

      <button
        onClick={() => onSuccess()}
        className="w-full py-3 px-4 border-2 border-brand-primary text-brand-primary rounded-lg font-medium hover:bg-brand-primary hover:text-white transition-all flex justify-center items-center gap-2"
      >
        Já fiz o pagamento
      </button>
    </div>
  );
};

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, amount, bookingId, guestName, onSuccess }) => {
  const [method, setMethod] = useState<'stripe' | 'pix' | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSuccess = (provider: 'stripe' | 'pix') => {
    setIsSuccess(true);
    setTimeout(() => {
      onSuccess(provider);
      onClose();
      setIsSuccess(false);
      setMethod(null);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-brand-primary text-white">
          <div>
            <h3 className="text-xl font-display font-medium">Pagamento</h3>
            <p className="text-brand-light/80 text-sm">Reserva #{bookingId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12 flex flex-col items-center text-center space-y-4"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-2xl font-display font-medium text-gray-900">Pagamento Recebido!</h4>
                <p className="text-gray-600">Sua reserva está sendo confirmada...</p>
              </motion.div>
            ) : method === 'stripe' ? (
              <motion.div key="stripe" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => setMethod(null)} className="mb-4 text-sm text-brand-primary font-medium hover:underline flex items-center gap-1">
                  ← Trocar método
                </button>
                <Elements stripe={stripePromise}>
                  <StripeForm amount={amount} bookingId={bookingId} onSuccess={() => handleSuccess('stripe')} />
                </Elements>
              </motion.div>
            ) : method === 'pix' ? (
              <motion.div key="pix" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => setMethod(null)} className="mb-4 text-sm text-brand-primary font-medium hover:underline flex items-center gap-1">
                  ← Trocar método
                </button>
                <PixSection amount={amount} bookingId={bookingId} guestName={guestName} onSuccess={() => handleSuccess('pix')} />
              </motion.div>
            ) : (
              <motion.div key="methods" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="text-center mb-6">
                  <span className="text-4xl font-display font-bold text-brand-primary">
                    R$ {amount.toFixed(2)}
                  </span>
                </div>

                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider text-center">Escolha como pagar</p>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => setMethod('pix')}
                    className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-xl hover:border-brand-primary hover:bg-brand-light/20 transition-all group"
                  >
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <QrCode className="w-7 h-7" />
                    </div>
                    <span className="font-medium text-gray-900">PIX</span>
                    <span className="text-xs text-gray-500">Instantâneo e sem taxas</span>
                  </button>

                  <button
                    onClick={() => setMethod('stripe')}
                    className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-xl hover:border-brand-primary hover:bg-brand-light/20 transition-all group"
                  >
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <CreditCard className="w-7 h-7" />
                    </div>
                    <span className="font-medium text-gray-900">Cartão de Crédito</span>
                    <span className="text-xs text-gray-500">Stripe (Visa, Master, etc)</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
