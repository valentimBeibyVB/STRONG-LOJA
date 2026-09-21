/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MessageCircle, ShoppingBag, Sparkles, Filter, AlertCircle, ArrowUp, Plus } from 'lucide-react';
import { Product, ProductColor, CartItem, StoreConfig, ProductCategory, SyncLogEntry } from './types';
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
      const isCleaned = localStorage.getItem('strong_catalog_zero_v3');
      if (!isCleaned) {
        localStorage.removeItem('strong_products');
        localStorage.setItem('strong_catalog_zero_v3', 'true');
        return [];
      }
      const saved = localStorage.getItem('strong_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
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

  // Activity & Diagnostic Sync Logs
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('strong_sync_logs');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const addSyncLog = (
    type: SyncLogEntry['type'],
    action: string,
    status: SyncLogEntry['status'],
    source: SyncLogEntry['source'],
    options?: {
      details?: string;
      itemCount?: number;
      version?: number;
    }
  ) => {
    const newEntry: SyncLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      action,
      status,
      source,
      itemCount: options?.itemCount,
      version: options?.version,
      details: options?.details,
    };
    setSyncLogs((prev) => {
      const updated = [newEntry, ...prev].slice(0, 50); // Keep last 50 events
      try {
        localStorage.setItem('strong_sync_logs', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearSyncLogs = () => {
    setSyncLogs([]);
    try {
      localStorage.removeItem('strong_sync_logs');
    } catch {
      // ignore
    }
  };

  // References to prevent race conditions during save and focus/polling events
  const isSavingRef = React.useRef(false);

  const getInitialCatalogVersion = (): number => {
    try {
      const v = localStorage.getItem('strong_catalog_version');
      if (v) {
        const parsed = parseInt(v, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return 0;
  };

  const localCatalogVersionRef = React.useRef<number>(getInitialCatalogVersion());

  // Synchronize products to server & local storage
  const persistProducts = async (newProducts: Product[], operationTitle = 'Salvar produtos') => {
    const newVer = Date.now();
    isSavingRef.current = true;
    localCatalogVersionRef.current = newVer;

    try {
      localStorage.setItem('strong_products', JSON.stringify(newProducts));
      localStorage.setItem('strong_catalog_version', newVer.toString());
      addSyncLog('save_products', 'Gravação em Armazenamento Local', 'success', 'local_storage', {
        details: `${newProducts.length} artigos persistidos no navegador`,
        itemCount: newProducts.length,
        version: newVer,
      });
    } catch (e: any) {
      console.warn('LocalStorage error:', e);
      addSyncLog('save_products', 'Gravação em Armazenamento Local', 'error', 'local_storage', {
        details: e?.message || 'Erro ao gravar no localStorage',
      });
    }

    // Broadcast immediately across open tabs on the same browser/device
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('strong_store_broadcast');
        channel.postMessage({ type: 'PRODUCTS_UPDATED', version: newVer, products: newProducts });
        channel.close();
      }
    } catch {}

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: newProducts, version: newVer }),
      });
      if (res.ok) {
        setIsServerSyncActive(true);
        setSyncToast('Alterações salvas e propagadas para todos os dispositivos!');
        setTimeout(() => setSyncToast(null), 3500);
        addSyncLog('save_products', operationTitle, 'success', 'server', {
          details: `Sincronizado com sucesso com o servidor. Todos os outros dispositivos conectados receberão a versão v${newVer} imediatamente via tempo real.`,
          itemCount: newProducts.length,
          version: newVer,
        });
        return true;
      } else {
        const errorText = await res.text().catch(() => 'Status ' + res.status);
        addSyncLog('save_products', operationTitle, 'warning', 'server', {
          details: `Servidor retornou resposta inesperada (${res.status}): ${errorText}`,
        });
      }
    } catch (err: any) {
      console.log('Server not reachable (running static or offline):', err);
      addSyncLog('save_products', operationTitle, 'warning', 'server', {
        details: 'Servidor indisponível ou site rodando estático. Modificações salvas localmente no navegador.',
      });
    } finally {
      // Keep isSavingRef locked briefly to avoid echo race
      setTimeout(() => {
        isSavingRef.current = false;
      }, 1200);
    }
    return false;
  };

  // Synchronize store config to server & local storage
  const persistConfig = async (newConfig: StoreConfig) => {
    try {
      localStorage.setItem('strong_config', JSON.stringify(newConfig));
      addSyncLog('save_config', 'Configurações da Loja', 'success', 'local_storage', {
        details: 'Configurações de WhatsApp e visual salvas localmente',
      });
    } catch (e: any) {
      console.warn('LocalStorage error:', e);
      addSyncLog('save_config', 'Configurações da Loja', 'error', 'local_storage', {
        details: e?.message || 'Erro ao gravar configurações',
      });
    }

    // Broadcast across tabs
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('strong_store_broadcast');
        channel.postMessage({ type: 'CONFIG_UPDATED', config: newConfig });
        channel.close();
      }
    } catch {}

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (res.ok) {
        setIsServerSyncActive(true);
        addSyncLog('save_config', 'Configurações no Servidor', 'success', 'server', {
          details: 'Configurações sincronizadas na nuvem com sucesso',
        });
        return true;
      } else {
        addSyncLog('save_config', 'Configurações no Servidor', 'warning', 'server', {
          details: `Servidor respondeu com código ${res.status}`,
        });
      }
    } catch (err: any) {
      console.log('Server not reachable for config sync');
      addSyncLog('save_config', 'Configurações no Servidor', 'warning', 'server', {
        details: 'Servidor offline ou modo estático.',
      });
    }
    return false;
  };

  // Helper to fetch JSON with multiple candidate paths (essential for GitHub Pages subpaths)
  const fetchJsonWithFallback = async (filename: string) => {
    const timestamp = Date.now();
    const base = (import.meta as any).env?.BASE_URL || './';
    const normalizedBase = base.endsWith('/') ? base : base + '/';
    const currentPath = typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') : '';

    const candidateUrls = [
      `./${filename}?t=${timestamp}`,
      `${normalizedBase}${filename}?t=${timestamp}`,
      currentPath ? `${currentPath}/${filename}?t=${timestamp}` : '',
      `/${filename}?t=${timestamp}`,
      `${filename}?t=${timestamp}`,
    ].filter(Boolean);

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' },
        });
        if (res.ok) {
          const text = await res.text();
          const trimmed = text.trim();
          // Verify it is valid JSON and not a 404 HTML fallback page
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            const parsed = JSON.parse(trimmed);
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
  const fetchLatestCatalog = async (force = false, silent = false) => {
    // If currently saving in admin, do not let an incoming fetch overwrite!
    if (isSavingRef.current && !force) return;

    let syncedFromServer = false;

    // 1. Try server API /api/products (Full-stack Express mode)
    try {
      const apiRes = await fetch('/api/products?t=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (Array.isArray(json.products)) {
          setIsServerSyncActive(true);
          syncedFromServer = true;
          const serverVer = typeof json.version === 'number' ? json.version : 0;

          setProducts((currentProducts) => {
            const isDifferent = JSON.stringify(currentProducts) !== JSON.stringify(json.products);
            if (force || isDifferent || (serverVer > 0 && serverVer !== localCatalogVersionRef.current)) {
              return json.products;
            }
            return currentProducts;
          });

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

          if (!silent) {
            addSyncLog(
              'fetch_catalog',
              force ? 'Sincronização com Servidor' : 'Detecção de Nova Versão Remota',
              'success',
              'server',
              {
                details: `Recebidos ${json.products.length} produtos do servidor (v${serverVer})`,
                itemCount: json.products.length,
                version: serverVer,
              }
            );
          }
        }
      }
    } catch (err: any) {
      // server not available (e.g. GitHub Pages or static deployment)
    }

    // 2. Try server API /api/config
    try {
      const configRes = await fetch('/api/config?t=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
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

    // 3. Fallback for pure static hosting mode (catalog.json / version.json)
    if (!syncedFromServer) {
      try {
        let remoteVersion = 0;
        try {
          const versionData = await fetchJsonWithFallback('version.json');
          if (typeof versionData?.version === 'number') {
            remoteVersion = versionData.version;
          }
        } catch {}

        const staticData = await fetchJsonWithFallback('catalog.json');
        const catalogProducts: Product[] | null = Array.isArray(staticData)
          ? staticData
          : Array.isArray(staticData?.products)
          ? staticData.products
          : null;

        if (catalogProducts !== null && (!isSavingRef.current || force)) {
          setProducts((currentProducts) => {
            const isDifferent = JSON.stringify(currentProducts) !== JSON.stringify(catalogProducts);
            if (force || isDifferent) {
              return catalogProducts;
            }
            return currentProducts;
          });

          try {
            localStorage.setItem('strong_products', JSON.stringify(catalogProducts));
          } catch (e) {
            console.warn('LocalStorage warning:', e);
          }

          const finalVer = remoteVersion > 0 ? remoteVersion : (typeof staticData?.version === 'number' ? staticData.version : Date.now());
          localCatalogVersionRef.current = finalVer;
          try {
            localStorage.setItem('strong_catalog_version', finalVer.toString());
          } catch {}

          if (!silent) {
            addSyncLog(
              'fetch_catalog',
              'Catálogo Carregado (catalog.json)',
              'success',
              'server',
              {
                details: `Catálogo público com ${catalogProducts.length} artigos carregado diretamente do ficheiro publicado.`,
                itemCount: catalogProducts.length,
              }
            );
          }
        }
      } catch (e) {
        console.warn('Could not fetch static catalog.json:', e);
      }

      // Also fetch config.json from static host if available
      try {
        const staticConfig = await fetchJsonWithFallback('config.json');
        if (staticConfig && staticConfig.storeName && staticConfig.whatsappNumber) {
          setConfig(staticConfig);
          try {
            localStorage.setItem('strong_config', JSON.stringify(staticConfig));
          } catch {}
        }
      } catch (e) {
        console.warn('Could not fetch static config.json:', e);
      }
    }
  };

  // Real-time synchronization across all devices via Server-Sent Events (SSE)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const setupSSE = () => {
      try {
        eventSource = new EventSource('/api/sync/events');

        eventSource.addEventListener('connected', () => {
          setIsServerSyncActive(true);
        });

        eventSource.addEventListener('catalog', (event) => {
          try {
            const data = JSON.parse(event.data);
            const serverVer = data?.version;

            // Ignore echo only if this device is actively in the middle of pressing save
            if (isSavingRef.current) {
              return;
            }

            // If incoming version matches our current version, avoid duplicate toasts
            if (typeof serverVer === 'number' && serverVer === localCatalogVersionRef.current) {
              return;
            }

            setSyncToast('Catálogo atualizado em tempo real!');
            setTimeout(() => setSyncToast(null), 3000);
            fetchLatestCatalog(true, false);
          } catch {
            if (!isSavingRef.current) {
              fetchLatestCatalog(true, false);
            }
          }
        });

        eventSource.addEventListener('config', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data?.config) {
              setConfig(data.config);
              try {
                localStorage.setItem('strong_config', JSON.stringify(data.config));
              } catch {}
            }
          } catch {}
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Retry connection in 3 seconds
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(setupSSE, 3000);
        };
      } catch {
        // SSE not supported or network error
      }
    };

    setupSSE();

    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Sync across tabs on the same device via BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('strong_store_broadcast');

    channel.onmessage = (event) => {
      if (event.data?.type === 'PRODUCTS_UPDATED') {
        if (Array.isArray(event.data.products) && !isSavingRef.current) {
          setProducts(event.data.products);
          if (event.data.version) {
            localCatalogVersionRef.current = event.data.version;
          }
        }
      } else if (event.data?.type === 'CONFIG_UPDATED') {
        if (event.data.config) {
          setConfig(event.data.config);
        }
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  // Multi-device synchronization check: fast polling, window focus, phone screen unlock, and online events
  useEffect(() => {
    // On initial mount: always fetch latest catalog from server
    fetchLatestCatalog(true, true);

    const checkUpdates = async () => {
      if (isSavingRef.current) return;
      try {
        const res = await fetch('/api/status?t=' + Date.now(), {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' },
        });
        if (res.ok) {
          const statusJson = await res.json();
          const serverVer = typeof statusJson.version === 'number' ? statusJson.version : 0;
          const localVer = typeof localCatalogVersionRef.current === 'number' ? localCatalogVersionRef.current : 0;
          if (serverVer !== localVer || localVer === 0) {
            fetchLatestCatalog(true, true);
          }
          return;
        }
      } catch {
        // Server not available, fall back to static check
      }
      fetchLatestCatalog(false, true);
    };

    const handleActive = () => {
      if (!isSavingRef.current) {
        checkUpdates();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isSavingRef.current) {
        checkUpdates();
      }
    };

    window.addEventListener('focus', handleActive);
    window.addEventListener('online', handleActive);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Fast check every 4 seconds to ensure updates reflect automatically on customers' open devices
    const interval = setInterval(checkUpdates, 4000);

    return () => {
      window.removeEventListener('focus', handleActive);
      window.removeEventListener('online', handleActive);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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

  // 3. Unified & Filtered Products
  // Automatically group products with identical names so colors and photos are unified in a single card
  const unifiedProducts = useMemo(() => {
    const map = new Map<string, Product>();
    for (const item of products) {
      const key = item.name.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, { ...item, colors: [...item.colors], sizes: [...item.sizes] });
      } else {
        const existing = map.get(key)!;
        // Merge colors without duplicating exact name
        for (const col of item.colors) {
          const foundIdx = existing.colors.findIndex(
            (c) => c.name.trim().toLowerCase() === col.name.trim().toLowerCase()
          );
          if (foundIdx > -1) {
            if (col.image && !existing.colors[foundIdx].image) {
              existing.colors[foundIdx] = { ...existing.colors[foundIdx], image: col.image };
            }
          } else {
            existing.colors.push(col);
          }
        }
        // Merge sizes
        for (const sz of item.sizes) {
          if (!existing.sizes.includes(sz)) {
            existing.sizes.push(sz);
          }
        }
        if (!existing.badge && item.badge) {
          existing.badge = item.badge;
        }
      }
    }
    return Array.from(map.values());
  }, [products]);

  const filteredProducts = useMemo(() => {
    return unifiedProducts.filter((item) => {
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
  }, [unifiedProducts, selectedCategory, searchQuery]);

  // Featured Product calculation (selected in Admin via config.featuredProductId or product.isFeatured)
  const featuredProduct = useMemo(() => {
    if (config.featuredProductId) {
      const found = unifiedProducts.find((p) => p.id === config.featuredProductId);
      if (found) return found;
    }
    const byProp = unifiedProducts.find((p) => p.isFeatured);
    if (byProp) return byProp;
    const byBadge = unifiedProducts.find((p) => p.badge?.toLowerCase().includes('destaque'));
    if (byBadge) return byBadge;
    return unifiedProducts[0] || null;
  }, [unifiedProducts, config.featuredProductId]);

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
    const cleanName = newOrEditedProduct.name.trim().toLowerCase();

    // Check if another product with identical name exists (auto-grouping requirement)
    const existingSameNameIndex = prev.findIndex(
      (p) => p.id !== newOrEditedProduct.id && p.name.trim().toLowerCase() === cleanName
    );

    let updated: Product[];
    let op = '';

    if (existingSameNameIndex > -1) {
      const existing = prev[existingSameNameIndex];
      // Merge colors
      const mergedColors = [...existing.colors];
      for (const newColor of newOrEditedProduct.colors) {
        const foundColorIdx = mergedColors.findIndex(
          (c) => c.name.trim().toLowerCase() === newColor.name.trim().toLowerCase()
        );
        if (foundColorIdx > -1) {
          mergedColors[foundColorIdx] = {
            ...mergedColors[foundColorIdx],
            hex: newColor.hex || mergedColors[foundColorIdx].hex,
            image: newColor.image || mergedColors[foundColorIdx].image,
          };
        } else {
          mergedColors.push(newColor);
        }
      }

      // Merge sizes
      const mergedSizes = Array.from(new Set([...existing.sizes, ...newOrEditedProduct.sizes]));

      const mergedProduct: Product = {
        ...existing,
        price: newOrEditedProduct.price || existing.price,
        originalPrice: newOrEditedProduct.originalPrice ?? existing.originalPrice,
        category: newOrEditedProduct.category || existing.category,
        description: newOrEditedProduct.description || existing.description,
        image: existing.image || newOrEditedProduct.image,
        colors: mergedColors,
        sizes: mergedSizes,
        badge: newOrEditedProduct.badge || existing.badge,
        inStock: existing.inStock || newOrEditedProduct.inStock,
      };

      const currentIndex = prev.findIndex((p) => p.id === newOrEditedProduct.id);
      if (currentIndex > -1 && currentIndex !== existingSameNameIndex) {
        updated = prev.filter((p) => p.id !== newOrEditedProduct.id);
        const newTargetIndex = updated.findIndex((p) => p.id === existing.id);
        updated[newTargetIndex] = mergedProduct;
      } else {
        updated = [...prev];
        updated[existingSameNameIndex] = mergedProduct;
      }

      op = `Agrupar cor no produto "${mergedProduct.name}"`;
      setSyncToast(`Produto "${mergedProduct.name}" atualizado! Cores e fotos unificadas.`);
      setTimeout(() => setSyncToast(null), 4000);
    } else {
      const index = prev.findIndex((p) => p.id === newOrEditedProduct.id);
      const isEdit = index > -1;
      if (isEdit) {
        updated = [...prev];
        updated[index] = newOrEditedProduct;
        op = `Editar produto "${newOrEditedProduct.name}"`;
      } else {
        updated = [newOrEditedProduct, ...prev];
        op = `Criar produto "${newOrEditedProduct.name}"`;
      }
    }

    setProducts(updated);
    addSyncLog('save_products', op, 'success', 'local_storage', {
      details: `${newOrEditedProduct.name} - ${newOrEditedProduct.price.toLocaleString('pt-AO')} Kz`,
      itemCount: updated.length,
    });
    persistProducts(updated, op);
  };

  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    const op = `Apagar produto "${target?.name || productId}"`;
    addSyncLog('delete_product', op, 'warning', 'local_storage', {
      details: `Artigo removido. Restam ${updated.length} artigos no catálogo.`,
      itemCount: updated.length,
    });
    persistProducts(updated, op);
  };

  const handleClearAllProducts = () => {
    setProducts([]);
    try {
      localStorage.removeItem('strong_products');
      localStorage.setItem('strong_catalog_version', Date.now().toString());
    } catch {}
    localCatalogVersionRef.current = Date.now();
    addSyncLog('reset_defaults', 'Limpar Todo o Catálogo', 'warning', 'local_storage', {
      details: 'Catálogo completamente limpo a pedido do administrador (0 artigos).',
      itemCount: 0,
    });
    persistProducts([], 'Limpar todo o catálogo');
    setSyncToast('Catálogo limpo com sucesso! 0 produtos no site.');
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleResetToDefaults = () => {
    setProducts([]);
    try {
      localStorage.removeItem('strong_products');
      localStorage.removeItem('strong_has_local_edits');
    } catch {}
    localCatalogVersionRef.current = Date.now();
    addSyncLog('reset_defaults', 'Catálogo Limpo / Vazio', 'warning', 'local_storage', {
      details: 'Catálogo limpo para início de cadastros manuais.',
      itemCount: 0,
    });
    persistProducts([], 'Catálogo limpo');
  };

  const handleUpdateConfig = (newConfig: StoreConfig) => {
    setConfig(newConfig);
    persistConfig(newConfig);
  };

  const handleImportProducts = (importedProducts: Product[]) => {
    setProducts(importedProducts);
    addSyncLog('import_catalog', 'Importação de Catálogo JSON', 'success', 'local_storage', {
      details: `Arquivo JSON importado com sucesso com ${importedProducts.length} itens.`,
      itemCount: importedProducts.length,
    });
    persistProducts(importedProducts, `Importar catálogo (${importedProducts.length} produtos)`);
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
        featuredProduct={featuredProduct}
        onViewDetails={(prod) => setDetailProduct(prod)}
        config={config}
      />

      {/* Main Catalog Section */}
      <main id="catalog-grid" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Category Header & Item Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white font-['Cabinet_Grotesk',sans-serif]">
                {selectedCategory === 'todos'
                  ? 'Coleção Completa'
                  : config.categories?.find((c) => c.id === selectedCategory)?.name || selectedCategory}
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
        {products.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 p-8 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white font-['Cabinet_Grotesk',sans-serif]">
              Catálogo Limpo & Pronto para Cadastros
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-md">
              Todos os produtos antigos foram limpos com sucesso. Podes agora começar a cadastrar as tuas novas peças, cores com fotos exclusivas e categorias personalizadas no Painel Administrativo.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsAdminOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-400/20 transition transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Abrir Painel & Cadastrar Primeiro Produto</span>
              </button>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
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
        onClearAllProducts={handleClearAllProducts}
        config={config}
        onUpdateConfig={handleUpdateConfig}
        onImportProducts={handleImportProducts}
        isServerSyncActive={isServerSyncActive}
        onForceSync={() => fetchLatestCatalog(true)}
        syncLogs={syncLogs}
        onClearSyncLogs={handleClearSyncLogs}
        catalogVersion={localCatalogVersionRef.current}
      />

      {/* Real-time Multi-device Sync Toast Notification */}
      {syncToast && (
        <div className="fixed top-24 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-900/95 border border-amber-400/40 text-neutral-100 text-xs font-semibold shadow-2xl shadow-black/50 backdrop-blur-md pointer-events-none transition-all">
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span>{syncToast}</span>
        </div>
      )}

      {/* Footer */}
      <Footer
        config={config}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />
    </div>
  );
}
