import React, { useState, useEffect } from 'react';
import { ShoppingBag, Check, Eye, MessageCircle, Sparkles, Star } from 'lucide-react';
import { Product, ProductColor, StoreConfig } from '../types';
import { formatPrice, generateDirectProductWhatsAppUrl, openWhatsAppUrl } from '../utils/whatsapp';

interface ProductCardProps {
  product: Product;
  config: StoreConfig;
  onAddToCart: (product: Product, selectedColor: ProductColor, selectedSize: string) => void;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  config,
  onAddToCart,
  onViewDetails,
}) => {
  const isFeatured = product.id === config.featuredProductId || Boolean(product.isFeatured);

  // State for user's selected color & size for this product card
  const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0] || { name: 'Padrão', hex: '#000000' });
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'Tamanho Único');
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

  // Sync selected color and size when product changes (e.g. from Admin updates)
  useEffect(() => {
    if (product.colors && product.colors.length > 0) {
      // Keep color if still available in updated product, otherwise fallback to first
      setSelectedColor((prev) => {
        const found = product.colors.find((c) => c.name === prev.name);
        return found || product.colors[0];
      });
    }
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize((prev) => {
        return product.sizes.includes(prev) ? prev : product.sizes[0];
      });
    }
  }, [product]);

  // Active display image (switches if color has specific image)
  const activeImage = selectedColor.image || product.image;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, selectedColor, selectedSize);
    setIsAddedFeedback(true);
    setTimeout(() => setIsAddedFeedback(false), 1600);
  };

  const handleDirectWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = generateDirectProductWhatsAppUrl(
      product.name,
      selectedColor.name,
      selectedSize,
      product.price,
      config
    );
    openWhatsAppUrl(url);
  };

  return (
    <article
      id={`product-card-${product.id}`}
      className={`group bg-neutral-900/90 rounded-xl border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-black/40 ${
        isFeatured
          ? 'border-amber-400/60 ring-1 ring-amber-400/40 shadow-lg shadow-amber-400/5'
          : 'border-neutral-800 hover:border-neutral-700'
      }`}
    >
      {/* Product Image Area */}
      <div
        className="relative aspect-square overflow-hidden bg-neutral-950 cursor-pointer"
        onClick={() => onViewDetails(product)}
      >
        <img
          src={activeImage}
          alt={`${product.name} - ${selectedColor.name}`}
          className="w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Badge (Featured Star or Custom Badge) */}
        {isFeatured ? (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded bg-amber-400 text-neutral-950 shadow-md flex items-center gap-1">
              <Star className="w-3 h-3 fill-neutral-950" />
              {config.featuredSubtitle || product.badge || 'Destaque'}
            </span>
          </div>
        ) : product.badge ? (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded bg-amber-400 text-neutral-950 shadow-md">
              {product.badge}
            </span>
          </div>
        ) : null}

        {/* Category Pill */}
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-neutral-950/80 backdrop-blur-md text-neutral-300 border border-neutral-700/50">
            {config.categories?.find((c) => c.id === product.category)?.name || product.category}
          </span>
        </div>

        {/* Quick hover overlay with detail trigger */}
        <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            className="px-3.5 py-2 bg-neutral-900/90 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-neutral-700 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            Ver Detalhes
          </button>
        </div>
      </div>

      {/* Product Content & Interactive Controls */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Title & Price */}
          <div className="flex items-start justify-between gap-2">
            <h3
              onClick={() => onViewDetails(product)}
              className="text-base font-bold text-white hover:text-amber-400 transition cursor-pointer leading-snug line-clamp-2"
            >
              {product.name}
            </h3>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-lg font-black text-amber-400 tracking-tight">
              {formatPrice(product.price, config)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-neutral-500 line-through">
                {formatPrice(product.originalPrice, config)}
              </span>
            )}
          </div>

          {/* Color Selector (Interactive Requirement) */}
          <div className="mt-3.5 pt-3 border-t border-neutral-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Cor: <strong className="text-neutral-200 font-bold capitalize">{selectedColor.name}</strong>
              </span>
              <span className="text-[10px] text-neutral-500">{product.colors.length} disponíveis</span>
            </div>

            <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Escolha a cor">
              {product.colors.map((color) => {
                const isSelected = selectedColor.name === color.name;
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedColor(color);
                    }}
                    title={`Cor: ${color.name}${color.image ? ' (com foto exclusiva)' : ''}`}
                    className={`relative w-6 h-6 rounded-full border-2 transition-all p-0.5 ${
                      isSelected
                        ? 'border-amber-400 scale-110 shadow-sm shadow-amber-400/30'
                        : 'border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    {color.image ? (
                      <img
                        src={color.image}
                        alt={color.name}
                        className="block w-full h-full rounded-full object-cover border border-black/20"
                      />
                    ) : (
                      <span
                        className="block w-full h-full rounded-full border border-black/20"
                        style={{ backgroundColor: color.hex }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector (Interactive Requirement) */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Tamanho: <strong className="text-neutral-200">{selectedSize}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {product.sizes.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSize(size);
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded transition ${
                      isSelected
                        ? 'bg-neutral-100 text-neutral-950 shadow-sm'
                        : 'bg-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/80'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons: Add to Cart + WhatsApp Direct */}
        <div className="pt-2 space-y-2">
          <button
            id={`add-to-cart-btn-${product.id}`}
            type="button"
            onClick={handleAdd}
            className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
              isAddedFeedback
                ? 'bg-emerald-500 text-white'
                : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-md shadow-amber-400/10'
            }`}
          >
            {isAddedFeedback ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Adicionado ao Carrinho!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
                <span>Adicionar ao Carrinho</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDirectWhatsApp}
            className="w-full py-2 px-3 rounded-lg font-semibold text-[11px] text-neutral-400 hover:text-emerald-400 bg-neutral-950/60 hover:bg-emerald-950/30 border border-neutral-800 hover:border-emerald-800/50 flex items-center justify-center gap-1.5 transition"
            title="Pedir apenas este item agora via WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Pedir Direto no WhatsApp</span>
          </button>
        </div>
      </div>
    </article>
  );
};
