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
    <div className="my-4 bg-surface-2 hairline rounded-card overflow-hidden">
      {/* Header of carousel */}
      <div className="px-4 py-2 border-b border-line flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
          <span className="text-[13px] font-semibold num">
            Doporučené produkty ({products.length})
          </span>
        </div>
        {products.length > 1 && (
          <div className="flex gap-1">
            <button
              onClick={prevProduct}
              className="btn btn-secondary btn-sm"
            >
              ←
            </button>
            <span className="text-xs text-fg-subtle px-2 py-1 num self-center">
              {activeIndex + 1}/{products.length}
            </span>
            <button
              onClick={nextProduct}
              className="btn btn-secondary btn-sm"
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
                    <span className="badge b-neutral">
                      {prod.category}
                    </span>
                  )}
                  <h3 className="text-base sm:text-lg font-semibold tracking-tight mt-2">
                    {prod.name}
                  </h3>
                  {prod.id && (
                    <p className="text-xs text-fg-subtle font-mono mt-0.5">
                      Art.ID: {prod.id} {prod.articleType ? `| Typ: ${prod.articleType}` : ''}
                    </p>
                  )}
                </div>

                {/* Rating */}
                {prod.rating && (
                  <div className="flex items-center gap-2 -mt-2">
                    <div className="flex items-center text-warning">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-[13px] font-semibold num ml-1">
                        {prod.rating}
                      </span>
                    </div>
                    {prod.ratingCount && (
                      <span className="text-xs text-fg-subtle num">
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
                      <p className="text-[13px] sm:text-sm text-fg-muted leading-relaxed border-l-2 border-line-strong pl-3">
                        "{prod.desc}"
                      </p>
                    )}

                    {featureList.length > 0 && (
                      <div className="space-y-1.5 mt-1">
                        <span className="section-label block">
                          Klíčové vlastnosti:
                        </span>
                        {featureList.map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-start gap-2 text-[13px] text-fg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Pricing & Quick Simulated Action */}
                  <div className="card p-4 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {prod.originalPrice && origPrice > currentPrice && (
                          <span className="text-xs text-fg-subtle line-through num">
                            {origPrice.toLocaleString('cs-CZ')} Kč
                          </span>
                        )}
                        {savingsPercent > 0 && (
                          <span className="badge b-err num">
                            Ušetříte {savingsPercent} %
                          </span>
                        )}
                      </div>

                      <div className="text-2xl sm:text-[28px] font-semibold tracking-tight num mt-1">
                        {currentPrice > 0 ? `${currentPrice.toLocaleString('cs-CZ')} Kč` : 'Cena na dotaz'}
                      </div>

                      {savings > 0 && (
                        <div className="text-fg-muted text-xs num mt-1 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-danger" />
                          <span>Sleva {savings.toLocaleString('cs-CZ')} Kč k okamžitému nákupu</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="text-xs text-fg-muted flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-success" />
                        <span>Originální distribuce Datart</span>
                      </div>
                      <a
                        href={`https://www.datart.cz/vyhledavani?q=${encodeURIComponent(prod.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary w-full !text-fg hover:!text-fg"
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
        <div className="px-4 py-3 border-t border-line flex justify-center gap-1.5">
          {products.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${
                idx === activeIndex ? 'bg-accent w-4' : 'bg-surface-3 hover:bg-line-3'
              }`}
              aria-label={`Zobrazit produkt ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
