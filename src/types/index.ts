export interface ProductColor {
  name: string;
  hex: string;
  image?: string; // Optional color-specific image
}

export type ProductCategory = 'tshirts' | 'chapeus' | 'hoodies' | 'todos';

export interface Product {
  id: string;
  name: string;
  category: 'tshirts' | 'chapeus' | 'hoodies';
  price: number;
  originalPrice?: number;
  description: string;
  details?: string[];
  image: string;
  colors: ProductColor[];
  sizes: string[];
  inStock: boolean;
  badge?: string; // e.g. "Novo", "Destaque", "Limitado"
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
}

export interface CheckoutCustomerInfo {
  name: string;
  phone: string;
  city: string;
  notes: string;
  paymentMethod: string;
}
