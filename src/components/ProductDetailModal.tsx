import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, MessageCircle, Check, Shield, Truck, RotateCcw } from 'lucide-react';
import { Product, ProductColor, StoreConfig } from '../types';
import { formatPrice, generateDirectProductWhatsAppUrl, openWhatsAppUrl } from '../utils/whatsapp';
import { BrandLogo } from './BrandLogo';

interface ProductDetailModalProps {
  product: Product | null;
  config: StoreConfig;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, selectedColor: ProductColor, selectedSize: string, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  config,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [selectedColor, setSelectedColor] = useState<ProductColor>(() => product?.colors[0] || { name: 'Padrão', hex: '#000000' });
  const [selectedSize, setSelectedSize] = useState<string>(() => product?.sizes[0] || 'Tamanho Único');
  const [quantity, setQuantity] = useState(1);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

  // Sync state if product changes
  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors[0] || { name: 'Padrão', hex: '#000000' });
      setSelectedSize(product.sizes[0] || 'Tamanho Único');
      setQuantity(1);
      setIsAddedFeedback(false);
    }
  }, [product]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const activeImage = selectedColor.image || product.image;

  const handleAdd = () => {
    onAddToCart(product, selectedColor, selectedSize, quantity);
    setIsAddedFeedback(true);
    setTimeout(() => {
      setIsAddedFeedback(false);
      onClose();
    }, 1200);
  };

  const handleWhatsAppCheckout = () => {
    const url = generateDirectProductWhatsAppUrl(
      `${product.name} (Qtd: ${quantity})`,
      selectedColor.name,
      selectedSize,
      product.price * quantity,
      config
    );
    openWhatsAppUrl(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        id="product-detail-modal"
        className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-10 my-8"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-neutral-400 hover:text-white bg-neutral-950/60 hover:bg-neutral-800 rounded-full transition"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Image */}
          <div className="relative bg-neutral-950 aspect-square md:aspect-auto flex items-center justify-center overflow-hidden">
            <img
              src={activeImage}
              alt={`${product.name} - ${selectedColor.name}`}
              className="w-full h-full object-cover object-center max-h-[500px]"
            />
            {product.badge && (
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded bg-amber-400 text-neutral-950">
                  {product.badge}
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Details & Customizer */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Category & Title */}
              <div className="flex items-center gap-2">
                <BrandLogo
                  src={config.logoUrl}
                  alt={config.storeName}
                  size="xs"
                  shape="rounded"
                  className="w-5 h-5 border border-neutral-800 p-0.5 shrink-0"
                />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
                  {config.categories?.find((c) => c.id === product.category)?.name || product.category}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1 font-['Cabinet_Grotesk',sans-serif]">
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-3 mt-3">
                <span className="text-2xl font-black text-amber-400">
                  {formatPrice(product.price, config)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-neutral-500 line-through">
                    {formatPrice(product.originalPrice, config)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-neutral-300 mt-4 leading-relaxed">
                {product.description}
              </p>

              {/* Specific features/details */}
              {product.details && product.details.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider mb-2">
                    Características & Composição:
                  </h4>
                  <ul className="space-y-1 text-xs text-neutral-400">
                    {product.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Color Chooser */}
              <div className="mt-5 pt-4 border-t border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Cor Selecionada: <span className="text-amber-400 capitalize">{selectedColor.name}</span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor.name === color.name;
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                          isSelected
                            ? 'border-amber-400 bg-neutral-800 text-white ring-1 ring-amber-400/40'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        {color.image ? (
                          <img
                            src={color.image}
                            alt={color.name}
                            className="w-4 h-4 rounded-full object-cover border border-black/30 inline-block shrink-0"
                          />
                        ) : (
                          <span
                            className="w-4 h-4 rounded-full border border-black/30 inline-block shrink-0"
                            style={{ backgroundColor: color.hex }}
                          />
                        )}
                        <span>{color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Chooser */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Tamanho Disponível: <span className="text-white font-black">{selectedSize}</span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition ${
                          isSelected
                            ? 'bg-neutral-100 text-neutral-950 ring-2 ring-amber-400'
                            : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="mt-4 flex items-center gap-4">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Quantidade:</span>
                <div className="flex items-center border border-neutral-800 rounded-lg bg-neutral-950">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1 text-neutral-400 hover:text-white font-bold transition"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-white min-w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-1 text-neutral-400 hover:text-white font-bold transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="space-y-2.5 pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={handleAdd}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition transform active:scale-95 ${
                  isAddedFeedback
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-lg shadow-amber-400/20'
                }`}
              >
                {isAddedFeedback ? (
                  <>
                    <Check className="w-5 h-5 stroke-[2.5]" />
                    <span>Adicionado ao Carrinho!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
                    <span>Adicionar {quantity}x ao Carrinho</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleWhatsAppCheckout}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Pedir Imediatamente no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
