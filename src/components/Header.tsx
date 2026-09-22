import React from 'react';
import { ShoppingBag, Shirt, Search, Sparkles } from 'lucide-react';
import { ProductCategory, StoreConfig } from '../types';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin?: () => void;
  selectedCategory: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  config: StoreConfig;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  config,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 transition-all">
      {/* Top Banner Notice */}
      <div id="top-announcement-bar" className="bg-neutral-900 border-b border-neutral-800/60 px-4 py-1.5 text-xs text-neutral-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-neutral-200">Atendimento e Pedidos Diretos no WhatsApp</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-neutral-400">
            <span>{config.address}</span>
            <span className="text-neutral-600">•</span>
            <span className="text-amber-400 font-medium">WhatsApp Oficial: +{config.whatsappNumber}</span>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-4">
            <a href="#" className="group flex items-center gap-3 focus:outline-none" aria-label="Strong Brand Home">
              <BrandLogo
                src={config.logoUrl}
                alt={`${config.storeName} Logo`}
                size="md"
                shape="rounded"
                className="p-1 border border-neutral-800 transform transition-all group-hover:scale-105 group-hover:border-amber-400/70 shadow-lg shadow-black/40 group-hover:shadow-amber-400/10"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-widest text-white font-['Cabinet_Grotesk',sans-serif]">
                    {config.storeName}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-neutral-400 -mt-1">
                  APPAREL & STREETWEAR
                </span>
              </div>
            </a>
          </div>

          {/* Search bar on desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                id="search-products-input"
                type="text"
                placeholder="Pesquisar T-shirts, Chapéus, Bonés..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-900/80 border border-neutral-800 rounded-full text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white px-1"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Shopping Cart Button */}
            <button
              id="cart-drawer-toggle-btn"
              onClick={onOpenCart}
              className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm rounded-lg shadow-lg shadow-amber-400/15 transition-all transform active:scale-95"
              aria-label="Abrir Carrinho"
            >
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              <span className="hidden sm:inline">Carrinho</span>
              {cartCount > 0 && (
                <span
                  id="cart-item-badge"
                  className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-black bg-neutral-950 text-amber-400 rounded-full animate-bounce"
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex items-center gap-2 py-3 border-t border-neutral-800/80 overflow-x-auto no-scrollbar">
          <button
            id="cat-tab-todos"
            onClick={() => onSelectCategory('todos')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === 'todos'
                ? 'bg-neutral-100 text-neutral-950 shadow-sm'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            Todos os Produtos
          </button>
          {(config.categories && config.categories.length > 0
            ? config.categories
            : [
                { id: 'tshirts', name: 'T-shirts & Oversized' },
                { id: 'chapeus', name: 'Chapéus & Bonés' },
                { id: 'hoodies', name: 'Moletom & Hoodies' },
              ]
          ).map((cat) => (
            <button
              key={cat.id}
              id={`cat-tab-${cat.id}`}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Mobile Search Input */}
        <div className="md:hidden pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Pesquisar T-shirts, chapéus..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
