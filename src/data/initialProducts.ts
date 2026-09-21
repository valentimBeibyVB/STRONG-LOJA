import { Product, StoreConfig, CategoryItem } from "../types";

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: "tshirts", name: "T-shirts & Oversized" },
  { id: "chapeus", name: "Chapéus & Bonés" },
  { id: "hoodies", name: "Moletom & Hoodies" }
];

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  storeName: "STRONG",
  tagline: "STREETWEAR & ESSENTIAL APPAREL",
  whatsappNumber: "244953488842",
  countryCode: "+244",
  currencySymbol: "Kz",
  currencyPosition: "suffix",
  welcomeMessage: "Olá Strong! Vim através da vossa loja online e gostaria de finalizar a seguinte encomenda:",
  instagramHandle: "@strong.brand",
  address: "Luanda, Angola | Entregas para todo o país",
  adminPassword: "admin",
  featuredProductId: "",
  featuredSubtitle: "Destaque da Coleção",
  categories: DEFAULT_CATEGORIES
};

// Catálogo limpo a pedido do utilizador para cadastro do zero
export const INITIAL_PRODUCTS: Product[] = [];
