import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Image as ImageIcon,
  Save,
  RotateCcw,
  Download,
  Copy,
  Settings,
  Package,
  Check,
  AlertCircle,
  Smartphone,
  ExternalLink,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  Cloud,
  RefreshCw,
  Wifi,
  Activity,
  Star,
  Search,
  Sparkles,
  Layers,
  Tag,
} from 'lucide-react';
import { Product, ProductColor, StoreConfig, SyncLogEntry } from '../types';
import { formatPrice } from '../utils/whatsapp';
import { ActivityLog } from './ActivityLog';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onResetToDefaults: () => void;
  onClearAllProducts?: () => void;
  config: StoreConfig;
  onUpdateConfig: (newConfig: StoreConfig) => void;
  onImportProducts: (products: Product[]) => void;
  isServerSyncActive?: boolean;
  onForceSync?: () => Promise<void>;
  syncLogs?: SyncLogEntry[];
  onClearSyncLogs?: () => void;
  catalogVersion?: number;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  products,
  onSaveProduct,
  onDeleteProduct,
  onResetToDefaults,
  onClearAllProducts,
  config,
  onUpdateConfig,
  onImportProducts,
  isServerSyncActive = false,
  onForceSync,
  syncLogs = [],
  onClearSyncLogs = () => {},
  catalogVersion,
}) => {
  // Authentication State (Isolated from customer view)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('strong_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [showAdminPasswordInSettings, setShowAdminPasswordInSettings] = useState(false);

  const [activeTab, setActiveTab] = useState<'products' | 'new' | 'featured' | 'categories' | 'settings' | 'github' | 'logs'>('products');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Categories list
  const currentCategories = useMemo(() => {
    return config.categories && config.categories.length > 0
      ? config.categories
      : [
          { id: 'tshirts', name: 'T-shirts & Oversized' },
          { id: 'chapeus', name: 'Chapéus & Bonés' },
          { id: 'hoodies', name: 'Moletom & Hoodies' },
        ];
  }, [config.categories]);

  // Category management state
  const [newCatName, setNewCatName] = useState('');
  const [newCatId, setNewCatId] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [catActionFeedback, setCatActionFeedback] = useState<string | null>(null);
  const [showQuickNewCatModal, setShowQuickNewCatModal] = useState(false);
  const [quickCatName, setQuickCatName] = useState('');

  // Form State for creating / editing product
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<string>('tshirts');
  const [formPrice, setFormPrice] = useState<number>(15000);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number | undefined>(undefined);
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formInStock, setFormInStock] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);

  // Featured Product Area State
  const [featuredSearchQuery, setFeaturedSearchQuery] = useState('');
  const [featuredCategoryFilter, setFeaturedCategoryFilter] = useState<string>('todos');
  const [featuredSubtitleInput, setFeaturedSubtitleInput] = useState(config.featuredSubtitle || 'Destaque da Coleção');
  const [featuredFeedback, setFeaturedFeedback] = useState<string | null>(null);

  // Products Tab Search & Filter State
  const [adminProductSearchQuery, setAdminProductSearchQuery] = useState('');
  const [adminProductCategoryFilter, setAdminProductCategoryFilter] = useState<string>('todos');

  // Colors list for the current product
  const [formColors, setFormColors] = useState<ProductColor[]>([
    { name: 'Preto', hex: '#121212' },
    { name: 'Branco', hex: '#ffffff' },
  ]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [newColorImage, setNewColorImage] = useState<string>('');
  const [targetColorIndexForUpload, setTargetColorIndexForUpload] = useState<number | null>(null);

  const colorFileInputRef = useRef<HTMLInputElement>(null);

  // Sizes list
  const [formSizes, setFormSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [customSizeInput, setCustomSizeInput] = useState('');

  // Store Settings Form State
  const [settingsForm, setSettingsForm] = useState<StoreConfig>({ ...config });
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);
  const [jsonExportSuccess, setJsonExportSuccess] = useState(false);
  const [configExportSuccess, setConfigExportSuccess] = useState(false);
  const [initialProductsExportSuccess, setInitialProductsExportSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Sync settings form when config changes
  useEffect(() => {
    setSettingsForm({ ...config });
    if (config.featuredSubtitle) {
      setFeaturedSubtitleInput(config.featuredSubtitle);
    }
  }, [config]);

  // Current Featured Product
  const currentFeaturedProduct = useMemo(() => {
    if (config.featuredProductId) {
      const found = products.find((p) => p.id === config.featuredProductId);
      if (found) return found;
    }
    return products.find((p) => p.isFeatured) || null;
  }, [products, config.featuredProductId]);

  // Filtered products for featured selection grid
  const filteredFeaturedProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = featuredCategoryFilter === 'todos' || p.category === featuredCategoryFilter;
      const q = featuredSearchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.badge && p.badge.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [products, featuredCategoryFilter, featuredSearchQuery]);

  // Filtered products for products list tab
  const filteredAdminProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = adminProductCategoryFilter === 'todos' || p.category === adminProductCategoryFilter;
      const q = adminProductSearchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.badge && p.badge.toLowerCase().includes(q)) ||
        (p.colors && p.colors.some((c) => c.name.toLowerCase().includes(q)));
      return matchCat && matchQuery;
    });
  }, [products, adminProductCategoryFilter, adminProductSearchQuery]);

  // Check if there is an existing product with same name (automatic grouping indicator)
  const sameNameMatch = useMemo(() => {
    if (!formName.trim()) return null;
    return products.find(
      (p) => p.id !== editingProductId && p.name.trim().toLowerCase() === formName.trim().toLowerCase()
    );
  }, [formName, editingProductId, products]);

  // Handlers for Featured Products
  const handleSelectFeaturedProduct = (productId: string) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    const updatedConfig: StoreConfig = {
      ...config,
      featuredProductId: productId,
      featuredSubtitle: featuredSubtitleInput.trim() || config.featuredSubtitle || 'Destaque da Coleção',
    };
    onUpdateConfig(updatedConfig);

    const updatedProducts = products.map((p) => ({
      ...p,
      isFeatured: p.id === productId,
    }));
    onImportProducts(updatedProducts);

    setFeaturedFeedback(`"${targetProduct.name}" foi selecionado como produto em destaque!`);
    setTimeout(() => setFeaturedFeedback(null), 3500);
  };

  const handleRemoveFeaturedProduct = () => {
    const updatedConfig: StoreConfig = {
      ...config,
      featuredProductId: undefined,
    };
    onUpdateConfig(updatedConfig);

    const updatedProducts = products.map((p) => ({
      ...p,
      isFeatured: false,
    }));
    onImportProducts(updatedProducts);

    setFeaturedFeedback('Produto em destaque foi removido.');
    setTimeout(() => setFeaturedFeedback(null), 3500);
  };

  const handleSaveFeaturedSubtitle = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig: StoreConfig = {
      ...config,
      featuredSubtitle: featuredSubtitleInput.trim() || 'Destaque da Coleção',
    };
    onUpdateConfig(updatedConfig);
    setFeaturedFeedback('Título da etiqueta de destaque atualizado!');
    setTimeout(() => setFeaturedFeedback(null), 3000);
  };

  const handleManualSync = async () => {
    if (!onForceSync) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await onForceSync();
      setSyncFeedback('Sincronização concluída! Todos os dispositivos estão atualizados.');
    } catch {
      setSyncFeedback('Erro ao sincronizar com o servidor.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  if (!isOpen) return null;

  // Load product data into edit form
  const handleStartEdit = (product: Product) => {
    setEditingProductId(product.id);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormPrice(product.price);
    setFormOriginalPrice(product.originalPrice);
    setFormDescription(product.description);
    setFormImage(product.image);
    setFormBadge(product.badge || '');
    setFormInStock(product.inStock);
    setFormIsFeatured(product.id === config.featuredProductId || Boolean(product.isFeatured));
    setFormColors(product.colors && product.colors.length > 0 ? [...product.colors] : [{ name: 'Preto', hex: '#000000' }]);
    setFormSizes(product.sizes && product.sizes.length > 0 ? [...product.sizes] : ['S', 'M', 'L', 'XL']);
    setActiveTab('new');
  };

  // Category Management Handlers
  const handleCreateCategory = (name: string, customId?: string) => {
    if (!name.trim()) return '';
    const cleanId = (customId || name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    if (!cleanId) return '';

    if (currentCategories.some((c) => c.id === cleanId)) {
      setCatActionFeedback('Já existe uma categoria com este identificador.');
      setTimeout(() => setCatActionFeedback(null), 3500);
      return cleanId;
    }

    const updatedCategories = [...currentCategories, { id: cleanId, name: name.trim() }];
    onUpdateConfig({
      ...config,
      categories: updatedCategories,
    });

    setCatActionFeedback(`Categoria "${name.trim()}" criada com sucesso!`);
    setTimeout(() => setCatActionFeedback(null), 3500);
    setNewCatName('');
    setNewCatId('');
    return cleanId;
  };

  const handleSaveEditCategory = (id: string) => {
    if (!editingCatName.trim()) return;
    const updatedCategories = currentCategories.map((c) =>
      c.id === id ? { ...c, name: editingCatName.trim() } : c
    );
    onUpdateConfig({
      ...config,
      categories: updatedCategories,
    });
    setEditingCatId(null);
    setEditingCatName('');
    setCatActionFeedback('Categoria atualizada com sucesso!');
    setTimeout(() => setCatActionFeedback(null), 3500);
  };

  const handleDeleteCategory = (id: string) => {
    const target = currentCategories.find((c) => c.id === id);
    if (!target) return;
    if (
      window.confirm(
        `Tens a certeza de que desejas eliminar a categoria "${target.name}"? Os produtos cadastrados continuarão preservados.`
      )
    ) {
      const updatedCategories = currentCategories.filter((c) => c.id !== id);
      onUpdateConfig({
        ...config,
        categories: updatedCategories,
      });
      setCatActionFeedback(`Categoria "${target.name}" eliminada.`);
      setTimeout(() => setCatActionFeedback(null), 3500);
    }
  };

  // Color file upload with canvas compression
  const handleColorFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, Math.round(width), Math.round(height));

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (targetColorIndexForUpload === -1) {
          setNewColorImage(dataUrl);
        } else if (targetColorIndexForUpload !== null && targetColorIndexForUpload >= 0) {
          setFormColors((prev) =>
            prev.map((c, idx) => (idx === targetColorIndexForUpload ? { ...c, image: dataUrl } : c))
          );
        }
        setTargetColorIndexForUpload(null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Logo file upload with canvas compression
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, Math.round(width), Math.round(height));

        const dataUrl = canvas.toDataURL('image/png');
        setSettingsForm((prev) => ({ ...prev, logoUrl: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Reset form to blank
  const handleResetForm = () => {
    setEditingProductId(null);
    setFormName('');
    setFormCategory(currentCategories[0]?.id || 'tshirts');
    setFormPrice(15000);
    setFormOriginalPrice(undefined);
    setFormDescription('');
    setFormImage('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80');
    setFormBadge('');
    setFormInStock(true);
    setFormIsFeatured(false);
    setFormColors([
      { name: 'Preto', hex: '#121212' },
      { name: 'Branco', hex: '#ffffff' },
    ]);
    setFormSizes(['S', 'M', 'L', 'XL']);
    setNewColorName('');
    setNewColorHex('#000000');
    setNewColorImage('');
    setShowQuickNewCatModal(false);
  };

  // Compress & read real image uploaded from local disk
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize canvas to keep reasonable localStorage footprint and fast sync
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, Math.round(width), Math.round(height));

        // Convert to jpeg data url with efficient compression
        const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
        setFormImage(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Add Color
  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    setFormColors([
      ...formColors,
      {
        name: newColorName.trim(),
        hex: newColorHex,
        image: newColorImage.trim() || undefined,
      },
    ]);
    setNewColorName('');
    setNewColorImage('');
  };

  // Remove Color
  const handleRemoveColor = (index: number) => {
    if (formColors.length <= 1) return;
    setFormColors(formColors.filter((_, i) => i !== index));
  };

  // Toggle Size
  const handleToggleSize = (size: string) => {
    if (formSizes.includes(size)) {
      if (formSizes.length <= 1) return;
      setFormSizes(formSizes.filter((s) => s !== size));
    } else {
      setFormSizes([...formSizes, size]);
    }
  };

  // Add custom size
  const handleAddCustomSize = () => {
    if (!customSizeInput.trim() || formSizes.includes(customSizeInput.trim())) return;
    setFormSizes([...formSizes, customSizeInput.trim()]);
    setCustomSizeInput('');
  };

  // Save Product to catalog
  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const existingProduct = editingProductId ? products.find((p) => p.id === editingProductId) : null;

    const productPayload: Product = {
      id: editingProductId || `strong-item-${Date.now()}`,
      name: formName.trim(),
      category: formCategory,
      price: Number(formPrice),
      originalPrice: formOriginalPrice ? Number(formOriginalPrice) : undefined,
      description: formDescription.trim() || 'Peça da coleção oficial da marca de vestuário Strong.',
      details: existingProduct?.details || [
        'Produção autêntica Strong Apparel',
        'Acabamento e costuras de alta resistência',
        'Corte moderno e confortável'
      ],
      image: formImage.trim() || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
      colors: formColors,
      sizes: formSizes,
      inStock: formInStock,
      badge: formBadge.trim() || undefined,
      isFeatured: formIsFeatured,
    };

    onSaveProduct(productPayload);

    if (formIsFeatured) {
      onUpdateConfig({
        ...config,
        featuredProductId: productPayload.id,
      });
    } else if (config.featuredProductId === productPayload.id) {
      onUpdateConfig({
        ...config,
        featuredProductId: undefined,
      });
    }

    handleResetForm();
    setActiveTab('products');
  };

  // Save Store Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(settingsForm);
    setSaveSettingsSuccess(true);
    setTimeout(() => setSaveSettingsSuccess(false), 2500);
  };

  // Export JSON Catalog
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'catalog.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    // Also download version.json so customer devices detect the new publication
    const newVer = Date.now();
    const versionPayload = { version: newVer, updatedAt: new Date().toISOString() };
    const versionStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(versionPayload, null, 2));
    const versionAnchor = document.createElement('a');
    versionAnchor.setAttribute('href', versionStr);
    versionAnchor.setAttribute('download', 'version.json');
    document.body.appendChild(versionAnchor);
    versionAnchor.click();
    versionAnchor.remove();

    navigator.clipboard.writeText(JSON.stringify(products, null, 2));
    setJsonExportSuccess(true);
    setTimeout(() => setJsonExportSuccess(false), 3000);
  };

  const handleExportConfigJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'config.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setConfigExportSuccess(true);
    setTimeout(() => setConfigExportSuccess(false), 3000);
  };

  const handleExportInitialProductsTS = () => {
    const fileContent = `import { Product, StoreConfig } from "../types";\n\n` +
      `export const DEFAULT_STORE_CONFIG: StoreConfig = ${JSON.stringify(config, null, 2)};\n\n` +
      `export const INITIAL_PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};\n`;
    const dataStr = 'data:text/typescript;charset=utf-8,' + encodeURIComponent(fileContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'initialProducts.ts');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setInitialProductsExportSuccess(true);
    setTimeout(() => setInitialProductsExportSuccess(false), 3000);
  };

  const handleCopyJSONOnly = () => {
    navigator.clipboard.writeText(JSON.stringify(products, null, 2));
    setJsonExportSuccess(true);
    setTimeout(() => setJsonExportSuccess(false), 3000);
  };

  const handlePurgeAndReload = async () => {
    if (confirm('Deseja limpar o cache guardado neste navegador e recarregar os dados do arquivo catalog.json publicado no site?')) {
      localStorage.removeItem('strong_products');
      localStorage.removeItem('strong_config');
      localStorage.removeItem('strong_has_local_edits');
      localStorage.removeItem('strong_catalog_version');
      if (onForceSync) {
        await onForceSync();
      } else {
        window.location.reload();
      }
      setSyncFeedback('Cache limpo e dados recarregados!');
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  // Import JSON Catalog
  const handleImportJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportProducts(parsed);
          alert('Catálogo importado com sucesso!');
          setActiveTab('products');
        } else {
          alert('Ficheiro JSON inválido ou vazio.');
        }
      } catch (err) {
        alert('Erro ao interpretar o ficheiro JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Authenticate Admin Access Code
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctCode = (config.adminPassword || 'admin').trim();
    if (accessCodeInput.trim() === correctCode) {
      setIsAuthenticated(true);
      setAuthError('');
      try {
        sessionStorage.setItem('strong_admin_auth', 'true');
      } catch (err) {
        console.warn('sessionStorage unavailable', err);
      }
    } else {
      setAuthError('Código incorreto. Verifique a palavra-passe e tente novamente.');
    }
  };

  // Lock and Exit Admin
  const handleLogout = () => {
    setIsAuthenticated(false);
    setAccessCodeInput('');
    setAuthError('');
    try {
      sessionStorage.removeItem('strong_admin_auth');
    } catch (err) {
      console.warn('sessionStorage error', err);
    }
    onClose();
  };

  // If not authenticated, display the Isolated Admin Security Gate
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="relative w-16 h-16 mx-auto rounded-2xl bg-neutral-950 border border-neutral-800 p-1 flex items-center justify-center overflow-hidden shadow-xl">
              <img
                src={config.logoUrl || '/strong-logo.jpg'}
                alt={config.storeName}
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shadow">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide font-['Cabinet_Grotesk',sans-serif]">
                Acesso Administrativo Restrito
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed mt-1">
                Área de gestão isolada da loja de compra. Introduza o código de segurança para aceder ao catálogo, preços e configurações.
              </p>
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                Código de Acesso (PIN / Senha):
              </label>
              <div className="relative">
                <input
                  type={showCode ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Insere o código de segurança..."
                  value={accessCodeInput}
                  onChange={(e) => {
                    setAccessCodeInput(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 pr-11 font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition p-1"
                  tabIndex={-1}
                  title={showCode ? 'Ocultar código' : 'Mostrar código'}
                >
                  {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {authError ? (
                <p className="text-xs text-red-400 flex items-center gap-1.5 mt-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {authError}
                </p>
              ) : (
                <p className="text-[11px] text-neutral-500 mt-2">
                  Código padrão inicial: <span className="text-amber-400 font-mono font-bold">admin</span> (podes alterar nas definições).
                </p>
              )}
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/15 transition transform active:scale-98 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Desbloquear Área de Gestão</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-400 hover:text-white font-bold text-xs transition cursor-pointer"
              >
                Voltar à Loja de Compra
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col h-screen overflow-hidden text-neutral-100">
      {/* Top Header */}
      <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-950 border border-neutral-800 p-1 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
            <img
              src={config.logoUrl || '/strong-logo.jpg'}
              alt={config.storeName}
              className="w-full h-full object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white font-['Cabinet_Grotesk',sans-serif]">
                Painel Administrativo Isolado
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Sessão Autenticada
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              Gestão de artigos, fotos reais, estoque e WhatsApp — completamente isolado da área de compra
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition"
            title="Voltar à Loja para visualizar como os clientes veem"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Voltar à Loja</span>
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-900/50 text-xs font-bold transition"
            title="Bloquear sessão com código e sair"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Bloquear & Sair</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-neutral-800 bg-neutral-900/60 overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Produtos Cadastrados ({products.length})
        </button>

        <button
          onClick={() => {
            if (activeTab !== 'new') handleResetForm();
            setActiveTab('new');
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'new'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          {editingProductId ? 'Editar Produto' : 'Adicionar Novo Produto'}
        </button>

        <button
          onClick={() => setActiveTab('featured')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'featured'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800'
          }`}
          title="Escolher qual produto deve estar em destaque no topo da loja"
        >
          <Star className={`w-3.5 h-3.5 ${currentFeaturedProduct ? 'text-amber-400 fill-amber-400' : ''}`} />
          <span>Produto em Destaque</span>
          {currentFeaturedProduct && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800'
          }`}
          title="Criar e editar categorias da loja"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Categorias ({currentCategories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          WhatsApp & Código de Acesso
        </button>

        <button
          onClick={() => setActiveTab('github')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'github'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          Backup & GitHub
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Histórico & Diagnóstico ({syncLogs.length})
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* TAB 1: LIST PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <div>
                  <h3 className="text-sm font-black text-white">Catálogo Atual da Marca</h3>
                  <p className="text-xs text-neutral-400">
                    Estes são os produtos visíveis no site da Strong. Você pode editar cores, preços ou adicionar fotos reais.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          'Tens a certeza de que desejas LIMPAR TODOS os produtos do catálogo? O site ficará sem produtos antigos para que possas cadastrar todos do zero.'
                        )
                      ) {
                        if (onClearAllProducts) {
                          onClearAllProducts();
                        } else {
                          onResetToDefaults();
                        }
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800/60 font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    title="Apagar todos os produtos antigos e deixar o site limpo"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Limpar Catálogo (Zerar)</span>
                  </button>

                  <button
                    onClick={() => {
                      handleResetForm();
                      setActiveTab('new');
                    }}
                    className="px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Produto
                  </button>
                </div>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome, cor, descrição..."
                    value={adminProductSearchQuery}
                    onChange={(e) => setAdminProductSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setAdminProductCategoryFilter('todos')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                      adminProductCategoryFilter === 'todos'
                        ? 'bg-amber-400 text-neutral-950 shadow-sm'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Todos
                  </button>
                  {currentCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setAdminProductCategoryFilter(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                        adminProductCategoryFilter === cat.id
                          ? 'bg-amber-400 text-neutral-950 shadow-sm'
                          : 'bg-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Counter status badge */}
              <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                <span>
                  A mostrar <strong className="text-white">{filteredAdminProducts.length}</strong> de <strong className="text-amber-400">{products.length}</strong> produtos no catálogo
                </span>
                {(adminProductSearchQuery || adminProductCategoryFilter !== 'todos') && (
                  <button
                    onClick={() => {
                      setAdminProductSearchQuery('');
                      setAdminProductCategoryFilter('todos');
                    }}
                    className="text-amber-400 hover:underline text-[11px]"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>

              {filteredAdminProducts.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 bg-neutral-950/40 rounded-xl border border-neutral-800 space-y-2">
                  <p className="text-sm font-bold text-neutral-300">Nenhum produto encontrado com os filtros selecionados.</p>
                  <p className="text-xs text-neutral-500">Tente pesquisar com outro termo ou limpe os filtros para ver todo o catálogo.</p>
                  <button
                    onClick={() => {
                      setAdminProductSearchQuery('');
                      setAdminProductCategoryFilter('todos');
                    }}
                    className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-amber-400 mt-2 inline-block"
                  >
                    Ver Todos os {products.length} Produtos
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredAdminProducts.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3.5 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 items-center justify-between group hover:border-neutral-700 transition"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg bg-neutral-900 shrink-0 border border-neutral-800"
                      />

                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400">
                            {currentCategories.find((c) => c.id === item.category)?.name || item.category}
                          </span>
                          {(item.id === config.featuredProductId || item.isFeatured) && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-400 text-neutral-950 flex items-center gap-1 shadow-sm">
                              <Star className="w-2.5 h-2.5 fill-neutral-950" />
                              DESTAQUE
                            </span>
                          )}
                          {item.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white truncate mt-1">{item.name}</h4>
                        <p className="text-xs font-extrabold text-amber-400 mt-0.5">
                          {formatPrice(item.price, config)}
                        </p>

                        {/* Color count & Size badges */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex -space-x-1">
                            {(item.colors || []).slice(0, 4).map((c, i) => (
                              <span
                                key={i}
                                className="w-3.5 h-3.5 rounded-full border border-black inline-block"
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-neutral-400">
                            {(item.colors || []).length} {(item.colors || []).length === 1 ? 'cor' : 'cores'}
                          </span>
                          <span className="text-neutral-600">•</span>
                          <span className="text-[10px] text-neutral-400 truncate">
                            {(item.sizes || []).join(', ')}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Star Highlight Toggle Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.id === config.featuredProductId || item.isFeatured) {
                              handleRemoveFeaturedProduct();
                            } else {
                              handleSelectFeaturedProduct(item.id);
                            }
                          }}
                          className={`p-2 rounded-lg transition ${
                            item.id === config.featuredProductId || item.isFeatured
                              ? 'text-amber-400 bg-amber-950/80 border border-amber-400/50 hover:bg-amber-900/80'
                              : 'text-neutral-400 hover:text-amber-400 bg-neutral-900 hover:bg-neutral-800'
                          }`}
                          title={
                            item.id === config.featuredProductId || item.isFeatured
                              ? 'Artigo em destaque ativo. Clica para retirar dos destaques.'
                              : 'Definir este artigo como Produto em Destaque no topo da loja'
                          }
                        >
                          <Star className={`w-4 h-4 ${item.id === config.featuredProductId || item.isFeatured ? 'fill-amber-400' : ''}`} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(item);
                          }}
                          className="p-2 text-neutral-400 hover:text-amber-400 bg-neutral-900 hover:bg-neutral-800 rounded-lg transition"
                          title="Editar Peça"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Tem a certeza que deseja eliminar "${item.name}"?`)) {
                              if (item.id === config.featuredProductId) {
                                handleRemoveFeaturedProduct();
                              }
                              onDeleteProduct(item.id);
                            }
                          }}
                          className="p-2 text-neutral-400 hover:text-red-400 bg-neutral-900 hover:bg-neutral-800 rounded-lg transition"
                          title="Eliminar Peça"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE / EDIT PRODUCT FORM */}
          {activeTab === 'new' && (
            <form onSubmit={handleSaveProductSubmit} className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-sm font-black text-white">
                  {editingProductId ? 'Editar Informações do Produto' : 'Cadastrar Novo Produto na Loja Strong'}
                </h3>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                      Nome da Peça:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: T-shirt Strong Street Heavyweight"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Same-name auto grouping notification */}
                  {sameNameMatch && (
                    <div className="p-3 bg-amber-400/10 border border-amber-400/40 rounded-xl flex items-start gap-2.5 animate-fadeIn">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-200 leading-relaxed">
                        <span className="font-bold text-amber-400">Agrupamento Automático de Cores:</span> Já existe um produto cadastrado com o nome <strong>"{sameNameMatch.name}"</strong> ({sameNameMatch.colors.length} cor(es)). Ao salvar, as novas cores e fotos inseridas aqui serão automaticamente adicionadas ao mesmo card na vitrine!
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                          Categoria:
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowQuickNewCatModal(!showQuickNewCatModal)}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Nova</span>
                        </button>
                      </div>

                      {showQuickNewCatModal && (
                        <div className="mb-2 p-2.5 bg-neutral-900 border border-amber-400/40 rounded-xl space-y-2">
                          <span className="text-[11px] font-bold text-amber-400 block">Criar Nova Categoria:</span>
                          <input
                            type="text"
                            placeholder="Nome (ex: Calças, Acessórios...)"
                            value={quickCatName}
                            onChange={(e) => setQuickCatName(e.target.value)}
                            className="w-full px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!quickCatName.trim()) return;
                              const createdId = handleCreateCategory(quickCatName.trim());
                              if (createdId) setFormCategory(createdId);
                              setQuickCatName('');
                              setShowQuickNewCatModal(false);
                            }}
                            className="w-full py-1 bg-amber-400 text-neutral-950 font-bold text-xs rounded hover:bg-amber-300 transition"
                          >
                            Criar e Selecionar
                          </button>
                        </div>
                      )}

                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                      >
                        {currentCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                        Destaque / Badge (Opcional):
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Novo, Bestseller..."
                        value={formBadge}
                        onChange={(e) => setFormBadge(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Featured Product Checkbox Option */}
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-md ${formIsFeatured ? 'bg-amber-400/20 text-amber-400' : 'bg-neutral-900 text-neutral-500'}`}>
                        <Star className={`w-4 h-4 ${formIsFeatured ? 'fill-amber-400' : ''}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Produto em Destaque Principal</p>
                        <p className="text-[11px] text-neutral-400">Exibir esta peça no banner Hero do topo da loja</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      id="form-is-featured-toggle"
                      checked={formIsFeatured}
                      onChange={(e) => setFormIsFeatured(e.target.checked)}
                      className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                        Preço ({config.currencySymbol}):
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="100"
                        value={formPrice}
                        onChange={(e) => setFormPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-amber-400 font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                        Preço Original / De (Opcional):
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Ex: 18000"
                        value={formOriginalPrice || ''}
                        onChange={(e) => setFormOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-400 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                      Descrição & Detalhes da Peça:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Descreva o tecido, corte, caimento ou especificações da peça..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                    />
                  </div>

                  {/* Stock Availability */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <input
                      type="checkbox"
                      id="inStockCheck"
                      checked={formInStock}
                      onChange={(e) => setFormInStock(e.target.checked)}
                      className="w-4 h-4 text-amber-400 bg-neutral-900 border-neutral-700 rounded focus:ring-amber-400"
                    />
                    <label htmlFor="inStockCheck" className="text-xs font-bold text-neutral-200 cursor-pointer">
                      Disponível em Estoque para Compra Imediata
                    </label>
                  </div>
                </div>

                {/* Right Column: Real Image Upload & Colors & Sizes */}
                <div className="space-y-4">
                  {/* REAL IMAGE UPLOAD (Key User Requirement) */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                      Foto Real da Peça:
                    </label>
                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                          {formImage ? (
                            <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-600">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-neutral-700 transition"
                          >
                            <Upload className="w-4 h-4 text-amber-400" />
                            Carregar Foto do Telemóvel / PC
                          </button>

                          <div className="text-[11px] text-neutral-500 text-center">ou cole um link abaixo:</div>

                          <input
                            type="url"
                            placeholder="https://exemplo.com/foto.jpg"
                            value={formImage}
                            onChange={(e) => {
                              const newUrl = e.target.value;
                              setFormImage(newUrl);
                              if (newUrl.trim()) {
                                setFormColors((prevColors) =>
                                  prevColors.map((c, idx) => (idx === 0 || !c.image ? { ...c, image: newUrl.trim() } : c))
                                );
                              }
                            }}
                            className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CORES DISPONÍVEIS COM FOTOS EXCLUSIVAS */}
                  <div>
                    {/* Hidden file input for color-specific photos */}
                    <input
                      ref={colorFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleColorFileUpload}
                      className="hidden"
                    />

                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                        Cores & Fotos Específicas:
                      </label>
                      <span className="text-[10px] text-amber-400 font-bold">
                        Troca de foto ao clicar na cor
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                      {/* Current colors list */}
                      <div className="space-y-2">
                        {formColors.map((color, index) => (
                          <div
                            key={index}
                            className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between gap-2.5 hover:border-neutral-700 transition"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-5 h-5 rounded-full border border-black/40 shrink-0 shadow-inner"
                                style={{ backgroundColor: color.hex }}
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{color.name}</p>
                                <p className="text-[10px] text-neutral-500 font-mono">{color.hex}</p>
                              </div>
                            </div>

                            {/* Color Image & Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {color.image ? (
                                <div className="relative group/colorimg">
                                  <img
                                    src={color.image}
                                    alt={color.name}
                                    className="w-8 h-8 object-cover rounded-md border border-amber-400/40 bg-neutral-950"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormColors((prev) =>
                                        prev.map((c, i) => (i === index ? { ...c, image: undefined } : c))
                                      );
                                    }}
                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold shadow"
                                    title="Remover foto desta cor"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-neutral-500 italic hidden sm:inline">
                                  (Foto padrão)
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setTargetColorIndexForUpload(index);
                                  colorFileInputRef.current?.click();
                                }}
                                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[11px] font-bold text-neutral-200 hover:text-white flex items-center gap-1 transition"
                                title="Carregar foto real para esta cor"
                              >
                                <Upload className="w-3 h-3 text-amber-400" />
                                <span className="hidden sm:inline">{color.image ? 'Trocar Foto' : '+ Foto'}</span>
                                <span className="sm:hidden">Foto</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const url = window.prompt(
                                    `Link URL da imagem para a cor "${color.name}":`,
                                    color.image || ''
                                  );
                                  if (url !== null) {
                                    setFormColors((prev) =>
                                      prev.map((c, i) =>
                                        i === index ? { ...c, image: url.trim() || undefined } : c
                                      )
                                    );
                                  }
                                }}
                                className="p-1.5 text-neutral-400 hover:text-amber-400 bg-neutral-800 rounded"
                                title="Inserir link URL da foto desta cor"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveColor(index)}
                                className="p-1.5 text-neutral-500 hover:text-red-400 rounded"
                                title="Remover cor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add new color controls */}
                      <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-2.5 pt-2.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-neutral-300">
                          <span>Adicionar Nova Cor à Peça</span>
                          {newColorImage && (
                            <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                              <Check className="w-3 h-3" /> Foto anexada
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={newColorHex}
                            onChange={(e) => setNewColorHex(e.target.value)}
                            className="w-8 h-8 rounded-lg border border-neutral-700 bg-neutral-950 cursor-pointer p-0.5"
                            title="Escolher tom visual"
                          />
                          <input
                            type="text"
                            placeholder="Nome da cor (ex: Bege Areia, Verde Oliva...)"
                            value={newColorName}
                            onChange={(e) => setNewColorName(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        {/* Optional photo for new color */}
                        <div className="flex items-center gap-2">
                          {newColorImage ? (
                            <div className="flex items-center gap-2 flex-1 bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-800">
                              <img src={newColorImage} alt="Preview" className="w-6 h-6 rounded object-cover" />
                              <span className="text-[11px] text-neutral-300 truncate flex-1">Foto da cor pronta</span>
                              <button
                                type="button"
                                onClick={() => setNewColorImage('')}
                                className="text-red-400 hover:text-red-300 text-xs font-bold"
                              >
                                Remover
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setTargetColorIndexForUpload(-1);
                                colorFileInputRef.current?.click();
                              }}
                              className="flex-1 py-1.5 px-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-bold text-neutral-300 hover:text-white flex items-center justify-center gap-1.5 transition"
                            >
                              <Upload className="w-3 h-3 text-amber-400" />
                              <span>+ Anexar Foto para esta Cor (Opcional)</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleAddColor}
                            className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition flex items-center gap-1 shadow-sm shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TAMANHOS DISPONÍVEIS */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                      Tamanhos Disponíveis:
                    </label>
                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {['S', 'M', 'L', 'XL', 'XXL', 'Tamanho Único', 'Ajustável'].map((sz) => {
                          const active = formSizes.includes(sz);
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => handleToggleSize(sz)}
                              className={`px-2.5 py-1 text-xs font-bold rounded transition ${
                                active
                                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>

                      {/* Add custom size */}
                      <div className="flex items-center gap-2 pt-1.5">
                        <input
                          type="text"
                          placeholder="Outro tamanho (ex: 3XL, Infantil)..."
                          value={customSizeInput}
                          onChange={(e) => setCustomSizeInput(e.target.value)}
                          className="flex-1 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSize}
                          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300"
                        >
                          Inserir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs flex items-center gap-2 shadow-md shadow-amber-400/20 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingProductId ? 'Guardar Alterações' : 'Publicar Produto no Site'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB: GESTÃO DE CATEGORIAS */}
          {activeTab === 'categories' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="pb-3 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-black text-white font-['Cabinet_Grotesk',sans-serif]">
                      Gestão de Categorias da Loja
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Cria, renomeia e organiza as categorias dos produtos da marca Strong.
                  </p>
                </div>
              </div>

              {catActionFeedback && (
                <div className="p-3.5 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{catActionFeedback}</span>
                  </div>
                  <button
                    onClick={() => setCatActionFeedback(null)}
                    className="text-neutral-400 hover:text-white text-xs px-2"
                  >
                    Fechar
                  </button>
                </div>
              )}

              {/* Box to create new category */}
              <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4">
                <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  Criar Nova Categoria
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1">
                      Nome da Categoria (visível na loja):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Calças & Shorts, Acessórios, Casacos..."
                      value={newCatName}
                      onChange={(e) => {
                        setNewCatName(e.target.value);
                        if (!newCatId || newCatId === newCatName.toLowerCase().replace(/[^a-z0-9]/g, '')) {
                          setNewCatId(
                            e.target.value
                              .toLowerCase()
                              .normalize('NFD')
                              .replace(/[\u0300-\u036f]/g, '')
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)+/g, '')
                          );
                        }
                      }}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1">
                      Slug / Identificador (opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: calcas-shorts"
                      value={newCatId}
                      onChange={(e) => setNewCatId(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleCreateCategory(newCatName, newCatId)}
                    disabled={!newCatName.trim()}
                    className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Salvar Categoria</span>
                  </button>
                </div>
              </div>

              {/* List of active categories */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Categorias Ativas ({currentCategories.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Desejas restaurar as categorias padrão (T-shirts, Chapéus & Bonés, Hoodies)?')) {
                        onUpdateConfig({
                          ...config,
                          categories: [
                            { id: 'tshirts', name: 'T-shirts & Oversized' },
                            { id: 'chapeus', name: 'Chapéus & Bonés' },
                            { id: 'hoodies', name: 'Moletom & Hoodies' },
                          ],
                        });
                        setCatActionFeedback('Categorias padrão restauradas com sucesso.');
                        setTimeout(() => setCatActionFeedback(null), 3000);
                      }
                    }}
                    className="text-[11px] text-neutral-400 hover:text-amber-400 transition"
                  >
                    Restaurar Padrão
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {currentCategories.map((category) => {
                    const count = products.filter((p) => p.category === category.id).length;
                    const isEditing = editingCatId === category.id;

                    return (
                      <div
                        key={category.id}
                        className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3 hover:border-neutral-700 transition"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                            <Tag className="w-4 h-4" />
                          </div>

                          {isEditing ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="text"
                                value={editingCatName}
                                onChange={(e) => setEditingCatName(e.target.value)}
                                autoFocus
                                className="px-2.5 py-1 bg-neutral-900 border border-amber-400 rounded text-xs text-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEditCategory(category.id)}
                                className="px-2.5 py-1 rounded bg-amber-400 text-neutral-950 text-xs font-bold"
                              >
                                Salvar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCatId(null);
                                  setEditingCatName('');
                                }}
                                className="px-2 py-1 text-neutral-400 hover:text-white text-xs"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-bold text-white truncate">{category.name}</h5>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                                  slug: {category.id}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400">
                                {count} {count === 1 ? 'artigo cadastrado' : 'artigos cadastrados'}
                              </p>
                            </div>
                          )}
                        </div>

                        {!isEditing && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCatId(category.id);
                                setEditingCatName(category.name);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white transition flex items-center gap-1"
                              title="Editar nome da categoria"
                            >
                              <Edit2 className="w-3 h-3 text-amber-400" />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(category.id)}
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-900 transition"
                              title="Eliminar categoria"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRODUTO EM DESTAQUE */}
          {activeTab === 'featured' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Header Title */}
              <div className="pb-3 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <h3 className="text-base font-black text-white font-['Cabinet_Grotesk',sans-serif]">
                      Produto em Destaque no Topo da Loja
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Escolha qual peça aparece em evidência principal no banner Hero do topo do site, visível para todos os clientes em qualquer computador ou telemóvel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ver na Loja</span>
                </button>
              </div>

              {/* Feedback toast banner if triggered */}
              {featuredFeedback && (
                <div className="p-3.5 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{featuredFeedback}</span>
                  </div>
                  <button
                    onClick={() => setFeaturedFeedback(null)}
                    className="text-neutral-400 hover:text-white text-xs px-2"
                  >
                    Fechar
                  </button>
                </div>
              )}

              {/* SECTION 1: PRODUTO ATUALMENTE EM DESTAQUE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Peça Atualmente em Destaque
                  </h4>
                  {currentFeaturedProduct && (
                    <button
                      type="button"
                      onClick={handleRemoveFeaturedProduct}
                      className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remover Destaque
                    </button>
                  )}
                </div>

                {currentFeaturedProduct ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/90 border border-amber-400/40 shadow-xl shadow-amber-400/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex flex-col md:flex-row gap-5 items-start md:items-center">
                      {/* Product Image */}
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0">
                        <img
                          src={currentFeaturedProduct.image}
                          alt={currentFeaturedProduct.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1.5 left-1.5">
                          <span className="px-2 py-0.5 rounded bg-amber-400 text-neutral-950 text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
                            <Star className="w-2.5 h-2.5 fill-neutral-950" />
                            Ativo
                          </span>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">
                            {currentFeaturedProduct.category === 'tshirts' ? 'T-Shirt' : currentFeaturedProduct.category === 'chapeus' ? 'Chapéu/Boné' : 'Moletom'}
                          </span>
                          {currentFeaturedProduct.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              {currentFeaturedProduct.badge}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-black text-white truncate">
                          {currentFeaturedProduct.name}
                        </h3>

                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-black text-amber-400">
                            {formatPrice(currentFeaturedProduct.price, config)}
                          </span>
                          {currentFeaturedProduct.originalPrice && (
                            <span className="text-xs text-neutral-500 line-through">
                              {formatPrice(currentFeaturedProduct.originalPrice, config)}
                            </span>
                          )}
                        </div>

                        {/* Colors & Sizes summary */}
                        <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-neutral-500">Cores:</span>
                            <div className="flex -space-x-1">
                              {currentFeaturedProduct.colors.map((c, i) => (
                                <span
                                  key={i}
                                  className="w-3.5 h-3.5 rounded-full border border-black inline-block"
                                  style={{ backgroundColor: c.hex }}
                                  title={c.name}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-neutral-700">•</span>
                          <div>
                            <span className="text-[11px] text-neutral-500">Tamanhos:</span>{' '}
                            <span className="text-neutral-300">{currentFeaturedProduct.sizes.join(', ')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Edit Tag Form */}
                      <div className="w-full md:w-64 bg-neutral-950/80 p-3 rounded-xl border border-neutral-800 space-y-2 shrink-0">
                        <label className="block text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                          Texto da Etiqueta:
                        </label>
                        <form onSubmit={handleSaveFeaturedSubtitle} className="space-y-2">
                          <input
                            type="text"
                            placeholder="Ex: Destaque da Coleção..."
                            value={featuredSubtitleInput}
                            onChange={(e) => setFeaturedSubtitleInput(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                          />
                          <button
                            type="submit"
                            className="w-full py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-bold transition flex items-center justify-center gap-1 border border-neutral-700"
                          >
                            <Save className="w-3 h-3" />
                            Guardar Etiqueta
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-neutral-900/40 border border-dashed border-neutral-700 text-center space-y-2">
                    <Star className="w-8 h-8 text-neutral-500 mx-auto" />
                    <p className="text-sm font-bold text-neutral-300">
                      Nenhum produto está atualmente definido em destaque.
                    </p>
                    <p className="text-xs text-neutral-500 max-w-md mx-auto">
                      Selecione qualquer produto no catálogo abaixo para torná-lo o item principal na página inicial da loja.
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION 2: SELETOR DE PRODUTOS */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                      Escolher Novo Produto para o Destaque
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Clica em "Colocar em Destaque" no produto que desejas promover.
                    </p>
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Pesquisar produto..."
                      value={featuredSearchQuery}
                      onChange={(e) => setFeaturedSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <button
                    type="button"
                    onClick={() => setFeaturedCategoryFilter('todos')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      featuredCategoryFilter === 'todos'
                        ? 'bg-amber-400 text-neutral-950 shadow-sm'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    Todos os Artigos
                  </button>
                  {currentCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFeaturedCategoryFilter(cat.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                        featuredCategoryFilter === cat.id
                          ? 'bg-amber-400 text-neutral-950 shadow-sm'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                  {filteredFeaturedProducts.map((p) => {
                    const isSelected = p.id === currentFeaturedProduct?.id;
                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'bg-amber-950/20 border-amber-400/60 ring-1 ring-amber-400/40 shadow-lg shadow-amber-400/5'
                            : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex gap-3 items-start">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] uppercase font-extrabold px-1 py-0.5 rounded bg-neutral-800 text-amber-400">
                                {p.category === 'tshirts' ? 'T-Shirt' : p.category === 'chapeus' ? 'Chapéu' : 'Moletom'}
                              </span>
                              {p.badge && (
                                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-400/15 text-amber-300">
                                  {p.badge}
                                </span>
                              )}
                            </div>
                            <h5 className="text-xs font-bold text-white truncate mt-1" title={p.name}>
                              {p.name}
                            </h5>
                            <p className="text-xs font-black text-amber-400 mt-0.5">
                              {formatPrice(p.price, config)}
                            </p>
                          </div>
                        </div>

                        {/* Button Action */}
                        <div>
                          {isSelected ? (
                            <button
                              type="button"
                              onClick={handleRemoveFeaturedProduct}
                              className="w-full py-1.5 rounded-lg bg-amber-400/20 hover:bg-red-950/50 text-amber-400 hover:text-red-400 border border-amber-400/40 hover:border-red-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5 text-amber-400" />
                              <span>Destaque Ativo (Remover)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectFeaturedProduct(p.id)}
                              className="w-full py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-amber-400/20 active:scale-[0.98]"
                            >
                              <Star className="w-3.5 h-3.5 fill-neutral-950" />
                              <span>Colocar em Destaque</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredFeaturedProducts.length === 0 && (
                  <div className="p-8 text-center text-neutral-500 bg-neutral-950/40 rounded-xl border border-neutral-800">
                    Nenhum produto encontrado para a pesquisa informada.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: WHATSAPP & STORE SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl mx-auto">
              <div className="pb-3 border-b border-neutral-800">
                <h3 className="text-sm font-black text-white">Configurações Gerais da Marca & Vendas</h3>
                <p className="text-xs text-neutral-400">
                  Gestão do logótipo oficial, número do WhatsApp de encomendas e definições da loja.
                </p>
              </div>

              {/* Brand Logo Configuration */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Logótipo Oficial da Marca (Logo)</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Símbolo oficial do Gorila Strong exibido no cabeçalho, rodapé e painel da loja.
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-neutral-900 border border-neutral-800 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    <img
                      src={settingsForm.logoUrl || '/strong-logo.jpg'}
                      alt="Logo Preview"
                      className="w-full h-full object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    onChange={handleLogoFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carregar Novo Logo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsForm((prev) => ({ ...prev, logoUrl: '/strong-logo.jpg' }))}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-xs font-medium transition"
                  >
                    Restaurar Logo Oficial (Gorila)
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Número do WhatsApp da Loja (com indicativo):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ex: 244923456789 (sem o + e sem espaços)"
                      value={settingsForm.whatsappNumber}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Exemplo para Angola: <strong>24495348842</strong> • Portugal: <strong>351912345678</strong> • Brasil: <strong>5511999999999</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                      Símbolo da Moeda:
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.currencySymbol}
                      onChange={(e) => setSettingsForm({ ...settingsForm, currencySymbol: e.target.value })}
                      className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[10px] text-neutral-500 mt-1">Ex: Kz, R$, €, $, etc.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                      Posição da Moeda:
                    </label>
                    <select
                      value={settingsForm.currencyPosition}
                      onChange={(e) => setSettingsForm({ ...settingsForm, currencyPosition: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="suffix">Depois do valor (ex: 15.000 Kz)</option>
                      <option value="prefix">Antes do valor (ex: R$ 150)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Mensagem de Abertura no WhatsApp:
                  </label>
                  <textarea
                    rows={2}
                    value={settingsForm.welcomeMessage}
                    onChange={(e) => setSettingsForm({ ...settingsForm, welcomeMessage: e.target.value })}
                    className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Localização & Informações de Entrega:
                  </label>
                  <input
                    type="text"
                    value={settingsForm.address || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Instagram Oficial:
                  </label>
                  <input
                    type="text"
                    placeholder="@strong.brand"
                    value={settingsForm.instagramHandle || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, instagramHandle: e.target.value })}
                    className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Secret Admin Access Code Setting */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-amber-400/20 space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Lock className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Código de Acesso do Administrador (PIN/Senha)</h4>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Este código protege esta área isolada e impede que clientes ou visitantes comuns tenham acesso à gestão dos produtos, preços e pedidos.
                  </p>
                  <div className="relative">
                    <input
                      type={showAdminPasswordInSettings ? 'text' : 'password'}
                      required
                      placeholder="Código ou senha secreta (ex: admin)"
                      value={settingsForm.adminPassword || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, adminPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-400 pr-10 tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPasswordInSettings(!showAdminPasswordInSettings)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition p-1"
                      tabIndex={-1}
                      title={showAdminPasswordInSettings ? 'Ocultar código' : 'Mostrar código'}
                    >
                      {showAdminPasswordInSettings ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    Código atual: <span className="text-neutral-400 font-mono font-bold">{settingsForm.adminPassword || 'admin'}</span>. Podes mudar para qualquer palavra-passe ou PIN numérico.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                {saveSettingsSuccess ? (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Configurações salvas com sucesso!
                  </span>
                ) : (
                  <span className="text-xs text-neutral-500">
                    Alterações salvas instantaneamente no navegador.
                  </span>
                )}

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs flex items-center gap-2 shadow-md shadow-amber-400/20 transition"
                >
                  <Save className="w-4 h-4" />
                  Salvar Configurações
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: GITHUB BACKUP & JSON EXPORT */}
          {activeTab === 'github' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="pb-3 border-b border-neutral-800">
                <h3 className="text-sm font-black text-white">Sincronização em Nuvem & Backup GitHub</h3>
                <p className="text-xs text-neutral-400">
                  Gerencie a sincronização de produtos e fotos entre todos os dispositivos (computador, telemóvel e clientes).
                </p>
              </div>

              {/* Multi-Device Live Sync Status Card */}
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-700 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-amber-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Sincronização entre Dispositivos
                    </h4>
                  </div>
                  {isServerSyncActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Servidor Conectado (Tempo Real)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Wifi className="w-3 h-3" />
                      Modo Estático / GitHub
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  {isServerSyncActive
                    ? 'Qualquer alteração, foto nova ou catálogo importado aqui é gravado no servidor. Todos os telemóveis e computadores que abrirem o site receberão a versão atualizada automaticamente!'
                    : 'Para que outros dispositivos (como o seu telemóvel) vejam os novos produtos, você pode clicar em "Baixar Catálogo (JSON)" abaixo e atualizar o arquivo public/catalog.json no seu repositório GitHub.'}
                </p>

                {onForceSync && (
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-neutral-700 text-neutral-950 font-bold text-xs flex items-center gap-2 transition shadow-md shadow-amber-400/20"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Sincronizando...' : 'Verificar Atualizações no Servidor'}
                    </button>

                    <button
                      type="button"
                      onClick={handlePurgeAndReload}
                      className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs flex items-center gap-2 border border-neutral-700 transition"
                      title="Força este aparelho a descartar o cache local e baixar o catálogo mais recente do site"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      Recarregar Dados do Site (Limpar Cache)
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('logs')}
                      className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs flex items-center gap-2 border border-neutral-700 transition"
                      title="Abrir histórico detalhado e log de sincronização"
                    >
                      <Activity className="w-4 h-4 text-amber-400" />
                      Ver Log de Atividades ({syncLogs.length})
                    </button>

                    {syncFeedback && (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> {syncFeedback}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Explicação Clara: Sincronização Automática em Tempo Real */}
              <div className="p-4 rounded-xl bg-emerald-400/10 border border-emerald-400/30 space-y-2.5">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  Sincronização em Tempo Real Ativa (Automática)
                </h4>
                <p className="text-xs text-neutral-200 leading-relaxed">
                  Tudo o que você editar, cadastrar ou apagar no seu computador é <strong>salvo imediatamente no servidor da loja</strong>. Todos os clientes que acessarem a loja pelo telemóvel ou por outro computador receberão as novidades <strong>na mesma hora, sem precisar baixar nenhum arquivo e sem complicações</strong>.
                </p>
                <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800 space-y-1.5">
                  <span className="text-xs font-bold text-white block">Como funciona para os telemóveis e outros computadores:</span>
                  <ul className="text-xs text-neutral-300 list-disc list-inside space-y-1 leading-relaxed">
                    <li>Ao salvar qualquer artigo aqui, o servidor atualiza o catálogo automaticamente.</li>
                    <li>Qualquer telemóvel com a loja aberta recebe o aviso e atualiza o ecrã instantaneamente.</li>
                    <li>Novos visitantes no telemóvel já abrem a loja com os produtos e preços mais recentes.</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-amber-400" />
                  Backup Opcional em Arquivo JSON ({products.length} produtos carregados)
                </h4>
                <p className="text-xs text-neutral-400">
                  (Opcional) Caso deseje guardar uma cópia de segurança no seu computador ou subir manualmente para um repositório:
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={handleExportJSON}
                    className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-2 transition shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Catálogo (catalog.json)
                  </button>

                  <button
                    onClick={handleExportConfigJSON}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center gap-2 border border-neutral-700 transition"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    Baixar Configurações (config.json)
                  </button>

                  <button
                    onClick={handleExportInitialProductsTS}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center gap-2 border border-amber-400/40 transition"
                    title="Baixa o arquivo src/data/initialProducts.ts atualizado para você substituir diretamente no seu repositório do GitHub"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    Baixar Código Fonte (initialProducts.ts)
                  </button>

                  <button
                    onClick={handleCopyJSONOnly}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center gap-2 border border-neutral-700 transition"
                  >
                    <Copy className="w-4 h-4 text-amber-400" />
                    Copiar Código JSON
                  </button>

                  {jsonExportSuccess && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Catálogo baixado!
                    </span>
                  )}
                  {configExportSuccess && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Configurações baixadas!
                    </span>
                  )}
                  {initialProductsExportSuccess && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> initialProducts.ts baixado com sucesso!
                    </span>
                  )}
                </div>

                {/* Dica para Repositório do GitHub */}
                <div className="mt-3 p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 text-[11px] text-neutral-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <Check className="w-3.5 h-3.5" />
                    Como o GitHub atualiza todos os outros aparelhos:
                  </div>
                  <p className="text-neutral-400 leading-relaxed">
                    Quando você edita qualquer produto neste painel, o sistema salva automaticamente no servidor e atualiza os arquivos internos. Ao subir para o seu GitHub (via git push ou upload), o seu repositório passa a ter esses dados gravados.
                    Qualquer telemóvel ou outro dispositivo que acessar a página do GitHub detectará a nova versão e carregará os produtos atualizados instantaneamente!
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-amber-400" />
                  Importar Catálogo (JSON)
                </h4>
                <p className="text-xs text-neutral-400">
                  Se você tiver um catálogo salvo anteriormente, pode importá-lo diretamente aqui para recarregar todos os itens.
                </p>
                <div>
                  <input
                    ref={jsonFileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportJSONFile}
                    className="hidden"
                  />
                  <button
                    onClick={() => jsonFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-2 border border-neutral-700 transition"
                  >
                    <Upload className="w-4 h-4" />
                    Selecionar Arquivo .JSON
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/60 space-y-3">
                <h4 className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Zerar e Limpar Todos os Produtos
                </h4>
                <p className="text-xs text-neutral-400">
                  Apaga todos os produtos antigos do site, deixando o catálogo completamente limpo para você cadastrar seus artigos do zero.
                </p>
                <button
                  onClick={() => {
                    if (confirm('Tem certeza absoluta de que deseja LIMPAR TODOS os produtos do site? O catálogo ficará 100% limpo para novos cadastros.')) {
                      if (onClearAllProducts) {
                        onClearAllProducts();
                      } else {
                        onResetToDefaults();
                      }
                      setActiveTab('products');
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar Todo o Catálogo (Zerar Site)
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: ACTIVITY LOG & SYNC DIAGNOSTICS */}
          {activeTab === 'logs' && (
            <ActivityLog
              logs={syncLogs}
              onClearLogs={onClearSyncLogs}
              onRefreshSync={async () => {
                if (onForceSync) await onForceSync();
              }}
              isServerSyncActive={isServerSyncActive}
              localVersion={catalogVersion}
              catalogCount={products.length}
            />
          )}
        </div>
      </div>
    </div>
  );
};
