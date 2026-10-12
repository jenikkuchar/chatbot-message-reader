import React, { useState } from 'react';
import { ProductData } from '../types';
import { Star, ShieldCheck, Tag, ShoppingCart, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductCarouselProps {
  products: ProductData[];
  key?: React.Key;
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!products || products.length === 0) return null;

  const nextProduct = () => {
    setActiveIndex((prev) => (prev + 1) % products.length);
  };

  const prevProduct = () => {
    setActiveIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  return (
    <div className="my-4 border border-slate-800 bg-slate-950/80 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
      {/* Header of carousel */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-mono tracking-wider uppercase text-emerald-400 font-semibold">
            Doporučené produkty ({products.length})
          </span>
        </div>
        {products.length > 1 && (
          <div className="flex gap-1">
            <button
              onClick={prevProduct}
              className="px-2 py-1 text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors duration-150 cursor-pointer"
            >
              ←
            </button>
            <span className="text-xs text-slate-500 px-2 py-1 bg-slate-900 rounded font-mono">
              {activeIndex + 1}/{products.length}
            </span>
            <button
              onClick={nextProduct}
              className="px-2 py-1 text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors duration-150 cursor-pointer"
            >
              →
            </button>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 relative min-h-[300px]">
        <AnimatePresence mode="wait">
          {products.map((prod, idx) => {
            if (idx !== activeIndex) return null;

            // Split features by |
            const featureList = prod.features
              ? prod.features.split('|').map((f) => f.trim())
              : [];

            // Calculate savings if possible
            const currentPrice = prod.price ? parseFloat(prod.price) : 0;
            const origPrice = prod.originalPrice ? parseFloat(prod.originalPrice) : 0;
            const savings = origPrice > currentPrice ? origPrice - currentPrice : 0;
            const savingsPercent = origPrice > 0 ? Math.round((savings / origPrice) * 100) : 0;

            return (
              <motion.div
                key={prod.id || idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4 sm:gap-6"
              >
                {/* Title & category */}
                <div>
                  {prod.category && (
                    <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-slate-400 px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                      {prod.category}
                    </span>
                  )}
                  <h3 className="text-base sm:text-lg font-sans font-semibold text-slate-100 tracking-tight mt-1.5 hover:text-emerald-400 transition-colors duration-150">
                    {prod.name}
                  </h3>
                  {prod.id && (
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Art.ID: {prod.id} {prod.articleType ? `| Typ: ${prod.articleType}` : ''}
                    </p>
                  )}
                </div>

                {/* Rating */}
                {prod.rating && (
                  <div className="flex items-center gap-2 -mt-2">
                    <div className="flex items-center text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500 stroke-amber-500" />
                      <span className="text-xs font-bold font-mono text-amber-400 ml-1">
                        {prod.rating}
                      </span>
                    </div>
                    {prod.ratingCount && (
                      <span className="text-[11px] text-slate-500 font-sans">
                        ({prod.ratingCount} hodnocení)
                      </span>
                    )}
                  </div>
                )}

                {/* Grid of details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Description & Features */}
                  <div className="flex flex-col gap-3">
                    {prod.desc && (
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans italic border-l-2 border-slate-800 pl-3">
                        "{prod.desc}"
                      </p>
                    )}

                    {featureList.length > 0 && (
                      <div className="space-y-1.5 mt-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                          Klíčové vlastnosti:
                        </span>
                        {featureList.map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Pricing & Quick Simulated Action */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {prod.originalPrice && origPrice > currentPrice && (
                          <span className="text-xs text-slate-500 line-through font-mono">
                            {origPrice.toLocaleString('cs-CZ')} Kč
                          </span>
                        )}
                        {savingsPercent > 0 && (
                          <span className="text-[10px] font-mono bg-rose-950 text-rose-400 border border-rose-900/50 px-1.5 py-0.5 rounded font-bold">
                            Ušetříte {savingsPercent}%
                          </span>
                        )}
                      </div>

                      <div className="text-2xl sm:text-3xl font-sans font-bold text-slate-100 mt-1">
                        {currentPrice > 0 ? `${currentPrice.toLocaleString('cs-CZ')} Kč` : 'Cena na dotaz'}
                      </div>

                      {savings > 0 && (
                        <div className="text-slate-400 text-xs font-sans mt-1 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-rose-500" />
                          <span>Sleva {savings.toLocaleString('cs-CZ')} Kč k okamžitému nákupu</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Originální distribuce Datart</span>
                      </div>
                      <a
                        href={`https://www.datart.cz/vyhledavani?q=${encodeURIComponent(prod.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-sans rounded-lg flex items-center justify-center gap-1.5 transition-all duration-150 select-none border border-emerald-500/30 font-bold active:scale-95"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Koupit na Datart.cz
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer selector dots */}
      {products.length > 1 && (
        <div className="px-4 py-3 bg-slate-900/40 border-t border-slate-800/50 flex justify-center gap-1.5">
          {products.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${
                idx === activeIndex ? 'bg-emerald-400 w-4' : 'bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label={`Zobrazit produkt ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
