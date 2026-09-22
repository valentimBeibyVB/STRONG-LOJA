export interface ProductColor {
  name: string;
  hex: string;
  image?: string; // Optional color-specific image
}

export interface CategoryItem {
  id: string; // unique slug e.g. "tshirts", "chapeus", "hoodies", "calcas"
  name: string; // display title e.g. "T-shirts & Oversized"
}

export type ProductCategory = 'todos' | string;

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  description: string;
  details?: string[];
  image: string;
  colors: ProductColor[];
  sizes: string[];
  inStock: boolean;
  badge?: string; // e.g. "Novo", "Destaque", "Limitado"
  isFeatured?: boolean; // Produto destacado na loja
  createdAt?: number;
}

export interface CartItem {
  id: string; // unique item entry (e.g. productId + '-' + color + '-' + size)
  productId: string;
  name: string;
  category: string;
  price: number;
  image: string;
  selectedColor: ProductColor;
  selectedSize: string;
  quantity: number;
}

export interface StoreConfig {
  storeName: string;
  tagline: string;
  whatsappNumber: string; // e.g. "244923456789" or "351912345678" or "5511999999999"
  countryCode: string;
  currencySymbol: string; // e.g. "Kz", "R$", "€", "$"
  currencyPosition: 'prefix' | 'suffix';
  welcomeMessage: string;
  instagramHandle?: string;
  address?: string;
  adminPassword?: string;
  featuredProductId?: string; // ID do produto em destaque principal
  featuredSubtitle?: string; // Título/badge customizado do destaque (ex: "Destaque da Coleção")
  logoUrl?: string; // URL ou path do logo oficial da marca
  categories?: CategoryItem[];
}

export interface CheckoutCustomerInfo {
  name: string;
  phone: string;
  city: string;
  notes: string;
  paymentMethod: string;
}

export type SyncEventType =
  | 'save_products'
  | 'delete_product'
  | 'save_config'
  | 'import_catalog'
  | 'fetch_catalog'
  | 'manual_sync'
  | 'reset_defaults'
  | 'purge_cache';

export interface SyncLogEntry {
  id: string;
  timestamp: number;
  type: SyncEventType;
  action: string;
  status: 'success' | 'warning' | 'error';
  source: 'server' | 'local_storage' | 'static_catalog';
  itemCount?: number;
  version?: number;
  details?: string;
  device?: string;
}
