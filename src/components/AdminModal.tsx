import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { Product, ProductColor, StoreConfig } from '../types';
import { formatPrice } from '../utils/whatsapp';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onResetToDefaults: () => void;
  config: StoreConfig;
  onUpdateConfig: (newConfig: StoreConfig) => void;
  onImportProducts: (products: Product[]) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  products,
  onSaveProduct,
  onDeleteProduct,
  onResetToDefaults,
  config,
  onUpdateConfig,
  onImportProducts,
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

  const [activeTab, setActiveTab] = useState<'products' | 'new' | 'settings' | 'github'>('products');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form State for creating / editing product
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'tshirts' | 'chapeus' | 'hoodies'>('tshirts');
  const [formPrice, setFormPrice] = useState<number>(15000);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number | undefined>(undefined);
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formInStock, setFormInStock] = useState(true);

  // Colors list for the current product
  const [formColors, setFormColors] = useState<ProductColor[]>([
    { name: 'Preto', hex: '#121212' },
    { name: 'Branco', hex: '#ffffff' },
  ]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  // Sizes list
  const [formSizes, setFormSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [customSizeInput, setCustomSizeInput] = useState('');

  // Store Settings Form State
  const [settingsForm, setSettingsForm] = useState<StoreConfig>({ ...config });
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);
  const [jsonExportSuccess, setJsonExportSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Sync settings form when config changes
  useEffect(() => {
    setSettingsForm({ ...config });
  }, [config]);

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
    setFormColors(product.colors && product.colors.length > 0 ? [...product.colors] : [{ name: 'Preto', hex: '#000000' }]);
    setFormSizes(product.sizes && product.sizes.length > 0 ? [...product.sizes] : ['S', 'M', 'L', 'XL']);
    setActiveTab('new');
  };

  // Reset form to blank
  const handleResetForm = () => {
    setEditingProductId(null);
    setFormName('');
    setFormCategory('tshirts');
    setFormPrice(15000);
    setFormOriginalPrice(undefined);
    setFormDescription('');
    setFormImage('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80');
    setFormBadge('');
    setFormInStock(true);
    setFormColors([
      { name: 'Preto', hex: '#121212' },
      { name: 'Branco', hex: '#ffffff' },
    ]);
    setFormSizes(['S', 'M', 'L', 'XL']);
  };

  // Compress & read real image uploaded from local disk
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize canvas to keep reasonable localStorage footprint
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
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

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to webp/jpeg data url
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormImage(dataUrl);
        // Also update the colors without specific images or update the first color's image
        setFormColors((prevColors) =>
          prevColors.map((c, idx) => (idx === 0 || !c.image ? { ...c, image: dataUrl } : c))
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Add Color
  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    setFormColors([...formColors, { name: newColorName.trim(), hex: newColorHex }]);
    setNewColorName('');
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

    const productPayload: Product = {
      id: editingProductId || `strong-item-${Date.now()}`,
      name: formName.trim(),
      category: formCategory,
      price: Number(formPrice),
      originalPrice: formOriginalPrice ? Number(formOriginalPrice) : undefined,
      description: formDescription.trim() || 'Peça da coleção oficial da marca de vestuário Strong.',
      details: [
        'Produção autêntica Strong Apparel',
        'Acabamento e costuras de alta resistência',
        'Corte moderno e confortável'
      ],
      image: formImage.trim() || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
      colors: formColors,
      sizes: formSizes,
      inStock: formInStock,
      badge: formBadge.trim() || undefined,
    };

    onSaveProduct(productPayload);
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

    navigator.clipboard.writeText(JSON.stringify(products, null, 2));
    setJsonExportSuccess(true);
    setTimeout(() => setJsonExportSuccess(false), 3000);
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
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white tracking-wide font-['Cabinet_Grotesk',sans-serif]">
              Acesso Administrativo Restrito
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Área de gestão isolada da loja de compra. Introduza o código de segurança para aceder ao catálogo, preços e configurações.
            </p>
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
          <div className="w-8 h-8 rounded-lg bg-amber-400 text-neutral-950 flex items-center justify-center font-black text-sm shadow-sm">
            ADM
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
                <button
                  onClick={() => {
                    handleResetForm();
                    setActiveTab('new');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 self-start shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  Novo Produto
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {products.map((item) => (
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
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400">
                          {item.category === 'tshirts' ? 'T-Shirt' : item.category === 'chapeus' ? 'Chapéu/Boné' : 'Moletom'}
                        </span>
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
                          {item.colors.slice(0, 4).map((c, i) => (
                            <span
                              key={i}
                              className="w-3.5 h-3.5 rounded-full border border-black inline-block"
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-neutral-400">
                          {item.colors.length} {item.colors.length === 1 ? 'cor' : 'cores'}
                        </span>
                        <span className="text-neutral-600">•</span>
                        <span className="text-[10px] text-neutral-400 truncate">
                          {item.sizes.join(', ')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-2 text-neutral-400 hover:text-amber-400 bg-neutral-900 hover:bg-neutral-800 rounded-lg transition"
                        title="Editar Peça"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Tem a certeza que deseja eliminar "${item.name}"?`)) {
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                        Categoria:
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="tshirts">T-shirts & Oversized</option>
                        <option value="chapeus">Chapéus, Bucket & Bonés</option>
                        <option value="hoodies">Moletom & Hoodies</option>
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

                  {/* CORES DISPONÍVEIS (Key User Requirement) */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                      Cores Disponíveis para Escolha:
                    </label>
                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                      {/* Current colors pill list */}
                      <div className="flex flex-wrap gap-2">
                        {formColors.map((color, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-white"
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-black/40 shrink-0"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span>{color.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(index)}
                              className="text-neutral-500 hover:text-red-400 ml-1"
                              title="Remover cor"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add new color controls */}
                      <div className="flex items-center gap-2 pt-2 border-t border-neutral-800/80">
                        <input
                          type="color"
                          value={newColorHex}
                          onChange={(e) => setNewColorHex(e.target.value)}
                          className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                          title="Escolher tom"
                        />
                        <input
                          type="text"
                          placeholder="Nome da cor (ex: Bege, Preto Ônix...)"
                          value={newColorName}
                          onChange={(e) => setNewColorName(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={handleAddColor}
                          className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-amber-400 transition"
                        >
                          + Adicionar Cor
                        </button>
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

          {/* TAB 3: WHATSAPP & STORE SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl mx-auto">
              <div className="pb-3 border-b border-neutral-800">
                <h3 className="text-sm font-black text-white">Configuração do WhatsApp de Vendas</h3>
                <p className="text-xs text-neutral-400">
                  Para onde devem ser enviadas as mensagens quando o cliente clica em "Finalizar Compra no WhatsApp".
                </p>
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
                <h3 className="text-sm font-black text-white">Exportação e Sincronização com GitHub</h3>
                <p className="text-xs text-neutral-400">
                  Como você mencionou que vai utilizar o seu repositório no GitHub para armazenar e aceder a esta página web, 
                  você pode exportar o arquivo do catálogo aqui com 1 clique para manter os produtos atualizados.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/30 space-y-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" />
                  Como sincronizar alterações entre computadores e telemóveis (GitHub):
                </h4>
                <ol className="text-xs text-neutral-300 list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>Faça as alterações ou adicione fotos e produtos aqui no ADM.</li>
                  <li>Clique em <strong className="text-amber-400">"Baixar Catálogo (JSON)"</strong> abaixo.</li>
                  <li>Atualize o ficheiro correspondente no seu repositório GitHub para que todos os clientes e outros dispositivos vejam as novidades online.</li>
                  <li>Em qualquer outro aparelho onde aceder ao ADM, você também pode usar <strong className="text-white">"Importar Catálogo (JSON)"</strong> para carregar imediatamente.</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-amber-400" />
                  Exportar Catálogo em JSON
                </h4>
                <p className="text-xs text-neutral-400">
                  Baixe todos os produtos e imagens atuais como um ficheiro JSON ou copie diretamente para a área de transferência.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleExportJSON}
                    className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Catálogo (JSON)
                  </button>
                  {jsonExportSuccess && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Baixado e copiado!
                    </span>
                  )}
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

              <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 space-y-3">
                <h4 className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-red-400" />
                  Restaurar Catálogo Original de Fábrica
                </h4>
                <p className="text-xs text-neutral-400">
                  Restaura o catálogo padrão com as fotos autênticas da marca Strong (T-shirts oversized e chapéus/bonés).
                </p>
                <button
                  onClick={() => {
                    if (confirm('Tem certeza de que deseja restaurar o catálogo padrão da marca Strong? Todas as edições locais serão substituídas pelos produtos originais.')) {
                      onResetToDefaults();
                      setActiveTab('products');
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-100 font-bold text-xs transition"
                >
                  Restaurar Produtos Padrão
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
