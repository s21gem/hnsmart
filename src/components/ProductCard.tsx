import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { formatToBengaliPrice } from '../utils';
import parse from 'html-react-parser';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  index: number;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, index, onAddToCart }: ProductCardProps) {
  const savings = product.price - product.discountedPrice;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className="bg-emerald-950 rounded-2xl overflow-hidden group shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border border-emerald-900 relative"
    >
      <div className="p-4">
        {/* Strict 1:1 Aspect Ratio Image Container with inner shadow and glowing gold border */}
        <div className="relative aspect-square overflow-hidden rounded-xl border border-gold-500/50 group-hover:border-gold-500 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-500 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
          <img 
            src={product.imageUrl || "https://picsum.photos/seed/attar/400/400"} 
            alt={product.name} 
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          {savings > 0 && (
            <div className="absolute top-3 right-3 bg-gold-500 text-emerald-950 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              {formatToBengaliPrice(savings)} সাশ্রয় করুন!
            </div>
          )}
        </div>
      </div>
      <div className="p-6 pt-2 text-center">
        <h3 className="text-xl font-heading font-bold text-gold-500 mb-2">{product.name}</h3>
        <div className="text-ivory/70 text-sm mb-4 line-clamp-2 prose prose-sm prose-invert mx-auto">{parse(product.description)}</div>
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-3xl font-serif font-bold text-ivory">{formatToBengaliPrice(product.discountedPrice)}</span>
          <span className="text-lg font-serif text-gold-500/50 line-through mb-1">{formatToBengaliPrice(product.price)}</span>
        </div>
        <button 
          onClick={() => onAddToCart(product)}
          className="w-full bg-gold-500 hover:bg-gold-600 text-emerald-950 font-heading font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shimmer-btn"
        >
          <ShoppingCart size={20} />
          কার্টে যোগ করুন
        </button>
      </div>
    </motion.div>
  );
}
