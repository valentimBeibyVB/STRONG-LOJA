/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MessageCircle, ShoppingBag, Sparkles, Filter, AlertCircle, ArrowUp } from 'lucide-react';
import { Product, ProductColor, CartItem, StoreConfig, ProductCategory } from './types';
import { INITIAL_PRODUCTS, DEFAULT_STORE_CONFIG } from './data/initialProducts';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { AdminModal } from './components/AdminModal';
import { Footer } from './components/Footer';

export default function App() {
  // 1. Storage & Persistence (Client-side localStorage suitable for GitHub Pages / static hosting)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('strong_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading stored products:', e);
    }
    return INITIAL_PRODUCTS;
  });

  const [config, setConfig] = useState<StoreConfig>(() => {
    try {
      const saved = localStorage.getItem('strong_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading stored config:', e);
    }
    return DEFAULT_STORE_CONFIG;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('strong_cart');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading cart:', e);
    }
    return [];
  });

  // Cloud Sync state & Versioning
  const [isServerSyncActive, setIsServerSyncActive] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // References to prevent race conditions during save and focus/polling events
  const isSavingRef = React.useRef(false);
  const localCatalogVersionRef = React.useRef<number>(() => {
    try {
      const v = localStorage.getItem('strong_catalog_version');
      if (v) return parseInt(v, 10) || Date.now();
    } catch {
      // ignore
    }
    return Date.now();
  });

  // Synchronize products to server & local storage
  const persistProducts = async (newProducts: Product[]) => {
    const newVer = Date.now();
    isSavingRef.current = true;
    localCatalogVersionRef.current = newVer;

    try {
      localStorage.setItem('strong_products', JSON.stringify(newProducts));
      localStorage.setItem('strong_catalog_version', newVer.toString());
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: newProducts, version: newVer }),
      });
      if (res.ok) {
        setIsServerSyncActive(true);
        setSyncToast('Alterações salvas e sincronizadas!');
        setTimeout(() => setSyncToast(null), 3000);
        return true;
      }
    } catch (err) {
      console.log('Server not reachable (running static or offline):', err);
    } finally {
      // Keep isSavingRef locked for 2 seconds to avoid any focus-event or immediate polling race
      setTimeout(() => {
        isSavingRef.current = false;
      }, 2000);
    }
    return false;
  };

  // Synchronize store config to server & local storage
  const persistConfig = async (newConfig: StoreConfig) => {
    try {
      localStorage.setItem('strong_config', JSON.stringify(newConfig));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (res.ok) {
        setIsServerSyncActive(true);
        return true;
      }
    } catch (err) {
      console.log('Server not reachable for config sync');
    }
    return false;
  };

  // Helper to fetch JSON with multiple candidate paths (essential for GitHub Pages subpaths)
  const fetchJsonWithFallback = async (filename: string) => {
    const timestamp = Date.now();
    const base = (import.meta as any).env?.BASE_URL || './';
    const normalizedBase = base.endsWith('/') ? base : base + '/';

    const candidateUrls = [
      `${normalizedBase}${filename}?t=${timestamp}`,
      `./${filename}?t=${timestamp}`,
      `${filename}?t=${timestamp}`,
      `/${filename}?t=${timestamp}`,
    ];

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const text = await res.text();
          // Verify it is valid JSON and not a 404 HTML fallback page
          if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed) ? parsed.length > 0 : parsed && typeof parsed === 'object') {
              return parsed;
            }
          }
        }
      } catch {
        // try next candidate
      }
    }
    return null;
  };

  // Fetch latest products and config from cloud / server / catalog.json
  const fetchLatestCatalog = async (force = false) => {
    // If currently saving or user just made changes, do not let an incoming fetch overwrite!
    if (isSavingRef.current && !force) return;

    let synced = false;

    // 1. Try server API /api/products
    try {
      const apiRes = await fetch('/api/products?t=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (Array.isArray(json.products)) {
          setIsServerSyncActive(true);
          const serverVer = typeof json.version === 'number' ? json.version : 0;
          const currentLocalVer = localCatalogVersionRef.current || 0;

          // Only overwrite if force=true, or server version is strictly newer than our local version,
          // or if local products are empty
          if (force || serverVer > currentLocalVer) {
            setProducts(json.products);
            if (serverVer > 0) {
              localCatalogVersionRef.current = serverVer;
              try {
                localStorage.setItem('strong_catalog_version', serverVer.toString());
              } catch {}
            }
            try {
              localStorage.setItem('strong_products', JSON.stringify(json.products));
            } catch (e) {
              console.warn('LocalStorage warning:', e);
            }
          }
          synced = true;
        }
      }
    } catch {
      // server not available
    }

    // 2. Try server API /api/config
    try {
      const configRes = await fetch('/api/config?t=' + Date.now(), {
        cache: 'no-store',
      });
      if (configRes.ok) {
        const confJson = await configRes.json();
        if (confJson && confJson.storeName) {
          setConfig(confJson);
          try {
            localStorage.setItem('strong_config', JSON.stringify(confJson));
          } catch {}
        }
      }
    } catch {
      // ignore
    }

    // 3. Fallback to catalog.json ONLY IF localStorage has NO saved products (initial seed)
    if (!synced) {
      const hasLocalSaved = localStorage.getItem('strong_products');
      if (!hasLocalSaved) {
        try {
          const staticData = await fetchJsonWithFallback('catalog.json');
          if (Array.isArray(staticData) && staticData.length > 0) {
            setProducts(staticData);
            try {
              localStorage.setItem('strong_products', JSON.stringify(staticData));
            } catch {}
          }
        } catch (e) {
          console.warn('Could not fetch static catalog.json:', e);
        }
      }
    }
  };

  // Sync on startup, when switching back to this tab/window, and periodically
  useEffect(() => {
    fetchLatestCatalog();

    const handleWindowFocus = () => {
      if (!isSavingRef.current) {
        fetchLatestCatalog();
      }
    };
    window.addEventListener('focus', handleWindowFocus);

    // Poll every 20 seconds so mobile and desktop sync seamlessly in real-time
    const interval = setInterval(() => {
      if (!isSavingRef.current) {
        fetchLatestCatalog();
      }
    }, 20000);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(interval);
    };
  }, []);

  // 2. Navigation & UI state
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(() => {
    return typeof window !== 'undefined' && (window.location.hash === '#admin' || window.location.hash === '#adm');
  });
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Listen for hashchange (#admin or #adm in URL)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin' || window.location.hash === '#adm') {
        setIsAdminOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Keyboard shortcut: Alt + A to open Admin privately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A'))) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    if (typeof window !== 'undefined' && (window.location.hash === '#admin' || window.location.hash === '#adm')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  // Sync products to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('strong_products', JSON.stringify(products));
    } catch (e) {
      console.warn('LocalStorage full or unavailable for products', e);
    }
  }, [products]);

  // Sync config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('strong_config', JSON.stringify(config));
    } catch (e) {
      console.warn('LocalStorage unavailable for config', e);
    }
  }, [config]);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('strong_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('LocalStorage unavailable for cart', e);
    }
  }, [cart]);

  // Scroll listener for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Category match
      const matchesCategory =
        selectedCategory === 'todos' || item.category === selectedCategory;

      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.colors.some((c) => c.name.toLowerCase().includes(query)) ||
        (item.badge && item.badge.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // 4. Cart Handlers
  const handleAddToCart = (
    product: Product,
    selectedColor: ProductColor,
    selectedSize: string,
    quantity: number = 1
  ) => {
    const itemKey = `${product.id}-${selectedColor.name}-${selectedSize}`;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((i) => i.id === itemKey);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        const newItem: CartItem = {
          id: itemKey,
          productId: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          image: selectedColor.image || product.image,
          selectedColor,
          selectedSize,
          quantity,
        };
        return [...prevCart, newItem];
      }
    });
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item))
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // 5. Admin Handlers
  const handleSaveProduct = (newOrEditedProduct: Product) => {
    const prev = products;
    const index = prev.findIndex((p) => p.id === newOrEditedProduct.id);
    let updated: Product[];
    if (index > -1) {
      updated = [...prev];
      updated[index] = newOrEditedProduct;
    } else {
      updated = [newOrEditedProduct, ...prev];
    }
    setProducts(updated);
    persistProducts(updated);
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    persistProducts(updated);
  };

  const handleResetToDefaults = () => {
    setProducts(INITIAL_PRODUCTS);
    localStorage.removeItem('strong_products');
    persistProducts(INITIAL_PRODUCTS);
  };

  const handleUpdateConfig = (newConfig: StoreConfig) => {
    setConfig(newConfig);
    persistConfig(newConfig);
  };

  const handleImportProducts = (importedProducts: Product[]) => {
    setProducts(importedProducts);
    persistProducts(importedProducts);
  };

  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 selection:bg-amber-400 selection:text-neutral-950 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification for Cross-Device Synchronization */}
      {syncToast && (
        <div className="fixed top-20 right-6 z-50 bg-amber-400 text-neutral-950 px-4 py-2.5 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 border border-amber-300 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-neutral-950"></span>
          {syncToast}
        </div>
      )}

      {/* Header with sticky navigation, cart badge, search, category pills and admin trigger */}
      <Header
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        config={config}
      />

      {/* Hero Showcase for brand Strong */}
      <Hero
        onSelectCategory={setSelectedCategory}
        whatsappNumber={config.whatsappNumber}
      />

      {/* Main Catalog Section */}
      <main id="catalog-grid" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Category Header & Item Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white font-['Cabinet_Grotesk',sans-serif]">
                {selectedCategory === 'todos' && 'Coleção Completa'}
                {selectedCategory === 'tshirts' && 'T-shirts & Oversized'}
                {selectedCategory === 'chapeus' && 'Chapéus, Bucket Hats & Bonés'}
                {selectedCategory === 'hoodies' && 'Moletom & Hoodies'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-bold text-amber-400">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'itens'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Clica nas cores abaixo de cada peça para alternar o tom e adiciona ao teu carrinho para encomendar no WhatsApp.
            </p>
          </div>

          {/* Quick Filter Tag Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {searchQuery && (
              <div className="text-xs text-neutral-400 flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
                <span>Busca: "{searchQuery}"</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-amber-400 hover:text-white font-bold ml-1"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 p-8">
            <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Nenhum produto encontrado</h3>
            <p className="text-xs text-neutral-400 max-w-sm">
              Não encontramos nenhum artigo com os filtros selecionados. Tenta pesquisar por outro termo ou limpa a tua busca.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedCategory('todos');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-lg bg-amber-400 text-neutral-950 font-bold text-xs hover:bg-amber-300 transition"
              >
                Ver Todos os Produtos
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                config={config}
                onAddToCart={(prod, col, sz) => handleAddToCart(prod, col, sz, 1)}
                onViewDetails={(prod) => setDetailProduct(prod)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button: Quick WhatsApp Contact */}
      <a
        id="floating-whatsapp-btn"
        href={`https://api.whatsapp.com/send?phone=${config.whatsappNumber}&text=${encodeURIComponent('Olá Strong! Gostaria de esclarecer dúvidas sobre os produtos e envios.')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-xl shadow-emerald-500/30 flex items-center justify-center transform hover:scale-110 active:scale-95 transition-all group"
        title="Falar no WhatsApp"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-neutral-950 stroke-emerald-500 stroke-1" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-black text-xs pl-0 group-hover:pl-2">
          WhatsApp Strong
        </span>
      </a>

      {/* Floating Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-6 z-40 p-2.5 rounded-full bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 shadow-md border border-neutral-700 transition-all"
          title="Voltar ao topo"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Cart Drawer Panel */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        config={config}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailProduct}
        config={config}
        isOpen={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        onAddToCart={(prod, col, sz, qty) => handleAddToCart(prod, col, sz, qty)}
      />

      {/* Admin Panel Modal (Upload real images, add new products, change WhatsApp) */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
        products={products}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        onResetToDefaults={handleResetToDefaults}
        config={config}
        onUpdateConfig={handleUpdateConfig}
        onImportProducts={handleImportProducts}
        isServerSyncActive={isServerSyncActive}
        onForceSync={() => fetchLatestCatalog(true)}
      />

      {/* Footer */}
      <Footer
        config={config}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />
    </div>
  );
}
