import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Star, Clock, ShieldCheck, Droplet, CheckCircle2, Truck, Gift, Moon, Plus, Minus, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Product, CartItem } from '../types';
import Cart from './Cart';
import CountdownTimer from './CountdownTimer';
import ProductCard from './ProductCard';
import { formatToBengaliPrice, formatToBengaliNumber } from '../utils';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import parse from 'html-react-parser';

interface CustomerViewProps {
  products: Product[];
  isLoading: boolean;
}

export default function CustomerView({ products, isLoading }: CustomerViewProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [singleProductQuantity, setSingleProductQuantity] = useState(1);
  
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [visibleElements, setVisibleElements] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleElements(prev => {
          const newState = { ...prev };
          entries.forEach(entry => {
            if (entry.target.id) {
              newState[entry.target.id] = entry.isIntersecting;
            }
          });
          return newState;
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.01,
      }
    );

    const observeElements = () => {
      const formEl = document.getElementById('order-form');
      const heroEl = document.getElementById('hero-cta');

      if (formEl) observer.observe(formEl);
      if (heroEl) observer.observe(heroEl);
    };

    // Observe immediately
    observeElements();

    // Also observe after a short delay to account for any rendering delays
    const timeoutId = setTimeout(observeElements, 500);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [isLoading, products.length]);

  const isAnyCtaVisible = Object.values(visibleElements).some(Boolean);

  const scrollToForm = () => {
    document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const isMultiProduct = products.length > 1;

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.product.discountedPrice * item.quantity), 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryCharge = 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let orderPayload;

    if (isMultiProduct) {
      if (cartItems.length === 0) {
        alert("আপনার কার্ট খালি। দয়া করে প্রোডাক্ট যোগ করুন।");
        setIsSubmitting(false);
        return;
      }
      orderPayload = {
        customerName,
        mobileNumber,
        address,
        totalAmount: cartTotal + deliveryCharge,
        paymentMethod: "Cash on Delivery",
        items: cartItems.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          discountedPrice: item.product.discountedPrice,
          quantity: item.quantity
        }))
      };
    } else {
      orderPayload = {
        customerName,
        mobileNumber,
        address,
        totalAmount: (products[0].discountedPrice * singleProductQuantity) + deliveryCharge,
        paymentMethod: "Cash on Delivery",
        items: [{
          id: products[0].id,
          name: products[0].name,
          price: products[0].price,
          discountedPrice: products[0].discountedPrice,
          quantity: singleProductQuantity
        }]
      };
    }

    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderPayload,
        timestamp: new Date().toISOString(),
        status: 'Pending'
      });
      
      // Telegram Notification
      try {
        // Strip all whitespace in case of accidental spaces in the env vars
        const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN?.replace(/\s/g, '');
        const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID?.replace(/\s/g, '');
        
        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
          const itemsText = orderPayload.items.map(item => `- ${item.name} (x${item.quantity})`).join('\n');
          
          // Using HTML parse mode is much safer than Markdown for user-generated content
          const message = `
🛍️ <b>New Order Received!</b>
<b>Order ID:</b> ${docRef.id}
<b>Customer:</b> ${orderPayload.customerName.replace(/</g, '&lt;')}
<b>Phone:</b> ${orderPayload.mobileNumber.replace(/</g, '&lt;')}
<b>Address:</b> ${orderPayload.address.replace(/</g, '&lt;')}
<b>Total:</b> BDT ${orderPayload.totalAmount}

<b>Items:</b>
${itemsText.replace(/</g, '&lt;')}
          `;
          
          // Use URLSearchParams to send as application/x-www-form-urlencoded
          // This avoids the CORS preflight (OPTIONS) request which often fails in browsers
          const params = new URLSearchParams();
          params.append('chat_id', TELEGRAM_CHAT_ID);
          params.append('text', message);
          params.append('parse_mode', 'HTML');
          
          const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            body: params
          });

          if (!response.ok) {
            const errText = await response.text();
            console.error('Telegram API Error:', response.status, errText);
          }
        }
      } catch (telegramError) {
        console.error('Failed to send Telegram notification:', telegramError);
        // We don't want to block the success flow if Telegram fails
      }
      
      setIsSuccess(true);
      setCustomerName('');
      setMobileNumber('');
      setAddress('');
      setCartItems([]);
      
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('অর্ডার সাবমিট করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gold-500"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-emerald-950 font-heading">কোনো প্রোডাক্ট পাওয়া যায়নি।</p>
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      {/* Header */}
      <header className="bg-emerald-950 text-ivory py-4 sticky top-0 z-40 shadow-2xl border-b border-gold-500/20">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Moon className="text-gold-500" size={28} />
            <span className="text-2xl font-heading font-bold tracking-wider text-gold-500">HNS Mart</span>
          </div>
          {isMultiProduct && (
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gold-500 hover:text-gold-600 transition-colors"
            >
              <ShoppingCart size={28} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-emerald-950">
                  {formatToBengaliNumber(cartItemCount)}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Urgency Bar & Countdown */}
      <div className="container mx-auto px-4 py-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="glass-card rounded-2xl p-6 text-center max-w-3xl mx-auto border-t-4 border-t-gold-500 shadow-2xl"
        >
          <p className="text-emerald-950 font-bold font-heading text-xl md:text-2xl flex items-center justify-center gap-2 mb-4">
            <Clock className="text-gold-600 animate-pulse" size={28} />
            রমজান স্পেশাল অফার! স্টক শেষ হওয়ার আগেই অর্ডার করুন
          </p>
          <CountdownTimer />
        </motion.div>
      </div>

      <main className="container mx-auto px-4 max-w-6xl">
        {isMultiProduct ? (
          /* MULTI-PRODUCT GRID VIEW */
          <motion.section 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            className="py-8"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-center text-emerald-950 mb-12">
              আমাদের প্রিমিয়াম কালেকশন
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, index) => (
                <ProductCard 
                  key={product.id || `product-${index}`} 
                  product={product} 
                  index={index} 
                  onAddToCart={addToCart} 
                />
              ))}
            </div>
          </motion.section>
        ) : (
          /* SINGLE PRODUCT LANDING PAGE VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start py-8">
            {/* Product Image */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }}
              className="relative lg:sticky lg:top-24"
            >
              <div className="absolute -inset-4 bg-gold-500/20 rounded-full blur-3xl -z-10"></div>
              <motion.img 
                animate={{ y: [0, -15, 0] }} 
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                src={products[0].imageUrl || "https://picsum.photos/seed/attar/600/600"} 
                alt={products[0].name} 
                className="w-full aspect-square object-cover rounded-3xl shadow-2xl border-4 border-gold-500/30"
                referrerPolicy="no-referrer"
              />
              {(products[0].price - products[0].discountedPrice) > 0 && (
                <div className="absolute top-6 right-6 bg-gold-500 text-emerald-950 px-6 py-2 rounded-full text-lg font-bold shadow-xl transform rotate-3">
                  {formatToBengaliPrice(products[0].price - products[0].discountedPrice)} সাশ্রয় করুন!
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <div className="flex items-center gap-2 text-[#D4AF37] mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={20} />)}
                  </div>
                  <span className="text-[#022c22] font-bengali-sans font-medium ml-2">
                    {formatToBengaliNumber('4.9')}/৫ - {formatToBengaliNumber(120)}+ রিভিউ
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bengali-serif font-bold text-[#022c22] leading-tight mb-4">
                  {products[0].name}
                </h1>
                <div className="text-lg text-slate-700 font-bengali-sans leading-relaxed prose prose-emerald max-w-none">
                  {parse(products[0].description)}
                </div>
              </div>

              {/* Pricing Box */}
              <div className="glass-card p-6 rounded-2xl border border-[#D4AF37]/40 relative overflow-hidden shadow-lg">
                {(products[0].price - products[0].discountedPrice) > 0 && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1.5 rounded-bl-xl font-bengali-sans font-bold shadow-md animate-pulse">
                    {formatToBengaliPrice(products[0].price - products[0].discountedPrice)} সাশ্রয়!
                  </div>
                )}
                <p className="text-slate-500 text-lg font-bengali-sans mb-1">
                  রেগুলার প্রাইস: <span className="line-through">{formatToBengaliPrice(products[0].price)}</span>
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-slate-700 text-xl font-bengali-sans font-medium">অফার প্রাইস:</span>
                  <span className="text-5xl font-bengali-serif font-extrabold text-[#022c22]">
                    {formatToBengaliPrice(products[0].discountedPrice)}
                  </span>
                </div>
              </div>

              {/* Urgency/Scarcity Trigger */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-red-600 font-bengali-sans font-bold text-lg flex items-center gap-2">
                  <span className="animate-pulse">🔥</span> আর মাত্র {formatToBengaliNumber(12)} টি কম্বো স্টকে আছে!
                </p>
                <div className="w-full bg-red-200 rounded-full h-2 mt-3 overflow-hidden">
                  <div className="bg-red-500 h-2 rounded-full w-1/4"></div>
                </div>
              </div>

              {/* Trust Features Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <ShieldCheck className="text-[#D4AF37] shrink-0" size={24} />
                  <span className="text-[#022c22] font-bengali-sans font-semibold">১০০% অরিজিনাল</span>
                </div>
                <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <Droplet className="text-[#D4AF37] shrink-0" size={24} />
                  <span className="text-[#022c22] font-bengali-sans font-semibold">লং লাস্টিং সুঘ্রাণ</span>
                </div>
                <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <Truck className="text-[#D4AF37] shrink-0" size={24} />
                  <span className="text-[#022c22] font-bengali-sans font-semibold">সারা দেশে ডেলিভারি</span>
                </div>
                <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <Gift className="text-[#D4AF37] shrink-0" size={24} />
                  <span className="text-[#022c22] font-bengali-sans font-semibold">প্রিমিয়াম প্যাকেজিং</span>
                </div>
              </div>

              <button 
                id="hero-cta"
                onClick={scrollToForm}
                className="w-full bg-gold-500 hover:bg-gold-600 text-emerald-950 text-xl font-bengali-serif font-bold py-5 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 shimmer-btn"
              >
                <ShoppingCart size={24} />
                অর্ডার করতে ক্লিক করুন
              </button>
            </motion.div>
          </div>
        )}

        {/* Checkout Form Section */}
        <motion.div 
          id="order-form"
          initial={{ opacity: 0, y: 40 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 max-w-3xl mx-auto"
        >
          <div className="glass-card rounded-3xl p-8 md:p-12 border-t-8 border-t-emerald-950">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-heading font-bold text-emerald-950 mb-3">অর্ডার কনফার্ম করুন</h2>
              <p className="text-slate-600">নিচের ফর্মটি সঠিকভাবে পূরণ করুন, আমাদের প্রতিনিধি আপনাকে কল করবে।</p>
            </div>

            {isSuccess ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-8 text-center"
              >
                <CheckCircle2 className="text-emerald-500 mx-auto mb-4" size={64} />
                <h3 className="text-2xl font-heading font-bold text-emerald-900 mb-2">অর্ডার সফল হয়েছে!</h3>
                <p className="text-emerald-700">ধন্যবাদ। খুব শীঘ্রই আমরা আপনার সাথে যোগাযোগ করব।</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-emerald-950 font-medium mb-2">আপনার নাম <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="সম্পূর্ণ নাম লিখুন"
                    className="w-full px-5 py-4 bg-white/50 border border-gold-500/30 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                
                <div>
                  <label className="block text-emerald-950 font-medium mb-2">মোবাইল নাম্বার <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="tel" 
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-5 py-4 bg-white/50 border border-gold-500/30 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all placeholder:text-slate-400 font-serif"
                  />
                </div>

                <div>
                  <label className="block text-emerald-950 font-medium mb-2">সম্পূর্ণ ঠিকানা <span className="text-red-500">*</span></label>
                  <textarea 
                    required
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="গ্রাম/মহল্লা, থানা, জেলা"
                    className="w-full px-5 py-4 bg-white/50 border border-gold-500/30 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all resize-none placeholder:text-slate-400"
                  ></textarea>
                </div>

                {!isMultiProduct && (
                  <div>
                    <label className="block text-emerald-950 font-medium mb-2">পরিমাণ</label>
                    <div className="flex items-center gap-4 bg-white/50 border border-gold-500/30 rounded-xl p-2 w-max">
                      <button 
                        type="button"
                        onClick={() => setSingleProductQuantity(Math.max(1, singleProductQuantity - 1))}
                        className="p-2 bg-emerald-50 text-emerald-950 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        <Minus size={20} />
                      </button>
                      <span className="font-serif font-bold text-xl w-8 text-center text-emerald-950">
                        {formatToBengaliNumber(singleProductQuantity)}
                      </span>
                      <button 
                        type="button"
                        onClick={() => setSingleProductQuantity(singleProductQuantity + 1)}
                        className="p-2 bg-emerald-50 text-emerald-950 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-emerald-950/5 p-6 rounded-xl border border-emerald-950/10 space-y-3">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-heading">সাবটোটাল:</span>
                    <span className="font-serif">{formatToBengaliPrice(isMultiProduct ? cartTotal : (products[0].discountedPrice * singleProductQuantity))}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-heading">ডেলিভারি চার্জ:</span>
                    <span className="font-serif">{formatToBengaliPrice(deliveryCharge)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">পেমেন্ট মেথড:</span>
                    <span className="font-bold text-emerald-950">Cash on Delivery</span>
                  </div>
                  <div className="flex justify-between items-center text-xl border-t border-emerald-950/10 pt-4 mt-2">
                    <span className="font-heading font-bold text-emerald-950">সর্বমোট:</span>
                    <span className="font-serif font-extrabold text-emerald-950">
                      {formatToBengaliPrice((isMultiProduct ? cartTotal : (products[0].discountedPrice * singleProductQuantity)) + deliveryCharge)}
                    </span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || (isMultiProduct && cartItems.length === 0)}
                  className="w-full bg-emerald-950 hover:bg-emerald-900 text-gold-500 text-xl font-heading font-bold py-5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed border border-gold-500/30 shimmer-btn"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gold-500"></div>
                      প্রসেসিং হচ্ছে...
                    </span>
                  ) : (
                    <>
                      <CheckCircle2 size={24} />
                      অর্ডার কনফার্ম করুন
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </main>

      {/* Sticky Mobile CTA (Only for Single Product) */}
      {!isMultiProduct && !isAnyCtaVisible && (
        <div className="fixed bottom-0 left-0 right-0 glass-card p-4 md:hidden z-30 border-t border-gold-500/30">
          <button 
            onClick={scrollToForm}
            className="w-full bg-gold-500 text-emerald-950 font-heading font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 shimmer-btn"
          >
            <ShoppingCart size={20} />
            অর্ডার করুন ({formatToBengaliPrice(products[0].discountedPrice)})
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {isMultiProduct && (
        <Cart 
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          total={cartTotal}
          onCheckout={() => {
            setIsCartOpen(false);
            scrollToForm();
          }}
        />
      )}
    </div>
  );
}
