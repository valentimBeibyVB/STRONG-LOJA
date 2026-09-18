import React from 'react';
import { ArrowRight, CheckCircle2, Eye, MessageCircle, Sparkles, Star, Truck } from 'lucide-react';
import { Product, ProductCategory, StoreConfig } from '../types';

interface HeroProps {
  onSelectCategory: (category: ProductCategory) => void;
  whatsappNumber: string;
  featuredProduct?: Product | null;
  onViewDetails?: (product: Product) => void;
  config?: StoreConfig;
}

export const Hero: React.FC<HeroProps> = ({
  onSelectCategory,
  whatsappNumber,
  featuredProduct,
  onViewDetails,
  config,
}) => {
  const currencySymbol = config?.currencySymbol || 'Kz';
  const currencyPosition = config?.currencyPosition || 'suffix';
  const subtitle = config?.featuredSubtitle || featuredProduct?.badge || 'Destaque Oficial';

  const formatPrice = (val: number) => {
    const formatted = val.toLocaleString('pt-PT');
    return currencyPosition === 'prefix' ? `${currencySymbol} ${formatted}` : `${formatted} ${currencySymbol}`;
  };

  return (
    <section id="hero-section" className="relative overflow-hidden bg-neutral-900/50 border-b border-neutral-800 py-12 lg:py-16">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-1/3 w-80 h-80 bg-neutral-700/10 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column Text Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800 border border-neutral-700/80 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Coleção Autêntica • Streetwear & Essentials
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-['Cabinet_Grotesk',sans-serif] leading-[1.05]">
              Veste a Tua Força.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
                Strong Apparel.
              </span>
            </h1>

            <p className="text-neutral-300 text-base sm:text-lg max-w-xl leading-relaxed">
              Descobre as nossas T-shirts oversized com algodão premium e os chapéus bucket & bonés icónicos. 
              Personaliza a tua cor favorita, junta ao carrinho e recebe a confirmação imediata no WhatsApp.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-explore-tshirts-btn"
                onClick={() => {
                  onSelectCategory('tshirts');
                  document.getElementById('catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-amber-400/20 transition transform hover:-translate-y-0.5"
              >
                <span>Ver T-shirts</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-explore-chapeus-btn"
                onClick={() => {
                  onSelectCategory('chapeus');
                  document.getElementById('catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm border border-neutral-700 transition"
              >
                Ver Chapéus & Bonés
              </button>

              <a
                href={`https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent('Olá Strong! Gostaria de tirar dúvidas sobre as peças e tamanhos disponíveis.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <MessageCircle className="w-4 h-4" />
                Falar com Atendimento
              </a>
            </div>

            {/* Quality Perks Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-neutral-800/80">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-200">100% Algodão</h4>
                  <p className="text-[11px] text-neutral-400">Gramatura pesada 240g</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-200">Cores Reais</h4>
                  <p className="text-[11px] text-neutral-400">Variedade à escolha</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-200">Envio Rápido</h4>
                  <p className="text-[11px] text-neutral-400">Direto no WhatsApp</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Featured Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl">
              <div
                className="aspect-[4/5] relative overflow-hidden group cursor-pointer"
                onClick={() => {
                  if (featuredProduct && onViewDetails) {
                    onViewDetails(featuredProduct);
                  }
                }}
              >
                <img
                  src={
                    featuredProduct?.image ||
                    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80'
                  }
                  alt={featuredProduct?.name || `${config?.storeName || 'Strong'} Streetwear`}
                  className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/25 to-transparent" />

                {/* Floating badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="bg-neutral-950/90 backdrop-blur-md text-amber-400 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {subtitle}
                  </span>
                  {featuredProduct?.inStock === false && (
                    <span className="bg-red-500/90 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                      Esgotado
                    </span>
                  )}
                </div>

                {/* Bottom card details */}
                <div className="absolute bottom-4 left-4 right-4 bg-neutral-950/95 backdrop-blur-md p-4 rounded-xl border border-neutral-800/90 shadow-2xl transition group-hover:border-amber-400/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {subtitle}
                      </p>
                      <h3 className="text-base font-black text-white truncate mt-0.5">
                        {featuredProduct ? featuredProduct.name : `${config?.storeName || 'Strong'} Collection`}
                      </h3>
                      {featuredProduct && (
                        <p className="text-xs font-black text-amber-400 mt-1">
                          {formatPrice(featuredProduct.price)}
                        </p>
                      )}
                    </div>

                    {featuredProduct && onViewDetails ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(featuredProduct);
                        }}
                        className="px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs flex items-center gap-1.5 shrink-0 shadow-md transition transform group-hover:scale-105"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Peça</span>
                      </button>
                    ) : (
                      <span className="text-xs font-extrabold bg-neutral-800 text-neutral-200 px-2.5 py-1 rounded shrink-0">
                        {config?.storeName || 'STRONG'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
