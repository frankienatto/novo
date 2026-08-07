import React, { useState } from 'react';
import { DBState, SaleItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils, Star, Info, ChevronRight, Leaf, ShoppingBag, Plus, Minus, Send, X, CheckCircle2 } from 'lucide-react';
import { eventBus } from '../services/apiService';

interface PublicDigitalMenuViewProps {
    db: DBState;
    onPlaceOrder?: (items: SaleItem[], location: string) => Promise<void>;
}

const PublicDigitalMenuView: React.FC<PublicDigitalMenuViewProps> = ({ db, onPlaceOrder }) => {
    const { digitalMenu, properties, themeSettings, tables, rooms } = db;
    const activeProperty = properties.find(p => p.id === db.currentPropertyId);
    
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [orderLocation, setOrderLocation] = useState(''); // Table number or Room
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const addToCart = (productId: string, name: string, price: number) => {
        setCart(prev => {
            const existing = prev.find(i => i.productId === productId);
            if (existing) {
                return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { productId, name, quantity: 1, unitPrice: price }];
        });
        eventBus.emit('new-toast', { type: 'success', title: 'Adicionado!', message: `${name} foi para o seu pedido.` });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.productId === productId) {
                const newQty = Math.max(0, i.quantity + delta);
                return { ...i, quantity: newQty };
            }
            return i;
        }).filter(i => i.quantity > 0));
    };

    const cartTotal = cart.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
    const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

    const handleSendOrder = async () => {
        if (!orderLocation) {
            alert('Por favor, informe sua Mesa ou Quarto.');
            return;
        }
        setIsSubmitting(true);
        try {
            if (onPlaceOrder) {
                await onPlaceOrder(cart, orderLocation);
            } else {
                // Mock behavior if not provided
                await new Promise(r => setTimeout(r, 1500));
            }
            setOrderSuccess(true);
            setCart([]);
            setTimeout(() => {
                setOrderSuccess(false);
                setIsCartOpen(false);
            }, 3000);
        } catch (error) {
            alert('Erro ao enviar pedido. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-[#fdfaf3] min-h-screen font-sans pb-32">
            <div className="container mx-auto max-w-2xl">
                <header className="relative h-64 flex items-center justify-center overflow-hidden">
                    <img 
                        src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop" 
                        alt="Menu Header"
                        className="absolute inset-0 w-full h-full object-cover brightness-[0.4]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    
                    <div className="relative z-10 text-center px-4">
                         {activeProperty && (
                            <img 
                                src={themeSettings.publicSite.logoUrl} 
                                alt={`${activeProperty.name} Logo`} 
                                className="h-16 mx-auto mb-4 brightness-0 invert" 
                            />
                        )}
                        <h1 className="text-4xl font-display font-extrabold text-white tracking-tight uppercase">Menu Experiência</h1>
                        <p className="text-white/80 text-xs font-black uppercase tracking-[0.3em] mt-2">Forest Beach House</p>
                    </div>
                </header>

                <main className="px-4 -mt-10 relative z-20 space-y-12">
                    {digitalMenu && digitalMenu.length > 0 ? (
                        digitalMenu.map((category, idx) => (
                            <motion.section 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={idx}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-0.5 flex-grow bg-brand-green/20"></div>
                                    <h2 className="text-lg font-display font-black text-brand-green uppercase tracking-widest px-4">
                                        {category.categoryName}
                                    </h2>
                                    <div className="h-0.5 flex-grow bg-brand-green/20"></div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {category.items.map((item, itemIdx) => (
                                        <motion.div 
                                            whileHover={{ y: -2 }}
                                            key={item.productId} 
                                            className="bg-white p-6 rounded-[32px] shadow-xl shadow-black/5 border border-gray-50 flex gap-4 items-center group"
                                        >
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-display font-extrabold text-lg text-brand-dark group-hover:text-brand-green transition-colors">{item.name}</h3>
                                                    <p className="font-display font-black text-lg text-brand-green whitespace-nowrap ml-4">
                                                        {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </p>
                                                </div>
                                                <p className="text-sm text-gray-500 font-medium leading-relaxed italic pr-4">{item.description}</p>
                                                
                                                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                                                    <div className="flex gap-2">
                                                        {itemIdx % 3 === 0 && (
                                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-green/5 text-brand-green rounded-full text-[9px] font-black uppercase tracking-widest">
                                                                <Star size={10} /> Favorito
                                                            </div>
                                                        )}
                                                        {itemIdx % 5 === 0 && (
                                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                                <Utensils size={10} /> Chef's Pick
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={() => addToCart(item.productId, item.name, item.price)}
                                                        className="bg-brand-green text-white p-3 rounded-2xl shadow-lg border-2 border-white group-active:scale-95 transition-all flex items-center gap-2 text-xs font-bold"
                                                    >
                                                        <Plus size={16} /> Adicionar
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-brand-sand flex items-center justify-center text-brand-dark opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight size={20} />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>
                        ))
                    ) : (
                        <div className="text-center py-24 bg-white rounded-[48px] shadow-2xl shadow-black/5 border border-gray-50">
                            <Utensils size={48} className="mx-auto text-brand-green/20 mb-6" />
                            <h2 className="text-2xl font-display font-extrabold text-brand-dark mb-4 uppercase">Cardápio Indisponível</h2>
                            <p className="text-gray-500 font-medium px-8 leading-relaxed max-w-sm mx-auto">Nosso cardápio digital está sendo atualizado com novos sabores. Por favor, consulte nossa equipe.</p>
                        </div>
                    )}
                </main>

                <footer className="text-center mt-20 px-8 py-12 bg-brand-green/5 rounded-[48px] border border-brand-green/10">
                    <div className="flex items-center justify-center gap-2 text-brand-green mb-4">
                        <Leaf size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cozinha Consciente & Local</span>
                    </div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.1em]">
                        &copy; {new Date().getFullYear()} {activeProperty?.name}.
                    </p>
                </footer>
            </div>

            {/* Floating Cart Button */}
            {cartCount > 0 && (
                <motion.div 
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-50"
                >
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="w-full bg-brand-dark text-white p-5 rounded-[28px] shadow-2xl flex items-center justify-between border-4 border-white/10"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-brand-green text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black">
                                {cartCount}
                            </div>
                            <span className="font-display font-black uppercase tracking-widest text-xs">Ver Pedido</span>
                        </div>
                        <span className="font-display font-black text-lg">
                            {cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </button>
                </motion.div>
            )}

            {/* Cart Modal */}
            <AnimatePresence>
                {isCartOpen && (
                    <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        ></motion.div>
                        <motion.div 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="relative w-full max-w-2xl bg-[#fdfaf3] rounded-[48px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
                        >
                            <div className="p-8 border-b border-brand-green/10 flex justify-between items-center">
                                <h2 className="font-display font-black text-2xl text-brand-dark uppercase tracking-tight">Seu Pedido</h2>
                                <button onClick={() => setIsCartOpen(false)} className="p-3 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {orderSuccess ? (
                                <div className="p-12 text-center flex flex-col items-center justify-center">
                                    <div className="w-20 h-20 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle2 size={48} />
                                    </div>
                                    <h3 className="text-2xl font-display font-extrabold text-brand-dark mb-2">Pedido Enviado!</h3>
                                    <p className="text-gray-500 font-medium">Sua experiência está sendo preparada agora mesmo.</p>
                                </div>
                            ) : (
                                <div className="flex-grow overflow-y-auto p-8 space-y-4">
                                    {cart.map(item => (
                                        <div key={item.productId} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                                            <div>
                                                <h4 className="font-display font-extrabold text-brand-dark">{item.name}</h4>
                                                <p className="text-brand-green font-display font-black text-sm">{item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100">
                                                <button onClick={() => updateQuantity(item.productId, -1)} className="p-2 hover:bg-gray-50 rounded-xl text-brand-green">
                                                    <Minus size={16} />
                                                </button>
                                                <span className="font-display font-black w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.productId, 1)} className="p-2 hover:bg-gray-50 rounded-xl text-brand-green">
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="mt-8 space-y-4 bg-white p-6 rounded-[32px] border border-gray-100">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Onde você está?</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ex: Mesa 04 ou Quarto 201" 
                                            value={orderLocation}
                                            onChange={e => setOrderLocation(e.target.value)}
                                            className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-brand-dark font-display font-extrabold placeholder:text-gray-300 focus:ring-2 focus:ring-brand-green"
                                        />
                                    </div>
                                </div>
                            )}

                            {!orderSuccess && (
                                <div className="p-8 bg-white border-t border-brand-green/10">
                                    <div className="flex justify-between items-center mb-6 px-2">
                                        <span className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Total do Pedido</span>
                                        <span className="font-display font-black text-2xl text-brand-dark">{cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    <button 
                                        disabled={cart.length === 0 || isSubmitting || !orderLocation}
                                        onClick={handleSendOrder}
                                        className="w-full btn-primary p-6 rounded-[28px] flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all shadow-xl shadow-brand-green/20"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <Send size={20} />
                                                <span className="font-display font-black uppercase tracking-widest">Enviar Pedido para Produção</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PublicDigitalMenuView;