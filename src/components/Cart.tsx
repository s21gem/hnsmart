import React from 'react';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../types';
import { formatToBengaliPrice, formatToBengaliNumber } from '../utils';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  total: number;
  onCheckout: () => void;
}

export default function Cart({ isOpen, onClose, items, updateQuantity, removeFromCart, total, onCheckout }: CartProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-emerald-950/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md glass-card shadow-2xl z-50 flex flex-col border-l border-gold-500/30"
          >
            <div className="p-6 border-b border-gold-500/20 flex justify-between items-center bg-emerald-950/5">
              <h2 className="text-2xl font-heading font-bold text-emerald-950 flex items-center gap-3">
                <ShoppingBag className="text-gold-600" />
                আপনার কার্ট
              </h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-emerald-950/10 rounded-full transition-colors text-emerald-950"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                  <ShoppingBag size={64} className="text-gold-500/50" />
                  <p className="text-lg font-heading">আপনার কার্ট খালি</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={item.product.id || `cart-item-${index}`} 
                    className="flex gap-4 bg-white/50 p-4 rounded-2xl border border-gold-500/20 shadow-sm"
                  >
                    <img 
                      src={item.product.imageUrl || "https://picsum.photos/seed/attar/100/100"} 
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-xl border border-gold-500/10"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <h3 className="font-heading font-bold text-emerald-950 leading-tight pr-4">{item.product.name}</h3>
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <div className="flex items-center gap-3 bg-emerald-950/5 rounded-lg p-1 border border-emerald-950/10">
                          <button 
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="p-1 hover:bg-white rounded-md transition-colors text-emerald-950"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-6 text-center font-serif font-bold text-emerald-950">{formatToBengaliNumber(item.quantity)}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="p-1 hover:bg-white rounded-md transition-colors text-emerald-950"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <span className="font-serif font-bold text-emerald-950 text-lg">{formatToBengaliPrice(item.product.discountedPrice * item.quantity)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 bg-emerald-950/5 border-t border-gold-500/20 space-y-4">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-heading">সাবটোটাল:</span>
                    <span className="font-serif">{formatToBengaliPrice(total)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-heading">ডেলিভারি চার্জ:</span>
                    <span className="font-serif">{formatToBengaliPrice(60)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gold-500/20">
                    <span className="text-lg font-heading font-bold text-emerald-950">সর্বমোট:</span>
                    <span className="text-3xl font-serif font-extrabold text-emerald-950">{formatToBengaliPrice(total + 60)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={onCheckout}
                    className="w-full bg-gold-500 hover:bg-gold-600 text-emerald-950 font-heading font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shimmer-btn"
                  >
                    <ShoppingBag size={20} />
                    চেকআউট করুন
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full bg-transparent border border-emerald-950 text-emerald-950 hover:bg-emerald-950/5 font-heading font-bold py-3 rounded-xl transition-all flex items-center justify-center"
                  >
                    আরো কেনাকাটা করুন
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
